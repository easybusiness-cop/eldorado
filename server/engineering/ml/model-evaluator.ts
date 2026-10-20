export interface EvalResult {
  modelId: string;
  testDatasetSize: number;
  accuracy: number;
  latencyP95Ms: number;
  tokensPerSec: number;
  driftDetected: boolean;
  driftScore: number;
  passedBenchmark: boolean;
  confusionMatrix: {
    truePositive: number;
    falsePositive: number;
    trueNegative: number;
    falseNegative: number;
  };
  recommendation: string;
}

export class ModelEvaluator {
  public static evaluateModel(modelId: string, testDatasetSize = 500): EvalResult {
    void modelId;
    void testDatasetSize;
    throw new ModelEvaluationUnavailableError();
  }
}

export class ModelEvaluationUnavailableError extends Error {
  readonly code = 'MODEL_EVALUATION_UNAVAILABLE';

  constructor() {
    super('No model artifact and validation dataset are configured; no evaluation was performed.');
    this.name = 'ModelEvaluationUnavailableError';
  }
}
