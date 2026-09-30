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

  public setConnectionStatus(provider: string, status: Partial<IntegrationConnectionStatus>): void {
    const existing = this.connections.get(provider);
    if (existing) {
      this.connections.set(provider, { ...existing, ...status });
    } else {
      this.connections.set(provider, {
        id: `conn-${provider}`,
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Integration`,
        provider: provider as any,
        connected: status.connected ?? true,
        authType: 'oauth',
        scopes: [],
        ...status,
      });
    }
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

  public async initiateConnection(
    provider: string,
    userId: string = 'default_user'
  ): Promise<{
    success: boolean;
    redirectUrl?: string;
    connectionId?: string;
    message: string;
    isRealComposio: boolean;
  }> {
    if (composioClient.isConfigured()) {
      try {
        const sdk = composioClient.getSDK();
        // Try authorize on toolkit first
        const authRes: any = await (sdk.toolkits as any).authorize(provider, userId).catch(async (authErr: any) => {
          // If toolkit slug needs direct link fallback
          console.warn(`[Composio Auth] toolkits.authorize fallback for ${provider}:`, authErr?.message);
          return await (sdk.connectedAccounts as any).link(userId, provider);
        });

        const redirectUrl = authRes?.redirectUrl || authRes?.url || authRes?.authUrl;
        const connectionId = authRes?.id || authRes?.connectionRequestId || `conn-${provider}-${Date.now()}`;

        return {
          success: true,
          redirectUrl,
          connectionId,
          message: `Composio OAuth initiated for ${provider}. Follow redirect URL to grant authorization.`,
          isRealComposio: true,
        };
      } catch (err: any) {
        console.error(`Composio authorization failed for ${provider}:`, err);
        throw new Error(`Composio authorization error: ${err?.message || String(err)}`);
      }
    }

    // Direct / Local connection mode (when COMPOSIO_API_KEY is not yet populated)
    const existing = this.connections.get(provider);
    const mockRedirect = `https://composio.dev/auth/connect?toolkit=${encodeURIComponent(provider)}&app=rufflo-quantum-agent`;
    
    // Mark as locally configured/connected for rapid onboarding
    this.setConnectionStatus(provider, {
      connected: true,
      accountEmailOrHandle: `${provider}-user@rufflo.internal`,
      lastSync: new Date().toISOString(),
    });

    return {
      success: true,
      redirectUrl: mockRedirect,
      connectionId: `local-conn-${provider}-${Date.now()}`,
      message: `Connected ${provider} integration successfully (Local Simulation Mode). Set COMPOSIO_API_KEY for live multi-tenant cloud OAuth.`,
      isRealComposio: false,
    };
  }

  public async deleteConnection(provider: string): Promise<boolean> {
    const existing = this.connections.get(provider);
    if (!existing) return false;

    if (composioClient.isConfigured() && existing.id && !existing.id.startsWith('conn-') && !existing.id.startsWith('local-')) {
      try {
        const sdk = composioClient.getSDK();
        await sdk.connectedAccounts.delete(existing.id);
      } catch (err) {
        console.error(`Error deleting connected account ${existing.id}:`, err);
      }
    }

    this.setConnectionStatus(provider, {
      connected: false,
      accountEmailOrHandle: undefined,
    });
    return true;
  }
}

export const composioAuth = ComposioAuthService.getInstance();

