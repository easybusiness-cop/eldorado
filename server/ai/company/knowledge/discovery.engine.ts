import { randomUUID } from "node:crypto";
import { load as loadXml } from "cheerio";
import { researchManager } from "./research.manager.ts";
import { BrowserService } from "../../../tools/browser/browser.service.ts";
import { getGeminiClient } from "../../geminiService.ts";
import { eventBus } from "../../../events/eventBus.ts";

export type DiscoveryCategory = "technology" | "research_paper" | "market_development";

export interface TechDiscovery {
  id: string;
  source: string;
  title: string;
  url: string;
  summary: string;
  technologies: string[];
  departments?: string[];
  severity: "info" | "important" | "critical";
  timestamp: string;
  category?: DiscoveryCategory;
  keyFindings?: string[];
  relevanceScore?: number;
  searchQuery?: string;
  status?: "discovered" | "researching" | "ingested";
  scrapedContent?: string;
}

export interface IntelligenceQueryResult {
  answer: string;
  discoveries: TechDiscovery[];
  source: "cached_intelligence" | "live_web_search" | "browser_scrape";
  query: string;
  category?: DiscoveryCategory;
  timestamp: string;
}

export interface DiscoveryStats {
  totalDiscoveries: number;
  byCategory: Record<DiscoveryCategory, number>;
  bySeverity: Record<"info" | "important" | "critical", number>;
  isScanning: boolean;
  continuousScanningActive: boolean;
  lastScanTime?: string;
  scanCount: number;
  sourcesMonitored: string[];
}

export class DiscoveryEngine {
  private static instance: DiscoveryEngine;
  private discoveries: TechDiscovery[] = [];
  private isScanning = false;
  private continuousTimer: NodeJS.Timeout | null = null;
  private continuousCategoryIndex = 0;
  private scanCount = 0;
  private lastScanTime?: string;
  private browserService: BrowserService;

  // Active sources monitored
  private readonly sources = [
    "Google Search Grounding (when configured)",
    "Hacker News Algolia live index",
    "arXiv CS.AI and CS.SE preprints",
    "BrowserService source-page enrichment",
  ];

  private constructor() {
    this.browserService = new BrowserService();
    this.startContinuousScanning(60_000);
  }

  public static getInstance(): DiscoveryEngine {
    if (!DiscoveryEngine.instance) {
      DiscoveryEngine.instance = new DiscoveryEngine();
    }
    return DiscoveryEngine.instance;
  }

  /**
   * Starts the continuous scanning background loop.
   * Periodically scans for new technologies, research papers, and market developments.
   */
  public startContinuousScanning(intervalMs = 60_000): void {
    if (this.continuousTimer) {
      clearInterval(this.continuousTimer);
    }
    this.continuousCategoryIndex = 0;

    console.log(
      `[DiscoveryEngine] Continuous autonomous discovery loop active. Interval: ${Math.round(
        intervalMs / 1000
      )}s. Unlimited intelligence engine initialized.`
    );

    this.continuousTimer = setInterval(async () => {
      try {
        console.log("[DiscoveryEngine] Continuous background scan trigger firing...");
        const categories: DiscoveryCategory[] = [
          "technology",
          "research_paper",
          "market_development",
        ];
        const category =
          categories[this.continuousCategoryIndex % categories.length];
        this.continuousCategoryIndex += 1;
        await this.runDiscoveryCycle([category]);
      } catch (err) {
        console.error("[DiscoveryEngine] Continuous scan error:", err);
      }
    }, intervalMs);
  }

  /**
   * Stops the continuous scanning loop.
   */
  public stopContinuousScanning(): void {
    if (this.continuousTimer) {
      clearInterval(this.continuousTimer);
      this.continuousTimer = null;
      console.log("[DiscoveryEngine] Continuous discovery loop stopped.");
    }
  }

  /**
   * Scans for new technologies across web and developer indexes.
   */
  public async scanTechnologies(): Promise<TechDiscovery[]> {
    return this.searchInternet(
      "new open-source AI frameworks developer tools runtime optimization ESM typescript 2026",
      "technology"
    );
  }

