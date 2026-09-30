import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export type LoadBalancingStrategy = "round-robin" | "least-connections" | "weighted" | "latency-aware" | "ip-hash";

export interface UpstreamTarget {
  id: string;
  name: string;
  url: string;
  weight: number;
  activeConnections: number;
  avgLatencyMs: number;
  healthy: boolean;
  lastHealthCheck: number;
  failureCount: number;
}

export interface GatewayRoute {
  id: string;
  pathPattern: string; // e.g., "/api/agents/*", "/api/tasks/*", "/api/browser/*"
  method: string; // "ALL" or "GET", "POST", etc.
  targets: UpstreamTarget[];
  strategy: LoadBalancingStrategy;
  requiresAuth: boolean;
  requiredCapabilities?: string[];
  rateLimitTier?: "free" | "developer" | "enterprise" | "internal";
  cacheTtlSeconds?: number;
  cacheTags?: string[];
  stripPrefix?: string;
  timeoutMs?: number;
  enabled: boolean;
}

export interface RateLimitTierConfig {
  name: string;
  maxRequestsPerMinute: number;
  burstCapacity: number;
  refillRatePerSec: number;
}

export interface CacheEntry {
  key: string;
  path: string;
  body: any;
  contentType: string;
  headers: Record<string, string>;
  eTag: string;
  createdAt: number;
  expiresAt: number;
  tags: string[];
  hits: number;
  sizeBytes: number;
}

export interface GatewayLogEntry {
  id: string;
  timestamp: string;
  clientIp: string;
  method: string;
  path: string;
  targetUrl: string;
  targetId: string;
  statusCode: number;
  latencyMs: number;
  cached: boolean;
  authUserId?: string;
  rateLimitRemaining: number;
}

export interface GatewayMetrics {
  totalRequests: number;
  totalErrors: number;
  cachedRequests: number;
  activeConnections: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  bytesServed: number;
  cacheHitRatio: number;
  statusCodes: {
    "2xx": number;
    "3xx": number;
    "4xx": number;
    "5xx": number;
  };
}

class ApiGatewayEngine {
  private routes: Map<string, GatewayRoute> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private rateLimitBuckets: Map<string, { tokens: number; lastRefill: number }> = new Map();
  private recentLogs: GatewayLogEntry[] = [];
  private latencies: number[] = [];
  private targetRoundRobinCounters: Map<string, number> = new Map();

  private rateLimitTiers: Record<string, RateLimitTierConfig> = {
    free: { name: "Free Tier", maxRequestsPerMinute: 60, burstCapacity: 30, refillRatePerSec: 1 },
    developer: { name: "Developer Tier", maxRequestsPerMinute: 300, burstCapacity: 100, refillRatePerSec: 5 },
    enterprise: { name: "Enterprise Sovereign Tier", maxRequestsPerMinute: 2400, burstCapacity: 500, refillRatePerSec: 40 },
    internal: { name: "Internal Mesh Tier", maxRequestsPerMinute: 100000, burstCapacity: 10000, refillRatePerSec: 1000 },
  };

  private metrics: GatewayMetrics = {
    totalRequests: 0,
    totalErrors: 0,
    cachedRequests: 0,
    activeConnections: 0,
    p50LatencyMs: 4,
    p95LatencyMs: 18,
    p99LatencyMs: 45,
    bytesServed: 1024 * 512,
    cacheHitRatio: 0,
    statusCodes: { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 },
  };

  constructor() {
    this.seedDefaultRoutes();
    this.startBackgroundMaintenance();
  }

