import { Router } from "express";
import { IntegrationService } from "../../apps/control-plane/integrations/registry/integration.service.ts";
import { toolGateway } from "../../apps/control-plane/integrations/gateway/tool.gateway.ts";
import { ApprovalService } from "../../apps/control-plane/approvals/approval.service.ts";
import { runSecurityTestSuite } from "../../tests/command03.test.ts";
import { ObservabilityCollector } from "../../apps/control-plane/observability/metrics.ts";
import { WorkflowEngine } from "../../apps/control-plane/workflows/workflow.engine.ts";
import { companyDb } from "../../src/db/companyDb.ts";

export const enterpriseControlRouter = Router();

// GET: Fetch all active corporate integrations
enterpriseControlRouter.get("/integrations", (req, res) => {
  try {
    const list = IntegrationService.listIntegrations("org-munderdifflin");
    res.json({ success: true, integrations: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Register a new system integration adapter
enterpriseControlRouter.post("/integrations", (req, res) => {
  try {
    const result = IntegrationService.registerIntegration("org-munderdifflin", req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, errors: result.errors });
    }
    res.json({ success: true, integration: result.data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Test connection status of registered integration
enterpriseControlRouter.post("/integrations/:id/test", async (req, res) => {
  try {
    const { id } = req.params;
    const testResult = await IntegrationService.testIntegration(id);
    res.json({ success: testResult.success, latencyMs: testResult.latencyMs, error: testResult.error });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Execute action through secure universal Tool Gateway
enterpriseControlRouter.post("/tools/execute", async (req, res) => {
  try {
    const { tool, action, parameters, agentId, reason } = req.body;

    if (!tool || !action || !parameters || !agentId) {
      return res.status(400).json({
        success: false,
        error: "Missing parameters: tool, action, parameters, and agentId are required.",
      });
    }

    const start = Date.now();
    const result = await toolGateway.execute({
      agentId: agentId,
      organizationId: "org-munderdifflin",
      tool,
      action,
      parameters,
      reason,
    });

    ObservabilityCollector.recordToolExecution(tool, action, Date.now() - start, result.success, 0.0001);

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET: Fetch list of approvals
enterpriseControlRouter.get("/approvals", (req, res) => {
  try {
    const list = ApprovalService.listApprovals();
    res.json({ success: true, approvals: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Handle Human Approvals state updates
enterpriseControlRouter.post("/approvals/:id/decision", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approver = "Michael Scott" } = req.body;

    if (!status || (status !== "APPROVED" && status !== "REJECTED")) {
      return res.status(400).json({ success: false, error: "Decision status must be APPROVED or REJECTED" });
    }

    const startAppr = Date.now();
    const decisionResult = ApprovalService.handleHumanDecision(id, status, approver);
    if (!decisionResult.success) {
      return res.status(400).json({ success: false, error: decisionResult.error });
    }

    ObservabilityCollector.recordApprovalLatency(Date.now() - startAppr);

    const approval = decisionResult.approval!;
    let executionResult: any = null;

    if (status === "APPROVED") {
      const parts = approval.action.split(".");
      const tool = parts[0];
      const action = parts[1];

      executionResult = await toolGateway.execute({
        agentId: approval.agentId,
        organizationId: "org-munderdifflin",
        tool,
        action,
        parameters: approval.parameters,
        reason: `Approved by human administrator decision: ${approval.reason}`,
        bypassApprovalId: approval.id,
      });
    }

    res.json({
      success: true,
      approval,
      executionResult,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET: Fetch full audit events trail
enterpriseControlRouter.get("/audit", (req, res) => {
  try {
    const auditLogs = companyDb.getAudits();
    res.json({ success: true, audit: auditLogs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET: Fetch dynamic observability metrics
enterpriseControlRouter.get("/observability/metrics", (req, res) => {
  try {
    const summary = ObservabilityCollector.getMetricsSummary();
    res.json({ success: true, metrics: summary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Trigger live automated multi-tenant and secure execution tests
enterpriseControlRouter.post("/security/test-suite", async (req, res) => {
  try {
    const suiteResult = await runSecurityTestSuite();
    res.json({
      success: true,
      passed: suiteResult.passed,
      results: suiteResult.results,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET: Fetch all baseline corporate workflow templates
enterpriseControlRouter.get("/workflows/templates", (req, res) => {
  try {
    const list = WorkflowEngine.listTemplates();
    res.json({ success: true, templates: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET: Fetch currently registered and running business workflows
enterpriseControlRouter.get("/workflows", (req, res) => {
  try {
    const list = WorkflowEngine.listWorkflows();
    res.json({ success: true, workflows: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Trigger a new multi-stage autonomous department workflow
enterpriseControlRouter.post("/workflows/trigger", (req, res) => {
  try {
    const { templateId, agentId = "michael" } = req.body;
    if (!templateId) {
      return res.status(400).json({ success: false, error: "Missing required templateId." });
    }
    const workflow = WorkflowEngine.triggerWorkflow(templateId, agentId);
    res.json({ success: true, workflow });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Resume execution for blocked workflows
enterpriseControlRouter.post("/workflows/:id/resume", (req, res) => {
  try {
    const { id } = req.params;
    const workflow = WorkflowEngine.resumeWorkflow(id);
    if (!workflow) {
      return res.status(404).json({ success: false, error: `Workflow not found: ${id}` });
    }
    res.json({ success: true, workflow });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
