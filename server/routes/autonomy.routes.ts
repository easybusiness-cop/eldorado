import { Router } from "express";
import { AutonomousEngineer } from "../agents/autonomy/autonomous-engineer.ts";
import { MasterTrainer } from "../training/master/master-trainer.ts";
import { IngestionPipeline } from "../knowledge/ingestion/ingestion-pipeline.ts";
import { capabilityEngine } from "../core/capabilities/capability.engine.ts";
import { failureMemory } from "../core/learning/failure-memory.ts";
import { skillMemory } from "../core/learning/skill-memory.ts";

export const autonomyRouter = Router();

const engineer = new AutonomousEngineer();
const trainer = new MasterTrainer();
const ingestionPipeline = new IngestionPipeline();

// POST /api/autonomy/tasks - Solve task autonomously
autonomyRouter.post("/autonomy/tasks", async (req, res) => {
  try {
    const { organizationId, agentId, objective, requiredCapabilities } = req.body;

    if (!organizationId || !agentId || !objective) {
      return res.status(400).json({
        error: "organizationId, agentId and objective are required.",
      });
    }

    const result = await engineer.solve({
      id: `task-${Date.now()}`,
      organizationId,
      agentId,
      objective,
      priority: 5,
      maxAttempts: 8,
      timeoutMs: 120_000,
      requiredCapabilities,
      createdAt: new Date().toISOString(),
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/autonomy/train - Train an agent
autonomyRouter.post("/autonomy/train", async (req, res) => {
  try {
    const { agentId } = req.body;
    if (!agentId) {
      return res.status(400).json({ error: "agentId is required." });
    }

    const result = await trainer.train(agentId);
    return res.json({ success: true, training: result });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/autonomy/ingest-repo - Ingest repository knowledge
autonomyRouter.post("/autonomy/ingest-repo", async (req, res) => {
  try {
    const { repository } = req.body;
    if (!repository) {
      return res.status(400).json({ error: "repository URL is required." });
    }

    const knowledge = await ingestionPipeline.ingest(repository);
    return res.json({ success: true, knowledge });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/autonomy/profile/:agentId - Get agent capability profile
autonomyRouter.get("/autonomy/profile/:agentId", (req, res) => {
  try {
    const { agentId } = req.params;
    const profile = capabilityEngine.get(agentId);
    const weaknesses = capabilityEngine.weaknesses(agentId);
    return res.json({ success: true, profile, weaknesses });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/autonomy/failures - Search or retrieve failure memories
autonomyRouter.get("/autonomy/failures", (req, res) => {
  try {
    const query = (req.query.q as string) || "";
    const agentId = req.query.agentId as string;

    let records;
    if (agentId) {
      records = failureMemory.getForAgent(agentId);
    } else if (query) {
      records = failureMemory.search(query);
    } else {
      records = failureMemory.search("");
    }

    return res.json({ success: true, records });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/autonomy/skills - List learned skills
autonomyRouter.get("/autonomy/skills", (req, res) => {
  try {
    const query = (req.query.q as string) || "";
    const skills = query ? skillMemory.search(query) : skillMemory.all();
    return res.json({ success: true, skills });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
