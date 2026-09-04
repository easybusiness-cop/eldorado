import { randomUUID } from "node:crypto";

import {
  agentFleetRegistry,
} from "../agents/registry.ts";

import {
  toolGateway,
} from "../tools/gateway.ts";

import type {
  HarnessEvent,
  HarnessResult,
  HarnessTask,
  HarnessToolRequest,
  HarnessToolResult,
} from "./harness.types.ts";

export class RuffloHarness {
  private static instance: RuffloHarness;

  private constructor() {}

  public static getInstance(): RuffloHarness {
    if (!RuffloHarness.instance) {
      RuffloHarness.instance = new RuffloHarness();
    }

    return RuffloHarness.instance;
  }

  /**
   * Creates a normalized task identity.
   */
  public createTask(
    input: Omit<HarnessTask, "id"> & { id?: string },
  ): HarnessTask {
    return {
      ...input,
      id: input.id ?? randomUUID(),
    };
  }

  /**
   * Validate that the agent exists before it can execute anything.
   */
  public authorizeTask(task: HarnessTask): {
    allowed: boolean;
    reason?: string;
  } {
    if (!task.agentId) {
      return {
        allowed: false,
        reason: "Agent identity is required.",
      };
    }

    if (!task.organizationId) {
      return {
        allowed: false,
        reason: "Organization identity is required.",
      };
    }

    const agent =
      agentFleetRegistry.getAgent(task.agentId);

    if (!agent) {
      return {
        allowed: false,
        reason:
          `Agent "${task.agentId}" is not registered.`,
      };
    }

    if (
      !agent.capabilities ||
      agent.capabilities.length === 0
    ) {
      return {
        allowed: false,
        reason:
          `Agent "${task.agentId}" has no registered capabilities.`,
      };
    }

    return {
      allowed: true,
    };
  }

  /**
   * Every external action performed by an agent
   * must eventually pass through this method.
   */
  public async executeTool(
    request: HarnessToolRequest,
  ): Promise<HarnessToolResult> {
    const taskId =
      request.taskId || randomUUID();

    const authorization =
      this.authorizeTask({
        id: taskId,
        agentId: request.agentId,
        organizationId:
          request.organizationId,
        objective:
          `Tool execution: ${request.toolName}`,
      });

    if (!authorization.allowed) {
      return {
        success: false,
        error: {
          code: "HARNESS_AUTHORIZATION_DENIED",
          message:
            authorization.reason ??
            "Harness authorization denied.",
        },
      };
    }

    return toolGateway.execute({
      toolName: request.toolName,
      agentId: request.agentId,
      organizationId:
        request.organizationId,
      departmentId:
        agentFleetRegistry.getAgent(
          request.agentId,
        )!.department,
      parameters:
        request.parameters,
    });
  }

  /**
   * Execute a terminal command through the
   * canonical ToolGateway.
   */
  public async executeCommand(
    task: HarnessTask,
    command: string,
  ): Promise<HarnessToolResult> {
    return this.executeTool({
      taskId: task.id,
      agentId: task.agentId,
      organizationId:
        task.organizationId,
      toolName: "terminal.execute",
      parameters: {
        command,
        cwd: task.workspace,
        timeoutMs:
          task.timeoutMs ?? 120_000,
      },
    });
  }

  /**
   * Build a standard event.
   */
  public event(
    taskId: string,
    stage: HarnessEvent["stage"],
    message: string,
    metadata?: Record<string, unknown>,
  ): HarnessEvent {
    return {
      taskId,
      stage,
      timestamp:
        new Date().toISOString(),
      message,
      metadata,
    };
  }

  /**
   * Standard failure result.
   */
  public failure(
    taskId: string,
    attempts: number,
    events: HarnessEvent[],
    failure: string,
  ): HarnessResult {
    return {
      taskId,
      success: false,
      stage: "FAILED",
      attempts,
      events,
      failure,
    };
  }
}

export const ruffloHarness =
  RuffloHarness.getInstance();
