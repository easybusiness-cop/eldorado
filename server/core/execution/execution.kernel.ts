import { ExecutionPolicy } from "./execution.policy.ts";
import { WorkspaceManager } from "./workspace.manager.ts";
import { ProcessRunner } from "./process.runner.ts";
import type { ExecutionRequest, ExecutionResult } from "./execution.types.ts";

export class ExecutionKernel {
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const policy = ExecutionPolicy.evaluate(request);

    if (!policy.allowed) {
      return {
        success: false,
        exitCode: null,
        stdout: "",
        stderr: "",
        durationMs: 0,
        timedOut: false,
        artifacts: [],
        error: {
          code: policy.requiresApproval
            ? "APPROVAL_REQUIRED"
            : "POLICY_DENIED",
          message: policy.reason ?? "Execution denied.",
        },
      };
    }

    const workspace =
      request.cwd ?? (await WorkspaceManager.create(request.taskId));

    if (!request.command) {
      return {
        success: true,
        exitCode: 0,
        stdout: "",
        stderr: "",
        durationMs: 0,
        timedOut: false,
        artifacts: [],
      };
    }

    const result = await ProcessRunner.run({
      command: request.command,
      cwd: workspace,
      timeoutMs: Math.min(request.timeoutMs ?? 120_000, 600_000),
      env: request.environment,
    });

    return {
      success: result.exitCode === 0 && !result.timedOut,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      durationMs: result.durationMs,
      timedOut: result.timedOut,
      artifacts: [],
    };
  }
}

export const executionKernel = new ExecutionKernel();
