import { Router } from "express";
import { Octokit } from "@octokit/rest";
import { PullRequestService } from '../engineering/github/pull-request.service.ts';

export const githubRouter = Router();

function getOctokit() {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error(
      "GITHUB_TOKEN is not configured."
    );
  }

  return new Octokit({
    auth: token,
    userAgent: "Rufflo-Autonomous-Engineer",
  });
}

function validateRepositoryInput(
  owner: unknown,
  repo: unknown
) {
  if (
    typeof owner !== "string" ||
    !/^[A-Za-z0-9_.-]+$/.test(owner)
  ) {
    throw new Error("Invalid GitHub owner.");
  }

  if (
    typeof repo !== "string" ||
    !/^[A-Za-z0-9_.-]+$/.test(repo)
  ) {
    throw new Error("Invalid GitHub repository.");
  }
}

function validateBranchName(branch: string) {
  if (
    !branch ||
    branch.length > 200 ||
    branch.startsWith("-") ||
    branch.includes("..") ||
    branch.includes(" ")
  ) {
    throw new Error(
      "Invalid Git branch name."
    );
  }
}

/**
 * GET repositories available to the configured GitHub identity.
 */
githubRouter.get("/repos", async (_req, res) => {
  try {
    const octokit = getOctokit();

    const response =
      await octokit.rest.repos.listForAuthenticatedUser({
        sort: "updated",
        per_page: 50,
      });

    return res.json({
      success: true,
      repos: response.data.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner.login,
        private: repo.private,
        defaultBranch:
          repo.default_branch,
        permissions: repo.permissions,
      })),
    });
  } catch (error) {
    console.error(
      "[GitHub] Repository listing failed:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

/**
 * Read repository content.
 */
githubRouter.post("/pull", async (req, res) => {
  try {
    const {
      owner,
      repo,
      path = "",
      branch,
    } = req.body ?? {};

    validateRepositoryInput(
      owner,
      repo
    );

    if (
      typeof path !== "string" ||
      path.startsWith("/")
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid repository path.",
      });
    }

    const octokit = getOctokit();

    const response =
      await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ...(branch
          ? { ref: branch }
          : {}),
      });

    return res.json({
      success: true,
      content: response.data,
    });
  } catch (error) {
    console.error(
      "[GitHub] Pull failed:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

/**
 * Create a branch from an existing branch.
 *
 * This is the first operation Rufflo should perform
 * before changing a GitHub repository.
 */
githubRouter.post(
  "/branches",
  async (req, res) => {
    try {
      const {
        owner,
        repo,
        branch,
        fromBranch = "main",
      } = req.body ?? {};

      validateRepositoryInput(
        owner,
        repo
      );

      if (
        typeof branch !== "string" ||
        typeof fromBranch !== "string"
      ) {
        return res.status(400).json({
          success: false,
          error:
            "branch and fromBranch are required.",
        });
      }

      validateBranchName(branch);
      validateBranchName(fromBranch);

      if (branch === "main" ||
          branch === "master") {
        return res.status(400).json({
          success: false,
          error:
            "Rufflo cannot create an autonomous working branch named main/master.",
        });
      }

      const octokit = getOctokit();

      const source =
        await octokit.rest.repos.getBranch({
          owner,
          repo,
          branch: fromBranch,
        });

      const created =
        await octokit.rest.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${branch}`,
          sha: source.data.commit.sha,
        });

      return res.status(201).json({
        success: true,
        branch,
        fromBranch,
        sha:
          source.data.commit.sha,
        ref: created.data.ref,
      });
    } catch (error) {
      console.error(
        "[GitHub] Branch creation failed:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }
);

/**
 * Push/update one file.
 *
 * IMPORTANT:
 * Direct writes to main/master are prohibited.
 */
githubRouter.post("/push", async (req, res) => {
  try {
    const {
      owner,
      repo,
      path,
      message,
      content,
      branch,
    } = req.body ?? {};

    validateRepositoryInput(
      owner,
      repo
    );

    if (
      typeof path !== "string" ||
      typeof message !== "string" ||
      typeof content !== "string" ||
      typeof branch !== "string"
    ) {
      return res.status(400).json({
        success: false,
        error:
          "owner, repo, path, message, content and branch are required.",
      });
    }

    validateBranchName(branch);

    if (
      branch === "main" ||
      branch === "master"
    ) {
      return res.status(403).json({
        success: false,
        error:
          "Direct autonomous pushes to main/master are prohibited.",
      });
    }

    if (
      path.startsWith("/") ||
      path.includes("..")
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Unsafe repository path.",
      });
    }

    if (
      path === ".env" ||
      path.endsWith("/.env") ||
      path.includes(".env.")
    ) {
      return res.status(403).json({
        success: false,
        error:
          "Rufflo cannot write environment-secret files.",
      });
    }

    const octokit = getOctokit();

    let sha: string | undefined;

    try {
      const existing =
        await octokit.rest.repos.getContent({
          owner,
          repo,
          path,
          ref: branch,
        });

      if (
        !Array.isArray(existing.data) &&
        "sha" in existing.data
      ) {
        sha = existing.data.sha;
      }
    } catch {
      // New file.
    }

    const response =
      await octokit.rest.repos.createOrUpdateFileContents(
        {
          owner,
          repo,
          path,
          message,
          content:
            Buffer.from(
              content,
              "utf8"
            ).toString("base64"),
          sha,
          branch,
        }
      );

    return res.json({
      success: true,
      branch,
      path,
      commit: {
        sha:
          response.data.commit.sha,
        url:
          response.data.commit.html_url,
      },
    });
  } catch (error) {
    console.error(
      "[GitHub] Push failed:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

/**
 * List pull requests.
 */
githubRouter.get("/prs", async (req, res) => {
  try {
    const {
      owner,
      repo,
      state = "open",
    } =
      req.query as Record<
        string,
        string
      >;

    validateRepositoryInput(
      owner,
      repo
    );

    if (
      !["open", "closed", "all"].includes(
        state
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          "state must be open, closed or all.",
      });
    }

    const octokit = getOctokit();

    const response =
      await octokit.rest.pulls.list({
        owner,
        repo,
        state:
          state as
            | "open"
            | "closed"
            | "all",
        per_page: 50,
      });

    return res.json({
      success: true,
      pulls: response.data,
    });
  } catch (error) {
    console.error(
      "[GitHub] PR listing failed:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

/**
 * Create a pull request.
 *
 * Rufflo is allowed to create a PR,
 * but not merge it automatically.
 */
githubRouter.post("/pr", async (req, res) => {
  try {
    const {
      owner,
      repo,
      title,
      head,
      base = "main",
      body = "",
    } = req.body ?? {};

    validateRepositoryInput(
      owner,
      repo
    );

    if (
      typeof title !== "string" ||
      typeof head !== "string" ||
      typeof base !== "string"
    ) {
      return res.status(400).json({
        success: false,
        error:
          "owner, repo, title, head and base are required.",
      });
    }

    validateBranchName(head);
    validateBranchName(base);

    if (
      head === "main" ||
      head === "master"
    ) {
      return res.status(403).json({
        success: false,
        error:
          "PR head cannot be main/master.",
      });
    }

    const octokit = getOctokit();

    const response =
      await octokit.rest.pulls.create({
        owner,
        repo,
        title: title.slice(0, 250),
        head,
        base,
        body: body.slice(0, 20_000),
      });

    return res.status(201).json({
      success: true,
      pullRequest: {
        number:
          response.data.number,
        url:
          response.data.html_url,
        title:
          response.data.title,
        head:
          response.data.head.ref,
        base:
          response.data.base.ref,
      },
    });
  } catch (error) {
    console.error(
      "[GitHub] PR creation failed:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

/**
 * GET status of a specific pull request for Command Center.
 */
githubRouter.get("/pulls/:number", async (req, res) => {
  const { number } = req.params;
  const prNum = parseInt(number, 10);
  if (isNaN(prNum)) {
    return res.status(400).json({
      success: false,
      error: "Invalid pull request number.",
    });
  }

  // Determine owner and repo
  let owner = (req.query.owner as string) || "";
  let repo = (req.query.repo as string) || "";

  if (!owner || !repo) {
    const fullRepo = process.env.GITHUB_REPO || "munderdifflin/company-os";
    const [envOwner, envRepo] = fullRepo.split("/");
    owner = owner || envOwner || "munderdifflin";
    repo = repo || envRepo || "company-os";
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      // Fallback/Simulation mode when no GITHUB_TOKEN is present
      return res.json({
        success: true,
        mode: "SIMULATION",
        pullRequest: {
          number: prNum,
          state: "open",
          title: `🤖 Rufflo [Draft]: Autonomous Feature implementation`,
          url: `https://github.com/${owner}/${repo}/pull/${prNum}`,
          user: "rufflo-coder",
          merged: false,
          mergeable: true,
          draft: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      });
    }

    const octokit = new Octokit({
      auth: token,
      userAgent: "Rufflo-Autonomous-Engineer",
    });

    const response = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNum,
    });

    return res.json({
      success: true,
      mode: "REAL_RUNTIME",
      pullRequest: {
        number: response.data.number,
        state: response.data.state,
        title: response.data.title,
        url: response.data.html_url,
        user: response.data.user?.login,
        merged: response.data.merged,
        mergeable: response.data.mergeable,
        draft: response.data.draft,
        createdAt: response.data.created_at,
        updatedAt: response.data.updated_at,
      }
    });
  } catch (error) {
    console.error("[GitHub] Pull request fetch failed:", error);
    // If real fetching fails (e.g. rate limit, bad token or invalid repo), return simulation fallback with clear flag
    return res.json({
      success: true,
      mode: "SIMULATION",
      error: error instanceof Error ? error.message : String(error),
      pullRequest: {
        number: prNum,
        state: "open",
        title: `🤖 Rufflo [Draft]: Autonomous Feature implementation`,
        url: `https://github.com/${owner}/${repo}/pull/${prNum}`,
        user: "rufflo-coder",
        merged: false,
        mergeable: true,
        draft: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    });
  }
});

/**
 * Merge a pull request — Strictly routed through ApprovalService.
 */
githubRouter.post("/pulls/:number/merge", async (req, res) => {
  const { number } = req.params;
  const prNum = parseInt(number, 10);
  if (isNaN(prNum)) {
    return res.status(400).json({
      success: false,
      error: "Invalid pull request number.",
    });
  }

  let owner = (req.body?.owner as string) || (req.query.owner as string) || "";
  let repo = (req.body?.repo as string) || (req.query.repo as string) || "";

  if (!owner || !repo) {
    const fullRepo = process.env.GITHUB_REPO || "munderdifflin/company-os";
    const [envOwner, envRepo] = fullRepo.split("/");
    owner = owner || envOwner || "munderdifflin";
    repo = repo || envRepo || "company-os";
  }

  const fullRepoName = `${owner}/${repo}`;
  const commitTitle = req.body?.commitTitle;
  const commitMessage = req.body?.commitMessage;
  const requestedBy = req.body?.requestedBy || "rufflo-ui";

  const mergeResult = await PullRequestService.mergePR(fullRepoName, prNum, {
    commitTitle,
    commitMessage,
    requestedBy,
  });

  return res.status(202).json(mergeResult);
});


