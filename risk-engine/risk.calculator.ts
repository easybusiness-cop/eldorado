import { RiskLevel, RiskRule } from "./risk.types";
import { riskRules } from "./risk.rules";

export class RiskCalculator {
  public static calculate(
    tool: string,
    action: string,
    parameters: Record<string, any>,
    environment = "development"
  ): { riskLevel: RiskLevel; approvalRequired: boolean; reason: string } {
    // 1. Locate defined rule matching tool and action
    const rule = riskRules.find(
      (r) => r.tool === tool && r.action === action
    );

    if (!rule) {
      // Fallback if rule not declared (default to high-risk to be secure)
      return {
        riskLevel: "HIGH",
        approvalRequired: true,
        reason: `Defaulting to SECURE-HIGH risk: No explicit risk rule registered for ${tool}.${action}`
      };
    }

    let riskLevel = rule.baseRisk;
    let approvalRequired = rule.triggersApproval;
    const reasons: string[] = [`Base rule: ${tool}.${action} maps to ${riskLevel}`];

    // 2. Adjust risk if environment is production
    if (environment === "production") {
      if (riskLevel === "LOW") {
        riskLevel = "MEDIUM";
        reasons.push("Risk promoted to MEDIUM due to Production workspace boundaries");
      } else if (riskLevel === "MEDIUM") {
        riskLevel = "HIGH";
        approvalRequired = true;
        reasons.push("Risk promoted to HIGH with forced Approval due to Production environment");
      } else if (riskLevel === "HIGH") {
        riskLevel = "CRITICAL";
        approvalRequired = true;
        reasons.push("Risk promoted to CRITICAL due to Production environment constraints");
      }
    }

    // 3. Destructive modifier
    if (rule.destructive) {
      riskLevel = "CRITICAL";
      approvalRequired = true;
      reasons.push("Destructive operation detected: forces CRITICAL risk and human-in-the-loop approval");
    }

    // 4. Financial impact modifier
    if (rule.spendingLimitDollars && parameters.amount) {
      const amount = parseFloat(parameters.amount);
      if (!isNaN(amount) && amount > rule.spendingLimitDollars) {
        riskLevel = "CRITICAL";
        approvalRequired = true;
        reasons.push(`Spending threshold violated: Requested $${amount} exceeds limit of $${rule.spendingLimitDollars}`);
      }
    }

    // CRITICAL operations MUST NEVER execute automatically
    if (riskLevel === "CRITICAL") {
      approvalRequired = true;
    }

    return {
      riskLevel,
      approvalRequired,
      reason: reasons.join(". "),
    };
  }
}
