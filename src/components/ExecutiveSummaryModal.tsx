import React from 'react';
import { X, FileText, Download, Copy, Check, Star, Play, Layers, Sparkles, Cpu, ShieldAlert, BadgeInfo } from 'lucide-react';
import { soundFx } from '../utils/speech';

// Local representation of Cascade Run object
export interface CascadeTaskAllocation {
  taskId: string;
  department: string;
  hodName: string;
  assignedAgentName: string;
  taskTitle: string;
  taskPrompt: string;
  status: string;
  output?: string;
  executionTimeMs?: number;
}

export interface CascadeMission {
  department: string;
  hodName: string;
  hodRole: string;
  strategicObjective: string;
  assignedTasks: CascadeTaskAllocation[];
  status: string;
  departmentSummary?: string;
}

export interface CascadeRunData {
  id: string;
  userCommand: string;
  startedAt: string;
  completedAt?: string;
  status: string;
  ceoDirective?: {
    agentName: string;
    speech: string;
    mandate: string;
    priority: string;
  };
  executivePlan?: {
    agentName: string;
    analysis: string;
    activatedDepartments: string[];
  };
  departmentMissions?: Record<string, CascadeMission>;
  finalExecutiveBriefing?: string;
  ceoFinalResponse?: string;
  metrics?: {
    totalDepartments: number;
    totalEmployeesInvolved: number;
    dynamicEmployeesSpawned: number;
    totalTasksExecuted: number;
    durationMs: number;
  };
}

interface ExecutiveSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  runData: CascadeRunData | null;
  markdownContent: string;
}