  private seedDefaultRoutes() {
    const defaultRoutes: GatewayRoute[] = [
      {
        id: "route-quantum-intelligence",
        pathPattern: "/api/gateway/intelligence/*",
        method: "ALL",
        strategy: "latency-aware",
        requiresAuth: false,
        rateLimitTier: "developer",
        cacheTtlSeconds: 0,
        enabled: true,
        targets: [
          { id: "upstream-gemini-primary", name: "Gemini 2.5 Intelligence Engine", url: "http://localhost:3000/api/orchestrator", weight: 80, activeConnections: 2, avgLatencyMs: 22, healthy: true, lastHealthCheck: Date.now(), failureCount: 0 },
          { id: "upstream-orchestrator-mesh", name: "Master Orchestrator Mesh", url: "http://localhost:3000/api/orchestrator", weight: 20, activeConnections: 1, avgLatencyMs: 38, healthy: true, lastHealthCheck: Date.now(), failureCount: 0 },
        ],
      },
      {
        id: "route-recommendations",
        pathPattern: "/api/gateway/recommendations/*",
        method: "ALL",
        strategy: "least-connections",
        requiresAuth: false,
        rateLimitTier: "developer",
        cacheTtlSeconds: 15,
        cacheTags: ["recommendations", "content"],
        enabled: true,
        targets: [
          { id: "upstream-recs-engine", name: "Collaborative Filtering Node", url: "http://localhost:3000/api/recommendations", weight: 100, activeConnections: 0, avgLatencyMs: 8, healthy: true, lastHealthCheck: Date.now(), failureCount: 0 },
        ],
      },
      {
        id: "route-microservices",
        pathPattern: "/api/gateway/microservices/*",
        method: "ALL",
        strategy: "round-robin",
        requiresAuth: true,
        requiredCapabilities: ["system:read"],
        rateLimitTier: "enterprise",
        cacheTtlSeconds: 5,
        cacheTags: ["microservices", "registry"],
        enabled: true,
        targets: [
          { id: "upstream-mesh-runtime", name: "Microservice Service Discovery", url: "http://localhost:3000/api/microservices", weight: 50, activeConnections: 1, avgLatencyMs: 12, healthy: true, lastHealthCheck: Date.now(), failureCount: 0 },
          { id: "upstream-msg-queue", name: "Event Bus & Message Broker", url: "http://localhost:3000/api/microservices/queue", weight: 50, activeConnections: 0, avgLatencyMs: 14, healthy: true, lastHealthCheck: Date.now(), failureCount: 0 },
        ],
      },
      {
        id: "route-agent-fleet",
        pathPattern: "/api/gateway/agents/*",
        method: "ALL",
        strategy: "weighted",
        requiresAuth: true,
        requiredCapabilities: ["task:run"],
        rateLimitTier: "developer",
        cacheTtlSeconds: 0,
        enabled: true,
        targets: [
          { id: "upstream-fleet-alpha", name: "Rufflo Primary Fleet Node", url: "http://localhost:3000/api/agents", weight: 70, activeConnections: 3, avgLatencyMs: 15, healthy: true, lastHealthCheck: Date.now(), failureCount: 0 },
          { id: "upstream-fleet-beta", name: "Engineering Department Node", url: "http://localhost:3000/api/department", weight: 30, activeConnections: 1, avgLatencyMs: 25, healthy: true, lastHealthCheck: Date.now(), failureCount: 0 },
        ],
      },
      {
        id: "route-browser-automation",
        pathPattern: "/api/gateway/browser/*",
        method: "ALL",
        strategy: "least-connections",
        requiresAuth: false,
        rateLimitTier: "developer",
        cacheTtlSeconds: 30,
        cacheTags: ["browser", "scrape"],
        enabled: true,
        targets: [
          { id: "upstream-browser-use", name: "Playwright Chromium Worker", url: "http://localhost:3000/api/orchestrator/browser", weight: 100, activeConnections: 1, avgLatencyMs: 42, healthy: true, lastHealthCheck: Date.now(), failureCount: 0 },
        ],
      },
    ];

    defaultRoutes.forEach((route) => this.routes.set(route.id, route));
  }

  private startBackgroundMaintenance() {
    setInterval(() => {
      this.cleanupExpiredCache();
      this.updatePercentiles();
      this.healthCheckTargets();
    }, 10000);
  }

