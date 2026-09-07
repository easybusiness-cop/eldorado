export enum CapabilityCategory {
  ENGINEERING = "engineering",
  MARKETING = "marketing",
  RESEARCH = "research",
  EXECUTIVE = "executive",
  SYSTEM = "system",
  OPERATIONS = "operations",
  FINANCE = "finance"
}

export interface Capability {
  id: string;
  name: string;
  description: string;
  category: CapabilityCategory;
  requiredTier: number;
}

export class CapabilityRegistry {
  private static instance: CapabilityRegistry;
  private capabilities: Map<string, Capability> = new Map();

  private constructor() {
    this.registerDefaults();
  }

  public static getInstance(): CapabilityRegistry {
    if (!CapabilityRegistry.instance) {
      CapabilityRegistry.instance = new CapabilityRegistry();
    }
    return CapabilityRegistry.instance;
  }

  private registerDefaults() {
    const defaultCapabilities: Capability[] = [
      // Engineering Capabilities
      {
        id: "software_architecture",
        name: "Software Architecture Design",
        description: "Designing scalable software systems, data schemas, and service API contracts.",
        category: CapabilityCategory.ENGINEERING,
        requiredTier: 3
      },
      {
        id: "code_generation",
        name: "Code Generation",
        description: "Authoring functional code in languages such as TypeScript, Go, Python, and SQL.",
        category: CapabilityCategory.ENGINEERING,
        requiredTier: 1
      },
      {
        id: "code_review",
        name: "Code Review & Quality Control",
        description: "Auditing written code for security flaws, maintainability bottlenecks, and style conformity.",
        category: CapabilityCategory.ENGINEERING,
        requiredTier: 2
      },
      {
        id: "test_automation",
        name: "Test Automation Development",
        description: "Drafting unit, integration, and end-to-end automated tests.",
        category: CapabilityCategory.ENGINEERING,
        requiredTier: 1
      },
      {
        id: "devops_infrastructure",
        name: "DevOps & Infrastructure Management",
        description: "Configuring continuous delivery pipelines, Docker, Kubernetes, and Cloud resources.",
        category: CapabilityCategory.ENGINEERING,
        requiredTier: 3
      },
      {
        id: "security_auditing",
        name: "Security Auditing",
        description: "Analyzing threat vectors, checking vulnerability reports, and hardening configurations.",
        category: CapabilityCategory.ENGINEERING,
        requiredTier: 3
      },

      // Marketing Capabilities
      {
        id: "market_research",
        name: "Market Research",
        description: "Analyzing demographic segments, target audiences, and industry verticals.",
        category: CapabilityCategory.MARKETING,
        requiredTier: 1
      },
      {
        id: "competitor_analysis",
        name: "Competitor Analysis",
        description: "Tracking rival feature offerings, pricing schemas, and product placements.",
        category: CapabilityCategory.MARKETING,
        requiredTier: 2
      },
      {
        id: "marketing_strategy",
        name: "Marketing Strategy Formulation",
        description: "Designing campaign initiatives, pricing strategies, and product messaging blueprints.",
        category: CapabilityCategory.MARKETING,
        requiredTier: 3
      },
      {
        id: "content_creation",
        name: "Content Creation",
        description: "Authoring promotional copies, newsletters, blogs, and marketing assets.",
        category: CapabilityCategory.MARKETING,
        requiredTier: 1
      },
      {
        id: "seo_optimization",
        name: "SEO Optimization",
        description: "Keyword indexing, optimizing meta tags, and conducting search visibility analysis.",
        category: CapabilityCategory.MARKETING,
        requiredTier: 2
      },
      {
        id: "campaign_management",
        name: "Campaign Management",
        description: "Running advertising schedules, direct newsletters, and coordinating active events.",
        category: CapabilityCategory.MARKETING,
        requiredTier: 2
      },

      // Research Capabilities
      {
        id: "internet_research",
        name: "Internet & Web Research",
        description: "Retrieving web literature, searching documentations, and crawling online repositories.",
        category: CapabilityCategory.RESEARCH,
        requiredTier: 1
      },
      {
        id: "academic_synthesis",
        name: "Academic Literature Synthesis",
        description: "Reading research papers, synthesising patents, and consolidating theoretical discoveries.",
        category: CapabilityCategory.RESEARCH,
        requiredTier: 3
      },
      {
        id: "data_analysis",
        name: "Statistical Data Analysis",
        description: "Formulating models, running regression analysis, and compiling data tables.",
        category: CapabilityCategory.RESEARCH,
        requiredTier: 2
      },
      {
        id: "trend_forecasting",
        name: "Emerging Trend Forecasting",
        description: "Identifying technological, market, and operational disruptions early.",
        category: CapabilityCategory.RESEARCH,
        requiredTier: 3
      },

      // Executive & Management Capabilities
      {
        id: "objective_alignment",
        name: "Strategic Objective Alignment",
        description: "Formulating OKRs, milestones, and high-level strategy goals.",
        category: CapabilityCategory.EXECUTIVE,
        requiredTier: 3
      },
      {
        id: "workforce_delegation",
        name: "Workforce Task Delegation",
        description: "Identifying specialists, decomposing jobs, and routing operational tasks.",
        category: CapabilityCategory.EXECUTIVE,
        requiredTier: 2
      },
      {
        id: "budget_allocation",
        name: "Operational Budget Allocation",
        description: "Authorizing department spends, tracking budget consumption, and checking resource costs.",
        category: CapabilityCategory.EXECUTIVE,
        requiredTier: 3
      },
      {
        id: "policy_formulation",
        name: "Corporate Policy Formulation",
        description: "Setting compliance protocols, escalation criteria, and risk mitigation policies.",
        category: CapabilityCategory.EXECUTIVE,
        requiredTier: 3
      },

      // System Capabilities
      {
        id: "event_coordination",
        name: "Event-Based System Coordination",
        description: "Publishing and consuming structured messages across enterprise event buses.",
        category: CapabilityCategory.SYSTEM,
        requiredTier: 1
      },
      {
        id: "audit_ledger_recording",
        name: "Audit Ledger Recording",
        description: "Logging security events, performance logs, and risk traces for compliance checks.",
        category: CapabilityCategory.SYSTEM,
        requiredTier: 1
      }
    ];

    for (const cap of defaultCapabilities) {
      this.register(cap);
    }
  }

  public register(capability: Capability) {
    if (this.capabilities.has(capability.id)) {
      throw new Error(`Capability with ID "${capability.id}" is already registered.`);
    }
    this.capabilities.set(capability.id, capability);
  }

  public getCapability(id: string): Capability | undefined {
    return this.capabilities.get(id);
  }

  public getAllCapabilities(): Capability[] {
    return Array.from(this.capabilities.values());
  }

  public getCapabilitiesByCategory(category: CapabilityCategory): Capability[] {
    return this.getAllCapabilities().filter(c => c.category === category);
  }
}

export const capabilityRegistry = CapabilityRegistry.getInstance();
