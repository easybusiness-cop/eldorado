import {
  randomUUID,
} from "node:crypto";

import {
  ruffloHarness,
} from "../../harness/harness.ts";

import {
  evaluationEngine,
} from "../evaluation/evaluation.engine.ts";

import {
  failureMemory,
} from "../learning/failure-memory.ts";

import {
  capabilityEngine,
} from "../capabilities/capability.engine.ts";

import {
  callGeminiResilient,
} from "../../ai/geminiService.ts";

import {
  CodeEditor,
} from "../../agents/capabilities/coding/code-editor.ts";

import {
  RepositoryInspector,
} from "../../agents/capabilities/coding/repository-inspector.ts";

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

interface GeneratedEdit {
  filePath: string;
  targetContent: string;
  replacementContent: string;
  reason: string;
}

interface GeneratedPlan {
  summary: string;
  edits: GeneratedEdit[];
}

export class AutonomousLifecycle {
  async run(
    task: AutonomousDevelopmentTask,
  ): Promise<AutonomousDevelopmentResult> {
    const taskId =
      task.id ?? randomUUID();

    const maxAttempts =
      Math.max(
        1,
        Math.min(
          task.maxAttempts ?? 5,
          10,
        ),
      );

    const timeoutMs =
      Math.min(
        task.timeoutMs ?? 120_000,
        600_000,
      );

    const events: LifecycleEvent[] = [];

    const emit = (
      stage: LifecycleStage,
      message: string,
    ) => {
      events.push({
        stage,
        timestamp:
          new Date().toISOString(),
        message,
      });
    };

    let attempts = 0;
    let lastFailure = "";

    try {
      /*
       * ----------------------------------------------------
       * 1. PLANNING
       * ----------------------------------------------------
       */
      emit(
        "PLANNING",
        `Planning objective: ${task.objective}`,
      );

      /*
       * ----------------------------------------------------
       * 2. INSPECT
       * ----------------------------------------------------
       */
      emit(
        "INSPECTING",
        "Inspecting repository before making changes.",
      );

      const inspection =
        await RepositoryInspector.inspectFileStructure(
          task.workspace,
        );

      if (
        !inspection.files.length
      ) {
        throw new Error(
          "Workspace contains no readable project files.",
        );
      }

      const projectContext =
        this.buildRepositoryContext(
          inspection,
        );

      /*
       * ----------------------------------------------------
       * 3. ASK MODEL FOR PLAN + PATCH
       * ----------------------------------------------------
       */
      const initialPlan =
        await this.generatePlan(
          task,
          projectContext,
        );

      if (
        !initialPlan.edits.length
      ) {
        throw new Error(
          "The coding planner produced no concrete file edits.",
        );
      }

      let currentPlan =
        initialPlan;

      /*
       * ----------------------------------------------------
       * 4. AUTONOMOUS REPAIR LOOP
       * ----------------------------------------------------
       */
      for (
        attempts = 1;
        attempts <= maxAttempts;
        attempts++
      ) {
        try {
          emit(
            "IMPLEMENTING",
            `Implementation attempt ${attempts}/${maxAttempts}.`,
          );

          /*
           * Apply each AI-generated edit.
           */
          for (
            const edit of currentPlan.edits
          ) {
            const result =
              await CodeEditor.applyEdits(
                task.workspace,
                edit.filePath,
                edit.targetContent,
                edit.replacementContent,
              );

            if (!result.success) {
              throw new Error(
                result.error ??
                  `Failed to edit ${edit.filePath}`,
              );
            }

            emit(
              "IMPLEMENTING",
              `Modified ${edit.filePath}: ${edit.reason}`,
            );
          }

          /*
           * ------------------------------------------------
           * TEST
           * ------------------------------------------------
           */
          emit(
            "TESTING",
            "Running typecheck.",
          );

          const typecheck =
            await this.execute(
              task,
              "npm run typecheck",
              timeoutMs,
            );

          if (!typecheck.success) {
            throw new Error(
              this.formatFailure(
                "Typecheck failed",
                typecheck.stdout,
                typecheck.stderr,
              ),
            );
          }

          emit(
            "TESTING",
            "Running test suite.",
          );

          const tests =
            await this.execute(
              task,
              "npm test",
              timeoutMs,
            );

          if (!tests.success) {
            throw new Error(
              this.formatFailure(
                "Tests failed",
                tests.stdout,
                tests.stderr,
              ),
            );
          }

          /*
           * ------------------------------------------------
           * SECURITY
           * ------------------------------------------------
           */
          emit(
            "SECURITY",
            "Running dependency security audit.",
          );

          const security =
            await this.execute(
              task,
              "npm audit --audit-level=high",
              timeoutMs,
            );

          if (!security.success) {
            throw new Error(
              this.formatFailure(
                "Security audit failed",
                security.stdout,
                security.stderr,
              ),
            );
          }

          /*
           * ------------------------------------------------
           * EVALUATE
           * ------------------------------------------------
           */
          emit(
            "EVALUATING",
            "Evaluating implementation.",
          );

          const evaluation =
            evaluationEngine.evaluate({
              actual:
                JSON.stringify({
                  plan: currentPlan,
                  typecheck:
                    typecheck.stdout,
                  tests:
                    tests.stdout,
                }),

              testsPassed: 1,
              testsTotal: 1,

              securityPassed:
                security.success,

              durationMs:
                (typecheck.durationMs ?? 0) +
                (tests.durationMs ?? 0) +
                (security.durationMs ?? 0),

              timeoutMs,
            });

          capabilityEngine.record(
            task.agentId,
            task.requiredCapability ??
              "software-engineering",
            evaluation.passed,
            evaluation.score,
          );

          if (
            !evaluation.passed
          ) {
            throw new Error(
              evaluation.failures.join(
                "; ",
              ),
            );
          }

          emit(
            "COMPLETED",
            "Code modification passed typecheck, tests and security verification.",
          );

          return {
            taskId,
            success: true,
            stage: "COMPLETED",
            attempts,
            events,
            output:
              `Objective completed successfully.\n\n` +
              `Plan: ${currentPlan.summary}`,
          };
        } catch (error) {
          lastFailure =
            error instanceof Error
              ? error.message
              : String(error);

          emit(
            "LEARNING",
            `Attempt ${attempts} failed: ${lastFailure}`,
          );

          failureMemory.add({
            id:
              `${taskId}-${attempts}`,
            agentId:
              task.agentId,
            taskId,
            skill:
              task.requiredCapability,
            failureType:
              "CODING",
            description:
              lastFailure,
            rootCause:
              lastFailure,
            correction:
              "Use the failure output to generate a corrected patch and rerun verification.",
            createdAt:
              new Date().toISOString(),
          });

          /*
           * No point asking the model to repair if this was
           * the final attempt.
           */
          if (
            attempts >= maxAttempts
          ) {
            break;
          }

          /*
           * ----------------------------------------------
           * AI SELF-REPAIR
           * ----------------------------------------------
           */
          emit(
            "LEARNING",
            "Generating a corrective patch from the failure.",
          );

          const latestInspection =
            await RepositoryInspector.inspectFileStructure(
              task.workspace,
            );

          const latestContext =
            this.buildRepositoryContext(
              latestInspection,
            );

          currentPlan =
            await this.generateRepairPlan(
              task,
              latestContext,
              lastFailure,
            );

          if (
            !currentPlan.edits.length
          ) {
            throw new Error(
              "Repair planner returned no corrective edits.",
            );
          }
        }
      }

      emit(
        "FAILED",
        "Autonomous recovery budget exhausted.",
      );

      return {
        taskId,
        success: false,
        stage: "FAILED",
        attempts,
        events,
        failure:
          lastFailure ||
          "Autonomous development recovery budget exhausted.",
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      emit(
        "FAILED",
        message,
      );

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

  private async generatePlan(
    task: AutonomousDevelopmentTask,
    repositoryContext: string,
  ): Promise<GeneratedPlan> {
    const prompt = `
You are Rufflo's autonomous software engineer.

TASK:
${task.objective}

WORKSPACE:
${task.workspace}

REPOSITORY CONTEXT:
${repositoryContext}

Return ONLY valid JSON:

{
  "summary": "short implementation plan",
  "edits": [
    {
      "filePath": "relative/path.ts",
      "targetContent": "EXACT existing text to replace",
      "replacementContent": "complete replacement text",
      "reason": "why this change is necessary"
    }
  ]
}

Rules:

1. Only modify files required for the objective.
2. filePath must be relative to the workspace.
3. targetContent MUST already exist exactly in the repository.
4. Do not modify .env files.
5. Do not modify .git.
6. Do not modify node_modules.
7. Do not add credentials or secrets.
8. Do not execute commands.
9. Do not claim a change was made unless the edit describes it.
10. Prefer small deterministic edits.
`;

    const response =
      await callGeminiResilient({
        contents: prompt,
        systemInstruction:
          "You are a precise autonomous coding planner. Return only valid JSON.",
        temperature: 0.1,
        responseMimeType:
          "application/json",
      });

    return this.parsePlan(
      response,
    );
  }

  private async generateRepairPlan(
    task: AutonomousDevelopmentTask,
    repositoryContext: string,
    failure: string,
  ): Promise<GeneratedPlan> {
    const prompt = `
You are Rufflo's autonomous repair engineer.

ORIGINAL TASK:
${task.objective}

FAILURE FROM PREVIOUS ATTEMPT:
${failure}

CURRENT REPOSITORY:
${repositoryContext}

Generate ONLY the smallest corrective patch required.

Return:

{
  "summary": "repair summary",
  "edits": [
    {
      "filePath": "relative/path.ts",
      "targetContent": "EXACT existing content",
      "replacementContent": "corrected content",
      "reason": "reason for correction"
    }
  ]
}

Rules:

- targetContent must exactly exist.
- Do not touch secrets.
- Do not touch .git.
- Do not touch node_modules.
- Do not introduce unrelated changes.
- Do not execute commands.
- Fix the failure rather than hiding it.
`;

    const response =
      await callGeminiResilient({
        contents: prompt,
        systemInstruction:
          "You repair software using minimal deterministic patches. Return valid JSON only.",
        temperature: 0.05,
        responseMimeType:
          "application/json",
      });

    return this.parsePlan(
      response,
    );
  }

  private parsePlan(
    raw: string,
  ): GeneratedPlan {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(
        "Coding model returned invalid JSON.",
      );
    }

    if (
      !parsed ||
      typeof parsed !== "object"
    ) {
      throw new Error(
        "Coding model returned an invalid plan.",
      );
    }

    const candidate =
      parsed as Record<
        string,
        unknown
      >;

    const edits =
      Array.isArray(
        candidate.edits,
      )
        ? candidate.edits
        : [];

    const normalized: GeneratedEdit[] =
      edits
        .filter(
          (item): item is Record<string, unknown> =>
            Boolean(
              item &&
              typeof item ===
                "object",
            ),
        )
        .map((item) => ({
          filePath:
            String(
              item.filePath ??
                "",
            ),
          targetContent:
            String(
              item.targetContent ??
                "",
            ),
          replacementContent:
            String(
              item.replacementContent ??
                "",
            ),
          reason:
            String(
              item.reason ??
                "AI-generated change",
            ),
        }))
        .filter(
          (edit) =>
            edit.filePath &&
            edit.targetContent,
        );

    return {
      summary:
        String(
          candidate.summary ??
            "Autonomous implementation plan",
        ),
      edits: normalized,
    };
  }

  private buildRepositoryContext(
    inspection: {
      files: string[];
      directories: string[];
      packageJson: any | null;
    },
  ): string {
    const importantFiles =
      inspection.files
        .filter(
          (file) =>
            /\.(ts|tsx|js|jsx|json|md|css)$/i.test(
              file,
            ),
        )
        .slice(0, 120);

    return [
      `Files:`,
      ...importantFiles,
      "",
      `Directories:`,
      ...inspection.directories.slice(
        0,
        80,
      ),
      "",
      `package.json:`,
      JSON.stringify(
        inspection.packageJson,
        null,
        2,
      ),
    ].join("\n");
  }

  private formatFailure(
    label: string,
    stdout: string,
    stderr: string,
  ): string {
    const output = [
      stdout,
      stderr,
    ]
      .filter(Boolean)
      .join("\n")
      .slice(-20_000);

    return `${label}:\n${output}`;
  }

  private async execute(
    task: AutonomousDevelopmentTask,
    command: string,
    timeoutMs: number,
  ) {
    const result =
      await ruffloHarness.executeCommand(
        {
          id:
            task.id ??
            "autonomous-task",

          agentId:
            task.agentId,

          organizationId:
            task.organizationId,

          objective:
            task.objective,

          workspace:
            task.workspace,

          timeoutMs,
        },

        command,
      );

    return {
      success:
        result.success,

      exitCode:
        typeof result.data === "object" &&
        result.data !== null &&
        "exitCode" in result.data
          ? Number(
              (result.data as any).exitCode,
            )
          : null,

      stdout:
        typeof result.data === "object" &&
        result.data !== null &&
        "stdout" in result.data
          ? String(
              (result.data as any).stdout,
            )
          : "",

      stderr:
        typeof result.data === "object" &&
        result.data !== null &&
        "stderr" in result.data
          ? String(
              (result.data as any).stderr,
            )
          : result.error?.message ?? "",

      durationMs:
        result.executionTimeMs ?? 0,

      timedOut:
        typeof result.data === "object" &&
        result.data !== null &&
        "timedOut" in result.data
          ? Boolean(
              (result.data as any).timedOut,
            )
          : false,

      error:
        result.error,
    };
  }
}

export const autonomousLifecycle =
  new AutonomousLifecycle();
