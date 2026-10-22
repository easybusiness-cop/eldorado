export class Dispatcher {
  public static async dispatchToAgent(
    agentId: string,
    task: string,
    organizationId = 'org-default',
  ): Promise<{ success: boolean; output: string; status: 'model_response' | 'blocked' }> {
    try {
      const { productionMastraRuntime } = await import('../ai/runtime/mastra.runtime.ts');
      const res = await productionMastraRuntime.executeTaskWithAgent(agentId, task, organizationId);
      return {
        success: false,
        output: res.result,
        status: 'model_response',
      };
    } catch (err: any) {
      return {
        success: false,
        output: err?.message || String(err),
        status: 'blocked',
      };
    }
  }
}
