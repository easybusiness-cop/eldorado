export type ExecutionMode =
  | "SANDBOX"
  | "WORKSPACE"
  | "REVIEW"
  | "READ_ONLY"
  | "BROWSER"
  | "NETWORK";

export interface ExecutionRequest {
  taskId: string;
  agentId: string;
  organizationId: string;

  mode: ExecutionMode;

  command?: string;

  cwd?: string;
  workspace?: string;

  timeoutMs?: number;

  networkAccess?: boolean;

  environment?: Record<string, string>;

  capabilities?: string[];
}

export interface ExecutionResult {
  success: boolean;

  exitCode?: number | null;

  stdout: string;

  stderr: string;

  durationMs: number;

  timedOut?: boolean;

  artifacts?: string[];

  blocked?: boolean;

  blockReason?: string;

  error?: {
    code: string;
    message: string;
  };
}
