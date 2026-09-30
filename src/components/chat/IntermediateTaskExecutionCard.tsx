import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Zap,
  Play,
  UserCheck,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ArrowRight,
  Terminal,
  Layers,
  Cpu,
  Check,
  ExternalLink,
  Copy,
  Brain,
} from "lucide-react";
import { FleetTask } from "../../types";

export interface IntermediateSubtask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "queued" | "running" | "completed";
  progress?: number;
}

export interface IntermediateTaskData {
  id: string;
  title: string;
  summary: string;
  targetDepartment?: string;
  complexity?: "low" | "medium" | "high" | "critical";
  estimatedDuration?: string;
  toolsRequired?: string[];
  subtasks: IntermediateSubtask[];
  dispatchedToAdmin?: boolean;
  dispatchedAt?: string;
  executionStatus?: "planning" | "ready" | "running" | "completed";
}

interface IntermediateTaskExecutionCardProps {
  taskData: IntermediateTaskData;
  onExecuteSubtask?: (subtask: IntermediateSubtask) => void;
  onExecuteAll?: (taskData: IntermediateTaskData) => void;
  onOpenQueue?: () => void;
}

export const IntermediateTaskExecutionCard: React.FC<IntermediateTaskExecutionCardProps> = ({
  taskData,
  onExecuteSubtask,
  onExecuteAll,
  onOpenQueue,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [executedSubtasks, setExecutedSubtasks] = useState<Record<string, boolean>>({});
  const [isExecutingAll, setIsExecutingAll] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRunSubtask = (subtask: IntermediateSubtask) => {
    setExecutedSubtasks((prev) => ({ ...prev, [subtask.id]: true }));
    onExecuteSubtask?.(subtask);
  };

  const handleRunAll = async () => {
    setIsExecutingAll(true);
    // Mark all as executing
    const allIds: Record<string, boolean> = {};
    taskData.subtasks.forEach((st) => (allIds[st.id] = true));
    setExecutedSubtasks(allIds);

    onExecuteAll?.(taskData);
    setTimeout(() => setIsExecutingAll(false), 800);
  };

  const handleCopySummary = () => {
    const text = `[TASK BRIEFING] ${taskData.title}\nDepartment: ${taskData.targetDepartment || 'General'}\nSummary: ${taskData.summary}\nSubtasks:\n${taskData.subtasks.map(s => `- [${s.assignedTo}] ${s.title} (${s.priority})`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const completedCount = Object.values(executedSubtasks).filter(Boolean).length;
  const totalSubtasks = taskData.subtasks.length;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedCount / totalSubtasks) * 100) : 100;

  const complexityColor = {
    low: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    medium: "text-sky-400 border-sky-500/30 bg-sky-500/10",
    high: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    critical: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  }[taskData.complexity || "medium"];

  return (
    <div className="my-3.5 rounded-xl border border-emerald-500/30 bg-gradient-to-b from-[#141b18] to-[#101413] shadow-xl overflow-hidden transition-all">
      {/* Intermediate Role Banner */}
      <div className="px-4 py-3 bg-[#19221d] border-b border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Intermediate Task Orchestrator
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {taskData.dispatchedToAdmin ? "DISPATCHED TO WORKFORCE" : "READY FOR DISPATCH"}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white m-0 tracking-tight">
              {taskData.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="p-1.5 rounded-md hover:bg-white/10 text-[#9ca3af] hover:text-white transition-colors"
            title="Copy task summary"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-md hover:bg-white/10 text-[#9ca3af] hover:text-white transition-colors"
            title={isExpanded ? "Collapse task details" : "Expand task details"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3.5 text-xs">
          {/* Executive Summary */}
          <div className="text-[#cbd5e1] leading-relaxed bg-[#0d1210] p-3 rounded-lg border border-[#24332b]">
            <p className="m-0 font-medium">{taskData.summary}</p>
          </div>

          {/* Metadata Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {taskData.targetDepartment && (
              <span className="px-2.5 py-1 rounded-md bg-[#18231e] border border-[#273930] text-emerald-300 font-semibold flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-emerald-400" />
                <span>Dept: {taskData.targetDepartment}</span>
              </span>
            )}
            {taskData.complexity && (
              <span className={`px-2.5 py-1 rounded-md border font-semibold uppercase ${complexityColor}`}>
                Complexity: {taskData.complexity}
              </span>
            )}
            {taskData.estimatedDuration && (
              <span className="px-2.5 py-1 rounded-md bg-[#18231e] border border-[#273930] text-[#9ca3af] flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                <span>Est: {taskData.estimatedDuration}</span>
              </span>
            )}
            {taskData.toolsRequired && taskData.toolsRequired.length > 0 && (
              <span className="px-2.5 py-1 rounded-md bg-[#18231e] border border-[#273930] text-emerald-400 font-mono text-[11px] flex items-center gap-1.5">
                <Terminal className="w-3 h-3" />
                <span>Tools: {taskData.toolsRequired.join(", ")}</span>
              </span>
            )}
          </div>

          {/* Subtasks List */}
          {taskData.subtasks && taskData.subtasks.length > 0 && (
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between text-[#9ca3af] font-semibold pb-1 border-b border-[#233129]">
                <span>Decomposed Subtasks ({taskData.subtasks.length})</span>
                <span className="text-[11px] text-emerald-400">
                  {completedCount}/{totalSubtasks} Dispatched
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-[#17221c] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="space-y-2 pt-1">
                {taskData.subtasks.map((st, idx) => {
                  const isDone = executedSubtasks[st.id] || st.status === "completed";
                  return (
                    <div
                      key={st.id || idx}
                      className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                        isDone
                          ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-200"
                          : "bg-[#131b17] border-[#25362c] text-[#e5e7eb]"
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="mt-0.5 flex-shrink-0">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-[#42574c] flex items-center justify-center text-[10px] text-[#9ca3af]">
                              {idx + 1}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white tracking-tight">{st.title}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#1e2c24] text-emerald-300 border border-[#344c3e]">
                              @{st.assignedTo}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-amber-300">
                              [{st.priority}]
                            </span>
                          </div>
                          {st.description && (
                            <p className="text-[11px] text-[#9ca3af] m-0 mt-0.5 truncate">
                              {st.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRunSubtask(st)}
                        disabled={isDone}
                        className={`flex-shrink-0 px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                          isDone
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                        }`}
                      >
                        {isDone ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            <span>Run</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 border-t border-[#233129] flex items-center justify-between flex-wrap gap-2">
            <div className="text-[11px] text-[#9ca3af] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Orchestrated by Rufflo Autonomous Engine</span>
            </div>

            <div className="flex items-center gap-2">
              {onOpenQueue && (
                <button
                  onClick={onOpenQueue}
                  className="px-3 py-1.5 rounded-lg border border-[#33463a] bg-[#16211a] hover:bg-[#1f2d24] text-[#cbd5e1] hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>View Fleet Queue</span>
                </button>
              )}
              <button
                onClick={handleRunAll}
                disabled={isExecutingAll}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/50 flex items-center gap-1.5 active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{isExecutingAll ? "Dispatching Fleet..." : "Dispatch All Subtasks"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntermediateTaskExecutionCard;
