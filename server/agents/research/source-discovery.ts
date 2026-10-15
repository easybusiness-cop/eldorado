import { getGeminiClient } from "../../ai/geminiService.ts";

export interface DiscoveredSource {
  url: string;
  title: string;
  snippet?: string;
}

export class SourceDiscovery {
  public static async discoverSources(queries: string[]): Promise<DiscoveredSource[]> {
    const discovered: DiscoveredSource[] = [];

    // 1. Try Gemini Live Google Search Grounding if API client is active
    try {
      const client = getGeminiClient();
      if (client && queries.length > 0) {
        const queryText = queries.join(" OR ");
        const response = await client.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Find authoritative live web sources and breaking research documentation for: ${queryText}.`,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        const chunks = (response.candidates?.[0]?.groundingMetadata as any)?.groundingChunks;
        if (Array.isArray(chunks) && chunks.length > 0) {
          for (const chunk of chunks) {
            if (chunk?.web?.uri) {
              discovered.push({
                url: chunk.web.uri,
                title: chunk.web.title || chunk.web.uri,
                snippet: response.text?.slice(0, 200),
              });
            }
          }
        }
      }
    } catch (e: any) {
      console.warn(`[SourceDiscovery] Gemini Search Grounding notice: ${e.message}`);
    }

    if (discovered.length >= 2) {
      return discovered.slice(0, 6);
    }

    // 2. Fetch live real web news / stories from Hacker News
    try {
      const hnRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
      if (hnRes.ok) {
        const storyIds: number[] = await hnRes.json();
        const top3 = storyIds.slice(0, 4);

        for (const id of top3) {
          const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          if (itemRes.ok) {
            const item = await itemRes.json();
            if (item && item.url) {
              discovered.push({
                url: item.url,
                title: item.title || "Live Web Tech Story",
                snippet: `Score: ${item.score || 0} points, by ${item.by || "author"}`,
              });
            }
          }
        }
      }
    } catch {}

    // 3. Fallback to authoritative real developer documentation portals
    if (discovered.length === 0) {
      discovered.push(
        {
          url: "https://github.com/trending",
          title: "GitHub Trending Repositories",
          snippet: "Real-time trending open-source technologies, libraries, and agent frameworks.",
        },
        {
          url: "https://news.ycombinator.com",
          title: "Hacker News - Technology & Startups",
          snippet: "Breaking engineering and technology news.",
        },
        {
          url: "https://playwright.dev",
          title: "Playwright Documentation",
          snippet: "Fast and reliable end-to-end testing and browser automation for modern web apps.",
        }
      );
    }

    return discovered.slice(0, 6);
  }
}
