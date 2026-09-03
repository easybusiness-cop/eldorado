import { composioClient } from './client.ts';
import { IntegrationConnectionStatus } from '../../../shared/types/index.ts';

export class ComposioAuthService {
  private static instance: ComposioAuthService;
  private connections: Map<string, IntegrationConnectionStatus> = new Map();

  private constructor() {
    this.initDefaultStatuses();
  }

  public static getInstance(): ComposioAuthService {
    if (!ComposioAuthService.instance) {
      ComposioAuthService.instance = new ComposioAuthService();
    }
    return ComposioAuthService.instance;
  }

  private initDefaultStatuses() {
    const hasGitHubToken = Boolean(process.env.GITHUB_TOKEN);
    const hasComposioKey = composioClient.isConfigured();

    this.connections.set('github', {
      id: 'conn-github',
      name: 'GitHub Enterprise / VCS',
      provider: 'github',
      connected: hasGitHubToken || hasComposioKey,
      authType: 'token',
      scopes: ['repo', 'pull_requests', 'issues', 'workflow'],
      accountEmailOrHandle: hasGitHubToken ? 'github-bot@rufflo.internal' : undefined,
    });

    this.connections.set('gmail', {
      id: 'conn-gmail',
      name: 'Google Workspace Gmail',
      provider: 'gmail',
      connected: false, // NOT CONNECTED until OAuth or service key is provided
      authType: 'oauth',
      scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'],
    });

    this.connections.set('slack', {
      id: 'conn-slack',
      name: 'Slack Fleet Bot',
      provider: 'slack',
      connected: false,
      authType: 'oauth',
      scopes: ['chat:write', 'channels:read'],
    });

    this.connections.set('notion', {
      id: 'conn-notion',
      name: 'Notion Knowledge Base',
      provider: 'notion',
      connected: false,
      authType: 'oauth',
      scopes: ['pages:read', 'pages:write'],
    });

    this.connections.set('instagram', {
      id: 'conn-instagram',
      name: 'Instagram Business Media',
      provider: 'instagram',
      connected: false,
      authType: 'oauth',
      scopes: ['instagram_basic', 'instagram_content_publish'],
    });

    this.connections.set('youtube', {
      id: 'conn-youtube',
      name: 'YouTube Media Channel',
      provider: 'youtube',
      connected: false,
      authType: 'oauth',
      scopes: ['https://www.googleapis.com/auth/youtube.upload'],
    });

    this.connections.set('x', {
      id: 'conn-x',
      name: 'X / Twitter Bot',
      provider: 'x',
      connected: false,
      authType: 'oauth',
      scopes: ['tweet.read', 'tweet.write', 'users.read'],
    });

    this.connections.set('linkedin', {
      id: 'conn-linkedin',
      name: 'LinkedIn Company Page',
      provider: 'linkedin',
      connected: false,
      authType: 'oauth',
      scopes: ['w_member_social', 'r_liteprofile'],
    });
  }

  public getConnection(provider: string): IntegrationConnectionStatus | undefined {
    return this.connections.get(provider);
  }

  public getAllConnections(): IntegrationConnectionStatus[] {
    return Array.from(this.connections.values());
  }

  public async syncConnectionsFromComposio(): Promise<void> {
    if (!composioClient.isConfigured()) return;
    try {
      const sdk = composioClient.getSDK();
      const response = await sdk.connectedAccounts.list();
      
      for (const item of response.items) {
        const provider = item.toolkit.slug;
        const isConnected = item.status === 'ACTIVE';
        
        const existing = this.connections.get(provider);
        if (existing) {
          this.connections.set(provider, {
            ...existing,
            id: item.id,
            connected: isConnected,
            lastSync: item.updatedAt,
            accountEmailOrHandle: item.alias || undefined,
          });
        } else {
          this.connections.set(provider, {
            id: item.id,
            name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Integration`,
            provider: provider as any,
            connected: isConnected,
            authType: 'oauth',
            scopes: [],
            lastSync: item.updatedAt,
            accountEmailOrHandle: item.alias || undefined,
          });
        }
      }
    } catch (err) {
      console.error('Error syncing connections from Composio:', err);
    }
  }

  public setConnectionStatus(provider: string, status: Partial<IntegrationConnectionStatus>): IntegrationConnectionStatus {
    const existing = this.connections.get(provider);
    if (!existing) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    const updated = { ...existing, ...status };
    this.connections.set(provider, updated);
    return updated;
  }
}

export const composioAuth = ComposioAuthService.getInstance();
