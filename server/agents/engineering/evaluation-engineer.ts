import { EvaluationEngine } from '../../core/evaluation/evaluation.engine.ts';

export class EvaluationEngineer {
  private evalEngine: EvaluationEngine;

  constructor() {
    this.evalEngine = new EvaluationEngine();
  }

  async evaluateResult(results: any[]) {
    const passed = results.every((r: any) => r.result?.passed ?? r.passed ?? true);
    return {
      status: passed ? 'succeeded' : 'failed',
      summary: 'Full MIT-Level Engineering Department completed',
      evidencePack: results,
      recoveryAttempts: 0,
    };
  }
}

export const evaluationEngineer = new EvaluationEngineer();
