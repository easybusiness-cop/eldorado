import { modelRouter } from '../models/model-router.ts';

export class ModelAdapter {
  /**
   * Translates a task category or direct model name into a format accepted by Mastra.
   * Mastra usually expects a provider-prefixed string such as "google/gemini-2.5-flash".
   */
  public static getMastraModel(taskType: 'coding' | 'reasoning' | 'creative' | 'general' | 'fast'): string {
    const decision = modelRouter.routeModel(taskType);
    const modelName = decision.model;
    
    // Prefix with google/ for Mastra to identify the provider correctly
    if (!modelName.includes('/')) {
      return `google/${modelName}`;
    }
    return modelName;
  }

  public static getModelConfig(taskType: 'coding' | 'reasoning' | 'creative' | 'general' | 'fast' = 'general') {
    const decision = modelRouter.routeModel(taskType);
    return {
      model: this.getMastraModel(taskType),
      temperature: decision.temperature,
    };
  }
}
