import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { requireAuth } from "./server/security/auth.middleware.ts";

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
app.use("/api/github", githubRouter);
app.use("/api/admin", adminRouter);
app.use("/api/cse-ml", cseMlRouter);
app.use("/api/engineering", engineeringAdvancedRouter);
app.use("/api/knowledge", knowledgeRouter);

// Root /api scoped domain routers
app.use("/api", agentExecutionRouter);
app.use("/api", systemTelemetryRouter);
app.use("/api", hqRouter);
app.use("/api", webExplorerRouter);
app.use("/api", enterpriseControlRouter);
app.use("/api", autonomyRouter);
app.use("/api/evolution", evolutionRouter);
app.use("/api/repository", repositoryRouter);
app.use("/api/supabase", supabaseRouter);
app.use("/api", objectivesRouter);
app.use("/api", orchestratorRouter);

// Intelligent Engineering Department Endpoint
app.post("/api/objectives/engineering", async (req, res) => {
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
app.use("/api/department", departmentRoutes);

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

// Start Server with Vite Dev/Prod Middleware
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Rufflo Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
