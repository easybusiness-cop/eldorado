import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createTwoFilesPatch } from "diff";
import { createOpencodeClient } from "@opencode-ai/sdk";
import {
  CodingExecutionError,
  type CodingEngineAdapter,
  type CodingEngineHealth,
  type CodingTaskRequest,
  type CodingTaskResult,
} from "./types.ts";
import {
  createCleanupSignal,
  createTaskExecutionSignal,
  makeTaskResult,
  runtimeFailureCode,
  safeRuntimeError,
  validateTask,
} from "./runtime-utils.ts";
import { assertLocalWorkspaceReady, assertTaskWorkspaceScope } from "./workspace-guard.ts";

const execFileAsync = promisify(execFile);
const TASK_CONTAINER_READY_TIMEOUT_MS = 45_000;
const TASK_CONTAINER_STOP_TIMEOUT_MS = 15_000;
export interface OpenCodeAdapterConfig {
  workspaceRoot: string;
  workspaceIsolation: string;
  containerImage: string;
  dockerNetwork: string;
  model?: string;
  providerApiKey?: string;
  memoryLimit?: string;
  cpuLimit?: number;
  pidsLimit?: number;
}

interface OpenCodeContainer {
  id: string;
  serverUrl: string;
  password: string;
  workspacePath: string;
}

/**
 * Runs one disposable OpenCode server container for each coding task.
 * The container receives exactly one task workspace and no Docker socket.
 */
export class OpenCodeCodingAdapter implements CodingEngineAdapter {
  readonly engine = "opencode" as const;

  constructor(private readonly config: OpenCodeAdapterConfig) {
    if (!config.workspaceRoot.trim()) {
      throw new CodingExecutionError("ENGINE_NOT_CONFIGURED", "OpenCode requires a dedicated workspace root.");
    }
    if (config.workspaceIsolation !== "per-task-container") {
      throw new CodingExecutionError(
        "ENGINE_NOT_CONFIGURED",
        "OpenCode requires OPENCODE_WORKSPACE_ISOLATION=per-task-container.",
      );
    }
    if (!config.containerImage.trim()) {
      throw new CodingExecutionError("ENGINE_NOT_CONFIGURED", "OpenCode requires a pinned worker container image.");
    }
    if (!isPrivateDockerNetwork(config.dockerNetwork)) {
      throw new CodingExecutionError(
        "ENGINE_NOT_CONFIGURED",
        "OpenCode requires a named, non-host Docker network with operator-managed egress restrictions.",
      );
    }
  }

  async health(): Promise<CodingEngineHealth> {
    try {
      await execFileAsync("docker", ["image", "inspect", this.config.containerImage, "--format", "{{.Id}}"], {
        windowsHide: true,
        timeout: 10_000,
        maxBuffer: 64 * 1024,
      });
      await execFileAsync("docker", ["network", "inspect", this.config.dockerNetwork, "--format", "{{.Name}}"], {
        windowsHide: true,
        timeout: 10_000,
        maxBuffer: 64 * 1024,
      });
      return {
        engine: this.engine,
        configured: true,
        available: true,
        version: "1.19.4",
        detail: "Pinned OpenCode worker image and private Docker network are available.",
      };
    } catch {
      return {
        engine: this.engine,
        configured: true,
        available: false,
        detail: "OpenCode worker image or its private Docker network is unavailable.",
      };
    }
  }

