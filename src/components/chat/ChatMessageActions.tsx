import React, { useState } from "react";
import {
  Copy,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";

interface ChatMessageActionsProps {
  content: string;
  modelName?: string;
  timestamp?: string;
  onRegenerate?: () => void;
  onDispatchTask?: () => void;
}

export const ChatMessageActions: React.FC<ChatMessageActionsProps> = ({
  content,
  modelName = "Quantum Intelligence",
  timestamp,
  onRegenerate,
  onDispatchTask,
}) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/5 text-xs text-[#9ca3af] select-none">
      {/* Left side: Model info & timestamp */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
          <Sparkles className="w-3 h-3" />
          <span>{modelName}</span>
        </div>
        {timestamp && (
          <span className="text-[10px] text-[#6b7280]">
            {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* Right side: ChatGPT / Gemini style action buttons */}
      <div className="flex items-center gap-1">
        {onDispatchTask && (
          <button
            onClick={onDispatchTask}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded hover:bg-white/10 text-emerald-400 hover:text-emerald-300 transition-colors"
            title="Dispatch this task through intermediate pipeline"
          >
            <Zap className="w-3 h-3" />
            <span>Dispatch Task</span>
          </button>
        )}

        <button
          onClick={handleCopy}
          className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          title="Copy response"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
            title="Regenerate reply"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={() => setFeedback(feedback === "up" ? null : "up")}
          className={`p-1.5 rounded hover:bg-white/10 transition-colors ${
            feedback === "up" ? "text-emerald-400" : "hover:text-white"
          }`}
          title="Good response"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setFeedback(feedback === "down" ? null : "down")}
          className={`p-1.5 rounded hover:bg-white/10 transition-colors ${
            feedback === "down" ? "text-rose-400" : "hover:text-white"
          }`}
          title="Poor response"
        >
          <ThumbsDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ChatMessageActions;
