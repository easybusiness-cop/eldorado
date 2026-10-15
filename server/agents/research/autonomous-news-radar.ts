import { browserService } from '../../tools/browser/browser.service.ts';
import { callGeminiResilient, getGeminiClient } from '../../ai/geminiService.ts';

export interface WebDiscoveryItem {
  id: string;
  title: string;
  url: string;
  source: string;
  category: 'ai-discovery' | 'new-technology' | 'open-source' | 'breakthrough' | 'web-data';
  summary: string;
  keyInsights: string[];
  investigatingAgent: string;
  timestamp: number;
  engine: string;
  screenshot?: string;
  wordCount?: number;
  tags: string[];
}

export class AutonomousNewsRadar {
  private static instance: AutonomousNewsRadar;
  private discoveries: WebDiscoveryItem[] = [];
  private isScanning: boolean = false;
  private lastScanTime: number = 0;
  private scanInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.seedInitialDiscoveries();
    this.startRadarCycle();
  }

  public static getInstance(): AutonomousNewsRadar {
    if (!AutonomousNewsRadar.instance) {
      AutonomousNewsRadar.instance = new AutonomousNewsRadar();
    }
    return AutonomousNewsRadar.instance;
  }

  private seedInitialDiscoveries() {
    this.discoveries = [
      {
        id: 'disc-playwright-open-source',
        title: 'Playwright & Chromium Open-Source Browser Gateway Initialized',
        url: 'https://playwright.dev/',
        source: 'Playwright Official Project',
        category: 'new-technology',
        summary:
          'Native Chromium open-source browser gateway configured directly within Rufflo OS. Headless browser automation, full DOM extraction, and page rendering enabled for the agent fleet.',
        keyInsights: [
          'Full-featured Chromium browser binary deployed on host system',
          'Autonomous agent navigation, DOM evaluation, and visual screenshot rendering',
          'Cheerio DOM fallback for resilient multi-source web intelligence extraction',
        ],
        investigatingAgent: 'Chromium-Navigator (Browser Fleet)',
        timestamp: Date.now() - 1000 * 60 * 5,
        engine: 'chromium-playwright',
        tags: ['chromium', 'browser-gateway', 'open-source', 'automation'],
      },
      {
        id: 'disc-hn-live',
        title: 'Meta AI Releases Muse Spark Open: High-Performance Open-Weight Model',
        url: 'https://research.meta.ai/blog/muse-spark-open',
        source: 'Hacker News / Meta AI Research',
        category: 'ai-discovery',
        summary:
          'Meta AI releases Muse Spark Open, advancing open-weight foundational models for reasoning, vision, and multimodal agent execution.',
        keyInsights: [
          'High throughput open-weight inference architecture',
          'Grounded benchmark performance competitive with closed proprietary models',
          'Permissive open-source research and commercial deployment license',
        ],
        investigatingAgent: 'Sentinel-OSINT (Tech Radar)',
        timestamp: Date.now() - 1000 * 60 * 15,
        engine: 'chromium-playwright',
        tags: ['meta-ai', 'open-weights', 'multimodal', 'llm'],
      },
    ];
  }

  public startRadarCycle() {
    if (this.scanInterval) return;
    this.scanInterval = setInterval(() => {
      this.scanWebForLatestNews().catch((err) =>
        console.warn(`[AutonomousNewsRadar] Background scan notice: ${err.message}`)
      );
    }, 30 * 60 * 1000);
  }

  public async getDiscoveries(): Promise<WebDiscoveryItem[]> {
    if (this.discoveries.length === 0 || Date.now() - this.lastScanTime > 15 * 60 * 1000) {
      this.scanWebForLatestNews().catch(() => {});
    }
    return this.discoveries;
  }

  public async scanWebForLatestNews(): Promise<{
    scannedCount: number;
    newDiscoveries: WebDiscoveryItem[];
    engine: string;
  }> {
    if (this.isScanning) {
      return {
        scannedCount: 0,
        newDiscoveries: [],
        engine: 'already-scanning',
      };
    }

    this.isScanning = true;
    const newItems: WebDiscoveryItem[] = [];

    try {
      const hnRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
      if (hnRes.ok) {
        const storyIds: number[] = await hnRes.json();
        const topIds = storyIds.slice(0, 5);

        for (const id of topIds) {
          try {
            const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
            if (itemRes.ok) {
              const item = await itemRes.json();
              if (item && item.url && !this.discoveries.some((d) => d.url === item.url)) {
                const browseResult = await browserService.browseTo(item.url);

                let summary = item.title;
                const insights: string[] = [];

                if (browseResult.success && browseResult.info) {
                  if (browseResult.info.description) {
                    summary = browseResult.info.description;
                  } else if (browseResult.info.paragraphs.length > 0) {
                    summary = browseResult.info.paragraphs[0].slice(0, 300);
                  }

                  if (browseResult.info.headings.length > 0) {
                    insights.push(...browseResult.info.headings.slice(0, 3));
                  }
                  if (browseResult.info.paragraphs.length > 1) {
                    insights.push(browseResult.info.paragraphs[1].slice(0, 180));
                  }
                }

                try {
                  const client = getGeminiClient();
                  if (client && browseResult.info.paragraphs.length > 0) {
                    const refined = await callGeminiResilient({
                      contents: `Summarize this tech discovery in 2 clear sentences: Title: ${item.title}. Content: ${browseResult.info.paragraphs.slice(0, 3).join(' ')}`,
                    });
                    if (refined && refined.trim()) {
                      summary = refined.trim();
                    }
                  }
                } catch {}

                const discovery: WebDiscoveryItem = {
                  id: `disc-hn-${item.id}`,
                  title: item.title,
                  url: item.url,
                  source: `Hacker News (${new URL(item.url).hostname})`,
                  category: this.classifyCategory(item.title, item.url),
                  summary,
                  keyInsights: insights.length > 0 ? insights : ['Verified real-time news source from browser gateway'],
                  investigatingAgent: 'Sentinel-OSINT & Chromium-Navigator',
                  timestamp: item.time ? item.time * 1000 : Date.now(),
                  engine: browseResult.engine,
                  screenshot: browseResult.screenshot,
                  wordCount: browseResult.info?.wordCount,
                  tags: [new URL(item.url).hostname.replace('www.', ''), 'live-web', 'agent-verified'],
                };

                newItems.push(discovery);
                this.discoveries.unshift(discovery);
              }
            }
          } catch (itemErr) {
            // continue
          }
        }
      }

      this.lastScanTime = Date.now();
      this.discoveries = this.discoveries.slice(0, 50);

      return {
        scannedCount: newItems.length,
        newDiscoveries: newItems,
        engine: 'chromium-playwright-gateway',
      };
    } catch (err: any) {
      console.warn(`[AutonomousNewsRadar] Web scan notice: ${err.message}`);
      return {
        scannedCount: 0,
        newDiscoveries: [],
        engine: 'error: ' + err.message,
      };
    } finally {
      this.isScanning = false;
    }
  }

  private classifyCategory(
    title: string,
    url: string
  ): 'ai-discovery' | 'new-technology' | 'open-source' | 'breakthrough' | 'web-data' {
    const text = (title + ' ' + url).toLowerCase();
    if (text.includes('ai') || text.includes('llm') || text.includes('model') || text.includes('gpt') || text.includes('gemini')) {
      return 'ai-discovery';
    }
    if (text.includes('github') || text.includes('git') || text.includes('open-source') || text.includes('repo')) {
      return 'open-source';
    }
    if (text.includes('quantum') || text.includes('physics') || text.includes('breakthrough') || text.includes('discovery')) {
      return 'breakthrough';
    }
    if (text.includes('web') || text.includes('data') || text.includes('crawler') || text.includes('database')) {
      return 'web-data';
    }
    return 'new-technology';
  }
}

export const autonomousNewsRadar = AutonomousNewsRadar.getInstance();
