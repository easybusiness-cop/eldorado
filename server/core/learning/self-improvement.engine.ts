export interface ImprovementProposal {
  id: string;
  agentId: string;
  targetCapability: string;
  hypothesis: string;
  baselineScore: number;
  candidateScore?: number;
  regressionFailures?: number;
  securityFailures?: number;
  status:
    | "PROPOSED"
    | "TESTING"
    | "REJECTED"
    | "CANDIDATE"
    | "APPROVED"
    | "PROMOTED";
}

export class SelfImprovementEngine {
  canPromote(proposal: ImprovementProposal) {
    if (proposal.candidateScore === undefined) {
      return false;
    }

    const improvement = proposal.candidateScore - proposal.baselineScore;

    return (
      improvement >= 0.02 &&
      (proposal.regressionFailures ?? 1) === 0 &&
      (proposal.securityFailures ?? 1) === 0
    );
  }
}
