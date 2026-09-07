import { Router } from "express";
import { AutonomousEngineer } from "../agents/autonomy/autonomous-engineer.ts";
import { MasterTrainer } from "../training/master/master-trainer.ts";
import { IngestionPipeline } from "../knowledge/ingestion/ingestion-pipeline.ts";
import { capabilityEngine } from "../core/capabilities/capability.engine.ts";
import { failureMemory } from "../core/learning/failure-memory.ts";
import { skillMemory } from "../core/learning/skill-memory.ts";
import { autonomousLifecycle } from "../core/autonomy/autonomous-lifecycle.ts";

import { mastraAgentRegistry } from "../ai/mastra/agents/index.ts";
import { employeeFactory } from "../ai/company/workforce/employee.factory.ts";
import { workforceManager } from "../ai/company/workforce/workforce.manager.ts";
import { roleRegistry } from "../ai/company/workforce/role.registry.ts";
import { discoveryEngine } from "../ai/company/knowledge/discovery.engine.ts";
import { researchManager } from "../ai/company/knowledge/research.manager.ts";
import { knowledgeManager } from "../ai/company/knowledge/knowledge.manager.ts";
import { technologyScanner } from "../ai/company/knowledge/technology.scanner.ts";
import { corporateCascadeEngine } from "../core/autonomy/corporate-cascade.engine.ts";

export const autonomyRouter = Router();

const engineer = new AutonomousEngineer();
const trainer = new MasterTrainer();
const ingestionPipeline = new IngestionPipeline();

// POST /api/autonomy/develop or /api/develop - Autonomous development loop
const developHandler = async (req: any, res: any) => {
  try {
    const {
      agentId,
      objective,
      workspace,
      maxAttempts,
      timeoutMs,
      requiredCapability,
    } = req.body;

    const organizationId = req.identity?.organizationId || req.body.organizationId;

    if (!agentId || !organizationId || !objective || !workspace) {
      return res.status(400).json({
        success: false,
        error:
          "agentId, organizationId, objective and workspace are required.",
      });
    }

    const result = await autonomousLifecycle.run({
      agentId,
      organizationId,
      objective,
      workspace,
      maxAttempts,
      timeoutMs,
      requiredCapability,
    });

    return res.status(result.success ? 200 : 422).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    return res.status(500).json({
      success: false,
      error: message,
    });
  }
};

autonomyRouter.post("/autonomy/develop", developHandler);
autonomyRouter.post("/develop", developHandler);

