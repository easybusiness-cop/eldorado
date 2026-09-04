import { Router } from "express";
import { objectiveManager } from "../objectives/objective.manager.ts";
import { objectiveDB } from "../objectives/objective.db.ts";

export const objectivesRouter = Router();

// POST /api/objectives - Create a new objective
objectivesRouter.post("/objectives", async (req, res) => {
  try {
    const { goal, constraints, successCriteria, maxRecoveryAttempts, maxWallTimeMs } = req.body;
    if (!goal) {
      return res.status(400).json({ success: false, error: "Goal is required." });
    }

    const objective = await objectiveManager.createObjective({
      goal,
      constraints: constraints || [],
      successCriteria: successCriteria || [],
      maxRecoveryAttempts: maxRecoveryAttempts !== undefined ? Number(maxRecoveryAttempts) : undefined,
      maxWallTimeMs: maxWallTimeMs !== undefined ? Number(maxWallTimeMs) : undefined,
    });

    const dbInfo = objectiveDB.getPersistenceInfo();

    return res.json({
      success: true,
      objective,
      persistence: dbInfo,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || String(error),
    });
  }
});

// GET /api/objectives - List all objectives
objectivesRouter.get("/objectives", async (req, res) => {
  try {
    const list = await objectiveManager.listObjectives();
    const dbInfo = objectiveDB.getPersistenceInfo();
    return res.json({
      success: true,
      objectives: list,
      persistence: dbInfo,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || String(error),
    });
  }
});

// GET /api/objectives/:id - Get objective by ID
objectivesRouter.get("/objectives/:id", async (req, res) => {
  try {
    const objective = await objectiveManager.getObjective(req.params.id);
    if (!objective) {
      return res.status(404).json({ success: false, error: "Objective not found." });
    }
    const dbInfo = objectiveDB.getPersistenceInfo();
    return res.json({
      success: true,
      objective,
      persistence: dbInfo,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || String(error),
    });
  }
});

// POST /api/objectives/:id/run - Run/Resume the objective loop
objectivesRouter.post("/objectives/:id/run", async (req, res) => {
  try {
    const objective = await objectiveManager.runObjective(req.params.id);
    const dbInfo = objectiveDB.getPersistenceInfo();
    return res.json({
      success: true,
      objective,
      persistence: dbInfo,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || String(error),
    });
  }
});

// GET /api/objectives/:id/evidence - Retrieve evidence for an objective (Returns FULL PACK)
objectivesRouter.get("/objectives/:id/evidence", async (req, res) => {
  try {
    const objective = await objectiveManager.getObjective(req.params.id);
    if (!objective) {
      return res.status(404).json({ success: false, error: "Objective not found." });
    }

    // Return full pack as requested: plan, step results, stdout/stderr, evaluation scores, recoveryAttempts, status.
    const plan = objective.steps.map((step) => ({
      id: step.id,
      name: step.name,
      type: step.type,
      command: step.command,
      expected: step.expected,
    }));

    const stepResults = objective.steps.map((step) => ({
      id: step.id,
      name: step.name,
      status: step.status,
      exitCode: step.exitCode,
      durationMs: step.durationMs,
      error: step.error,
    }));

    const stdout = objective.steps.map((step) => step.stdout || "").join("\n");
    const stderr = objective.steps.map((step) => step.stderr || "").join("\n");

    const evaluationScores = objective.steps.map((step) => ({
      stepId: step.id,
      stepName: step.name,
      scores: step.evaluationScores || { correctness: 0, reliability: 0, security: 0, performance: 0 },
    }));

    const dbInfo = objectiveDB.getPersistenceInfo();

    return res.json({
      success: true,
      plan,
      stepResults,
      stdout,
      stderr,
      evaluationScores,
      recoveryAttempts: objective.recoveryAttempts,
      status: objective.status,
      evidence: objective.evidence,
      failures: objective.failures,
      persistence: dbInfo,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || String(error),
    });
  }
});
