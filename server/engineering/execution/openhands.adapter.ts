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
  fetchJson,
  isRecord,
  makeTaskResult,
  normalizeBaseUrl,
  normalizeRuntimeUrl,
  runtimeFailureCode,
  safeRuntimeError,
  validateTask,
} from "./runtime-utils.ts";
import { assertTaskWorkspaceScope } from "./workspace-guard.ts";
import path from "node:path";

type OpenHandsExecutionStatus =
  | "idle"
  | "running"
  | "paused"
  | "waiting_for_confirmation"
  | "finished"
  | "error"
  | "stuck"
  | "deleting";

interface OpenHandsConversation {
  id: string;
  execution_status?: OpenHandsExecutionStatus;
  agent_status?: OpenHandsExecutionStatus;
}

interface OpenHandsServerInfo {
  version?: string;
  sdk_version?: string;
  conversation_runtime?: "local" | "docker";
}

interface OpenHandsGitChange {
  path?: string;
}

interface OpenHandsGitDiff {
  diff?: string;
}

interface OpenHandsFinalResponse {
  response?: string;
}

export interface OpenHandsAdapterConfig {
  baseUrl: string;
  sessionApiKey: string;
  workspaceRoot: string;
  workspaceIsolation: string;
  model?: string;
  llmApiKey?: string;
  llmBaseUrl?: string;
  maxIterations?: number;
}

/** Adapter for OpenHands Agent Server REST API. */
export class OpenHandsCodingAdapter implements CodingEngineAdapter {
  readonly engine = "openhands" as const;
  private readonly baseUrl: string;

  constructor(private readonly config: OpenHandsAdapterConfig) {
    this.baseUrl = normalizeBaseUrl(normalizeRuntimeUrl(config.baseUrl, "OPENHANDS_AGENT_SERVER_URL"));
    if (!config.sessionApiKey.trim()) {
      throw new CodingExecutionError("ENGINE_NOT_CONFIGURED", "OpenHands requires a session API key.");
    }
    if (!config.workspaceRoot.trim()) {
      throw new CodingExecutionError("ENGINE_NOT_CONFIGURED", "OpenHands requires a dedicated workspace root.");
    }
    if (config.workspaceIsolation !== "per-task-container") {
      throw new CodingExecutionError(
        "ENGINE_NOT_CONFIGURED",
        "OpenHands requires OPENHANDS_WORKSPACE_ISOLATION=per-task-container.",
      );
    }
  }

  async health(): Promise<CodingEngineHealth> {
    try {
      const info = await fetchJson<OpenHandsServerInfo>(this.baseUrl, "/server_info", {
        apiKeyHeader: this.apiKeyHeader,
        signal: AbortSignal.timeout(5_000),
      });
      if (info.conversation_runtime !== "docker") {
        return {
          engine: this.engine,
          configured: true,
          available: false,
          ...(typeof info.version === "string" ? { version: info.version } : {}),
          detail: "OpenHands Agent Server is reachable but is not using its per-conversation Docker runtime.",
        };
      }
      return {
        engine: this.engine,
        configured: true,
        available: true,
        ...(typeof info.version === "string" ? { version: info.version } : {}),
        detail: "Authenticated OpenHands Agent Server with per-conversation Docker isolation is reachable.",
      };
    } catch (error) {
      return {
        engine: this.engine,
        configured: true,
        available: false,
        detail: safeRuntimeError(error),
      };
    }
  }

