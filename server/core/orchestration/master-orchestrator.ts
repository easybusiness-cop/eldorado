/**
 * Master Orchestrator
 * Hierarchical multi-agent planning, execution, and critique loop.
 * Open-source composition style – pure TypeScript + existing ToolGateway + CapabilityRegistry.
 */

import { toolGateway } from "../../../apps/control-plane/integrations/gateway/tool.gateway";
import { CapabilityRegistry } from "../../../apps/control-plane/integrations/registry/capability.registry";
import { randomUUID } from "node:crypto";
import { knowledgeGraph } from "../memory/knowledge-graph";
import { SoftwareBuilder } from "../builder/software-builder";

export type OrchestratorRole =
  | "planner"
  | "researcher"
  | "coder"
  | "executor"
  | "critic"
  | "synthesizer";

export interface OrchestratorStep {
  id: string;
  role: OrchestratorRole;
  agentId: string;
  objective: string;
  tool?: string;
  action?: string;
  parameters?: Record<string, any>;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  result?: any;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface OrchestratorPlan {
  id: string;
  originalObjective: string;
  createdAt: string;
  status: "planning" | "executing" | "critiquing" | "completed" | "failed";
  steps: OrchestratorStep[];
  finalAnswer?: string;
  critique?: string;
  metadata: {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
  };
}

export interface RunOrchestratorOptions {
  objective: string;
  requestedBy?: string;          // human or agent who started it
  organizationId?: string;
  maxSteps?: number;
  preferredAgents?: Partial<Record<OrchestratorRole, string>>;
}

export class MasterOrchestrator {
  private static readonly DEFAULT_AGENTS: Record<OrchestratorRole, string> = {
    planner: "michael",
    researcher: "stanley",
    coder: "ruflo",
    executor: "pete",
    critic: "toby",
    synthesizer: "michael",
  };

