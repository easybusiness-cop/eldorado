import { RiskLevel } from "../registry/integration.types";
import { BaseAdapter, ToolExecutionContext, ToolExecutionContract } from "../adapters/base.adapter";
import { HttpAdapter } from "../adapters/http.adapter";
import { WebhookAdapter } from "../adapters/webhook.adapter";
import { DatabaseAdapter } from "../adapters/database.adapter";
import { GitAdapter } from "../adapters/git.adapter";
import { StorageAdapter } from "../adapters/storage.adapter";
import { WebResearchAdapter } from "../adapters/web.adapter";
import { CodeExecutionAdapter } from "../adapters/code-execution.adapter";
import { ComputerUseAdapter } from "../adapters/computer-use.adapter";
import { ProjectWriterAdapter } from "../adapters/project-writer.adapter";
import { CapabilityRegistry } from "../registry/capability.registry";
import { RiskCalculator } from "../../../../risk-engine/risk.calculator";
import { PolicyEngine } from "./policy.middleware";
import { ApprovalService } from "../../approvals/approval.service";
import { SecretService } from "../../../../secrets/secret.service";
import { companyDb } from "../../../../src/db/companyDb";

export interface GatewayExecutionRequest {
  agentId: string;
  organizationId: string;
  tool: string;
  action: string;
  parameters: Record<string, any>;
  reason?: string;
  requestedBy?: string;
  bypassApprovalId?: string; // Tightly binds pre-approved requests
}

export interface GatewayExecutionResult {
  success: boolean;
  data: any;
  error: string | null;
  executionId: string;
  riskLevel: RiskLevel;
  approvalRequired: boolean;
  auditId: string;
  approvalId?: string;
}

export function isSoftwareEngineerAgent(employee: any): boolean {
  if (!employee) return false;
  const engAgentIds = [
    "cline", "ruflo-coder", "ruflo_coder", "ruflo", "aria",
    "sub-eng-arch", "sub-eng-backend", "eng_frontend", "eng_mobile",
    "eng_devops", "eng_qa", "pete-miller", "cline_labs", "eng_coder"
  ];
  if (engAgentIds.includes((employee.id || "").toLowerCase())) return true;

  const deptIdLower = (employee.departmentId || "").toLowerCase();
  const deptNameLower = (employee.department || "").toLowerCase();
  const engDepts = ["engineering", "eng_labs", "cloud_ops", "datacenter", "infrastructure", "rnd"];
  if (engDepts.includes(deptIdLower)) return true;
  if (
    deptNameLower.includes("engineering") ||
    deptNameLower.includes("software") ||
    deptNameLower.includes("data center") ||
    deptNameLower.includes("cloud infrastructure")
  ) {
    return true;
  }

  const roleTitleStr = `${employee.role || ""} ${employee.title || ""} ${employee.name || ""}`.toLowerCase();
  const engKeywords = [
    "software engineer", "systems architect", "full-stack", "backend",
    "frontend", "devops", "coder", "developer", "software", "compiler",
    "lab master", "code master", "cto"
  ];
  return engKeywords.some(kw => roleTitleStr.includes(kw));
}

export class ToolGateway {
  private adapters: Map<string, BaseAdapter> = new Map();

  constructor() {
    // Register active tool adapters
    this.registerAdapter(new HttpAdapter());
    this.registerAdapter(new WebhookAdapter());
    this.registerAdapter(new DatabaseAdapter());
    this.registerAdapter(new GitAdapter());
    this.registerAdapter(new StorageAdapter());
    this.registerAdapter(new WebResearchAdapter());
    this.registerAdapter(new CodeExecutionAdapter());
    this.registerAdapter(new ComputerUseAdapter());
    this.registerAdapter(new ProjectWriterAdapter());
  }

  public registerAdapter(adapter: BaseAdapter): void {
    this.adapters.set(adapter.provider, adapter);
  }

