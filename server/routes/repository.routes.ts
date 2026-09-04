import { Router } from "express";
import { repositoryInspector } from "../knowledge/repository-inspector.ts";
import { repositoryEngineer } from "../agents/repository/repository-engineer.ts";

export const repositoryRouter = Router();

// POST /api/repository/inspect - Inspect repository architecture
repositoryRouter.post("/inspect", (req, res) => {
  try {
    const workspace = req.body.workspace || process.cwd();
    const structure = repositoryInspector.inspect(workspace);
    return res.json({ success: true, workspace, structure });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/repository/diff - Get current repository diff review
repositoryRouter.get("/diff", (req, res) => {
  try {
    const workspace = (req.query.workspace as string) || process.cwd();
    const diff = repositoryInspector.getDiff(workspace);
    return res.json({ success: true, workspace, diff });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/repository/develop - Develop repository feature autonomously
repositoryRouter.post("/develop", async (req, res) => {
  try {
    const {
      agentId,
      organizationId,
      objective,
      workspace,
      branchName,
      githubRepo,
      maxAttempts,
      timeoutMs,
    } = req.body;

    if (!agentId || !organizationId || !objective) {
      return res.status(400).json({
        success: false,
        error: "agentId, organizationId, and objective are required.",
      });
    }

    const result = await repositoryEngineer.develop({
      id: `repo-task-${Date.now()}`,
      agentId,
      organizationId,
      objective,
      workspace: workspace || process.cwd(),
      branchName,
      githubRepo,
      maxAttempts,
      timeoutMs,
    });

    return res.status(result.success ? 200 : 422).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default repositoryRouter;