export const ExecutiveSummaryModal: React.FC<ExecutiveSummaryModalProps> = ({
  isOpen,
  onClose,
  runData,
  markdownContent,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    soundFx.playClick?.();
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    soundFx.playClick?.();
    const element = document.createElement('a');
    const file = new Blob([markdownContent], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `executive-summary-${runData?.id || Date.now()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Helper parser to render Markdown elements safely and beautiful in Gruvbox style
  const parseMarkdownToHtml = (md: string) => {
    if (!md) return null;
    const lines = md.split('\n');
    let inList = false;
    let inCodeBlock = false;
    let codeContent: string[] = [];
    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      // Code Blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
          elements.push(
            <pre
              key={`code-${index}`}
              className="p-3 bg-[#282828] text-[#ebdbb2] rounded-lg border border-[#3c3836] overflow-x-auto text-xs font-mono my-2.5 select-text"
            >
              <code>{codeContent.join('\n')}</code>
            </pre>
          );
          codeContent = [];
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return;
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push(
          <h1
            key={index}
            className="text-lg font-black text-[#b57614] dark:text-[#fabd2f] mt-5 mb-2.5 border-b-2 border-[#d5c4a1] dark:border-[#3c3836] pb-1 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            {line.slice(2)}
          </h1>
        );
        return;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2
            key={index}
            className="text-md font-extrabold text-[#af3a03] dark:text-[#fe8019] mt-4 mb-2 flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            {line.slice(3)}
          </h2>
        );
        return;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <h3
            key={index}
            className="text-xs font-black text-[#076678] dark:text-[#83a598] mt-3.5 mb-1 tracking-wide uppercase flex items-center gap-1.5"
          >
            <Cpu className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
            {line.slice(4)}
          </h3>
        );
        return;
      }

      // Dividers
      if (line.trim() === '---') {
        elements.push(
          <hr
            key={index}
            className="my-4 border-t-2 border-dashed border-[#d5c4a1] dark:border-[#3c3836]"
          />
        );
        return;
      }

      // Lists
      if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li
            key={index}
            className="ml-5 list-disc text-xs text-[#3c3836] dark:text-[#ebdbb2] py-0.5 leading-relaxed"
          >
            {parseInline(line.slice(2))}
          </li>
        );
        return;
      }

      // Quote Blocks
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote
            key={index}
            className="pl-3.5 py-1.5 border-l-4 border-[#b57614] dark:border-[#fabd2f] bg-[#ebdbb2]/30 dark:bg-[#282828]/50 text-xs italic text-[#504945] dark:text-[#bdae93] my-2 rounded-r-md"
          >
            {parseInline(line.slice(2))}
          </blockquote>
        );
        return;
      }

      // Empty Lines
      if (line.trim() === '') {
        return;
      }

      // Default Paragraph
      elements.push(
        <p key={index} className="text-xs text-[#3c3836] dark:text-[#ebdbb2] leading-relaxed my-2">
          {parseInline(line)}
        </p>
      );
    });

    return elements;
  };

  const parseInline = (text: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    const regex = /(\*\*|`)(.*?)\1/g;
    let lastIndex = 0;
    let match;
    let keyIdx = 0;

    while ((match = regex.exec(text)) !== null) {
      const before = text.substring(lastIndex, match.index);
      if (before) {
        tokens.push(<span key={`txt-${keyIdx++}`}>{before}</span>);
      }
      const marker = match[1];
      const inner = match[2];
      if (marker === '**') {
        tokens.push(
          <strong key={`bold-${keyIdx++}`} className="font-extrabold text-[#282828] dark:text-[#fbf1c7]">
            {inner}
          </strong>
        );
      } else if (marker === '`') {
        tokens.push(
          <code
            key={`code-${keyIdx++}`}
            className="px-1 py-0.5 bg-[#ebdbb2]/60 dark:bg-[#3c3836] rounded text-[10px] font-mono text-[#9d0006] dark:text-[#fb4934]"
          >
            {inner}
          </code>
        );
      }
      lastIndex = regex.lastIndex;
    }

    const remainder = text.substring(lastIndex);
    if (remainder) {
      tokens.push(<span key={`txt-rem-${keyIdx++}`}>{remainder}</span>);
    }

    return tokens.length > 0 ? tokens : [<span key="pure">{text}</span>];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs font-mono p-4">
      <div className="w-full max-w-4xl h-[85vh] bg-[#fbf1c7] dark:bg-[#1d2021] border-2 border-amber-500 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#ebdbb2] dark:bg-[#282828] border-b border-[#d5c4a1] dark:border-[#3c3836]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-black text-sm uppercase tracking-wider text-[#3c3836] dark:text-[#fbf1c7] block">
                Executive summary report
              </span>
              <span className="text-[10px] text-[#7c6f64] dark:text-[#a89984] block font-mono">
                Cascade Process Run ID: <span className="font-bold text-amber-600 dark:text-amber-400">{runData?.id || 'N/A'}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                  : 'bg-[#ebdbb2] dark:bg-[#3c3836] text-[#3c3836] dark:text-[#ebdbb2] border-[#d5c4a1] dark:border-[#504945] hover:bg-[#d5c4a1] dark:hover:bg-[#504945]'
              }`}
              title="Copy markdown content to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy MD'}
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black border border-amber-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
              title="Download summary report as a .md file"
            >
              <Download className="w-3.5 h-3.5" />
              Download .md
            </button>

            <button
              onClick={() => {
                soundFx.playClick?.();
                onClose();
              }}
              className="p-1.5 hover:bg-red-500 hover:text-white rounded-lg text-[#7c6f64] dark:text-[#a89984] transition-all ml-2"
              title="Close report view"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Statistics & Operations metadata */}
          <div className="w-72 bg-[#f2e5bc] dark:bg-[#181615] border-r border-[#d5c4a1] dark:border-[#3c3836] p-5 overflow-y-auto space-y-5 hidden md:block select-none">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#7c6f64] dark:text-[#a89984] uppercase tracking-wider">
                Execution Quality Log
              </span>
              <div className="p-3 bg-[#ebdbb2] dark:bg-[#282828] border border-[#d5c4a1] dark:border-[#3c3836] rounded-xl flex items-center gap-3">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <div>
                  <div className="text-[10px] font-bold text-[#3c3836] dark:text-[#ebdbb2]">STATUS</div>
                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    {runData?.status || 'COMPLETED'}
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics */}
            {runData?.metrics && (
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-[#7c6f64] dark:text-[#a89984] uppercase tracking-wider">
                  Cascade Metrics
                </span>
                <div className="space-y-2">
                  <div className="p-3 bg-[#ebdbb2]/50 dark:bg-[#282828]/40 border border-[#d5c4a1]/60 dark:border-[#3c3836]/40 rounded-xl">
                    <div className="text-[10px] font-bold text-[#7c6f64] dark:text-[#a89984] uppercase">Activated Departments</div>
                    <div className="text-lg font-black text-[#b57614] dark:text-[#fabd2f] font-mono">
                      {runData.metrics.totalDepartments}
                    </div>
                  </div>
                  <div className="p-3 bg-[#ebdbb2]/50 dark:bg-[#282828]/40 border border-[#d5c4a1]/60 dark:border-[#3c3836]/40 rounded-xl">
                    <div className="text-[10px] font-bold text-[#7c6f64] dark:text-[#a89984] uppercase">Employees Involved</div>
                    <div className="text-lg font-black text-[#076678] dark:text-[#83a598] font-mono">
                      {runData.metrics.totalEmployeesInvolved}
                    </div>
                  </div>
                  <div className="p-3 bg-[#ebdbb2]/50 dark:bg-[#282828]/40 border border-[#d5c4a1]/60 dark:border-[#3c3836]/40 rounded-xl">
                    <div className="text-[10px] font-bold text-[#7c6f64] dark:text-[#a89984] uppercase">Dynamic Spawns</div>
                    <div className="text-lg font-black text-[#af3a03] dark:text-[#fe8019] font-mono">
                      {runData.metrics.dynamicEmployeesSpawned}
                    </div>
                  </div>
                  <div className="p-3 bg-[#ebdbb2]/50 dark:bg-[#282828]/40 border border-[#d5c4a1]/60 dark:border-[#3c3836]/40 rounded-xl">
                    <div className="text-[10px] font-bold text-[#7c6f64] dark:text-[#a89984] uppercase">Total Tasks</div>
                    <div className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono">
                      {runData.metrics.totalTasksExecuted}
                    </div>
                  </div>
                  <div className="p-3 bg-[#ebdbb2]/50 dark:bg-[#282828]/40 border border-[#d5c4a1]/60 dark:border-[#3c3836]/40 rounded-xl">
                    <div className="text-[10px] font-bold text-[#7c6f64] dark:text-[#a89984] uppercase">Duration</div>
                    <div className="text-md font-black text-[#3c3836] dark:text-[#ebdbb2] font-mono">
                      {(runData.metrics.durationMs / 1000).toFixed(2)}s
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Summary Note */}
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-700 dark:text-amber-400">
                <Star className="w-3.5 h-3.5 fill-current shrink-0" />
                <span>Executive Council</span>
              </div>
              <p className="text-[10px] text-[#7c6f64] dark:text-[#a89984] leading-relaxed">
                This document acts as an immutable record of concurrent workforce allocations and micro-agent task syntheses across all activated departments.
              </p>
            </div>
          </div>

          {/* Right Panel: Beautiful Markdown Document Display */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#fbf1c7] dark:bg-[#1d2021] selection:bg-[#fabd2f]/30">
            <div className="max-w-2xl mx-auto space-y-2 text-justify select-text">
              {parseMarkdownToHtml(markdownContent)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#ebdbb2] dark:bg-[#282828] border-t border-[#d5c4a1] dark:border-[#3c3836] text-center text-[10px] text-[#7c6f64] dark:text-[#a89984]">
          Rufflo Agent Fleet Command Center • Automated Cascade Executive Intelligence Report
        </div>
      </div>
    </div>
  );
};
