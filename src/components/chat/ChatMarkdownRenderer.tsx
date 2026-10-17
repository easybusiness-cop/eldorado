import React, { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatAiReply } from "./formatAiReply";
import {
  Copy,
  Check,
  Code2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Brain,
  Sparkles,
  Terminal,
  ArrowRight,
  Layers,
  Cpu,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayLang = language || "code";

  return (
    <div className="my-3.5 rounded-lg overflow-hidden border border-[#343b42] bg-[#121417] shadow-lg text-xs md:text-sm">
      {/* Code Header Bar like ChatGPT / Gemini */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#1a1e23] border-b border-[#2d343c] select-none">
        <div className="flex items-center gap-2 text-[#9ca3af]">
          <Code2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
            {displayLang}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] font-medium text-[#9ca3af] hover:text-white bg-[#22272d] hover:bg-[#2c333a] border border-[#343b42] px-2.5 py-1 rounded transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre className="p-3.5 overflow-x-auto text-[13px] font-mono leading-relaxed text-[#e5e7eb] bg-[#0e1013] m-0">
        <code>{code}</code>
      </pre>
    </div>
  );
};

interface ChatMarkdownRendererProps {
  content: string;
  role?: "user" | "assistant" | "system";
  isStreaming?: boolean;
}

export const ChatMarkdownRenderer: React.FC<ChatMarkdownRendererProps> = ({
  content,
  role = "assistant",
  isStreaming = false,
}) => {
  const [showThinking, setShowThinking] = useState(false);
  const formattedContent = role === "assistant" ? formatAiReply(content) : content;

  // Extract <think>...</think> or <reasoning>...</reasoning> tags if present
  let thinkingContent: string | null = null;
  let mainContent = formattedContent;

  const thinkMatch = formattedContent.match(/<think>([\s\S]*?)<\/think>/i) ||
    formattedContent.match(/<reasoning>([\s\S]*?)<\/reasoning>/i);

  if (thinkMatch) {
    thinkingContent = thinkMatch[1].trim();
    mainContent = formattedContent.replace(thinkMatch[0], "").trim();
  }

  // Also check if content starts with a markdown thinking block
  if (!thinkingContent && mainContent.startsWith("> **Thinking Process:**")) {
    const parts = mainContent.split("\n\n");
    if (parts.length > 1) {
      thinkingContent = parts[0].replace("> **Thinking Process:**", "").trim();
      mainContent = parts.slice(1).join("\n\n").trim();
    }
  }

  return (
    <div className="w-full min-w-0 break-words text-[13.5px] leading-7 text-[#e5e7eb]">
      {/* Collapsible Thinking / Reasoning Section (Gemini / OpenAI o1 style) */}
      {thinkingContent && (
        <div className="mb-3.5 rounded-lg border border-[#2d3748] bg-[#14181f]/80 overflow-hidden">
          <button
            onClick={() => setShowThinking(!showThinking)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#94a3b8] hover:text-white bg-[#18202b]/60 transition-colors font-medium select-none"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-emerald-300">Reasoning & Task Decomposition</span>
              <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-[#cbd5e1]">
                Thought Process
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#94a3b8]">
              <span>{showThinking ? "Hide" : "Show"}</span>
              {showThinking ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </div>
          </button>

          {showThinking && (
            <div className="p-3 text-xs leading-relaxed text-[#94a3b8] font-mono border-t border-[#2d3748] bg-[#0f141c]/90 whitespace-pre-wrap">
              {thinkingContent}
            </div>
          )}
        </div>
      )}

      {/* Main Formatted Markdown Content */}
      <div className="chat-markdown-body space-y-3 whitespace-pre-wrap [overflow-wrap:anywhere]">
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              const isMultiLine = String(children).includes("\n");

              if (match || isMultiLine) {
                return (
                  <CodeBlock
                    language={match ? match[1] : ""}
                    code={String(children).replace(/\n$/, "")}
                  />
                );
              }

              return (
                <code
                  className="px-1.5 py-0.5 mx-0.5 rounded text-[12px] font-mono font-medium bg-[#242b33] text-emerald-300 border border-[#38434f]"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            h1({ children }) {
              return (
                <h1 className="text-lg md:text-xl font-bold text-white tracking-tight pb-2 border-b border-[#2d353f] mt-4 mb-2.5 flex items-center gap-2">
                  <span className="w-1.5 h-4 rounded-full bg-emerald-500 inline-block" />
                  {children}
                </h1>
              );
            },
            h2({ children }) {
              return (
                <h2 className="text-base md:text-lg font-bold text-emerald-400 tracking-tight pb-1 border-b border-[#242c35] mt-3.5 mb-2">
                  {children}
                </h2>
              );
            },
            h3({ children }) {
              return (
                <h3 className="text-sm md:text-base font-semibold text-amber-300 mt-3 mb-1.5">
                  {children}
                </h3>
              );
            },
            h4({ children }) {
              return (
                <h4 className="text-xs md:text-sm font-semibold text-white/90 mt-2 mb-1">
                  {children}
                </h4>
              );
            },
            ul({ children }) {
              return (
                <ul className="list-disc pl-5 space-y-1.5 my-2.5 text-[#e5e7eb]">
                  {children}
                </ul>
              );
            },
            ol({ children }) {
              return (
                <ol className="list-decimal pl-5 space-y-1.5 my-2.5 text-[#e5e7eb]">
                  {children}
                </ol>
              );
            },
            li({ children }) {
              return <li className="leading-relaxed pl-1">{children}</li>;
            },
            blockquote({ children }) {
              return (
                <blockquote className="border-l-4 border-emerald-500/70 bg-emerald-950/20 pl-3.5 py-1.5 my-2.5 rounded-r text-emerald-200 text-[13px] italic">
                  {children}
                </blockquote>
              );
            },
            table({ children }) {
              return (
                <div className="overflow-x-auto my-3 rounded-lg border border-[#343d46]">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    {children}
                  </table>
                </div>
              );
            },
            thead({ children }) {
              return <thead className="bg-[#1b2127] text-white border-b border-[#343d46]">{children}</thead>;
            },
            th({ children }) {
              return (
                <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-emerald-400 border border-[#343d46]">
                  {children}
                </th>
              );
            },
            td({ children }) {
              return <td className="px-3 py-2 border border-[#2c343c] text-[#cbd5e1]">{children}</td>;
            },
            tr({ children }) {
              return <tr className="even:bg-white/[0.02] hover:bg-white/[0.04] transition-colors">{children}</tr>;
            },
            a({ href, children }) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 inline-flex items-center gap-1 font-medium transition-colors"
                >
                  {children}
                  <ExternalLink className="w-3 h-3 inline-block opacity-70" />
                </a>
              );
            },
            p({ children }) {
              return <p className="mb-2.5 leading-relaxed text-[13.5px] last:mb-0">{children}</p>;
            },
            hr() {
              return <hr className="my-3 border-[#2c353f]" />;
            },
          }}
        >
          {mainContent}
        </Markdown>
      </div>

      {/* Streaming blinking cursor */}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-emerald-400 animate-pulse align-middle" />
      )}
    </div>
  );
};

export default ChatMarkdownRenderer;
