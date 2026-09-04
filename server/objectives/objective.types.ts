export interface Objective {
  id: string;
  goal: string;
  constraints: string[];
  successCriteria: string[];
  status: "PLANNING" | "RUNNING" | "COMPLETED" | "FAILED" | "NEEDS_HUMAN";
  steps: ObjectiveStep[];
  currentStepIndex: number;
  failures: string[];
  recoveryAttempts: number;
  maxRecoveryAttempts: number;
  maxWallTimeMs: number; // Maximum loop execution time in milliseconds
  budgetExhausted: boolean;
  evidence: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ObjectiveStep {
  id: string;
  name: string;
  type: "CODE" | "BUILD" | "TEST" | "SECURITY";
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  command?: string;
  expected?: string;
  artifacts?: string[];
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  durationMs?: number;
  error?: string;
  evaluationScores?: {
    correctness: number;
    reliability: number;
    security: number;
    performance: number;
  };
}
