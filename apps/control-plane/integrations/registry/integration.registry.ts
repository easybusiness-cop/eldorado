import { Integration } from "./integration.types";

export class IntegrationRegistry {
  private static integrations: Map<string, Integration> = new Map();

  static {
    // Seed standard enterprise integrations for multi-tenant organizations
    const standardSeeds: Integration[] = [
      {
        id: "int-github",
        name: "GitHub Enterprise",
        provider: "github",
        category: "DEVELOPMENT",
        capabilities: ["list_repositories", "inspect_repository", "create_branch", "create_commit", "create_pull_request", "inspect_pull_request", "comment_on_pull_request", "merge_pull_request", "trigger_workflow"],
        authenticationType: "OAUTH2",
        requiredScopes: ["repo", "workflow", "write:discussion"],
        riskLevel: "HIGH",
        enabled: true,
        healthStatus: "HEALTHY",
        metadata: { allowedDomains: ["github.com", "api.github.com"] },
        organizationId: "org-munderdifflin",
      },
      {
        id: "int-postgres",
        name: "Cloud PostgreSQL Production",
        provider: "postgresql",
        category: "DATABASE",
        capabilities: ["schema_inspection", "select", "insert", "update", "transactional_operations", "alter_schema"],
        authenticationType: "API_KEY",
        requiredScopes: ["read", "write"],
        riskLevel: "CRITICAL",
        enabled: true,
        healthStatus: "HEALTHY",
        metadata: { host: "cloud-sql-postgres.internal", readOnlyForAgents: true },
        organizationId: "org-munderdifflin",
      },
      {
        id: "int-s3",
        name: "S3 Secure Storage",
        provider: "aws-s3",
        category: "STORAGE",
        capabilities: ["upload", "download", "list", "metadata", "delete"],
        authenticationType: "API_KEY",
        requiredScopes: ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
        riskLevel: "MEDIUM",
        enabled: true,
        healthStatus: "HEALTHY",
        metadata: { bucket: "munderdifflin-records-prod", maxSizeBytes: 52428800 },
        organizationId: "org-munderdifflin",
      },
      {
        id: "int-slack",
        name: "Slack Communications",
        provider: "slack",
        category: "COMMUNICATION",
        capabilities: ["post_message", "read_channel", "create_channel"],
        authenticationType: "TOKEN",
        requiredScopes: ["chat:write", "channels:read"],
        riskLevel: "MEDIUM",
        enabled: true,
        healthStatus: "HEALTHY",
        metadata: { defaultChannel: "#general-announcements" },
        organizationId: "org-munderdifflin",
      },
      {
        id: "int-stripe",
        name: "Stripe Billing System",
        provider: "stripe",
        category: "FINANCE",
        capabilities: ["inspect_balance", "list_charges", "create_invoice"],
        authenticationType: "API_KEY",
        requiredScopes: ["charges:read", "invoices:write"],
        riskLevel: "HIGH",
        enabled: true,
        healthStatus: "HEALTHY",
        metadata: { mode: "live" },
        organizationId: "org-munderdifflin",
      },
      {
        id: "int-research",
        name: "Controlled Web Researcher",
        provider: "google-search",
        category: "SEARCH",
        capabilities: ["search", "fetch_public_page", "extract_text", "summarize"],
        authenticationType: "NONE",
        requiredScopes: [],
        riskLevel: "LOW",
        enabled: true,
        healthStatus: "HEALTHY",
        metadata: { allowedDomains: ["wikipedia.org", "github.com", "npmtrends.com", "stackoverflow.com"], blockedDomains: ["reddit.com", "twitter.com", "facebook.com"] },
        organizationId: "org-munderdifflin",
      }
    ];

    for (const integration of standardSeeds) {
      this.integrations.set(integration.id, integration);
    }
  }

  public static register(integration: Integration): void {
    this.integrations.set(integration.id, integration);
  }

  public static get(id: string): Integration | undefined {
    return this.integrations.get(id);
  }

  public static getAll(organizationId: string): Integration[] {
    return Array.from(this.integrations.values()).filter(
      (i) => i.organizationId === organizationId
    );
  }

  public static updateStatus(id: string, status: Integration["healthStatus"]): boolean {
    const integration = this.integrations.get(id);
    if (integration) {
      integration.healthStatus = status;
      return true;
    }
    return false;
  }

  public static setEnabled(id: string, enabled: boolean): boolean {
    const integration = this.integrations.get(id);
    if (integration) {
      integration.enabled = enabled;
      return true;
    }
    return false;
  }
}
