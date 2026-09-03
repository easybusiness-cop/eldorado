export * from './agents/index.ts';
export * from './workflows/index.ts';
export * from './tools/index.ts';
export * from './memory/index.ts';
export * from './processors/index.ts';
export * from './observability/index.ts';

import { productionMastraRuntime } from '../runtime/mastra.runtime.ts';

export const mastra = productionMastraRuntime;
export class MastraRuntime {
  public agents = productionMastraRuntime.agents;
  public workflows = productionMastraRuntime.workflows;
  public tools = productionMastraRuntime.tools;
  public memory = productionMastraRuntime.memory;
  public observability = productionMastraRuntime.observability;
  public router = productionMastraRuntime.router;

  public executeTaskWithAgent(agentId: string, taskDescription: string) {
    return productionMastraRuntime.executeTaskWithAgent(agentId, taskDescription);
  }
}

