import { knowledgeManager } from "./knowledge.manager.ts";
import { capabilityEngine } from "../../../core/capabilities/capability.engine.ts";
import { knowledgeDistribution } from "./knowledge.distribution.ts";
import { TechDiscovery } from "./discovery.engine.ts";
import { ResearchBrief } from "./research.manager.ts";

export class LearningEngine {
  private static instance: LearningEngine;

  private constructor() {}

  public static getInstance(): LearningEngine {
    if (!LearningEngine.instance) {
      LearningEngine.instance = new LearningEngine();
    }
    return LearningEngine.instance;
  }

  /**
   * Ingests a completed research brief, creates a corporate knowledge article,
   * and triggers learning across the workforce.
   */
  public async ingestResearchBrief(brief: ResearchBrief, discovery: TechDiscovery): Promise<void> {
    console.log(`[LearningEngine] Ingesting research brief for topic: "${brief.topic}"`);

    // 1. Create a structured knowledge article inside the Knowledge Manager
    const article = knowledgeManager.addArticle({
      title: brief.topic,
      summary: discovery.summary,
      content: brief.briefContent,
      sourceUrl: discovery.url,
      tags: discovery.technologies,
      departmentScope: discovery.departments || ["research", "engineering"],
      verified: true,
      learningImpact: discovery.severity === "critical" ? "high" : "medium"
    });

    // 2. Proactively update capability mappings in the central CapabilityEngine
    // Assign and record learning for the research analyst who executed the study
    try {
      for (const tech of discovery.technologies) {
        capabilityEngine.recordLearning(
          brief.assignedAgentId,
          tech,
          [`Successfully analyzed and synthesized tech brief for: "${discovery.title}"`]
        );

        // Boost the score for executing a successful research cycle
        capabilityEngine.record(
          brief.assignedAgentId,
          tech,
          true,
          0.95
        );
      }
    } catch (err) {
      console.error(`[LearningEngine] Failed to assign dynamic capabilities to analyst agent:`, err);
    }

    // 3. Coordinate knowledge distribution to the rest of the relevant workforce
    await knowledgeDistribution.distributeKnowledge(article);
  }
}

export const learningEngine = LearningEngine.getInstance();
