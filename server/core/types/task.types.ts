export type TaskStatus =
  | "QUEUED"
  | "PLANNING"
  | "EXECUTING"
  | "VERIFYING"
  | "RECOVERING"
  | "COMPLETED"
  | "FAILED";

export interface AgentTask {
  id: string;
  organizationId: string;
  agentId: string;
  objective: string;
  priority: number;
  maxAttempts: number;
  timeoutMs: number;
  requiredCapabilities?: string[];
  workspaceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface TaskAttempt {
  attempt: number;
  startedAt: string;
  finishedAt?: string;
  actions: string[];
  success: boolean;
  error?: string;
  verification?: VerificationResult;
}

export interface VerificationResult {
  passed: boolean;
  score: number;
  correctness: number;
  reliability: number;
  security: number;
  performance: number;
  failures: string[];
  evidence: string[];
}
