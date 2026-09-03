import { Mastra as RealMastra } from '@mastra/core';
import { mastraAgentRegistry } from '../mastra/agents/index.ts';
import { AgentAdapter } from './agent.adapter.ts';
import { modelRouter } from '../models/model-router.ts';
import { mastraMemoryStore } from '../mastra/memory/index.ts';
import { mastraObservability } from '../mastra/observability/index.ts';
import { mastraWorkflowEngine } from '../mastra/workflows/index.ts';
import { mastraToolRegistry } from '../mastra/tools/index.ts';

export class ProductionMastraRuntime {
  private static instance: ProductionMastraRuntime;
  private realMastra: RealMastra | null = null;
  private isSimulationMode = false;

  public agents = mastraAgentRegistry;
  public workflows = mastraWorkflowEngine;
  public tools = mastraToolRegistry;
  public memory = mastraMemoryStore;
  public observability = mastraObservability;
  public router = modelRouter;

  private constructor() {
    this.initRealMastra();
  }

  public static getInstance(): ProductionMastraRuntime {
    if (!ProductionMastraRuntime.instance) {
      ProductionMastraRuntime.instance = new ProductionMastraRuntime();
    }
    return ProductionMastraRuntime.instance;
  }

  private initRealMastra(): void {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.isSimulationMode = true;
      console.warn('[MastraRuntime] GEMINI_API_KEY not configured. Running in SIMULATION MODE.');
      return;
    }

    try {
      // 1. Adapt all registered system agents to real Mastra Agents
      const systemAgents = mastraAgentRegistry.getAllAgents();
      const adaptedAgentsRecord: Record<string, any> = {};

      for (const sa of systemAgents) {
        adaptedAgentsRecord[sa.getId()] = AgentAdapter.adaptAgent(sa);
      }

      // 2. Instantiate real Mastra with adapted agents
      this.realMastra = new RealMastra({
        agents: adaptedAgentsRecord,
        logger: false, // Suppress default noisy console logs
      });
      
      this.isSimulationMode = false;
      console.log('[MastraRuntime] Real @mastra/core runtime successfully initialized.');
    } catch (error) {
      console.error('[MastraRuntime] Failed to initialize real Mastra SDK:', error);
      this.isSimulationMode = true;
    }
  }

  public checkSimulationMode(): boolean {
    return this.isSimulationMode;
  }

  public getRealMastra(): RealMastra | null {
    return this.realMastra;
  }

  /**
   * Executes a task using either the real Mastra Core SDK or the compliant Simulation Mode.
   */
  public async executeTaskWithAgent(agentId: string, taskDescription: string): Promise<{
    success: boolean;
    result: string;
    traceId: string;
    mode: 'REAL_RUNTIME' | 'SIMULATION_MODE';
  }> {
    const agent = this.agents.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found in Mastra Registry`);
    }

    const trace = this.observability.startTrace(agentId, 'executeTask', { task: taskDescription });

    if (this.isSimulationMode || !this.realMastra) {
      // Compliance: Explicitly mark as SIMULATION_MODE
      try {
        const response = await this.router.executeWithFallback(
          taskDescription,
          agent.getInstructions(),
          agent.getDepartment() === 'engineering' ? 'coding' : 'general'
        );

        this.memory.saveMemory(agentId, `[SIMULATION] Task: ${taskDescription.slice(0, 100)} => ${response.slice(0, 100)}`, 'agent');
        this.observability.finishTrace(trace.traceId, 'completed', { outputLength: response.length, mode: 'SIMULATION_MODE' });

        return {
          success: true,
          result: response,
          traceId: trace.traceId,
          mode: 'SIMULATION_MODE',
        };
      } catch (err: any) {
        this.observability.finishTrace(trace.traceId, 'failed', { error: err?.message || String(err), mode: 'SIMULATION_MODE' });
        throw err;
      }
    }

    // REAL RUNTIME EXECUTION PATH using @mastra/core
    try {
      const realAgent = this.realMastra.getAgent(agentId);
      if (!realAgent) {
        throw new Error(`Real adapted agent ${agentId} not registered in @mastra/core`);
      }

      // Execute via real Mastra SDK
      const response = await realAgent.generate(taskDescription);
      const textResult = response.text || '';

      // Persist to short term memory
      this.memory.saveMemory(agentId, `[REAL] Task: ${taskDescription.slice(0, 100)} => ${textResult.slice(0, 100)}`, 'agent');
      this.observability.finishTrace(trace.traceId, 'completed', { outputLength: textResult.length, mode: 'REAL_RUNTIME' });

      return {
        success: true,
        result: textResult,
        traceId: trace.traceId,
        mode: 'REAL_RUNTIME',
      };
    } catch (err: any) {
      this.observability.finishTrace(trace.traceId, 'failed', { error: err?.message || String(err), mode: 'REAL_RUNTIME' });
      throw err;
    }
  }
}

export const productionMastraRuntime = ProductionMastraRuntime.getInstance();
export const mastra = productionMastraRuntime; // Backward compatibility export
