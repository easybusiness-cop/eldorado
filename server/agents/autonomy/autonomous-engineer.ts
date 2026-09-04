import { executionKernel } from "../../core/execution/execution.kernel.ts";
import { evaluationEngine } from "../../core/evaluation/evaluation.engine.ts";
import { failureMemory } from "../../core/learning/failure-memory.ts";
import { capabilityEngine } from "../../core/capabilities/capability.engine.ts";
import type { AgentTask, TaskAttempt } from "../../core/types/task.types.ts";

export interface AutonomousResult {
  success: boolean;
  attempts: TaskAttempt[];
  finalOutput?: string;
  failure?: string;
}

export class AutonomousEngineer {
  async solve(task: AgentTask): Promise<AutonomousResult> {
    const attempts: TaskAttempt[] = [];

    let plan = await this.createPlan(task);

    for (let attempt = 1; attempt <= task.maxAttempts; attempt++) {
      const started = new Date().toISOString();
      const actions: string[] = [];

      try {
        actions.push("inspect");

        const execution = await this.executePlan(task, plan);

        actions.push("execute");

        const verification = await this.verify(task, execution);

        actions.push("verify");

        const record: TaskAttempt = {
          attempt,
          startedAt: started,
          finishedAt: new Date().toISOString(),
          actions,
          success: verification.passed,
          verification,
        };

        attempts.push(record);

        capabilityEngine.record(
          task.agentId,
          task.requiredCapabilities?.[0] ?? "general",
          verification.passed,
          verification.score
        );

        if (verification.passed) {
          return {
            success: true,
            attempts,
            finalOutput: execution.stdout,
          };
        }

        const diagnosis = await this.diagnose(task, execution, verification);

        failureMemory.add({
          id: `${task.id}-${attempt}`,
          agentId: task.agentId,
          taskId: task.id,
          skill: task.requiredCapabilities?.[0],
          failureType: "CODING",
          description: verification.failures.join("; "),
          rootCause: diagnosis.rootCause,
          correction: diagnosis.correction,
          createdAt: new Date().toISOString(),
        });

        plan = await this.replan(plan, diagnosis);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);

        attempts.push({
          attempt,
          startedAt: started,
          finishedAt: new Date().toISOString(),
          actions,
          success: false,
        });

        failureMemory.add({
          id: `${task.id}-${attempt}-error`,
          agentId: task.agentId,
          taskId: task.id,
          failureType: "TOOL",
          description: message,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return {
      success: false,
      attempts,
      failure: "Autonomous execution exhausted its recovery budget.",
    };
  }

  private async createPlan(task: AgentTask) {
    return {
      steps: [
        {
          type: "inspect",
          command: "find . -maxdepth 2 -type f | head -200",
        },
        {
          type: "test",
          command: "npm test -- --runInBand",
        },
      ],
    };
  }

  private async executePlan(task: AgentTask, plan: any) {
    let lastResult: any = {
      stdout: "",
      stderr: "",
    };

    for (const step of plan.steps) {
      lastResult = await executionKernel.execute({
        taskId: task.id,
        agentId: task.agentId,
        organizationId: task.organizationId,
        mode: "SANDBOX",
        command: step.command,
        timeoutMs: task.timeoutMs,
      });

      if (!lastResult.success) {
        break;
      }
    }

    return lastResult;
  }

  private async verify(task: AgentTask, execution: any) {
    return evaluationEngine.evaluate({
      actual: execution.stdout,
      testsPassed: execution.success ? 1 : 0,
      testsTotal: 1,
      securityPassed: true,
      durationMs: execution.durationMs,
      timeoutMs: task.timeoutMs,
    });
  }

  private async diagnose(task: AgentTask, execution: any, verification: any) {
    return {
      rootCause: execution.stderr || verification.failures.join("; "),
      correction:
        "Reinspect the failing step and generate an alternative implementation.",
    };
  }

  private async replan(plan: any, diagnosis: any) {
    return {
      ...plan,
      steps: [
        ...plan.steps,
        {
          type: "recovery",
          command: "npm test",
        },
      ],
    };
  }
}