  /**
   * Main entry point – create a plan and execute it
   */
  static async run(options: RunOrchestratorOptions): Promise<OrchestratorPlan> {
    const {
      objective,
      requestedBy = "system",
      organizationId = "org-munderdifflin",
      maxSteps = 8,
      preferredAgents = {},
    } = options;

    const planId = `orch-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const agents = { ...this.DEFAULT_AGENTS, ...preferredAgents };

    // 1. Create high-level plan
    const steps = this.createPlan(objective, agents, maxSteps);

    const plan: OrchestratorPlan = {
      id: planId,
      originalObjective: objective,
      createdAt: new Date().toISOString(),
      status: "executing",
      steps,
      metadata: {
        totalSteps: steps.length,
        completedSteps: 0,
        failedSteps: 0,
      },
    };

    // 2. Execute steps sequentially (can be parallelized later)
    for (const step of plan.steps) {
      step.status = "running";
      step.startedAt = new Date().toISOString();

      try {
        const result = await this.executeStep(step, organizationId, plan);
        step.result = result;
        step.status = "completed";
        plan.metadata.completedSteps += 1;
      } catch (err: any) {
        step.error = err.message || String(err);
        step.status = "failed";
        plan.metadata.failedSteps += 1;

        // Critical failure stops the plan early
        if (step.role === "planner" || step.role === "coder") {
          plan.status = "failed";
          plan.finalAnswer = `Orchestration failed at ${step.role} step: ${step.error}`;
          break;
        }
      } finally {
        step.finishedAt = new Date().toISOString();
      }
    }

    // 3. Critique + Synthesis (if we still have a viable plan)
    if (plan.status !== "failed") {
      plan.status = "critiquing";
      const critique = this.generateCritique(plan);
      plan.critique = critique;

      plan.finalAnswer = this.synthesizeFinalAnswer(plan, critique);
      plan.status = "completed";
    }

    // Persist episode into long-term memory
    knowledgeGraph.addEpisode({
      agentId: options.requestedBy || "system",
      objective: options.objective,
      summary: plan.finalAnswer?.slice(0, 1500) || plan.status,
      outcome: plan.status === "completed" ? "success" : "failure",
      planId: plan.id,
      tags: ["orchestrator", plan.status],
    });

    return plan;
  }

  /**
   * Creates a structured multi-step plan from the objective
   */
  private static createPlan(
    objective: string,
    agents: Record<OrchestratorRole, string>,
    maxSteps: number
  ): OrchestratorStep[] {
    const lower = objective.toLowerCase();
    const steps: OrchestratorStep[] = [];

    // Always start with planning
    steps.push({
      id: `step-${randomUUID().slice(0, 8)}`,
      role: "planner",
      agentId: agents.planner,
      objective: `Break down this objective into clear actionable steps: "${objective}"`,
      status: "pending",
    });

    const needsResearch =
      lower.includes("research") ||
      lower.includes("find") ||
      lower.includes("what is") ||
      lower.includes("how does") ||
      lower.includes("compare") ||
      lower.includes("latest") ||
      lower.includes("search");

    const needsBuild =
      lower.includes("build") ||
      lower.includes("create") ||
      lower.includes("implement") ||
      lower.includes("write") ||
      lower.includes("develop") ||
      lower.includes("generate") ||
      lower.includes("make a") ||
      lower.includes("code") ||
      lower.includes("module") ||
      lower.includes("component") ||
      lower.includes("utility") ||
      lower.includes("service") ||
      lower.includes("class") ||
      lower.includes("function");

    if (needsResearch) {
      steps.push({
        id: `step-${randomUUID().slice(0, 8)}`,
        role: "researcher",
        agentId: agents.researcher,
        objective: `Perform multi-hop research on: "${objective}"`,
        tool: "google-search",
        action: "multi_hop_research",
        parameters: { query: objective, maxPages: 3 },
        status: "pending",
      });
    }

    if (needsBuild) {
      // This special step will be handled by SoftwareBuilder
      steps.push({
        id: `step-${randomUUID().slice(0, 8)}`,
        role: "coder",
        agentId: agents.coder,
        objective: `Build real software files for: "${objective}"`,
        status: "pending",
        // We mark it so executeStep knows to call SoftwareBuilder
        parameters: { __useSoftwareBuilder: true, language: "typescript" },
      });
    } else if (
      lower.includes("code") ||
      lower.includes("script") ||
      lower.includes("run")
    ) {
      // Lightweight coding without full builder
      steps.push({
        id: `step-${randomUUID().slice(0, 8)}`,
        role: "coder",
        agentId: agents.coder,
        objective: `Design and write the required code for: "${objective}"`,
        status: "pending",
      });

      steps.push({
        id: `step-${randomUUID().slice(0, 8)}`,
        role: "executor",
        agentId: agents.executor,
        objective: `Execute and validate the generated code for: "${objective}"`,
        tool: "code-execution",
        action: "run_javascript",
        parameters: {},
        status: "pending",
      });
    }

    // Always end with critic + synthesizer
    steps.push({
      id: `step-${randomUUID().slice(0, 8)}`,
      role: "critic",
      agentId: agents.critic,
      objective: `Review the results and identify gaps or risks for: "${objective}"`,
      status: "pending",
    });

    steps.push({
      id: `step-${randomUUID().slice(0, 8)}`,
      role: "synthesizer",
      agentId: agents.synthesizer,
      objective: `Produce the final high-quality answer for: "${objective}"`,
      status: "pending",
    });

    return steps.slice(0, maxSteps);
  }

  /**
   * Executes a single step (calls ToolGateway when a tool is declared)
   */
  private static async executeStep(
    step: OrchestratorStep,
    organizationId: string,
    plan: OrchestratorPlan
  ): Promise<any> {
    // Special path: full Software Builder
    if (step.role === "coder" && step.parameters?.__useSoftwareBuilder) {
      const buildResult = await SoftwareBuilder.build({
        objective: plan.originalObjective,
        agentId: step.agentId,
        organizationId,
        language: (step.parameters.language as any) || "typescript",
        targetDir: "modules",
      });

      if (buildResult.status === "failed") {
        throw new Error(buildResult.error || "SoftwareBuilder failed");
      }

      return {
        builder: true,
        buildId: buildResult.id,
        files: buildResult.files.map((f) => ({
          path: f.path,
          description: f.description,
          preview: f.content.slice(0, 500),
        })),
        integrationNotes: buildResult.integrationNotes,
        executionResult: buildResult.executionResult,
        message: `Successfully built ${buildResult.files.length} file(s)`,
      };
    }

    // Normal tool call
    if (step.tool && step.action) {
      if (step.role === "executor" && step.tool === "code-execution") {
        const coderStep = plan.steps.find((s) => s.role === "coder" && s.status === "completed");
        if (coderStep?.result?.code) {
          step.parameters = {
            code: coderStep.result.code,
            timeoutMs: 8000,
            allowConsole: true,
          };
        } else if (coderStep?.result?.files?.[0]?.preview) {
          // Use the first generated file from SoftwareBuilder if available
          step.parameters = {
            code: coderStep.result.files[0].preview,
            timeoutMs: 8000,
            allowConsole: true,
          };
        } else {
          step.parameters = {
            code: `
              const message = "Executor step reached.";
              __result = { ok: true, message };
              console.log(message);
            `,
          };
        }
      }

      const gatewayResult = await toolGateway.execute({
        agentId: step.agentId,
        organizationId,
        tool: step.tool,
        action: step.action,
        parameters: step.parameters || {},
        reason: step.objective,
      });

      if (!gatewayResult.success) {
        throw new Error(gatewayResult.error || "ToolGateway execution failed");
      }

      return gatewayResult.data;
    }

    // Pure reasoning steps
    return this.simulateReasoning(step, plan);
  }

  /**
   * Lightweight reasoning simulation (can later be replaced by real LLM calls)
   */
  private static simulateReasoning(step: OrchestratorStep, plan: OrchestratorPlan): any {
    const obj = plan.originalObjective;

    switch (step.role) {
      case "planner":
        return {
          planSummary: `High-level plan created for: "${obj}"`,
          recommendedPhases: ["Research", "Design", "Implement", "Validate", "Synthesize"],
          notes: "Plan generated by Master Orchestrator",
        };

      case "coder":
        // Produce a small example so the executor has something real to run
        return {
          language: "javascript",
          code: `
            // Auto-generated by Master Orchestrator (Coder step)
            function solve() {
              const objective = ${JSON.stringify(obj)};
              const result = {
                success: true,
                objective,
                message: "Code executed successfully inside sandbox",
                timestamp: new Date().toISOString()
              };
              __result = result;
              console.log("Orchestrator coder output:", JSON.stringify(result));
              return result;
            }
            solve();
          `,
          explanation: `Generated a runnable JavaScript snippet for objective: ${obj}`,
        };

      case "critic":
        const failed = plan.steps.filter((s) => s.status === "failed").length;
        const completed = plan.steps.filter((s) => s.status === "completed").length;
        return {
          critique: failed > 0
            ? `Found ${failed} failed step(s). Review required.`
            : `All executed steps completed successfully (${completed} steps).`,
          riskLevel: failed > 0 ? "MEDIUM" : "LOW",
          recommendations: failed > 0
            ? ["Re-run failed steps", "Increase research depth", "Add more validation"]
            : ["Proceed to final synthesis"],
        };

      case "synthesizer":
        return {
          finalSummary: `Orchestration completed for objective: "${obj}"`,
          keyOutcomes: plan.steps
            .filter((s) => s.status === "completed")
            .map((s) => `${s.role}: success`),
        };

      default:
        return { message: `Step ${step.role} completed`, objective: step.objective };
    }
  }

  private static generateCritique(plan: OrchestratorPlan): string {
    const failed = plan.steps.filter((s) => s.status === "failed");
    const completed = plan.steps.filter((s) => s.status === "completed");

    if (failed.length === 0) {
      return `Critique: All ${completed.length} steps completed successfully. Ready for final answer.`;
    }

    return `Critique: ${failed.length} step(s) failed → ${failed.map((f) => f.role).join(", ")}. Review errors before accepting final answer.`;
  }

  private static synthesizeFinalAnswer(plan: OrchestratorPlan, critique: string): string {
    const lines: string[] = [
      `### Master Orchestrator Result`,
      ``,
      `**Objective:** ${plan.originalObjective}`,
      ``,
      `**Status:** ${plan.status}`,
      ``,
      `**Critique:** ${critique}`,
      ``,
      `**Steps:**`,
    ];

