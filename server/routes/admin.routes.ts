import { Router } from "express";
import { modelRouter } from "../ai/providers/index.ts";
import { SecurityAuthorizationService } from "../security/secrets.ts";
import { SecurityAuditLedger } from "../security/auditLedger.ts";
import { CapabilityRegistry } from "../../apps/control-plane/integrations/registry/capability.registry.ts";

export const adminRouter = Router();

// API: Administrator Task Orchestration & Multi-Employee Delegation
adminRouter.post("/orchestrate-task", SecurityAuthorizationService.enforceClearance('ADMIN'), async (req, res) => {
  try {
    const {
      prompt,
      userPreferences = {},
      userProfile = {},
      activeAgents = [],
    } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Task description is required" });
    }

    const userName = userProfile.displayName || userProfile.username || "Operator";
    const company = userPreferences.companyName || "Dunder Mifflin Paper Co.";
    const availableAgentIds = Array.isArray(activeAgents)
      ? activeAgents
        .map((agent: any) => typeof agent === "string" ? agent : agent?.id)
        .filter((id: unknown): id is string => typeof id === "string")
      : [];

    const systemPrompt = `You are a task-planning assistant for ${company}. The user (${userName}) supplied a request:
"${prompt}"

This endpoint creates a proposal only. It does not dispatch agents, run commands, write files, contact external services, or verify results. Use only the supplied agent identifiers; if the list is empty, use "unassigned". Never claim a person or agent accepted or completed work.
Propose 2 to 4 clear subtasks. For each subtask provide:
- subtask title
- assignedTo (an id from the supplied list, or "unassigned")
- priority ("critical" | "high" | "medium")
- shellCommands (optional proposed commands; they will not be executed)
- executableCode (optional code proposal; it will not be applied or run)
- outputSummary (describe the proposed outcome, not an achieved result)

Respond in pure valid JSON matching this schema:
{
  "adminSpeech": "A concise summary of the proposed plan",
  "adminQuote": "A short rationale, not a quotation attributed to a real person",
  "subtasks": [
    {
      "id": "subtask-1",
      "title": "Task title",
      "assignedTo": "cline",
      "priority": "high",
      "shellCommands": [],
      "executableCode": "",
      "outputSummary": "Proposed outcome; not executed"
    }
  ]
}`;

    let parsedResponse: any;

    try {
      const rawAiResponse = (await modelRouter.generate({
        prompt: `Propose a plan for: "${prompt}"\nAvailable agent IDs: ${JSON.stringify(activeAgents)}`,
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.7,
      })).text;

      parsedResponse = JSON.parse(rawAiResponse);
      if (
        typeof parsedResponse !== "object"
        || parsedResponse === null
        || typeof parsedResponse.adminSpeech !== "string"
        || typeof parsedResponse.adminQuote !== "string"
        || !Array.isArray(parsedResponse.subtasks)
        || parsedResponse.subtasks.length < 1
        || parsedResponse.subtasks.length > 4
        || !parsedResponse.subtasks.every((subtask: any) =>
          typeof subtask?.title === "string"
          && typeof subtask?.assignedTo === "string"
          && (subtask.assignedTo === "unassigned" || availableAgentIds.includes(subtask.assignedTo))
          && ["critical", "high", "medium"].includes(subtask?.priority)
          && Array.isArray(subtask?.shellCommands)
          && subtask.shellCommands.every((command: unknown) => typeof command === "string")
          && typeof subtask?.executableCode === "string"
          && typeof subtask?.outputSummary === "string"
        )
      ) {
        throw new Error("Model response did not match the task proposal schema.");
      }
    } catch (modelError: any) {
      console.error("[Admin Orchestrator] Model proposal unavailable or invalid:", modelError);
      return res.status(modelError instanceof SyntaxError ? 502 : modelError?.message?.includes("schema") ? 502 : 503).json({
        success: false,
        status: "blocked",
        code: modelError?.message?.includes("schema") || modelError instanceof SyntaxError ? "INVALID_MODEL_RESPONSE" : "MODEL_PROVIDER_UNAVAILABLE",
        error: modelError?.message?.includes("schema") || modelError instanceof SyntaxError
          ? "The model returned an invalid task proposal; no tasks were dispatched."
          : "A task proposal was not generated because no configured real model provider completed the request.",
      });
    }

    res.json({
      success: true,
      status: "proposal_only",
      taskExecuted: false,
      data: parsedResponse,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error("Admin Orchestration Error:", err);
    res.status(500).json({ error: err.message || "Failed to orchestrate task" });
  }
});

// API: Analyze Task Outcome & Generate Strategic Corporate Executive Report
adminRouter.post("/analyze-task-outcome", SecurityAuthorizationService.enforceClearance('SECURE'), async (req, res) => {
  res.status(501).json({
    success: false,
    status: "blocked",
    code: "EXECUTION_EVIDENCE_UNAVAILABLE",
    error: "No server-verified task execution evidence store is configured; an outcome report cannot be produced.",
  });
});

// GET /api/admin/security-ledger (Harden security audit trail, enforce high clearance level)
adminRouter.get("/security-ledger", SecurityAuthorizationService.enforceClearance('ADMIN'), (req, res) => {
  try {
    const logs = SecurityAuditLedger.getLedger();
    res.json({
      success: true,
      ledger: logs,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load secure audit ledger" });
  }
});

// GET /api/admin/capabilities - list all capability definitions
adminRouter.get("/capabilities", (req, res) => {
  try {
    const defs = CapabilityRegistry.listAllDefinitions();
    res.json({ success: true, definitions: defs });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to list capabilities" });
  }
});

// GET /api/admin/capabilities/agent/:agentId - list active capabilities for an agent
adminRouter.get("/capabilities/agent/:agentId", (req, res) => {
  try {
    const { agentId } = req.params;
    const caps = CapabilityRegistry.getCapabilitiesForAgent(agentId);
    res.json({ success: true, agentId, capabilities: caps });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get agent capabilities" });
  }
});

// GET /api/admin/capabilities/requests - list all capability requests (pending & historical)
adminRouter.get("/capabilities/requests", (req, res) => {
  try {
    const requests = CapabilityRegistry.listAllRequests();
    res.json({ success: true, requests });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get requests" });
  }
});

// POST /api/admin/capabilities/request - agents can request a power
adminRouter.post("/capabilities/request", (req, res) => {
  try {
    const { agentId, capabilityId, reason } = req.body;
    if (!agentId || !capabilityId || !reason) {
      return res.status(400).json({ error: "agentId, capabilityId, and reason are required" });
    }
    const request = CapabilityRegistry.requestCapability(agentId, capabilityId, reason);
    res.json({ success: true, request });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to submit request" });
  }
});

// POST /api/admin/capabilities/resolve - approve or reject a capability request
adminRouter.post("/capabilities/resolve", SecurityAuthorizationService.enforceClearance('ADMIN'), (req, res) => {
  try {
    const { requestId, decision } = req.body;
    if (!requestId || !decision) {
      return res.status(400).json({ error: "requestId and decision are required" });
    }
    const resolved = CapabilityRegistry.resolveRequest(requestId, decision, "admin");
    if (!resolved) {
      return res.status(404).json({ error: "Request not found or already resolved" });
    }
    res.json({ success: true, request: resolved });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to resolve request" });
  }
});

// POST /api/admin/capabilities/grant - manually grant a capability
adminRouter.post("/capabilities/grant", SecurityAuthorizationService.enforceClearance('ADMIN'), (req, res) => {
  try {
    const { agentId, capabilityId, notes } = req.body;
    if (!agentId || !capabilityId) {
      return res.status(400).json({ error: "agentId and capabilityId are required" });
    }
    const success = CapabilityRegistry.grantCapability(agentId, capabilityId, "admin", notes);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to grant capability" });
  }
});

// POST /api/admin/capabilities/revoke - manually revoke a capability
adminRouter.post("/capabilities/revoke", SecurityAuthorizationService.enforceClearance('ADMIN'), (req, res) => {
  try {
    const { agentId, capabilityId } = req.body;
    if (!agentId || !capabilityId) {
      return res.status(400).json({ error: "agentId and capabilityId are required" });
    }
    const success = CapabilityRegistry.revokeCapability(agentId, capabilityId);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to revoke capability" });
  }
});
