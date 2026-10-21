import { composioClient } from './client.ts';
import type { IntegrationConnectionStatus } from '../../../shared/types/index.ts';

export class ComposioAuthService {
  private static instance: ComposioAuthService;
  private connections: Map<string, IntegrationConnectionStatus> = new Map();

  private constructor() {
    this.initIntegrationCatalog();
  }

  public static getInstance(): ComposioAuthService {
    if (!ComposioAuthService.instance) {
      ComposioAuthService.instance = new ComposioAuthService();
    }
    return ComposioAuthService.instance;
  }

  private initIntegrationCatalog() {
    this.connections.set('telegram', {
      id: 'conn-telegram',
      name: 'Telegram',
      provider: 'telegram',
      connected: false,
      authType: 'token',
      scopes: ['public_channels:read', 'bot_api:send', 'search:live'],
    });

    this.connections.set('github', {
      id: 'conn-github',
      name: 'GitHub',
      provider: 'github',
      connected: false,
      authType: 'token',
      scopes: ['repo:read', 'search:repositories', 'issues:read'],
    });

    this.connections.set('hackernews', {
      id: 'conn-hackernews',
      name: 'Hacker News',
      provider: 'hackernews',
      connected: false,
      authType: 'api_key',
      scopes: ['topstories:read', 'newstories:read', 'items:read'],
    });

    this.connections.set('arxiv', {
      id: 'conn-arxiv',
      name: 'arXiv',
      provider: 'arxiv',
      connected: false,
      authType: 'api_key',
      scopes: ['cs.AI:read', 'cs.SE:read', 'papers:search'],
    });

    this.connections.set('browser', {
      id: 'conn-browser',
      name: 'Browser',
      provider: 'browser',
      connected: false,
      authType: 'token',
      scopes: ['headless_rendering', 'screenshots:capture', 'dom:extract'],
    });

    this.connections.set('google_workspace', {
      id: 'conn-google',
      name: 'Google Workspace (Drive & Calendar)',
      provider: 'google_workspace',
      connected: false,
      authType: 'oauth',
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    this.connections.set('webhook', {
      id: 'conn-webhook',
      name: 'Webhook',
      provider: 'webhook',
      connected: false,
      authType: 'token',
      scopes: ['events:receive', 'telemetry:stream'],
    });
  }

  public getConnection(provider: string): IntegrationConnectionStatus | undefined {
    return this.connections.get(provider);
  }

  public getAllConnections(): IntegrationConnectionStatus[] {
    return Array.from(this.connections.values());
  }

  public setConnectionStatus(
    provider: string,
    updates: Partial<IntegrationConnectionStatus>
  ): IntegrationConnectionStatus {
    const existing = this.connections.get(provider);
    if (!existing) {
      const newStatus: IntegrationConnectionStatus = {
        id: `conn-${provider}`,
        name: provider.toUpperCase(),
        provider: provider as any,
        connected: Boolean(updates.connected),
        authType: updates.authType || 'token',
        scopes: updates.scopes || [],
        ...updates,
      };
      this.connections.set(provider, newStatus);
      return newStatus;
    }
    const updated = { ...existing, ...updates };
    this.connections.set(provider, updated);
    return updated;
  }

  public async initiateConnection(provider: string, userId = 'default_user'): Promise<any> {
    void userId;
    throw new Error(`Connection setup is unavailable for ${provider}: no provider authorization flow is implemented.`);
  }

  public async deleteConnection(provider: string): Promise<boolean> {
    const existing = this.connections.get(provider);
    if (existing) {
      this.connections.set(provider, { ...existing, connected: false });
      return true;
    }
    return false;
  }

  public async syncConnectionsFromComposio(): Promise<void> {
    // Keep local active integrations in sync
  }
}

export const composioAuth = ComposioAuthService.getInstance();
