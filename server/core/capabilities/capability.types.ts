export interface CapabilityScore {
  skill: string;
  score: number;
  confidence: number;
  attempts: number;
  successes: number;
  failures: number;
  lastEvaluatedAt?: string;
}

export interface AgentCapabilityProfile {
  agentId: string;
  capabilities: Record<string, CapabilityScore>;
  overallScore: number;
  updatedAt: string;
}

export interface CapabilityUpdate {
  agentId: string;
  skill: string;
  score: number;
  success: boolean;
  evidence: string[];
  failureReason?: string;
}
