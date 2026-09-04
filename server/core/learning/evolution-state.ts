export type EvolutionState =
  | "OBSERVING"
  | "IDENTIFIED"
  | "PROPOSING"
  | "EXPERIMENTING"
  | "BENCHMARKING"
  | "SECURITY_REVIEW"
  | "APPROVAL"
  | "PROMOTING"
  | "MONITORING"
  | "ROLLED_BACK"
  | "COMPLETED";

export interface EvolutionRun {
  id: string;

  agentId: string;

  capability: string;

  state: EvolutionState;

  baselineScore: number;

  candidateScore?: number;

  regressionFailures: number;

  securityFailures: number;

  createdAt: string;

  updatedAt: string;
}

export function canTransition(
  from: EvolutionState,
  to: EvolutionState
) {
  const transitions: Record<EvolutionState, EvolutionState[]> = {
    OBSERVING: ["IDENTIFIED"],
    IDENTIFIED: ["PROPOSING"],
    PROPOSING: ["EXPERIMENTING"],
    EXPERIMENTING: ["BENCHMARKING"],
    BENCHMARKING: ["SECURITY_REVIEW"],
    SECURITY_REVIEW: ["APPROVAL", "ROLLED_BACK"],
    APPROVAL: ["PROMOTING", "ROLLED_BACK"],
    PROMOTING: ["MONITORING"],
    MONITORING: ["COMPLETED", "ROLLED_BACK"],
    ROLLED_BACK: ["OBSERVING"],
    COMPLETED: [],
  };

  return transitions[from]?.includes(to) ?? false;
}
