import { RiskLevel } from "../registry/integration.types";

export interface PolicyRule {
  id: string;
  tool: string;
  action: string;
  environment?: string;
  allowed: boolean;
  requiresApproval: boolean;
  maxSpendingLimit?: number;
  blockedRoles?: string[];
  allowedDepartments?: string[];
}

export class PolicyEngine {
  private static policies: PolicyRule[] = [
    {
      id: "pol-git-merge",
      tool: "github",
      action: "merge_pull_request",
      allowed: true,
      requiresApproval: true,
      allowedDepartments: ["Engineering", "Executive"]
    },
    {
      id: "pol-db-write-prod",
      tool: "postgresql",
      action: "update",
      environment: "production",
      allowed: false,
      requiresApproval: true,
    },
    {
      id: "pol-db-alter",
      tool: "postgresql",
      action: "alter_schema",
      allowed: true,
      requiresApproval: true,
      allowedDepartments: ["Engineering"]
    },
    {
      id: "pol-delete-bucket",
      tool: "cloud_storage",
      action: "delete",
      allowed: true,
      requiresApproval: true,
      blockedRoles: ["assistant", "intern"]
    },
    {
      id: "pol-invoice-finance",
      tool: "stripe",
      action: "create_invoice",
      allowed: true,
      requiresApproval: true,
      maxSpendingLimit: 2000,
      allowedDepartments: ["Finance", "Executive"]
    }
  ];

  public static evaluate(
    context: {
      tool: string;
      action: string;
      role: string;
      department: string;
      environment: string;
      parameters: Record<string, any>;
    }
  ): { allowed: boolean; reason: string; requiresApproval: boolean } {
    // A: Look for matching policy rule (or narrowest matching environment rule)
    const matchedRule = this.policies.find(
      (p) =>
        p.tool === context.tool &&
        p.action === context.action &&
        (!p.environment || p.environment === context.environment)
    );

    if (!matchedRule) {
      // If no explicit restricting policy rule, default to permitted, standard risk evaluation will apply
      return { allowed: true, reason: "No restrictive policy rule found. Proceeding to standard risk evaluation.", requiresApproval: false };
    }

    // B: Check explicit allowance
    if (!matchedRule.allowed) {
      return {
        allowed: false,
        reason: `Access Denied: Enterprise policy [${matchedRule.id}] explicitly forbids ${context.tool}.${context.action} operations in ${context.environment} environments.`,
        requiresApproval: false
      };
    }

    // C: Check department boundaries
    if (matchedRule.allowedDepartments && !matchedRule.allowedDepartments.includes(context.department)) {
      return {
        allowed: false,
        reason: `Department Boundary Violation: Operational action "${context.tool}.${context.action}" is restricted to departments: ${matchedRule.allowedDepartments.join(", ")}. Employee belongs to: ${context.department}`,
        requiresApproval: false
      };
    }

    // D: Check blocked roles
    if (matchedRule.blockedRoles && matchedRule.blockedRoles.includes(context.role.toLowerCase())) {
      return {
        allowed: false,
        reason: `Role Security Restriction: Your role [${context.role}] is explicitly prohibited from triggering action "${context.tool}.${context.action}" under policy guidelines.`,
        requiresApproval: false
      };
    }

    // E: Spending bounds
    if (matchedRule.maxSpendingLimit && context.parameters.amount) {
      const spending = parseFloat(context.parameters.amount);
      if (!isNaN(spending) && spending > matchedRule.maxSpendingLimit) {
        return {
          allowed: false,
          reason: `Financial Cap Exceeded: Policy limits ${context.tool}.${context.action} to $${matchedRule.maxSpendingLimit}. Requested amount: $${spending}`,
          requiresApproval: false
        };
      }
    }

    return {
      allowed: true,
      reason: `Policy check passed under criteria [${matchedRule.id}].`,
      requiresApproval: matchedRule.requiresApproval
    };
  }
}
