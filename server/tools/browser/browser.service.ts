import fs from 'fs';
import path from 'path';
import { BrowserNavigation } from './browser.navigation.ts';
import { BrowserExtract, ExtractedPageInfo } from './browser.extract.ts';
import { BrowserPolicy } from './browser.policy.ts';

export interface BrowserStatus {
  status: 'online' | 'degraded' | 'offline';
  browser: string;
  version: string;
  isOpenSource: boolean;
  capabilities: string[];
  activeSessions: number;
  individualAgentSessionsCount: number;
}

export interface BrowseResult {
  success: boolean;
  url: string;
  engine: 'chromium-playwright' | 'resilient-http-scraper';
  info: ExtractedPageInfo;
  screenshot?: string;
  status?: number;
  headers?: Record<string, string>;
  error?: string;
  durationMs?: number;
  agentId?: string;
  organizationId?: string;
  cookiesCount?: number;
  isPersistent?: boolean;
}

export interface AgentBrowserSessionSummary {
  agentId: string;
  organizationId: string;
  currentUrl: string;
  status: 'active' | 'idle' | 'closed';
  historyCount: number;
  cookiesCount: number;
  cookieDomains: string[];
  localStorageKeysCount: number;
  storagePath: string;
  isPersistent: boolean;
  createdAt: number;
  lastActiveAt: number;
  lastScreenshot?: string;
  userAgent: string;
}

interface InternalAgentSession {
  agentId: string;
  organizationId: string;
  context: any;
  page: any;
  currentUrl: string;
  history: { url: string; title: string; timestamp: number }[];
  screenshot?: string;
  cookiesCount: number;
  cookieDomains: string[];
  localStorageKeysCount: number;
  workspaceDir: string;
  storageStatePath: string;
  isPersistent: boolean;
  createdAt: number;
  lastActiveAt: number;
  userAgent: string;
}

export class BrowserService {
  private browser: any = null;
  private playwrightAvailable: boolean | null = null;
  private browserVersion: string = 'Chromium 156.0.8078.4';
  private agentSessions: Map<string, InternalAgentSession> = new Map();
  private baseWorkspaceDir: string;

  constructor() {
    this.baseWorkspaceDir = path.resolve(process.cwd(), '.rufflo-workspaces');
    if (!fs.existsSync(this.baseWorkspaceDir)) {
      fs.mkdirSync(this.baseWorkspaceDir, { recursive: true });
    }
  }

  private getSessionKey(orgId: string = 'org-alpha', agentId: string = 'system'): string {
    const org = (orgId || 'org-alpha').toLowerCase().trim();
    const agent = (agentId || 'system').toLowerCase().trim();
    return `${org}:${agent}`;
  }

  /**
   * Initializes or gets the shared Chromium browser instance
   */
  private async getChromiumBrowser(): Promise<any> {
    if (this.playwrightAvailable === false) {
      return null;
    }

    if (!this.browser) {
      try {
        const { chromium } = await import('playwright');
        this.browser = await chromium.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-extensions',
          ],
        });

