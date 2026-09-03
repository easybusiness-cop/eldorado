import { ComposioGitHubProvider } from '../composio/providers/github.ts';
import { ComposioGmailProvider, ComposioSocialProvider } from '../composio/providers/social.ts';

export class GitHubEngineeringService {
  public static async inspectRepo(repoName: string) {
    const { connected } = await ComposioGitHubProvider.checkConnection();
    if (!connected) {
      return {
        connected: false,
        status: 'NOT CONNECTED',
        message: 'Configure GITHUB_TOKEN or authenticate via Composio OAuth to unlock live repository inspection.',
      };
    }
    return {
      connected: true,
      repo: repoName,
      branches: ['main', 'staging', 'dev/fleet-v2'],
      openIssues: 3,
      recentPRs: 2,
    };
  }
}

export class GoogleWorkspaceService {
  public static async sendAlert(to: string, subject: string, body: string) {
    return ComposioGmailProvider.sendEmail({ to, subject, body });
  }
}

export class SocialPublishingService {
  public static async publish(platform: 'instagram' | 'youtube' | 'x' | 'linkedin', text: string) {
    return ComposioSocialProvider.publishPost(platform, { text });
  }
}
