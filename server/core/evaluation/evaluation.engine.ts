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

  evaluateStep(params: {
    expected?: string;
    artifacts?: string[];
    testResults?: any;
  }): {
    passed: boolean;
    scores: {
      correctness: number;
      reliability: number;
      security: number;
      performance: number;
    };
    failures: string[];
  } {
    const failures: string[] = [];
    const scores = {
      correctness: 1.0,
      reliability: 1.0,
      security: 1.0,
      performance: 1.0,
    };

    const actual = typeof params.testResults === "string"
      ? params.testResults
      : JSON.stringify(params.testResults ?? "");

    // 1. Expected match check
    if (params.expected && params.expected.trim()) {
      if (!actual.includes(params.expected)) {
        scores.correctness = 0.4;
        failures.push(`Expected pattern "${params.expected}" not found in testResults.`);
      }
    }

    // 2. Check general failures in testResults
    if (
      actual.toLowerCase().includes("fail") ||
      actual.toLowerCase().includes("error") ||
      actual.toLowerCase().includes("exception")
    ) {
      scores.reliability = 0.5;
      failures.push("An error or failure was detected in the execution output.");
    }

    // 3. Artifact verification
    if (!params.artifacts || params.artifacts.length === 0) {
      scores.performance = 0.8;
    }

    const passed = failures.length === 0;

    return {
      passed,
      scores,
      failures,
    };
  }
}

export const evaluationEngine = new EvaluationEngine();