  public async execute(req: GatewayExecutionRequest): Promise<GatewayExecutionResult> {
    const start = Date.now();
    const executionId = `exec-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const correlationId = `corr-${executionId}`;
    const auditId = `aud-gw-${Date.now()}`;

    try {
      // 1. Authenticate caller & Load Tenant Context
      const validOrgs = ["org-munderdifflin", "org-default", "org-scranton-01", "org-scranton-main"];
      if (!req.organizationId || !validOrgs.includes(req.organizationId)) {
        throw new Error(`Authentication/Multi-Tenant Security Error: Invalid, foreign, or unauthorized organization identifier: ${req.organizationId}`);
      }

      // 2. Load employee credentials and profile roles
      const employees = companyDb.getAgentsList();
      const employee = employees.find((e) => e.id === req.agentId);
      if (!employee) {
        throw new Error(`Identity Verification Failed: Employee '${req.agentId}' not registered in roster.`);
      }

      // Normalize tool names from workflows to match registered adapter providers
      let normalizedTool = req.tool;
      if (normalizedTool === "database") normalizedTool = "postgresql";
      if (normalizedTool === "web") normalizedTool = "google-search";

      // 2b. Strict Software Engineering Capabilities Gate
      const isEngTool = normalizedTool === "github" || normalizedTool === "git" || req.action.includes("commit") || req.action.includes("pull_request") || req.action.includes("alter_schema");
      const isSoftwareEng = isSoftwareEngineerAgent(employee);
      if (isEngTool && !isSoftwareEng) {
        throw new Error(`Capabilities Violation: Engineering tool capabilities (${normalizedTool}.${req.action}) are strictly restricted to Software Engineer agents. Employee '${employee.name}' (${employee.role}) in department '${employee.department}' is not a Software Engineer.`);
      }

      // 3. Dynamic Capability Check (via CapabilityRegistry)
      const requestedCap = `${normalizedTool}.${req.action}`;

      if (!CapabilityRegistry.hasCapability(employee.id, requestedCap)) {
        // Allow the agent to formally request the missing capability
        const request = CapabilityRegistry.requestCapability(
          employee.id,
          requestedCap,
          req.reason || `Agent attempted to use ${requestedCap}`
        );

        throw new Error(
          `Capabilities Violation: Employee / Agent '${employee.name}' does not possess capability "${requestedCap}". ` +
          `A formal request has been created (ID: ${request.id}). An administrator can approve it.`
        );
      }

      // 4. Calculate Risk through Risk Engine
      const riskEvaluation = RiskCalculator.calculate(normalizedTool, req.action, req.parameters, "development");

      // 5. Evaluate Enterprise Policies
      const policyEvaluation = PolicyEngine.evaluate({
        tool: normalizedTool,
        action: req.action,
        role: employee.role,
        department: employee.department,
        environment: "development",
        parameters: req.parameters,
      });

      if (!policyEvaluation.allowed) {
        throw new Error(`Enterprise Policy Violation: ${policyEvaluation.reason}`);
      }

      const approvalRequired = riskEvaluation.approvalRequired || policyEvaluation.requiresApproval;

      // merge_pull_request must only enqueue ApprovalService; never merge directly.
      if (req.action === "merge_pull_request") {
        const approvalReq = ApprovalService.createRequest({
          executionId,
          requestedBy: employee.id,
          agentId: employee.id,
          action: requestedCap,
          parameters: req.parameters,
          riskLevel: riskEvaluation.riskLevel,
          reason: req.reason || `Automated request for high-risk action: ${requestedCap}`,
        });

        companyDb.logAudit({
          id: auditId,
          agentId: employee.id,
          projectId: "prj-alpha",
          taskId: "gw-halt",
          tool: normalizedTool,
          action: req.action,
          inputHash: Buffer.from(JSON.stringify(req.parameters)).toString("base64").slice(0, 20),
          result: `BLOCKED: merge_pull_request is strictly gated. Enqueued in ApprovalService. Request ID: ${approvalReq.id}`,
          timestamp: new Date().toISOString(),
          riskLevel: riskEvaluation.riskLevel.toLowerCase() as "low" | "medium" | "high" | "critical",
          approvalRequired: true,
          executionId,
        });

        return {
          success: false,
          data: null,
          error: `Execution Halted: Action "${requestedCap}" strictly requires human-in-the-loop approval. Enqueued in ApprovalService successfully.`,
          executionId,
          riskLevel: riskEvaluation.riskLevel,
          approvalRequired: true,
          auditId,
          approvalId: approvalReq.id,
        };
      }

      // 6. Handle Human Approval Gate if triggered
      if (approvalRequired && !req.bypassApprovalId) {
        // Enforce approval system trigger (halt execution, save state)
        const approvalReq = ApprovalService.createRequest({
          executionId,
          requestedBy: employee.id,
          agentId: employee.id,
          action: requestedCap,
          parameters: req.parameters,
          riskLevel: riskEvaluation.riskLevel,
          reason: req.reason || `Automated request for high-risk action: ${requestedCap}`,
        });

        // Store blocked audit trail
        companyDb.logAudit({
          id: auditId,
          agentId: employee.id,
          projectId: "prj-alpha",
          taskId: "gw-halt",
          tool: normalizedTool,
          action: req.action,
          inputHash: Buffer.from(JSON.stringify(req.parameters)).toString("base64").slice(0, 20),
          result: `BLOCKED: High-risk action (${riskEvaluation.riskLevel}) halted. Approval requested. ID: ${approvalReq.id}`,
          timestamp: new Date().toISOString(),
          riskLevel: riskEvaluation.riskLevel.toLowerCase() as "low" | "medium" | "high" | "critical",
          approvalRequired: true,
          executionId,
        });

        return {
          success: false,
          data: null,
          error: `Execution Halted: Action "${requestedCap}" requires human-in-the-loop approval. Request submitted successfully.`,
          executionId,
          riskLevel: riskEvaluation.riskLevel,
          approvalRequired: true,
          auditId,
          approvalId: approvalReq.id,
        };
      }

      // 7. If pre-approved, verify original params matches and wasn't tampered with
      if (req.bypassApprovalId) {
        const approvalsList = ApprovalService.listApprovals();
        const approvedReq = approvalsList.find(a => a.id === req.bypassApprovalId);
        if (!approvedReq) {
          throw new Error("Security Violation: Provided approval request ID is invalid or unregistered.");
        }
        if (approvedReq.status !== "APPROVED") {
          throw new Error(`Security Violation: Provided approval request [${req.bypassApprovalId}] is not in APPROVED status. Current: ${approvedReq.status}`);
        }
        // Strict boundary: Parameters MUST match original approved state
        const originalStr = JSON.stringify(approvedReq.parameters);
        const currentStr = JSON.stringify(req.parameters);
        if (originalStr !== currentStr) {
          throw new Error("Security Violation: Parameters cannot be modified or altered after human approval has been granted.");
        }
      }

      // 8. Load adapter matching request
      const adapter = this.adapters.get(normalizedTool);
      if (!adapter) {
        throw new Error(`Integration Adapter Error: No active adapter found for tool provider: ${normalizedTool}`);
      }

      // 9. Execute adapter action
      const executionContext: ToolExecutionContext = {
        agentId: employee.id,
        organizationId: req.organizationId,
        tool: normalizedTool,
        action: req.action,
        parameters: req.parameters,
        reason: req.reason,
        correlationId,
      };

      const response: ToolExecutionContract = await adapter.execute(executionContext);

      // 10. Standardize result & Redact sensitive secrets from raw logs
      const redactedDataStr = SecretService.redact(JSON.stringify(response.data));
      const finalizedData = JSON.parse(redactedDataStr);

      const errorMsg = response.error ? SecretService.redact(response.error) : null;

      // Update approval object status to EXECUTED if it was bypassed
      if (req.bypassApprovalId) {
        ApprovalService.handleHumanDecision(req.bypassApprovalId, "APPROVED", "Michael Scott"); // keep updated
        const approvalsList = ApprovalService.listApprovals();
        const approvedReq = approvalsList.find(a => a.id === req.bypassApprovalId);
        if (approvedReq) {
          approvedReq.status = "EXECUTED";
        }
      }

      // 11. Record immutable audit record to enterprise log
      companyDb.logAudit({
        id: auditId,
        agentId: employee.id,
        projectId: "prj-alpha",
        taskId: "gw-success",
        tool: req.tool,
        action: req.action,
        inputHash: Buffer.from(JSON.stringify(req.parameters)).toString("base64").slice(0, 20),
        result: response.success
          ? `SUCCESS: Executed ${requestedCap} in ${Date.now() - start}ms.`
          : `FAILED: execution returned error: ${errorMsg}`,
        timestamp: new Date().toISOString(),
        riskLevel: riskEvaluation.riskLevel.toLowerCase() as "low" | "medium" | "high" | "critical",
        approvalRequired: false,
        executionId,
      });

      return {
        success: response.success,
        data: finalizedData,
        error: errorMsg,
        executionId,
        riskLevel: riskEvaluation.riskLevel,
        approvalRequired: false,
        auditId,
      };

    } catch (err: any) {
      console.error(`[Tool Gateway Crash] Execution Failed:`, err);
      
      const redactedErr = SecretService.redact(err.message);

      // Log failure audit
      companyDb.logAudit({
        id: auditId,
        agentId: req.agentId || "unknown-caller",
        projectId: "prj-alpha",
        taskId: "gw-failure",
        tool: req.tool || "unknown",
        action: req.action || "unknown",
        inputHash: Buffer.from(JSON.stringify(req.parameters || {})).toString("base64").slice(0, 20),
        result: `CRITICAL EXCEPTION: Gateway execution halted: ${redactedErr}`,
        timestamp: new Date().toISOString(),
        riskLevel: "high",
        approvalRequired: false,
        executionId,
      });

      return {
        success: false,
        data: null,
        error: redactedErr,
        executionId,
        riskLevel: "HIGH",
        approvalRequired: false,
        auditId,
      };
    }
  }
}

// Export single shared instance for entire company OS server
export const toolGateway = new ToolGateway();
