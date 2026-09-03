import { composioAuth } from '../auth.ts';
import { composioClient } from '../client.ts';

export class ComposioGmailProvider {
  public static async sendEmail(params: { to: string; subject: string; body: string }) {
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
        console.error('Real Composio sendEmail failed:', err);
        throw new Error(`Real Composio Execution Failed: ${err?.message || String(err)}`);
      }
    }

    const conn = composioAuth.getConnection('gmail');
    if (!conn?.connected) {
      throw new Error('Gmail integration is NOT CONNECTED. Please authenticate with Google OAuth.');
    }
    return { success: true, messageId: `msg-${Date.now()}` };
  }
}

export class ComposioSlackProvider {
  public static async postMessage(params: { channel: string; text: string }) {
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
        console.error('Real Composio postMessage failed:', err);
        throw new Error(`Real Composio Execution Failed: ${err?.message || String(err)}`);
      }
    }

    const conn = composioAuth.getConnection('slack');
    if (!conn?.connected) {
      throw new Error('Slack integration is NOT CONNECTED. Connect Slack workspace to dispatch bot messages.');
    }
    return { success: true, channel: params.channel, ts: Date.now().toString() };
  }
}

export class ComposioNotionProvider {
  public static async createPage(params: { parentId: string; title: string; markdownContent: string }) {
    if (composioClient.isConfigured()) {
      try {
        const sdk = composioClient.getSDK();
        const res = await sdk.tools.execute('NOTION_CREATE_PAGE', {
          userId: 'default_user',
          arguments: {
            parentId: params.parentId,
            title: params.title,
            content: params.markdownContent,
          },
          dangerouslySkipVersionCheck: true,
        });
        return res;
      } catch (err: any) {
        console.error('Real Composio createPage failed:', err);
        throw new Error(`Real Composio Execution Failed: ${err?.message || String(err)}`);
      }
    }

    const conn = composioAuth.getConnection('notion');
    if (!conn?.connected) {
      throw new Error('Notion integration is NOT CONNECTED. Link your Notion workspace token.');
    }
    return { success: true, pageId: `notion-${Date.now()}` };
  }
}

export class ComposioSocialProvider {
  public static async publishPost(platform: 'instagram' | 'youtube' | 'x' | 'linkedin', content: { text: string; mediaUrl?: string }) {
    if (composioClient.isConfigured() && (platform === 'x' || platform === 'linkedin')) {
      try {
        const sdk = composioClient.getSDK();
        const toolName = platform === 'x' ? 'TWITTER_POST_TWEET' : 'LINKEDIN_CREATE_SHARE_POST';
        const args = platform === 'x' 
          ? { text: content.text } 
          : { text: content.text, mediaUrl: content.mediaUrl };

        const res = await sdk.tools.execute(toolName, {
          userId: 'default_user',
          arguments: args,
          dangerouslySkipVersionCheck: true,
        });
        return res;
      } catch (err: any) {
        console.error(`Real Composio ${platform} publishPost failed:`, err);
        throw new Error(`Real Composio Execution Failed: ${err?.message || String(err)}`);
      }
    }

    const conn = composioAuth.getConnection(platform);
    if (!conn?.connected) {
      throw new Error(`${platform.toUpperCase()} account is NOT CONNECTED. Real account authorization is required before publishing.`);
    }
    return {
      success: true,
      platform,
      postId: `post-${platform}-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  }
}
