import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Globe,
  Compass,
  FileCode,
  Activity,
  Terminal,
  Cpu,
  Layers,
  ArrowRight,
  Clock,
  UserCheck,
  Check,
  Play,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Brain,
  AlertCircle,
  Copy,
  ExternalLink,
  Target,
  Search,
  Maximize2,
  Minimize2,
  RefreshCw,
  Database,
  Lock
} from "lucide-react";
import { UserProfile, FleetTask, Agent, AgentLog } from "../types";
import { intelligenceService, QUANTUM_MODELS, IntelligenceModel } from "../utils/intelligenceService";
import { recommendationService, RecommendedItem } from "../utils/recommendationService";
import { ChatMarkdownRenderer } from "./chat/ChatMarkdownRenderer";
import { IntermediateTaskExecutionCard, IntermediateTaskData, IntermediateSubtask } from "./chat/IntermediateTaskExecutionCard";
import { ChatMessageActions } from "./chat/ChatMessageActions";

export interface IntelligenceMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  analysis?: {
    intent: string;
    targetDepartment: string;
    complexity: "low" | "medium" | "high" | "critical";
    estimatedDuration: string;
    toolsRequired: string[];
    riskAssessment: "Safe" | "Elevated" | "Enterprise Restricted";
  };
  briefing?: {
    id: string;
    title: string;
    summary: string;
    subtasks: Array<{
      id: string;
      title: string;
      description: string;
      assignedTo: string;
      priority: "low" | "medium" | "high" | "critical";
      status: "queued" | "running" | "completed";
      progress: number;
    }>;
    dispatchedToAdmin: boolean;
    dispatchedAt?: string;
  };
}

interface RuffloIntelligenceProps {
  userProfile: UserProfile;
  agents: Agent[];
  tasks: FleetTask[];
  onAddTask: (task: Partial<FleetTask>) => void;
  onUpdateTask?: (task: FleetTask) => void;
  onAddLog?: (log: Partial<AgentLog>) => void;
}

