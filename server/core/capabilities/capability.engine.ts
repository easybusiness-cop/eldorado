import type { AgentCapabilityProfile } from "./capability.types.ts";

export class CapabilityEngine {
  private profiles = new Map<string, AgentCapabilityProfile>();

  get(agentId: string): AgentCapabilityProfile {
    let profile = this.profiles.get(agentId);

    if (!profile) {
      profile = {
        agentId,
        capabilities: {},
        overallScore: 0,
        updatedAt: new Date().toISOString(),
      };
      this.profiles.set(agentId, profile);
    }

    return profile;
  }

  record(agentId: string, skill: string, success: boolean, score: number) {
    const profile = this.get(agentId);
    const current = profile.capabilities[skill];

    if (!current) {
      profile.capabilities[skill] = {
        skill,
        score,
        confidence: 0.1,
        attempts: 1,
        successes: success ? 1 : 0,
        failures: success ? 0 : 1,
        lastEvaluatedAt: new Date().toISOString(),
      };
    } else {
      current.attempts++;
      if (success) {
        current.successes++;
      } else {
        current.failures++;
      }

      // Exponential moving average
      current.score = current.score * 0.7 + score * 0.3;
      current.confidence = Math.min(1, current.attempts / 100);
      current.lastEvaluatedAt = new Date().toISOString();
    }

    const values = Object.values(profile.capabilities);
    profile.overallScore =
      values.length === 0
        ? 0
        : values.reduce((sum, x) => sum + x.score, 0) / values.length;

    profile.updatedAt = new Date().toISOString();
  }

  weaknesses(agentId: string) {
    const profile = this.get(agentId);
    return Object.values(profile.capabilities)
      .filter((x) => x.score < 0.8)
      .sort((a, b) => a.score - b.score);
  }
}

export const capabilityEngine = new CapabilityEngine();
