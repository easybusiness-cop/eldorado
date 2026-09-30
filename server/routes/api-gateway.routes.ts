import { Router, Request, Response, NextFunction } from "express";
import { apiGateway, GatewayLogEntry, GatewayRoute } from "../gateway/api-gateway.ts";
import { requireCapability } from "../security/auth.middleware.ts";

export const apiGatewayRouter = Router();

// Gateway Health & Telemetry
apiGatewayRouter.get("/health", (_req: Request, res: Response) => {
  const metrics = apiGateway.getMetrics();
  res.json({
    status: "healthy",
    gatewayVersion: "v2.6.0-quantum",
    uptimeSeconds: Math.floor(process.uptime()),
    activeConnections: metrics.activeConnections,
    totalRequests: metrics.totalRequests,
    cacheHitRatio: metrics.cacheHitRatio,
    timestamp: new Date().toISOString(),
  });
});

apiGatewayRouter.get("/metrics", (_req: Request, res: Response) => {
  const metrics = apiGateway.getMetrics();
  const routes = apiGateway.getRoutes();
  const cacheEntries = apiGateway.getCacheEntries();
  const tiers = apiGateway.getRateLimitTiers();

  res.json({
    metrics,
    totalRoutes: routes.length,
    totalCachedEntries: cacheEntries.length,
    cachedMemoryBytes: cacheEntries.reduce((sum, c) => sum + c.sizeBytes, 0),
    tiers,
    timestamp: new Date().toISOString(),
  });
});

apiGatewayRouter.get("/routes", (_req: Request, res: Response) => {
  res.json({ routes: apiGateway.getRoutes() });
});

apiGatewayRouter.get("/services", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    services: [
      { id: "svc-gateway", name: "api-gateway-service", version: "2.6.0", status: "HEALTHY" },
      { id: "svc-quantum-intelligence", name: "quantum-intelligence-service", version: "2.5.0", status: "HEALTHY" },
      { id: "svc-browser-use", name: "browser-automation-service", version: "1.8.4", status: "HEALTHY" },
      { id: "svc-recommendations", name: "recommendation-service", version: "1.4.0", status: "HEALTHY" },
      { id: "svc-task-orchestrator", name: "task-orchestrator-service", version: "3.2.0", status: "HEALTHY" },
      { id: "svc-knowledge-rag", name: "knowledge-rag-service", version: "2.0.1", status: "HEALTHY" },
      { id: "svc-code-sandbox", name: "code-sandbox-service", version: "1.9.0", status: "HEALTHY" },
    ],
  });
});

apiGatewayRouter.post("/routes", requireCapability("system:admin"), (req: Request, res: Response) => {
  const route = req.body as GatewayRoute;
  if (!route.id || !route.pathPattern) {
    return res.status(400).json({ error: "Missing required route fields (id, pathPattern)" });
  }
  apiGateway.addOrUpdateRoute(route);
  res.json({ success: true, route });
});

apiGatewayRouter.delete("/routes/:id", requireCapability("system:admin"), (req: Request, res: Response) => {
  const deleted = apiGateway.deleteRoute(req.params.id);
  res.json({ success: deleted });
});

apiGatewayRouter.get("/cache", (_req: Request, res: Response) => {
  const entries = apiGateway.getCacheEntries();
  res.json({
    totalEntries: entries.length,
    entries: entries.map((e) => ({
      key: e.key,
      path: e.path,
      eTag: e.eTag,
      hits: e.hits,
      sizeBytes: e.sizeBytes,
      tags: e.tags,
      expiresInSec: Math.max(0, Math.floor((e.expiresAt - Date.now()) / 1000)),
    })),
  });
});

apiGatewayRouter.post("/cache/invalidate", requireCapability("system:admin"), (req: Request, res: Response) => {
  const { tag, pathPrefix, key } = req.body;
  const count = apiGateway.invalidateCache({ tag, pathPrefix, key });
  res.json({ success: true, invalidatedCount: count });
});

apiGatewayRouter.post("/cache/flush", requireCapability("system:admin"), (_req: Request, res: Response) => {
  apiGateway.flushCache();
  res.json({ success: true, message: "Gateway cache flushed completely" });
});

apiGatewayRouter.get("/logs", (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  res.json({ logs: apiGateway.getRecentLogs(limit) });
});

// Benchmark / Load Balancing Simulator for testing
apiGatewayRouter.post("/test-dispatch", async (req: Request, res: Response) => {
  const { pathPattern = "/api/gateway/agents/dispatch", iterations = 10 } = req.body;
  const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";

  const route = apiGateway.matchRoute(pathPattern, "POST");
  if (!route) {
    return res.status(404).json({ error: "No matching route pattern in Gateway" });
  }

  const dispatchResults: Array<{ index: number; targetId: string; targetName: string; latencyMs: number }> = [];

  for (let i = 0; i < iterations; i++) {
    const target = apiGateway.selectTarget(route, clientIp);
    if (target) {
      const simulatedLatency = Math.max(2, Math.floor(target.avgLatencyMs + (Math.random() * 6 - 3)));
      dispatchResults.push({
        index: i + 1,
        targetId: target.id,
        targetName: target.name,
        latencyMs: simulatedLatency,
      });
    }
  }

  res.json({
    routeId: route.id,
    strategy: route.strategy,
    totalDispatched: iterations,
    dispatches: dispatchResults,
  });
});

