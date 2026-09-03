import React from 'react';
import { Agent } from '../types';
import { soundFx } from '../utils/speech';
import { MessageSquare, Zap } from 'lucide-react';

interface AgentRosterProps {
  agents: Agent[];
  selectedAgentId: string;
  onSelectAgent: (agentId: string) => void;
  onTalkToAgent: (agentId: string) => void;
}

export const AgentRoster: React.FC<AgentRosterProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  onTalkToAgent,
}) => {
  return (
    <div className="w-full bg-[#ebdbb2] dark:bg-[#1d2021] border-t-2 border-[#d5c4a1] dark:border-[#3c3836] p-2 select-none overflow-x-auto shadow-xl">
      <div className="flex items-center gap-2 min-w-max">
        {agents.map((agent) => {
          const isSelected = agent.id === selectedAgentId;

          // Custom role badges inspired by munderdiffl screenshot
          const roleTag =
            agent.id === 'michael'
              ? 'GOD'
              : agent.id === 'cline'
              ? 'clineDev'
              : agent.id === 'jim' || agent.id === 'pam' || agent.id === 'kevin'
              ? 'claudeTerminalHarness'
              : agent.id === 'ryan' || agent.id === 'meredith'
              ? 'onlygains'
              : agent.id === 'stanley'
              ? 'InstaContent'
              : 'rufloCore';

          return (
            <div
              key={agent.id}
              id={`agent-card-${agent.id}`}
              onClick={() => {
                soundFx.playClick();
                onSelectAgent(agent.id);
              }}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded border transition-all cursor-pointer min-w-[170px] ${
                isSelected
                  ? 'bg-[#fbf1c7] dark:bg-[#282828] border-[#fabd2f] ring-2 ring-[#fabd2f]/40 shadow-md'
                  : 'bg-[#ebdbb2]/80 dark:bg-[#181615] border-[#d5c4a1] dark:border-[#3c3836] hover:border-[#bdae93] dark:hover:border-[#504945]'
              }`}
            >
              {/* Pixel Avatar Box */}
              <div
                className="flex items-center justify-center w-8 h-8 rounded border text-lg relative shrink-0 shadow-inner"
                style={{
                  backgroundColor: agent.color + '25',
                  borderColor: agent.color,
                }}
              >
                <span>{agent.avatar}</span>
                {agent.status === 'working' && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#1d2021] animate-ping" />
                )}
              </div>

              {/* Agent Details */}
              <div className="flex-1 min-w-0 font-mono">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-[#3c3836] dark:text-[#ebdbb2] truncate">
                      {agent.nickname}
                    </span>
                    {roleTag && (
                      <span className="text-[8px] px-1 py-0.2 rounded font-bold uppercase bg-[#d5c4a1] dark:bg-[#3c3836] text-[#7c6f64] dark:text-[#a89984]">
                        {roleTag}
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[9px] font-bold px-1 py-0.2 rounded ${
                      agent.status === 'working'
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/20'
                        : 'text-[#7c6f64] dark:text-[#928374] bg-[#d5c4a1]/50 dark:bg-[#3c3836]/50'
                    }`}
                  >
                    ■ {agent.status}
                  </span>
                </div>

                <div className="text-[9px] text-[#7c6f64] dark:text-[#928374] truncate">
                  {agent.role.split('/')[0]}
                </div>

                {/* Micro Quantum State Indicator */}
                <div 
                  className="mt-0.5 px-1 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/25 flex items-center justify-between text-[8px] font-mono text-cyan-300"
                  title={`Quantum Model: 4 Superposed Paths. Easiest: ${agent.quantumState?.winningStrategyName || 'Direct'}`}
                >
                  <span className="flex items-center gap-1 truncate">
                    <span className="text-cyan-400 font-bold">|ψ⟩</span>
                    <span className="truncate max-w-[80px]">
                      {agent.quantumState?.winningStrategyName 
                        ? agent.quantumState.winningStrategyName.split(' ')[0] 
                        : 'Easiest'}
                    </span>
                  </span>
                  <span className="text-emerald-400 font-bold ml-1 shrink-0">
                    D{agent.quantumState?.superpositionCandidates?.find(c => c.complexity === 'Minimal / Easiest')?.difficultyScore || 2}
                  </span>
                </div>

                {/* Bottom Talk Action Button */}
                <div className="mt-1 flex items-center justify-between">
                  <button
                    id={`btn-talk-${agent.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFx.playClick();
                      onTalkToAgent(agent.id);
                    }}
                    className="px-1.5 py-0.5 rounded bg-[#d5c4a1] dark:bg-[#3c3836] hover:bg-[#fabd2f] hover:text-[#1d2021] text-[9px] font-bold flex items-center gap-0.5 transition-colors border border-[#bdae93] dark:border-[#504945]"
                  >
                    <MessageSquare className="w-2.5 h-2.5" />
                    <span>talk</span>
                  </button>

                  {/* Micro Token Bar */}
                  <div className="w-12 h-1 bg-[#d5c4a1] dark:bg-[#3c3836] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{
                        width: `${Math.min(100, (agent.tokensProcessed / 200000) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
