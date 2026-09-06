import { ToolExecutionRequest, ToolExecutionResult } from '../../shared/types/index.ts';
import { mastraToolRegistry } from '../ai/mastra/tools/index.ts';
import { composioToolGateway } from '../integrations/composio/tools.ts';
import { riskEngine } from '../ai/runtime/risk-engine.ts';
import { executionKernel } from "../core/execution/execution.kernel.ts";

export class ToolAuditLogger {
  private static instance: ToolAuditLogger;
  private logs: Array<{
    id: string;
    timestamp: string;
    toolName: string;
    agentId: string;
    orgId: string;
    success: boolean;
    durationMs: number;
    riskLevel?: string;
  }> = [];

  private constructor() {}

  public static getInstance(): ToolAuditLogger {
    if (!ToolAuditLogger.instance) {
      ToolAuditLogger.instance = new ToolAuditLogger();
    }
    return ToolAuditLogger.instance;
  }

  public logExecution(toolName: string, agentId: string, orgId: string, success: boolean, durationMs: number, riskLevel = 'LOW'): string {
    const id = `aud-tool-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.logs.unshift({
      id,
      timestamp: new Date().toISOString(),
      toolName,
      agentId,
      orgId,
      success,
      durationMs,
      riskLevel,
    });
    if (this.logs.length > 200) {
      this.logs.pop();
    }
    return id;
  }

  public getRecentLogs(limit = 20) {
    return this.logs.slice(0, limit);
  }
}

export const toolAuditLogger = ToolAuditLogger.getInstance();

export class ToolGateway {
  private static instance: ToolGateway;
  constructor() {}

  public static getInstance(): ToolGateway {
    if (!ToolGateway.instance) {
      ToolGateway.instance = new ToolGateway();
    }
    return ToolGateway.instance;
  }

  public async createPullRequest(params: {
    owner?: string;
    repo?: string;
    head?: string;
    base?: string;
    title?: string;
    body?: string;
    draft?: boolean;
  }): Promise<{ success: boolean; url: string; number: number; branch: string }> {
    const prNumber = Math.floor(Math.random() * 200) + 100;
    const branch = params.head || `branch-${Date.now()}`;
    toolAuditLogger.logExecution('github.createPullRequest', 'RepoEngineer', params.owner || 'rufflo', true, 25);

    return {
      success: true,
      url: `https://github.com/${params.owner || 'rufflo-ai'}/${params.repo || 'fleet'}/pull/${prNumber}`,
      number: prNumber,
      branch,
    };
  }

  public async execute(req: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    // 1. Multi-tenant boundary check
    if (!req.organizationId || req.organizationId.trim().length === 0) {
      const auditId = toolAuditLogger.logExecution(req.toolName, req.agentId, 'UNKNOWN', false, 0);
      return {
        success: false,
        error: { code: 'UNAUTHORIZED_TENANT', message: 'Organization tenant ID is strictly required.' },
        auditId,
        executionTimeMs: 0,
      };
    }

    // 2. Risk Engine Assessment
    const assessment = await riskEngine.assessRisk(req.toolName, req.parameters, { agentId: req.agentId, orgId: req.organizationId });

    if (assessment.requiresApproval) {
      const auditId = toolAuditLogger.logExecution(req.toolName, req.agentId, req.organizationId, false, 0, assessment.riskLevel);
      return {
        success: false,
        error: {
          code: 'AWAITING_APPROVAL',
          message: `Tool execution for "${req.toolName}" requires executive approval due to policy: [${assessment.riskLevel}] ${assessment.violations.join(', ')}`,
        },
        auditId,
        executionTimeMs: 0,
      };
    }

    try {
      // -------------------------------------------------------
      // Canonical Rufflo execution tool
      // -------------------------------------------------------
      if (req.toolName === "terminal.execute") {
        const command = req.parameters.command;

        if (
          typeof command !== "string" ||
          command.trim().length === 0
        ) {
          const durationMs =
            Date.now() - startTime;

          const auditId =
            toolAuditLogger.logExecution(
              req.toolName,
              req.agentId,
              req.organizationId,
              false,
              durationMs,
              assessment.riskLevel,
            );

          return {
            success: false,
            error: {
              code: "INVALID_TERMINAL_COMMAND",
              message:
                "terminal.execute requires a non-empty command.",
            },
            auditId,
            executionTimeMs: durationMs,
          };
        }

        const execution =
          await executionKernel.execute({
            taskId:
              String(
                req.parameters.taskId ??
                `tool-${Date.now()}`,
              ),

            agentId:
              req.agentId,

            organizationId:
              req.organizationId,

            mode: "SANDBOX",

            command,

            cwd:
              typeof req.parameters.cwd === "string"
                ? req.parameters.cwd
                : undefined,

            workspace:
              typeof req.parameters.workspace === "string"
                ? req.parameters.workspace
                : undefined,

            timeoutMs:
              typeof req.parameters.timeoutMs === "number"
                ? req.parameters.timeoutMs
                : 120_000,

            networkAccess: false,
          });

        const durationMs =
          Date.now() - startTime;

        const success =
          execution.success;

        const auditId =
          toolAuditLogger.logExecution(
            req.toolName,
            req.agentId,
            req.organizationId,
            success,
            durationMs,
            assessment.riskLevel,
          );

        if (!success) {
          return {
            success: false,
            error: {
              code:
                execution.error?.code ??
                "TERMINAL_EXECUTION_FAILED",

              message:
                execution.error?.message ??
                execution.stderr ??
                "Terminal execution failed.",
            },

            auditId,

            executionTimeMs:
              durationMs,
          };
        }

        return {
          success: true,

          data: {
            exitCode:
              execution.exitCode,

            stdout:
              execution.stdout,

            stderr:
              execution.stderr,

            timedOut:
              execution.timedOut,
          },

          auditId,

          executionTimeMs:
            durationMs,
        };
      }

      // Check built-in Mastra tools
      const mastraTool = mastraToolRegistry.getTool(req.toolName);
      if (mastraTool) {
        const res = await mastraTool.execute(req.parameters, { agentId: req.agentId, orgId: req.organizationId });
        const durationMs = Date.now() - startTime;
        const auditId = toolAuditLogger.logExecution(req.toolName, req.agentId, req.organizationId, true, durationMs, assessment.riskLevel);
        return { success: true, data: res, auditId, executionTimeMs: durationMs };
      }

      // Check Composio external actions
      const composioAction = composioToolGateway.getAction(req.toolName);
      if (composioAction) {
        const res = await composioAction.execute(req.parameters);
        const durationMs = Date.now() - startTime;
        const auditId = toolAuditLogger.logExecution(req.toolName, req.agentId, req.organizationId, true, durationMs, assessment.riskLevel);
        return { success: true, data: res, auditId, executionTimeMs: durationMs };
      }

      // Tool not registered
      const durationMs = Date.now() - startTime;
      const auditId = toolAuditLogger.logExecution(req.toolName, req.agentId, req.organizationId, false, durationMs, assessment.riskLevel);
      return {
        success: false,
        error: { code: 'TOOL_NOT_FOUND', message: `Tool "${req.toolName}" is not registered in ToolGateway.` },
        auditId,
        executionTimeMs: durationMs,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const auditId = toolAuditLogger.logExecution(req.toolName, req.agentId, req.organizationId, false, durationMs, assessment.riskLevel);
      return {
        success: false,
        error: { code: 'EXECUTION_FAILED', message: err?.message || String(err) },
        auditId,
        executionTimeMs: durationMs,
      };
    }
  }

  public async callPublicAPI(endpoint: string, params: any): Promise<any> {
    const startTime = Date.now();
    try {
      if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
        const res = await fetch(endpoint, {
          method: params?.method || "GET",
          headers: params?.headers || { "Content-Type": "application/json" },
          body: params?.body ? JSON.stringify(params.body) : undefined,
        });
        const data = await res.json().catch(() => ({ status: res.status, statusText: res.statusText }));
        toolAuditLogger.logExecution(`api.${endpoint}`, "system", "org-munderdifflin", true, Date.now() - startTime);
        return { success: true, status: res.status, data };
      }
      // Internal or simulated API
      toolAuditLogger.logExecution(`api.${endpoint}`, "system", "org-munderdifflin", true, Date.now() - startTime);
      return { success: true, endpoint, params, simulated: true };
    } catch (err: any) {
      toolAuditLogger.logExecution(`api.${endpoint}`, "system", "org-munderdifflin", false, Date.now() - startTime);
      return { success: false, error: err?.message || String(err) };
    }
  }
}

export const toolGateway = ToolGateway.getInstance();
