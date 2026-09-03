import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { MastraToolDefinition } from '../mastra/tools/index.ts';

export class ToolAdapter {
  /**
   * Adapts a system-level MastraToolDefinition to a real Mastra core SDK Tool.
   */
  public static adaptTool(def: MastraToolDefinition) {
    return createTool({
      id: def.name,
      description: def.description,
      inputSchema: z.record(z.string(), z.any()).optional(), // Accepts dynamic input objects
      execute: async ({ input, context }) => {
        // Retrieve agent context safely
        const agentId = (context as any)?.agentId || 'system';
        const orgId = (context as any)?.orgId || 'system-org';
        
        try {
          // Execute the tool under our platform gateway/execution logic
          const result = await def.execute(input || {}, { agentId, orgId });
          return result;
        } catch (error: any) {
          return {
            error: true,
            message: error?.message || 'Tool execution failed',
          };
        }
      },
    });
  }

  /**
   * Adapts a collection of system tools to real Mastra tools.
   */
  public static adaptTools(defs: MastraToolDefinition[]) {
    const adapted: Record<string, any> = {};
    for (const def of defs) {
      adapted[def.name] = this.adaptTool(def);
    }
    return adapted;
  }
}