  async execute(task: CodingTaskRequest): Promise<CodingTaskResult> {
    let conversationId: string | null = null;
    let activeSignal: ReturnType<typeof createTaskExecutionSignal> | undefined;

    try {
      validateTask(task);
      const runtimeHealth = await this.health();
      if (!runtimeHealth.available) {
        throw new CodingExecutionError(
          "ENGINE_UNAVAILABLE",
          runtimeHealth.detail || "OpenHands Agent Server is not using an available isolated Docker runtime.",
        );
      }
      const remoteWorkspacePath = assertTaskWorkspaceScope({
        workspacePath: task.runtimeWorkspacePath ?? task.workspacePath,
        workspaceRoot: this.config.workspaceRoot,
        organizationId: task.organizationId,
        taskId: task.taskId,
        flavor: path.win32.isAbsolute(this.config.workspaceRoot) ? "win32" : "posix",
      });
      activeSignal = createTaskExecutionSignal(task);
      if (activeSignal.signal.aborted) {
        return makeTaskResult(task, this.engine, {
          status: activeSignal.timedOut() ? "timed_out" : "cancelled",
          summary: "The task ended before OpenHands was started.",
          errorCode: activeSignal.timedOut() ? "ENGINE_TIMEOUT" : "ENGINE_CANCELLED",
          error: activeSignal.timedOut() ? "The task deadline elapsed." : "The task was cancelled.",
        });
      }

      const model = task.model?.trim() || this.config.model?.trim();
      if (!model) {
        throw new CodingExecutionError("ENGINE_NOT_CONFIGURED", "OpenHands requires a configured model.");
      }

      const created = await fetchJson<OpenHandsConversation>(this.baseUrl, "/api/conversations", {
        method: "POST",
        apiKeyHeader: this.apiKeyHeader,
        signal: activeSignal.signal,
        body: {
          agent: {
            kind: "Agent",
            llm: {
              model,
              ...(this.config.llmApiKey ? { api_key: this.config.llmApiKey } : {}),
              ...(this.config.llmBaseUrl ? { base_url: this.config.llmBaseUrl } : {}),
            },
          },
          initial_message: {
            content: [{ text: task.prompt }],
            run: true,
          },
          max_iterations: this.config.maxIterations ?? 100,
          stuck_detection: true,
          workspace: { kind: "LocalWorkspace", working_dir: remoteWorkspacePath },
        },
      });

      if (!created || typeof created.id !== "string" || created.id.length === 0) {
        throw new CodingExecutionError("RUNTIME_PROTOCOL_ERROR", "OpenHands did not return a conversation ID.");
      }
      conversationId = created.id;

      const conversation = await this.waitForTerminalState(conversationId, activeSignal.signal);
      if (conversation.execution_status !== "finished" && conversation.agent_status !== "finished") {
        const executionStatus = conversation.execution_status ?? conversation.agent_status;
        return await this.resultForNonSuccessState(task, conversationId, remoteWorkspacePath, executionStatus);
      }

      return await this.collectResult(task, conversationId, remoteWorkspacePath, "completed");
    } catch (error) {
      if (activeSignal?.timedOut() || activeSignal?.cancelled()) {
        if (conversationId) await this.pauseConversation(conversationId);
        const partial = conversationId
          ? await this.collectPartialArtifacts(
              task,
              conversationId,
              task.runtimeWorkspacePath ?? task.workspacePath,
            )
          : { changedFiles: [], diff: "" };
        const timedOut = activeSignal.timedOut();
        return makeTaskResult(task, this.engine, {
          sessionId: conversationId,
          status: timedOut ? "timed_out" : "cancelled",
          summary: timedOut
            ? "OpenHands was paused after the task deadline elapsed."
            : "OpenHands was paused after the task was cancelled.",
          changedFiles: partial.changedFiles,
          diff: partial.diff,
          errorCode: timedOut ? "ENGINE_TIMEOUT" : "ENGINE_CANCELLED",
          error: timedOut ? "The task deadline elapsed." : "The task was cancelled.",
        });
      }

      const errorCode = runtimeFailureCode(error);
      return makeTaskResult(task, this.engine, {
        sessionId: conversationId,
        status: "failed",
        summary: "OpenHands could not complete the coding task.",
        errorCode,
        error: safeRuntimeError(error),
      });
    } finally {
      activeSignal?.dispose();
      if (conversationId) await this.deleteConversation(conversationId);
    }
  }

  private get apiKeyHeader() {
    return { name: "X-Session-API-Key", value: this.config.sessionApiKey };
  }

  private async waitForTerminalState(
    conversationId: string,
    signal: AbortSignal,
  ): Promise<OpenHandsConversation> {
    let idleCount = 0;
    while (true) {
      const conversation = await fetchJson<OpenHandsConversation>(
        this.baseUrl,
        `/api/conversations/${encodeURIComponent(conversationId)}`,
        { apiKeyHeader: this.apiKeyHeader, signal },
      );
      if (!conversation || typeof conversation.id !== "string") {
        throw new CodingExecutionError("RUNTIME_PROTOCOL_ERROR", "OpenHands returned invalid conversation status.");
      }
      const status = conversation.execution_status ?? conversation.agent_status;
      if (status === "finished" || status === "error" || status === "stuck" || status === "paused" || status === "waiting_for_confirmation") {
        return conversation;
      }
      if (status === "idle") {
        idleCount += 1;
        if (idleCount >= 3) return conversation;
      } else {
        idleCount = 0;
      }
      await delay(1_000, signal);
    }
  }

  private async resultForNonSuccessState(
    task: CodingTaskRequest,
    conversationId: string,
    workspacePath: string,
    status?: OpenHandsExecutionStatus,
  ): Promise<CodingTaskResult> {
    const artifacts = await this.collectPartialArtifacts(task, conversationId, workspacePath);
    const waiting = status === "waiting_for_confirmation";
    return makeTaskResult(task, this.engine, {
      sessionId: conversationId,
      status: "failed",
      summary: waiting
        ? "OpenHands is waiting for an approval and did not complete the task."
        : `OpenHands stopped with execution status ${status ?? "unknown"}.`,
      changedFiles: artifacts.changedFiles,
      diff: artifacts.diff,
      errorCode: "ENGINE_REPORTED_FAILURE",
      error: waiting ? "The runtime requires an approval before it can continue." : "OpenHands did not report a finished state.",
    });
  }

