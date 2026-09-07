import type {
  AgentCapabilityProfile,
  CapabilityDefinition,
  CapabilityUpdate,
} from './capability.types.ts';
import { CORE_CAPABILITIES } from './capability.catalog.ts';

export class CapabilityEngine {
  private static instance: CapabilityEngine;

  private profiles = new Map<
    string,
    AgentCapabilityProfile
  >();

  private definitions = new Map<
    string,
    CapabilityDefinition
  >();

  private constructor() {
    this.registerCapabilities(CORE_CAPABILITIES);
  }

  public static getInstance(): CapabilityEngine {
    if (!CapabilityEngine.instance) {
      CapabilityEngine.instance = new CapabilityEngine();
    }

    return CapabilityEngine.instance;
  }

  /* ---------------------------------------------------------------------- */
  /* CAPABILITY DEFINITIONS                                                 */
  /* ---------------------------------------------------------------------- */

  registerCapability(
    definition: CapabilityDefinition,
  ): void {
    if (!definition.id.trim()) {
      throw new Error(
        'Capability ID cannot be empty.',
      );
    }

    this.definitions.set(
      definition.id,
      definition,
    );
  }

  registerCapabilities(
    definitions: CapabilityDefinition[],
  ): void {
    for (const definition of definitions) {
      this.registerCapability(definition);
    }
  }

  getCapability(
    capabilityId: string,
  ): CapabilityDefinition | undefined {
    return this.definitions.get(capabilityId);
  }

  getAllCapabilities(): CapabilityDefinition[] {
    return Array.from(
      this.definitions.values(),
    );
  }

  /* ---------------------------------------------------------------------- */
  /* AGENT PROFILES                                                         */
  /* ---------------------------------------------------------------------- */

  get(
    agentId: string,
  ): AgentCapabilityProfile {
    let profile =
      this.profiles.get(agentId);

    if (!profile) {
      profile = {
        agentId,

        assignedCapabilities: [],

        learnedCapabilities: [],

        capabilities: {},

        overallScore: 0,

        updatedAt:
          new Date().toISOString(),
      };

      this.profiles.set(
        agentId,
        profile,
      );
    }

    return profile;
  }

  /* ---------------------------------------------------------------------- */
  /* ASSIGN CAPABILITY                                                      */
  /* ---------------------------------------------------------------------- */

  assign(
    agentId: string,
    capabilityId: string,
  ): AgentCapabilityProfile {
    const capability =
      this.getCapability(
        capabilityId,
      );

    if (!capability) {
      // Create a dynamic placeholder capability definition if it's not registered
      // to avoid throwing on dynamic runtime skills
      this.registerCapability({
        id: capabilityId,
        name: capabilityId.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        description: `Dynamically registered capability for ${capabilityId}`,
        category: 'general',
        prerequisites: [],
        recommendedTools: [],
        departments: [],
        learnable: true
      });
    }

    const profile =
      this.get(agentId);

    if (
      !profile.assignedCapabilities.includes(
        capabilityId,
      )
    ) {
      profile.assignedCapabilities.push(
        capabilityId,
      );
    }

    profile.updatedAt =
      new Date().toISOString();

    return profile;
  }

  assignMany(
    agentId: string,
    capabilityIds: string[],
  ): AgentCapabilityProfile {
    for (const capabilityId of capabilityIds) {
      this.assign(
        agentId,
        capabilityId,
      );
    }

    return this.get(agentId);
  }

  /* ---------------------------------------------------------------------- */
  /* LEARNED CAPABILITIES                                                   */
  /* ---------------------------------------------------------------------- */

  recordLearning(
    agentId: string,
    capabilityId: string,
    evidence: string[] = [],
  ): AgentCapabilityProfile {
    const capability =
      this.getCapability(
        capabilityId,
      );

    if (!capability) {
      // Create a dynamic placeholder capability definition
      this.registerCapability({
        id: capabilityId,
        name: capabilityId.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        description: `Dynamically registered learned capability for ${capabilityId}`,
        category: 'general',
        prerequisites: [],
        recommendedTools: [],
        departments: [],
        learnable: true
      });
    }

    const profile =
      this.get(agentId);

    if (
      !profile.learnedCapabilities.includes(
        capabilityId,
      )
    ) {
      profile.learnedCapabilities.push(
        capabilityId,
      );
    }

    const current =
      profile.capabilities[
        capabilityId
      ];

    if (!current) {
      profile.capabilities[
        capabilityId
      ] = {
        skill: capabilityId,
        score: 0.5,
        confidence: 0.1,
        attempts: 0,
        successes: 0,
        failures: 0,
        evidence: [
          ...evidence,
        ],
        lastEvaluatedAt:
          new Date().toISOString(),
      };
    } else {
      current.evidence = [
        ...new Set([
          ...current.evidence,
          ...evidence,
        ]),
      ];
    }

    profile.updatedAt =
      new Date().toISOString();

    return profile;
  }

