import fs from "fs";
import path from "path";
import { companyDb, AgentContract, DBTask, ProjectPortfolio, AuditEvent } from "../db/companyDb.ts";
import { isSoftwareEngineerAgent } from "../../apps/control-plane/integrations/gateway/tool.gateway.ts";
import { repositoryEngineer } from "../../server/agents/repository/repository-engineer.ts";
import { modelRouter } from "../../server/ai/providers/index.ts";
import {
  ENGINEERING_AGENT_PLAYBOOK,
  isEngineeringRelatedAgent,
} from "../constants/engineeringCompetencies.ts";

export function isEngineeringTask(task: { title: string; description: string }): boolean {
  const text = `${task.title} ${task.description}`.toLowerCase();
  const engKeywords = [
    "code",
    "coder",
    "script",
    "program",
    "build",
    "compile",
    "patch",
    "hot-patch",
    "debug",
    "repository",
    "git",
    "vite",
    "npm",
    "vm",
    "software",
    "function",
    "develop",
    "component",
    "refactor",
    "algorithm",
    "api architect",
    "typescript",
    "javascript",
    "react",
    "hotpatch"
  ];
  return engKeywords.some((kw) => text.includes(kw));
}

// ----------------------------------------------------------------------
// Types for the Agent Execution Loop
// ----------------------------------------------------------------------
export interface IngestTaskParams {
  id?: string;
  projectId: string;
  missionId?: string;
  title: string;
  description: string;
  assignedTo: string; // Employee ID
  priority?: "low" | "medium" | "high" | "critical";
  organizationId?: string;
  userProfile?: {
    username?: string;
    displayName?: string;
    role?: string;
  };
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  approvalRequired: boolean;
}

// ----------------------------------------------------------------------
// Agent Execution Loop Service Class
// ----------------------------------------------------------------------
export class AgentExecutionLoopService {
  /**
   * 1. Perform strict multi-parameter permissions & authority checks
   */
  public static checkPermissions(
    agent: AgentContract,
    project: ProjectPortfolio,
    task: { title: string; description: string; priority: string }
  ): PermissionCheckResult {
    // A: Check status
    if (agent.status !== "active") {
      return {
        allowed: false,
        reason: `Employee ${agent.name} is currently ${agent.status} and cannot be assigned tasks.`,
        riskLevel: "medium",
        approvalRequired: false,
      };
    }

    // B: Check authority level based on task priority
    const requiredAuthorityMap: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 5,
    };
    const requiredAuthority = requiredAuthorityMap[task.priority] || 1;

    if (agent.authorityLevel < requiredAuthority) {
      return {
        allowed: false,
        reason: `Insufficient authority level. Employee authority: ${agent.authorityLevel}, required: ${requiredAuthority} for ${task.priority}-priority tasks.`,
        riskLevel: "high",
        approvalRequired: true,
      };
    }

    // C: Check filesystem access if task description indicates workspace writes
    const descLower = (task.title + " " + task.description).toLowerCase();
    const indicatesWrite =
      descLower.includes("write") ||
      descLower.includes("create") ||
      descLower.includes("delete") ||
      descLower.includes("modify") ||
      descLower.includes("patch") ||
      descLower.includes("save") ||
      descLower.includes("file") ||
      descLower.includes("develop");

    if (indicatesWrite && agent.permissions.filesystem === "none") {
      return {
        allowed: false,
        reason: `Employee ${agent.name} is restricted from performing filesystem write or modification actions.`,
        riskLevel: "high",
        approvalRequired: true,
      };
    }

    // D: Check production deployment permissions
    const indicatesDeploy = descLower.includes("deploy") || descLower.includes("rollout") || descLower.includes("release");
    if (indicatesDeploy && !agent.permissions.production) {
      return {
        allowed: false,
        reason: `Employee ${agent.name} is unauthorized to execute deployments or trigger production releases.`,
        riskLevel: "critical",
        approvalRequired: true,
      };
    }

    // E: If secrets access is scoped/none but task mentions secrets/api keys
    const indicatesSecrets = descLower.includes("secret") || descLower.includes("api_key") || descLower.includes("credential") || descLower.includes("password");
    if (indicatesSecrets && agent.permissions.secrets === "none") {
      return {
        allowed: false,
        reason: `Security Violation: Employee ${agent.name} does not have credentials or secrets access capabilities.`,
        riskLevel: "critical",
        approvalRequired: true,
      };
    }

