export interface AdversarialTest {
  id: string;
  category:
    | "EDGE_CASE"
    | "CONTRADICTION"
    | "SECURITY"
    | "PERFORMANCE"
    | "AMBIGUITY"
    | "NOVELTY";
  input: unknown;
  expectedBehavior: string;
}

export interface AdversarialResult {
  passed: boolean;
  score: number;
  failures: string[];
}

export class AdversarialEngine {
  async evaluate(
    agent: {
      solve(input: unknown): Promise<unknown>;
    },
    tests: AdversarialTest[]
  ): Promise<AdversarialResult> {
    let passed = 0;
    const failures: string[] = [];

    for (const test of tests) {
      try {
        const output = await agent.solve(test.input);
        const valid = this.verify(output, test);

        if (valid) {
          passed++;
        } else {
          failures.push(`${test.id}: ${test.category}`);
        }
      } catch (error) {
        failures.push(
          `${test.id}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    return {
      passed: failures.length === 0,
      score: tests.length === 0 ? 0 : passed / tests.length,
      failures,
    };
  }

  private verify(output: unknown, test: AdversarialTest) {
    return Boolean(output !== undefined && output !== null);
  }
}
