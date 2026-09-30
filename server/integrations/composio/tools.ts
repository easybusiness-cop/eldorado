import { composioAuth } from './auth.ts';
import { composioClient } from './client.ts';

export interface ComposioToolAction {
  actionId: string;
  provider: string;
  name: string;
  description: string;
  schema: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

export class ComposioToolGateway {
  private static instance: ComposioToolGateway;
  private actions: Map<string, ComposioToolAction> = new Map();

  private constructor() {
    this.registerBaseActions();
  }

  public static getInstance(): ComposioToolGateway {
    if (!ComposioToolGateway.instance) {
      ComposioToolGateway.instance = new ComposioToolGateway();
    }
    return ComposioToolGateway.instance;
  }

  private registerBaseActions() {
    this.actions.set('HACKERNEWS_GET_TOP_STORIES', {
      actionId: 'HACKERNEWS_GET_TOP_STORIES',
      provider: 'hackernews',
      name: 'Fetch Top HackerNews Stories',
      description: 'Queries top trending tech & AI stories from Hacker News via live tool pipeline',
      schema: { type: 'object', properties: { limit: { type: 'number', default: 5 } } },
      execute: async (params) => {
        if (composioClient.isConfigured()) {
          try {
            const sdk = composioClient.getSDK();
            const res = await sdk.tools.execute('HACKERNEWS_GET_TOP_STORIES', {
              userId: 'default_user',
              arguments: { limit: params.limit || 5 },
              dangerouslySkipVersionCheck: true,
            });
            return res;
          } catch (err: any) {
            console.warn('[Composio SDK Execute Fallback] Direct API fallback for HackerNews:', err?.message);
          }
        }

        // Live real API execution via HackerNews Firebase API
        const limit = params.limit || 5;
        const topIdsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
        const topIds: number[] = await topIdsRes.json();
        const selectedIds = topIds.slice(0, limit);

        const stories = await Promise.all(
          selectedIds.map(async (id) => {
            const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
            return itemRes.json();
          })
        );

        return {
          success: true,
          action: 'HACKERNEWS_GET_TOP_STORIES',
          count: stories.length,
          timestamp: new Date().toISOString(),
          stories: stories.map((s) => ({
            id: s.id,
            title: s.title,
            by: s.by,
            score: s.score,
            url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
            commentsCount: s.descendants || 0,
          })),
        };
      },
    });

    this.actions.set('WEATHER_GET_WEATHER', {
      actionId: 'WEATHER_GET_WEATHER',
      provider: 'weather',
      name: 'Get Live Weather Forecast',
      description: 'Queries real-time temperature, wind, and conditions for given coordinates or city',
      schema: {
        type: 'object',
        properties: {
          latitude: { type: 'number', default: 37.7749 },
          longitude: { type: 'number', default: -122.4194 },
          city: { type: 'string', default: 'San Francisco' },
        },
      },
      execute: async (params) => {
        if (composioClient.isConfigured()) {
          try {
            const sdk = composioClient.getSDK();
            const res = await sdk.tools.execute('WEATHER_GET_WEATHER', {
              userId: 'default_user',
              arguments: params,
              dangerouslySkipVersionCheck: true,
            });
            return res;
          } catch (err: any) {
            console.warn('[Composio SDK Execute Fallback] OpenMeteo Live Fallback:', err?.message);
          }
        }

        const lat = params.latitude || 37.7749;
        const lon = params.longitude || -122.4194;
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();

        return {
          success: true,
          action: 'WEATHER_GET_WEATHER',
          city: params.city || 'San Francisco, CA',
          coordinates: { latitude: lat, longitude: lon },
          current: data.current_weather,
          elevation: data.elevation,
          timezone: data.timezone,
        };
      },
    });

    this.actions.set('COINGECKO_GET_PRICES', {
      actionId: 'COINGECKO_GET_PRICES',
      provider: 'coingecko',
      name: 'Get Live Crypto Market Rates',
      description: 'Fetches live market valuation for top cryptocurrencies (BTC, ETH, SOL)',
      schema: {
        type: 'object',
        properties: {
          ids: { type: 'string', default: 'bitcoin,ethereum,solana' },
          currency: { type: 'string', default: 'usd' },
        },
      },
      execute: async (params) => {
        const ids = params.ids || 'bitcoin,ethereum,solana';
        const curr = params.currency || 'usd';
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${curr}&include_24hr_change=true`);
        const data = await res.json();
        return {
          success: true,
          action: 'COINGECKO_GET_PRICES',
          prices: data,
          queriedAt: new Date().toISOString(),
        };
      },
    });

    this.actions.set('GITHUB_GET_ABOUT_AUTHENTICATED_USER', {
      actionId: 'GITHUB_GET_ABOUT_AUTHENTICATED_USER',
      provider: 'github',
      name: 'Get GitHub Authenticated User',
      description: 'Fetches information about the currently connected GitHub profile and repositories',
      schema: { type: 'object', properties: {} },
      execute: async (params) => {
        if (composioClient.isConfigured()) {
          try {
            const sdk = composioClient.getSDK();
            const res = await sdk.tools.execute('GITHUB_GET_ABOUT_AUTHENTICATED_USER', {
              userId: 'default_user',
              arguments: params,
              dangerouslySkipVersionCheck: true,
            });
            return res;
          } catch (err: any) {
            console.error('Composio GITHUB_GET_ABOUT_AUTHENTICATED_USER failed:', err);
            throw new Error(`Real Composio Execution Failed: ${err?.message || String(err)}`);
          }
        }

        const ghToken = process.env.GITHUB_TOKEN;
        if (ghToken) {
          const res = await fetch('https://api.github.com/user', {
            headers: { Authorization: `token ${ghToken}`, 'User-Agent': 'Rufflo-Composio-Agent' },
          });
          if (res.ok) {
            return await res.json();
          }
        }

        return {
          success: true,
          login: 'rufflo-quantum-operator',
          name: 'Rufflo Quantum Engineer',
          bio: 'Autonomous AI Enterprise Operator with Composio Tool Execution Mesh',
          public_repos: 42,
          followers: 128,
          mode: 'SIMULATION_MODE',
        };
      },
    });

    this.actions.set('GITHUB_CREATE_ISSUE', {
      actionId: 'GITHUB_CREATE_ISSUE',
      provider: 'github',

      name: 'Create GitHub Issue',
      description: 'Creates a new issue in the target GitHub repository',
      schema: { type: 'object', properties: { repo: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' } }, required: ['repo', 'title'] },
      execute: async (params) => {
        if (composioClient.isConfigured()) {
          try {
            const sdk = composioClient.getSDK();
            const [owner, repo] = params.repo.includes('/') ? params.repo.split('/') : ['owner', params.repo];
            const res = await sdk.tools.execute('GITHUB_CREATE_ISSUE', {
              userId: 'default_user',
              arguments: {
                owner,
                repo,
                title: params.title,
                body: params.body || '',
              },
              dangerouslySkipVersionCheck: true,
            });
            return res;
          } catch (err: any) {
            console.error('Real Composio execute GITHUB_CREATE_ISSUE failed:', err);
            throw new Error(`Real Composio Execution Failed: ${err?.message || String(err)}`);
          }
        }

        const conn = composioAuth.getConnection('github');
        if (!conn?.connected) {
          throw new Error('GitHub integration is NOT CONNECTED. Please configure GITHUB_TOKEN or OAuth credentials.');
        }
        return {
          success: true,
          issueNumber: Math.floor(Math.random() * 800) + 100,
          url: `https://github.com/${params.repo}/issues/${Math.floor(Math.random() * 800) + 100}`,
          title: params.title,
          mode: 'SIMULATION_MODE',
        };
      },
    });

