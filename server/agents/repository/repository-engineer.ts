import {
  Octokit,
} from "@octokit/rest";

import {
  repositoryInspector,
  type RepoStructure,
  type DiffReview,
} from "../../knowledge/repository-inspector.ts";

import {
  autonomousLifecycle,
  type AutonomousDevelopmentResult,
} from "../../core/autonomy/autonomous-lifecycle.ts";

export interface RepositoryTask {
  id: string;
  agentId: string;
  organizationId: string;
  workspace: string;
  objective: string;

  branchName?: string;

  githubRepo?: {
    owner: string;
    repo: string;
    baseBranch?: string;
  };

  maxAttempts?: number;
  timeoutMs?: number;
}

export interface RepositoryFeatureResult {
  taskId: string;
  success: boolean;

  structure: RepoStructure;

  development:
    AutonomousDevelopmentResult;

  diff: DiffReview;

  branchName?: string;
  commitSha?: string;
  pullRequestUrl?: string;

  summary: string;
}

function getOctokit() {
  const token =
    process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error(
      "GITHUB_TOKEN is not configured."
    );
  }

  return new Octokit({
    auth: token,
    userAgent:
      "Rufflo-Autonomous-Engineer",
  });
}

function validateBranchName(
  branch: string
) {
  if (
    !branch ||
    branch === "main" ||
    branch === "master" ||
    branch.includes("..") ||
    branch.includes(" ")
  ) {
    throw new Error(
      "Unsafe autonomous branch name."
    );
  }
}

export class RepositoryEngineer {
  async develop(
    task: RepositoryTask
  ): Promise<RepositoryFeatureResult> {
    const workspace =
      task.workspace ||
      process.cwd();

    const baseBranch =
      task.githubRepo?.baseBranch ||
      "main";

    const branchName =
      task.branchName ||
      `rufflo/task-${task.id}-${Date.now()}`;

    validateBranchName(
      branchName
    );

    /*
     * ----------------------------------------------------
     * 1. INSPECT
     * ----------------------------------------------------
     */
    const structure =
      repositoryInspector.inspect(
        workspace
      );

    /*
     * ----------------------------------------------------
     * 2. LOCAL AUTONOMOUS DEVELOPMENT
     * ----------------------------------------------------
     */
    const development =
      await autonomousLifecycle.run({
        id: task.id,
        agentId:
          task.agentId,
        organizationId:
          task.organizationId,
        objective:
          task.objective,
        workspace,
        maxAttempts:
          task.maxAttempts ?? 5,
        timeoutMs:
          task.timeoutMs ?? 180_000,
        requiredCapability:
          "repository-engineering",
      });

    /*
     * ----------------------------------------------------
     * 3. ALWAYS INSPECT RESULTING DIFF
     * ----------------------------------------------------
     */
    const diff =
      repositoryInspector.getDiff(
        workspace
      );

    /*
     * Do not touch GitHub if development failed.
     */
    if (!development.success) {
      return {
        taskId: task.id,
        success: false,
        structure,
        development,
        diff,
        branchName,
        summary:
          `Development failed: ${
            development.failure ??
            "Unknown failure"
          }`,
      };
    }

    /*
     * Do not create a PR when security review
     * reports warnings.
     */
    if (
      diff.securityWarnings.length >
      0
    ) {
      return {
        taskId: task.id,
        success: false,
        structure,
        development,
        diff,
        branchName,
        summary:
          "Development completed, but GitHub publication was blocked because the diff contains security warnings.",
      };
    }

    /*
     * ----------------------------------------------------
     * 4. GITHUB PUBLICATION
     * ----------------------------------------------------
     */
    let pullRequestUrl:
      | string
      | undefined;

    let commitSha:
      | string
      | undefined;

    if (
      task.githubRepo &&
      process.env.GITHUB_TOKEN
    ) {
      const octokit =
        getOctokit();

      const {
        owner,
        repo,
      } = task.githubRepo;

      /*
       * ------------------------------------------------
       * 4A. Get base branch
       * ------------------------------------------------
       */
      const base =
        await octokit.rest.repos.getBranch(
          {
            owner,
            repo,
            branch:
              baseBranch,
          }
        );

      /*
       * ------------------------------------------------
       * 4B. Create isolated working branch
       * ------------------------------------------------
       */
      await octokit.rest.git.createRef({
        owner,
        repo,
        ref:
          `refs/heads/${branchName}`,
        sha:
          base.data.commit.sha,
      });

      /*
       * ------------------------------------------------
       * 4C. Commit diff files
       *
       * We deliberately use GitHub's contents API here
       * rather than allowing arbitrary shell git push.
       * ------------------------------------------------
       */
      for (
        const file of diff.files
      ) {
        /*
         * Only process files that the inspector
         * identifies as changed.
         */
        if (
          !file.file ||
          file.file.startsWith("/") ||
          file.file.includes("..")
        ) {
          throw new Error(
            `Unsafe changed file path: ${file.file}`
          );
        }

        if (
          file.file === ".env" ||
          file.file.includes(
            ".env."
          )
        ) {
          throw new Error(
            `Secret file publication blocked: ${file.file}`
          );
        }

        const fs =
          await import(
            "node:fs/promises"
          );

        const content =
          await fs.readFile(
            `${workspace}/${file.file}`,
            "utf8"
          );

        let sha:
          | string
          | undefined;

        try {
          const existing =
            await octokit.rest.repos.getContent(
              {
                owner,
                repo,
                path:
                  file.file,
                ref:
                  branchName,
              }
            );

          if (
            !Array.isArray(
              existing.data
            ) &&
            "sha" in existing.data
          ) {
            sha =
              existing.data.sha;
          }
        } catch {
          // New file.
        }

        const commit =
          await octokit.rest.repos.createOrUpdateFileContents(
            {
              owner,
              repo,
              path:
                file.file,
              message:
                `feat(rufflo): ${task.objective.slice(
                  0,
                  100
                )}`,
              content:
                Buffer.from(
                  content,
                  "utf8"
                ).toString(
                  "base64"
                ),
              branch:
                branchName,
              sha,
            }
          );

        commitSha =
          commit.data.commit.sha;
      }

      /*
       * ------------------------------------------------
       * 4D. Create PR
       * ------------------------------------------------
       */
      const pr =
        await octokit.rest.pulls.create(
          {
            owner,
            repo,
            title:
              `🤖 Rufflo: ${task.objective.slice(
                0,
                180
              )}`,
            head:
              branchName,
            base:
              baseBranch,
            body:
              [
                "## Rufflo Autonomous Engineering",
                "",
                `### Objective`,
                task.objective,
                "",
                `### Development`,
                `- Status: ${development.stage}`,
                `- Attempts: ${development.attempts}`,
                "",
                `### Verification`,
                `- Autonomous development: PASS`,
                `- Security diff review: PASS`,
                `- Branch isolation: PASS`,
                "",
                `### Diff`,
                diff.summary,
                "",
                "This PR was created by Rufflo's autonomous engineering pipeline.",
              ].join("\n"),
          }
        );

      pullRequestUrl =
        pr.data.html_url;
    }

    /*
     * ----------------------------------------------------
     * 5. FINAL RESULT
     * ----------------------------------------------------
     */
    return {
      taskId: task.id,
      success: development.success,
      structure,
      development,
      diff,
      branchName,
      commitSha,
      pullRequestUrl,
      summary:
        task.githubRepo
          ? `Autonomous development completed and published to branch ${branchName}.`
          : `Autonomous development completed locally in ${diff.files.length} changed files.`,
    };
  }
}

export const repositoryEngineer =
  new RepositoryEngineer();
