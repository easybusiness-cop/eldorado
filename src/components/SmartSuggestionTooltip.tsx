import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, CheckCircle2, Clock, Gauge, ArrowRight, BrainCircuit } from 'lucide-react';
import { Agent } from '../types';
import { getSmartTaskSuggestion, SmartTaskSuggestion } from '../utils/smartTaskSuggestions';
import { HeartbeatVariabilitySparkline } from './HeartbeatVariabilitySparkline';
import { soundFx } from '../utils/speech';

interface SmartSuggestionTooltipProps {
  agent: Agent;
  isVisible: boolean;
  position?: 'top' | 'bottom' | 'right' | 'left' | 'floating';
  customSuggestion?: SmartTaskSuggestion;
  onAssignTask?: (agentId: string, suggestion: SmartTaskSuggestion) => void;
  anchorOffset?: { x: number; y: number };
}

export const SmartSuggestionTooltip: React.FC<SmartSuggestionTooltipProps> = ({
  agent,
  isVisible,
  position = 'top',
  customSuggestion,
  onAssignTask,
}) => {
  const suggestion = customSuggestion || getSmartTaskSuggestion(agent);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          dot: 'bg-rose-500',
          label: 'CRITICAL',
        };
      case 'high':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-500',
          label: 'HIGH PRIORITY',
        };
      default:
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-500',
          label: 'RECOMMENDED',
        };
    }
  };

  const priorityBadge = getPriorityBadge(suggestion.priority);

  // Position-specific container styling
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'right':
        return 'left-full top-0 ml-3';
      case 'left':
        return 'right-full top-0 mr-3';
      case 'floating':
        return 'bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-3';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: position === 'bottom' ? -8 : 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === 'bottom' ? -4 : 4, scale: 0.96 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute ${getPositionClasses()} z-50 pointer-events-auto w-[345px] max-w-[92vw] text-left font-sans select-none`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Main Card Container */}
          <div className="relative overflow-hidden rounded-xl border border-cyan-500/35 bg-[#12151e]/95 backdrop-blur-xl shadow-2xl shadow-cyan-950/50 text-[#ebdbb2] p-3.5 ring-1 ring-white/10">
            {/* Ambient Background Gradient Accent */}
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-tr from-emerald-500/15 to-transparent rounded-full blur-xl pointer-events-none" />

            {/* Header: Smart Suggestion Pill & Match Score */}
            <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-cyan-500/40">
                  <Sparkles className="w-3 h-3 animate-pulse" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                    Smart Suggestion
                  </div>
                  <div className="text-[8.5px] font-mono text-zinc-400">
                    Next Best Mission
                  </div>
                </div>
              </div>

              {/* Match Score Badge */}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 font-mono text-[10px] font-bold shadow-inner">
                <BrainCircuit className="w-3 h-3 text-cyan-400" />
                <span>{suggestion.matchScore}% Match</span>
              </div>
            </div>

            {/* Suggested Task Content */}
            <div className="space-y-2.5">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${priorityBadge.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${priorityBadge.dot}`} />
                    {priorityBadge.label}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 truncate">
                    {suggestion.category}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-white leading-snug line-clamp-2">
                  {suggestion.title}
                </h4>
              </div>

              {/* Micro-sparkline Graph: 60s Heartbeat Variability & Token Processing Load Correlation */}
              <HeartbeatVariabilitySparkline agent={agent} />

              {/* Skill Matching Badges */}
              <div className="rounded-lg bg-black/40 border border-white/5 p-2 space-y-1.5">
                <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>Matched Skillset</span>
                  <span className="text-emerald-400 font-mono text-[10px]">Proficiency Verified</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {suggestion.matchingSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/80 text-[10px] font-mono text-zinc-200"
                    >
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                      <span className="truncate max-w-[130px]">{skill}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Reasoning Text */}
              <p className="text-[11px] text-zinc-300 leading-relaxed italic bg-cyan-950/30 border border-cyan-500/20 rounded-md p-2">
                &ldquo;{suggestion.reasoning}&rdquo;
              </p>

              {/* Complexity, Duration & Projected Impact */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] font-mono text-zinc-400">
                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/5">
                  <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Est: <strong className="text-zinc-200">{suggestion.estimatedDuration}</strong></span>
                </div>
                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/5">
                  <Gauge className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>Diff: <strong className="text-emerald-400">{suggestion.difficultyScore}/10</strong></span>
                </div>
              </div>

              {/* Action / Assign Button */}
              {onAssignTask && (
                <button
                  id={`smart-assign-btn-${agent.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFx.playSuccess();
                    onAssignTask(agent.id, suggestion);
                  }}
                  className="w-full mt-2 py-1.5 px-3 rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-[11px] flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-600/30 transition-all active:scale-98 cursor-pointer border border-cyan-400/30"
                >
                  <Zap className="w-3.5 h-3.5 fill-current text-cyan-200" />
                  <span>{suggestion.suggestedActionLabel}</span>
                  <ArrowRight className="w-3 h-3 ml-auto opacity-70" />
                </button>
              )}
            </div>

            {/* Pointer arrow tip */}
            {position === 'top' && (
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[#12151e] border-r border-b border-cyan-500/35" />
            )}
            {position === 'bottom' && (
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[#12151e] border-l border-t border-cyan-500/35" />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