  async execute(task: CodingTaskRequest): Promise<CodingTaskResult> {
    let sessionId: string | null = null;
    let directory: string | undefined;
    let activeSignal: ReturnType<typeof createTaskExecutionSignal> | undefined;
    let client: ReturnType<typeof createOpencodeClient> | undefined;
    let runtime: OpenCodeContainer | undefined;

    try {
      validateTask(task);
      directory = assertTaskWorkspaceScope({
        workspacePath: task.workspacePath,
        workspaceRoot: this.config.workspaceRoot,
        organizationId: task.organizationId,
        taskId: task.taskId,
        flavor: "native",
      });
      directory = await assertLocalWorkspaceReady(directory, this.config.workspaceRoot);
      activeSignal = createTaskExecutionSignal(task);
      if (activeSignal.signal.aborted) {
        return makeTaskResult(task, this.engine, {
          status: activeSignal.timedOut() ? "timed_out" : "cancelled",
          summary: "The task ended before OpenCode was started.",
          errorCode: activeSignal.timedOut() ? "ENGINE_TIMEOUT" : "ENGINE_CANCELLED",
          error: activeSignal.timedOut() ? "The task deadline elapsed." : "The task was cancelled.",
        });
      }

      runtime = await this.startTaskContainer(task, directory, activeSignal.signal);
      client = this.createClient(runtime);
      await this.waitForReady(runtime, activeSignal.signal);

      const created = await client.session.create({
        query: { directory: "/workspace" },
        body: { title: task.title?.trim() || `Rufflo task ${task.taskId}` },
        signal: activeSignal.signal,
        throwOnError: true,
      });
      sessionId = created.data.id;
      if (!sessionId) {
        throw new CodingExecutionError("RUNTIME_PROTOCOL_ERROR", "OpenCode did not return a session ID.");
      }

      const modelValue = task.model?.trim() || this.config.model?.trim();
      const model = modelValue ? parseOpenCodeModel(modelValue) : undefined;
      const response = await client.session.prompt({
        path: { id: sessionId },
        query: { directory: "/workspace" },
        body: {
          parts: [{ type: "text", text: task.prompt }],
          ...(model ? { model } : {}),
          ...(task.agent ? { agent: task.agent } : {}),
        },
        signal: activeSignal.signal,
        throwOnError: true,
      });

      const assistant = response.data.info;
      if (assistant.role !== "assistant" || assistant.sessionID !== sessionId || assistant.error) {
        throw new CodingExecutionError("ENGINE_REPORTED_FAILURE", "OpenCode did not return a successful assistant completion.");
      }
      if (typeof assistant.time.completed !== "number") {
        throw new CodingExecutionError("RUNTIME_PROTOCOL_ERROR", "OpenCode response did not include a completion timestamp.");
      }

      const artifacts = await this.collectDiff(client, sessionId, activeSignal.signal);
      const summary = response.data.parts
        .map((part) => "text" in part && typeof part.text === "string" ? part.text : "")
        .filter(Boolean)
        .join("\n")
        .trim()
        .slice(0, 8_000);

      return makeTaskResult(task, this.engine, {
        sessionId,
        status: "completed",
        summary: summary || "OpenCode finished the run.",
        changedFiles: artifacts.changedFiles,
        diff: artifacts.diff,
      });
    } catch (error) {
      if (activeSignal?.timedOut() || activeSignal?.cancelled()) {
        if (client && sessionId && runtime) await this.abortSession(client, sessionId);
        const partial = client && sessionId && runtime
          ? await this.collectDiff(client, sessionId, createCleanupSignal())
          : { changedFiles: [], diff: "" };
        const timedOut = activeSignal.timedOut();
        return makeTaskResult(task, this.engine, {
          sessionId,
          status: timedOut ? "timed_out" : "cancelled",
          summary: timedOut
            ? "OpenCode was interrupted after the task deadline elapsed."
            : "OpenCode was interrupted after the task was cancelled.",
          changedFiles: partial.changedFiles,
          diff: partial.diff,
          errorCode: timedOut ? "ENGINE_TIMEOUT" : "ENGINE_CANCELLED",
          error: timedOut ? "The task deadline elapsed." : "The task was cancelled.",
        });
      }

      return makeTaskResult(task, this.engine, {
        sessionId,
        status: "failed",
        summary: "OpenCode could not complete the coding task.",
        errorCode: runtimeFailureCode(error),
        error: safeRuntimeError(error),
      });
    } finally {
      activeSignal?.dispose();
      if (runtime) await this.removeTaskContainer(runtime.id);
    }
  }

