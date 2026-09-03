import { ToolExecutionRequest, ToolExecutionResult } from '../../shared/types/index.ts';
import { mastraToolRegistry } from '../ai/mastra/tools/index.ts';
import { composioToolGateway } from '../integrations/composio/tools.ts';
import { riskEngine } from '../ai/runtime/risk-engine.ts';

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

  private constructor() {}

  public static getInstance(): ToolGateway {
    if (!ToolGateway.instance) {
      ToolGateway.instance = new ToolGateway();
    }
    return ToolGateway.instance;
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
}

export const toolGateway = ToolGateway.getInstance();
