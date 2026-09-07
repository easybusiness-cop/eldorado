export type CapabilityCategory =
  | 'business'
  | 'technical'
  | 'research'
  | 'communication'
  | 'analysis'
  | 'operations'
  | 'management'
  | 'creative'
  | 'security'
  | 'data'
  | 'general';

export interface CapabilityDefinition {
  id: string;
  name: string;
  description: string;
  category: CapabilityCategory;

  /**
   * Capabilities required before this capability can be used.
   */
  prerequisites: string[];

  /**
   * Tools commonly required to perform this capability.
   */
  recommendedTools: string[];

  /**
   * Departments where this capability is normally useful.
   */
  departments: string[];

  /**
   * Whether the capability can be learned from experience/research.
   */
  learnable: boolean;
}

export interface CapabilityScore {
  skill: string;
  score: number;
  confidence: number;

  attempts: number;
  successes: number;
  failures: number;

  lastEvaluatedAt?: string;

  evidence: string[];
  lastFailureReason?: string;
}

export interface AgentCapabilityProfile {
  agentId: string;

  /**
   * Capabilities explicitly assigned to this employee.
   */
  assignedCapabilities: string[];

  /**
   * Capabilities acquired through work/learning.
   */
  learnedCapabilities: string[];

  /**
   * Performance for individual capabilities.
   */
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
