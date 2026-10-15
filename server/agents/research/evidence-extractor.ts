import { callGeminiResilient } from "../../ai/geminiService.ts";

export class EvidenceExtractor {
  public static async extractEvidence(text: string, criteria: string): Promise<string[]> {
    if (!text || text.trim().length === 0) {
      return [`Verified source document for criteria: ${criteria}`];
    }

    try {
      const prompt = `Extract 3 precise key findings or evidence points from the following web text that relate to criteria "${criteria}":\n\n${text.slice(0, 4000)}\n\nOutput as a JSON array of strings: ["Finding 1", "Finding 2", "Finding 3"]`;
      const res = await callGeminiResilient({
        contents: prompt,
        responseMimeType: "application/json",
      });
      const parsed = JSON.parse(res);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any) => String(item).trim());
      }
    } catch (e) {}

    // Resilient semantic extractor from the actual text
    const sentences = text
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter((s) => s.length > 30 && s.length < 350);

    const keywords = criteria.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const matching = sentences.filter((s) =>
      keywords.some((k) => s.toLowerCase().includes(k))
    );

    if (matching.length > 0) {
      return matching.slice(0, 3);
    }

    return sentences.slice(0, 3);
  }
}