  /**
   * Scans for latest research papers from arXiv and academic preprint repositories.
   */
  public async scanResearchPapers(): Promise<TechDiscovery[]> {
    return this.searchInternet(
      "arXiv research paper autonomous multi-agent systems reasoning code generation 2026",
      "research_paper"
    );
  }

  /**
   * Scans for relevant market developments, cloud infrastructure moves, and industry breakthroughs.
   */
  public async scanMarketDevelopments(): Promise<TechDiscovery[]> {
    return this.searchInternet(
      "AI industry market developments enterprise agent adoption venture funding releases 2026",
      "market_development"
    );
  }

  /**
   * Main discovery sweep method. Continuously scans across all 3 key categories:
   * technologies, research papers, and market developments.
   */
  public async runDiscoveryCycle(
    categories: DiscoveryCategory[] = ["technology", "research_paper", "market_development"]
  ): Promise<TechDiscovery[]> {
    if (this.isScanning) {
      console.log("[DiscoveryEngine] Scan cycle already in progress, skipping concurrent run.");
      return [];
    }

    this.isScanning = true;
    this.scanCount++;
    this.lastScanTime = new Date().toISOString();
    console.log(
      `[DiscoveryEngine] Running discovery cycle #${this.scanCount} across categories: [${categories.join(
        ", "
      )}]...`
    );

    const newDiscoveries: TechDiscovery[] = [];

    try {
      for (const category of categories) {
        let findings: TechDiscovery[] = [];
        if (category === "technology") {
          findings = await this.scanTechnologies();
        } else if (category === "research_paper") {
          findings = await this.scanResearchPapers();
        } else if (category === "market_development") {
          findings = await this.scanMarketDevelopments();
        }
        newDiscoveries.push(...findings);
      }

      console.log(
        `[DiscoveryEngine] Discovery cycle #${this.scanCount} completed. Ingested ${newDiscoveries.length} new items.`
      );

      return newDiscoveries;
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Performs real-time internet search and web intelligence gathering using available tools:
   * 1. Google Search Grounding via Gemini API (if key available)
   * 2. Live HTTP Web Intelligence (Hacker News Algolia API + Wikipedia Search API)
   * 3. Live Browser Inspection via BrowserService for full DOM extraction
   * 4. Automatic proactive dispatch to researchManager without waiting for permission!
   */
  public async searchInternet(
    query: string,
    category: DiscoveryCategory = "technology"
  ): Promise<TechDiscovery[]> {
    console.log(
      `[DiscoveryEngine] Executing autonomous internet/browser search: "${query}" (Category: ${category})`
    );

    const newlyFound: TechDiscovery[] = [];

    // 1. Attempt Google Search Grounded query via Gemini API if key is present
    const geminiClient = getGeminiClient();
    if (geminiClient) {
      try {
        console.log("[DiscoveryEngine] Invoking Gemini with Google Search Grounding tool...");
        const response = await geminiClient.models.generateContent({
          model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
          contents: `Search the live internet for recent breakthroughs, announcements, papers, or market developments related to: "${query}".
Category: ${category}

Format your response as a JSON array with up to 3 high-impact findings. Each item must have:
- title: concise title
- url: reference url
- source: source name (e.g., arXiv, GitHub, VentureBeat, Google DeepMind, etc.)
- summary: 2-3 sentence overview
- keyFindings: array of 2-3 specific technical or market bullet points
- technologies: array of 2-4 lowercase relevant keyword tags
- severity: "critical", "important", or "info"

Output strictly the JSON array, no extra text.`,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        const text = response?.text || "";
        const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (
                typeof item?.title === "string"
                && typeof item?.url === "string"
                && typeof item?.summary === "string"
                && item.title.trim()
                && item.url.trim()
                && !this.discoveries.some((d) => d.title.toLowerCase() === item.title.toLowerCase())
              ) {
                const disc: TechDiscovery = {
                  id: `disc-${randomUUID().slice(0, 8)}`,
                  source: typeof item.source === "string" ? item.source : "Google Search Grounding",
                  category,
                  title: item.title,
                  url: item.url,
                  summary: item.summary,
                  keyFindings: Array.isArray(item.keyFindings) && item.keyFindings.every((finding: unknown) => typeof finding === "string")
                    ? item.keyFindings
                    : [item.summary],
                  technologies: Array.isArray(item.technologies) ? item.technologies : [category],
                  departments: this.inferDepartments(category, item.technologies || []),
                  severity: ["critical", "important", "info"].includes(item.severity) ? item.severity : "info",
                  searchQuery: query,
                  timestamp: new Date().toISOString(),
                  status: "discovered",
                };

                this.registerAndPropagate(disc);
                newlyFound.push(disc);
              }
            }
          }
        }
      } catch (err: any) {
        console.warn("[DiscoveryEngine] Gemini Search Grounding unavailable or rate limited, using live public search APIs:", err.message);
      }
    }

    // 2. Query live public APIs for stories and, for research, recent arXiv papers.
    if (newlyFound.length === 0) {
      try {
        const publicFindings = await this.queryPublicWebIntelligence(query, category);
        for (const item of publicFindings) {
          if (!this.discoveries.some((d) => d.title.toLowerCase() === item.title.toLowerCase())) {
            this.registerAndPropagate(item);
            newlyFound.push(item);
          }
        }
      } catch (err: any) {
        console.warn("[DiscoveryEngine] Public web intelligence sweep failed:", err.message);
      }
    }

    // 3. For each newly discovered item, scrape deep content via BrowserService asynchronously
    for (const disc of newlyFound) {
      this.deepBrowseAndEnrich(disc).catch((err) => {
        console.warn(`[DiscoveryEngine] Deep browsing failed for ${disc.url}:`, err.message);
      });
    }

    return newlyFound;
  }

  /**
   * Queries public web intelligence endpoints (Hacker News Algolia search + Wikipedia API)
   * to extract real-world articles, research, and technical developments.
   */
  private async queryPublicWebIntelligence(
    query: string,
    category: DiscoveryCategory
  ): Promise<TechDiscovery[]> {
    const findings: TechDiscovery[] = [];

    // Search Hacker News Algolia Search API
    try {
      const searchTerms = encodeURIComponent(query.slice(0, 60));
      const res = await fetch(`https://hn.algolia.com/api/v1/search?query=${searchTerms}&tags=story&hitsPerPage=3`, {
        headers: { "User-Agent": "RuffloDiscoveryEngine/2.0" },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.hits && Array.isArray(data.hits)) {
          for (const hit of data.hits.slice(0, 2)) {
            if (hit.title && (hit.url || hit.story_url)) {
              const url = hit.url || hit.story_url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
              const tags = [
                category,
                ...(hit._tags || []).filter((t: string) => typeof t === "string" && !t.startsWith("author_")),
              ].slice(0, 4);

              findings.push({
                id: `disc-${randomUUID().slice(0, 8)}`,
                source: "Hacker News Live Index",
                category,
                title: hit.title,
                url,
                summary: `Hacker News story: "${hit.title}". Points: ${hit.points ?? 0}, Comments: ${hit.num_comments ?? 0}.`,
                keyFindings: [
                  `Hacker News reports ${hit.points ?? 0} points and ${hit.num_comments ?? 0} comments`,
                  `Found in the Hacker News live story index`,
                  `Search category: ${category.replace("_", " ")}`,
                ],
                technologies: tags,
                departments: this.inferDepartments(category, tags),
                severity: hit.points > 200 ? "critical" : "important",
                relevanceScore: Math.min(0.5 + (hit.points || 0) / 1000, 0.98),
                searchQuery: query,
                timestamp: new Date().toISOString(),
                status: "discovered",
              });
            }
          }
        }
      }
    } catch (e: any) {
      console.warn("[DiscoveryEngine] HN Algolia search error:", e.message);
    }

    if (category === "research_paper") {
      try {
        const searchQuery = encodeURIComponent("cat:cs.AI OR cat:cs.SE");
        const res = await fetch(
          `https://export.arxiv.org/api/query?search_query=${searchQuery}&start=0&max_results=3&sortBy=submittedDate&sortOrder=descending`,
          { headers: { "User-Agent": "RuffloDiscoveryEngine/2.0" } }
        );

        if (!res.ok) {
          throw new Error(`arXiv returned HTTP ${res.status}`);
        }

        const $ = loadXml(await res.text(), { xmlMode: true });
        for (const element of $("entry").toArray()) {
          const entry = $(element);
          const title = entry.find("title").first().text().replace(/\s+/g, " ").trim();
          const summary = entry.find("summary").first().text().replace(/\s+/g, " ").trim();
          const url = entry.find("id").first().text().trim();
          const technologies = entry
            .find("category")
            .toArray()
            .map((categoryElement) => $(categoryElement).attr("term"))
            .filter((term): term is string => Boolean(term))
            .slice(0, 4);

          if (!title || !summary || !url) {
            continue;
          }

          findings.push({
            id: `disc-${randomUUID().slice(0, 8)}`,
            source: "arXiv Computer Science Preprints",
            category,
            title,
            url,
            summary,
            keyFindings: [`arXiv abstract: ${summary.slice(0, 500)}`],
            technologies,
            departments: this.inferDepartments(category, technologies),
            severity: "important",
            relevanceScore: 0.85,
            searchQuery: query,
            timestamp: new Date().toISOString(),
            status: "discovered",
          });
        }
      } catch (error: any) {
        console.warn("[DiscoveryEngine] arXiv search failed:", error.message);
      }
    }

    return findings;
  }

  /**
   * Automatically enriches a newly discovered URL using BrowserService to scrape DOM contents.
   */
  private async deepBrowseAndEnrich(discovery: TechDiscovery): Promise<void> {
    try {
      const browseResult = await this.browserService.browseTo(discovery.url);
      if (browseResult.success && browseResult.info) {
        const paragraphs: string[] = browseResult.info.paragraphs || [];
        if (paragraphs.length > 0) {
          discovery.scrapedContent = paragraphs.slice(0, 5).join("\n\n");
          console.log(`[DiscoveryEngine] Enriched discovery "${discovery.title}" with live browser scrape data.`);
        }
      }
    } catch (e: any) {
      // Non-fatal enrichment failure
    }
  }

  /**
   * Registers a discovery into the store, broadcasts it to the eventBus,
   * and PROACTIVELY triggers the research manager WITHOUT waiting for human permission.
   */
  private registerAndPropagate(discovery: TechDiscovery): void {
    this.discoveries.unshift(discovery);

    console.log(
      `[DiscoveryEngine] REGISTERED DISCOVERY: "${discovery.title}" [${discovery.category || "tech"}] from ${
        discovery.source
      }`
    );

    // Emit event bus notification
    eventBus.emitEvent("INTELLIGENCE_DISCOVERED", {
      discoveryId: discovery.id,
      title: discovery.title,
      category: discovery.category,
      source: discovery.source,
      severity: discovery.severity,
      technologies: discovery.technologies,
      url: discovery.url,
      timestamp: discovery.timestamp,
    });

    // PROACTIVELY launch autonomous research without waiting for human approval!
    discovery.status = "researching";
    researchManager.queueResearch(discovery).catch((err) => {
      console.error(`[DiscoveryEngine] Proactive research pipeline failed for "${discovery.title}":`, err);
    });
  }

  /**
   * Provides the 'Unlimited Intelligence' query interface for agents in the fleet.
   * Agents can query any concept; if existing intelligence covers it, it returns it.
   * If not (or if forceLiveSearch is true), it autonomously sweeps the web on the fly,
   * ingests the findings, and answers without waiting for permission.
   */
  public async queryIntelligence(
    query: string,
    options?: {
      category?: DiscoveryCategory;
      forceLiveSearch?: boolean;
      limit?: number;
    }
  ): Promise<IntelligenceQueryResult> {
    const targetCategory = options?.category;
    const limit = options?.limit || 3;
    const lowerQuery = query.toLowerCase();

    // 1. Search cached discoveries
    let matched = this.discoveries.filter((d) => {
      const matchCategory = !targetCategory || d.category === targetCategory;
      const matchText =
        d.title.toLowerCase().includes(lowerQuery) ||
        d.summary.toLowerCase().includes(lowerQuery) ||
        d.technologies.some((t) => t.toLowerCase().includes(lowerQuery));
      return matchCategory && matchText;
    });

    // 2. If no matches or live search forced, trigger autonomous internet search immediately
    if (matched.length === 0 || options?.forceLiveSearch) {
      console.log(
        `[DiscoveryEngine] Intelligence cache miss or force search for: "${query}". Triggering live internet sweep...`
      );
      const liveFindings = await this.searchInternet(query, targetCategory || "technology");
      matched = [...liveFindings, ...matched].slice(0, limit);

      const summaryLines = matched.map(
        (m, idx) => `${idx + 1}. **${m.title}** (${m.source}): ${m.summary}\n   *URL:* ${m.url}`
      );

      return {
        answer: summaryLines.length > 0
          ? `Live Internet Intelligence Synthesis for "${query}":\n\n${summaryLines.join("\n\n")}`
          : `No specific internet findings retrieved for query "${query}". Active continuous radar maintains monitoring.`,
        discoveries: matched,
        source: "live_web_search",
        query,
        category: targetCategory,
        timestamp: new Date().toISOString(),
      };
    }

    // 3. Return cached intelligence findings
    const topMatches = matched.slice(0, limit);
    const answer = topMatches
      .map(
        (m, idx) =>
          `${idx + 1}. **${m.title}** [${m.category || "tech"}] (${m.source}):\n${m.summary}\nKey Findings: ${(
            m.keyFindings || []
          ).join("; ")}\nURL: ${m.url}`
      )
      .join("\n\n");

    return {
      answer: `Corporate Knowledge Radar Intelligence:\n\n${answer}`,
      discoveries: topMatches,
      source: "cached_intelligence",
      query,
      category: targetCategory,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Helper to infer which departments should receive the intelligence.
   */
  private inferDepartments(category: DiscoveryCategory, tags: string[]): string[] {
    const depts = new Set<string>();

    if (category === "research_paper") {
      depts.add("research");
      depts.add("engineering");
    } else if (category === "market_development") {
      depts.add("marketing");
      depts.add("operations");
      depts.add("research");
    } else {
      depts.add("engineering");
      depts.add("research");
    }

    const tagStr = tags.join(" ").toLowerCase();
    if (tagStr.includes("market") || tagStr.includes("copy") || tagStr.includes("user")) {
      depts.add("marketing");
    }
    if (tagStr.includes("infrastructure") || tagStr.includes("database") || tagStr.includes("ops")) {
      depts.add("operations");
    }

    return Array.from(depts);
  }

  public getAllDiscoveries(): TechDiscovery[] {
    return [...this.discoveries];
  }

  public getDiscoveriesByCategory(category: DiscoveryCategory): TechDiscovery[] {
    return this.discoveries.filter((d) => d.category === category);
  }

  public getDiscoveryById(id: string): TechDiscovery | undefined {
    return this.discoveries.find((d) => d.id === id);
  }

  public getStats(): DiscoveryStats {
    const byCategory: Record<DiscoveryCategory, number> = {
      technology: 0,
      research_paper: 0,
      market_development: 0,
    };

    const bySeverity: Record<"info" | "important" | "critical", number> = {
      info: 0,
      important: 0,
      critical: 0,
    };

    for (const d of this.discoveries) {
      if (d.category && byCategory[d.category] !== undefined) {
        byCategory[d.category]++;
      } else {
        byCategory.technology++;
      }

      if (d.severity && bySeverity[d.severity] !== undefined) {
        bySeverity[d.severity]++;
      }
    }

    return {
      totalDiscoveries: this.discoveries.length,
      byCategory,
      bySeverity,
      isScanning: this.isScanning,
      continuousScanningActive: this.continuousTimer !== null,
      lastScanTime: this.lastScanTime,
      scanCount: this.scanCount,
      sourcesMonitored: this.sources,
    };
  }
}

export const discoveryEngine = DiscoveryEngine.getInstance();
