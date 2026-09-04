import { agentFleetRegistry } from "./registry.ts";
import { mastra } from "../ai/mastra/index.ts";
import { workingMemory } from "../memory/working-memory.ts";
import { ruffloHarness } from "../harness/harness.ts";

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  organizationId: string;
}

export class AgentRuntime {
  private static instance: AgentRuntime;

  private constructor() {}

  public static getInstance(): AgentRuntime {
    if (!AgentRuntime.instance) {
      AgentRuntime.instance = new AgentRuntime();
    }

    return AgentRuntime.instance;
  }

  public async executeAgentTask(
    agentId: string,
    task: AgentTask,
  ): Promise<{
    success: boolean;
    result: string;
    durationMs: number;
  }> {
    const startTime = Date.now();

    if (!task.organizationId?.trim()) {
      throw new Error(
        "organizationId is required to execute an agent task.",
      );
    }

    const agent =
      agentFleetRegistry.getAgent(agentId);

    if (!agent) {
      throw new Error(
        `Agent "${agentId}" is not registered.`,
      );
    }

    /*
     * Every agent task enters the Rufflo Harness
     * with the authenticated organization identity.
     */
    const harnessTask =
      ruffloHarness.createTask({
        id: task.id,
        agentId,
        organizationId:
          task.organizationId,
        objective:
          `${task.title}\n${task.description}`,
      });

    /*
     * The Harness is the first authorization boundary.
     */
    const authorization =
      ruffloHarness.authorizeTask(
        harnessTask,
      );

    if (!authorization.allowed) {
      agentFleetRegistry.updateStatus(
        agentId,
        "blocked",
        task.id,
      );

      throw new Error(
        authorization.reason ??
          "Harness authorization denied.",
      );
    }

    agentFleetRegistry.updateStatus(
      agentId,
      "thinking",
      task.id,
    );

    workingMemory.setContext(
      task.id,
      {
        agentId,
        taskTitle: task.title,
        organizationId:
          task.organizationId,
      },
    );

    try {
      agentFleetRegistry.updateStatus(
        agentId,
        "working",
        task.id,
      );

      /*
       * The agent can now execute using its real
       * organization context.
       *
       * The organization identity is NOT inferred
       * from the agent and is NOT replaced by a
       * development placeholder.
       */
      const execution =
        await mastra.executeTaskWithAgent(
          agentId,
          `${task.title}\n${task.description}`,
        );

      const durationMs =
        Date.now() - startTime;

      agentFleetRegistry.recordTaskCompletion(
        agentId,
        durationMs,
      );

      agentFleetRegistry.updateStatus(
        agentId,
        "completed",
      );

      workingMemory.clearContext(
        task.id,
      );

      return {
        success: true,
        result: execution.result,
        durationMs,
      };
    } catch (error) {
      agentFleetRegistry.updateStatus(
        agentId,
        "failed",
      );

      workingMemory.clearContext(
        task.id,
      );

      throw error;
    }
  }
}

export const agentRuntime =
  AgentRuntime.getInstance();
