import { capabilityEngine } from "../../core/capabilities/capability.engine.ts";
import { skillMemory } from "../../core/learning/skill-memory.ts";
import { failureMemory } from "../../core/learning/failure-memory.ts";

export interface TrainingChallenge {
  id: string;
  skill: string;
  difficulty: number;
  objective: string;
}

export class MasterTrainer {
  async train(agentId: string) {
    const weaknesses = capabilityEngine.weaknesses(agentId);

    const skills = weaknesses.length
      ? weaknesses.map((x) => x.skill)
      : ["reasoning", "coding", "research", "verification"];

    const curriculum = this.buildCurriculum(skills);

    const results = [];

    for (const challenge of curriculum) {
      const result = await this.runChallenge(agentId, challenge);

      results.push(result);

      capabilityEngine.record(
        agentId,
        challenge.skill,
        result.passed,
        result.score
      );

      if (result.passed && result.score >= 0.9) {
        skillMemory.promote({
          id: `${agentId}:${challenge.skill}`,
          name: challenge.skill,
          description: `Verified capability in ${challenge.skill}`,
          procedure: result.procedure,
          evidence: result.evidence,
          successRate: result.score,
          uses: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return {
      agentId,
      curriculum,
      results,
      profile: capabilityEngine.get(agentId),
    };
  }

  private buildCurriculum(skills: string[]): TrainingChallenge[] {
    return skills.map((skill, index) => ({
      id: `challenge-${skill}-${Date.now()}`,
      skill,
      difficulty: Math.min(10, 4 + index),
      objective: this.challengeFor(skill),
    }));
  }

  private challengeFor(skill: string) {
    const challenges: Record<string, string> = {
      coding: "Implement and test a non-trivial feature.",
      reasoning:
        "Solve a novel multi-step reasoning problem and verify the result.",
      research:
        "Research a technical question using multiple independent sources and identify contradictions.",
      verification: "Find hidden defects in a supplied implementation.",
      architecture:
        "Design a scalable system under explicit cost, reliability and security constraints.",
      security:
        "Identify and remediate vulnerabilities in an isolated test project.",
    };

    return (
      challenges[skill] ??
      `Solve an advanced ${skill} problem and provide independently verifiable evidence.`
    );
  }

  private async runChallenge(agentId: string, challenge: TrainingChallenge) {
    return {
      passed: false,
      score: 0,
      procedure: ["understand", "plan", "execute", "verify"],
      evidence: [`challenge=${challenge.id}`],
    };
  }
}
