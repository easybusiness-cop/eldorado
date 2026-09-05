import { Router } from "express";
import { MasterOrchestrator } from "../core/orchestration/master-orchestrator";
import { modelRouter } from "../ai/providers";

export const orchestratorRouter = Router();

/**
 * POST /api/orchestrator/run
 * Trigger the Master Orchestrator from the frontend or any client.
 *
 * Body:
 * {
 *   "objective": "Build a RateLimiter utility",
 *   "requestedBy": "michael",          // optional
 *   "maxSteps": 8,                     // optional
 *   "preferredAgents": {               // optional
 *     "coder": "ruflo",
 *     "researcher": "stanley"
 *   }
 * }
 */
orchestratorRouter.post("/orchestrator/run", async (req, res) => {
  try {
    const { objective, requestedBy, maxSteps, preferredAgents, organizationId } = req.body;

    if (!objective || typeof objective !== "string" || objective.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: "A valid 'objective' string is required (min 3 characters).",
      });
    }

    const plan = await MasterOrchestrator.run({
      objective: objective.trim(),
      requestedBy: requestedBy || "frontend",
      organizationId: organizationId || "org-munderdifflin",
      maxSteps: maxSteps ? Number(maxSteps) : 8,
      preferredAgents: preferredAgents || {},
    });

    return res.json({
      success: true,
      plan: {
        id: plan.id,
        objective: plan.originalObjective,
        status: plan.status,
        critique: plan.critique,
        finalAnswer: plan.finalAnswer,
        metadata: plan.metadata,
        steps: plan.steps.map((s) => ({
          id: s.id,
          role: s.role,
          agentId: s.agentId,
          objective: s.objective,
          status: s.status,
          error: s.error,
          resultPreview: s.result
            ? typeof s.result === "string"
              ? s.result.slice(0, 400)
              : JSON.stringify(s.result).slice(0, 400)
            : null,
        })),
      },
    });
  } catch (error: any) {
    console.error("[Orchestrator Route] Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || String(error),
    });
  }
});

/**
 * GET /api/orchestrator/health
 * Simple health check for the orchestrator system
 */
orchestratorRouter.get("/orchestrator/health", (_req, res) => {
  res.json({
    success: true,
    service: "MasterOrchestrator",
    status: "ready",
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/orchestrator/models
 * Returns the status of registered model providers (Ollama, Local, Gemini, etc.)
 */
orchestratorRouter.get("/orchestrator/models", async (_req, res) => {
  try {
    const status = await modelRouter.getStatus();
    res.json({
      success: true,
      preferLocal: true,
      providers: status,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/orchestrator/stream
 * Streams model tokens back to the frontend (Server-Sent Events style)
 *
 * Body: { "prompt": "...", "systemInstruction": "...", "temperature": 0.3 }
 */
orchestratorRouter.post("/orchestrator/stream", async (req, res) => {
  try {
    const { prompt, systemInstruction, temperature, messages } = req.body;

    if (!prompt && (!messages || messages.length === 0)) {
      return res.status(400).json({
        success: false,
        error: "Either 'prompt' or 'messages' is required",
      });
    }

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    (res as any).flushHeaders?.();

    const send = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    send("start", { status: "streaming" });

    const result = await modelRouter.generateStream(
      {
        prompt,
        messages,
        systemInstruction,
        temperature: temperature ?? 0.3,
      },
      (chunk) => {
        if (chunk.text) {
          send("token", {
            text: chunk.text,
            provider: chunk.provider,
            model: chunk.model,
          });
        }
        if (chunk.done) {
          send("done", {
            provider: chunk.provider,
            model: chunk.model,
          });
        }
      }
    );

    send("complete", {
      fullText: result.text,
      provider: result.provider,
      model: result.model,
    });

    res.end();
  } catch (err: any) {
    console.error("[Orchestrator Stream] Error:", err);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/orchestrator/run-stream
 * Runs the Master Orchestrator and streams live progress (SSE)
 */
orchestratorRouter.post("/orchestrator/run-stream", async (req, res) => {
  try {
    const { objective, requestedBy, maxSteps, preferredAgents } = req.body;

    if (!objective || typeof objective !== "string" || objective.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: "A valid 'objective' string is required.",
      });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    (res as any).flushHeaders?.();

    const send = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    send("start", { status: "orchestrating", objective });

    const plan = await MasterOrchestrator.run({
      objective: objective.trim(),
      requestedBy: requestedBy || "frontend",
      maxSteps: maxSteps ? Number(maxSteps) : 8,
      preferredAgents: preferredAgents || {},
      onProgress: (event) => {
        send(event.type, event);
      },
    });

    send("complete", {
      planId: plan.id,
      status: plan.status,
      finalAnswer: plan.finalAnswer,
      metadata: plan.metadata,
    });

    res.end();
  } catch (err: any) {
    console.error("[Orchestrator Run-Stream] Error:", err);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});


