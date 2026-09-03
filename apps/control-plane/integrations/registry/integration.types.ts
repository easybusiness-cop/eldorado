// Apps Control Plane - Integration Types
export type IntegrationCategory =
  | "COMMUNICATION"
  | "DEVELOPMENT"
  | "DATABASE"
  | "STORAGE"
  | "CLOUD"
  | "SEARCH"
  | "ANALYTICS"
  | "FINANCE"
  | "CRM"
  | "PROJECT_MANAGEMENT"
  | "AUTHENTICATION"
  | "MONITORING"
  | "AI"
  | "OTHER";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Integration {
  id: string;
  name: string;
  provider: string;
  category: IntegrationCategory;
  capabilities: string[];
  authenticationType: "API_KEY" | "OAUTH2" | "BASIC" | "TOKEN" | "NONE";
  requiredScopes: string[];
  riskLevel: RiskLevel;
  enabled: boolean;
  healthStatus: "HEALTHY" | "DEGRADED" | "UNHEALTHY" | "UNKNOWN";
  metadata: Record<string, any>;
  organizationId: string;
}