// POST /api/autonomy/tasks - Solve task autonomously
autonomyRouter.post("/autonomy/tasks", async (req, res) => {
  try {
    const { agentId, objective, requiredCapabilities } = req.body;
    const organizationId = (req as any).identity?.organizationId || req.body.organizationId;

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

/* ====================================================================== */
/* VIRTUAL WORKFORCE                                                      */
/* ====================================================================== */

// GET /api/autonomy/workforce/roles - Get all pre-defined roles
autonomyRouter.get("/autonomy/workforce/roles", (_req, res) => {
  try {
    const roles = roleRegistry.getAllRoles();
    return res.json({ success: true, roles });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/autonomy/workforce/agents - List workforce with capabilities and scores
autonomyRouter.get("/autonomy/workforce/agents", (_req, res) => {
  try {
    const allAgents = mastraAgentRegistry.getAllAgents();
    const agentsWithProfiles = allAgents.map((agent) => {
      const profile = capabilityEngine.get(agent.getId());
      return {
        id: agent.getId(),
        name: agent.getName(),
        role: (agent as any).getRoleId ? (agent as any).role : agent.config.role,
        department: agent.getDepartment(),
        instructions: agent.getInstructions(),
        capabilities: profile.assignedCapabilities,
        learnedCapabilities: profile.learnedCapabilities,
        overallScore: profile.overallScore,
        scores: profile.capabilities,
        isDynamic: (agent as any).getRoleId !== undefined,
      };
    });

    return res.json({ success: true, count: agentsWithProfiles.length, agents: agentsWithProfiles });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/autonomy/workforce/spawn - Dynamically spawn a specialized employee
autonomyRouter.post("/autonomy/workforce/spawn", (req, res) => {
  try {
    const { roleId, customName, extraCapabilities } = req.body;
    if (!roleId) {
      return res.status(400).json({ success: false, error: "roleId is required" });
    }

    const employee = employeeFactory.createEmployee(roleId, customName, extraCapabilities || []);
    const profile = capabilityEngine.get(employee.getId());

    return res.json({
      success: true,
      message: `Successfully spawned employee ${employee.getName()}`,
      employee: {
        id: employee.getId(),
        name: employee.getName(),
        role: employee.config.role,
        department: employee.getDepartment(),
        capabilities: profile.assignedCapabilities,
        overallScore: profile.overallScore,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/autonomy/workforce/solve & /autonomy/workforce/solve - Matches the best employee (or spawns one)
const solveHandler = async (req: any, res: any) => {
  try {
    const { taskDescription, requiredCapabilities, preferredDepartment } = req.body;
    if (!taskDescription || !requiredCapabilities || !Array.isArray(requiredCapabilities)) {
      return res.status(400).json({ success: false, error: "taskDescription and requiredCapabilities list are required" });
    }

    const allocation = await workforceManager.selectEmployeeForTask(
      taskDescription,
      requiredCapabilities,
      preferredDepartment
    );

    return res.json({
      success: true,
      allocation: {
        agentId: allocation.agent.getId(),
        agentName: allocation.agent.getName(),
        department: allocation.agent.getDepartment(),
        confidenceScore: allocation.confidenceScore,
        reason: allocation.reason,
        source: allocation.source,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
autonomyRouter.post("/api/autonomy/workforce/solve", solveHandler);
autonomyRouter.post("/autonomy/workforce/solve", solveHandler);

// POST /autonomy/workforce/distribute - Distribute a task across the workforce
const distributeHandler = async (req: any, res: any) => {
  try {
    const { title, description, requiredCapabilities, preferredDepartment, priority, payload } = req.body;
    if (!title || !requiredCapabilities || !Array.isArray(requiredCapabilities)) {
      return res.status(400).json({ success: false, error: "title and requiredCapabilities list are required" });
    }

    const distribution = await workforceManager.distributeTask({
      title,
      description,
      requiredCapabilities,
      preferredDepartment,
      priority,
      payload,
    });

    return res.json({ success: true, distribution });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
autonomyRouter.post("/autonomy/workforce/distribute", distributeHandler);
autonomyRouter.post("/api/autonomy/workforce/distribute", distributeHandler);

// POST /autonomy/workforce/verify - Verifies an employee suitability against required capabilities
const verifyHandler = (req: any, res: any) => {
  try {
    const { agentId, requiredCapabilities, preferredDepartment } = req.body;
    if (!agentId || !requiredCapabilities || !Array.isArray(requiredCapabilities)) {
      return res.status(400).json({ success: false, error: "agentId and requiredCapabilities list are required" });
    }

    const agent = mastraAgentRegistry.getAgent(agentId);
    if (!agent) {
      return res.status(404).json({ success: false, error: `Agent "${agentId}" not found in registry.` });
    }

    const evaluation = workforceManager.verifyEmployeeSuitability(
      agent,
      requiredCapabilities,
      preferredDepartment
    );

    return res.json({ success: true, evaluation });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
autonomyRouter.post("/autonomy/workforce/verify", verifyHandler);
autonomyRouter.post("/api/autonomy/workforce/verify", verifyHandler);

// POST /autonomy/workforce/commission - Commission a specialized virtual employee on demand
const commissionHandler = (req: any, res: any) => {
  try {
    const { taskDescription, requiredCapabilities, preferredDepartment, customName } = req.body;
    if (!requiredCapabilities || !Array.isArray(requiredCapabilities) || requiredCapabilities.length === 0) {
      return res.status(400).json({ success: false, error: "requiredCapabilities array is required" });
    }

    const commissionedAgent = workforceManager.commissionSpecializedAgent(
      taskDescription || "Custom specialized task",
      requiredCapabilities,
      preferredDepartment,
      customName
    );

    const profile = capabilityEngine.get(commissionedAgent.getId());

    return res.json({
      success: true,
      message: `Commissioned specialized agent ${commissionedAgent.getName()}`,
      agent: {
        id: commissionedAgent.getId(),
        name: commissionedAgent.getName(),
        role: commissionedAgent.config.role,
        department: commissionedAgent.getDepartment(),
        capabilities: profile.assignedCapabilities,
        overallScore: profile.overallScore,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
autonomyRouter.post("/autonomy/workforce/commission", commissionHandler);
autonomyRouter.post("/api/autonomy/workforce/commission", commissionHandler);

// GET /autonomy/workforce/stats - Workforce telemetry and workload metrics
const statsHandler = (_req: any, res: any) => {
  try {
    const stats = workforceManager.getWorkforceStats();
    return res.json({ success: true, stats });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
autonomyRouter.get("/autonomy/workforce/stats", statsHandler);
autonomyRouter.get("/api/autonomy/workforce/stats", statsHandler);

// GET /autonomy/workforce/history - Get commission and task history
const historyHandler = (_req: any, res: any) => {
  try {
    const commissionHistory = workforceManager.getCommissionHistory();
    const taskHistory = workforceManager.getTaskHistory();
    return res.json({ success: true, commissionHistory, taskHistory });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
autonomyRouter.get("/autonomy/workforce/history", historyHandler);
autonomyRouter.get("/api/autonomy/workforce/history", historyHandler);

/* ====================================================================== */
/* CONTINUOUS LEARNING & KNOWLEDGE RADAR                                  */
/* ====================================================================== */

// GET /api/autonomy/knowledge/discoveries - List all crawled tech discoveries
autonomyRouter.get("/autonomy/knowledge/discoveries", (req, res) => {
  try {
    const category = req.query.category as any;
    const discoveries = category
      ? discoveryEngine.getDiscoveriesByCategory(category)
      : discoveryEngine.getAllDiscoveries();
    return res.json({ success: true, count: discoveries.length, discoveries });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/autonomy/knowledge/stats - Get discovery engine continuous scanning stats
autonomyRouter.get("/autonomy/knowledge/stats", (_req, res) => {
  try {
    const stats = discoveryEngine.getStats();
    return res.json({ success: true, stats });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/autonomy/knowledge/discover - Scan the web for breakthroughs and launch research briefs
autonomyRouter.post("/autonomy/knowledge/discover", async (req, res) => {
  try {
    const { categories } = req.body || {};
    const findings = await discoveryEngine.runDiscoveryCycle(
      Array.isArray(categories) && categories.length > 0 ? categories : undefined
    );
    return res.json({
      success: true,
      message: `Sweep finished. Found ${findings.length} new tech milestones.`,
      findings,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/autonomy/knowledge/query - Query the unlimited intelligence source for agents
autonomyRouter.post("/autonomy/knowledge/query", async (req, res) => {
  try {
    const { query, category, forceLiveSearch, limit } = req.body || {};
    if (!query || typeof query !== "string") {
      return res.status(400).json({ success: false, error: "Query string is required" });
    }

    const result = await discoveryEngine.queryIntelligence(query, {
      category,
      forceLiveSearch: Boolean(forceLiveSearch),
      limit: limit ? Number(limit) : undefined,
    });

    return res.json({ success: true, result });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/autonomy/knowledge/continuous - Configure or toggle continuous autonomous scanning
autonomyRouter.post("/autonomy/knowledge/continuous", (req, res) => {
  try {
    const { active, intervalMs } = req.body || {};
    if (active === false) {
      discoveryEngine.stopContinuousScanning();
      return res.json({ success: true, message: "Continuous background scanning stopped.", active: false });
    } else {
      discoveryEngine.startContinuousScanning(intervalMs ? Number(intervalMs) : 300_000);
      return res.json({
        success: true,
        message: "Continuous background scanning active. Unlimited intelligence loop engaged.",
        active: true,
        intervalMs: intervalMs ? Number(intervalMs) : 300_000,
      });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/autonomy/knowledge/articles - Get corporate knowledge base synced articles
autonomyRouter.get("/autonomy/knowledge/articles", (_req, res) => {
  try {
    const articles = knowledgeManager.getAllArticles();
    return res.json({ success: true, count: articles.length, articles });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/autonomy/knowledge/briefs - Get research briefs logs
autonomyRouter.get("/autonomy/knowledge/briefs", (_req, res) => {
  try {
    const briefs = researchManager.getAllBriefs();
    return res.json({ success: true, count: briefs.length, briefs });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/autonomy/knowledge/optimizations - Get scanned codebase recommendations
autonomyRouter.get("/autonomy/knowledge/optimizations", (_req, res) => {
  try {
    const optimizations = technologyScanner.getOptimizations();
    return res.json({ success: true, count: optimizations.length, optimizations });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/autonomy/knowledge/scan - Scan our workspace code structures
autonomyRouter.post("/autonomy/knowledge/scan", async (_req, res) => {
  try {
    const recommendations = await technologyScanner.scanCodebaseForUpgrades();
    return res.json({
      success: true,
      message: `Scan finished. Proposed ${recommendations.length} modern upgrades.`,
      recommendations,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/* ====================================================================== */
/* CORPORATE COMMAND CASCADE HIERARCHY                                    */
/* (User -> CEO -> Executive -> Department HODs -> Employees in Parallel) */
/* ====================================================================== */

// POST /api/autonomy/cascade/run - Execute command down the corporate chain
autonomyRouter.post("/autonomy/cascade/run", async (req, res) => {
  try {
    const { command } = req.body;
    if (!command || typeof command !== "string" || command.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: "A valid 'command' string is required (min 3 characters).",
      });
    }

    const run = await corporateCascadeEngine.executeCommand(command.trim());
    return res.json({
      success: true,
      run,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/autonomy/cascade/history - Get past corporate cascade runs
autonomyRouter.get("/autonomy/cascade/history", (_req, res) => {
  try {
    const history = corporateCascadeEngine.getHistory();
    return res.json({ success: true, count: history.length, history });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/autonomy/cascade/stream - Real-time SSE streaming of corporate hierarchy execution
autonomyRouter.post("/autonomy/cascade/stream", async (req, res) => {
  try {
    const { command } = req.body;
    if (!command || typeof command !== "string" || command.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: "A valid 'command' string is required.",
      });
    }

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    (res as any).flushHeaders?.();

    const send = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    send("start", { status: "mobilizing_hierarchy", command });

    const run = await corporateCascadeEngine.executeCommand(command.trim(), (evt) => {
      send(evt.type, evt.data);
    });

    send("complete", {
      runId: run.id,
      status: run.status,
      metrics: run.metrics,
      ceoResponse: run.ceoFinalResponse,
      run,
    });

    res.end();
  } catch (error: any) {
    console.error("[Corporate Cascade Stream] Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: error.message });
    }
    res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});
