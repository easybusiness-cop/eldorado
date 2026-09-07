export class Dispatcher {
  public static async dispatchToAgent(agentId: string, task: string): Promise<{ success: boolean; output: string }> {
    try {
      const { productionMastraRuntime } = await import('../ai/runtime/mastra.runtime.ts');
      const res = await productionMastraRuntime.executeTaskWithAgent(agentId, task);
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
