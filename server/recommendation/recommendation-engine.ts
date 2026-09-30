export type RecommendationItemType =
  | "agent"
  | "task"
  | "workflow"
  | "tool"
  | "prompt"
  | "model"
  | "feature";

export interface UserBehaviorEvent {
  id: string;
  userId: string;
  sessionId?: string;
  eventType: "view" | "click" | "dispatch" | "execute" | "chat" | "search" | "complete";
  itemId: string;
  itemType: RecommendationItemType;
  itemTitle: string;
  category: string;
  tags: string[];
  weight: number; // 1 to 10
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface RecommendedItem {
  id: string;
  title: string;
  description: string;
  itemType: RecommendationItemType;
  category: string;
  tags?: string[];
  score: number; // 0.00 to 1.00
  trendingScore: number;
  collaborativeScore: number;
  reason: string;
  badge?: string;
  icon?: string;
  actionPayload?: Record<string, any>;
}

export interface IntelligenceRecommendationContext {
  prompt: string;
  recommendedAgents: RecommendedItem[];
  recommendedTools: RecommendedItem[];
  recommendedActions: RecommendedItem[];
  trendingTopics: string[];
  userAffinities: Record<string, number>;
}

class RecommendationEngine {
  private events: UserBehaviorEvent[] = [];
  private itemCatalog: Map<string, RecommendedItem> = new Map();
  private userItemMatrix: Map<string, Map<string, number>> = new Map(); // userId -> itemId -> totalWeight
  private itemPopularity: Map<string, { count: number; weightedSum: number; lastActive: number }> = new Map();

  constructor() {
    this.seedCatalog();
    this.seedInitialBehaviorEvents();
  }

  private seedCatalog() {
    const catalog: RecommendedItem[] = [
      // Agents
      {
        id: "agent-repository-engineer",
        title: "Repository & CI/CD Engineer",
        description: "Autonomous git operations, PR creations, and branch automation.",
        itemType: "agent",
        category: "engineering",
        score: 0.95,
        trendingScore: 0.92,
        collaborativeScore: 0.88,
        reason: "High synergy with code builds and software development tasks",
        badge: "Top Agent",
        icon: "GitBranch",
        actionPayload: { agentId: "ruflo", action: "dispatch" },
      },
      {
        id: "agent-infrastructure-engineer",
        title: "Cloud & Infrastructure Engineer",
        description: "Container orchestration, microservice mesh topology, and Kubernetes scaling.",
        itemType: "agent",
        category: "infrastructure",
        score: 0.91,
        trendingScore: 0.89,
        collaborativeScore: 0.85,
        reason: "Frequently paired with API Gateway and load balancing deployments",
        badge: "DevOps",
        icon: "Server",
        actionPayload: { agentId: "ruflo", action: "dispatch" },
      },
      {
        id: "agent-security-auditor",
        title: "Zero-Trust Security Auditor",
        description: "Payload scanning, vulnerability fuzzing, and RBAC token audits.",
        itemType: "agent",
        category: "security",
        score: 0.88,
        trendingScore: 0.85,
        collaborativeScore: 0.82,
        reason: "Automated gatekeeping for all outgoing network proxies",
        badge: "Security",
        icon: "ShieldAlert",
        actionPayload: { agentId: "michael", action: "dispatch" },
      },
      {
        id: "agent-browser-crawler",
        title: "Playwright Web Crawler & Scraper",
        description: "Headless Chromium browser-use agent for live web data extraction.",
        itemType: "agent",
        category: "web",
        score: 0.96,
        trendingScore: 0.98,
        collaborativeScore: 0.94,
        reason: "Trending in deep research & live web queries",
        badge: "Browser-Use",
        icon: "Globe",
        actionPayload: { agentId: "browser-agent", action: "browse" },
      },
      // Tools
      {
        id: "tool-browser-use",
        title: "Browser-Use DOM Engine",
        description: "Executes multi-step browser workflows, forms, and DOM extractions.",
        itemType: "tool",
        category: "automation",
        score: 0.97,
        trendingScore: 0.99,
        collaborativeScore: 0.95,
        reason: "Enables agents to browse live web targets in real-time",
        badge: "Browser-Use",
        icon: "Compass",
      },
      {
        id: "tool-api-gateway",
        title: "API Gateway & Load Balancer",
        description: "Single entry point for request routing, auth validation, and rate limiting.",
        itemType: "tool",
        category: "networking",
        score: 0.94,
        trendingScore: 0.95,
        collaborativeScore: 0.91,
        reason: "Core enterprise routing layer for microservices",
        badge: "Core",
        icon: "Network",
      },
      {
        id: "tool-kafka-eventbus",
        title: "Kafka/RabbitMQ Event Bus",
        description: "Asynchronous pub/sub message broker with DLQ fault tolerance.",
        itemType: "tool",
        category: "messaging",
        score: 0.92,
        trendingScore: 0.93,
        collaborativeScore: 0.89,
        reason: "Provides reliable async event streaming between fleet microservices",
        badge: "Streaming",
        icon: "Radio",
      },
      {
        id: "tool-rag-knowledge-graph",
        title: "Enterprise Knowledge Graph & RAG",
        description: "Vector embeddings and hybrid semantic search across company docs.",
        itemType: "tool",
        category: "ai",
        score: 0.93,
        trendingScore: 0.91,
        collaborativeScore: 0.90,
        reason: "Injects deep enterprise memory into Quantum Intelligence responses",
        badge: "RAG",
        icon: "Database",
      },
      // Workflows & Autonomous Actions
      {
        id: "workflow-e2e-audit",
        title: "Full-Stack Security & Lint Audit",
        description: "Execute static analysis, ESLint audit, and security payload fuzzing.",
        itemType: "workflow",
        category: "engineering",
        score: 0.89,
        trendingScore: 0.86,
        collaborativeScore: 0.87,
        reason: "Ensures production compliance across all microservices",
        badge: "Automated",
        icon: "CheckCircle2",
      },
      {
        id: "workflow-scrape-synthesis",
        title: "Autonomous Web Research & Briefing",
        description: "Multi-hop web crawl with automatic executive summary generation.",
        itemType: "workflow",
        category: "research",
        score: 0.95,
        trendingScore: 0.97,
        collaborativeScore: 0.93,
        reason: "Most requested automated workflow by operators using Quantum Intelligence",
        badge: "Research",
        icon: "Sparkles",
      },
    ];

    catalog.forEach((item) => this.itemCatalog.set(item.id, item));
  }

