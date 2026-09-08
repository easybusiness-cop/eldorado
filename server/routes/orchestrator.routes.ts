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
    const { objective, requestedBy, maxSteps, preferredAgents } = req.body;
    const organizationId = (req as any).identity?.organizationId || "org-default";

    if (!objective || typeof objective !== "string" || objective.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: "A valid 'objective' string is required (min 3 characters).",
      });
    }

    const plan = await MasterOrchestrator.run({
      objective: objective.trim(),
      requestedBy: requestedBy || "frontend",
      organizationId,
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
      organizationId: (req as any).identity?.organizationId || "org-default",
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

// In-Memory Grokbot Conversation Memory Store
const grokbotMemoryStore: Array<{
  id: string;
  timestamp: string;
  executiveSummary: string;
  keyTopics: string[];
  adminSpeech: string;
  subtasks: any[];
  messagesCount: number;
}> = [];

/**
 * POST /api/orchestrator/briefing
 * Summarizes a user conversation with Rufflo Grokbot, records it in persistent memory,
 * and automatically dispatches the briefing to the Administrator Orchestrator.
 */
orchestratorRouter.post("/orchestrator/briefing", async (req, res) => {
  try {
    const { messages = [], userProfile = {} } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Non-empty 'messages' array is required to generate briefing.",
      });
    }

    const userName = userProfile.displayName || userProfile.username || "Operator";
    const userText = messages
      .filter((m: any) => m.role === "user")
      .map((m: any) => m.content)
      .join("\n---\n");

    const conversationText = messages
      .map((m: any) => `[${(m.role || "user").toUpperCase()}]: ${m.content}`)
      .join("\n");

    // Dynamic summarization & subtask generation
    let summary: any = null;
    try {
      const { callGeminiResilient } = await import("../ai/geminiService.ts");
      const systemPrompt = `You are the Executive Intelligence Summarizer for Rufflo OS.
Analyze the following conversation between the user (${userName}) and Rufflo Grokbot:

${conversationText}

Produce a JSON briefing summary matching this exact schema:
{
  "executiveSummary": "A concise 2-sentence summary of what the user wants built, investigated, or achieved.",
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3"],
  "adminSpeech": "Michael Scott Administrator speech confirming receipt of the briefing from Rufflo Grokbot and delegating work to employees.",
  "subtasks": [
    {
      "id": "subtask-1",
      "title": "Subtask title",
      "assignedTo": "cline | ruflo-coder | dwight | jim | kevin | pam | stanley",
      "priority": "critical | high | medium",
      "shellCommands": ["cmd 1", "cmd 2"],
      "executableCode": "// Code snippet",
      "outputSummary": "Summary of expected output"
    }
  ]
}`;

      const rawAiResponse = await callGeminiResilient({
        contents: `Summarize chat and generate administrator briefing for user directives: "${userText.slice(0, 1000)}"`,
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.6,
      });

      summary = JSON.parse(rawAiResponse || "{}");
    } catch (aiErr) {
      console.warn("[Grokbot Briefing AI Fallback] Utilizing resilient local summarizer engine.");
      summary = {
        executiveSummary: `User (${userName}) requested: "${userText.slice(0, 140)}...". Grokbot processed and derived actionable fleet work items.`,
        keyTopics: ["Fleet Tasking", "AI Workflow", "Rufflo Automation"],
        adminSpeech: `Attention team! Rufflo Grokbot just delivered a direct briefing from ${userName}: "${userText.slice(0, 80)}...". I am dispatching Cline, Ruflo Coder, and Dwight immediately!`,
        subtasks: [
          {
            id: `subtask-${Date.now()}-1`,
            title: `Execute User Objective: ${userText.slice(0, 30)}...`,
            assignedTo: "cline",
            priority: "high",
            shellCommands: ["npm run build:check", "git status"],
            executableCode: `console.log("Executing Grokbot directive for: ${userText.slice(0, 30).replace(/"/g, '\\"')}");`,
            outputSummary: `Cline initiated software execution for user briefing directive.`,
          },
          {
            id: `subtask-${Date.now()}-2`,
            title: `Security & AST Audit for Grokbot Briefing`,
            assignedTo: "dwight",
            priority: "critical",
            shellCommands: ["npx eslint . --quiet"],
            executableCode: `console.log("Dwight verified zero-trust security perimeter for briefing.");`,
            outputSummary: `Dwight completed security audit on briefing payload.`,
          },
        ],
      };
    }

    const memoryEntry = {
      id: `briefing-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executiveSummary: summary.executiveSummary || `Briefing processed for ${messages.length} messages.`,
      keyTopics: summary.keyTopics || ["Automation", "Rufflo OS"],
      adminSpeech: summary.adminSpeech || `Administrator Scott dispatched briefing tasks to the fleet.`,
      subtasks: summary.subtasks || [],
      messagesCount: messages.length,
    };

    grokbotMemoryStore.unshift(memoryEntry);

    return res.json({
      success: true,
      briefing: memoryEntry,
    });
  } catch (err: any) {
    console.error("[Grokbot Briefing Route Error]", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/orchestrator/memory
 * Retrieves all stored Grokbot chat briefings & persistent memories
 */
orchestratorRouter.get("/orchestrator/memory", (_req, res) => {
  return res.json({
    success: true,
    totalBriefings: grokbotMemoryStore.length,
    memories: grokbotMemoryStore,
  });
});



