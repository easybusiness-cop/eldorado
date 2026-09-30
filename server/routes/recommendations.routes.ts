import { Router, Request, Response } from "express";
import { recommendationEngine, RecommendationItemType } from "../recommendation/recommendation-engine.ts";

export const recommendationsRouter = Router();

// Base Recommendations List
recommendationsRouter.get("/", (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || "dev-admin-user";
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 8;
  const items = recommendationEngine.getPersonalized(userId, limit);
  const stats = recommendationEngine.getStats();

  res.json({
    success: true,
    userId,
    stats,
    total: items.length,
    recommendations: items,
  });
});

// Track User Behavior
recommendationsRouter.post("/track", (req: Request, res: Response) => {
  const { userId = "dev-admin-user", eventType, itemId, itemType, itemTitle, category, tags = [], weight = 5, metadata } = req.body;

  if (!eventType || !itemId || !itemType) {
    return res.status(400).json({ error: "Missing required fields: eventType, itemId, itemType" });
  }

  const recorded = recommendationEngine.trackEvent({
    userId,
    eventType,
    itemId,
    itemType,
    itemTitle: itemTitle || itemId,
    category: category || "general",
    tags,
    weight,
    timestamp: Date.now(),
    metadata,
  });

  res.json({ success: true, event: recorded });
});

// Get Personalized Recommendations
recommendationsRouter.get("/personalized", (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || "dev-admin-user";
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 8;
  const itemType = req.query.itemType as RecommendationItemType | undefined;

  const items = recommendationEngine.getPersonalized(userId, limit, itemType);
  res.json({
    userId,
    total: items.length,
    recommendations: items,
  });
});

// Get Trending Results
recommendationsRouter.get("/trending", (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;
  const itemType = req.query.itemType as RecommendationItemType | undefined;

  const items = recommendationEngine.getTrending(limit, itemType);
  res.json({
    total: items.length,
    trending: items,
  });
});

// Quantum Intelligence Context & Next Actions
recommendationsRouter.post("/context", (req: Request, res: Response) => {
  const { prompt = "", userId = "dev-admin-user" } = req.body;
  const context = recommendationEngine.getIntelligenceContext(prompt, userId);
  res.json({ success: true, context });
});

// Telemetry & Events Log
recommendationsRouter.get("/events", (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const events = recommendationEngine.getRecentEvents(limit);
  const stats = recommendationEngine.getStats();

  res.json({
    stats,
    total: events.length,
    events,
  });
});
