import { BaseAdapter, ToolExecutionContext } from "./base.adapter";

export class GitAdapter extends BaseAdapter {
  get provider(): string {
    return "github";
  }

  public async execute(context: ToolExecutionContext): Promise<any> {
    const start = Date.now();
    const correlationId = context.correlationId || `corr-${Date.now()}`;
    const { action, parameters } = context;

    try {
      const repoName = parameters.repository || "munderdifflin/company-os";
      
      await new Promise((resolve) => setTimeout(resolve, 140)); // Github Octokit latency simulation

      let data: any = {};

      switch (action) {
        case "list_repositories":
          data = {
            repositories: [
              { id: 101, name: "company-os", private: true, owner: "munderdifflin", default_branch: "main" },
              { id: 102, name: "infrastructure-iac", private: true, owner: "munderdifflin", default_branch: "master" },
              { id: 103, name: "financial-ledger", private: true, owner: "munderdifflin", default_branch: "main" }
            ],
            count: 3
          };
          break;

        case "create_branch":
          const branch = parameters.branchName || "feature/autonomous-worker";
          data = {
            ref: `refs/heads/${branch}`,
            node_id: `REF_MDM_${Math.floor(Math.random() * 100000)}`,
            url: `https://api.github.com/repos/${repoName}/git/refs/heads/${branch}`,
            object: {
              sha: "7d896a12c8b09312384a56c072d7f87a32d184a",
              type: "commit"
            }
          };
          break;

        case "create_pull_request":
          const title = parameters.title || "Feature PR";
          data = {
            id: Math.floor(Math.random() * 1000000),
            number: Math.floor(Math.random() * 400) + 12,
            state: "open",
            title,
            html_url: `https://github.com/${repoName}/pull/124`,
            user: { login: context.agentId || "agent-cli" },
            head: { ref: parameters.head || "feature/new" },
            base: { ref: parameters.base || "main" },
            draft: false,
            created_at: new Date().toISOString()
          };
          break;

        case "merge_pull_request":
          // Elevated and requires approval inside policy engine
          const prNum = parameters.pullRequestNumber || 124;
          data = {
            sha: "99aa8a12c8b09312384a56c072d7f87a32d2011",
            merged: true,
            message: `Pull Request #${prNum} successfully merged from autonomous worker pipeline.`,
            merged_by: "Munderdifflin Tool Gateway Controller"
          };
          break;

        case "create_commit":
          data = {
            sha: "7d896a12c8b09312384a56c072d7f87a32d184a",
            message: parameters.message || "Auto-commit patch from Agent Execution Loop.",
            author: { name: context.agentId, email: `${context.agentId}@munderdifflin.com` }
          };
          break;

        default:
          data = {
            status: "OK",
            repository: repoName,
            actionExecuted: action,
            parametersReceived: parameters
          };
      }

      return this.createResponse(true, action, data, null, Date.now() - start, correlationId, "MEDIUM");
    } catch (err: any) {
      return this.createResponse(false, action, null, err.message, Date.now() - start, correlationId, "MEDIUM");
    }
  }
}
