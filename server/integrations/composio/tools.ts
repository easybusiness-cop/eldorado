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
}

export const composioToolGateway = ComposioToolGateway.getInstance();
