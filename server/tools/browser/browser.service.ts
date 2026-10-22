import fs from 'fs';
import path from 'path';
import { BrowserNavigation } from './browser.navigation.ts';
import { BrowserExtract, ExtractedPageInfo } from './browser.extract.ts';
import { BrowserPolicy } from './browser.policy.ts';
import { kmsEnvelopeEncryptionService, type KmsEncryptedEnvelope } from '../../security/kms-envelope-encryption.service.ts';
import { getSupabaseAdmin } from '../../../src/utils/supabaseAdmin.ts';
import { digitalIdentityService } from '../../identity/digital-identity.service.ts';

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
  localStorageKeysCount: number;
  isPersistent: boolean;
  createdAt: number;
  lastActiveAt: number;
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

  private countActiveAgentContexts(orgId?: string): number {
    const targetOrg = orgId?.toLowerCase().trim();
    return Array.from(this.agentSessions.values()).filter((session) =>
      Boolean(session.context && (!targetOrg || session.organizationId === targetOrg)),
    ).length;
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
    const agentWorkspaceDir = path.join(this.baseWorkspaceDir, encodeURIComponent(normalizedOrgId), encodeURIComponent(normalizedAgentId));
    if (!fs.existsSync(agentWorkspaceDir)) {
      fs.mkdirSync(agentWorkspaceDir, { recursive: true });
    }
    const storageStatePath = path.join(agentWorkspaceDir, 'storage_state.enc.json');
    const legacyStorageStatePath = path.join(agentWorkspaceDir, 'storage_state.json');

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
      await digitalIdentityService.getOrCreateIdentity(normalizedOrgId, normalizedAgentId);
      const parsedState = await this.loadPersistentStorageState(normalizedOrgId, normalizedAgentId, legacyStorageStatePath, storageStatePath);
      const persistedState = parsedState || undefined;
      if (parsedState && Array.isArray(parsedState.cookies)) {
        previouslyStoredCookiesCount = parsedState.cookies.length;
        previouslyStoredDomains = Array.from(new Set(parsedState.cookies.map((c: any) => c.domain)));
      }

      if (!kmsEnvelopeEncryptionService.isConfigured()) {
        throw new Error('Cloud KMS is required for persistent browser sessions.');
      }
      if (persistedState) contextOptions.storageState = persistedState;

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
  public async getBrowserStatus(orgId?: string): Promise<BrowserStatus> {
    const activeCount = this.countActiveAgentContexts(orgId);
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
          activeSessions: activeCount,
          individualAgentSessionsCount: activeCount,
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
      activeSessions: activeCount,
      individualAgentSessionsCount: activeCount,
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
        url: redactUrlForOutput(normalizedUrl),
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

        const info = sanitizePageInfo(BrowserExtract.extractInformation(
          content || `<html><head><title>${title}</title></head></html>`
        ), normalizedUrl);

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
        let session = this.agentSessions.get(key);
        if (session && session.context) {
          try {
            const cookies = await session.context.cookies();
            cookiesCount = cookies.length;
            cookieDomains = Array.from(new Set(cookies.map((c: any) => c.domain)));
            session.cookiesCount = cookiesCount;
            session.cookieDomains = cookieDomains;

            await this.persistStorageState(session);
          } catch {
            session.isPersistent = false;
          }

          session.currentUrl = normalizedUrl;
          session.screenshot = screenshotBase64;
          session.history.push({ url: normalizedUrl, title: title || info.title, timestamp: Date.now() });
          session.lastActiveAt = Date.now();
        }

        return {
          success: true,
          url: redactUrlForOutput(normalizedUrl),
          engine: 'chromium-playwright',
          agentId: normalizedAgentId,
          organizationId: normalizedOrgId,
          cookiesCount,
          isPersistent: session?.isPersistent ?? false,
          info: {
            ...info,
            title: title || info.title,
          },
          screenshot: screenshotBase64,
          durationMs: Date.now() - startTime,
        };
      } catch (playwrightError: any) {
        console.warn(`[BrowserService] Playwright navigation failed for agent ${normalizedAgentId}.`);
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
      const info = sanitizePageInfo(BrowserExtract.extractInformation(html), normalizedUrl);

      // Record in session store
      let session = this.agentSessions.get(key);
      if (!session) {
        const agentWorkspaceDir = path.join(this.baseWorkspaceDir, encodeURIComponent(normalizedOrgId), encodeURIComponent(normalizedAgentId));
        session = {
          agentId: normalizedAgentId,
          organizationId: normalizedOrgId,
          context: null,
          page: null,
          currentUrl: redactUrlForOutput(normalizedUrl),
          history: [],
          cookiesCount: 0,
          cookieDomains: [],
          localStorageKeysCount: 0,
          workspaceDir: agentWorkspaceDir,
          storageStatePath: path.join(agentWorkspaceDir, 'storage_state.enc.json'),
          isPersistent: false,
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
          url: redactUrlForOutput(normalizedUrl),
        engine: 'resilient-http-scraper',
        agentId: normalizedAgentId,
        organizationId: normalizedOrgId,
        info,
        isPersistent: false,
        status: response.status,
        // Never forward Set-Cookie or authentication-related response headers to callers.
        headers: safeResponseHeaders(response.headers),
        durationMs: Date.now() - startTime,
      };
    } catch (httpError: any) {
      return {
        success: false,
        url: redactUrlForOutput(normalizedUrl),
        engine: 'resilient-http-scraper',
        agentId: normalizedAgentId,
        organizationId: normalizedOrgId,
        error: 'Failed to fetch web resource.',
        info: {
          title: `Resource Unavailable: ${safeHost(normalizedUrl)}`,
          description: 'The request failed or timed out.',
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
    return this.browseAsAgent('system', url, process.env.RUFFLO_SYSTEM_ORGANIZATION_ID?.trim() || 'org-default');
  }

  /**
   * Click an element inside a specific agent's private Chromium context
   */
  public async clickAsAgent(agentId: string, selector: string, orgId: string = 'org-alpha'): Promise<any> {
    const page = await this.getAgentPage(agentId, orgId);
    if (page) {
      try {
        await page.click(selector, { timeout: 5000 });
        const session = this.agentSessions.get(this.getSessionKey(orgId, agentId));
        if (session) await this.persistStorageState(session);
        return {
          success: true,
          agentId,
          result: 'The requested action completed in the isolated browser context.',
        };
      } catch {
        return { success: false, agentId, error: 'The isolated browser action could not be completed or saved.' };
      }
    }
    return {
      success: false,
      agentId,
      error: 'The isolated persistent browser workspace is unavailable.',
    };
  }

  public async click(selector: string): Promise<any> {
    return this.clickAsAgent('system', selector, process.env.RUFFLO_SYSTEM_ORGANIZATION_ID?.trim() || 'org-default');
  }

  /**
   * Type value into input inside a specific agent's private Chromium context
   */
  public async typeAsAgent(agentId: string, selector: string, value: string, orgId: string = 'org-alpha'): Promise<any> {
    const page = await this.getAgentPage(agentId, orgId);
    if (page) {
      try {
        await page.fill(selector, value, { timeout: 5000 });
        const session = this.agentSessions.get(this.getSessionKey(orgId, agentId));
        if (session) await this.persistStorageState(session);
        return {
          success: true,
          agentId,
          result: 'The requested input was submitted to the isolated browser context.',
        };
      } catch {
        return { success: false, agentId, error: 'The isolated browser input could not be completed or saved.' };
      }
    }
    return {
      success: false,
      agentId,
      error: 'The isolated persistent browser workspace is unavailable.',
    };
  }

  public async type(selector: string, value: string): Promise<any> {
    return this.typeAsAgent('system', selector, value, process.env.RUFFLO_SYSTEM_ORGANIZATION_ID?.trim() || 'org-default');
  }

  /**
   * Inspect a specific agent's private browser session status
   */
  public getAgentSession(agentId: string, orgId: string = 'org-alpha'): AgentBrowserSessionSummary | null {
    const key = this.getSessionKey(orgId, agentId);
    const session = this.agentSessions.get(key);
    if (!session) return null;

    return {
      agentId: session.agentId,
      organizationId: session.organizationId,
      currentUrl: redactUrlForOutput(session.currentUrl),
      status: session.context ? 'active' : 'idle',
      historyCount: session.history.length,
      cookiesCount: session.cookiesCount,
      localStorageKeysCount: session.localStorageKeysCount,
      isPersistent: session.isPersistent,
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
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
          currentUrl: redactUrlForOutput(session.currentUrl),
          status: session.context ? 'active' : 'idle',
          historyCount: session.history.length,
          cookiesCount: session.cookiesCount,
          localStorageKeysCount: session.localStorageKeysCount,
          isPersistent: session.isPersistent,
          createdAt: session.createdAt,
          lastActiveAt: session.lastActiveAt,
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
        await this.persistStorageState(session);
        await session.context.close();
      }
    } catch {
      session.isPersistent = false;
      return false;
    }

    this.agentSessions.delete(key);
    await this.updateWorkspaceStatus(orgId, agentId, 'closed', 'encrypted').catch(() => {});
    return true;
  }

  /**
   * Resets an agent's workspace by closing context and wiping stored cookies/storageState
   */
  public async resetAgentWorkspace(agentId: string, orgId: string = 'org-alpha'): Promise<boolean> {
    await this.closeAgentSession(agentId, orgId);
    const normalizedAgentId = (agentId || 'system').toLowerCase().trim();
    const normalizedOrgId = (orgId || 'org-alpha').toLowerCase().trim();
    const workspaceDir = path.join(this.baseWorkspaceDir, encodeURIComponent(normalizedOrgId), encodeURIComponent(normalizedAgentId));
    try {
      const { error: deleteError } = await getSupabaseAdmin().from('agent_secret_envelopes').delete()
        .eq('organization_id', normalizedOrgId).eq('agent_id', normalizedAgentId)
        .eq('purpose', 'playwright-storage-state');
      if (deleteError) throw deleteError;
      await this.updateWorkspaceStatus(normalizedOrgId, normalizedAgentId, 'idle', 'pending');
      const legacyStorageStatePath = path.join(workspaceDir, 'storage_state.json');
      const encryptedStorageStatePath = path.join(workspaceDir, 'storage_state.enc.json');
      if (fs.existsSync(legacyStorageStatePath)) fs.unlinkSync(legacyStorageStatePath);
      if (fs.existsSync(encryptedStorageStatePath)) fs.unlinkSync(encryptedStorageStatePath);
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

  private async persistStorageState(session: InternalAgentSession): Promise<void> {
    if (!kmsEnvelopeEncryptionService.isConfigured()) {
      throw new Error('Cloud KMS is required for persistent browser sessions.');
    }
    const state = await session.context.storageState();
    const envelope = await kmsEnvelopeEncryptionService.encrypt(JSON.stringify(state), {
      organizationId: session.organizationId,
      agentId: session.agentId,
      purpose: 'playwright-storage-state',
    });
    const scope = {
      organizationId: session.organizationId,
      agentId: session.agentId,
      purpose: 'playwright-storage-state',
    };
    const { error } = await getSupabaseAdmin().from('agent_secret_envelopes').upsert({
      organization_id: scope.organizationId,
      agent_id: scope.agentId,
      purpose: scope.purpose,
      kms_key_name: envelope.keyName,
      wrapped_dek: bytea(envelope.wrappedDek),
      ciphertext: bytea(envelope.ciphertext),
      nonce: bytea(envelope.iv),
      auth_tag: bytea(envelope.authTag),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organization_id,agent_id,purpose' });
    if (error) throw new Error('Encrypted browser state could not be persisted.');
    await this.updateWorkspaceStatus(scope.organizationId, scope.agentId, 'active', 'encrypted');
    session.isPersistent = true;
  }

  private async loadPersistentStorageState(
    organizationId: string,
    agentId: string,
    legacyPath: string,
    encryptedPath: string,
  ): Promise<any | null> {
    if (!kmsEnvelopeEncryptionService.isConfigured()) throw new Error('Cloud KMS is required for persistent browser sessions.');
    const scope = { organizationId, agentId, purpose: 'playwright-storage-state' };
    const { data: row, error } = await getSupabaseAdmin().from('agent_secret_envelopes').select('*')
      .eq('organization_id', organizationId).eq('agent_id', agentId).eq('purpose', scope.purpose).maybeSingle();
    if (error) throw new Error('Encrypted browser state lookup failed.');
    if (row) {
      const envelope = envelopeFromRow(row);
      const state = JSON.parse((await kmsEnvelopeEncryptionService.decrypt(envelope, scope)).toString('utf8'));
      if (fs.existsSync(legacyPath)) fs.unlinkSync(legacyPath);
      if (fs.existsSync(encryptedPath)) fs.unlinkSync(encryptedPath);
      return state;
    }
    if (fs.existsSync(encryptedPath)) {
      const localEnvelope = JSON.parse(fs.readFileSync(encryptedPath, 'utf8')) as KmsEncryptedEnvelope;
      const cleartext = await kmsEnvelopeEncryptionService.decrypt(localEnvelope, scope);
      const state = JSON.parse(cleartext.toString('utf8'));
      await this.storeEncryptedState(state, scope);
      fs.unlinkSync(encryptedPath);
      if (fs.existsSync(legacyPath)) fs.unlinkSync(legacyPath);
      return state;
    }
    if (fs.existsSync(legacyPath)) {
      const legacyState = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
      if (!legacyState || !Array.isArray(legacyState.cookies) || !Array.isArray(legacyState.origins)) {
        throw new Error('Legacy browser profile is malformed.');
      }
      await this.storeEncryptedState(legacyState, scope);
      fs.unlinkSync(legacyPath);
      return legacyState;
    }
    return null;
  }

  private async storeEncryptedState(state: unknown, scope: { organizationId: string; agentId: string; purpose: string }): Promise<void> {
    const envelope = await kmsEnvelopeEncryptionService.encrypt(JSON.stringify(state), scope);
    const { error } = await getSupabaseAdmin().from('agent_secret_envelopes').upsert({
      organization_id: scope.organizationId,
      agent_id: scope.agentId,
      purpose: scope.purpose,
      kms_key_name: envelope.keyName,
      wrapped_dek: bytea(envelope.wrappedDek),
      ciphertext: bytea(envelope.ciphertext),
      nonce: bytea(envelope.iv),
      auth_tag: bytea(envelope.authTag),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organization_id,agent_id,purpose' });
    if (error) throw new Error('Encrypted browser state could not be persisted.');
    await this.updateWorkspaceStatus(scope.organizationId, scope.agentId, 'active', 'encrypted');
  }

  private async updateWorkspaceStatus(
    organizationId: string,
    agentId: string,
    status: 'active' | 'idle' | 'closed',
    persistenceStatus: 'pending' | 'encrypted' | 'unavailable',
  ): Promise<void> {
    const { error } = await getSupabaseAdmin().from('agent_workspaces').update({
      status,
      persistence_status: persistenceStatus,
      last_started_at: status === 'active' ? new Date().toISOString() : undefined,
    }).eq('organization_id', organizationId).eq('agent_id', agentId.trim().toLowerCase());
    if (error) throw new Error('Workspace status could not be updated.');
  }
}

export const browserService = new BrowserService();

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

function safeHost(value: string): string {
  try {
    return new URL(value).host;
  } catch {
    return 'unknown host';
  }
}

function sanitizePageInfo(info: ExtractedPageInfo, baseUrl: string): ExtractedPageInfo {
  const cleanText = (value: string) => value
    .replace(/\bBearer\s+[A-Za-z0-9._~+\/-]{12,}/gi, 'Bearer [REDACTED]')
    .replace(/\bya29\.[A-Za-z0-9._-]+/g, '[REDACTED_TOKEN]')
    .replace(/\b1\/\/[A-Za-z0-9._-]{12,}/g, '[REDACTED_TOKEN]')
    .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, '[REDACTED_JWT]')
    .replace(/\b(access|refresh|id)[_-]?token\s*[:=]\s*[^\s,;]+/gi, '$1_token=[REDACTED]')
    .replace(/\b(authorization|csrf|x-csrf-token|session|cookie|api[_-]?key|secret|password)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]')
    .replace(/\b\d{6,8}\b/g, '[REDACTED_CODE]');

  const meta: Record<string, string> = {};
  for (const [key, value] of Object.entries(info.meta || {})) {
    if (!/(?:token|secret|password|auth|session|cookie|csrf|nonce|credential|api[_-]?key|code)/i.test(key)) {
      meta[key] = cleanText(value);
    }
  }

  const links = (info.links || []).map((link) => {
    let href = '[invalid-url]';
    try {
      const resolved = new URL(link.href, baseUrl);
      const sanitized = redactUrlForOutput(resolved.toString());
      href = link.href.startsWith('/') ? sanitized.replace(resolved.origin, '') : sanitized;
    } catch {}
    return { text: cleanText(link.text), href };
  });

  return {
    title: cleanText(info.title),
    description: cleanText(info.description),
    headings: (info.headings || []).map(cleanText),
    paragraphs: (info.paragraphs || []).map(cleanText),
    links,
    codeSnippets: info.codeSnippets?.map(cleanText),
    meta,
    wordCount: info.wordCount,
  };
}

function safeResponseHeaders(headers: Headers): Record<string, string> {
  const safe: Record<string, string> = {};
  const blocked = /^(?:set-cookie2?|authorization|proxy-authorization|www-authenticate|proxy-authenticate)$/i;
  for (const [name, value] of headers.entries()) {
    if (!blocked.test(name)) safe[name] = value.slice(0, 2000);
  }
  return safe;
}

function bytea(base64: string): string {
  return `\\x${Buffer.from(base64, 'base64').toString('hex')}`;
}

function fromBytea(value: string): string {
  if (typeof value !== 'string' || !value.startsWith('\\x')) throw new Error('Encrypted browser state is malformed.');
  return Buffer.from(value.slice(2), 'hex').toString('base64');
}

function envelopeFromRow(row: Record<string, any>): KmsEncryptedEnvelope {
  return {
    version: 1,
    algorithm: 'AES-256-GCM',
    keyName: row.kms_key_name,
    wrappedDek: fromBytea(row.wrapped_dek),
    ciphertext: fromBytea(row.ciphertext),
    iv: fromBytea(row.nonce),
    authTag: fromBytea(row.auth_tag),
  };
}
