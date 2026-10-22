export interface TrainingConfig {
  modelName: string;
  taskType: 'classification' | 'regression' | 'embedding' | 'llm_tuning';
  epochs: number;
  batchSize: number;
  learningRate: number;
  features: string[];
  targetLabel: string;
}

export class MlTrainingUnavailableError extends Error {
  readonly code = 'ML_TRAINING_UNAVAILABLE';

  constructor() {
    super('No dataset-backed ML training runtime is configured; no model was trained.');
    this.name = 'MlTrainingUnavailableError';
  }
}

export class MlPipelineService {
  public static async trainModel(_config: TrainingConfig): Promise<never> {
    throw new MlTrainingUnavailableError();
  }
}