    for (const step of plan.steps) {
      lines.push(
        `- [${step.status.toUpperCase()}] ${step.role} (${step.agentId}): ${step.objective.slice(0, 80)}${step.objective.length > 80 ? "..." : ""}`
      );
    }

    // Pull useful data from research / code / builder steps
    const research = plan.steps.find((s) => s.role === "researcher" && s.status === "completed");
    if (research?.result?.synthesis) {
      lines.push(``, `**Research Synthesis:**`, research.result.synthesis.slice(0, 1500));
    }

    const builderStep = plan.steps.find((s) => s.role === "coder" && s.result?.builder);
    if (builderStep?.result) {
      lines.push(``, `**Software Builder Result:**`);
      lines.push(`- Build ID: ${builderStep.result.buildId}`);
      lines.push(`- Files created: ${builderStep.result.files?.length || 0}`);
      if (builderStep.result.files) {
        for (const f of builderStep.result.files) {
          lines.push(`  - \`${f.path}\` — ${f.description}`);
        }
      }
      if (builderStep.result.integrationNotes) {
        lines.push(`- Integration notes: ${builderStep.result.integrationNotes.join(" | ")}`);
      }
    }

    const coder = plan.steps.find((s) => s.role === "coder" && s.status === "completed");
    if (coder?.result?.code) {
      lines.push(``, `**Generated Code Preview:**`, "```javascript", coder.result.code.slice(0, 800), "```");
    }

    const executor = plan.steps.find((s) => s.role === "executor" && s.status === "completed");
    if (executor?.result) {
      lines.push(``, `**Execution Result:**`, "```json", JSON.stringify(executor.result, null, 2).slice(0, 600), "```");
    }

    lines.push(``, `---`, `Generated by Rufflo Master Orchestrator`);
    return lines.join("\n");
  }
}
