import { toolGateway } from '../../tools/gateway.ts';
import { Eldorado } from '../../eldorado/eldorado.ts';
import { tracingSDK } from '../../observability/tracing.ts';

export class RepositoryEngineer {
  private toolGateway = toolGateway;
  private eldora: Eldorado;

  constructor() {
    this.eldora = new Eldorado();
  }

  async inspectRepository() {
    return {
      languages: ['TypeScript', 'JavaScript'],
      framework: 'Express + Mastra',
      deps: ['@mastra/core', 'zod', '@supabase/supabase-js'],
    };
  }

  async createDraftPR(params: any) {
    const span = tracingSDK.trace.getTracer('rufflo').startSpan('repository.createDraftPR');

    const branch = await this.eldora.createBranch({ objectiveId: params.objectiveId || 'default' });
    await this.eldora.commitArtifact({
      branch,
      path: 'evidence.json',
      content: JSON.stringify(params.evidencePack || params.evidence || [], null, 2),
      message: `Evidence for objective ${branch}`,
    });

    const pr = await this.toolGateway.createPullRequest({
      owner: 'your-org',
      repo: 'rufflo',
      head: branch,
      base: 'main',
      title: params.title,
      body: params.body,
      draft: true,
    });

    span.end();

    return { success: true, url: pr.url, number: pr.number, branch };
  }

  async createReviewComment(prNumber: number, comment: string) {
    return { success: true, commentId: `pr-${prNumber}-review-${Date.now()}` };
  }
}

export const repositoryEngineer = new RepositoryEngineer();
