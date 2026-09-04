import type { VerificationResult } from "../types/task.types.ts";

export interface EvaluationInput {
  expected?: string;
  actual: string;
  testsPassed: number;
  testsTotal: number;
  securityPassed: boolean;
  durationMs: number;
  timeoutMs: number;
}

export class EvaluationEngine {
  evaluate(input: EvaluationInput): VerificationResult {
    const correctness =
      input.testsTotal === 0 ? 0 : input.testsPassed / input.testsTotal;

    const reliability = input.testsTotal === 0 ? 0 : correctness;

    const security = input.securityPassed ? 1 : 0;

    const performance =
      input.durationMs <= input.timeoutMs
        ? 1
        : Math.max(0, input.timeoutMs / input.durationMs);

    const score =
      correctness * 0.45 +
      reliability * 0.20 +
      security * 0.20 +
      performance * 0.15;

    const failures: string[] = [];

    if (correctness < 1) {
      failures.push("One or more tests failed.");
    }

    if (!input.securityPassed) {
      failures.push("Security verification failed.");
    }

    if (performance < 1) {
      failures.push("Performance target exceeded.");
    }

    return {
      passed: score >= 0.90 && security === 1 && correctness === 1,
      score,
      correctness,
      reliability,
      security,
      performance,
      failures,
      evidence: [
        `tests=${input.testsPassed}/${input.testsTotal}`,
        `duration=${input.durationMs}ms`,
        `security=${input.securityPassed}`,
      ],
    };
  }
}

export const evaluationEngine = new EvaluationEngine();
