export type HarnessStage =
  | "RECEIVED"
  | "AUTHORIZED"
  | "PLANNING"
  | "EXECUTING"
  | "OBSERVING"
  | "EVALUATING"
  | "LEARNING"
  | "COMPLETED"
  | "FAILED"
  | "BLOCKED"
  | "AWAITING_APPROVAL";

export interface HarnessTask {
  id: string;
  agentId: string;
  organizationId: string;
  objective: string;
  workspace?: string;
  maxAttempts?: number;
  timeoutMs?: number;
  requiredCapability?: string;
}

export interface HarnessEvent {
  taskId: string;
  stage: HarnessStage;
  timestamp: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface HarnessToolRequest {
  taskId: string;
  agentId: string;
  organizationId: string;
  toolName: string;
  parameters: Record<string, unknown>;
}

export interface HarnessToolResult {
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
  auditId?: string;
  executionTimeMs?: number;
}

export interface HarnessResult {
  taskId: string;
  success: boolean;
  stage: HarnessStage;
  attempts: number;
  events: HarnessEvent[];
  output?: unknown;
  failure?: string;
}