export const RuffloIntelligence: React.FC<RuffloIntelligenceProps> = ({
  userProfile,
  agents,
  tasks,
  onAddTask,
  onUpdateTask,
  onAddLog,
}) => {
  const [messages, setMessages] = useState<IntelligenceMessage[]>([
    {
      id: "msg-welcome",
      role: "assistant",
      content:
        "Welcome to **RUFFLO INTELLIGENCE** — the single unified autonomous AI engine for Rufflo Autonomous Company OS.\n\nI am your single primary intelligence bot. Give me any objective, coding requirement, deep web research task, or architectural directive. I will:\n1. **Analyze** your request and evaluate intent, scope, and tooling.\n2. **Synthesize & Summarize** an executive task briefing with structured subtasks.\n3. **Send to the Fleet Administrator** to execute and manage across our autonomous workforce.",
      timestamp: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"workspace" | "admin_queue" | "fleet_logs">("workspace");
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [liveAdminTasks, setLiveAdminTasks] = useState<FleetTask[]>([]);
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [activeAnalysisStage, setActiveAnalysisStage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync tasks from props
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      setLiveAdminTasks(tasks);
    }
  }, [tasks]);

  // Load contextual recommendations
  useEffect(() => {
    async function loadRecs() {
      try {
        const ctx = await recommendationService.getIntelligenceContext(input || "autonomous software development");
        if (ctx) {
          setRecommendations([...ctx.recommendedActions, ...ctx.recommendedAgents].slice(0, 4));
        }
      } catch (e) {
        console.warn("Recs load error:", e);
      }
    }
    loadRecs();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeAnalysisStage]);

  // Handle User Input Submission
  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() || isLoading) return;

    setInput("");
    const userMsgId = `user-${Date.now()}`;
    const userMsg: IntelligenceMessage = {
      id: userMsgId,
      role: "user",
      content: promptToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setActiveAnalysisStage("Analyzing user intent and architectural scope...");

    // Log user event to telemetry
    recommendationService.trackEvent({
      userId: userProfile.id || "admin-user",
      eventType: "chat",
      itemId: `prompt-${Date.now()}`,
      itemType: "prompt",
      itemTitle: promptToSend.slice(0, 50),
      category: "intelligence",
      tags: ["unified-bot", "admin-briefing"],
      weight: 8,
    });

    try {
      // Step 1: Deep Analysis & Synthesis via Quantum Intelligence Engine
      await new Promise((res) => setTimeout(res, 400));
      setActiveAnalysisStage("Synthesizing executive subtasks & department routing...");

      const assistantMsgId = `asst-${Date.now()}`;
      let streamingContent = "";

      const placeholderAssistantMsg: IntelligenceMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, placeholderAssistantMsg]);

      // Call streaming backend
      await intelligenceService.streamResponse({
        prompt: promptToSend,
        messages: messages.slice(-6).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })),
        model: selectedModel,
        onToken: (token) => {
          streamingContent += token;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: streamingContent } : msg
            )
          );
        },
        onStepStart: (step) => {
          setActiveAnalysisStage(`Quantum Reasoning: ${step.objective.slice(0, 60)}...`);
        },
      });

      // Step 2: Generate Structured Executive Briefing & Subtasks
      setActiveAnalysisStage("Compiling executive briefing for Administrator Scott...");
      const briefing = await intelligenceService.generateBriefing(promptToSend, [
        ...messages.map(m => ({ id: m.id, role: m.role, content: m.content, timestamp: m.timestamp })),
        { id: userMsgId, role: userMsg.role, content: userMsg.content, timestamp: userMsg.timestamp },
        { id: assistantMsgId, role: "assistant", content: streamingContent, timestamp: new Date().toISOString() },
      ]);

      const isWeb = promptToSend.toLowerCase().includes("browse") || promptToSend.toLowerCase().includes("web") || promptToSend.toLowerCase().includes("search");
      const isCode = promptToSend.toLowerCase().includes("code") || promptToSend.toLowerCase().includes("build") || promptToSend.toLowerCase().includes("api");

      const analysisObj = {
        intent: promptToSend.slice(0, 80),
        targetDepartment: isCode ? "Engineering & Core Systems" : isWeb ? "Global Research & Scraping" : "Strategic Operations",
        complexity: promptToSend.length > 120 ? ("high" as const) : ("medium" as const),
        estimatedDuration: isCode ? "3.5 hrs" : "45 mins",
        toolsRequired: isWeb
          ? ["Browser-Use (Playwright)", "DOM Extractor", "Search Grounding"]
          : ["TypeScript Compiler", "API Gateway Proxy", "Message Broker"],
        riskAssessment: "Safe" as const,
      };

      const structuredSubtasks = briefing?.subtasks?.map((st, i) => ({
        id: st.id || `task-admin-${Date.now()}-${i}`,
        title: st.title,
        description: st.description || st.title,
        assignedTo: st.assignedDepartment === "engineering" ? "Ruflo (Lead Engineer)" : "Michael Scott (Fleet Admin)",
        priority: (st.priority as any) || "high",
        status: "queued" as const,
        progress: 0,
      })) || [
        {
          id: `task-admin-${Date.now()}-1`,
          title: `Execute Objective: ${promptToSend.slice(0, 40)}`,
          description: `Full autonomous implementation and deployment based on Rufflo Intelligence briefing.`,
          assignedTo: "Michael Scott (Fleet Admin)",
          priority: "high" as const,
          status: "queued" as const,
          progress: 0,
        },
      ];

      const briefingPayload = {
        id: briefing?.id || `briefing-${Date.now()}`,
        title: `Strategic Directive: ${promptToSend.slice(0, 45)}`,
        summary: briefing?.overview || `Synthesized actionable execution plan for prompt: "${promptToSend}"`,
        subtasks: structuredSubtasks,
        dispatchedToAdmin: true,
        dispatchedAt: new Date().toLocaleTimeString(),
      };

      // Update the assistant message with the complete analysis & briefing
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                analysis: analysisObj,
                briefing: briefingPayload,
              }
            : msg
        )
      );

      // Step 3: Automatically Dispatch Subtasks directly to the Administrator
      if (autoDispatch) {
        structuredSubtasks.forEach((subtask, idx) => {
          const newTask: FleetTask = {
            id: subtask.id,
            title: subtask.title,
            description: subtask.description,
            assignedTo: subtask.assignedTo,
            status: "queued",
            progress: 0,
            priority: subtask.priority,
            createdAt: Date.now(),
          };
          onAddTask(newTask);
        });

        onAddLog?.({
          id: `log-admin-${Date.now()}`,
          agentId: "scott",
          agentName: "Administrator (Michael Scott)",
          message: `⚡ Dispatched from RUFFLO INTELLIGENCE: "${briefingPayload.title}" with ${structuredSubtasks.length} actionable subtasks.`,
          level: "success",
          type: "action",
          timestamp: new Date().toLocaleTimeString(),
        });
      }

      setActiveAnalysisStage(null);
    } catch (err: any) {
      console.error("Rufflo Intelligence Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "system",
          content: `⚠️ Error during intelligence processing: ${err.message || "Failed to complete inference pipeline."}`,
          timestamp: new Date().toISOString(),
        },
      ]);
      setActiveAnalysisStage(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#121416] text-[#e5e7eb] select-text">
      {/* Top Header */}
      <header className="px-6 py-4 bg-[#181b1e] border-b border-[#262b30] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white m-0">RUFFLO INTELLIGENCE</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">
                Unified Autonomous Engine
              </span>
            </div>
            <p className="text-xs text-[#9ca3af] m-0">
              Single intelligence bot: Analyzes & summarises objectives ➔ Dispatches to Fleet Administrator
            </p>
          </div>
        </div>

        {/* Status Indicators & Navigation Tabs */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 bg-[#121517] p-1 rounded-lg border border-[#262b30]">
            <button
              onClick={() => setActiveTab("workspace")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "workspace" ? "bg-[#242b31] text-emerald-400 shadow-sm" : "text-[#9ca3af] hover:text-white"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Intelligence Terminal</span>
            </button>
            <button
              onClick={() => setActiveTab("admin_queue")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "admin_queue" ? "bg-[#242b31] text-emerald-400 shadow-sm" : "text-[#9ca3af] hover:text-white"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Administrator Task Queue ({liveAdminTasks.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pl-3 border-l border-[#262b30]">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Administrator: Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left / Primary Chat & Intelligence Stream */}
        <div className="flex-1 flex flex-col h-full bg-[#14171a] border-r border-[#262b30] min-w-0">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-4xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white"
                      : msg.role === "system"
                      ? "bg-amber-600 text-white"
                      : "bg-[#232a30] text-emerald-400 border border-[#343e47]"
                  }`}
                >
                  {msg.role === "user" ? "YOU" : msg.role === "system" ? "SYS" : <Sparkles className="w-4 h-4" />}
                </div>

                {/* Message Box */}
                <div
                  className={`flex-1 rounded-2xl p-4 md:p-5 text-sm leading-relaxed border transition-all ${
                    msg.role === "user"
                      ? "bg-[#1d2722] border-emerald-600/40 text-emerald-50 shadow-md shadow-emerald-950/20"
                      : "bg-[#181d22] border-[#29323b] text-[#e5e7eb] shadow-lg"
                  }`}
                >
                  {/* Rich Formatted Markdown Content */}
                  <ChatMarkdownRenderer
                    content={msg.content}
                    role={msg.role}
                  />

                  {/* Intermediate Task Orchestration & Execution Card */}
                  {(msg.briefing || msg.analysis) && (
                    <IntermediateTaskExecutionCard
                      taskData={{
                        id: msg.briefing?.id || `task-${msg.id}`,
                        title: msg.briefing?.title || msg.analysis?.intent || "Autonomous Task Execution",
                        summary: msg.briefing?.summary || `Orchestrated ${msg.analysis?.complexity || 'standard'} objective across ${msg.analysis?.targetDepartment || 'fleet'} operations.`,
                        targetDepartment: msg.analysis?.targetDepartment,
                        complexity: msg.analysis?.complexity,
                        estimatedDuration: msg.analysis?.estimatedDuration,
                        toolsRequired: msg.analysis?.toolsRequired,
                        subtasks: (msg.briefing?.subtasks || []).map(s => ({
                          id: s.id,
                          title: s.title,
                          description: s.description,
                          assignedTo: s.assignedTo,
                          priority: s.priority,
                          status: s.status,
                          progress: s.progress,
                        })),
                        dispatchedToAdmin: msg.briefing?.dispatchedToAdmin ?? true,
                        dispatchedAt: msg.briefing?.dispatchedAt,
                      }}
                      onExecuteSubtask={(subtask) => {
                        onAddTask({
                          id: subtask.id,
                          title: subtask.title,
                          description: subtask.description,
                          assignedTo: subtask.assignedTo,
                          status: "running",
                          progress: 15,
                          priority: subtask.priority,
                          createdAt: Date.now(),
                        });
                        onAddLog?.({
                          id: `log-${Date.now()}`,
                          agentId: subtask.assignedTo,
                          agentName: subtask.assignedTo,
                          message: `▶ [Intermediate Exec] Started subtask: "${subtask.title}"`,
                          level: "info",
                          type: "action",
                          timestamp: new Date().toLocaleTimeString(),
                        });
                      }}
                      onExecuteAll={(taskData) => {
                        taskData.subtasks.forEach((st) => {
                          onAddTask({
                            id: st.id,
                            title: st.title,
                            description: st.description,
                            assignedTo: st.assignedTo,
                            status: "running",
                            progress: 10,
                            priority: st.priority,
                            createdAt: Date.now(),
                          });
                        });
                        onAddLog?.({
                          id: `log-all-${Date.now()}`,
                          agentId: "scott",
                          agentName: "Administrator (Michael Scott)",
                          message: `⚡ [Intermediate Exec] Dispatched all ${taskData.subtasks.length} subtasks for "${taskData.title}" into workforce execution pipeline.`,
                          level: "success",
                          type: "action",
                          timestamp: new Date().toLocaleTimeString(),
                        });
                      }}
                      onOpenQueue={() => setActiveTab("admin_queue")}
                    />
                  )}

                  {/* Assistant Actions Bar (ChatGPT / Gemini style) */}
                  {msg.role === "assistant" && (
                    <ChatMessageActions
                      content={msg.content}
                      modelName={selectedModel}
                      timestamp={msg.timestamp}
                      onRegenerate={() => handleSend(messages[messages.length - 2]?.content || "Regenerate last response")}
                      onDispatchTask={
                        msg.briefing
                          ? () => {
                              msg.briefing?.subtasks.forEach((st) => {
                                onAddTask({
                                  id: `${st.id}-manual-${Date.now()}`,
                                  title: st.title,
                                  description: st.description,
                                  assignedTo: st.assignedTo,
                                  status: "queued",
                                  progress: 0,
                                  priority: st.priority,
                                  createdAt: Date.now(),
                                });
                              });
                            }
                          : undefined
                      }
                    />
                  )}
                </div>
              </div>
            ))}

            {/* Active Analysis Stage Pill */}
            {activeAnalysisStage && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#1a211d] border border-emerald-500/30 text-emerald-400 text-xs animate-pulse">
                <Zap className="w-4 h-4" />
                <span>{activeAnalysisStage}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Recommendations & Intent Chips */}
          {recommendations.length > 0 && (
            <div className="px-4 py-2.5 bg-[#121518] border-t border-[#232930] flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 whitespace-nowrap">
                <Target className="w-3.5 h-3.5" />
                <span>Suggested Directives:</span>
              </span>
              {recommendations.map((rec) => (
                <button
                  key={rec.id}
                  onClick={() => handleSend(`Execute ${rec.title}: ${rec.description}`)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-full bg-[#1b2228] border border-amber-400/30 text-amber-300 hover:bg-[#253039] text-xs whitespace-nowrap transition-colors flex items-center gap-1.5"
                >
                  <span>{rec.title}</span>
                  <span className="text-[10px] font-mono bg-amber-400/10 px-1.5 py-0.2 rounded text-amber-200">
                    {Math.round(rec.score * 100)}% match
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Prompt Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 bg-[#181b1e] border-t border-[#262b30] flex items-end gap-3"
          >
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Assign any objective (e.g. 'Build an automated payment verification API', 'Browse HN and summarize top AI agent papers')..."
                disabled={isLoading}
                rows={2}
                className="w-full bg-[#111315] border border-[#2d343b] focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-[#e5e7eb] placeholder-[#6b7280] outline-none resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`px-5 py-3 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all flex-shrink-0 ${
                isLoading || !input.trim()
                  ? "bg-[#252b30] text-[#6b7280] cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 cursor-pointer"
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{isLoading ? "Processing..." : "Analyze & Send"}</span>
            </button>
          </form>
        </div>

        {/* Right / Administrator Live Workstation & Fleet Telemetry */}
        <div className="w-96 hidden lg:flex flex-col h-full bg-[#16191c] p-4 space-y-4 overflow-y-auto">
          {/* Administrator Status Card */}
          <div className="p-4 rounded-xl bg-[#1b2024] border border-[#2c343b] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  ADM
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white m-0">Administrator Workstation</h3>
                  <p className="text-[11px] text-[#9ca3af] m-0">Michael Scott (Fleet Master)</p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <p className="text-xs text-[#9ca3af] leading-5">
              Receives synthesized briefings directly from <strong>Rufflo Intelligence</strong>, breaks them down into subtasks, and assigns them across autonomous workforce units.
            </p>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#262e35] text-xs">
              <div className="bg-[#121518] p-2 rounded-lg border border-[#232930]">
                <div className="text-[#9ca3af] text-[10px]">Active Tasks</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">{liveAdminTasks.length}</div>
              </div>
              <div className="bg-[#121518] p-2 rounded-lg border border-[#232930]">
                <div className="text-[#9ca3af] text-[10px]">Fleet Units</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">{agents.length || 8}</div>
              </div>
            </div>
          </div>

          {/* Live Task Queue */}
          <div className="flex-1 flex flex-col bg-[#1b2024] rounded-xl border border-[#2c343b] p-3.5 overflow-hidden">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Administrator Queue</span>
              </h4>
              <span className="text-[10px] text-[#9ca3af]">{liveAdminTasks.length} tasks</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {liveAdminTasks.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#6b7280]">
                  No tasks currently queued. Send a prompt to Rufflo Intelligence to generate and dispatch tasks.
                </div>
              ) : (
                liveAdminTasks.slice(0, 15).map((task) => (
                  <div
                    key={task.id}
                    className="p-2.5 rounded-lg bg-[#121518] border border-[#262d33] hover:border-emerald-500/40 transition-colors text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-white truncate">{task.title}</span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                          task.priority === "critical"
                            ? "bg-rose-500/20 text-rose-300"
                            : task.priority === "high"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9ca3af] mt-1 line-clamp-2 leading-4">
                      {task.description}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#1f252b] text-[10px] text-[#6b7280]">
                      <span>Assigned: <strong className="text-[#cbd5e1]">{task.assignedTo}</strong></span>
                      <span className="text-emerald-400">{task.status.toUpperCase()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RuffloIntelligence;
