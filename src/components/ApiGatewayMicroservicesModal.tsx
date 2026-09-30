import React, { useState, useEffect } from "react";
import {
  Network,
  Server,
  Layers,
  Sparkles,
  Radio,
  ShieldCheck,
  Zap,
  RefreshCw,
  Trash2,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Gauge,
  Database,
  ArrowRight,
  TrendingUp,
  Cpu,
  Clock,
  Key
} from "lucide-react";
import {
  microservicesService,
  GatewayRoute,
  GatewayMetrics,
  MicroserviceNode,
  QueueMessage,
  CircuitBreakerDetail
} from "../utils/microservicesService";
import {
  recommendationService,
  RecommendedItem,
  UserBehaviorEvent
} from "../utils/recommendationService";

interface ApiGatewayMicroservicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "gateway" | "recommendations" | "microservices" | "queue" | "circuit_breakers";

export const ApiGatewayMicroservicesModal: React.FC<ApiGatewayMicroservicesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("gateway");
  const [routes, setRoutes] = useState<GatewayRoute[]>([]);
  const [metrics, setMetrics] = useState<GatewayMetrics | null>(null);
  const [cacheEntries, setCacheEntries] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [services, setServices] = useState<MicroserviceNode[]>([]);
  const [messages, setMessages] = useState<QueueMessage[]>([]);
  const [dlq, setDlq] = useState<QueueMessage[]>([]);
  const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreakerDetail[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [trending, setTrending] = useState<RecommendedItem[]>([]);
  const [events, setEvents] = useState<UserBehaviorEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Dispatch Simulator State
  const [testPattern, setTestPattern] = useState("/api/gateway/agents/dispatch");
  const [testIterations, setTestIterations] = useState(6);
  const [testResult, setTestResult] = useState<any | null>(null);

  // Message Queue Publisher State
  const [publishTopic, setPublishTopic] = useState("events.telemetry");
  const [publishPayload, setPublishPayload] = useState('{"type":"agent_health","status":"optimal","load":0.24}');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        metricsData,
        routesData,
        cacheData,
        logsData,
        servicesData,
        queueData,
        dlqData,
        breakersData,
        recsData,
        trendingData,
        eventsData,
      ] = await Promise.all([
        microservicesService.getGatewayMetrics(),
        microservicesService.getGatewayRoutes(),
        microservicesService.getGatewayCache(),
        microservicesService.getGatewayLogs(30),
        microservicesService.getMicroservices(),
        microservicesService.getQueueMessages(),
        microservicesService.getDeadLetterQueue(),
        microservicesService.getCircuitBreakers(),
        recommendationService.getPersonalized("dev-admin-user", 6),
        recommendationService.getTrending(6),
        recommendationService.getEvents(25),
      ]);

      setMetrics(metricsData.metrics);
      setRoutes(routesData);
      setCacheEntries(cacheData);
      setLogs(logsData);
      setServices(servicesData);
      setMessages(queueData);
      setDlq(dlqData);
      setCircuitBreakers(breakersData);
      setRecommendations(recsData);
      setTrending(trendingData);
      setEvents(eventsData.events);
    } catch (e) {
      console.error("Error loading gateway/microservices data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllData();
      const interval = setInterval(loadAllData, 6000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleFlushCache = async () => {
    const ok = await microservicesService.flushGatewayCache();
    if (ok) {
      showNotification("Gateway in-memory cache flushed successfully!");
      setCacheEntries([]);
    }
  };

  const handleTestDispatch = async () => {
    setLoading(true);
    const result = await microservicesService.testGatewayDispatch(testPattern, testIterations);
    setTestResult(result);
    setLoading(false);
    showNotification(`Simulated ${testIterations} requests via ${result?.strategy || "Load Balancer"}`);
  };

  const handlePublishMessage = async () => {
    try {
      const parsed = JSON.parse(publishPayload);
      const res = await microservicesService.publishMessage(publishTopic, parsed);
      if (res.success) {
        showNotification(`Message published to topic '${publishTopic}' (ID: ${res.message.id})`);
        loadAllData();
      }
    } catch (e: any) {
      showNotification(`Invalid JSON payload: ${e.message}`);
    }
  };

  const handleReplayDlq = async (msgId: string) => {
    const ok = await microservicesService.replayDeadLetter(msgId);
    if (ok) {
      showNotification(`Replayed message '${msgId}' from Dead Letter Queue.`);
      loadAllData();
    }
  };

  const handlePurgeDlq = async () => {
    const ok = await microservicesService.purgeDeadLetter();
    if (ok) {
      showNotification("Dead Letter Queue purged completely.");
      setDlq([]);
    }
  };

  const handleTripBreaker = async (serviceId: string) => {
    const ok = await microservicesService.tripCircuitBreaker(serviceId);
    if (ok) {
      showNotification(`Tripped Circuit Breaker for service '${serviceId}' (State: OPEN)`);
      loadAllData();
    }
  };

  const handleResetBreaker = async (serviceId: string) => {
    const ok = await microservicesService.resetCircuitBreaker(serviceId);
    if (ok) {
      showNotification(`Reset Circuit Breaker for service '${serviceId}' (State: CLOSED)`);
      loadAllData();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 12, 14, 0.85)",
        backdropFilter: "blur(10px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1240px",
          height: "92vh",
          backgroundColor: "#16191b",
          border: "1px solid #2d3338",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 60px -15px rgba(0,0,0,0.8), 0 0 40px rgba(52, 211, 153, 0.1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            background: "#1c2125",
            borderBottom: "1px solid #2d3338",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #10b981, #047857)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
              }}
            >
              <Network style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#f3f4f6" }}>
                  Enterprise API Gateway & Microservices Hub
                </h2>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#34d399",
                    background: "rgba(52, 211, 153, 0.12)",
                    border: "1px solid rgba(52, 211, 153, 0.3)",
                    padding: "2px 8px",
                    borderRadius: "12px",
                  }}
                >
                  v2.6.0 Quantum Mesh
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>
                Single entry point routing, rate limiting, collaborative recommendations & fault-tolerant microservices
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={loadAllData}
              disabled={loading}
              style={{
                background: "#282e33",
                border: "1px solid #3f474e",
                color: "#d1d5db",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <RefreshCw style={{ width: 14, height: 14 }} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#9ca3af",
                fontSize: "20px",
                cursor: "pointer",
                padding: "4px 8px",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Action Alert Banner */}
        {actionMessage && (
          <div
            style={{
              padding: "10px 24px",
              background: "rgba(52, 211, 153, 0.15)",
              borderBottom: "1px solid rgba(52, 211, 153, 0.3)",
              color: "#34d399",
              fontSize: "12.5px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CheckCircle2 style={{ width: 16, height: 16 }} />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Top Metric Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "12px",
            padding: "16px 24px",
            background: "#181b1e",
            borderBottom: "1px solid #282e33",
          }}
        >
          <div style={{ background: "#1f2428", padding: "12px 16px", borderRadius: "10px", border: "1px solid #2d343a" }}>
            <div style={{ fontSize: "11px", color: "#9ca3af", display: "flex", alignItems: "center", gap: 6 }}>
              <Activity style={{ width: 13, height: 13, color: "#34d399" }} />
              <span>Total Gateway Requests</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#f3f4f6", marginTop: 4 }}>
              {(metrics?.totalRequests || 428).toLocaleString()}
            </div>
          </div>

          <div style={{ background: "#1f2428", padding: "12px 16px", borderRadius: "10px", border: "1px solid #2d343a" }}>
            <div style={{ fontSize: "11px", color: "#9ca3af", display: "flex", alignItems: "center", gap: 6 }}>
              <Zap style={{ width: 13, height: 13, color: "#38bdf8" }} />
              <span>P95 Latency</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#38bdf8", marginTop: 4 }}>
              {metrics?.p95LatencyMs || 18} ms
            </div>
          </div>

          <div style={{ background: "#1f2428", padding: "12px 16px", borderRadius: "10px", border: "1px solid #2d343a" }}>
            <div style={{ fontSize: "11px", color: "#9ca3af", display: "flex", alignItems: "center", gap: 6 }}>
              <Database style={{ width: 13, height: 13, color: "#a78bfa" }} />
              <span>Cache Hit Ratio</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#a78bfa", marginTop: 4 }}>
              {Math.round((metrics?.cacheHitRatio || 0.42) * 100)}%
            </div>
          </div>

          <div style={{ background: "#1f2428", padding: "12px 16px", borderRadius: "10px", border: "1px solid #2d343a" }}>
            <div style={{ fontSize: "11px", color: "#9ca3af", display: "flex", alignItems: "center", gap: 6 }}>
              <Server style={{ width: 13, height: 13, color: "#4ade80" }} />
              <span>Healthy Microservices</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#4ade80", marginTop: 4 }}>
              {services.filter((s) => s.status === "HEALTHY").length} / {services.length || 7}
            </div>
          </div>

          <div style={{ background: "#1f2428", padding: "12px 16px", borderRadius: "10px", border: "1px solid #2d343a" }}>
            <div style={{ fontSize: "11px", color: "#9ca3af", display: "flex", alignItems: "center", gap: 6 }}>
              <Radio style={{ width: 13, height: 13, color: "#f59e0b" }} />
              <span>DLQ Messages</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: dlq.length > 0 ? "#ef4444" : "#f59e0b", marginTop: 4 }}>
              {dlq.length}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            background: "#1c2024",
            borderBottom: "1px solid #2d343a",
            padding: "0 24px",
            gap: "8px",
          }}
        >
          {[
            { id: "gateway", label: "API Gateway & Routing", icon: Network },
            { id: "recommendations", label: "Recommendation Engine & Intelligence", icon: Sparkles },
            { id: "microservices", label: "Microservices & Discovery", icon: Server },
            { id: "queue", label: "Message Queue (Kafka/RabbitMQ)", icon: Radio },
            { id: "circuit_breakers", label: "Fault Tolerance & Circuit Breakers", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                style={{
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  borderBottom: active ? "2px solid #34d399" : "2px solid transparent",
                  color: active ? "#34d399" : "#9ca3af",
                  fontWeight: active ? "600" : "400",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.15s",
                }}
              >
                <Icon style={{ width: 15, height: 15 }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Tab Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", background: "#14171a" }}>
          {/* TAB 1: API GATEWAY */}
          {activeTab === "gateway" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Route Table */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: "15px", color: "#f3f4f6", display: "flex", alignItems: "center", gap: 8 }}>
                    <Network style={{ width: 16, height: 16, color: "#34d399" }} />
                    <span>Active Gateway Route Definitions</span>
                  </h3>
                  <span style={{ fontSize: "12px", color: "#9ca3af" }}>Unified Entrypoint: <code>/api/gateway/proxy/*</code></span>
                </div>

                <div style={{ border: "1px solid #282f35", borderRadius: "10px", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                    <thead>
                      <tr style={{ background: "#1f252b", color: "#9ca3af", textAlign: "left" }}>
                        <th style={{ padding: "10px 14px" }}>Route Pattern</th>
                        <th style={{ padding: "10px 14px" }}>Strategy</th>
                        <th style={{ padding: "10px 14px" }}>Upstream Targets</th>
                        <th style={{ padding: "10px 14px" }}>Auth & Rate Limit</th>
                        <th style={{ padding: "10px 14px" }}>Caching TTL</th>
                        <th style={{ padding: "10px 14px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routes.map((route) => (
                        <tr key={route.id} style={{ borderBottom: "1px solid #232930", background: "#181d22" }}>
                          <td style={{ padding: "12px 14px", fontFamily: "monospace", color: "#e5e7eb", fontWeight: "bold" }}>
                            {route.pathPattern}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ background: "#28323a", color: "#38bdf8", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "600" }}>
                              {route.strategy.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              {route.targets.map((t) => (
                                <span key={t.id} style={{ fontSize: "11.5px", color: "#cbd5e1" }}>
                                  • {t.name} <span style={{ color: "#9ca3af" }}>({t.avgLatencyMs}ms | w:{t.weight})</span>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px", color: "#9ca3af" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {route.requiresAuth ? (
                                <span style={{ color: "#34d399", display: "flex", alignItems: "center", gap: 3, fontSize: "11px" }}>
                                  <Key style={{ width: 12, height: 12 }} /> Auth Required
                                </span>
                              ) : (
                                <span style={{ color: "#9ca3af", fontSize: "11px" }}>Public Gateway</span>
                              )}
                              <span style={{ background: "#2d3339", padding: "1px 6px", borderRadius: 4, fontSize: "10px" }}>
                                {route.rateLimitTier || "dev"}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            {route.cacheTtlSeconds && route.cacheTtlSeconds > 0 ? (
                              <span style={{ color: "#a78bfa", fontWeight: "600" }}>{route.cacheTtlSeconds}s</span>
                            ) : (
                              <span style={{ color: "#6b7280" }}>Disabled</span>
                            )}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ color: route.enabled ? "#34d399" : "#ef4444", fontWeight: "bold" }}>
                              ● {route.enabled ? "ACTIVE" : "PAUSED"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Load Balancer Simulation & Cache Layer */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Simulator */}
                <div style={{ background: "#1a1f24", padding: "18px", borderRadius: "12px", border: "1px solid #2d343a" }}>
                  <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#f3f4f6", display: "flex", alignItems: "center", gap: 8 }}>
                    <Zap style={{ width: 16, height: 16, color: "#38bdf8" }} />
                    <span>Load Balancing & Routing Simulator</span>
                  </h4>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                    <input
                      type="text"
                      value={testPattern}
                      onChange={(e) => setTestPattern(e.target.value)}
                      placeholder="/api/gateway/agents/*"
                      style={{
                        flex: 1,
                        background: "#121518",
                        border: "1px solid #333a42",
                        borderRadius: "8px",
                        color: "#fff",
                        padding: "8px 12px",
                        fontSize: "12.5px",
                      }}
                    />
                    <button
                      onClick={handleTestDispatch}
                      disabled={loading}
                      style={{
                        background: "#0284c7",
                        color: "#fff",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Play style={{ width: 13, height: 13 }} />
                      <span>Dispatch {testIterations}x</span>
                    </button>
                  </div>

                  {testResult && (
                    <div style={{ background: "#131619", padding: "12px", borderRadius: "8px", border: "1px solid #252b31" }}>
                      <div style={{ fontSize: "11px", color: "#38bdf8", fontWeight: "bold", marginBottom: 6 }}>
                        Strategy: {testResult.strategy?.toUpperCase()} • {testResult.totalDispatched} Requests Dispatched
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: "140px", overflowY: "auto" }}>
                        {testResult.dispatches?.map((d: any) => (
                          <div key={d.index} style={{ fontSize: "11px", color: "#cbd5e1", display: "flex", justifyContent: "space-between" }}>
                            <span>Req #{d.index} ➔ <strong>{d.targetName}</strong></span>
                            <span style={{ color: "#34d399" }}>{d.latencyMs}ms</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* In-Memory Cache Manager */}
                <div style={{ background: "#1a1f24", padding: "18px", borderRadius: "12px", border: "1px solid #2d343a" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <h4 style={{ margin: 0, fontSize: "14px", color: "#f3f4f6", display: "flex", alignItems: "center", gap: 8 }}>
                      <Database style={{ width: 16, height: 16, color: "#a78bfa" }} />
                      <span>In-Memory Gateway Cache ({cacheEntries.length})</span>
                    </h4>
                    <button
                      onClick={handleFlushCache}
                      style={{
                        background: "#37243c",
                        border: "1px solid #6b21a8",
                        color: "#c084fc",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Trash2 style={{ width: 12, height: 12 }} />
                      <span>Flush All</span>
                    </button>
                  </div>

                  <div style={{ maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                    {cacheEntries.length === 0 ? (
                      <div style={{ color: "#6b7280", fontSize: "12px", textAlign: "center", padding: "20px" }}>
                        No cached responses currently in memory. GET requests with TTL will populate here.
                      </div>
                    ) : (
                      cacheEntries.map((c, idx) => (
                        <div key={idx} style={{ background: "#14171a", padding: "8px 12px", borderRadius: "6px", border: "1px solid #252b31", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: "11.5px", color: "#e5e7eb", fontFamily: "monospace" }}>{c.path}</div>
                            <div style={{ fontSize: "10px", color: "#9ca3af" }}>Hits: {c.hits} • {c.sizeBytes} bytes</div>
                          </div>
                          <span style={{ fontSize: "11px", color: "#a78bfa", fontWeight: "600" }}>{c.expiresInSec}s left</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RECOMMENDATION SYSTEM */}
          {activeTab === "recommendations" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
                {/* Personalized & Trending Recommendations */}
                <div>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#f3f4f6", display: "flex", alignItems: "center", gap: 8 }}>
                    <Sparkles style={{ width: 16, height: 16, color: "#fabd2f" }} />
                    <span>Personalized & Collaborative Recommendations</span>
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {recommendations.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          background: "#1a1f24",
                          border: "1px solid #2d343a",
                          borderRadius: "10px",
                          padding: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: "bold", color: "#f3f4f6", fontSize: "13.5px" }}>{item.title}</span>
                            <span style={{ background: "#283038", color: "#fabd2f", fontSize: "10px", fontWeight: "600", padding: "1px 6px", borderRadius: 4 }}>
                              {item.itemType.toUpperCase()}
                            </span>
                            <span style={{ color: "#34d399", fontSize: "11px", fontWeight: "600" }}>
                              {Math.round(item.score * 100)}% Match
                            </span>
                          </div>
                          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#9ca3af" }}>{item.description}</p>
                          <div style={{ marginTop: 6, fontSize: "11px", color: "#6b7280" }}>
                            Reason: <span style={{ color: "#d1d5db" }}>{item.reason}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Behavior Tracking Event Stream */}
                <div>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#f3f4f6", display: "flex", alignItems: "center", gap: 8 }}>
                    <Activity style={{ width: 16, height: 16, color: "#38bdf8" }} />
                    <span>Real-time Behavior Telemetry Events</span>
                  </h3>
                  <div style={{ background: "#181d22", border: "1px solid #282f35", borderRadius: "10px", padding: "12px", maxHeight: "420px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                    {events.map((evt) => (
                      <div key={evt.id} style={{ background: "#131619", padding: "8px 12px", borderRadius: "6px", border: "1px solid #232930", fontSize: "11.5px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af" }}>
                          <span style={{ color: "#38bdf8", fontWeight: "bold" }}>{evt.eventType.toUpperCase()}</span>
                          <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div style={{ color: "#e5e7eb", marginTop: 2, fontWeight: "500" }}>{evt.itemTitle}</div>
                        <div style={{ color: "#6b7280", fontSize: "10.5px", marginTop: 2 }}>Category: {evt.category} • Weight: {evt.weight}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MICROSERVICES MESH */}
          {activeTab === "microservices" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ margin: 0, fontSize: "15px", color: "#f3f4f6", display: "flex", alignItems: "center", gap: 8 }}>
                  <Server style={{ width: 16, height: 16, color: "#4ade80" }} />
                  <span>Service Discovery Registry & Health</span>
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
                {services.map((svc) => (
                  <div
                    key={svc.id}
                    style={{
                      background: "#1a1f24",
                      border: "1px solid #2d343a",
                      borderRadius: "12px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <h4 style={{ margin: 0, fontSize: "14px", color: "#f3f4f6" }}>{svc.name}</h4>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "bold",
                            color: svc.status === "HEALTHY" ? "#34d399" : svc.status === "DEGRADED" ? "#f59e0b" : "#ef4444",
                            background: svc.status === "HEALTHY" ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)",
                            padding: "2px 8px",
                            borderRadius: "10px",
                          }}
                        >
                          ● {svc.status}
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: 4, fontFamily: "monospace" }}>
                        {svc.endpointUrl} (v{svc.version})
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
                        {svc.capabilities.map((cap) => (
                          <span key={cap} style={{ background: "#283038", color: "#93c5fd", fontSize: "10px", padding: "2px 6px", borderRadius: 4 }}>
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid #282e34", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                        Latency: <span style={{ color: "#34d399", fontWeight: "bold" }}>{svc.avgLatencyMs}ms</span> • Requests: {svc.requestCount}
                      </div>
                      <button
                        onClick={async () => {
                          await microservicesService.sendHeartbeat(svc.id);
                          showNotification(`Heartbeat sent to '${svc.name}'`);
                          loadAllData();
                        }}
                        style={{
                          background: "#283038",
                          border: "1px solid #3f474e",
                          color: "#cbd5e1",
                          borderRadius: 6,
                          padding: "3px 8px",
                          fontSize: "11px",
                          cursor: "pointer",
                        }}
                      >
                        Ping
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MESSAGE QUEUE (KAFKA / RABBITMQ) */}
          {activeTab === "queue" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Publisher form */}
              <div style={{ background: "#1a1f24", padding: "16px", borderRadius: "12px", border: "1px solid #2d343a" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#f3f4f6", display: "flex", alignItems: "center", gap: 8 }}>
                  <Radio style={{ width: 15, height: 15, color: "#f59e0b" }} />
                  <span>Publish Test Event to Broker Topic</span>
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 120px", gap: "10px" }}>
                  <input
                    type="text"
                    value={publishTopic}
                    onChange={(e) => setPublishTopic(e.target.value)}
                    placeholder="events.telemetry"
                    style={{ background: "#121518", border: "1px solid #333a42", borderRadius: 8, color: "#fff", padding: "8px 12px", fontSize: "12.5px" }}
                  />
                  <input
                    type="text"
                    value={publishPayload}
                    onChange={(e) => setPublishPayload(e.target.value)}
                    placeholder='{"key": "value"}'
                    style={{ background: "#121518", border: "1px solid #333a42", borderRadius: 8, color: "#fff", padding: "8px 12px", fontSize: "12.5px" }}
                  />
                  <button
                    onClick={handlePublishMessage}
                    style={{ background: "#d97706", color: "#fff", border: "none", borderRadius: 8, fontWeight: "600", fontSize: "12px", cursor: "pointer" }}
                  >
                    Publish
                  </button>
                </div>
              </div>

              {/* Message Feed & DLQ */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
                {/* Active Message Stream */}
                <div>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#f3f4f6" }}>Active Event Bus Topics ({messages.length})</h4>
                  <div style={{ background: "#181d22", border: "1px solid #282f35", borderRadius: "10px", padding: "12px", maxHeight: "360px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                    {messages.map((m) => (
                      <div key={m.id} style={{ background: "#131619", padding: "10px 12px", borderRadius: "6px", border: "1px solid #232930", fontSize: "11.5px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af" }}>
                          <span style={{ color: "#f59e0b", fontWeight: "bold" }}>{m.topic}</span>
                          <span style={{ color: "#34d399" }}>{m.status}</span>
                        </div>
                        <div style={{ color: "#e5e7eb", marginTop: 4, fontFamily: "monospace" }}>{JSON.stringify(m.payload)}</div>
                        <div style={{ color: "#6b7280", fontSize: "10.5px", marginTop: 4 }}>
                          Delivered to: {m.deliveredTo?.join(", ") || "No active subscribers"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dead Letter Queue */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <h4 style={{ margin: 0, fontSize: "14px", color: "#f3f4f6", display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertTriangle style={{ width: 14, height: 14, color: "#ef4444" }} />
                      <span>Dead Letter Queue ({dlq.length})</span>
                    </h4>
                    {dlq.length > 0 && (
                      <button onClick={handlePurgeDlq} style={{ background: "#451a1a", border: "1px solid #7f1d1d", color: "#fca5a5", padding: "2px 8px", borderRadius: 4, fontSize: "11px", cursor: "pointer" }}>
                        Purge DLQ
                      </button>
                    )}
                  </div>

                  <div style={{ background: "#181d22", border: "1px solid #282f35", borderRadius: "10px", padding: "12px", maxHeight: "360px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                    {dlq.length === 0 ? (
                      <div style={{ color: "#6b7280", fontSize: "12px", textAlign: "center", padding: "30px" }}>
                        No failed or poison-pill messages in DLQ. All broker topics operating normally.
                      </div>
                    ) : (
                      dlq.map((d) => (
                        <div key={d.id} style={{ background: "#201414", padding: "10px 12px", borderRadius: "6px", border: "1px solid #451a1a", fontSize: "11.5px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", color: "#f87171" }}>
                            <strong>{d.topic}</strong>
                            <button onClick={() => handleReplayDlq(d.id)} style={{ background: "#34d399", color: "#000", border: "none", borderRadius: 4, padding: "2px 6px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>
                              Replay
                            </button>
                          </div>
                          <div style={{ color: "#fca5a5", marginTop: 4 }}>Error: {d.error || "Exceeded Max Retries"}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FAULT TOLERANCE & CIRCUIT BREAKERS */}
          {activeTab === "circuit_breakers" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <h3 style={{ margin: 0, fontSize: "15px", color: "#f3f4f6", display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck style={{ width: 16, height: 16, color: "#38bdf8" }} />
                <span>Microservice Circuit Breakers & Resilience State Machine</span>
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "16px" }}>
                {circuitBreakers.map((cb) => (
                  <div
                    key={cb.serviceId}
                    style={{
                      background: "#1a1f24",
                      border: "1px solid #2d343a",
                      borderRadius: "12px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <h4 style={{ margin: 0, fontSize: "14px", color: "#f3f4f6" }}>{cb.serviceName}</h4>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "bold",
                            color: cb.state === "CLOSED" ? "#34d399" : cb.state === "HALF_OPEN" ? "#f59e0b" : "#ef4444",
                            background: cb.state === "CLOSED" ? "rgba(52,211,153,0.12)" : "rgba(239,68,68,0.12)",
                            padding: "3px 8px",
                            borderRadius: "10px",
                          }}
                        >
                          {cb.state}
                        </span>
                      </div>

                      <div style={{ marginTop: 12, fontSize: "12px", color: "#9ca3af", display: "flex", flexDirection: "column", gap: 4 }}>
                        <div>Consecutive Failures: <strong style={{ color: cb.failures > 0 ? "#ef4444" : "#cbd5e1" }}>{cb.failures}</strong> / {cb.config.failureThreshold}</div>
                        <div>Recovery Timeout: <strong>{cb.config.recoveryTimeoutMs}ms</strong></div>
                        <div>Timeout Limit: <strong>{cb.config.timeoutMs}ms</strong></div>
                      </div>
                    </div>

                    <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #282e34", display: "flex", gap: 8 }}>
                      {cb.state === "CLOSED" ? (
                        <button
                          onClick={() => handleTripBreaker(cb.serviceId)}
                          style={{
                            flex: 1,
                            background: "#3f1e1e",
                            border: "1px solid #7f1d1d",
                            color: "#fca5a5",
                            borderRadius: 6,
                            padding: "6px",
                            fontSize: "11px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          Simulate Trip (Chaos)
                        </button>
                      ) : (
                        <button
                          onClick={() => handleResetBreaker(cb.serviceId)}
                          style={{
                            flex: 1,
                            background: "#1e3a2f",
                            border: "1px solid #047857",
                            color: "#6ee7b7",
                            borderRadius: 6,
                            padding: "6px",
                            fontSize: "11px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          Reset to CLOSED
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
