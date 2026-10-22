import { browserService } from "../../../tools/browser/browser.service.ts";
import { knowledgeGraph } from "../../../core/memory/knowledge-graph.ts";
import { eventBus } from "../../../events/eventBus.ts";
import { companyDb } from "../../../../src/db/companyDb.ts";

export interface ResearchMissionRequest {
  organizationId: string;
  agentId: string;
  targetUrl: string;
  topic: string;
  extractCodeSnippets?: boolean;
}

export interface ResearchMissionResult {
  missionId: string;
  agentId: string;
  targetUrl: string;
  topic: string;
  success: boolean;
  pageTitle: string;
  summary: string;
  extractedHeadings: string[];
  keyParagraphs: string[];
  discoveredLinks: string[];
  cookiesStored: number;
  screenshot?: string;
  knowledgeNodeId?: string;
  durationMs: number;
  timestamp: string;
}

export class AutonomousAgentResearcher {
  private static instance: AutonomousAgentResearcher;
  private missionHistory: Map<string, ResearchMissionResult[]> = new Map();

  private constructor() {}

  public static getInstance(): AutonomousAgentResearcher {
    if (!AutonomousAgentResearcher.instance) {
      AutonomousAgentResearcher.instance = new AutonomousAgentResearcher();
    }
    return AutonomousAgentResearcher.instance;
  }

  /**
   * Executes an autonomous web research mission using the agent's dedicated, isolated Chromium context
   */
  public async executeMission(req: ResearchMissionRequest): Promise<ResearchMissionResult> {
    const startTime = Date.now();
    const missionId = `mission-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const normalizedAgentId = req.agentId.toLowerCase().trim() || "system";
    const organizationId = req.organizationId.trim();
    if (!organizationId) throw new Error('An organization is required for an agent research mission.');
    const safeTargetUrl = redactUrlForOutput(req.targetUrl);

    eventBus.emitEvent("AGENT_RESEARCH_STARTED", {
      agentId: normalizedAgentId,
      organizationId,
      missionId,
    });

    // 1. Browse using agent's private Chromium context
    const browseRes = await browserService.browseAsAgent(normalizedAgentId, req.targetUrl, organizationId);

    const headings = browseRes.info?.headings || [];
    const paragraphs = browseRes.info?.paragraphs || [];
    const links = (browseRes.info?.links || []).slice(0, 10).map((l) => l.href);
    const title = browseRes.info?.title || "Research Target";

    // 2. Synthesize structured findings
    const summary = paragraphs.slice(0, 3).join(" ").trim() ||
      `Autonomous Chromium research conducted by Agent [${normalizedAgentId}] on ${safeTargetUrl}. Processed ${browseRes.info?.wordCount || 0} words.`;

    // 3. Commit findings to Knowledge Graph
    let knowledgeNodeId: string | undefined;
    try {
      const node = knowledgeGraph.addNode({
        label: `Research: ${title.slice(0, 50)}`,
        type: "concept",
        content: `Target: ${safeTargetUrl}\nOrganization: ${organizationId}\nAgent: ${normalizedAgentId}\nTopic: ${req.topic}\n\nKey Insights:\n${summary}\n\nTop Headings:\n${headings.slice(0, 5).join(", ")}`,
        tags: ["web-research", "osint", organizationId, normalizedAgentId, "chromium"],
        importance: 0.85,
        metadata: {
          organizationId,
          url: safeTargetUrl,
          agentId: normalizedAgentId,
          wordCount: browseRes.info?.wordCount || 0,
          capturedAt: new Date().toISOString(),
        },
      });
      knowledgeNodeId = node.id;
    } catch (e: any) {
      console.warn(`[AutonomousAgentResearcher] Knowledge graph commit warning: ${e.message}`);
    }

    // 4. Log to CompanyDB Audit Ledger
    try {
      companyDb.logAudit({
        id: `aud-research-${Date.now()}`,
        agentId: normalizedAgentId,
        projectId: organizationId,
        taskId: missionId,
        tool: "chromium_browser",
        action: `Autonomous Web Research: ${safeTargetUrl}`,
        inputHash: Buffer.from(safeTargetUrl).toString("base64").slice(0, 16),
        result: `SUCCESS: Navigated via isolated context. Extracted ${browseRes.info?.wordCount || 0} words.`,
        timestamp: new Date().toISOString(),
        riskLevel: "low",
        approvalRequired: false,
        executionId: missionId,
      });
    } catch {}

    const result: ResearchMissionResult = {
      missionId,
      agentId: normalizedAgentId,
      targetUrl: safeTargetUrl,
      topic: req.topic,
      success: browseRes.success,
      pageTitle: title,
      summary,
      extractedHeadings: headings.slice(0, 8),
      keyParagraphs: paragraphs.slice(0, 5),
      discoveredLinks: links,
      cookiesStored: browseRes.cookiesCount || 0,
      screenshot: browseRes.screenshot,
      knowledgeNodeId,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };

    // Store in historical registry
    const historyKey = this.getHistoryKey(organizationId, normalizedAgentId);
    const existing = this.missionHistory.get(historyKey) || [];
    existing.unshift(result);
    if (existing.length > 20) existing.pop();
    this.missionHistory.set(historyKey, existing);

    eventBus.emitEvent("AGENT_RESEARCH_COMPLETED", {
      agentId: normalizedAgentId,
      organizationId,
      missionId,
      success: result.success,
      title: result.pageTitle,
      knowledgeNodeId,
    });

    return result;
  }

  public getAgentMissions(agentId: string, organizationId: string): ResearchMissionResult[] {
    const normalizedAgentId = agentId.toLowerCase().trim();
    return this.missionHistory.get(this.getHistoryKey(organizationId, normalizedAgentId)) || [];
  }

  private getHistoryKey(organizationId: string, agentId: string): string {
    return `${organizationId.trim().toLowerCase()}:${agentId}`;
  }
}

function redactUrlForOutput(value: string): string {
  try {
    const url = new URL(value);
    url.username = '';
    url.password = '';
    url.hash = '';
    for (const key of Array.from(url.searchParams.keys())) {
      if (/(?:token|secret|password|auth|session|signature|credential|api[_-]?key|code|state|nonce|ticket|jwt|cookie)/i.test(key)) {
        url.searchParams.set(key, '[REDACTED]');
      }
    }
    return url.toString();
  } catch {
    return '[invalid-url]';
  }
}

export const autonomousAgentResearcher = AutonomousAgentResearcher.getInstance();
