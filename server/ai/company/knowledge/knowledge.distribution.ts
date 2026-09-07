import { mastraAgentRegistry } from "../../mastra/agents/index.ts";
import { capabilityEngine } from "../../../core/capabilities/capability.engine.ts";
import { KnowledgeArticle } from "./knowledge.manager.ts";

export interface DistributionLog {
  articleId: string;
  distributedToAgentIds: string[];
  timestamp: string;
}

export class KnowledgeDistribution {
  private static instance: KnowledgeDistribution;
  private distributionHistory: DistributionLog[] = [];

  private constructor() {}

  public static getInstance(): KnowledgeDistribution {
    if (!KnowledgeDistribution.instance) {
      KnowledgeDistribution.instance = new KnowledgeDistribution();
    }
    return KnowledgeDistribution.instance;
  }

  /**
   * Distributes a knowledge article to all relevant virtual employees,
   * teaching them the new concepts and updating their capability registries.
   */
  public async distributeKnowledge(article: KnowledgeArticle): Promise<DistributionLog> {
    console.log(`[KnowledgeDistribution] Distributing knowledge: "${article.title}" to relevant employees...`);

    const relevantAgents = mastraAgentRegistry.getAllAgents().filter((agent) => {
      const dept = agent.getDepartment().toLowerCase();
      return article.departmentScope.some((d) => d.toLowerCase() === dept);
    });

    const agentIds: string[] = [];

    for (const agent of relevantAgents) {
      console.log(`[KnowledgeDistribution] Teaching new concepts from "${article.title}" to employee: ${agent.getName()} [${agent.getDepartment().toUpperCase()}]`);

      // For every tag associated with the knowledge article, teach the agent the capability
      for (const tag of article.tags) {
        try {
          // Teach the agent the skill and assign it as learned
          capabilityEngine.recordLearning(
            agent.getId(),
            tag,
            [`Autonomous learning cycle ingested from Knowledge Article: "${article.title}" (ID: ${article.id})`]
          );

          // Give a solid initial understanding score
          capabilityEngine.record(
            agent.getId(),
            tag,
            true,
            0.85
          );
        } catch (err) {
          console.error(`[KnowledgeDistribution] Failed to teach capability "${tag}" to agent "${agent.getId()}":`, err);
        }
      }

      agentIds.push(agent.getId());
    }

    const logEntry: DistributionLog = {
      articleId: article.id,
      distributedToAgentIds: agentIds,
      timestamp: new Date().toISOString()
    };

    this.distributionHistory.push(logEntry);
    console.log(`[KnowledgeDistribution] Distributed article "${article.title}" to ${agentIds.length} employees successfully.`);

    return logEntry;
  }

  public getHistory(): DistributionLog[] {
    return this.distributionHistory;
  }
}

export const knowledgeDistribution = KnowledgeDistribution.getInstance();