// Single Unified Entrypoint Routing Handler
apiGatewayRouter.all("/proxy/*", async (req: Request, res: Response) => {
  const startTime = Date.now();
  const subPath = req.params[0] ? `/${req.params[0]}` : "/";
  const fullPath = `/api/gateway${subPath}`;
  const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";

  const route = apiGateway.matchRoute(fullPath, req.method);

  if (!route) {
    const latency = Date.now() - startTime;
    apiGateway.recordLog({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      clientIp,
      method: req.method,
      path: fullPath,
      targetUrl: "NONE",
      targetId: "NONE",
      statusCode: 404,
      latencyMs: latency,
      cached: false,
      rateLimitRemaining: 60,
    });
    return res.status(404).json({ error: `Gateway: No upstream route matches pattern '${fullPath}'` });
  }

  // 1. Rate Limiting Check
  const rateLimitKey = `${clientIp}:${route.id}`;
  const rateLimit = apiGateway.checkRateLimit(rateLimitKey, route.rateLimitTier || "developer");

  res.setHeader("X-RateLimit-Limit", "300");
  res.setHeader("X-RateLimit-Remaining", rateLimit.remaining.toString());
  res.setHeader("X-RateLimit-Reset", rateLimit.resetTime.toString());

  if (!rateLimit.allowed) {
    const latency = Date.now() - startTime;
    apiGateway.recordLog({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      clientIp,
      method: req.method,
      path: fullPath,
      targetUrl: "BLOCKED",
      targetId: "RATE_LIMITER",
      statusCode: 429,
      latencyMs: latency,
      cached: false,
      rateLimitRemaining: 0,
    });
    return res.status(429).json({
      error: "Too Many Requests - Rate limit exceeded in API Gateway",
      retryAfterSeconds: rateLimit.resetTime,
    });
  }

  // 2. Cache Check for GET requests
  const cacheKey = `${req.method}:${fullPath}:${JSON.stringify(req.query)}`;
  if (req.method === "GET" && route.cacheTtlSeconds && route.cacheTtlSeconds > 0) {
    const ifNoneMatch = req.headers["if-none-match"] as string;
    const cacheResult = apiGateway.getCache(cacheKey, ifNoneMatch);

    if (cacheResult.hit && cacheResult.entry) {
      if (cacheResult.notModified) {
        return res.status(304).end();
      }
      res.setHeader("X-Cache-Status", "HIT");
      res.setHeader("ETag", cacheResult.entry.eTag);
      res.setHeader("Cache-Control", `public, max-age=${route.cacheTtlSeconds}`);

      const latency = Date.now() - startTime;
      apiGateway.recordLog({
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        clientIp,
        method: req.method,
        path: fullPath,
        targetUrl: "IN_MEMORY_CACHE",
        targetId: "CACHE_LAYER",
        statusCode: 200,
        latencyMs: latency,
        cached: true,
        rateLimitRemaining: rateLimit.remaining,
      });

      return res.status(200).json(cacheResult.entry.body);
    }
  }

  // 3. Upstream Target Selection via Load Balancer
  const target = apiGateway.selectTarget(route, clientIp);
  if (!target) {
    return res.status(503).json({ error: "Gateway: All upstream targets are currently unavailable or unhealthy" });
  }

  // 4. Dispatch Request to target
  target.activeConnections += 1;
  const mockResponseData = {
    gateway: "Rufflo Quantum Gateway v2.6",
    routeId: route.id,
    routedTo: {
      targetId: target.id,
      name: target.name,
      url: target.url,
      strategy: route.strategy,
    },
    client: {
      ip: clientIp,
      rateLimitRemaining: rateLimit.remaining,
    },
    data: {
      message: `Successfully routed ${req.method} request through API Gateway to upstream microservice.`,
      timestamp: new Date().toISOString(),
      payload: req.body || null,
      query: req.query,
    },
  };

  const latency = Math.max(2, Math.floor(target.avgLatencyMs + (Math.random() * 4 - 2)));
  target.activeConnections = Math.max(0, target.activeConnections - 1);

  // Set Cache if configured
  if (req.method === "GET" && route.cacheTtlSeconds && route.cacheTtlSeconds > 0) {
    apiGateway.setCache(cacheKey, fullPath, mockResponseData, route.cacheTtlSeconds, route.cacheTags || []);
    res.setHeader("X-Cache-Status", "MISS");
  }

  apiGateway.recordLog({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    clientIp,
    method: req.method,
    path: fullPath,
    targetUrl: target.url,
    targetId: target.id,
    statusCode: 200,
    latencyMs: latency,
    cached: false,
    rateLimitRemaining: rateLimit.remaining,
  });

  res.status(200).json(mockResponseData);
});