    this.actions.set('GMAIL_SEND_EMAIL', {
      actionId: 'GMAIL_SEND_EMAIL',
      provider: 'gmail',
      name: 'Send Gmail Email',
      description: 'Sends an email through connected Google Workspace Gmail',
      schema: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['to', 'subject', 'body'] },
      execute: async (params) => {
        if (composioClient.isConfigured()) {
          try {
            const sdk = composioClient.getSDK();
            const res = await sdk.tools.execute('GMAIL_SEND_EMAIL', {
              userId: 'default_user',
              arguments: {
                userId: 'me',
                to: params.to,
                subject: params.subject,
                body: params.body,
              },
              dangerouslySkipVersionCheck: true,
            });
            return res;
          } catch (err: any) {
            console.error('Real Composio execute GMAIL_SEND_EMAIL failed:', err);
            throw new Error(`Real Composio Execution Failed: ${err?.message || String(err)}`);
          }
        }

        const conn = composioAuth.getConnection('gmail');
        if (!conn?.connected) {
          throw new Error('Gmail integration is NOT CONNECTED. Please initiate Google OAuth first.');
        }
        return { success: true, messageId: `msg-${Date.now()}`, mode: 'SIMULATION_MODE' };
      },
    });

    this.actions.set('SLACK_SEND_MESSAGE', {
      actionId: 'SLACK_SEND_MESSAGE',
      provider: 'slack',
      name: 'Send Slack Message',
      description: 'Dispatches a message to the specified Slack channel',
      schema: { type: 'object', properties: { channel: { type: 'string' }, text: { type: 'string' } }, required: ['channel', 'text'] },
      execute: async (params) => {
        if (composioClient.isConfigured()) {
          try {
            const sdk = composioClient.getSDK();
            const res = await sdk.tools.execute('SLACK_POST_MESSAGE', {
              userId: 'default_user',
              arguments: {
                channel: params.channel,
                text: params.text,
              },
              dangerouslySkipVersionCheck: true,
            });
            return res;
          } catch (err: any) {
            console.error('Real Composio execute SLACK_SEND_MESSAGE failed:', err);
            throw new Error(`Real Composio Execution Failed: ${err?.message || String(err)}`);
          }
        }

        const conn = composioAuth.getConnection('slack');
        if (!conn?.connected) {
          throw new Error('Slack integration is NOT CONNECTED. Please connect your Slack bot token.');
        }
        return { success: true, ts: Date.now().toString(), mode: 'SIMULATION_MODE' };
      },
    });
  }

  public getAction(actionId: string): ComposioToolAction | undefined {
    return this.actions.get(actionId);
  }

  public getAllActions(): ComposioToolAction[] {
    return Array.from(this.actions.values());
  }

  public async executeTool(actionId: string, params: any = {}, userId: string = 'default_user'): Promise<any> {
    const registered = this.actions.get(actionId);
    if (registered) {
      return await registered.execute(params);
    }

    // Dynamic execution via Composio SDK for arbitrary action slugs
    if (composioClient.isConfigured()) {
      const sdk = composioClient.getSDK();
      const res = await sdk.tools.execute(actionId, {
        userId,
        arguments: params,
        dangerouslySkipVersionCheck: true,
      });
      return res;
    }

    throw new Error(`Tool action "${actionId}" is not recognized or requires COMPOSIO_API_KEY for dynamic execution.`);
  }
}

export const composioToolGateway = ComposioToolGateway.getInstance();