  private async collectResult(
    task: CodingTaskRequest,
    conversationId: string,
    workspacePath: string,
    status: "completed",
  ): Promise<CodingTaskResult> {
    const artifacts = await this.collectPartialArtifacts(task, conversationId, workspacePath);
    let summary = "OpenHands finished the run.";
    try {
      const finalResponse = await fetchJson<OpenHandsFinalResponse>(
        this.baseUrl,
        `/api/conversations/${encodeURIComponent(conversationId)}/agent_final_response`,
        { apiKeyHeader: this.apiKeyHeader, signal: AbortSignal.timeout(10_000) },
      );
      if (typeof finalResponse.response === "string" && finalResponse.response.trim()) {
        summary = finalResponse.response.trim().slice(0, 8_000);
      }
    } catch {
      // A summary is useful, but the conversation's terminal status and diff
      // are the artifact contract; the final-response convenience endpoint is
      // allowed to be unavailable on older Agent Server builds.
    }

    return makeTaskResult(task, this.engine, {
      sessionId: conversationId,
      status,
      summary,
      changedFiles: artifacts.changedFiles,
      diff: artifacts.diff,
    });
  }

  private async collectPartialArtifacts(
    _task: CodingTaskRequest,
    _conversationId: string,
    workspacePath: string,
  ): Promise<{ changedFiles: string[]; diff: string }> {
    const signal = createCleanupSignal();
    try {
      const pathParam = `path=${encodeURIComponent(workspacePath)}&ref=HEAD`;
      const [changes, gitDiff] = await Promise.all([
        fetchJson<OpenHandsGitChange[]>(this.baseUrl, `/api/git/changes?${pathParam}`, {
          apiKeyHeader: this.apiKeyHeader,
          signal,
        }),
        fetchJson<OpenHandsGitDiff>(this.baseUrl, `/api/git/diff?${pathParam}`, {
          apiKeyHeader: this.apiKeyHeader,
          signal,
        }),
      ]);
      return {
        changedFiles: Array.isArray(changes)
          ? [...new Set(changes.map((change) => change.path).filter((file): file is string => typeof file === "string"))]
          : [],
        diff: isRecord(gitDiff) && typeof gitDiff.diff === "string" ? gitDiff.diff : "",
      };
    } catch {
      return { changedFiles: [], diff: "" };
    }
  }

  private async pauseConversation(conversationId: string): Promise<void> {
    try {
      await fetchJson<unknown>(
        this.baseUrl,
        `/api/conversations/${encodeURIComponent(conversationId)}/pause`,
        {
          method: "POST",
          apiKeyHeader: this.apiKeyHeader,
          signal: createCleanupSignal(),
        },
      );
    } catch {
      // Keep cleanup best-effort and avoid returning server details that may
      // contain request or credential metadata.
    }
  }

  private async deleteConversation(conversationId: string): Promise<void> {
    try {
      await fetchJson<unknown>(
        this.baseUrl,
        `/api/conversations/${encodeURIComponent(conversationId)}`,
        {
          method: "DELETE",
          apiKeyHeader: this.apiKeyHeader,
          signal: createCleanupSignal(),
        },
      );
    } catch {
      // Keep returning the collected patch; the server's retention policy is
      // the fallback if deletion fails.
    }
  }
}

export function createOpenHandsAdapterFromEnv(env: NodeJS.ProcessEnv = process.env): OpenHandsCodingAdapter | null {
  const baseUrl = env.OPENHANDS_AGENT_SERVER_URL?.trim();
  const sessionApiKey = env.OPENHANDS_SESSION_API_KEY?.trim();
  const workspaceRoot = env.OPENHANDS_WORKSPACE_ROOT?.trim();
  const workspaceIsolation = env.OPENHANDS_WORKSPACE_ISOLATION?.trim();
  if (!baseUrl && !sessionApiKey && !workspaceRoot && !workspaceIsolation) return null;
  if (!baseUrl || !sessionApiKey || !workspaceRoot || !workspaceIsolation) {
    throw new CodingExecutionError(
      "ENGINE_NOT_CONFIGURED",
      "OpenHands requires OPENHANDS_AGENT_SERVER_URL, OPENHANDS_SESSION_API_KEY, OPENHANDS_WORKSPACE_ROOT, and OPENHANDS_WORKSPACE_ISOLATION.",
    );
  }

  return new OpenHandsCodingAdapter({
    baseUrl,
    sessionApiKey,
    workspaceRoot,
    workspaceIsolation,
    model: env.OPENHANDS_MODEL?.trim() || undefined,
    llmApiKey: env.OPENHANDS_LLM_API_KEY || env.GEMINI_API_KEY || undefined,
    llmBaseUrl: env.OPENHANDS_LLM_BASE_URL?.trim() || undefined,
    maxIterations: parsePositiveInt(env.OPENHANDS_MAX_ITERATIONS, 100),
  });
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 500) : fallback;
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
