import { composioAuth } from '../auth.ts';
import { composioClient } from '../client.ts';
import { Octokit } from '@octokit/rest';

export class ComposioGitHubProvider {
  public static async checkConnection(): Promise<{ connected: boolean; username?: string }> {
    if (composioClient.isConfigured()) {
      try {
        const sdk = composioClient.getSDK();
        const response = await sdk.connectedAccounts.list();
        const githubAccount = response.items.find(item => item.toolkit.slug === 'github');
        if (githubAccount && githubAccount.status === 'ACTIVE') {
          composioAuth.setConnectionStatus('github', { connected: true, accountEmailOrHandle: githubAccount.alias || 'connected' });
          return { connected: true, username: githubAccount.alias || 'connected' };
        }
      } catch (err) {
        throw new Error(`GitHub Composio connection check failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const token = process.env.GITHUB_TOKEN;
    if (token) {
      try {
        const { data } = await new Octokit({ auth: token }).rest.users.getAuthenticated();
        composioAuth.setConnectionStatus('github', { connected: true, accountEmailOrHandle: data.login });
        return { connected: true, username: data.login };
      } catch (err) {
        composioAuth.setConnectionStatus('github', { connected: false, accountEmailOrHandle: undefined });
        throw new Error(`GitHub token validation failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    composioAuth.setConnectionStatus('github', { connected: false, accountEmailOrHandle: undefined });
    return { connected: false };
  }

  public static async createPullRequest(params: {
    repo: string;
    title: string;
    head: string;
    base: string;
    body: string;
  }) {
    if (composioClient.isConfigured()) {
      try {
        const sdk = composioClient.getSDK();
        const [owner, repo] = params.repo.includes('/') ? params.repo.split('/') : ['owner', params.repo];
        const res = await sdk.tools.execute('GITHUB_CREATE_PULL_REQUEST', {
          userId: 'default_user',
          arguments: {
            owner,
            repo,
            title: params.title,
            head: params.head,
            base: params.base,
            body: params.body,
          },
          dangerouslySkipVersionCheck: true,
        });
        return res;
      } catch (err: any) {
        console.error('Real Composio execute GITHUB_CREATE_PULL_REQUEST failed:', err);
        throw new Error(`Real Composio Execution Failed: ${err?.message || String(err)}`);
      }
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GitHub pull request creation is unavailable: configure Composio or GITHUB_TOKEN.');
    }

    const [owner, repo, ...extra] = params.repo.split('/');
    if (!owner || !repo || extra.length > 0) {
      throw new Error('GitHub repository must use the "owner/repo" format.');
    }

    const { data } = await new Octokit({ auth: token }).rest.pulls.create({
      owner,
      repo,
      title: params.title,
      head: params.head,
      base: params.base,
      body: params.body,
    });

    return {
      success: true,
      prNumber: data.number,
      url: data.html_url,
      title: data.title,
      state: data.state,
    };
  }
}
