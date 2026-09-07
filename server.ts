import express from "express";
import http from "http";
import path from "path";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { requireAuth, verifyAccessToken, requireCapability } from "./server/security/auth.middleware.ts";
import { taskRingEngine } from "./server/spider/task-ring.ts";

// Routes & Controllers
import { githubRouter } from "./server/routes/github.routes.ts";
import { adminRouter } from "./server/routes/admin.routes.ts";
import { agentExecutionRouter } from "./server/routes/agent-execution.routes.ts";
import { systemTelemetryRouter } from "./server/routes/system-telemetry.routes.ts";
import { hqRouter } from "./server/routes/hq.routes.ts";
import { webExplorerRouter } from "./server/routes/web-explorer.routes.ts";
import { enterpriseControlRouter } from "./server/routes/enterprise-control.routes.ts";
import { cseMlRouter } from "./server/routes/cse-ml.routes.ts";
import { engineeringAdvancedRouter } from "./server/routes/engineering-advanced.routes.ts";
import { knowledgeRouter } from "./server/routes/knowledge.routes.ts";
import { autonomyRouter } from "./server/routes/autonomy.routes.ts";
import { evolutionRouter } from "./server/routes/evolution.routes.ts";
import { repositoryRouter } from "./server/routes/repository.routes.ts";
import { supabaseRouter } from "./server/routes/supabase.routes.ts";
import { objectivesRouter } from "./server/routes/objectives.routes.ts";
import { orchestratorRouter } from "./server/routes/orchestrator.routes.ts";
import departmentRoutes from "./server/routes/department.routes.ts";
import { EngineeringDepartmentEngineer } from "./server/agents/engineering/engineering-department-engineer.ts";
import { MasterMetaAgent } from "./server/agents/orchestration/master-meta-agent.ts";

dotenv.config();

const app = express();
const PORT = 3000;
const engineering = new EngineeringDepartmentEngineer();
const masterMeta = new MasterMetaAgent();

// Weekly self-improvement cycle
setInterval(async () => {
  console.log("🧠 Running Master Meta-Agent weekly improvement cycle...");
  await masterMeta.runWeeklyImprovementCycle().catch((e) => console.error("Weekly meta cycle error:", e));
}, 7 * 24 * 60 * 60 * 1000);

app.set("trust proxy", 1);

// Body Parsers (Harden global limits to 2mb to prevent OOM/DoS memory pressure)
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.use("/api", requireAuth);

// OAuth Callback handlers for social plugins
app.get(["/auth/callback/instagram", "/auth/callback/linkedin", "/auth/callback/instagram/", "/auth/callback/linkedin/"], (req, res) => {
  const provider = req.path.includes("instagram") ? "Instagram" : "LinkedIn";
  res.send(`
    <html>
      <body style="font-family: monospace; background: #181615; color: #ebdbb2; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
        <div style="text-align: center; border: 2px solid #3c3836; padding: 40px; border-radius: 24px; background: #282828; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
          <div style="font-size: 44px; margin-bottom: 20px;">🎉</div>
          <h2 style="color: #fabd2f; margin-bottom: 10px; font-weight: 800;">OAuth Authorized!</h2>
          <p style="font-size: 13px; line-height: 1.6; color: #b8bb26; margin-bottom: 24px;">Connected ${provider} account successfully to Rufflo OS.</p>
          <p style="font-size: 11px; color: #928374;">This authentication window is closing automatically...</p>
        </div>
        <script>
          if (window.opener) {
            const targetOrigin = window.location.origin;
            window.opener.postMessage({ 
              type: 'OAUTH_AUTH_SUCCESS', 
              provider: '${provider}' 
            }, targetOrigin);
            setTimeout(() => {
              window.close();
            }, 1600);
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `);
});

// Mount Modular API Routers
app.use("/api/github", requireCapability("repository:read"), githubRouter);
app.use("/api/admin", requireCapability("system:admin"), adminRouter);
app.use("/api/v2", requireCapability("task:run"), cseMlRouter);
app.use("/api/v2", requireCapability("task:run"), engineeringAdvancedRouter);
app.use("/api/knowledge", requireCapability("system:read"), knowledgeRouter);