  private seedInitialBehaviorEvents() {
    const defaultUserId = "dev-admin-user";
    const sampleInteractions = [
      { itemId: "agent-browser-crawler", itemType: "agent" as const, category: "web", title: "Playwright Web Crawler", weight: 9 },
      { itemId: "tool-browser-use", itemType: "tool" as const, category: "automation", title: "Browser-Use DOM Engine", weight: 10 },
      { itemId: "agent-repository-engineer", itemType: "agent" as const, category: "engineering", title: "Repository Engineer", weight: 8 },
      { itemId: "tool-api-gateway", itemType: "tool" as const, category: "networking", title: "API Gateway", weight: 9 },
      { itemId: "tool-kafka-eventbus", itemType: "tool" as const, category: "messaging", title: "Event Bus Broker", weight: 7 },
      { itemId: "workflow-scrape-synthesis", itemType: "workflow" as const, category: "research", title: "Autonomous Research", weight: 8 },
    ];

    sampleInteractions.forEach((s, idx) => {
      this.trackEvent({
        id: `event-init-${idx}`,
        userId: defaultUserId,
        eventType: "execute",
        itemId: s.itemId,
        itemType: s.itemType,
        itemTitle: s.title,
        category: s.category,
        tags: [s.category, "autonomous", "production"],
        weight: s.weight,
        timestamp: Date.now() - (10 - idx) * 3600 * 1000,
      });
    });
  }

  public trackEvent(event: Omit<UserBehaviorEvent, "id"> & { id?: string }): UserBehaviorEvent {
    const fullEvent: UserBehaviorEvent = {
      id: event.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: event.timestamp || Date.now(),
      ...event,
    };

    this.events.push(fullEvent);
    if (this.events.length > 2000) {
      this.events = this.events.slice(-1000);
    }

    // Update User-Item Matrix
    if (!this.userItemMatrix.has(fullEvent.userId)) {
      this.userItemMatrix.set(fullEvent.userId, new Map());
    }
    const userWeights = this.userItemMatrix.get(fullEvent.userId)!;
    const currentWeight = userWeights.get(fullEvent.itemId) || 0;
    userWeights.set(fullEvent.itemId, currentWeight + fullEvent.weight);

    // Update Item Popularity with time decay
    const pop = this.itemPopularity.get(fullEvent.itemId) || { count: 0, weightedSum: 0, lastActive: Date.now() };
    pop.count += 1;
    pop.weightedSum += fullEvent.weight;
    pop.lastActive = Date.now();
    this.itemPopularity.set(fullEvent.itemId, pop);

    return fullEvent;
  }

  public getTrending(limit = 6, itemType?: RecommendationItemType): RecommendedItem[] {
    const now = Date.now();
    const halfLifeMs = 24 * 3600 * 1000; // 24 hours decay
    const lambda = Math.LN2 / halfLifeMs;

    const scoredItems: Array<{ item: RecommendedItem; trendingScore: number }> = [];

    for (const item of this.itemCatalog.values()) {
      if (itemType && item.itemType !== itemType) continue;

      const pop = this.itemPopularity.get(item.id) || { count: 1, weightedSum: 5, lastActive: now - 3600000 };
      const ageMs = Math.max(0, now - pop.lastActive);
      const decay = Math.exp(-lambda * ageMs);
      const score = Math.min(1.0, Math.max(0.2, (pop.weightedSum / 50) * decay + 0.3));

      scoredItems.push({
        item: { ...item, trendingScore: Number(score.toFixed(3)), score: Number(score.toFixed(3)) },
        trendingScore: score,
      });
    }

    return scoredItems
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit)
      .map((s) => s.item);
  }

