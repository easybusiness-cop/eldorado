import { agentFleetRegistry } from './registry.ts';

export interface DelegationPlan {
  fromAgentId: string;
  toAgentId: string;
  reason: string;
  subtask: {
    title: string;
    description: string;
  };
}

export class DelegationEngine {
  public static resolveDelegation(prompt: string, currentAgentId: string): DelegationPlan | null {
    const text = prompt.toLowerCase();
    
    // If prompt is for engineering and current is not an engineer
    if ((text.includes('code') || text.includes('bug') || text.includes('api') || text.includes('database') || text.includes('build')) && currentAgentId === 'michael') {
      return {
        fromAgentId: 'michael',
        toAgentId: 'engineering-manager',
        reason: 'Technical task automatically delegated to Engineering Director',
        subtask: {
          title: `Technical Spec: ${prompt.slice(0, 40)}`,
          description: prompt,
        },
      };
    }

    // If prompt is for security/audit
    if (text.includes('security') || text.includes('vulnerability') || text.includes('redact') || text.includes('firewall')) {
      if (currentAgentId !== 'dwight') {
        return {
          fromAgentId: currentAgentId,
          toAgentId: 'dwight',
          reason: 'Security analysis delegated to Chief Security Officer',
          subtask: {
            title: `Security Audit: ${prompt.slice(0, 40)}`,
            description: prompt,
          },
        };
      }
    }

    return null;
  }
}