  private async startTaskContainer(
    task: CodingTaskRequest,
    workspacePath: string,
    signal: AbortSignal,
  ): Promise<OpenCodeContainer> {
    const id = `rufflo-opencode-${randomUUID()}`;
    const password = randomUUID() + randomUUID();
    const model = task.model?.trim() || this.config.model?.trim();
    if (!model) {
      throw new CodingExecutionError("ENGINE_NOT_CONFIGURED", "OpenCode requires a configured provider/model.");
    }
    parseOpenCodeModel(model);

    const runtimeConfig = JSON.stringify({
      $schema: "https://opencode.ai/config.json",
      model,
      autoupdate: false,
      share: "disabled",
      ...(this.config.providerApiKey
        ? {
            provider: {
              [parseOpenCodeModel(model).providerID]: {
                options: { apiKey: "{env:OPENCODE_PROVIDER_API_KEY}" },
              },
            },
          }
        : {}),
      permission: {
        "*": "allow",
        external_directory: "deny",
        webfetch: "deny",
        websearch: "deny",
        read: {
          "*": "allow",
          "*.env": "deny",
          "*.env.*": "deny",
          "*.env.example": "allow",
        },
      },
    });

    const args = [
      "run", "--detach", "--rm", "--name", id,
      "--network", this.config.dockerNetwork,
      "--publish", "127.0.0.1::4096",
      "--cap-drop", "ALL",
      "--security-opt", "no-new-privileges:true",
      "--read-only",
      "--pids-limit", String(this.config.pidsLimit ?? 256),
      "--memory", this.config.memoryLimit ?? "4g",
      "--cpus", String(this.config.cpuLimit ?? 2),
      "--label", "ai.rufflo.owner=coding-task",
      "--label", `ai.rufflo.task=${task.taskId}`,
      "--tmpfs", "/tmp:rw,nosuid,nodev,size=512m",
      "--tmpfs", "/home/node/.cache:rw,nosuid,nodev,size=1g,uid=1000,gid=1000",
      "--tmpfs", "/home/node/.config:rw,nosuid,nodev,size=128m,uid=1000,gid=1000",
      "--tmpfs", "/home/node/.local/share:rw,nosuid,nodev,size=512m,uid=1000,gid=1000",
      "--mount", `type=bind,source=${workspacePath},target=/workspace`,
      "--workdir", "/workspace",
      "--env", "OPENCODE_SERVER_PASSWORD",
      "--env", "OPENCODE_CONFIG_CONTENT",
    ];
    if (this.config.providerApiKey) args.push("--env", "OPENCODE_PROVIDER_API_KEY");
    args.push(this.config.containerImage);

    try {
      const childEnvironment: NodeJS.ProcessEnv = {
        ...process.env,
        OPENCODE_SERVER_PASSWORD: password,
        OPENCODE_CONFIG_CONTENT: runtimeConfig,
      };
      if (this.config.providerApiKey) childEnvironment.OPENCODE_PROVIDER_API_KEY = this.config.providerApiKey;
      const create = await execFileAsync("docker", args, {
        windowsHide: true,
        timeout: 60_000,
        maxBuffer: 256 * 1024,
        signal,
        env: childEnvironment,
      });
      const containerId = create.stdout.trim() || id;
      const published = await execFileAsync("docker", ["port", containerId, "4096/tcp"], {
        windowsHide: true,
        timeout: 10_000,
        maxBuffer: 16 * 1024,
        signal,
      });
      const match = published.stdout.match(/127\.0\.0\.1:(\d+)/);
      if (!match) {
        throw new CodingExecutionError("RUNTIME_PROTOCOL_ERROR", "Docker did not publish OpenCode on loopback.");
      }
      return {
        id: containerId,
        serverUrl: `http://127.0.0.1:${match[1]}`,
        password,
        workspacePath,
      };
    } catch (error) {
      await this.removeTaskContainer(id);
      if (signal.aborted) throw error;
      throw new CodingExecutionError(
        "ENGINE_UNAVAILABLE",
        "Could not start the isolated OpenCode task container. Check Docker availability, the worker image, and the configured egress-controlled network.",
        { cause: error },
      );
    }
  }

  private createClient(runtime: OpenCodeContainer) {
    const authorization = `Basic ${Buffer.from(`opencode:${runtime.password}`, "utf8").toString("base64")}`;
    return createOpencodeClient({
      baseUrl: runtime.serverUrl,
      directory: "/workspace",
      headers: { Authorization: authorization },
      throwOnError: true,
    });
  }

  private async waitForReady(
    runtime: OpenCodeContainer,
    signal: AbortSignal,
  ): Promise<void> {
    const authorization = `Basic ${Buffer.from(`opencode:${runtime.password}`, "utf8").toString("base64")}`;
    const deadline = Date.now() + TASK_CONTAINER_READY_TIMEOUT_MS;
    while (Date.now() < deadline) {
      if (signal.aborted) throw signal.reason ?? new Error("Aborted");
      try {
        const response = await fetch(`${runtime.serverUrl}/global/health`, {
          signal: AbortSignal.any([signal, AbortSignal.timeout(2_000)]),
          headers: { Authorization: authorization, Accept: "application/json" },
        });
        if (response.ok) {
          const body: unknown = await response.json();
          if (typeof body === "object" && body !== null && !Array.isArray(body) && (body as Record<string, unknown>).healthy === true) {
            return;
          }
        }
      } catch {
        await delay(500, signal);
      }
    }
    throw new CodingExecutionError("ENGINE_TIMEOUT", "The isolated OpenCode container did not become ready in time.");
  }