  public getPersonalized(userId: string, limit = 8, itemType?: RecommendationItemType): RecommendedItem[] {
    const userInteractions = this.userItemMatrix.get(userId);
    const trending = this.getTrending(limit * 2, itemType);

    if (!userInteractions || userInteractions.size === 0) {
      return trending.slice(0, limit);
    }

    // Collaborative Filtering: compute similarity with other users & item affinities
    const categoryScores: Record<string, number> = {};
    for (const [itemId, weight] of userInteractions.entries()) {
      const item = this.itemCatalog.get(itemId);
      if (item) {
        categoryScores[item.category] = (categoryScores[item.category] || 0) + weight;
      }
    }

    const personalized = trending.map((item) => {
      const affinity = (categoryScores[item.category] || 0) / 20;
      const directWeight = (userInteractions.get(item.id) || 0) / 30;
      const collaborativeScore = Math.min(1.0, Math.max(0.4, 0.5 * item.trendingScore + 0.3 * affinity + 0.2 * directWeight));

      return {
        ...item,
        collaborativeScore: Number(collaborativeScore.toFixed(3)),
        score: Number(((collaborativeScore + item.trendingScore) / 2).toFixed(3)),
        reason: affinity > 0.5 ? `Personalized based on frequent ${item.category} operations` : item.reason,
      };
    });

    return personalized.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  public getIntelligenceContext(prompt: string, userId = "dev-admin-user"): IntelligenceRecommendationContext {
    const lowerPrompt = prompt.toLowerCase();

    // Semantic Intent Extraction
    let targetCategory = "general";
    if (lowerPrompt.includes("git") || lowerPrompt.includes("code") || lowerPrompt.includes("repo") || lowerPrompt.includes("bug")) {
      targetCategory = "engineering";
    } else if (lowerPrompt.includes("browse") || lowerPrompt.includes("scrape") || lowerPrompt.includes("search") || lowerPrompt.includes("web") || lowerPrompt.includes("url")) {
      targetCategory = "web";
    } else if (lowerPrompt.includes("gateway") || lowerPrompt.includes("route") || lowerPrompt.includes("rate limit") || lowerPrompt.includes("balance")) {
      targetCategory = "networking";
    } else if (lowerPrompt.includes("microservice") || lowerPrompt.includes("queue") || lowerPrompt.includes("kafka") || lowerPrompt.includes("rabbitmq")) {
      targetCategory = "messaging";
    } else if (lowerPrompt.includes("security") || lowerPrompt.includes("auth") || lowerPrompt.includes("token")) {
      targetCategory = "security";
    }

    const agents = this.getPersonalized(userId, 4, "agent");
    const tools = this.getPersonalized(userId, 4, "tool");
    const workflows = this.getPersonalized(userId, 4, "workflow");

    // Boost items that match prompt keywords
    const boostMatching = (items: RecommendedItem[]) =>
      items.map((item) => {
        let boosted = item.score;
        if (item.category === targetCategory) boosted = Math.min(1.0, boosted + 0.15);
        if (lowerPrompt.includes(item.title.toLowerCase()) || item.tags?.some((t: string) => lowerPrompt.includes(t))) {
          boosted = Math.min(1.0, boosted + 0.25);
        }
        return { ...item, score: Number(boosted.toFixed(3)) };
      }).sort((a, b) => b.score - a.score);

    const userInteractions = this.userItemMatrix.get(userId);
    const userAffinities: Record<string, number> = {};
    if (userInteractions) {
      for (const [id, weight] of userInteractions.entries()) {
        userAffinities[id] = weight;
      }
    }

    return {
      prompt,
      recommendedAgents: boostMatching(agents),
      recommendedTools: boostMatching(tools),
      recommendedActions: boostMatching(workflows),
      trendingTopics: ["Playwright Live Scrapes", "API Gateway Routing", "Kafka Event Bus Streams", "Microservices Service Discovery"],
      userAffinities,
    };
  }

  public getRecentEvents(limit = 50): UserBehaviorEvent[] {
    return this.events.slice(-limit).reverse();
  }

  public getStats() {
    return {
      totalEvents: this.events.length,
      totalCatalogItems: this.itemCatalog.size,
      activeUsers: this.userItemMatrix.size,
      topCategories: ["web", "engineering", "networking", "messaging", "ai", "security"],
    };
  }
}

export const recommendationEngine = new RecommendationEngine();