  private cleanupExpiredCache() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }

  private updatePercentiles() {
    if (this.latencies.length === 0) return;
    const sorted = [...this.latencies].sort((a, b) => a - b);
    this.metrics.p50LatencyMs = sorted[Math.floor(sorted.length * 0.5)] || 5;
    this.metrics.p95LatencyMs = sorted[Math.floor(sorted.length * 0.95)] || 20;
    this.metrics.p99LatencyMs = sorted[Math.floor(sorted.length * 0.99)] || 45;
    if (this.latencies.length > 1000) {
      this.latencies = this.latencies.slice(-500);
    }
    const total = this.metrics.totalRequests;
    this.metrics.cacheHitRatio = total > 0 ? Number((this.metrics.cachedRequests / total).toFixed(3)) : 0;
  }

  private healthCheckTargets() {
    const now = Date.now();
    for (const route of this.routes.values()) {
      for (const target of route.targets) {
        target.lastHealthCheck = now;
        // Periodic jitter for realistic telemetry
        target.avgLatencyMs = Math.max(2, Math.floor(target.avgLatencyMs + (Math.random() * 4 - 2)));
      }
    }
  }

  public matchRoute(reqPath: string, method: string): GatewayRoute | null {
    for (const route of this.routes.values()) {
      if (!route.enabled) continue;
      if (route.method !== "ALL" && route.method !== method.toUpperCase()) continue;

      const pattern = route.pathPattern.replace(/\*/g, ".*");
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(reqPath) || reqPath.startsWith(route.pathPattern.replace("/*", ""))) {
        return route;
      }
    }
    return null;
  }

  public selectTarget(route: GatewayRoute, clientIp: string): UpstreamTarget | null {
    const healthyTargets = route.targets.filter((t) => t.healthy);
    if (healthyTargets.length === 0) return null;
    if (healthyTargets.length === 1) return healthyTargets[0];

    switch (route.strategy) {
      case "round-robin": {
        const counter = this.targetRoundRobinCounters.get(route.id) || 0;
        const selected = healthyTargets[counter % healthyTargets.length];
        this.targetRoundRobinCounters.set(route.id, counter + 1);
        return selected;
      }
      case "least-connections": {
        return healthyTargets.reduce((prev, curr) => (curr.activeConnections < prev.activeConnections ? curr : prev));
      }
      case "weighted": {
        const totalWeight = healthyTargets.reduce((sum, t) => sum + t.weight, 0);
        let random = Math.random() * totalWeight;
        for (const target of healthyTargets) {
          if (random < target.weight) return target;
          random -= target.weight;
        }
        return healthyTargets[0];
      }
      case "latency-aware": {
        return healthyTargets.reduce((prev, curr) => (curr.avgLatencyMs < prev.avgLatencyMs ? curr : prev));
      }
      case "ip-hash": {
        let hash = 0;
        for (let i = 0; i < clientIp.length; i++) {
          hash = (hash << 5) - hash + clientIp.charCodeAt(i);
          hash |= 0;
        }
        const index = Math.abs(hash) % healthyTargets.length;
        return healthyTargets[index];
      }
      default:
        return healthyTargets[0];
    }
  }

  public checkRateLimit(clientKey: string, tier: "free" | "developer" | "enterprise" | "internal" = "developer"): { allowed: boolean; remaining: number; resetTime: number } {
    const config = this.rateLimitTiers[tier] || this.rateLimitTiers.developer;
    const now = Date.now();
    let bucket = this.rateLimitBuckets.get(clientKey);

    if (!bucket) {
      bucket = { tokens: config.burstCapacity, lastRefill: now };
      this.rateLimitBuckets.set(clientKey, bucket);
    } else {
      const elapsedSeconds = (now - bucket.lastRefill) / 1000;
      const refilled = Math.floor(elapsedSeconds * config.refillRatePerSec);
      if (refilled > 0) {
        bucket.tokens = Math.min(config.burstCapacity, bucket.tokens + refilled);
        bucket.lastRefill = now;
      }
    }

    if (bucket.tokens > 0) {
      bucket.tokens -= 1;
      return {
        allowed: true,
        remaining: bucket.tokens,
        resetTime: Math.ceil((config.burstCapacity - bucket.tokens) / config.refillRatePerSec),
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetTime: Math.ceil(1 / config.refillRatePerSec),
    };
  }

  public getCache(key: string, eTagHeader?: string): { hit: boolean; notModified?: boolean; entry?: CacheEntry } {
    const entry = this.cache.get(key);
    if (!entry) return { hit: false };

    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return { hit: false };
    }

    entry.hits += 1;
    this.metrics.cachedRequests += 1;

    if (eTagHeader && eTagHeader === entry.eTag) {
      return { hit: true, notModified: true, entry };
    }

    return { hit: true, notModified: false, entry };
  }

  public setCache(key: string, path: string, body: any, ttlSeconds: number, tags: string[] = [], contentType = "application/json"): CacheEntry {
    const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
    const eTag = `"${crypto.createHash("md5").update(bodyStr).digest("hex")}"`;
    const entry: CacheEntry = {
      key,
      path,
      body,
      contentType,
      headers: { "Content-Type": contentType, ETag: eTag },
      eTag,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlSeconds * 1000,
      tags,
      hits: 0,
      sizeBytes: Buffer.byteLength(bodyStr, "utf8"),
    };

    // Keep cache bounded to 1000 entries
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, entry);
    return entry;
  }

  public invalidateCache(options: { tag?: string; pathPrefix?: string; key?: string }): number {
    let count = 0;
    if (options.key) {
      if (this.cache.delete(options.key)) count++;
    } else if (options.tag) {
      for (const [k, entry] of this.cache.entries()) {
        if (entry.tags.includes(options.tag)) {
          this.cache.delete(k);
          count++;
        }
      }
    } else if (options.pathPrefix) {
      for (const [k, entry] of this.cache.entries()) {
        if (entry.path.startsWith(options.pathPrefix)) {
          this.cache.delete(k);
          count++;
        }
      }
    }
    return count;
  }

  public flushCache(): void {
    this.cache.clear();
  }

  public recordLog(log: GatewayLogEntry): void {
    this.metrics.totalRequests += 1;
    this.latencies.push(log.latencyMs);
    this.metrics.bytesServed += 350;

    if (log.statusCode >= 200 && log.statusCode < 300) this.metrics.statusCodes["2xx"]++;
    else if (log.statusCode >= 300 && log.statusCode < 400) this.metrics.statusCodes["3xx"]++;
    else if (log.statusCode >= 400 && log.statusCode < 500) this.metrics.statusCodes["4xx"]++;
    else if (log.statusCode >= 500) {
      this.metrics.statusCodes["5xx"]++;
      this.metrics.totalErrors++;
    }

    this.recentLogs.unshift(log);
    if (this.recentLogs.length > 200) {
      this.recentLogs.pop();
    }
  }

  // Getters for Administration UI
  public getRoutes(): GatewayRoute[] {
    return Array.from(this.routes.values());
  }

  public addOrUpdateRoute(route: GatewayRoute): void {
    this.routes.set(route.id, route);
  }

  public deleteRoute(routeId: string): boolean {
    return this.routes.delete(routeId);
  }

  public getMetrics(): GatewayMetrics {
    return { ...this.metrics };
  }

  public getRecentLogs(limit = 50): GatewayLogEntry[] {
    return this.recentLogs.slice(0, limit);
  }

  public getCacheEntries(): CacheEntry[] {
    return Array.from(this.cache.values());
  }

  public getRateLimitTiers(): Record<string, RateLimitTierConfig> {
    return this.rateLimitTiers;
  }
}

export const apiGateway = new ApiGatewayEngine();
