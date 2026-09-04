import type { ExecutionRequest } from "./execution.types.ts";

export interface PolicyDecision {
  allowed: boolean;
  requiresApproval: boolean;
  reason?: string;
}

export interface ExecutionPolicyConfig {
  allowShell: boolean;
  allowNetwork: boolean;
  allowFilesystemWrite: boolean;
  allowGit: boolean;
  allowDeployment: boolean;
  maxTimeoutMs: number;
}

export const DEFAULT_AUTONOMOUS_POLICY: ExecutionPolicyConfig = {
  allowShell: true,
  allowNetwork: false,
  allowFilesystemWrite: true,
  allowGit: true,
  allowDeployment: false,
  maxTimeoutMs: 120_000,
};

const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+\/(?:\s|$)/i,
  /mkfs\./i,
  /shutdown/i,
  /reboot/i,
  /:\(\)\s*\{\s*:\|:&\s*\};:/i,
  /curl\s+.*\|\s*(bash|sh)/i,
  /wget\s+.*\|\s*(bash|sh)/i,
];

export function validateCommand(
  command: string,
  policy: ExecutionPolicyConfig = DEFAULT_AUTONOMOUS_POLICY
) {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      return {
        allowed: false,
        reason: `Command matched blocked security rule: ${pattern}`,
      };
    }
  }

  if (!policy.allowGit && /\bgit\b/i.test(command)) {
    return {
      allowed: false,
      reason: "Git access is disabled for this execution context.",
    };
  }

  if (!policy.allowDeployment && /\b(deploy|vercel|production)\b/i.test(command)) {
    return {
      allowed: false,
      reason: "Production deployment is not allowed by this policy.",
    };
  }

  return {
    allowed: true,
  };
}

export class ExecutionPolicy {
  static evaluate(
    request: ExecutionRequest,
    policyConfig: ExecutionPolicyConfig = DEFAULT_AUTONOMOUS_POLICY
  ): PolicyDecision {
    if (!request.organizationId) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: "Organization identity is required.",
      };
    }

    if (!request.agentId) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: "Agent identity is required.",
      };
    }

    if ((request.mode as string) === "PRODUCTION") {
      return {
        allowed: false,
        requiresApproval: true,
        reason: "Direct production execution is forbidden.",
      };
    }

    if (request.command) {
      const validation = validateCommand(request.command, policyConfig);
      if (!validation.allowed) {
        return {
          allowed: false,
          requiresApproval: true,
          reason: validation.reason,
        };
      }
    }

    if (request.networkAccess && request.mode !== "NETWORK" && !policyConfig.allowNetwork) {
      return {
        allowed: false,
        requiresApproval: true,
        reason: "Network access is not permitted for this execution mode.",
      };
    }

    return {
      allowed: true,
      requiresApproval: false,
    };
  }
}
