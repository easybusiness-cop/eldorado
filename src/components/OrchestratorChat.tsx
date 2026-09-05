import React, { useState, useRef, useEffect } from "react";

interface ChatMessage {
  id: string;
  role: "user" | "system" | "assistant" | "progress";
  content: string;
  meta?: string;
}

export function OrchestratorChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (msg: Omit<ChatMessage, "id">) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
    ]);
  };

  const updateLastProgress = (text: string) => {
    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last && last.role === "progress") {
        last.content += text;
        return [...copy];
      }
      return [
        ...copy,
        {
          id: `${Date.now()}-prog`,
          role: "progress",
          content: text,
        },
      ];
    });
  };

  const runOrchestrator = async () => {
    const objective = input.trim();
    if (!objective || isRunning) return;

    setInput("");
    setIsRunning(true);
    addMessage({ role: "user", content: objective });
    addMessage({ role: "system", content: "Starting Master Orchestrator..." });

    try {
      const response = await fetch("/api/orchestrator/run-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objective,
          requestedBy: "frontend-chat",
          maxSteps: 8,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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

            switch (event) {
              case "step_start":
                addMessage({
                  role: "system",
                  content: `▶ ${data.role.toUpperCase()} (${data.agentId}) started`,
                  meta: data.objective,
                });
                break;

              case "step_token":
                updateLastProgress(data.text || "");
                break;

              case "step_complete":
                addMessage({
                  role: "system",
                  content: `✓ ${data.role.toUpperCase()} completed`,
                  meta: data.resultPreview,
                });
                break;

              case "step_error":
                addMessage({
                  role: "system",
                  content: `✗ ${data.role.toUpperCase()} failed: ${data.error}`,
                });
                break;

              case "plan_complete":
              case "complete":
                addMessage({
                  role: "assistant",
                  content: data.finalAnswer || data.status || "Orchestration finished",
                });
                break;

              case "error":
                addMessage({
                  role: "system",
                  content: `Error: ${data.error}`,
                });
                break;
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err: any) {
      addMessage({
        role: "system",
        content: `Failed to run orchestrator: ${err.message}`,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      runOrchestrator();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "80vh",
        background: "#1a1a1a",
        border: "1px solid #333",
        borderRadius: 12,
        overflow: "hidden",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #333",
          background: "#222",
          fontWeight: 600,
          color: "#e0e0e0",
        }}
      >
        Rufflo Master Orchestrator
        <span style={{ marginLeft: 8, fontSize: 12, color: "#888" }}>
          {isRunning ? "● Running..." : "○ Ready"}
        </span>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: "#666", fontSize: 13 }}>
            Type an objective and press Enter. Example: “Build a sliding-window RateLimiter in TypeScript”
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf:
                m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "90%",
              padding: "8px 12px",
              borderRadius: 8,
              background:
                m.role === "user"
                  ? "#2d4a3e"
                  : m.role === "assistant"
                  ? "#1e2a3a"
                  : m.role === "progress"
                  ? "#1a1a1a"
                  : "#252525",
              color: "#ddd",
              fontSize: 13,
              whiteSpace: "pre-wrap",
              border: m.role === "progress" ? "1px dashed #444" : "none",
            }}
          >
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
              {m.role.toUpperCase()}
            </div>
            {m.content}
            {m.meta && (
              <div style={{ marginTop: 6, fontSize: 11, color: "#777" }}>
                {m.meta}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: 12,
          borderTop: "1px solid #333",
          display: "flex",
          gap: 8,
          background: "#222",
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter objective..."
          disabled={isRunning}
          rows={2}
          style={{
            flex: 1,
            resize: "none",
            background: "#1a1a1a",
            border: "1px solid #444",
            borderRadius: 8,
            color: "#eee",
            padding: "8px 10px",
            fontSize: 13,
            outline: "none",
          }}
        />
        <button
          onClick={runOrchestrator}
          disabled={isRunning || !input.trim()}
          style={{
            padding: "0 16px",
            background: isRunning ? "#444" : "#3d6b4f",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: isRunning ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {isRunning ? "Running..." : "Run"}
        </button>
      </div>
    </div>
  );
}

export default OrchestratorChat;
