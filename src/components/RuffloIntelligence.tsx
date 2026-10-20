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
import { intelligenceService } from "../utils/intelligenceService";
import { recommendationService, RecommendedItem } from "../utils/recommendationService";
import { getSupabaseAccessToken } from "../utils/workspaceAuth";
import { ChatMarkdownRenderer } from "./chat/ChatMarkdownRenderer";
import { ChatMessageActions } from "./chat/ChatMessageActions";

export interface IntelligenceMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
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
}) => {
  const [messages, setMessages] = useState<IntelligenceMessage[]>([
    {
      id: "msg-welcome",
      role: "assistant",
      content:
        "Welcome to **RUFFLO INTELLIGENCE**. This chat can request a response from the configured model provider when the backend is available.\n\nChat responses are proposals, not completed work. This screen does not automatically dispatch tasks, change files, or perform external actions. Use an authorized execution workflow for operations; its permissions, approvals, and verification evidence determine whether a task is actually complete.",
      timestamp: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"workspace" | "admin_queue" | "fleet_logs">("workspace");
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [liveAdminTasks, setLiveAdminTasks] = useState<FleetTask[]>([]);
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

    const accessToken = await getSupabaseAccessToken();
    if (!accessToken) {
      setMessages((prev) => [
        ...prev,
        {
          id: `auth-required-${Date.now()}`,
          role: "system",
          content: "Sign in with your Supabase account from Account Profile before requesting an intelligence response.",
          timestamp: new Date().toISOString(),
        },
      ]);
      return;
    }

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
    setActiveAnalysisStage("Requesting a response from the configured model provider...");

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
        onToken: (token) => {
          streamingContent += token;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: streamingContent } : msg
            )
          );
        },
        onStepStart: (step) => {
          setActiveAnalysisStage(step.objective);
        },
      });

      setActiveAnalysisStage(null);
    } catch (err: any) {
      if (String(err?.message || "").includes("AUTH_TOKEN_MISSING")) {
        setMessages((prev) =>
          prev.map((message) =>
            message.role === "assistant" && !message.content
              ? {
                  ...message,
                  content: "Your Supabase session is missing or expired. Sign in again from Account Profile to continue.",
                }
              : message
          )
        );
        setActiveAnalysisStage(null);
        return;
      }
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
    <div className="rufflo-intelligence w-full h-full flex flex-col bg-[#121416] text-[#e5e7eb] select-text">
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
                Model Response
              </span>
            </div>
            <p className="text-xs text-[#9ca3af] m-0">
              Model responses are proposals; task execution requires a verified workflow.
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
              <span>Execution: Not started</span>
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

                  {/* Assistant Actions Bar (ChatGPT / Gemini style) */}
                  {msg.role === "assistant" && (
                    <ChatMessageActions
                      content={msg.content}
                      modelName="Configured model provider"
                      timestamp={msg.timestamp}
                      onRegenerate={() => handleSend(messages[messages.length - 2]?.content || "Regenerate last response")}
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
                id="rufflo-objective-input"
                name="objective"
                aria-label="Objective to analyze and send"
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