  /* ---------------------------------------------------------------------- */
  /* PERFORMANCE (Backward Compatible)                                      */
  /* ---------------------------------------------------------------------- */

  record(
    updateOrAgentId: CapabilityUpdate | string,
    skill?: string,
    success?: boolean,
    score?: number
  ): AgentCapabilityProfile {
    let update: CapabilityUpdate;
    if (typeof updateOrAgentId === 'string') {
      update = {
        agentId: updateOrAgentId,
        skill: skill || 'general',
        success: !!success,
        score: typeof score === 'number' ? score : 0.5,
        evidence: []
      };
    } else {
      update = updateOrAgentId;
    }

    const profile =
      this.get(update.agentId);

    const current =
      profile.capabilities[
        update.skill
      ];

    const finalScore =
      Math.max(
        0,
        Math.min(
          1,
          update.score,
        ),
      );

    if (!current) {
      profile.capabilities[
        update.skill
      ] = {
        skill: update.skill,

        score: finalScore,

        confidence: 0.1,

        attempts: 1,

        successes:
          update.success ? 1 : 0,

        failures:
          update.success ? 0 : 1,

        lastEvaluatedAt:
          new Date().toISOString(),

        evidence: [
          ...(update.evidence || []),
        ],

        lastFailureReason:
          update.failureReason,
      };
    } else {
      current.attempts++;

      if (update.success) {
        current.successes++;
      } else {
        current.failures++;
      }

      /**
       * Recent performance has more influence than
       * very old performance.
       */
      current.score =
        current.score * 0.7 +
        finalScore * 0.3;

      current.confidence =
        Math.min(
          1,
          current.attempts / 100,
        );

      current.lastEvaluatedAt =
        new Date().toISOString();

      current.evidence = [
        ...new Set([
          ...current.evidence,
          ...(update.evidence || []),
        ]),
      ];

      if (
        update.failureReason
      ) {
        current.lastFailureReason =
          update.failureReason;
      }
    }

    this.recalculate(
      profile,
    );

    return profile;
  }

  private recalculate(
    profile: AgentCapabilityProfile,
  ): void {
    const values =
      Object.values(
        profile.capabilities,
      );

    profile.overallScore =
      values.length === 0
        ? 0
        : values.reduce(
            (sum, capability) =>
              sum +
              capability.score,
            0,
          ) / values.length;

    profile.updatedAt =
      new Date().toISOString();
  }

  /* ---------------------------------------------------------------------- */
  /* QUERIES                                                                */
  /* ---------------------------------------------------------------------- */

  has(
    agentId: string,
    capabilityId: string,
  ): boolean {
    const profile =
      this.get(agentId);

    return (
      profile.assignedCapabilities.includes(
        capabilityId,
      ) ||
      profile.learnedCapabilities.includes(
        capabilityId,
      )
    );
  }

  score(
    agentId: string,
    capabilityId: string,
  ): number {
    const profile =
      this.get(agentId);

    return (
      profile.capabilities[
        capabilityId
      ]?.score ?? 0
    );
  }

  weaknesses(
    agentId: string,
  ) {
    const profile =
      this.get(agentId);

    return Object.values(
      profile.capabilities,
    )
      .filter(
        capability =>
          capability.score < 0.8,
      )
      .sort(
        (a, b) =>
          a.score - b.score,
      );
  }

  strongest(
    agentId: string,
  ) {
    const profile =
      this.get(agentId);

    return Object.values(
      profile.capabilities,
    )
      .sort(
        (a, b) =>
          b.score - a.score,
      );
  }

  findAgentsForCapability(
    capabilityId: string,
    minimumScore = 0.6,
  ): string[] {
    const result: string[] = [];

    for (const [
      agentId,
      profile,
    ] of this.profiles.entries()) {
      if (
        !this.has(
          agentId,
          capabilityId,
        )
      ) {
        continue;
      }

      const score =
        profile.capabilities[
          capabilityId
        ]?.score ?? 0;

      /**
       * Newly assigned capabilities have no
       * performance history yet. They are still
       * eligible, but their score is treated as
       * zero until evidence exists.
       */
      if (
        score >= minimumScore
      ) {
        result.push(agentId);
      }
    }

    return result;
  }
}

export const capabilityEngine =
  CapabilityEngine.getInstance();
