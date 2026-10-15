import { callGeminiResilient } from "../../ai/geminiService.ts";

export class QueryPlanner {
  public static async planQueries(topic: string): Promise<string[]> {
    try {
      const prompt = `Generate 3 targeted search queries to research latest news, technologies, and information about "${topic}". Output as JSON array of strings: ["query 1", "query 2", "query 3"]`;
      const res = await callGeminiResilient({
        contents: prompt,
        responseMimeType: "application/json",
      });
      const parsed = JSON.parse(res);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {}

    return [
      `Latest updates and news on ${topic}`,
      `Technical breakthroughs and architecture of ${topic}`,
      `Open source ecosystem and developments for ${topic}`,
    ];
  }
}