  private async collectDiff(
    client: ReturnType<typeof createOpencodeClient>,
    sessionId: string,
    signal: AbortSignal,
  ): Promise<{ changedFiles: string[]; diff: string }> {
    const diffs = await client.session.diff({
      path: { id: sessionId },
      query: { directory: "/workspace" },
      signal,
      throwOnError: true,
    });
    return {
      changedFiles: [...new Set(diffs.data.map((item) => item.file))],
      diff: diffs.data
        .map((item) => createTwoFilesPatch(item.file, item.file, item.before, item.after, "", ""))
        .join("\n"),
    };
  }

  private async abortSession(
    client: ReturnType<typeof createOpencodeClient>,
    sessionId: string,
  ): Promise<void> {
    try {
      await client.session.abort({
        path: { id: sessionId },
        query: { directory: "/workspace" },
        signal: createCleanupSignal(),
        throwOnError: true,
      });
    } catch {
      // The enclosing task-container removal still terminates all worker processes.
    }
  }

  private async removeTaskContainer(containerId: string): Promise<void> {
    try {
      await execFileAsync("docker", ["rm", "--force", containerId], {
        windowsHide: true,
        timeout: TASK_CONTAINER_STOP_TIMEOUT_MS,
        maxBuffer: 64 * 1024,
      });
    } catch {
      // Container cleanup is best-effort; its owner label supports external TTL cleanup.
    }
  }
}

export function createOpenCodeAdapterFromEnv(env: NodeJS.ProcessEnv = process.env): OpenCodeCodingAdapter | null {
  const workspaceRoot = env.OPENCODE_WORKSPACE_ROOT?.trim();
  const isolation = env.OPENCODE_WORKSPACE_ISOLATION?.trim();
  const image = env.OPENCODE_WORKER_IMAGE?.trim();
  const dockerNetwork = env.OPENCODE_DOCKER_NETWORK?.trim();
  if (!workspaceRoot && !isolation && !image && !dockerNetwork) return null;
  if (!workspaceRoot || !isolation || !image || !dockerNetwork) {
    throw new CodingExecutionError(
      "ENGINE_NOT_CONFIGURED",
      "OpenCode requires OPENCODE_WORKSPACE_ROOT, OPENCODE_WORKSPACE_ISOLATION, OPENCODE_WORKER_IMAGE, and OPENCODE_DOCKER_NETWORK.",
    );
  }

  return new OpenCodeCodingAdapter({
    workspaceRoot,
    workspaceIsolation: isolation,
    containerImage: image,
    dockerNetwork,
    model: env.OPENCODE_MODEL?.trim() || env.OPENHANDS_MODEL?.trim() || undefined,
    providerApiKey:
      env.OPENCODE_PROVIDER_API_KEY?.trim() ||
      env.OPENHANDS_LLM_API_KEY?.trim() ||
      env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
      env.GEMINI_API_KEY?.trim() ||
      undefined,
    memoryLimit: env.OPENCODE_CONTAINER_MEMORY?.trim() || undefined,
    cpuLimit: parsePositiveNumber(env.OPENCODE_CONTAINER_CPUS, 2),
    pidsLimit: parsePositiveNumber(env.OPENCODE_CONTAINER_PIDS_LIMIT, 256),
  });
}

function parseOpenCodeModel(value: string): { providerID: string; modelID: string } {
  const separator = value.indexOf("/");
  if (separator < 1 || separator === value.length - 1) {
    throw new CodingExecutionError("INVALID_TASK", "OpenCode model must use the provider/model format.");
  }
  return { providerID: value.slice(0, separator), modelID: value.slice(separator + 1) };
}

function parsePositiveNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isPrivateDockerNetwork(network: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,62}$/.test(network) && !["host", "bridge", "none"].includes(network);
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason ?? new Error("Aborted"));
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, ms);
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason ?? new Error("Aborted"));
    };
    signal.addEventListener("abort", abort, { once: true });
  });
}
