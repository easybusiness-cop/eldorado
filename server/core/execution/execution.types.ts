export type ExecutionMode =
  | "READ_ONLY"
  | "WORKSPACE"
  | "SANDBOX"
  | "BROWSER"
  | "NETWORK";

export interface ExecutionRequest {
  taskId: string;
  agentId: string;
  organizationId: string;
  mode: ExecutionMode;
  command?: string;
  cwd?: string;
  timeoutMs?: number;
  networkAccess?: boolean;
  environment?: Record<string, string>;
}

export interface ExecutionResult {
  success: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
  artifacts: string[];
  error?: {
    code: string;
    message: string;
  };
}
