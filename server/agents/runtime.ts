import { agentFleetRegistry } from './registry.ts';
import { mastra } from '../ai/mastra/index.ts';
import { workingMemory } from '../memory/working-memory.ts';

export class AgentRuntime {
  private static instance: AgentRuntime;

  private constructor() {}

  public static getInstance(): AgentRuntime {
    if (!AgentRuntime.instance) {
      AgentRuntime.instance = new AgentRuntime();
    }
    return AgentRuntime.instance;
  }

  public async executeAgentTask(agentId: string, task: { id: string; title: string; description: string }): Promise<{
    success: boolean;
    result: string;
    durationMs: number;
  }> {
    const startTime = Date.now();
    agentFleetRegistry.updateStatus(agentId, 'thinking', task.id);
    workingMemory.setContext(task.id, { agentId, taskTitle: task.title });

    try {
      agentFleetRegistry.updateStatus(agentId, 'working', task.id);
      const execution = await mastra.executeTaskWithAgent(agentId, `${task.title}\n${task.description}`);
      const durationMs = Date.now() - startTime;

      agentFleetRegistry.recordTaskCompletion(agentId, durationMs);
      agentFleetRegistry.updateStatus(agentId, 'completed');
      workingMemory.clearContext(task.id);

      return {
        success: true,
        result: execution.result,
        durationMs,
      };
    } catch (err: any) {
      agentFleetRegistry.updateStatus(agentId, 'failed');
      workingMemory.clearContext(task.id);
      throw err;
    }
  }
}

export const agentRuntime = AgentRuntime.getInstance();
