import { capabilityRegistry } from "./capability.registry.ts";

export enum RoleCategory {
  ENGINEERING = "engineering",
  MARKETING = "marketing",
  RESEARCH = "research",
  EXECUTIVE = "executive",
  OPERATIONS = "operations"
}

export interface RoleDefinition {
  id: string;
  title: string;
  category: RoleCategory;
  description: string;
  baseCapabilities: string[]; // references Capability IDs
  systemPermissions: string[];
  instructions: string[];
}

export class RoleRegistry {
  private static instance: RoleRegistry;
  private roles: Map<string, RoleDefinition> = new Map();

  private constructor() {
    this.registerDefaults();
  }

  public static getInstance(): RoleRegistry {
    if (!RoleRegistry.instance) {
      RoleRegistry.instance = new RoleRegistry();
    }
    return RoleRegistry.instance;
  }

  private registerDefaults() {
    const defaultRoles: RoleDefinition[] = [
      // Engineering Department Roles
      {
        id: "engineering_manager",
        title: "Engineering Manager",
        category: RoleCategory.ENGINEERING,
        description: "Manages technical architecture design, conducts code reviews, and coordinates deployment goals.",
        baseCapabilities: ["software_architecture", "code_review", "objective_alignment", "workforce_delegation", "event_coordination"],
        systemPermissions: ["engineering:write", "engineering:read", "task:create", "task:read"],
        instructions: [
          "Prioritize technical architecture and high-level design specifications.",
          "Verify implementation details across development branches.",
          "Ensure that code reviews verify safety patterns and mitigate security bugs."
        ]
      },
      {
        id: "software_engineer",
        title: "Software Engineer",
        category: RoleCategory.ENGINEERING,
        description: "Produces well-structured code, designs localized data modules, and writes robust unit tests.",
        baseCapabilities: ["code_generation", "test_automation", "event_coordination"],
        systemPermissions: ["engineering:write", "engineering:read", "task:read"],
        instructions: [
          "Author clean, modular, and extensively documented TypeScript and Node code.",
          "Write corresponding unit tests to verify any feature additions.",
          "Avoid direct database alterations; utilize schema migrants and clean abstractions."
        ]
      },
      {
        id: "qa_engineer",
        title: "QA Engineer",
        category: RoleCategory.ENGINEERING,
        description: "Authors automated test suites, conducts validation sweeps, and documents bug traces.",
        baseCapabilities: ["test_automation", "code_review", "event_coordination"],
        systemPermissions: ["engineering:read", "task:read"],
        instructions: [
          "Design end-to-end integration test scenarios for newly deployed APIs.",
          "Assert validation constraints on system interfaces.",
          "Verify edge cases, error feedback loops, and failure conditions."
        ]
      },
      {
        id: "devops_engineer",
        title: "DevOps Engineer",
        category: RoleCategory.ENGINEERING,
        description: "Maintains operational pipelines, automates CI/CD jobs, and scales cloud environments.",
        baseCapabilities: ["devops_infrastructure", "event_coordination"],
        systemPermissions: ["engineering:write", "engineering:read", "task:read"],
        instructions: [
          "Optimize container and compilation builds for rapid cold-start times.",
          "Monitor environment uptimes, active service workloads, and socket networks.",
          "Automate scaling thresholds and infrastructure configurations."
        ]
      },
      {
        id: "security_engineer",
        title: "Security Engineer",
        category: RoleCategory.ENGINEERING,
        description: "Inspects codebases for security risks, monitors permission scopes, and implements firewalls.",
        baseCapabilities: ["security_auditing", "audit_ledger_recording", "code_review"],
        systemPermissions: ["security:audit", "engineering:read", "task:read"],
        instructions: [
          "Audit the code repository for hardcoded secrets, injection vectors, and weak validation routines.",
          "Monitor active event logs to find anomaly spikes or abnormal authorization attempts.",
          "Incorporate security checks directly inside CI build stages."
        ]
      },

      // Marketing Department Roles
      {
        id: "marketing_manager",
        title: "Marketing Manager",
        category: RoleCategory.MARKETING,
        description: "Coordinates marketing campaigns, establishes targeting scopes, and optimizes budgets.",
        baseCapabilities: ["marketing_strategy", "campaign_management", "objective_alignment", "workforce_delegation"],
        systemPermissions: ["marketing:write", "marketing:read", "task:create", "task:read"],
        instructions: [
          "Ensure marketing strategies are closely aligned with corporate OKRs.",
          "Delegate campaign content drafts to localized specialists.",
          "Monitor budget metrics to maximize click conversion parameters."
        ]
      },
      {
        id: "market_researcher_marketing",
        title: "Market Researcher (Marketing)",
        category: RoleCategory.MARKETING,
        description: "Researches user cohorts, runs demographic analysis, and reports product market positioning.",
        baseCapabilities: ["market_research", "competitor_analysis", "internet_research"],
        systemPermissions: ["marketing:read", "task:read"],
        instructions: [
          "Investigate user demographics and summarize current market trends.",
          "Generate comprehensive reports detailing rival product features and prices.",
          "Use structured web crawlers to collect qualitative product-review data."
        ]
      },
      {
        id: "content_specialist",
        title: "Content Specialist",
        category: RoleCategory.MARKETING,
        description: "Authors clear product documentation, blogs, and public advertising copies.",
        baseCapabilities: ["content_creation", "seo_optimization"],
        systemPermissions: ["marketing:write", "marketing:read", "task:read"],
        instructions: [
          "Write accessible, human-centric promotional materials.",
          "Refine heading structure and vocabulary to match current SEO standards.",
          "Ensure consistent visual and voice branding guidelines across all copy assets."
        ]
      },
      {
        id: "seo_specialist",
        title: "SEO Specialist",
        category: RoleCategory.MARKETING,
        description: "Conducts index visibility audits, performs keyword research, and optimizes search ranking.",
        baseCapabilities: ["seo_optimization", "internet_research"],
        systemPermissions: ["marketing:read", "task:read"],
        instructions: [
          "Track organic search rank positions for targeted product keywords.",
          "Audit technical search crawler bottlenecks (e.g., sitemaps, semantic tags).",
          "Collaborate with content writers to incorporate highly searched terms."
        ]
      },
      {
        id: "marketing_analyst",
        title: "Marketing Analyst",
        category: RoleCategory.MARKETING,
        description: "Tracks advertising spends, models conversions, and synthesizes campaign reports.",
        baseCapabilities: ["data_analysis", "competitor_analysis"],
        systemPermissions: ["marketing:read", "task:read"],
        instructions: [
          "Parse campaign conversion logs to pinpoint cost-per-click inefficiencies.",
          "Model multi-channel marketing campaigns using regression tools.",
          "Present key findings in readable, structured metrics boards."
        ]
      },

      // Research Department Roles
      {
        id: "research_manager",
        title: "Research Manager",
        category: RoleCategory.RESEARCH,
        description: "Directs technical research agendas, assigns tasks to researchers, and drafts study objectives.",
        baseCapabilities: ["objective_alignment", "workforce_delegation", "trend_forecasting"],
        systemPermissions: ["research:write", "research:read", "task:create", "task:read"],
        instructions: [
          "Establish high-impact scientific and technological exploration agendas.",
          "Decompose complex discoveries into specific learning tracks.",
          "Verify the reproducibility of academic literature syntheses."
        ]
      },
      {
        id: "technology_researcher",
        title: "Technology Researcher",
        category: RoleCategory.RESEARCH,
        description: "Examines technical whitepapers, reads documentation, and tracks emerging frameworks.",
        baseCapabilities: ["internet_research", "academic_synthesis", "trend_forecasting"],
        systemPermissions: ["research:read", "task:read"],
        instructions: [
          "Perform deep reviews on new technical specifications, library upgrades, and cloud offerings.",
          "Compile reports summarizing technical advantages and risks of early adoption.",
          "Translate abstract research formulas into clean operational suggestions."
        ]
      },
      {
        id: "market_researcher_research",
        title: "Market Researcher (Research)",
        category: RoleCategory.RESEARCH,
        description: "Performs industry research, competitor patent tracking, and financial forecasting.",
        baseCapabilities: ["market_research", "competitor_analysis", "internet_research"],
        systemPermissions: ["research:read", "task:read"],
        instructions: [
          "Track new startup releases, funding directions, and patent filings.",
          "Highlight commercial opportunities within scientific findings.",
          "Prepare market readiness sheets for technology transfers."
        ]
      },
      {
        id: "data_analyst",
        title: "Data Analyst",
        category: RoleCategory.RESEARCH,
        description: "Performs data cleaning, builds analytical dashboards, and tests research hypotheses.",
        baseCapabilities: ["data_analysis", "trend_forecasting"],
        systemPermissions: ["research:read", "task:read"],
        instructions: [
          "Analyze complex scientific and business data arrays.",
          "Filter out telemetry anomalies to guarantee study integrity.",
          "Formulate predictive mathematical projections of current performance parameters."
        ]
      }
    ];

    for (const role of defaultRoles) {
      this.register(role);
    }
  }

  public register(role: RoleDefinition) {
    if (this.roles.has(role.id)) {
      throw new Error(`Role with ID "${role.id}" is already registered.`);
    }

    // Validate that all referenced capabilities exist in our capability registry
    for (const capId of role.baseCapabilities) {
      if (!capabilityRegistry.getCapability(capId)) {
        throw new Error(`Cannot register role "${role.id}" because capability "${capId}" is not registered.`);
      }
    }

    this.roles.set(role.id, role);
  }

  public getRole(id: string): RoleDefinition | undefined {
    return this.roles.get(id);
  }

  public getAllRoles(): RoleDefinition[] {
    return Array.from(this.roles.values());
  }

  public getRolesByCategory(category: RoleCategory): RoleDefinition[] {
    return this.getAllRoles().filter(r => r.category === category);
  }
}

export const roleRegistry = RoleRegistry.getInstance();
