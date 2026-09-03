export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskRule {
  id: string;
  tool: string;
  action: string;
  environment?: string;
  baseRisk: RiskLevel;
  triggersApproval: boolean;
  requiresMfa?: boolean;
  destructive: boolean;
  spendingLimitDollars?: number;
}
