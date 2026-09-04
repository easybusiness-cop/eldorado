import { randomUUID } from "node:crypto";
import { executionKernel } from "../execution/execution.kernel.ts";
import { evaluationEngine } from "../evaluation/evaluation.engine.ts";
import { failureMemory } from "../learning/failure-memory.ts";
import { capabilityEngine } from "../capabilities/capability.engine.ts";

export type LifecycleStage =
  | "PLANNING"
  | "INSPECTING"
  | "IMPLEMENTING"
  | "TESTING"
  | "SECURITY"
  | "EVALUATING"
  | "LEARNING"
  | "COMPLETED"
  | "FAILED";

export interface AutonomousDevelopmentTask {
  id?: string;
  agentId: string;
  organizationId: string;
  objective: string;
  workspace: string;
  maxAttempts?: number;
  timeoutMs?: number;
  requiredCapability?: string;
}

export interface LifecycleEvent {
  stage: LifecycleStage;
  timestamp: string;
  message: string;
}

export interface AutonomousDevelopmentResult {
  taskId: string;
  success: boolean;
  stage: LifecycleStage;
  attempts: number;
  events: LifecycleEvent[];
  output?: string;
  failure?: string;
}

export class AutonomousLifecycle {
  async run(
    task: AutonomousDevelopmentTask
  ): Promise<AutonomousDevelopmentResult> {
    const taskId = task.id ?? randomUUID();
    const maxAttempts = task.maxAttempts ?? 5;
    const timeoutMs = task.timeoutMs ?? 120_000;

    const events: LifecycleEvent[] = [];

    const emit = (stage: LifecycleStage, message: string) => {
      events.push({
        stage,
        timestamp: new Date().toISOString(),
        message,
      });
    };

    let attempts = 0;

    try {
      emit("PLANNING", `Planning objective: ${task.objective}`);

      const plan = this.createPlan(task.objective);

      for (attempts = 1; attempts <= maxAttempts; attempts++) {
        try {
          emit(
            "INSPECTING",
            `Inspecting workspace. Attempt ${attempts}/${maxAttempts}`
          );

          const inspection = await this.execute(
            task,
            "find . -maxdepth 3 -type f | head -300",
            timeoutMs
          );

          if (!inspection.success) {
            throw new Error(inspection.stderr || "Workspace inspection failed");
          }

          emit("IMPLEMENTING", "Executing controlled development plan.");

          const implementation = await this.execute(
            task,
            plan.implementationCommand,
            timeoutMs
          );

          if (!implementation.success) {
            throw new Error(
              implementation.stderr || "Implementation failed"
            );
          }

          emit("TESTING", "Running project tests.");

          const tests = await this.execute(
            task,
            plan.testCommand,
            timeoutMs
          );

          emit("SECURITY", "Running security checks.");

          const security = await this.execute(
            task,
            plan.securityCommand,
            timeoutMs
          );

          const securityPassed = security.success;

          emit("EVALUATING", "Evaluating implementation.");

          const evaluation = evaluationEngine.evaluate({
            actual: implementation.stdout,
            testsPassed: tests.success ? 1 : 0,
            testsTotal: 1,
            securityPassed,
            durationMs:
              (implementation.durationMs ?? 0) +
              (tests.durationMs ?? 0) +
              (security.durationMs ?? 0),
            timeoutMs,
          });

          capabilityEngine.record(
            task.agentId,
            task.requiredCapability ?? "software-engineering",
            evaluation.passed,
            evaluation.score
          );

          if (evaluation.passed) {
            emit("COMPLETED", "Objective successfully completed.");

            return {
              taskId,
              success: true,
              stage: "COMPLETED",
              attempts,
              events,
              output: implementation.stdout,
            };
          }

          const failure = evaluation.failures.join("; ");

          emit("LEARNING", `Learning from failure: ${failure}`);

          failureMemory.add({
            id: `${taskId}-${attempts}`,
            agentId: task.agentId,
            taskId,
            skill: task.requiredCapability,
            failureType: "CODING",
            description: failure,
            rootCause: tests.stderr || implementation.stderr,
            correction:
              "Inspect the failure, modify the implementation, and rerun the verification pipeline.",
            createdAt: new Date().toISOString(),
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);

          emit("LEARNING", message);

          failureMemory.add({
            id: `${taskId}-${attempts}-error`,
            agentId: task.agentId,
            taskId,
            skill: task.requiredCapability,
            failureType: "TOOL",
            description: message,
            createdAt: new Date().toISOString(),
          });
        }
      }

      emit("FAILED", "Recovery budget exhausted.");

      return {
        taskId,
        success: false,
        stage: "FAILED",
        attempts,
        events,
        failure: "Autonomous development recovery budget exhausted.",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      return {
        taskId,
        success: false,
        stage: "FAILED",
        attempts,
        events,
        failure: message,
      };
    }
  }

  private createPlan(objective: string) {
    return {
      objective,
      implementationCommand:
        "npm run typecheck",
      testCommand:
        "npm test",
      securityCommand:
        "npm audit --audit-level=high",
    };
  }

  private async execute(
    task: AutonomousDevelopmentTask,
    command: string,
    timeoutMs: number
  ) {
    return executionKernel.execute({
      taskId: task.id ?? "autonomous-task",
      agentId: task.agentId,
      organizationId: task.organizationId,
      mode: "SANDBOX",
      command,
      timeoutMs,
      workspace: task.workspace,
      cwd: task.workspace,
    });
  }
}

export const autonomousLifecycle = new AutonomousLifecycle();
