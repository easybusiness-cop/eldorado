import { Router } from "express";
import { ApprovalService } from "./approval.service";
import { toolGateway } from "../integrations/gateway/tool.gateway";

const router = Router();

// GET: Fetch list of all active human approvals
router.get("/api/approvals", (req, res) => {
  try {
    const list = ApprovalService.listApprovals();
    res.json({ success: true, approvals: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Human decision - Approve or Reject a pending request
router.post("/api/approvals/:id/decision", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approver = "Michael Scott" } = req.body; // default human administrator

    if (!status || (status !== "APPROVED" && status !== "REJECTED")) {
      return res.status(400).json({ success: false, error: "Decision status must be APPROVED or REJECTED" });
    }

    const decisionResult = ApprovalService.handleHumanDecision(id, status, approver);
    if (!decisionResult.success) {
      return res.status(400).json({ success: false, error: decisionResult.error });
    }

    const approval = decisionResult.approval!;

    // If APPROVED, trigger immediate execution through tool gateway with bypassApprovalId
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
        reason: `Pre-approved by administrator decision: ${approval.reason}`,
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

export { router as approvalRouter };