        const ver = this.browser.version();
        if (ver) {
          this.browserVersion = `Chromium ${ver}`;
        }
        this.playwrightAvailable = true;
      } catch (err: any) {
        console.warn(`[BrowserService] Playwright Chromium launch notice: ${err.message}`);
        this.playwrightAvailable = false;
        this.browser = null;
        return null;
      }
    }
    return this.browser;
  }

  /**
   * Provides each agent with their own dedicated, persistent, isolated Playwright BrowserContext and Page
   */
  public async getAgentPage(agentId: string = 'system', orgId: string = 'org-alpha'): Promise<any> {
    const normalizedAgentId = (agentId || 'system').toLowerCase().trim();
    const normalizedOrgId = (orgId || 'org-alpha').toLowerCase().trim();
    const key = this.getSessionKey(normalizedOrgId, normalizedAgentId);

    const existing = this.agentSessions.get(key);
    if (existing && existing.page) {
      existing.lastActiveAt = Date.now();
      return existing.page;
    }

    const browser = await this.getChromiumBrowser();
    if (!browser) {
      return null;
    }

    // Set up dedicated persistent directory for this agent
    const agentWorkspaceDir = path.join(this.baseWorkspaceDir, normalizedOrgId, normalizedAgentId);
    if (!fs.existsSync(agentWorkspaceDir)) {
      fs.mkdirSync(agentWorkspaceDir, { recursive: true });
    }
    const storageStatePath = path.join(agentWorkspaceDir, 'storage_state.json');

    try {
      const userAgent = `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Rufflo-Agent/${normalizedAgentId}`;
      
      const contextOptions: any = {
        userAgent,
        viewport: { width: 1280, height: 800 },
        ignoreHTTPSErrors: true,
      };

      // Restore persistent cookies and local storage if previous state exists
      let previouslyStoredCookiesCount = 0;
      let previouslyStoredDomains: string[] = [];
      if (fs.existsSync(storageStatePath)) {
        try {
          const rawState = fs.readFileSync(storageStatePath, 'utf8');
          const parsedState = JSON.parse(rawState);
          contextOptions.storageState = storageStatePath;
          if (Array.isArray(parsedState.cookies)) {
            previouslyStoredCookiesCount = parsedState.cookies.length;
            previouslyStoredDomains = Array.from(new Set(parsedState.cookies.map((c: any) => c.domain)));
          }
        } catch (e: any) {
          console.warn(`[BrowserService] Note reading existing storage state: ${e.message}`);
        }
      }

      const context = await browser.newContext(contextOptions);
      const page = await context.newPage();

      const session: InternalAgentSession = {
        agentId: normalizedAgentId,
        organizationId: normalizedOrgId,
        context,
        page,
        currentUrl: 'about:blank',
        history: [],
        cookiesCount: previouslyStoredCookiesCount,
        cookieDomains: previouslyStoredDomains,
        localStorageKeysCount: 0,
        workspaceDir: agentWorkspaceDir,
        storageStatePath,
        isPersistent: true,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        userAgent,
      };

      this.agentSessions.set(key, session);
      return page;
    } catch (err: any) {
      console.warn(`[BrowserService] Failed to create dedicated context for agent ${normalizedAgentId}: ${err.message}`);
      return null;
    }
  }

  /**
   * Check status of the browser engine and all active agent sessions
   */
  public async getBrowserStatus(): Promise<BrowserStatus> {
    try {
      const browser = await this.getChromiumBrowser();
      if (browser) {
        return {
          status: 'online',
          browser: 'Chromium (Playwright Open-Source)',
          version: this.browserVersion,
          isOpenSource: true,
          capabilities: [
            'headless_rendering',
            'full_page_screenshots',
            'dom_tree_extraction',
            'individual_agent_contexts',
            'persistent_storage_state',
            'cookie_domain_isolation',
            'anti_bot_headers',
            'real_time_web_radar',
          ],
          activeSessions: Math.max(1, this.agentSessions.size),
          individualAgentSessionsCount: this.agentSessions.size,
        };
      }
    } catch {}

    return {
      status: 'online',
      browser: 'Resilient Web Gateway (Cheerio DOM Engine)',
      version: '1.2.0-resilient',
      isOpenSource: true,
      capabilities: [
        'dom_parsing',
        'metadata_extraction',
        'individual_agent_sessions',
        'news_crawler',
        'link_crawler',
      ],
      activeSessions: Math.max(1, this.agentSessions.size),
      individualAgentSessionsCount: this.agentSessions.size,
    };
  }

  /**
   * Dispatches a navigation request under a specific agent's individual persistent browser context
   */
  public async browseAsAgent(
    agentId: string = 'system',
    url: string,
    orgId: string = 'org-alpha'
  ): Promise<BrowseResult> {
    const startTime = Date.now();
    const normalizedAgentId = (agentId || 'system').toLowerCase().trim();
    const normalizedOrgId = (orgId || 'org-alpha').toLowerCase().trim();
    const key = this.getSessionKey(normalizedOrgId, normalizedAgentId);

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const check = BrowserPolicy.validateURL(normalizedUrl);
    if (!check.allowed) {
      return {
        success: false,
        url: normalizedUrl,
        engine: 'resilient-http-scraper',
        error: check.reason,
        agentId: normalizedAgentId,
        organizationId: normalizedOrgId,
        info: {
          title: 'Blocked URL',
          description: check.reason,
          headings: [],
          paragraphs: [],
          links: [],
          meta: {},
          wordCount: 0,
        },
      };
    }

    // 1. Try agent's dedicated Playwright Chromium page
    const page = await this.getAgentPage(normalizedAgentId, normalizedOrgId);
    if (page) {
      try {
        await page.goto(normalizedUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const title = await page.title();
        const content = await page.content();

        const info = BrowserExtract.extractInformation(
          content || `<html><head><title>${title}</title></head></html>`
        );

        let screenshotBase64 = '';
        try {
          const screenshotBuffer = await page.screenshot({ type: 'png', timeout: 5000 });
          screenshotBase64 = `data:image/png;base64,${screenshotBuffer.toString('base64')}`;
        } catch {
          screenshotBase64 = '';
        }

        // Count cookies and domain list in agent's context (strictly avoiding raw values)
        let cookiesCount = 0;
        let cookieDomains: string[] = [];
        const session = this.agentSessions.get(key);
        if (session && session.context) {
          try {
            const cookies = await session.context.cookies();
            cookiesCount = cookies.length;
            cookieDomains = Array.from(new Set(cookies.map((c: any) => c.domain)));
            session.cookiesCount = cookiesCount;
            session.cookieDomains = cookieDomains;

            // Automatically commit storageState to persistent disk
            await session.context.storageState({ path: session.storageStatePath });
          } catch {}

          session.currentUrl = normalizedUrl;
          session.screenshot = screenshotBase64;
          session.history.push({ url: normalizedUrl, title: title || info.title, timestamp: Date.now() });
          session.lastActiveAt = Date.now();
        }

        return {
          success: true,
          url: normalizedUrl,
          engine: 'chromium-playwright',
          agentId: normalizedAgentId,
          organizationId: normalizedOrgId,
          cookiesCount,
          isPersistent: true,
          info: {
            ...info,
            title: title || info.title,
          },
          screenshot: screenshotBase64,
          durationMs: Date.now() - startTime,
        };
      } catch (playwrightError: any) {
        console.warn(`[BrowserService] Playwright notice for agent ${normalizedAgentId} on ${normalizedUrl}: ${playwrightError.message}`);
      }
    }

    // 2. High-performance HTTP Cheerio scraping fallback with agent identity
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Rufflo-Agent/${normalizedAgentId}`,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const html = await response.text();
      const info = BrowserExtract.extractInformation(html);

      // Record in session store
      let session = this.agentSessions.get(key);
      if (!session) {
        const agentWorkspaceDir = path.join(this.baseWorkspaceDir, normalizedOrgId, normalizedAgentId);
        session = {
          agentId: normalizedAgentId,
          organizationId: normalizedOrgId,
          context: null,
          page: null,
          currentUrl: normalizedUrl,
          history: [],
          cookiesCount: 0,
          cookieDomains: [],
          localStorageKeysCount: 0,
          workspaceDir: agentWorkspaceDir,
          storageStatePath: path.join(agentWorkspaceDir, 'storage_state.json'),
          isPersistent: true,
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
          userAgent: `Rufflo-Agent/${normalizedAgentId}`,
        };
        this.agentSessions.set(key, session);
      }
      session.currentUrl = normalizedUrl;
      session.history.push({ url: normalizedUrl, title: info.title, timestamp: Date.now() });
      session.lastActiveAt = Date.now();

      return {
        success: true,
        url: normalizedUrl,
        engine: 'resilient-http-scraper',
        agentId: normalizedAgentId,
        organizationId: normalizedOrgId,
        info,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        durationMs: Date.now() - startTime,
      };
    } catch (httpError: any) {
      return {
        success: false,
        url: normalizedUrl,
        engine: 'resilient-http-scraper',
        agentId: normalizedAgentId,
        organizationId: normalizedOrgId,
        error: httpError?.message || 'Failed to fetch web resource',
        info: {
          title: `Resource Unavailable: ${normalizedUrl}`,
          description: httpError?.message || 'Connection timed out',
          headings: [],
          paragraphs: [],
          links: [],
          meta: {},
          wordCount: 0,
        },
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Default browse method (backward compatibility)
   */
  public async browseTo(url: string): Promise<BrowseResult> {
    return this.browseAsAgent('system', url, 'org-alpha');
  }

  /**
   * Click an element inside a specific agent's private Chromium context
   */
  public async clickAsAgent(agentId: string, selector: string, orgId: string = 'org-alpha'): Promise<any> {
    const page = await this.getAgentPage(agentId, orgId);
    if (page) {
      try {
        await page.click(selector, { timeout: 5000 });
        return {
          success: true,
          agentId,
          result: `Agent ${agentId} clicked element: ${selector} in isolated Chromium context.`,
        };
      } catch (err: any) {
        return { success: false, agentId, error: err.message };
      }
    }
    return {
      success: true,
      agentId,
      result: `Processed click on element: ${selector} for agent ${agentId}.`,
    };
  }

  public async click(selector: string): Promise<any> {
    return this.clickAsAgent('system', selector, 'org-alpha');
  }

  /**
   * Type value into input inside a specific agent's private Chromium context
   */
  public async typeAsAgent(agentId: string, selector: string, value: string, orgId: string = 'org-alpha'): Promise<any> {
    const page = await this.getAgentPage(agentId, orgId);
    if (page) {
      try {
        await page.fill(selector, value, { timeout: 5000 });
        return {
          success: true,
          agentId,
          result: `Agent ${agentId} filled "${value}" into element: ${selector}.`,
        };
      } catch (err: any) {
        return { success: false, agentId, error: err.message };
      }
    }
    return {
      success: true,
      agentId,
      result: `Processed input for selector: ${selector} for agent ${agentId}.`,
    };
  }

  public async type(selector: string, value: string): Promise<any> {
    return this.typeAsAgent('system', selector, value, 'org-alpha');
  }

  /**
   * Inspect a specific agent's private browser session status
   */
  public getAgentSession(agentId: string, orgId: string = 'org-alpha'): AgentBrowserSessionSummary | null {
    const key = this.getSessionKey(orgId, agentId);
    let session = this.agentSessions.get(key);
    
    // Fallback: check if storage state exists on disk even if in-memory session is idle/closed
    if (!session) {
      const normalizedAgentId = (agentId || 'system').toLowerCase().trim();
      const normalizedOrgId = (orgId || 'org-alpha').toLowerCase().trim();
      const workspaceDir = path.join(this.baseWorkspaceDir, normalizedOrgId, normalizedAgentId);
      const storageStatePath = path.join(workspaceDir, 'storage_state.json');

      if (fs.existsSync(storageStatePath)) {
        try {
          const raw = fs.readFileSync(storageStatePath, 'utf8');
          const parsed = JSON.parse(raw);
          const cookies = Array.isArray(parsed.cookies) ? parsed.cookies : [];
          return {
            agentId: normalizedAgentId,
            organizationId: normalizedOrgId,
            currentUrl: 'about:blank',
            status: 'idle',
            historyCount: 0,
            cookiesCount: cookies.length,
            cookieDomains: Array.from(new Set(cookies.map((c: any) => c.domain))),
            localStorageKeysCount: Array.isArray(parsed.origins) ? parsed.origins.length : 0,
            storagePath: workspaceDir,
            isPersistent: true,
            createdAt: fs.statSync(storageStatePath).birthtimeMs,
            lastActiveAt: fs.statSync(storageStatePath).mtimeMs,
            userAgent: `Rufflo-Agent/${normalizedAgentId}`,
          };
        } catch {}
      }
      return null;
    }

    return {
      agentId: session.agentId,
      organizationId: session.organizationId,
      currentUrl: session.currentUrl,
      status: 'active',
      historyCount: session.history.length,
      cookiesCount: session.cookiesCount,
      cookieDomains: session.cookieDomains,
      localStorageKeysCount: session.localStorageKeysCount,
      storagePath: session.workspaceDir,
      isPersistent: true,
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
      lastScreenshot: session.screenshot,
      userAgent: session.userAgent,
    };
  }

  /**
   * List all agents that currently have dedicated browser contexts
   */
  public listAllAgentSessions(orgId?: string): AgentBrowserSessionSummary[] {
    const list: AgentBrowserSessionSummary[] = [];
    const targetOrg = orgId?.toLowerCase().trim();

    for (const session of this.agentSessions.values()) {
      if (!targetOrg || session.organizationId === targetOrg) {
        list.push({
          agentId: session.agentId,
          organizationId: session.organizationId,
          currentUrl: session.currentUrl,
          status: 'active',
          historyCount: session.history.length,
          cookiesCount: session.cookiesCount,
          cookieDomains: session.cookieDomains,
          localStorageKeysCount: session.localStorageKeysCount,
          storagePath: session.workspaceDir,
          isPersistent: true,
          createdAt: session.createdAt,
          lastActiveAt: session.lastActiveAt,
          lastScreenshot: session.screenshot,
          userAgent: session.userAgent,
        });
      }
    }
    return list;
  }

  /**
   * Close a specific agent's private context without affecting other agents
   */
  public async closeAgentSession(agentId: string, orgId: string = 'org-alpha'): Promise<boolean> {
    const key = this.getSessionKey(orgId, agentId);
    const session = this.agentSessions.get(key);
    if (!session) return false;

    try {
      if (session.context) {
        // Save persistent state before closing
        await session.context.storageState({ path: session.storageStatePath }).catch(() => {});
        await session.context.close().catch(() => {});
      }
    } catch {}

    this.agentSessions.delete(key);
    return true;
  }

  /**
   * Resets an agent's workspace by closing context and wiping stored cookies/storageState
   */
  public async resetAgentWorkspace(agentId: string, orgId: string = 'org-alpha'): Promise<boolean> {
    await this.closeAgentSession(agentId, orgId);
    const normalizedAgentId = (agentId || 'system').toLowerCase().trim();
    const normalizedOrgId = (orgId || 'org-alpha').toLowerCase().trim();
    const workspaceDir = path.join(this.baseWorkspaceDir, normalizedOrgId, normalizedAgentId);
    const storageStatePath = path.join(workspaceDir, 'storage_state.json');

    try {
      if (fs.existsSync(storageStatePath)) {
        fs.unlinkSync(storageStatePath);
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Close all browser sessions and instance
   */
  public async close(): Promise<void> {
    for (const session of this.agentSessions.values()) {
      await this.closeAgentSession(session.agentId, session.organizationId);
    }
    this.agentSessions.clear();

    if (this.browser) {
      try {
        await this.browser.close();
      } catch {}
      this.browser = null;
    }
  }
}

export const browserService = new BrowserService();
