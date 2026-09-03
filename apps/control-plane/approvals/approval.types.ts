import { RiskLevel } from "../integrations/registry/integration.types";

export type ApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED"
  | "EXECUTED";

export interface ApprovalRequest {
  id: string;
  executionId: string;
  requestedBy: string; // Employee/Agent ID
  agentId: string;
  action: string; // e.g. "github.merge_pull_request"
  parameters: Record<string, any>;
  riskLevel: RiskLevel;
  reason: string;
  status: ApprovalStatus;
  approver?: string; // Human admin email/name
  createdAt: number;
  expiresAt: number;
}
