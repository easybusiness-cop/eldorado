import { mastra } from '../ai/mastra/index.ts';

export class Dispatcher {
  public static async dispatchToAgent(agentId: string, task: string): Promise<{ success: boolean; output: string }> {
    try {
      const res = await mastra.executeTaskWithAgent(agentId, task);
      return {
        success: res.success,
        output: res.result,
      };
    } catch (err: any) {
      return {
        success: false,
        output: err?.message || String(err),
      };
    }
  }
}
