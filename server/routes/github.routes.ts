import { Router } from "express";
import { Octokit } from "@octokit/rest";

export const githubRouter = Router();

function getOctokit() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN is not set in environment variables");
  }
  return new Octokit({ auth: token });
}

githubRouter.get("/repos", async (req, res) => {
  try {
    const octokit = getOctokit();
    const response = await octokit.rest.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 20,
    });
    res.json({ success: true, repos: response.data });
  } catch (err: any) {
    console.error("GitHub fetch repos error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

githubRouter.post("/pull", async (req, res) => {
  try {
    const { owner, repo, path = "" } = req.body;
    const octokit = getOctokit();
    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    });
    res.json({ success: true, content: response.data });
  } catch (err: any) {
    console.error("GitHub pull error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

githubRouter.post("/push", async (req, res) => {
  try {
    const { owner, repo, path, message, content, branch = "main" } = req.body;
    const octokit = getOctokit();

    // Check if file exists to get the SHA
    let sha: string | undefined = undefined;
    try {
      const getFile = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });
      if (!Array.isArray(getFile.data) && "sha" in getFile.data) {
        sha = getFile.data.sha;
      }
    } catch (e) {
      // File probably doesn't exist, which is fine for a new file
    }

    const response = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString("base64"),
      sha,
      branch,
    });

    res.json({ success: true, commit: response.data.commit });
  } catch (err: any) {
    console.error("GitHub push error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

githubRouter.get("/prs", async (req, res) => {
  try {
    const { owner, repo, state = "open" } = req.query as Record<string, string>;
    if (!owner || !repo) {
      return res.status(400).json({ success: false, error: "owner and repo parameters are required" });
    }
    const octokit = getOctokit();
    const response = await octokit.rest.pulls.list({
      owner,
      repo,
      state: state as "open" | "closed" | "all",
      per_page: 20,
    });
    res.json({ success: true, pulls: response.data });
  } catch (err: any) {
    console.error("GitHub list PRs error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

githubRouter.post("/pr", async (req, res) => {
  try {
    const { owner, repo, title, head, base = "main", body = "" } = req.body;
    if (!owner || !repo || !title || !head) {
      return res.status(400).json({ success: false, error: "owner, repo, title, and head are required" });
    }
    const octokit = getOctokit();
    const response = await octokit.rest.pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body,
    });
    res.json({ success: true, pullRequest: response.data });
  } catch (err: any) {
    console.error("GitHub create PR error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
