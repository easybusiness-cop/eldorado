import { ApprovalRequest, ApprovalStatus } from "./approval.types";
import { ApprovalRepository } from "./approval.repository";
import { RiskLevel } from "../integrations/registry/integration.types";

export class ApprovalService {
  public static listApprovals(): ApprovalRequest[] {
    return ApprovalRepository.findAll();
  }

  public static createRequest(params: {
    executionId: string;
    requestedBy: string;
    agentId: string;
    action: string;
    parameters: Record<string, any>;
    riskLevel: RiskLevel;
    reason: string;
  }): ApprovalRequest {
    const approval: ApprovalRequest = {
      id: `app-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      executionId: params.executionId,
      requestedBy: params.requestedBy,
      agentId: params.agentId,
      action: params.action,
      parameters: params.parameters, // Freeze original parameters
      riskLevel: params.riskLevel,
      reason: params.reason,
      status: "PENDING",
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000, // 24 hours
    };

    ApprovalRepository.save(approval);
    return approval;
  }

  public static handleHumanDecision(
    id: string,
    status: "APPROVED" | "REJECTED",
    approver: string
  ): { success: boolean; error?: string; approval?: ApprovalRequest } {
    const approval = ApprovalRepository.findById(id);
    if (!approval) {
      return { success: false, error: `Approval request with ID ${id} not found.` };
    }

    if (approval.status !== "PENDING") {
      return { success: false, error: `Invalid Action: Request is currently in status ${approval.status}` };
    }

    if (Date.now() > approval.expiresAt) {
      ApprovalRepository.updateStatus(id, "EXPIRED");
      return { success: false, error: "Approval request has already expired." };
    }

    ApprovalRepository.updateStatus(id, status, approver);
    return { success: true, approval };
  }
}
