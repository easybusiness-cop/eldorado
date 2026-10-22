import { isIP } from "node:net";
import {
  CodingExecutionError,
  type CodingEngineId,
  type CodingExecutionErrorCode,
  type CodingTaskRequest,
  type CodingTaskResult,
} from "./types.ts";
import { isSafeScopeId } from "./workspace-guard.ts";

export const DEFAULT_TASK_TIMEOUT_MS = 10 * 60 * 1000;
export const MAX_TASK_TIMEOUT_MS = 60 * 60 * 1000;
const CLEANUP_TIMEOUT_MS = 5_000;

export class RuntimeHttpError extends Error {
  constructor(readonly status: number, readonly statusText: string) {
    super(`Runtime request returned HTTP ${status}.`);
    this.name = "RuntimeHttpError";
  }
}

export interface TaskExecutionSignal {
  signal: AbortSignal;
  timedOut(): boolean;
  cancelled(): boolean;
  dispose(): void;
}

export function validateTask(task: CodingTaskRequest): void {
  if (!isSafeScopeId(task.organizationId) || !isSafeScopeId(task.taskId)) {
    throw new CodingExecutionError(
      "INVALID_TASK",
      "Task and organization identifiers must be safe single path segments.",
    );
  }
  if (typeof task.prompt !== "string" || !task.prompt.trim()) {
    throw new CodingExecutionError("INVALID_TASK", "A non-empty coding prompt is required.");
  }
  if (typeof task.workspacePath !== "string" || !task.workspacePath.trim()) {
    throw new CodingExecutionError("INVALID_TASK", "A dedicated task workspace is required.");
  }
  if (
    task.timeoutMs !== undefined &&
    (!Number.isFinite(task.timeoutMs) || task.timeoutMs < 1_000 || task.timeoutMs > MAX_TASK_TIMEOUT_MS)
  ) {
    throw new CodingExecutionError(
      "INVALID_TASK",
      `Task timeout must be between 1000 and ${MAX_TASK_TIMEOUT_MS} milliseconds.`,
    );
  }
}

export function createTaskExecutionSignal(task: CodingTaskRequest): TaskExecutionSignal {
  const controller = new AbortController();
  let deadlineExpired = false;
  let callerCancelled = false;
  const timeoutMs = task.timeoutMs ?? DEFAULT_TASK_TIMEOUT_MS;
  const timeout = setTimeout(() => {
    deadlineExpired = true;
    controller.abort(new Error("Coding task deadline elapsed."));
  }, timeoutMs);
  timeout.unref?.();

  const onAbort = () => {
    callerCancelled = true;
    controller.abort(task.signal?.reason ?? new Error("Coding task was cancelled."));
  };

  if (task.signal?.aborted) onAbort();
  else task.signal?.addEventListener("abort", onAbort, { once: true });

  return {
    signal: controller.signal,
    timedOut: () => deadlineExpired,
    cancelled: () => callerCancelled,
    dispose: () => {
      clearTimeout(timeout);
      task.signal?.removeEventListener("abort", onAbort);
    },
  };
}

export function createCleanupSignal(): AbortSignal {
  return AbortSignal.timeout(CLEANUP_TIMEOUT_MS);
}

export function makeTaskResult(
  task: CodingTaskRequest,
  engine: CodingEngineId,
  fields: Partial<Omit<CodingTaskResult, "organizationId" | "taskId" | "engine" | "verified">> = {},
): CodingTaskResult {
  const result: CodingTaskResult = {
    organizationId: task.organizationId,
    taskId: task.taskId,
    engine,
    sessionId: fields.sessionId ?? null,
    status: fields.status ?? "failed",
    summary: fields.summary ?? "The coding runtime did not return a completion summary.",
    changedFiles: fields.changedFiles ?? [],
    diff: fields.diff ?? "",
    verified: false,
    ...(fields.errorCode ? { errorCode: fields.errorCode } : {}),
    ...(fields.error ? { error: fields.error } : {}),
  };
  return {
    ...result,
    summary: redactConfiguredSecrets(result.summary),
    changedFiles: result.changedFiles.map(redactConfiguredSecrets),
    diff: redactConfiguredSecrets(result.diff),
    ...(result.error ? { error: redactConfiguredSecrets(result.error) } : {}),
  };
}

