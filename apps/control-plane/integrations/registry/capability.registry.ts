/**
 * Dynamic Capability Registry
 * Open-source composition style – pure TypeScript, no external deps.
 * Agents can discover, request, and be granted capabilities at runtime.
 */

export type CapabilityId = string; // e.g. "github.create_pull_request" or "code-execution.run_javascript"

export interface CapabilityDefinition {
  id: CapabilityId;
  tool: string;
  action: string;
  description: string;
  category: "development" | "research" | "database" | "storage" | "finance" | "communication" | "execution" | "system";
  baseRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requiresEngineeringRole?: boolean;
}

export interface AgentCapabilityGrant {
  agentId: string;
  capabilityId: CapabilityId;
  grantedAt: string;
  grantedBy: string; // "system" | "admin" | agentId
  expiresAt?: string | null;
  notes?: string;
}

export interface CapabilityRequest {
  id: string;
  agentId: string;
  capabilityId: CapabilityId;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export class CapabilityRegistry {
  private static definitions: Map<CapabilityId, CapabilityDefinition> = new Map();
  private static grants: Map<string, Set<CapabilityId>> = new Map(); // agentId → set of capabilityIds
  private static requests: Map<string, CapabilityRequest> = new Map();

  // ------------------------------------------------------------------
  // Seed all known capabilities (code-execution + research + original)
  // ------------------------------------------------------------------
  static {
    const defs: CapabilityDefinition[] = [
      // GitHub
      { id: "github.list_repositories", tool: "github", action: "list_repositories", description: "List repositories", category: "development", baseRisk: "LOW" },
      { id: "github.inspect_repository", tool: "github", action: "inspect_repository", description: "Inspect a repository", category: "development", baseRisk: "LOW" },
      { id: "github.create_branch", tool: "github", action: "create_branch", description: "Create a branch", category: "development", baseRisk: "LOW", requiresEngineeringRole: true },
      { id: "github.create_commit", tool: "github", action: "create_commit", description: "Create a commit", category: "development", baseRisk: "LOW", requiresEngineeringRole: true },
      { id: "github.create_pull_request", tool: "github", action: "create_pull_request", description: "Create a pull request", category: "development", baseRisk: "MEDIUM", requiresEngineeringRole: true },
      { id: "github.inspect_pull_request", tool: "github", action: "inspect_pull_request", description: "Inspect a pull request", category: "development", baseRisk: "LOW" },
      { id: "github.comment_on_pull_request", tool: "github", action: "comment_on_pull_request", description: "Comment on a PR", category: "development", baseRisk: "LOW" },
      { id: "github.merge_pull_request", tool: "github", action: "merge_pull_request", description: "Merge a pull request", category: "development", baseRisk: "HIGH", requiresEngineeringRole: true },
      { id: "github.trigger_workflow", tool: "github", action: "trigger_workflow", description: "Trigger a workflow", category: "development", baseRisk: "MEDIUM", requiresEngineeringRole: true },

      // Database
      { id: "postgresql.select", tool: "postgresql", action: "select", description: "Read from database", category: "database", baseRisk: "LOW" },
      { id: "postgresql.insert", tool: "postgresql", action: "insert", description: "Insert rows", category: "database", baseRisk: "MEDIUM" },
      { id: "postgresql.update", tool: "postgresql", action: "update", description: "Update rows", category: "database", baseRisk: "HIGH" },
      { id: "postgresql.execute_query", tool: "postgresql", action: "execute_query", description: "Execute a query", category: "database", baseRisk: "MEDIUM" },
      { id: "postgresql.alter_schema", tool: "postgresql", action: "alter_schema", description: "Alter schema", category: "database", baseRisk: "CRITICAL", requiresEngineeringRole: true },

      // Research (supercharged)
      { id: "google-search.search", tool: "google-search", action: "search", description: "Web search", category: "research", baseRisk: "LOW" },
      { id: "google-search.fetch_public_page", tool: "google-search", action: "fetch_public_page", description: "Fetch a public page", category: "research", baseRisk: "LOW" },
      { id: "google-search.extract_text", tool: "google-search", action: "extract_text", description: "Extract clean text", category: "research", baseRisk: "LOW" },
      { id: "google-search.multi_hop_research", tool: "google-search", action: "multi_hop_research", description: "Multi-hop research + synthesis", category: "research", baseRisk: "MEDIUM" },

      // Code Execution
      { id: "code-execution.run_javascript", tool: "code-execution", action: "run_javascript", description: "Run JavaScript in sandbox", category: "execution", baseRisk: "MEDIUM", requiresEngineeringRole: true },
      { id: "code-execution.run_typescript", tool: "code-execution", action: "run_typescript", description: "Run TypeScript in sandbox", category: "execution", baseRisk: "MEDIUM", requiresEngineeringRole: true },
      { id: "code-execution.write_temp_file", tool: "code-execution", action: "write_temp_file", description: "Write a temp file in sandbox", category: "execution", baseRisk: "LOW", requiresEngineeringRole: true },
      { id: "code-execution.read_temp_file", tool: "code-execution", action: "read_temp_file", description: "Read a temp file from sandbox", category: "execution", baseRisk: "LOW", requiresEngineeringRole: true },
      { id: "code-execution.list_temp_files", tool: "code-execution", action: "list_temp_files", description: "List sandbox files", category: "execution", baseRisk: "LOW", requiresEngineeringRole: true },

      // Other existing
      { id: "http.fetch_endpoint", tool: "http", action: "fetch_endpoint", description: "Fetch an HTTP endpoint", category: "system", baseRisk: "MEDIUM" },
      { id: "stripe.create_invoice", tool: "stripe", action: "create_invoice", description: "Create an invoice", category: "finance", baseRisk: "HIGH" },
      { id: "stripe.inspect_balance", tool: "stripe", action: "inspect_balance", description: "Inspect balance", category: "finance", baseRisk: "MEDIUM" },
      { id: "slack.post_message", tool: "slack", action: "post_message", description: "Post a Slack message", category: "communication", baseRisk: "MEDIUM" },
      { id: "cloud_storage.upload", tool: "cloud_storage", action: "upload", description: "Upload a file", category: "storage", baseRisk: "MEDIUM" },
      { id: "cloud_storage.download", tool: "cloud_storage", action: "download", description: "Download a file", category: "storage", baseRisk: "LOW" },
      { id: "cloud_storage.list", tool: "cloud_storage", action: "list", description: "List storage objects", category: "storage", baseRisk: "LOW" },

      // Computer Use / Browser
      { id: "computer-use.navigate", tool: "computer-use", action: "navigate", description: "Navigate browser to URL", category: "system", baseRisk: "MEDIUM" },
      { id: "computer-use.click", tool: "computer-use", action: "click", description: "Click an element", category: "system", baseRisk: "MEDIUM" },
      { id: "computer-use.type", tool: "computer-use", action: "type", description: "Type text into an element", category: "system", baseRisk: "MEDIUM" },
      { id: "computer-use.extract_text", tool: "computer-use", action: "extract_text", description: "Extract text from page", category: "system", baseRisk: "LOW" },
      { id: "computer-use.screenshot", tool: "computer-use", action: "screenshot", description: "Take a screenshot", category: "system", baseRisk: "LOW" },
      { id: "computer-use.evaluate", tool: "computer-use", action: "evaluate", description: "Evaluate JS in page", category: "system", baseRisk: "HIGH" },
      { id: "computer-use.close", tool: "computer-use", action: "close", description: "Close the browser", category: "system", baseRisk: "LOW" },

      // Project Writer
      { id: "project-writer.write_file", tool: "project-writer", action: "write_file", description: "Write a source file", category: "development", baseRisk: "MEDIUM", requiresEngineeringRole: true },
      { id: "project-writer.read_file", tool: "project-writer", action: "read_file", description: "Read a source file", category: "development", baseRisk: "LOW", requiresEngineeringRole: true },
      { id: "project-writer.list_files", tool: "project-writer", action: "list_files", description: "List project files", category: "development", baseRisk: "LOW", requiresEngineeringRole: true },
      { id: "project-writer.append_file", tool: "project-writer", action: "append_file", description: "Append to a file", category: "development", baseRisk: "MEDIUM", requiresEngineeringRole: true },
      { id: "project-writer.delete_file", tool: "project-writer", action: "delete_file", description: "Delete a file", category: "development", baseRisk: "HIGH", requiresEngineeringRole: true },
      { id: "project-writer.create_directory", tool: "project-writer", action: "create_directory", description: "Create a directory", category: "development", baseRisk: "LOW", requiresEngineeringRole: true },
    ];

    for (const d of defs) {
      this.definitions.set(d.id, d);
    }

    // Seed default grants (matches previous hardcoded lists + new powers)
    this.seedDefaultGrants();
  }

  private static seedDefaultGrants() {
    const grant = (agentId: string, caps: CapabilityId[]) => {
      if (!this.grants.has(agentId)) this.grants.set(agentId, new Set());
      const set = this.grants.get(agentId)!;
      for (const c of caps) set.add(c);
    };

    const fullEngineering = [
      "github.list_repositories", "github.inspect_repository", "github.create_branch", "github.create_commit",
      "github.create_pull_request", "github.inspect_pull_request", "github.comment_on_pull_request",
      "github.merge_pull_request", "github.trigger_workflow",
      "postgresql.select", "postgresql.insert", "postgresql.update", "postgresql.execute_query", "postgresql.alter_schema",
      "google-search.search", "google-search.fetch_public_page", "google-search.extract_text", "google-search.multi_hop_research",
      "code-execution.run_javascript", "code-execution.run_typescript",
      "code-execution.write_temp_file", "code-execution.read_temp_file", "code-execution.list_temp_files",
      "http.fetch_endpoint",
      "computer-use.navigate",
      "computer-use.click",
      "computer-use.type",
      "computer-use.extract_text",
      "computer-use.screenshot",
      "computer-use.evaluate",
      "computer-use.close",
      "project-writer.write_file",
      "project-writer.read_file",
      "project-writer.list_files",
      "project-writer.append_file",
      "project-writer.delete_file",
      "project-writer.create_directory",
    ];

    const researchHeavy = [
      "postgresql.select", "postgresql.execute_query",
      "google-search.search", "google-search.fetch_public_page",
      "google-search.extract_text", "google-search.multi_hop_research",
    ];

    grant("ruflo", fullEngineering);
    grant("michael", [
      ...fullEngineering,
      "stripe.create_invoice", "stripe.inspect_balance",
      "slack.post_message",
      "cloud_storage.upload", "cloud_storage.download", "cloud_storage.list",
    ]);
    grant("david", fullEngineering);
    grant("pete", [
      "github.list_repositories", "github.create_branch", "github.create_commit", "github.create_pull_request",
      "postgresql.select", "postgresql.execute_query",
      "google-search.search", "google-search.fetch_public_page", "google-search.extract_text", "google-search.multi_hop_research",
      "code-execution.run_javascript", "code-execution.run_typescript",
      "code-execution.write_temp_file", "code-execution.read_temp_file", "code-execution.list_temp_files",
      "project-writer.write_file", "project-writer.read_file", "project-writer.list_files",
      "project-writer.append_file", "project-writer.delete_file", "project-writer.create_directory",
    ]);
    grant("stanley", researchHeavy);
    grant("ryan", researchHeavy);
    grant("oscar", [
      "postgresql.select", "postgresql.insert", "postgresql.update", "postgresql.execute_query",
      "stripe.create_invoice", "stripe.inspect_balance",
    ]);
    grant("dwight", [
      "postgresql.select", "postgresql.insert", "postgresql.execute_query",
      "slack.post_message", "cloud_storage.upload", "cloud_storage.download",
    ]);
    grant("toby", [
      "postgresql.select", "postgresql.execute_query",
      "cloud_storage.list", "cloud_storage.upload",
    ]);
    grant("kevin", [
      "postgresql.select", "postgresql.execute_query",
      "stripe.inspect_balance", "http.fetch_endpoint",
    ]);
  }

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  static listAllDefinitions(): CapabilityDefinition[] {
    return Array.from(this.definitions.values());
  }

  static getDefinition(capabilityId: CapabilityId): CapabilityDefinition | undefined {
    return this.definitions.get(capabilityId);
  }

  static getCapabilitiesForAgent(agentId: string): CapabilityId[] {
    const set = this.grants.get(agentId);
    if (!set) {
      // Safe default for unknown agents
      return [
        "google-search.search",
        "google-search.fetch_public_page",
        "google-search.extract_text",
        "postgresql.select",
        "postgresql.execute_query",
      ];
    }
    return Array.from(set);
  }

  static hasCapability(agentId: string, capabilityId: CapabilityId): boolean {
    const caps = this.getCapabilitiesForAgent(agentId);
    return caps.includes(capabilityId);
  }

  static grantCapability(
    agentId: string,
    capabilityId: CapabilityId,
    grantedBy: string = "admin",
    notes?: string
  ): boolean {
    if (!this.definitions.has(capabilityId)) return false;
    if (!this.grants.has(agentId)) this.grants.set(agentId, new Set());
    this.grants.get(agentId)!.add(capabilityId);
    return true;
  }

  static revokeCapability(agentId: string, capabilityId: CapabilityId): boolean {
    const set = this.grants.get(agentId);
    if (!set) return false;
    return set.delete(capabilityId);
  }

  static requestCapability(
    agentId: string,
    capabilityId: CapabilityId,
    reason: string
  ): CapabilityRequest {
    if (!this.definitions.has(capabilityId)) {
      throw new Error(`Unknown capability: ${capabilityId}`);
    }

    const id = `capreq-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const req: CapabilityRequest = {
      id,
      agentId,
      capabilityId,
      reason,
      status: "PENDING",
      requestedAt: new Date().toISOString(),
    };
    this.requests.set(id, req);
    return req;
  }

  static resolveRequest(
    requestId: string,
    decision: "APPROVED" | "REJECTED",
    resolvedBy: string = "admin"
  ): CapabilityRequest | null {
    const req = this.requests.get(requestId);
    if (!req || req.status !== "PENDING") return null;

    req.status = decision;
    req.resolvedAt = new Date().toISOString();
    req.resolvedBy = resolvedBy;

    if (decision === "APPROVED") {
      this.grantCapability(req.agentId, req.capabilityId, resolvedBy, `Approved request ${requestId}`);
    }

    return req;
  }

  static listPendingRequests(): CapabilityRequest[] {
    return Array.from(this.requests.values()).filter((r) => r.status === "PENDING");
  }

  static listAllRequests(): CapabilityRequest[] {
    return Array.from(this.requests.values());
  }

  static listRequestsForAgent(agentId: string): CapabilityRequest[] {
    return Array.from(this.requests.values()).filter((r) => r.agentId === agentId);
  }
}
