import { Agent as RealMastraAgent } from '@mastra/core/agent';
import { BaseMastraAgent } from '../mastra/agents/base.agent.ts';
import { ModelAdapter } from './model.adapter.ts';
import { ToolAdapter } from './tool.adapter.ts';
import { MemoryAdapter } from './memory.adapter.ts';
import { mastraToolRegistry } from '../mastra/tools/index.ts';

export class AgentAdapter {
  /**
   * Adapts a system BaseMastraAgent to a real Mastra core SDK Agent instance.
   */
  public static adaptAgent(baseAgent: BaseMastraAgent): RealMastraAgent {
    // 1. Get system tools registered for this agent
    const systemTools = mastraToolRegistry.getAllTools()
      .filter(t => baseAgent.canUseTool(t.name));

    // 2. Translate them using the ToolAdapter
    const adaptedTools = ToolAdapter.adaptTools(systemTools);

    // 3. Resolve the appropriate model configuration
    const taskType = baseAgent.getDepartment() === 'engineering' ? 'coding' : 'general';
    const modelConfig = ModelAdapter.getModelConfig(taskType);

    // 4. Inject adapted memory context into instructions
    const memoryContext = MemoryAdapter.getAdaptedContext(
      baseAgent.getId(),
      baseAgent.getDepartment()
    );
    const combinedInstructions = [
      baseAgent.getInstructions(),
      memoryContext ? `\n\nMemory Context:\n${memoryContext}` : '',
    ].filter(Boolean).join('\n');

    // 5. Instantiate and return the real `@mastra/core/agent` Agent
    return new RealMastraAgent({
      id: baseAgent.getId(),
      name: baseAgent.getName(),
      instructions: combinedInstructions,
      model: modelConfig.model,
      tools: adaptedTools,
    });
  }
}
