import type { ExecutionRequest } from "./execution.types.ts";

export interface PolicyDecision {
  allowed: boolean;
  requiresApproval: boolean;
  reason?: string;
}

const DANGEROUS_COMMANDS = [
  "rm -rf /",
  "mkfs",
  "dd if=",
  ":(){ :|:& };:",
  "shutdown",
  "reboot",
];

export class ExecutionPolicy {
  static evaluate(request: ExecutionRequest): PolicyDecision {
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

    const command = request.command?.toLowerCase() ?? "";

    for (const dangerous of DANGEROUS_COMMANDS) {
      if (command.includes(dangerous)) {
        return {
          allowed: false,
          requiresApproval: true,
          reason: "Dangerous command detected.",
        };
      }
    }

    if (request.networkAccess && request.mode !== "NETWORK") {
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
