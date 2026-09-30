/**
 * API Gateway & Microservices Client SDK
 * Provides typed interface for route inspection, load balancing strategy benchmarks,
 * in-memory cache purging, service discovery, message queue pub/sub, DLQ management,
 * and circuit breaker health metrics.
 */

export interface GatewayRoute {
  id: string;
  pathPattern: string;
  method: string;
  targets: Array<{
    id: string;
    name: string;
    url: string;
    weight: number;
    activeConnections: number;
    avgLatencyMs: number;
    healthy: boolean;
    failureCount: number;
  }>;
  strategy: "round-robin" | "least-connections" | "weighted" | "latency-aware" | "ip-hash";
  requiresAuth: boolean;
  rateLimitTier?: string;
  cacheTtlSeconds?: number;
  cacheTags?: string[];
  enabled: boolean;
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

export interface MicroserviceNode {
  id: string;
  name: string;
  version: string;
  endpointUrl: string;
  status: "HEALTHY" | "DEGRADED" | "OFFLINE";
  capabilities: string[];
  lastHeartbeat: number;
  avgLatencyMs: number;
  requestCount: number;
  errorCount: number;
  circuitBreakerState: "CLOSED" | "OPEN" | "HALF_OPEN";
}

export interface QueueMessage {
  id: string;
  topic: string;
  exchange: string;
  routingKey: string;
  payload: any;
  headers: {
    traceId: string;
    spanId: string;
    sourceService: string;
    timestamp: number;
    retryCount: number;
    maxRetries: number;
  };
  status: "QUEUED" | "PROCESSING" | "ACKNOWLEDGED" | "FAILED" | "DEAD_LETTER";
  error?: string;
  deliveredTo: string[];
  createdAt: number;
  processedAt?: number;
}

export interface CircuitBreakerDetail {
  serviceId: string;
  serviceName: string;
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  failures: number;
  consecutiveSuccesses: number;
  lastStateChange: number;
  config: {
    failureThreshold: number;
    recoveryTimeoutMs: number;
    halfOpenMaxTrials: number;
    timeoutMs: number;
  };
}

export class MicroservicesService {
  // --- Gateway API ---
  public async getGatewayMetrics(): Promise<{ metrics: GatewayMetrics; totalRoutes: number; totalCachedEntries: number; tiers: any }> {
    try {
      const res = await fetch("/api/gateway/metrics");
      if (res.ok) return await res.json();
    } catch {}
    return {
      metrics: { totalRequests: 0, totalErrors: 0, cachedRequests: 0, activeConnections: 0, p50LatencyMs: 0, p95LatencyMs: 0, p99LatencyMs: 0, bytesServed: 0, cacheHitRatio: 0, statusCodes: { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 } },
      totalRoutes: 0,
      totalCachedEntries: 0,
      tiers: {},
    };
  }

  public async getGatewayRoutes(): Promise<GatewayRoute[]> {
    try {
      const res = await fetch("/api/gateway/routes");
      if (res.ok) {
        const data = await res.json();
        return data.routes || [];
      }
    } catch {}
    return [];
  }

  public async getGatewayLogs(limit = 40): Promise<any[]> {
    try {
      const res = await fetch(`/api/gateway/logs?limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        return data.logs || [];
      }
    } catch {}
    return [];
  }

  public async getGatewayCache(): Promise<any[]> {
    try {
      const res = await fetch("/api/gateway/cache");
      if (res.ok) {
        const data = await res.json();
        return data.entries || [];
      }
    } catch {}
    return [];
  }

  public async flushGatewayCache(): Promise<boolean> {
    try {
      const res = await fetch("/api/gateway/cache/flush", { method: "POST" });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async testGatewayDispatch(pathPattern = "/api/gateway/agents/dispatch", iterations = 10): Promise<any> {
    try {
      const res = await fetch("/api/gateway/test-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathPattern, iterations }),
      });
      if (res.ok) return await res.json();
    } catch (e: any) {
      return { error: e.message };
    }
  }

  // --- Microservices Mesh & Discovery ---
  public async getMicroservices(): Promise<MicroserviceNode[]> {
    try {
      const res = await fetch("/api/microservices/services");
      if (res.ok) {
        const data = await res.json();
        return data.services || [];
      }
    } catch {}
    return [];
  }

  public async sendHeartbeat(serviceId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/microservices/heartbeat/${serviceId}`, { method: "POST" });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async invokeService(targetService: string, endpoint = "/process", payload: any = {}): Promise<any> {
    try {
      const res = await fetch("/api/microservices/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetService, endpoint, payload }),
      });
      if (res.ok) return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  // --- Message Queue (Kafka/RabbitMQ) ---
  public async getQueueMessages(): Promise<QueueMessage[]> {
    try {
      const res = await fetch("/api/microservices/queue/messages");
      if (res.ok) {
        const data = await res.json();
        return data.messages || [];
      }
    } catch {}
    return [];
  }

  public async publishMessage(topic: string, payload: any, exchange = "amq.topic"): Promise<any> {
    try {
      const res = await fetch("/api/microservices/queue/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, payload, exchange }),
      });
      if (res.ok) return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public async getDeadLetterQueue(): Promise<QueueMessage[]> {
    try {
      const res = await fetch("/api/microservices/queue/dlq");
      if (res.ok) {
        const data = await res.json();
        return data.dlq || [];
      }
    } catch {}
    return [];
  }

  public async replayDeadLetter(messageId: string): Promise<boolean> {
    try {
      const res = await fetch("/api/microservices/queue/dlq/replay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async purgeDeadLetter(): Promise<boolean> {
    try {
      const res = await fetch("/api/microservices/queue/dlq/purge", { method: "POST" });
      return res.ok;
    } catch {
      return false;
    }
  }

  // --- Circuit Breakers ---
  public async getCircuitBreakers(): Promise<CircuitBreakerDetail[]> {
    try {
      const res = await fetch("/api/microservices/circuit-breakers");
      if (res.ok) {
        const data = await res.json();
        return data.circuitBreakers || [];
      }
    } catch {}
    return [];
  }

  public async tripCircuitBreaker(serviceId: string): Promise<boolean> {
    try {
      const res = await fetch("/api/microservices/circuit-breakers/trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async resetCircuitBreaker(serviceId: string): Promise<boolean> {
    try {
      const res = await fetch("/api/microservices/circuit-breakers/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const microservicesService = new MicroservicesService();
