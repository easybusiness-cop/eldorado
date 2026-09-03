import { AgentDefinition, AgentStatus } from '../../shared/types/index.ts';
import { mastraAgentRegistry } from '../ai/mastra/agents/index.ts';

export class AgentFleetRegistry {
  private static instance: AgentFleetRegistry;
  private agentStates: Map<string, AgentDefinition> = new Map();

  private constructor() {
    this.syncFromMastra();
  }

  public static getInstance(): AgentFleetRegistry {
    if (!AgentFleetRegistry.instance) {
      AgentFleetRegistry.instance = new AgentFleetRegistry();
    }
    return AgentFleetRegistry.instance;
  }

  private syncFromMastra() {
    const mastraAgents = mastraAgentRegistry.getAllAgents();
    for (const ma of mastraAgents) {
      const config = ma.config;
      const def: AgentDefinition = {
        id: config.id,
        name: config.name,
        role: config.role,
        department: config.department,
        systemInstructions: config.instructions,
        capabilities: config.tools,
        tools: config.tools,
        permissions: config.permissions,
        managerId: config.managerId,
        delegationRules: config.delegationRules,
        approvalRequirements: config.approvalRequirements,
        status: 'idle',
        metrics: {
          tasksCompleted: 0,
          tokensProcessed: 0,
          successRate: 100,
          avgLatencyMs: 250,
        },
      };
      this.agentStates.set(def.id, def);
    }
  }

  public getAgent(id: string): AgentDefinition | undefined {
    return this.agentStates.get(id);
  }

  public getAllAgents(): AgentDefinition[] {
    return Array.from(this.agentStates.values());
  }

  public updateStatus(id: string, status: AgentStatus, currentTaskId?: string): AgentDefinition | undefined {
    const agent = this.agentStates.get(id);
    if (agent) {
      agent.status = status;
      agent.currentTaskId = currentTaskId;
    }
    return agent;
  }

  public recordTaskCompletion(id: string, latencyMs: number, tokens = 200) {
    const agent = this.agentStates.get(id);
    if (agent) {
      agent.metrics.tasksCompleted += 1;
      agent.metrics.tokensProcessed += tokens;
      agent.metrics.avgLatencyMs = Math.round((agent.metrics.avgLatencyMs + latencyMs) / 2);
    }
  }
}

export const agentFleetRegistry = AgentFleetRegistry.getInstance();
