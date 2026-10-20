export class AgentTrainingUnavailableError extends Error {
  readonly code = 'AGENT_TRAINING_UNAVAILABLE';

  constructor() {
    super('No executable, evidence-backed agent training pipeline is configured; no capabilities were changed.');
    this.name = 'AgentTrainingUnavailableError';
  }
}

export class MasterTrainer {
  public async train(_agentId: string): Promise<never> {
    throw new AgentTrainingUnavailableError();
  }
}
