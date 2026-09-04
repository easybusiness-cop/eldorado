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

/*
 * Block obviously destructive or privilege-escalating commands.
 *
 * This is NOT a complete sandbox. It is a policy layer.
 * Real production isolation should additionally use a container,
 * VM, WASM runtime, or another OS-level sandbox.
 */
const BLOCKED_PATTERNS: Array<[RegExp, string]> = [
  [/rm\s+-rf\s+\/(?:\s|$)/i, "Root filesystem deletion"],
  [/rm\s+-rf\s+\/\*/i, "Root filesystem deletion"],
  [/mkfs(?:\.[a-z0-9]+)?\b/i, "Filesystem formatting"],
  [/\bshutdown\b/i, "System shutdown"],
  [/\breboot\b/i, "System reboot"],
  [/\bpoweroff\b/i, "System poweroff"],
  [/\binit\s+[06]\b/i, "System runlevel change"],
  [/:.*\(\)\s*\{\s*:.*\|.*&\s*\};:/i, "Fork bomb"],
  [/curl\s+[^|]*\|\s*(bash|sh|zsh)\b/i, "Remote shell execution"],
  [/wget\s+[^|]*\|\s*(bash|sh|zsh)\b/i, "Remote shell execution"],
  [/\bchmod\s+777\b/i, "Unsafe global permissions"],
  [/\bchown\s+-R\s+.*\s+\/\s*$/i, "Root ownership modification"],
  [/\bsudo\s+/i, "Privilege escalation"],
  [/\bsu\s+-?\s*root\b/i, "Root account escalation"],
];

export function validateCommand(
  command: string,
  policy: ExecutionPolicyConfig = DEFAULT_AUTONOMOUS_POLICY,
) {
  const normalized = command.trim();

  if (!normalized) {
    return {
      allowed: false,
      reason: "Command cannot be empty.",
    };
  }

  for (const [pattern, reason] of BLOCKED_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        allowed: false,
        reason: `Command blocked: ${reason}.`,
      };
    }
  }

  if (!policy.allowShell) {
    return {
      allowed: false,
      reason: "Shell execution is disabled.",
    };
  }

  if (!policy.allowGit && /\bgit\b/i.test(normalized)) {
    return {
      allowed: false,
      reason: "Git access is disabled.",
    };
  }

  if (
    !policy.allowDeployment &&
    /\b(deploy|production|release|cloud\s*run|vercel)\b/i.test(
      normalized,
    )
  ) {
    return {
      allowed: false,
      reason: "Production deployment is disabled.",
    };
  }

  if (
    !policy.allowNetwork &&
    /\b(curl|wget|nc|netcat|ssh|scp|ftp)\b/i.test(normalized)
  ) {
    return {
      allowed: false,
      reason: "Network-capable shell utilities are disabled.",
    };
  }

  return {
    allowed: true,
  };
}

export class ExecutionPolicy {
  static evaluate(
    request: ExecutionRequest,
    policyConfig: ExecutionPolicyConfig =
      DEFAULT_AUTONOMOUS_POLICY,
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

    const timeoutMs = request.timeoutMs ?? 120_000;

    if (timeoutMs <= 0) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: "Timeout must be greater than zero.",
      };
    }

    if (timeoutMs > policyConfig.maxTimeoutMs) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: `Timeout exceeds policy maximum of ${policyConfig.maxTimeoutMs}ms.`,
      };
    }

    if (request.mode === "PRODUCTION" as never) {
      return {
        allowed: false,
        requiresApproval: true,
        reason: "Direct production execution is forbidden.",
      };
    }

    if (request.command) {
      const validation = validateCommand(
        request.command,
        policyConfig,
      );

      if (!validation.allowed) {
        return {
          allowed: false,
          requiresApproval: false,
          reason: validation.reason,
        };
      }
    }

    if (
      request.networkAccess &&
      !policyConfig.allowNetwork
    ) {
      return {
        allowed: false,
        requiresApproval: true,
        reason:
          "Network access is not permitted for this execution context.",
      };
    }

    return {
      allowed: true,
      requiresApproval: false,
    };
  }
}