function redactConfiguredSecrets(value: string): string {
  const secrets = Object.entries(process.env)
    .filter(([name, secret]) =>
      secret && secret.length >= 6 && /(API_KEY|TOKEN|PASSWORD|SECRET|CREDENTIAL)/i.test(name),
    )
    .map(([, secret]) => secret as string)
    .sort((left, right) => right.length - left.length);

  return secrets.reduce((text, secret) => text.split(secret).join("[REDACTED]"), value);
}

export function normalizeRuntimeUrl(rawUrl: string, envName: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch (error) {
    throw new CodingExecutionError(
      "ENGINE_NOT_CONFIGURED",
      `${envName} must be a valid absolute HTTP(S) URL.`,
      { cause: error },
    );
  }

  if (!(["http:", "https:"].includes(url.protocol)) || url.username || url.password || url.search || url.hash) {
    throw new CodingExecutionError(
      "ENGINE_NOT_CONFIGURED",
      `${envName} must be an HTTP(S) endpoint without embedded credentials, query, or fragment.`,
    );
  }

  if (url.protocol === "http:" && !isPrivateHost(url.hostname)) {
    throw new CodingExecutionError(
      "ENGINE_NOT_CONFIGURED",
      `${envName} must use HTTPS unless it targets a private runtime host.`,
    );
  }

  return url;
}

export function normalizeBaseUrl(url: URL): string {
  return url.toString().replace(/\/$/, "");
}

export function runtimeFailureCode(error: unknown): CodingExecutionErrorCode {
  if (error instanceof CodingExecutionError) return error.code;
  if (error instanceof RuntimeHttpError && error.status === 401) return "ENGINE_AUTH_FAILED";
  if (error instanceof RuntimeHttpError && error.status === 403) return "ENGINE_AUTH_FAILED";
  if (error instanceof RuntimeHttpError) return "RUNTIME_REQUEST_FAILED";
  return "RUNTIME_PROTOCOL_ERROR";
}

export function safeRuntimeError(error: unknown): string {
  if (error instanceof CodingExecutionError) return error.message;
  if (error instanceof RuntimeHttpError) {
    if (error.status === 401 || error.status === 403) return "Runtime authentication failed.";
    return `Coding runtime request failed with HTTP ${error.status}.`;
  }
  if (isAbortError(error)) return "The coding runtime request was interrupted.";
  return "The coding runtime returned an unexpected response.";
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function fetchJson<T>(
  baseUrl: string,
  route: string,
  options: {
    method?: "GET" | "POST" | "DELETE";
    apiKeyHeader?: { name: string; value: string };
    headers?: Record<string, string>;
    body?: unknown;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json", ...options.headers };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.apiKeyHeader) headers[options.apiKeyHeader.name] = options.apiKeyHeader.value;

  const response = await fetch(new URL(route.replace(/^\//, ""), `${baseUrl}/`), {
    method: options.method ?? "GET",
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    ...(options.signal ? { signal: options.signal } : {}),
    redirect: "error",
  });

  if (!response.ok) throw new RuntimeHttpError(response.status, response.statusText);
  if (response.status === 204) return undefined as T;

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new CodingExecutionError(
      "RUNTIME_PROTOCOL_ERROR",
      "Coding runtime returned malformed JSON.",
      { cause: error },
    );
  }
}

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".test") || host === "host.docker.internal") {
    return true;
  }

  const ipVersion = isIP(host);
  if (ipVersion === 4) {
    const octets = host.split(".").map(Number);
    return (
      octets[0] === 10 ||
      octets[0] === 127 ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168) ||
      (octets[0] === 169 && octets[1] === 254)
    );
  }
  if (ipVersion === 6) {
    return host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:");
  }

  // Single-label names are resolved by private service discovery in typical
  // container networks (for example, `openhands-agent` in a compose network).
  return !host.includes(".");
}
