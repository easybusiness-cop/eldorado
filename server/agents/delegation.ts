import { agentFleetRegistry } from './registry.ts';

export interface TaskCapabilityModel {
  intent: string;
  requiredCapabilities: string[];
  resource: "production" | "staging" | "sandbox" | "unknown";
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  approvalRequired: boolean;
}

export interface DelegationPlan {
  fromAgentId: string;
  toAgentId: string;
  reason: string;
  subtask: {
    title: string;
    description: string;
  };
  capabilityContext?: TaskCapabilityModel;
}

export class DelegationEngine {
  /**
   * Statically parses intent, resources, capabilities, risk, and approval requirements.
   */
  public static classifyTask(prompt: string): TaskCapabilityModel {
    const text = prompt.toLowerCase();
    
    let intent = "general-query";
    const requiredCapabilities: string[] = [];
    let resource: "production" | "staging" | "sandbox" | "unknown" = "sandbox";
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    let approvalRequired = false;

    // Detect Intent and Capabilities
    if (text.includes("database") || text.includes("postgres") || text.includes("table") || text.includes("sql")) {
      intent = "modify-database";
      requiredCapabilities.push("database.write");
      if (text.includes("production") || text.includes("prod") || text.includes("drop") || text.includes("delete")) {
        resource = "production";
        riskLevel = "CRITICAL";
        approvalRequired = true;
      } else {
        resource = "staging";
        riskLevel = "MEDIUM";
      }
    } else if (text.includes("execute") || text.includes("eval") || text.includes("run code") || text.includes("apply patch") || text.includes("system module")) {
      intent = "execute-system-code";
      requiredCapabilities.push("system.execution");
      resource = "production"; // All dynamic modules run inside system container
      riskLevel = "HIGH";
      approvalRequired = true;
    } else if (text.includes("security") || text.includes("vulnerability") || text.includes("redact") || text.includes("firewall") || text.includes("audit")) {
      intent = "security-audit";
      requiredCapabilities.push("security.audit");
      resource = "staging";
      riskLevel = "MEDIUM";
    } else if (text.includes("code") || text.includes("bug") || text.includes("api") || text.includes("build") || text.includes("compile")) {
      intent = "engineering-task";
      requiredCapabilities.push("code.compile");
      resource = "staging";
      riskLevel = "LOW";
    } else if (text.includes("ledger") || text.includes("financial") || text.includes("tax") || text.includes("budget")) {
      intent = "finance-accounting";
      requiredCapabilities.push("ledger.write");
      resource = "production";
      riskLevel = "HIGH";
      approvalRequired = true;
    }

    return {
      intent,
      requiredCapabilities,
      resource,
      riskLevel,
      approvalRequired
    };
  }

  /**
   * Resolves delegation plans based on specialist capabilities.
   */
  public static resolveDelegation(prompt: string, currentAgentId: string): DelegationPlan | null {
    const classification = this.classifyTask(prompt);
    
    // Technical engineering task delegation
    if (classification.requiredCapabilities.includes("code.compile") || classification.requiredCapabilities.includes("database.write") || classification.requiredCapabilities.includes("system.execution")) {
      if (currentAgentId === 'michael') {
        const delegateTo = "engineering-manager";
        return {
          fromAgentId: 'michael',
          toAgentId: delegateTo,
          reason: `Technical task with intent "${classification.intent}" requiring [${classification.requiredCapabilities.join(", ")}] automatically delegated to Engineering Director (Risk Level: ${classification.riskLevel})`,
          subtask: {
            title: `Technical Spec: ${prompt.slice(0, 40)}`,
            description: prompt,
          },
          capabilityContext: classification
        };
      }
    }

    // Security task delegation
    if (classification.requiredCapabilities.includes("security.audit")) {
      if (currentAgentId !== 'dwight') {
        return {
          fromAgentId: currentAgentId,
          toAgentId: 'dwight',
          reason: `Security analysis and credential auditing matching intent "${classification.intent}" delegated to Chief Security Officer.`,
          subtask: {
            title: `Security Audit: ${prompt.slice(0, 40)}`,
            description: prompt,
          },
          capabilityContext: classification
        };
      }
    }

    return null;
  }
}
