import { z } from 'zod';
import { modelRouter } from '../../ai/models/model-router.ts';

const ContradictionResponseSchema = z.object({
  conflicts: z.array(z.object({
    evidenceAIndex: z.number().int().positive(),
    evidenceBIndex: z.number().int().positive(),
    reason: z.string().trim().min(1).max(500),
  })).max(12),
}).strict();

export type ContradictionCheckResult = {
  status: 'checked' | 'insufficient_evidence' | 'unavailable';
  hasContradictions: boolean | null;
  conflicts: Array<{
    evidenceAIndex: number;
    evidenceBIndex: number;
    evidenceA: string;
    evidenceB: string;
    reason: string;
  }>;
};

export class ContradictionChecker {
  public static async detectContradictions(evidence: string[]): Promise<ContradictionCheckResult> {
    const normalizedEvidence = evidence
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 40);

    if (normalizedEvidence.length < 2) {
      return { status: 'insufficient_evidence', hasContradictions: null, conflicts: [] };
    }

    try {
      const response = await modelRouter.generate({
        systemInstruction: [
          'You are a cautious evidence consistency reviewer.',
          'Flag only direct, material contradictions between claims about the same subject, timeframe, and measure.',
          'Differences in emphasis, missing information, or claims about different contexts are not contradictions.',
          'Do not decide which claim is true. Return candidate conflicts with the exact 1-based evidence indexes.',
          'Return only JSON matching {"conflicts":[{"evidenceAIndex":1,"evidenceBIndex":2,"reason":"..."}]}.',
        ].join(' '),
        prompt: `Compare these source excerpts for direct factual contradictions:\n${JSON.stringify(
          normalizedEvidence.map((text, index) => ({ index: index + 1, text: text.slice(0, 1500) })),
        )}`,
        responseMimeType: 'application/json',
        temperature: 0,
      });

      const parsed = ContradictionResponseSchema.safeParse(JSON.parse(response.text));
      if (!parsed.success) {
        return { status: 'unavailable', hasContradictions: null, conflicts: [] };
      }

      const conflicts = parsed.data.conflicts
        .filter((candidate) =>
          candidate.evidenceAIndex !== candidate.evidenceBIndex &&
          candidate.evidenceAIndex <= normalizedEvidence.length &&
          candidate.evidenceBIndex <= normalizedEvidence.length,
        )
        .map((candidate) => ({
          evidenceAIndex: candidate.evidenceAIndex,
          evidenceBIndex: candidate.evidenceBIndex,
          evidenceA: normalizedEvidence[candidate.evidenceAIndex - 1],
          evidenceB: normalizedEvidence[candidate.evidenceBIndex - 1],
          reason: candidate.reason,
        }));

      return { status: 'checked', hasContradictions: conflicts.length > 0, conflicts };
    } catch (error: any) {
      console.warn('[ContradictionChecker] Cross-source verification was unavailable:', error?.message || String(error));
      return { status: 'unavailable', hasContradictions: null, conflicts: [] };
    }
  }
}
