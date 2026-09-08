import React, { useState, useRef, useEffect } from "react";
import { UserProfile, FleetTask } from "../types";
import { Sparkles, Brain, Send, ShieldCheck, CheckCircle2, Zap } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  tools?: string[];
}

interface ChatBriefing {
  id: string;
  timestamp: string;
  executiveSummary: string;
  keyTopics: string[];
  adminSpeech: string;
  subtasks: Array<{
    id: string;
    title: string;
    assignedTo: string;
    priority: "critical" | "high" | "medium";
    outputSummary: string;
  }>;
  status: "idle" | "summarizing" | "dispatched";
}

interface RuffloGrokbotProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile;
  onTaskCreated?: (task: FleetTask) => void;
  onLogCreated?: (log: any) => void;
}

export function RuffloGrokbot({
  isOpen,
  onClose,
  userProfile,
  onTaskCreated,
  onLogCreated,
}: RuffloGrokbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [latestBriefing, setLatestBriefing] = useState<ChatBriefing | null>(null);
  const [storedBriefingsCount, setStoredBriefingsCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentContext, setCurrentContext] = useState<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, latestBriefing]);

  useEffect(() => {
    // Load stored briefings count
    try {
      const saved = localStorage.getItem("rufflo_grokbot_briefings");
      if (saved) {
        const parsed = JSON.parse(saved);
        setStoredBriefingsCount(parsed.length || 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (messages.length === 0 && isOpen) {
      const welcome: Message = {
        id: "welcome",
        role: "assistant",
        content:
          "Hello! I am **Rufflo Grokbot**, a professional AI assistant powered by the Rufflo Autonomous Company Operating System.\n\nI can:\n• Research any topic\n• Build software and write clean code\n• Browse and fetch real data\n• Control tools and APIs\n• Recommend new features\n• Maintain context and memory\n\nPlease ask me any question or objective. I will reply formally and helpfully.",
        timestamp: new Date().toISOString(),
      };
      setMessages([welcome]);
    }
  }, [isOpen]);

  const addMessage = (msg: Omit<Message, "id" | "timestamp"> & { timestamp?: string }) => {
    const newMsg: Message = {
      timestamp: new Date().toISOString(),
      ...msg,
      id: `msg-${Date.now()}`,
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const summarizeAndDispatchToAdmin = async (msgs: Message[]) => {
    const userMsgs = msgs.filter((m) => m.role === "user");
    if (userMsgs.length === 0) return;

    setIsSummarizing(true);
    try {
      const res = await fetch("/api/orchestrator/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: msgs,
          userProfile: userProfile || { displayName: "Operator" },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.briefing) {
          const briefing: ChatBriefing = {
            ...data.briefing,
            status: "dispatched",
          };
          setLatestBriefing(briefing);

          // Save to local storage memory
          try {
            const current = JSON.parse(localStorage.getItem("rufflo_grokbot_briefings") || "[]");
            const updated = [briefing, ...current.filter((b: any) => b.id !== briefing.id)];
            localStorage.setItem("rufflo_grokbot_briefings", JSON.stringify(updated));
            setStoredBriefingsCount(updated.length);
          } catch {}

          // Instantiate live tasks for the Administrator
          if (briefing.subtasks && Array.isArray(briefing.subtasks)) {
            briefing.subtasks.forEach((sub, i) => {
              const newTask: FleetTask = {
                id: `task-grok-${Date.now()}-${i}`,
                title: sub.title,
                description: sub.outputSummary || "Task derived from Rufflo Grokbot briefing",
                assignedTo: sub.assignedTo || "ruflo",
                status: "queued",
                progress: 0,
                priority: sub.priority || "high",
                createdAt: Date.now(),
              };
              onTaskCreated?.(newTask);
            });
          }

          // Log telemetry event
          onLogCreated?.({
            id: `log-briefing-${Date.now()}`,
            agentId: "grokbot",
            message: `⚡ Chat Briefing Dispatched to Administrator: "${briefing.executiveSummary.slice(0, 60)}..."`,
            timestamp: new Date().toLocaleTimeString(),
            level: "success",
          });
        }
      }
    } catch (err) {
      console.error("Grokbot Briefing Dispatch Error:", err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const callRuffloOrchestrator = async (objective: string) => {
    setIsThinking(true);
    setIsLoading(true);

    try {
      const response = await fetch("/api/orchestrator/run-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objective,
          requestedBy: "grokbot",
          maxSteps: 8,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect to orchestrator");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullAnswer = "";

      addMessage({ role: "assistant", content: "" });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const lines = part.split("\n");
          let event = "message";
          let dataStr = "";

          for (const line of lines) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            if (line.startsWith("data:")) dataStr = line.slice(5).trim();
          }

          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);

            if (event === "step_token") {
              fullAnswer += data.text;
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last.role === "assistant") {
                  last.content += data.text;
                }
                return copy;
              });
            }

            if (event === "step_complete") {
              if (data.tools) {
                setCurrentContext((prev: any) => ({
                  ...prev,
                  toolsUsed: [...(prev?.toolsUsed || []), data.tools],
                }));
              }
            }
          } catch {}
        }
      }

      setIsThinking(false);
      return fullAnswer;
    } catch (err: any) {
      setIsThinking(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");

    addMessage({ role: "user", content: text });

    try {
      const answer = await callRuffloOrchestrator(text);
      if (answer) {
        const finalMsgs: Message[] = [
          ...messages,
          {
            id: `msg-user-${Date.now()}`,
            role: "user",
            content: text,
            timestamp: new Date().toISOString(),
          },
          {
            id: `msg-ans-${Date.now()}`,
            role: "assistant",
            content: answer,
            timestamp: new Date().toISOString(),
          },
        ];
        // Trigger Chat Summarization & Administrator Dispatch
        summarizeAndDispatchToAdmin(finalMsgs);
      }
    } catch (err: any) {
      addMessage({ role: "assistant", content: `Error: ${err.message}` });
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 540,
          background: "#1a1a1a",
          borderRadius: "12px",
          overflow: "hidden",
          border: "2px solid #3d6b4f",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
          height: "640px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 16px",
            background: "#2a2a2a",
            color: "#fff",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 10,
                height: 10,
                background: "#3d6b4f",
                borderRadius: "50%",
                animation: isThinking ? "pulse 1.5s infinite" : "none",
              }}
            />
            <span>Rufflo Grokbot</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 11, color: "#8ec07c" }}>
              {currentContext?.toolsUsed?.length || 0} tools used
            </div>
            {storedBriefingsCount > 0 && (
              <div
                style={{ fontSize: 11, color: "#fabd2f", display: "flex", alignItems: "center", gap: 4 }}
                title="Stored Briefing Memories"
              >
                <Brain style={{ width: 12, height: 12 }} />
                <span>{storedBriefingsCount}</span>
              </div>
            )}
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#aaa",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "90%",
                padding: "10px 14px",
                borderRadius: 10,
                background: m.role === "user" ? "#3d6b4f" : "#252525",
                color: "#eee",
                fontSize: 13.5,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content}
            </div>
          ))}

          {isThinking && (
            <div style={{ alignSelf: "flex-start", color: "#8ec07c", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles style={{ width: 14, height: 14 }} className="animate-spin" />
              <span>Rufflo is thinking...</span>
            </div>
          )}

          {/* Live Chat Briefing & Administrator Sync Card */}
          {latestBriefing && (
            <div
              style={{
                background: "rgba(61,107,79,0.2)",
                border: "1.5px solid #3d6b4f",
                borderRadius: "10px",
                padding: "12px",
                margin: "6px 0",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#34d399", fontWeight: "bold", fontSize: 11 }}>
                  <ShieldCheck style={{ width: 14, height: 14 }} />
                  <span>EXECUTED: CHAT SUMMARIZED & DISPATCHED TO ADMIN</span>
                </div>
                <span style={{ fontSize: 9, background: "#3d6b4f", color: "#fff", padding: "1px 5px", borderRadius: "4px" }}>
                  SYNCED
                </span>
              </div>

              <div style={{ fontSize: 11.5, color: "#ebdbb2", background: "#1d2021", padding: "6px 8px", borderRadius: "6px" }}>
                <strong>Executive Summary:</strong> {latestBriefing.executiveSummary}
              </div>

              {latestBriefing.subtasks && latestBriefing.subtasks.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 10.5, color: "#fabd2f", fontWeight: "bold" }}>
                    ⚡ Dispatched Action Items ({latestBriefing.subtasks.length}):
                  </span>
                  {latestBriefing.subtasks.map((st, idx) => (
                    <div
                      key={st.id || idx}
                      style={{
                        fontSize: 10.5,
                        color: "#bdae93",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "rgba(0,0,0,0.3)",
                        padding: "3px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      <CheckCircle2 style={{ width: 11, height: 11, color: "#34d399" }} />
                      <span style={{ color: "#fff", fontWeight: "bold" }}>[{st.assignedTo?.toUpperCase()}]</span>
                      <span>{st.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isSummarizing && (
            <div style={{ color: "#fabd2f", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Zap style={{ width: 13, height: 13 }} className="animate-pulse" />
              <span>Summarizing chat memory and dispatching briefing to Administrator Scott...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSend}
          style={{
            padding: "12px",
            borderTop: "1px solid #333",
            background: "#1f1f1f",
            display: "flex",
            gap: 8,
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Please type your question or objective in a formal manner..."
            disabled={isLoading}
            rows={2}
            style={{
              flex: 1,
              resize: "none",
              background: "#1a1a1a",
              border: "1px solid #444",
              borderRadius: 8,
              color: "#eee",
              padding: "10px",
              fontSize: 13.5,
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              background: isLoading ? "#444" : "#3d6b4f",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "0 18px",
              fontWeight: "600",
              cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Send style={{ width: 14, height: 14 }} />
            <span>{isLoading ? "Thinking..." : "Send"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default RuffloGrokbot;

