export type CodingEngineId = "openhands" | "opencode";

export type CodingExecutionStatus =
  | "completed"
  | "failed"
  | "timed_out"
  | "cancelled";

export type CodingExecutionErrorCode =
  | "INVALID_TASK"
  | "ENGINE_NOT_CONFIGURED"
  | "ENGINE_UNAVAILABLE"
  | "ENGINE_AUTH_FAILED"
  | "RUNTIME_REQUEST_FAILED"
  | "RUNTIME_PROTOCOL_ERROR"
  | "ENGINE_REPORTED_FAILURE"
  | "WORKSPACE_OUT_OF_SCOPE"
  | "WORKSPACE_NOT_READY"
  | "WORKSPACE_BUSY"
  | "ENGINE_TIMEOUT"
  | "ENGINE_CANCELLED";

/**
 * A single coding assignment. The workspace must already contain the project
 * checkout and be scoped exactly to <workspaceRoot>/<organizationId>/<taskId>.
 */
export interface CodingTaskRequest {
  organizationId: string;
  taskId: string;
  prompt: string;
  /** Absolute path visible to Rufflo while it owns the disposable checkout. */
  workspacePath: string;
  /** Optional path visible inside the selected runtime's isolated container. */
  runtimeWorkspacePath?: string;
  title?: string;
  /** OpenCode uses provider/model. OpenHands accepts its configured provider model string. */
  model?: string;
  /** OpenCode agent profile, for example "build". */
  agent?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}

/**
 * Runtime completion is not correctness verification. `verified` stays false
 * until Rufflo independently checks the returned patch and required commands.
 */
export interface CodingTaskResult {
  organizationId: string;
  taskId: string;
  engine: CodingEngineId;
  sessionId: string | null;
  status: CodingExecutionStatus;
  summary: string;
  changedFiles: string[];
  diff: string;
  verified: false;
  errorCode?: CodingExecutionErrorCode;
  error?: string;
}

export interface CodingEngineHealth {
  engine: CodingEngineId;
  configured: boolean;
  available: boolean;
  version?: string;
  detail?: string;
}

export interface CodingEngineAdapter {
  readonly engine: CodingEngineId;
  health(): Promise<CodingEngineHealth>;
  execute(task: CodingTaskRequest): Promise<CodingTaskResult>;
}

export class CodingExecutionError extends Error {
  constructor(
    readonly code: CodingExecutionErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "CodingExecutionError";
  }
}
