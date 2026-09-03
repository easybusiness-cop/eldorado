import { ApprovalRequest, ApprovalStatus } from "./approval.types";

export class ApprovalRepository {
  private static approvals: Map<string, ApprovalRequest> = new Map();

  static {
    // Seed initial approvals to showcase active workflow actions in the dashboard UI
    const seedId1 = "app-01";
    this.approvals.set(seedId1, {
      id: seedId1,
      executionId: "ex-se-1029",
      requestedBy: "david",
      agentId: "david",
      action: "github.merge_pull_request",
      parameters: { repository: "munderdifflin/company-os", pullRequestNumber: 142 },
      riskLevel: "HIGH",
      reason: "Merge core financial consolidation algorithm with production branch.",
      status: "PENDING",
      createdAt: Date.now() - 120000,
      expiresAt: Date.now() + 86400000,
    });

    const seedId2 = "app-02";
    this.approvals.set(seedId2, {
      id: seedId2,
      executionId: "ex-se-1030",
      requestedBy: "oscar",
      agentId: "oscar",
      action: "stripe.create_invoice",
      parameters: { customerId: "cus_883192", amount: 1500 },
      riskLevel: "HIGH",
      reason: "Generate corporate invoice for Paper Mill contract.",
      status: "APPROVED",
      approver: "Michael Scott",
      createdAt: Date.now() - 3600000,
      expiresAt: Date.now() + 86400000,
    });
  }

  public static save(approval: ApprovalRequest): void {
    this.approvals.set(approval.id, approval);
  }

  public static findById(id: string): ApprovalRequest | undefined {
    return this.approvals.get(id);
  }

  public static findAll(): ApprovalRequest[] {
    return Array.from(this.approvals.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  public static updateStatus(id: string, status: ApprovalStatus, approver?: string): boolean {
    const approval = this.approvals.get(id);
    if (approval) {
      approval.status = status;
      if (approver) {
        approval.approver = approver;
      }
      return true;
    }
    return false;
  }
}
