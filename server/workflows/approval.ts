import { mastraWorkflowEngine } from '../ai/mastra/workflows/index.ts';

export interface ApprovalRequest {
  id: string;
  workflowId: string;
  stepId: string;
  action: string;
  requestedByAgentId: string;
  approverRole: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  notes?: string;
}

export class ApprovalWorkflowService {
  private static instance: ApprovalWorkflowService;
  private approvals: Map<string, ApprovalRequest> = new Map();

  private constructor() {}

  public static getInstance(): ApprovalWorkflowService {
    if (!ApprovalWorkflowService.instance) {
      ApprovalWorkflowService.instance = new ApprovalWorkflowService();
    }
    return ApprovalWorkflowService.instance;
  }

  public requestApproval(workflowId: string, stepId: string, action: string, requestedBy: string, approverRole = 'Executive'): ApprovalRequest {
    const req: ApprovalRequest = {
      id: `appr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      stepId,
      action,
      requestedByAgentId: requestedBy,
      approverRole,
      status: 'pending',
      createdAt: Date.now(),
    };
    this.approvals.set(req.id, req);
    return req;
  }

  public resolveApproval(approvalId: string, decision: 'approved' | 'rejected', reviewer: string, notes?: string): ApprovalRequest | undefined {
    const req = this.approvals.get(approvalId);
    if (!req) return undefined;

    req.status = decision;
    req.reviewedAt = Date.now();
    req.reviewedBy = reviewer;
    req.notes = notes;

    if (decision === 'approved') {
      mastraWorkflowEngine.advanceWorkflow(req.workflowId, { approvedBy: reviewer, notes });
    }

    return req;
  }

  public getPendingApprovals(): ApprovalRequest[] {
    return Array.from(this.approvals.values()).filter(a => a.status === 'pending');
  }
}

export const approvalWorkflowService = ApprovalWorkflowService.getInstance();
