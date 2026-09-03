import { BusinessWorkflow, WorkflowStep } from "./types.ts";
import { toolGateway } from "../integrations/gateway/tool.gateway.ts";

export class WorkflowEngine {
  private static activeWorkflows: Map<string, BusinessWorkflow> = new Map();

  // Baseline workflows database
  private static workflowTemplates: Record<string, Omit<BusinessWorkflow, "id" | "status" | "currentStepIndex" | "startedAt" | "triggeredBy">> = {
    "finance-audit": {
      name: "Quarterly Financial Ledger Consolidation",
      departmentId: "finance",
      steps: [
        {
          id: "step-1",
          name: "Fetch Recent Expenses Ledger",
          tool: "database",
          action: "execute_query",
          parameters: { sql: "SELECT * FROM audit_events WHERE risk_level = 'medium'" },
          status: "PENDING"
        },
        {
          id: "step-2",
          name: "Verify Bank Statement Ledger Reconciliation",
          tool: "http",
          action: "fetch_endpoint",
          parameters: { url: "https://api.munderdifflin.com/finance/statement", method: "GET" },
          status: "PENDING"
        },
        {
          id: "step-3",
          name: "Generate Executive Reconciliation Invoice Entries",
          tool: "database",
          action: "execute_query",
          parameters: { sql: "SELECT * FROM projects", readOnly: true },
          status: "PENDING"
        }
      ]
    },
    "crm-enrichment": {
      name: "Lead Qualification & Custom CRM Ingestion",
      departmentId: "growth",
      steps: [
        {
          id: "step-1",
          name: "Query High MRR Lead Candidates",
          tool: "web",
          action: "google_search",
          parameters: { query: "Dunder Mifflin paper buyer prospects Pennsylvania" },
          status: "PENDING"
        },
        {
          id: "step-2",
          name: "Log Prospects in Company DB Ledger",
          tool: "database",
          action: "execute_query",
          parameters: { sql: "SELECT * FROM employees WHERE department = 'marketing'" },
          status: "PENDING"
        }
      ]
    },
    "devops-deploy": {
      name: "DevOps Automated Patch Deployment Pipeline",
      departmentId: "engineering",
      steps: [
        {
          id: "step-1",
          name: "Fetch Open-Source Repository Patches",
          tool: "github",
          action: "create_pull_request",
          parameters: { repo: "munderdifflin/company-os", title: "Automated security updates", head: "security-patch", base: "main" },
          status: "PENDING"
        },
        {
          id: "step-2",
          name: "Re-verify Staging Environment Health Checks",
          tool: "http",
          action: "fetch_endpoint",
          parameters: { url: "https://staging.munderdifflin.com/health", method: "GET" },
          status: "PENDING"
        }
      ]
    }
  };

  public static listTemplates() {
    return Object.entries(this.workflowTemplates).map(([key, value]) => ({
      templateId: key,
      ...value,
    }));
  }

  public static listWorkflows(): BusinessWorkflow[] {
    return Array.from(this.activeWorkflows.values());
  }

  public static getWorkflow(id: string): BusinessWorkflow | undefined {
    return this.activeWorkflows.get(id);
  }

  public static triggerWorkflow(templateId: string, agentId: string): BusinessWorkflow {
    const template = this.workflowTemplates[templateId];
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const newWorkflow: BusinessWorkflow = {
      id: `wf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: template.name,
      departmentId: template.departmentId,
      status: "PENDING",
      currentStepIndex: 0,
      steps: template.steps.map((step) => ({ ...step, status: "PENDING" })),
      startedAt: new Date().toISOString(),
      triggeredBy: agentId,
    };

    this.activeWorkflows.set(newWorkflow.id, newWorkflow);
    
    // Start executing the workflow asynchronously
    this.executeWorkflow(newWorkflow.id).catch((err) => {
      console.error(`[WorkflowEngine Crash] Failed executing workflow: ${newWorkflow.id}`, err);
    });

    return newWorkflow;
  }

  public static async executeWorkflow(workflowId: string): Promise<void> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow || workflow.status === "COMPLETED" || workflow.status === "FAILED") {
      return;
    }

    workflow.status = "RUNNING";

    while (workflow.currentStepIndex < workflow.steps.length) {
      const step = workflow.steps[workflow.currentStepIndex];
      step.status = "RUNNING";

      try {
        console.log(`[WorkflowEngine] Running Step: ${step.name} (${step.tool}.${step.action})`);

        const result = await toolGateway.execute({
          agentId: workflow.triggeredBy,
          organizationId: "org-munderdifflin",
          tool: step.tool,
          action: step.action,
          parameters: step.parameters,
          reason: `Executing workflow step: ${step.name}`,
        });

        if (result.success) {
          step.status = "COMPLETED";
          step.output = result.data;
          workflow.currentStepIndex++;
        } else {
          step.status = "BLOCKED";
          step.error = result.error || "Blocked through gateway";
          workflow.status = "BLOCKED";
          break;
        }
      } catch (err: any) {
        step.status = "FAILED";
        step.error = err.message || "Execution exception occurred";
        workflow.status = "FAILED";
        workflow.completedAt = new Date().toISOString();
        return;
      }
    }

    if (workflow.currentStepIndex >= workflow.steps.length) {
      workflow.status = "COMPLETED";
      workflow.completedAt = new Date().toISOString();
    }
  }

  // Resume a blocked workflow (e.g. after approval is granted)
  public static resumeWorkflow(workflowId: string): BusinessWorkflow | undefined {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow || workflow.status !== "BLOCKED") {
      return workflow;
    }

    workflow.status = "PENDING";
    this.executeWorkflow(workflowId).catch((err) => {
      console.error(`[WorkflowEngine] Resume failed for ${workflowId}:`, err);
    });

    return workflow;
  }
}
