import { Router } from "express";
import { predictiveLoadBalancer } from "../ai/company/workforce/predictive-load-balancer.ts";

export const loadBalancerRouter = Router();

/**
 * GET /api/load-balancer/stats
 * Retrieves full predictive load balancing statistics, agent 24h efficiency heatmaps, and telemetry logs
 */
loadBalancerRouter.get("/stats", (_req, res) => {
  try {
    const stats = predictiveLoadBalancer.getFullFleetEfficiencyStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({
      error: "Failed to fetch load balancer statistics",
      message: err?.message,
    });
  }
});

/**
 * POST /api/load-balancer/predict
 * Auto-assigns/predicts optimal agent for an incoming task based on peak historical efficiency windows
 */
loadBalancerRouter.post("/predict", (req, res) => {
  try {
    const { title, description, requiredCapabilities, preferredDepartment, priority } = req.body;
    if (!title && !description) {
      return res.status(400).json({ error: "Task title or description is required for predictive routing." });
    }

    const prediction = predictiveLoadBalancer.predictOptimalAgent({
      taskTitle: title || "Automated Task Assignment",
      taskDescription: description || title || "",
      requiredCapabilities: requiredCapabilities || [],
      preferredDepartment,
      priority,
    });

    // Record prediction in telemetry log
    const logEntry = predictiveLoadBalancer.recordPredictionLog({
      taskId: `tsk-${Date.now().toString(36)}`,
      taskTitle: title || description || "Task Auto-Assignment",
      assignedAgentId: prediction.recommendedAgentId,
      assignedAgentName: prediction.recommendedAgentName,
      predictedScore: prediction.scorePercentage,
      windowLabel: prediction.windowLabel,
      confidenceRating: prediction.confidenceRating,
      rationale: prediction.rationale,
      status: "assigned",
    });

    res.json({
      success: true,
      prediction,
      logEntry,
    });
  } catch (err: any) {
    res.status(500).json({
      error: "Failed to perform predictive load balancing",
      message: err?.message,
    });
  }
});

/**
 * POST /api/load-balancer/config
 * Updates load balancer tuning parameters (weights, auto-assign mode)
 */
loadBalancerRouter.post("/config", (req, res) => {
  try {
    const updated = predictiveLoadBalancer.updateConfig(req.body);
    res.json({
      success: true,
      config: updated,
    });
  } catch (err: any) {
    res.status(500).json({
      error: "Failed to update load balancer configuration",
      message: err?.message,
    });
  }
});
