import { Octokit } from "@octokit/rest";

export class WorkflowService {
  private static getClient(): Octokit {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error("GitHub Actions is unavailable: GITHUB_TOKEN is not configured.");
    }
    return new Octokit({ auth: token, userAgent: "Rufflo-Autonomous-Engineer" });
  }

  private static parseRepository(repo: string): { owner: string; repo: string } {
    const [owner, name, ...extra] = repo.split("/");
    if (!owner || !name || extra.length > 0) {
      throw new Error('Repository must use the "owner/repo" format.');
    }
    return { owner, repo: name };
  }

  public static async monitorWorkflow(repo: string, runId: number) {
    if (!Number.isSafeInteger(runId) || runId <= 0) {
      throw new Error("GitHub workflow run ID must be a positive safe integer.");
    }
    const repository = this.parseRepository(repo);
    const client = this.getClient();
    const { data: run } = await client.rest.actions.getWorkflowRun({
      ...repository,
      run_id: runId,
    });
    const { data: jobs } = await client.rest.actions.listJobsForWorkflowRun({
      ...repository,
      run_id: runId,
    });

    return {
      repo,
      runId,
      status: run.status,
      conclusion: run.conclusion,
      jobs: jobs.jobs.map((job) => ({
        name: job.name,
        status: job.status,
        conclusion: job.conclusion,
      })),
      updatedAt: run.updated_at,
      mode: "REAL_RUNTIME" as const,
    };
  }

  public static async triggerWorkflow(repo: string, workflowId: string, ref = 'main') {
    if (!workflowId.trim() || !ref.trim()) {
      throw new Error("GitHub workflow ID and ref are required.");
    }
    const repository = this.parseRepository(repo);
    const client = this.getClient();
    await client.rest.actions.createWorkflowDispatch({
      ...repository,
      workflow_id: workflowId,
      ref,
    });

    return {
      success: true,
      repo,
      workflowId,
      ref,
      triggeredAt: new Date().toISOString(),
      mode: "REAL_RUNTIME" as const,
    };
  }
}