    // F: RESTRICT ENGINEERING CAPABILITIES TO SOFTWARE ENGINEER AGENTS ONLY
    const taskRequiresEngineering = isEngineeringTask(task);
    const isEngineer = isSoftwareEngineerAgent(agent);
    if (taskRequiresEngineering && !isEngineer) {
      return {
        allowed: false,
        reason: `Engineering capabilities (code generation, code modification, build tools, compiler access, VM sandbox execution) are strictly restricted to Software Engineer agents. Non-engineering employee ${agent.name} (${agent.role}) in department "${agent.department || (agent as any).departmentId || 'General'}" cannot execute engineering tasks.`,
        riskLevel: "high",
        approvalRequired: true,
      };
    }

    return {
      allowed: true,
      riskLevel: task.priority === "critical" ? "critical" : task.priority === "high" ? "high" : task.priority === "medium" ? "medium" : "low",
      approvalRequired: task.priority === "critical",
    };
  }

  /**
   * 2. Ingest, validate and trigger asynchronous execution loop
   */
  public static async executeTask(params: IngestTaskParams): Promise<{
    success: boolean;
    task: DBTask;
    auditLog: AuditEvent;
    permissionCheck: PermissionCheckResult;
  }> {
    const taskId = params.id || `tsk-${Date.now()}`;
    const priority = params.priority || "medium";
    
    // A: Retrieve Project context from database
    const projects = companyDb.getProjects();
    const project = projects.find((p) => p.id === params.projectId);
    if (!project) {
      throw new Error(`Project with ID ${params.projectId} not found in corporate portfolio.`);
    }

    // B: Retrieve Employee context from database
    const agents = companyDb.getAgentsList();
    const agent = agents.find((e) => e.id === params.assignedTo);
    if (!agent) {
      throw new Error(`Employee with ID ${params.assignedTo} not found in company roster.`);
    }

    // C: Build standard task object
    const taskObj: DBTask & { organizationId?: string } = {
      id: taskId,
      projectId: params.projectId,
      missionId: params.missionId,
      title: params.title,
      description: params.description,
      assignedTo: params.assignedTo,
      status: "queued",
      progress: 0,
      priority,
      organizationId: params.organizationId,
      subtasks: [
        { id: `${taskId}-sub-1`, title: "Security and authority check", completed: false, assignedTo: params.assignedTo },
        { id: `${taskId}-sub-2`, title: "Context synthesis & LLM execution", completed: false, assignedTo: params.assignedTo },
        { id: `${taskId}-sub-3`, title: "Logging metrics & auditing results", completed: false, assignedTo: params.assignedTo }
      ],
      createdAt: Date.now(),
    };

    // D: Perform permission checks
    const permResult = this.checkPermissions(agent, project, {
      title: params.title,
      description: params.description,
      priority,
    });

    const executionId = `ex-${Date.now()}`;
    const auditObj: AuditEvent = {
      id: `aud-${Date.now()}`,
      agentId: agent.id,
      projectId: project.id,
      taskId,
      tool: "agent.execution_loop",
      action: `Task Ingestion: "${params.title.slice(0, 50)}"`,
      inputHash: Buffer.from(params.description).toString("base64").slice(0, 20),
      result: "",
      timestamp: new Date().toISOString(),
      riskLevel: permResult.riskLevel,
      approvalRequired: permResult.approvalRequired,
      executionId,
    };

    if (!permResult.allowed || permResult.approvalRequired) {
      taskObj.status = permResult.approvalRequired ? "waiting_approval" : "blocked";
      taskObj.progress = 0;
      taskObj.output = permResult.approvalRequired
        ? `APPROVAL REQUIRED: ${permResult.reason || "This action requires explicit approval before execution."}`
        : `PERMISSIONS CHECK FAILED: ${permResult.reason}`;
      companyDb.addTask(taskObj);

      auditObj.result = permResult.approvalRequired
        ? `WAITING_APPROVAL: Execution was not started. Reason: ${permResult.reason || "Explicit approval is required."}`
        : `BLOCKED: Security and permission rules violated. Reason: ${permResult.reason}`;
      companyDb.logAudit(auditObj);

      return {
        success: false,
        task: taskObj,
        auditLog: auditObj,
        permissionCheck: permResult,
      };
    }

    // E: If allowed, set running state and start async process
    taskObj.status = "running";
    taskObj.progress = 20;
    taskObj.subtasks[0].completed = true;
    companyDb.addTask(taskObj);

    auditObj.result = `APPROVED: Permissions check passed. Active execution context generated.`;
    companyDb.logAudit(auditObj);

    // Trigger asynchronous execution loop (non-blocking)
    this.runAsyncAgentProcess(taskObj, agent, project, executionId, params.organizationId).catch((err) => {
      console.error(`[Agent Execution Loop async crash] Task: ${taskId}`, err);
    });

    return {
      success: true,
      task: taskObj,
      auditLog: auditObj,
      permissionCheck: permResult,
    };
  }

  /**
   * 3. Core Asynchronous Loop Process (Gemini Integration with Failover)
   */
  private static async runAsyncAgentProcess(
    task: DBTask,
    agent: AgentContract,
    project: ProjectPortfolio,
    executionId: string,
    organizationId?: string,
  ): Promise<void> {
    try {
      // Step A: Progress Update
      companyDb.updateTaskStatus(task.id, "running", 40);

      // Step B: Retrieve relevant historical database context to inject into prompt
      const previousTasks = companyDb.getTasks()
        .filter((t) => t.projectId === project.id && t.status === "completed" && t.id !== task.id)
        .slice(0, 3);

      const recentContextText = previousTasks.map((t, idx) => {
        return `[Context ${idx + 1}] Task "${t.title}": Output: ${t.output?.slice(0, 400)}`;
      }).join("\n\n");
      const engineeringGuidance = isEngineeringRelatedAgent(agent)
        ? `\n\n${ENGINEERING_AGENT_PLAYBOOK}`
        : "";

      // Check if project workspace has files we can list
      let workspaceFilesList = "None";
      const workspaceRoot = path.resolve(project.workspace || `./workspace/${project.id}`);
      try {
        if (fs.existsSync(workspaceRoot)) {
          const files = fs.readdirSync(workspaceRoot);
          workspaceFilesList = files.join(", ");
        }
      } catch (e) {
        // Workspace directory check failed or empty
      }

      // Step C: Formulate Gemini Prompt with Project, Employee and History contexts
      const prompt = `
YOU ARE OPERATING WITHIN THE MUNDERDIFFL.IN COMPANY OS SANDBOX.

[TASK DIRECTIVE]
Title: ${task.title}
Description: ${task.description}
Priority: ${task.priority}

[AUTONOMOUS AI AGENT PROFILE]
Name: ${agent.name}
Role: ${agent.role}
Department: ${agent.department}
Job Description: ${agent.jobDescription}
Skills: ${agent.skills.join(", ")}
Tools Available: ${agent.tools.join(", ")}
Authority Level: ${agent.authorityLevel} (out of 7)
${engineeringGuidance ? `[ENGINEERING CAPABILITIES]\n${engineeringGuidance.trim()}\n` : ""}

[WORKFORCE MANDATE]
There are no human employees in the workforce simulation. Every worker, manager, specialist, trainer, recruiter, accountant, marketer, engineer, researcher and executive worker is an AI agent. Organizational titles such as Manager, Director, Engineer or HR Specialist describe an agent's role and authority—not a human identity.

[WORKSPACE BOUNDARY ENVIRONMENT]
Workspace Directory: ${project.workspace || `./workspace/${project.id}`}
Available Workspace Files: ${workspaceFilesList}
Project Description: ${project.description}

[HISTORICAL CONTEXT SUMMARY]
${recentContextText || "No previous tasks recorded for this project workspace."}

Provide a comprehensive execution log, detailed technical steps taken, analysis, and output results. If applicable, output any clean executable code block enclosed inside markdown. ALWAYS include the target file path as the very first line of the code block, as a comment. For example:
\`\`\`typescript
// src/components/NewComponent.tsx
export const NewComponent = () => {
// ...
\`\`\`
      `.trim();

      let finalOutput = "";
      let repositoryResult: Awaited<ReturnType<typeof repositoryEngineer.develop>> | undefined;
      let repositoryFailure: string | undefined;

      companyDb.updateTaskStatus(task.id, "running", 60);

      if (isSoftwareEngineerAgent(agent)) {
        try {
          repositoryResult = await repositoryEngineer.develop({
            id: task.id,
            agentId: agent.id,
            organizationId: organizationId ?? "org-munderdifflin",
            workspace: workspaceRoot,
            objective: `${task.title}\n\n${task.description}${engineeringGuidance}`,
          });
          
          if (repositoryResult.success) {
            finalOutput = repositoryResult.summary;
          }
        } catch (repoErr: any) {
          repositoryFailure = repoErr instanceof Error ? repoErr.message : String(repoErr);
          console.warn(`[RepositoryEngineer Note] Soft failover to modelRouter: ${repoErr?.message || repoErr}`);
        }
      }

      if (!repositoryResult?.success) {
        const systemInstruction = `You are ${agent.name}, executing your specialized role as ${agent.role} under corporate guidelines. Be highly specific, technical, and aligned with your department's goals.`;
        try {
          const genResult = await modelRouter.generate({
            prompt,
            systemInstruction,
            temperature: isEngineeringRelatedAgent(agent) ? 0.2 : 0.6,
          });
          finalOutput = genResult?.text?.trim() || "The configured model returned no proposal.";
        } catch (genErr: any) {
          throw new Error(`No execution-capable workflow completed this task, and model proposal generation failed: ${genErr instanceof Error ? genErr.message : String(genErr)}`);
        }
      }

      if (repositoryResult?.success) {
        const finalTask = companyDb.updateTaskStatus(
          task.id,
          "completed",
          100,
          finalOutput,
          undefined,
          {
            status: "VERIFIED",
            source: "repository-engineer:typecheck+tests+security-audit",
            timestamp: new Date().toISOString(),
            verificationId: executionId,
          },
        );
        if (finalTask) {
          finalTask.subtasks[1].completed = true;
          finalTask.subtasks[2].completed = true;
          companyDb.addTask(finalTask);

        }

        companyDb.logAudit({
          id: `aud-comp-${Date.now()}`,
          agentId: agent.id,
          projectId: project.id,
          taskId: task.id,
          tool: "agent.execution_loop",
          action: `Task Completed: "${task.title.slice(0, 50)}"`,
          inputHash: Buffer.from(finalOutput).toString("base64").slice(0, 20),
          result: `VERIFIED: Repository development passed typecheck, tests, and security audit. Changed files: ${repositoryResult.diff.files.length}.`,
          timestamp: new Date().toISOString(),
          riskLevel: task.priority === "critical" ? "critical" : task.priority === "high" ? "high" : "medium",
          approvalRequired: task.priority === "critical",
          executionId,
        });
      } else {
        const reason = repositoryResult?.summary
          ? `Execution was not verified: ${repositoryResult.summary}`
          : repositoryFailure
            ? `Repository execution failed before verification: ${repositoryFailure}`
            : "A model-generated proposal is available, but no task-execution workflow ran. Review and execute it through an authorized workflow.";
        companyDb.updateTaskStatus(task.id, "blocked", 60, `${reason}\n\n${finalOutput}`);
        companyDb.logAudit({
          id: `aud-blocked-${Date.now()}`,
          agentId: agent.id,
          projectId: project.id,
          taskId: task.id,
          tool: "agent.execution_loop",
          action: `Task Blocked: "${task.title.slice(0, 50)}"`,
          inputHash: Buffer.from(task.description).toString("base64").slice(0, 20),
          result: `BLOCKED: ${reason}`,
          timestamp: new Date().toISOString(),
          riskLevel: task.priority === "critical" ? "critical" : task.priority === "high" ? "high" : "medium",
          approvalRequired: true,
          executionId,
        });
      }

    } catch (processError: any) {
      console.error(`[Execution Loop Error] Failed to process async loop for task ${task.id}:`, processError);
      
      // Update task to failed
      companyDb.updateTaskStatus(task.id, "failed", 100, `Execution Loop Error: ${processError.message}`);
      
      companyDb.logAudit({
        id: `aud-err-${Date.now()}`,
        agentId: agent.id,
        projectId: project.id,
        taskId: task.id,
        tool: "agent.execution_loop",
        action: `Task Failure: "${task.title.slice(0, 50)}"`,
        inputHash: Buffer.from(processError.message).toString("base64").slice(0, 20),
        result: `CRITICAL ERROR: Asynchronous execution crashed: ${processError.message}`,
        timestamp: new Date().toISOString(),
        riskLevel: "high",
        approvalRequired: false,
        executionId,
      });
    }
  }
}
