import { companyDb, AgentContract } from "../../src/db/companyDb.ts";
import { callGeminiResilient } from "../ai/geminiService.ts";
import { eventBus } from "../events/eventBus.ts";

export interface OrchestraStep {
  stepNumber: number;
  agentId: string;
  agentName: string;
  taskTitle: string;
  taskDescription: string;
  expectedDeliverable: string;
}

export interface OrchestraExecutionResult {
  stepNumber: number;
  agentId: string;
  agentName: string;
  taskTitle: string;
  status: "proposal_only" | "failed";
  output: string;
  codeSnippet?: string;
  latencyMs: number;
}

export interface OrchestraPlan {
  objective: string;
  supervisionBy: string; // usually Michael Scott
  steps: OrchestraStep[];
}

export class AgentOrchestra {
  /**
   * Orchestrates a multi-agent task execution sequence by uploading and mapping agent profiles,
   * injecting complete enterprise context data, planning the sequential decomposition via Gemini,
   * and executing each phase securely in the backend.
   */
  public static async executeOrchestra(
    prompt: string,
    options: { projectId?: string; requestedBy?: string } = {}
  ): Promise<{
    success: boolean;
    objective: string;
    supervisionBy: string;
    totalSteps: number;
    plan: OrchestraStep[];
    executions: OrchestraExecutionResult[];
    consolidatedSummary: string;
    status: "proposal_only" | "unavailable";
    taskExecuted: false;
    error?: string;
    metrics: {
      totalDurationMs: number;
    };
  }> {
    const startTime = Date.now();
    const projectId = options.projectId || "prj-alpha";
    const requestedBy = options.requestedBy || "Administrator";

    // 1. Load Fleet (Details of EVERY agent are uploaded here)
    const fleet: AgentContract[] = companyDb.getAgents();

    // 2. Load Enterprise Context (All data available in the backend)
    const recentTasks = companyDb.getTasks().slice(-10);
    const recentAudits = companyDb.getAudits().slice(-10);
    const accounts = companyDb.getAccounts();
    const floors = companyDb.getFloors();
    
    // Summary of the current corporate database state
    const dataContextSummary = {
      activeAgentCount: fleet.length,
      recentTasksCount: recentTasks.length,
      recentAuditsCount: recentAudits.length,
      mrr: companyDb.getOrganization()?.mrr ?? null,
      totalAccounts: accounts.length,
      buildingFloors: floors.map(f => ({ level: f.level, name: f.name, status: f.status })),
    };

    // Format the agent directory for the LLM Coordinator
    const agentDirectory = fleet.map(a => ({
      id: a.id,
      name: a.name,
      role: a.role,
      department: a.department,
      authorityLevel: a.authorityLevel,
      skills: a.skills,
      permissions: a.permissions,
      status: a.status
    }));

    eventBus.emitEvent("ORCHESTRA_INGESTED", {
      projectId,
      message: `Agent Orchestra activated for high-level objective: "${prompt}"`,
      agentId: "michael"
    });

    // 3. Decompose and Plan the Orchestra Sequence
    const plannerPrompt = `You are the AI Orchestra Conductor (operating under Michael Scott / GOD mode supervision).
Your objective is to decompose this high-level enterprise task: "${prompt}"

We have uploaded details of every active agent in the fleet:
${JSON.stringify(agentDirectory, null, 2)}

We have also uploaded the current enterprise state/data context:
${JSON.stringify(dataContextSummary, null, 2)}

Your goal is to formulate a structured multi-agent coordination plan (with 3 to 5 steps max) where you delegate sub-tasks to the most appropriate agents based strictly on their roles, skills, and permissions.

You must output STRICTLY a JSON object matching this exact schema (do not include any conversational text or markdown wrappers except the JSON):
{
  "supervisionBy": "michael",
  "steps": [
    {
      "stepNumber": 1,
      "agentId": "agent-id",
      "agentName": "Agent Name",
      "taskTitle": "Short Title for Step",
      "taskDescription": "Detailed instructions for this agent to execute",
      "expectedDeliverable": "What this agent must produce"
    }
  ]
}`;

    let planRaw = "";
    let orchestraPlan: OrchestraPlan = {
      objective: prompt,
      supervisionBy: "michael",
      steps: []
    };

    try {
      planRaw = await callGeminiResilient({
        contents: plannerPrompt,
        systemInstruction: "You are the automated AI Fleet Conductor. Output strictly in valid JSON format.",
        responseMimeType: "application/json"
      });
      const parsedPlan = JSON.parse(planRaw);
      if (!Array.isArray(parsedPlan.steps) || parsedPlan.steps.length === 0 || parsedPlan.steps.length > 5) {
        throw new Error("The planner returned no valid steps or exceeded the five-step limit.");
      }
      orchestraPlan.steps = parsedPlan.steps;
      orchestraPlan.supervisionBy = parsedPlan.supervisionBy || "michael";
      for (const [index, step] of orchestraPlan.steps.entries()) {
        const assignedAgent = fleet.find((agent) => agent.id === step.agentId && agent.status === "active");
        if (
          typeof step.agentId !== "string" ||
          typeof step.taskTitle !== "string" ||
          !step.taskTitle.trim() ||
          typeof step.taskDescription !== "string" ||
          !step.taskDescription.trim() ||
          typeof step.expectedDeliverable !== "string" ||
          !step.expectedDeliverable.trim() ||
          !assignedAgent
        ) {
          throw new Error("The planner assigned a step to an unknown or inactive agent, or returned an invalid step.");
        }
        step.stepNumber = index + 1;
        step.agentName = assignedAgent.name;
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      console.error("[Orchestra Planner] Unable to create a validated plan:", error);
      return {
        success: false,
        objective: prompt,
        supervisionBy: orchestraPlan.supervisionBy,
        totalSteps: 0,
        plan: [],
        executions: [],
        consolidatedSummary: "No plan was created and no tasks were executed because planning did not complete successfully.",
        status: "unavailable",
        taskExecuted: false,
        error,
        metrics: { totalDurationMs: Date.now() - startTime },
      };
    }

    eventBus.emitEvent("ORCHESTRA_PLAN_CREATED", {
      projectId,
      message: `Proposal plan created with ${orchestraPlan.steps.length} steps. No task execution has started.`,
      agentId: "michael",
      details: orchestraPlan
    });

    // 4. Sequential Execution Phase
    const executions: OrchestraExecutionResult[] = [];
    const stepsHistory: Record<number, { output: string; codeSnippet?: string }> = {};
    let accumulatedContext = `High-level Objective: ${prompt}\n\n`;

    for (const step of orchestraPlan.steps) {
      const stepStartTime = Date.now();
      const agentProfile = fleet.find(a => a.id === step.agentId && a.status === "active");
      if (!agentProfile) {
        throw new Error(`Planned agent ${step.agentId} is no longer active.`);
      }

      // Resolve Budibase-style template bindings in description & deliverables
      const resolvedDescription = AgentOrchestra.resolveContextBindings(step.taskDescription, stepsHistory, { prompt });
      const resolvedDeliverable = AgentOrchestra.resolveContextBindings(step.expectedDeliverable, stepsHistory, { prompt });

      eventBus.emitEvent("ORCHESTRA_STEP_PROPOSAL_STARTED", {
        projectId,
        message: `Generating a model proposal for step ${step.stepNumber}/${orchestraPlan.steps.length}: "${step.taskTitle}" for ${step.agentName}.`,
        agentId: step.agentId,
        taskId: `orchestra-step-${step.stepNumber}`
      });

      const agentSystemInstruction = `You are ${step.agentName}, your role in the company is: ${agentProfile.role}.
Department: ${agentProfile.department}
Clearance Level: ${agentProfile.authorityLevel}
Your Custom Capabilities: ${agentProfile.skills.join(", ")}

You are drafting a proposal for Step #${step.stepNumber} of an AI Agent Orchestra process.
Proposed Task: "${step.taskTitle}"
Description: ${resolvedDescription}
Expected Deliverable: ${resolvedDeliverable}

Accumulated context from previous steps:
${accumulatedContext}

Describe the proposed work and any needed prerequisites in detail. Do not claim to have executed actions, changed files, contacted external services, or verified outcomes. If you suggest code, wrap it in a markdown code block; the code will not be applied by this workflow.`;

      let agentOutput = "";
      let agentCodeSnippet = undefined;

      try {
        agentOutput = await callGeminiResilient({
          contents: `Draft a proposal for "${step.taskTitle}" based on the previous context.`,
          systemInstruction: agentSystemInstruction,
          temperature: 0.6
        });

        // Extract code snippet if present
        const codeMatch = agentOutput.match(/```(?:typescript|javascript|tsx|jsx|json|py|bash)?([\s\S]*?)```/);
        if (codeMatch && codeMatch[1]) {
          agentCodeSnippet = codeMatch[1].trim();
        }
      } catch (err: any) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Orchestra Step] Proposal generation failed for ${step.agentName}:`, message);
        agentOutput = `Proposal generation failed: ${message}`;
      }

      // Store in history for subsequent steps to bind to
      stepsHistory[step.stepNumber] = {
        output: agentOutput,
        codeSnippet: agentCodeSnippet
      };

      const stepDurationMs = Date.now() - stepStartTime;
      accumulatedContext += `\n--- [Step ${step.stepNumber} Proposal for ${step.agentName}] ---\nOutput:\n${agentOutput}\n\n`;

      // Persist proposals as blocked tasks; no operational tool ran in this workflow.
      const tskId = `orch-${Date.now()}-${step.stepNumber}`;
      companyDb.addTask({
        id: tskId,
        projectId,
        title: `Orchestra Step ${step.stepNumber}: ${step.taskTitle}`,
        description: step.taskDescription,
        assignedTo: step.agentId,
        status: agentOutput.startsWith("Proposal generation failed:") ? "failed" : "blocked",
        progress: 0,
        priority: "high",
        output: `MODEL PROPOSAL ONLY — no operational action was performed.\n\n${agentOutput}`,
        codeSnippet: agentCodeSnippet,
        evidence: [],
        subtasks: [],
        createdAt: Date.now(),
      });

      companyDb.logAudit({
        id: `aud-orch-${Date.now()}-${step.stepNumber}`,
        agentId: step.agentId,
        projectId,
        taskId: tskId,
        tool: "orchestra.step",
        action: `Generated proposal for plan step: "${step.taskTitle}"`,
        inputHash: Buffer.from(step.taskDescription).toString("base64").slice(0, 20),
        result: agentOutput.startsWith("Proposal generation failed:")
          ? `FAILED: ${agentOutput}`
          : "PROPOSAL_ONLY: Model response generated; no tools or external actions were executed.",
        timestamp: new Date().toISOString(),
        riskLevel: "low",
        approvalRequired: false,
        executionId: `ex-orch-${Date.now()}`
      });

      executions.push({
        stepNumber: step.stepNumber,
        agentId: step.agentId,
        agentName: step.agentName,
        taskTitle: step.taskTitle,
        status: agentOutput.startsWith("Proposal generation failed:") ? "failed" : "proposal_only",
        output: agentOutput,
        codeSnippet: agentCodeSnippet,
        latencyMs: stepDurationMs
      });

      eventBus.emitEvent("ORCHESTRA_STEP_PROPOSED", {
        projectId,
        message: `Step ${step.stepNumber}/${orchestraPlan.steps.length} proposal generated for ${step.agentName} in ${stepDurationMs}ms; no task execution was verified.`,
        agentId: step.agentId,
        taskId: tskId,
        outputLength: agentOutput.length
      });
    }

    // 5. Summarize the proposal state without inventing execution outcomes.
    const totalDurationMs = Date.now() - startTime;
    const proposalCount = executions.filter((execution) => execution.status === "proposal_only").length;
    const failedCount = executions.length - proposalCount;
    const consolidatedSummary = [
      `## Proposal-only workflow`,
      ``,
      `Objective: ${prompt}`,
      `Status: ${proposalCount > 0 ? "Model proposals generated; no task was executed or verified." : "Proposal generation unavailable; no task was executed."}`,
      `Proposals generated: ${proposalCount}`,
      `Proposal generation failures: ${failedCount}`,
      ``,
      ...executions.map((execution) =>
        `### Step ${execution.stepNumber}: ${execution.taskTitle}\n\nAssigned agent: ${execution.agentName}\n\nStatus: ${execution.status}\n\n${execution.output}`,
      ),
    ].join("\n");

    companyDb.logAudit({
      id: `aud-orch-summary-${Date.now()}`,
      agentId: "michael",
      projectId,
      tool: "orchestra.summary",
      action: `Generated AI Agent Orchestra proposals: "${prompt.slice(0, 50)}..."`,
      inputHash: Buffer.from(prompt).toString("base64").slice(0, 20),
      result: `PROPOSAL_ONLY: Generated ${proposalCount} model proposals and had ${failedCount} proposal failures in ${totalDurationMs}ms. No tasks were executed.`,
      timestamp: new Date().toISOString(),
      riskLevel: "medium",
      approvalRequired: false,
      executionId: `ex-orch-sum-${Date.now()}`
    });

    eventBus.emitEvent("ORCHESTRA_PROPOSALS_READY", {
      projectId,
      message: `Agent proposals are ready. No operational tasks were executed. Total steps: ${orchestraPlan.steps.length}`,
      agentId: "michael",
      totalDurationMs
    });

    return {
      success: false,
      objective: prompt,
      supervisionBy: orchestraPlan.supervisionBy,
      totalSteps: orchestraPlan.steps.length,
      plan: orchestraPlan.steps,
      executions,
      consolidatedSummary,
      status: proposalCount > 0 ? "proposal_only" : "unavailable",
      taskExecuted: false,
      metrics: {
        totalDurationMs,
      }
    };
  }

  /**
   * Resolves Budibase-style template bindings, e.g., {{ steps.1.output }} or {{ trigger.prompt }}
   * Adapted from Budibase's custom bindings & context evaluation logic.
   */
  public static resolveContextBindings(
    text: string,
    stepsHistory: Record<number, { output: string; codeSnippet?: string }>,
    initialPayload: any
  ): string {
    if (!text) return "";
    return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, path) => {
      const parts = path.split(".");
      if (parts[0] === "trigger") {
        const val = initialPayload[parts[1]];
        return val !== undefined ? String(val) : match;
      }
      if (parts[0] === "steps") {
        const stepNum = parseInt(parts[1], 10);
        const stepData = stepsHistory[stepNum];
        if (stepData) {
          if (parts[2] === "output") {
            return stepData.output;
          }
          if (parts[2] === "codeSnippet") {
            return stepData.codeSnippet || "";
          }
        }
        return match;
      }
      if (parts[0] === "system") {
        if (parts[1] === "currentTime") {
          return new Date().toISOString();
        }
      }
      return match;
    });
  }
}
