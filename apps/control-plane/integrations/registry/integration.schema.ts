import { Integration, IntegrationCategory, RiskLevel } from "./integration.types";

export class IntegrationSchema {
  public static validate(data: any): { success: boolean; errors: string[]; data?: Integration } {
    const errors: string[] = [];

    if (!data || typeof data !== "object") {
      return { success: false, errors: ["Data must be an object"] };
    }

    const requiredFields = ["id", "name", "provider", "category", "capabilities", "authenticationType", "requiredScopes", "riskLevel", "enabled", "healthStatus", "organizationId"];
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    const validCategories: IntegrationCategory[] = [
      "COMMUNICATION", "DEVELOPMENT", "DATABASE", "STORAGE", "CLOUD",
      "SEARCH", "ANALYTICS", "FINANCE", "CRM", "PROJECT_MANAGEMENT",
      "AUTHENTICATION", "MONITORING", "AI", "OTHER"
    ];

    if (data.category && !validCategories.includes(data.category)) {
      errors.push(`Invalid category: ${data.category}. Allowed: ${validCategories.join(", ")}`);
    }

    const validRiskLevels: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    if (data.riskLevel && !validRiskLevels.includes(data.riskLevel)) {
      errors.push(`Invalid risk level: ${data.riskLevel}. Allowed: ${validRiskLevels.join(", ")}`);
    }

    if (data.capabilities && !Array.isArray(data.capabilities)) {
      errors.push("capabilities must be an array of strings");
    }

    if (data.requiredScopes && !Array.isArray(data.requiredScopes)) {
      errors.push("requiredScopes must be an array of strings");
    }

    const validAuthTypes = ["API_KEY", "OAUTH2", "BASIC", "TOKEN", "NONE"];
    if (data.authenticationType && !validAuthTypes.includes(data.authenticationType)) {
      errors.push(`Invalid authenticationType: ${data.authenticationType}. Allowed: ${validAuthTypes.join(", ")}`);
    }

    const validHealthStatuses = ["HEALTHY", "DEGRADED", "UNHEALTHY", "UNKNOWN"];
    if (data.healthStatus && !validHealthStatuses.includes(data.healthStatus)) {
      errors.push(`Invalid healthStatus: ${data.healthStatus}. Allowed: ${validHealthStatuses.join(", ")}`);
    }

    return {
      success: errors.length === 0,
      errors,
      data: errors.length === 0 ? (data as Integration) : undefined,
    };
  }
}
