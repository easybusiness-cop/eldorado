export interface RiskAssessment {
  safe: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  violations: string[];
  requiresApproval: boolean;
}

export class RiskEngine {
  private static instance: RiskEngine;

  private constructor() {}

  public static getInstance(): RiskEngine {
    if (!RiskEngine.instance) {
      RiskEngine.instance = new RiskEngine();
    }
    return RiskEngine.instance;
  }

  /**
   * Evaluates the safety of a given tool execution with parameters.
   */
  public async assessRisk(
    toolName: string,
    params: any,
    context: { agentId: string; orgId: string }
  ): Promise<RiskAssessment> {
    const violations: string[] = [];
    let riskLevel: RiskAssessment['riskLevel'] = 'LOW';
    let requiresApproval = false;

    const paramStr = JSON.stringify(params || {}).toLowerCase();

    // 1. Scan for sensitive data leaks (PII or credentials)
    const sensitivePatterns = [
      { name: 'Private Key', pattern: /private_?key|passwd|password|secret_?key/i },
      { name: 'API Token', pattern: /bearer|token|apikey|ghp_|sk-/i },
      { name: 'SSN/Sensitive Personal Identifiers', pattern: /\b\d{3}-\d{2}-\d{4}\b/ },
    ];

    for (const item of sensitivePatterns) {
      if (item.pattern.test(paramStr)) {
        violations.push(`Potential credential leak detected in parameters: ${item.name}`);
        riskLevel = 'HIGH';
        requiresApproval = true;
      }
    }

    // 2. Classify safety profile based on action semantics
    const dangerousActions = ['delete', 'destroy', 'wipe', 'remove', 'purge', 'reset'];
    const writeActions = ['create', 'update', 'post', 'send', 'write', 'patch'];

    const normalizedTool = toolName.toLowerCase();
    
    if (dangerousActions.some(action => normalizedTool.includes(action))) {
      violations.push(`Destructive operation detected: ${toolName}`);
      riskLevel = 'CRITICAL';
      requiresApproval = true;
    } else if (writeActions.some(action => normalizedTool.includes(action))) {
      // Normal write actions are MEDIUM risk
      riskLevel = 'MEDIUM';
      // Some external service posts require approval
      if (normalizedTool.includes('gmail') || normalizedTool.includes('post_message')) {
        requiresApproval = true;
      }
    }

    return {
      safe: riskLevel !== 'CRITICAL',
      riskLevel,
      violations,
      requiresApproval,
    };
  }
}

export const riskEngine = RiskEngine.getInstance();
