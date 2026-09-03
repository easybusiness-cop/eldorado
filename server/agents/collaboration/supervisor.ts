import { ResultContract } from './result-contract.ts';

export class CollaborationSupervisor {
  public static auditResult(result: ResultContract): { approved: boolean; feedback?: string } {
    if (!result.success) {
      return { approved: false, feedback: 'Operation flagged failure status.' };
    }
    if (result.artifacts.length === 0) {
      return { approved: false, feedback: 'Rejected: No artifact deliverables produced.' };
    }
    return { approved: true };
  }
}
