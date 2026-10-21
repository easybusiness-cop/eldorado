export class EvidenceExtractor {
  public static async extractEvidence(text: string, criteria: string): Promise<string[]> {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // Return verbatim sentences only. A language-model paraphrase can sound
    // plausible while changing what the source actually said.
    const sentences = text
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter((s) => s.length > 30 && s.length < 350);

    const keywords = [...new Set(criteria.toLocaleLowerCase().match(/[\p{L}\p{N}]{4,}/gu) ?? [])];
    if (keywords.length === 0) return [];

    return sentences
      .map((sentence) => ({
        sentence,
        score: keywords.reduce(
          (score, keyword) => score + (sentence.toLocaleLowerCase().includes(keyword) ? 1 : 0),
          0,
        ),
      }))
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((candidate) => candidate.sentence);
  }
}
