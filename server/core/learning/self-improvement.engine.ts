export interface ImprovementEvidence {
  baselineScore: number;
  candidateScore: number;

  regressionFailures: number;
  securityFailures: number;

  testsPassed: number;
  testsTotal: number;

  benchmarkCount: number;

  humanApprovalRequired: boolean;
  humanApproved: boolean;
}

export interface ImprovementProposal {
  id: string;
  agentId: string;

  targetCapability: string;

  hypothesis: string;

  evidence?: ImprovementEvidence;

  baselineScore?: number;
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
    if (proposal.evidence) {
      const e = proposal.evidence;

      if (e.candidateScore <= e.baselineScore) {
        return false;
      }

      if (e.regressionFailures > 0) {
        return false;
      }

      if (e.securityFailures > 0) {
        return false;
      }

      if (e.testsTotal === 0) {
        return false;
      }

      if (e.testsPassed !== e.testsTotal) {
        return false;
      }

      if (e.benchmarkCount < 3) {
        return false;
      }

      if (e.humanApprovalRequired && !e.humanApproved) {
        return false;
      }

      return true;
    }

    if (
      proposal.candidateScore === undefined ||
      proposal.baselineScore === undefined
    ) {
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

export const selfImprovementEngine = new SelfImprovementEngine();