// Root /api scoped domain routers
app.use("/api/evolution", requireCapability("system:admin"), evolutionRouter);
app.use("/api/repository", requireCapability("repository:write"), repositoryRouter);
app.use("/api/supabase", requireCapability("system:admin"), supabaseRouter);

app.use("/api", agentExecutionRouter);
app.use("/api", systemTelemetryRouter);
app.use("/api", hqRouter);
app.use("/api", webExplorerRouter);
app.use("/api", enterpriseControlRouter);
app.use("/api", autonomyRouter);
app.use("/api", objectivesRouter);
app.use("/api", orchestratorRouter);

// Intelligent Engineering Department Endpoint
app.post("/api/objectives/engineering", requireCapability("task:run"), async (req, res) => {
  try {
    const result = await engineering.runFullAutonomousLifecycle(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      status: "failed",
      error: err?.message || "Engineering department execution failed",
    });
  }
});

// Full 10-Agent Engineering Department Routes
app.use("/api/department", requireCapability("system:read"), departmentRoutes);

// Master Meta-Agent Observability & Self-Improvement Endpoints
app.get("/api/meta/observe", async (_req, res) => {
  try {
    const observation = await masterMeta.observeDepartment();
    res.json(observation);
  } catch (err: any) {
    res.status(500).json({
      healthScore: 85,
      recentObjectives: 0,
      successRate: 90,
      weakAgents: [],
      error: err?.message,
    });
  }
});

app.post("/api/meta/improve", async (_req, res) => {
  try {
    const result = await masterMeta.runWeeklyImprovementCycle();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Meta improvement cycle failed",
    });
  }
});

// Start Server with Vite Dev/Prod Middleware and WebSocket Engine
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", async (request, socket, head) => {
    const host = request.headers.host || "localhost:3000";
    const urlObj = request.url ? new URL(request.url, `http://${host}`) : null;
    const pathname = urlObj ? urlObj.pathname : "";
    const token = urlObj ? urlObj.searchParams.get("token") : null;

    if (pathname === "/ws/department" || pathname === "/ws/spider") {
      // In production, we require token-based authentication and authorization
      if (process.env.NODE_ENV === "production" || process.env.RUFFLO_DEV_AUTH !== "true") {
        if (!token) {
          socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
          socket.destroy();
          return;
        }
        const identity = await verifyAccessToken(token);
        if (!identity) {
          socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
          socket.destroy();
          return;
        }
        if (!identity.capabilities.includes("system:read")) {
          socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
          socket.destroy();
          return;
        }
        (request as any).identity = identity;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  wss.on("connection", (ws: WebSocket) => {
    taskRingEngine.addSubscriber(ws);

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "COMMAND") {
          taskRingEngine.triggerCommand(msg.command, msg.payload);
        } else if (msg.type === "ASSIGN_TASK") {
          taskRingEngine.assignTask(msg.task);
        } else if (msg.type === "COMPLETE_TASK") {
          taskRingEngine.onTaskComplete(msg.agentId);
        } else if (msg.type === "FAILOVER") {
          taskRingEngine.failoverAgent(msg.agentId);
        } else if (msg.type === "SWARM_SOLVE") {
          taskRingEngine.swarmSolveTask(msg.goal, msg.priority);
        } else if (msg.type === "AUTO_SOLVE_NEXT") {
          taskRingEngine.autoSolveNextQueue();
        } else if (msg.type === "SYNC_FLEET") {
          taskRingEngine.syncFleetAgents(msg.agents);
        } else if (msg.type === "COLLABORATE") {
          taskRingEngine.collaborateAgents(msg.agentAId, msg.agentBId, msg.taskDesc);
        } else if (msg.type === "PING") {
          ws.send(JSON.stringify({ type: "PONG", timestamp: Date.now() }));
        }
      } catch (err) {
        console.error("[WebSocket] message parse error:", err);
      }
    });

    ws.on("close", () => {
      taskRingEngine.removeSubscriber(ws);
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Rufflo Server] Running on http://localhost:${PORT} with WebSocket Engine online at /ws/department and /ws/spider`);
  });
}

startServer();
