import React from 'react';
import { Agent, FleetTask } from '../types';
import { Bot, Terminal, ShieldAlert, Cpu, Globe, CheckCircle2, ChevronRight, MessageSquare, Play, Pause, Activity } from 'lucide-react';

interface AgentDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
  tasks: FleetTask[];
  onOpenWorkstation: () => void;
  onOpenCall: () => void;
}

export function AgentDetailDrawer({ isOpen, onClose, agent, tasks, onOpenWorkstation, onOpenCall }: AgentDetailDrawerProps) {
  if (!isOpen || !agent) return null;

  const agentTasks = tasks.filter(t => t.assignedTo === agent.id);
  const activeTask = agentTasks.find(t => t.status === 'running');
  const completedTasks = agentTasks.filter(t => t.status === 'completed').length;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity" 
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-[#121110] border-l border-[#3c3836] z-[101] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-[#3c3836] flex justify-between items-start">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold bg-[#ebdbb2]/10 text-[#ebdbb2] border border-[#ebdbb2]/20">
              {agent.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">{agent.name}</h2>
                <span className={`w-2 h-2 rounded-full ${agent.status === 'working' ? 'bg-emerald-500 animate-pulse' : agent.status === 'idle' ? 'bg-[#fabd2f]' : 'bg-red-500'}`} />
              </div>
              <p className="text-[#a89984] font-mono text-xs mt-1 uppercase tracking-wider">{agent.role}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#a89984] hover:text-white p-2">✕</button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Current Mission */}
          <section>
            <div className="text-[10px] font-bold text-[#928374] tracking-widest uppercase mb-3 flex items-center gap-2">
              <Activity className="w-3 h-3" /> Current Mission
            </div>
            {activeTask ? (
              <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-4">
                <h3 className="text-white font-medium mb-3">{activeTask.description}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-[#a89984] font-mono">
                    <span>Task Progress</span>
                    <span className="text-emerald-400">78%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#3c3836] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[78%] rounded-full relative">
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#1d2021] border border-[#3c3836] border-dashed rounded-xl p-4 text-center text-[#a89984] text-sm font-mono">
                Awaiting new directive
              </div>
            )}
          </section>

          {/* Reasoning Trace */}
          <section>
            <div className="text-[10px] font-bold text-[#928374] tracking-widest uppercase mb-3 flex items-center gap-2">
              <Cpu className="w-3 h-3" /> Reasoning Chain
            </div>
            <div className="border-l-2 border-[#3c3836] ml-3 pl-5 py-1 space-y-4 font-mono text-xs">
              <div className="relative">
                <span className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-[#1d2021] border-2 border-[#83a598]" />
                <span className="text-[#a89984]">Analyze existing auth flow</span>
              </div>
              <div className="relative">
                <span className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-[#1d2021] border-2 border-[#83a598]" />
                <span className="text-[#a89984]">Inspect database schema</span>
              </div>
              <div className="relative">
                <span className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-[#1d2021] border-2 border-[#fabd2f]" />
                <span className="text-white font-bold bg-[#fabd2f]/10 px-2 py-0.5 rounded border border-[#fabd2f]/30">Implement OAuth callbacks</span>
                <span className="ml-2 text-emerald-400 text-[10px] animate-pulse">Running...</span>
              </div>
              <div className="relative opacity-50">
                <span className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-[#1d2021] border-2 border-[#3c3836]" />
                <span className="text-[#a89984]">Run security tests</span>
              </div>
            </div>
          </section>

          {/* Active Tools */}
          <section>
            <div className="text-[10px] font-bold text-[#928374] tracking-widest uppercase mb-3 flex items-center gap-2">
              <Terminal className="w-3 h-3" /> Tool Connectors
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Browser', icon: Globe, active: true },
                { name: 'GitHub', icon: Terminal, active: true },
                { name: 'Terminal', icon: Terminal, active: true },
                { name: 'Database', icon: ShieldAlert, active: false }
              ].map(tool => (
                <div key={tool.name} className={`flex items-center gap-3 p-3 rounded-lg border ${tool.active ? 'bg-[#ebdbb2]/5 border-[#ebdbb2]/10 text-[#ebdbb2]' : 'bg-transparent border-[#3c3836] text-[#665c54]'}`}>
                  <tool.icon className="w-4 h-4" />
                  <span className="text-xs font-bold">{tool.name}</span>
                  {tool.active && <CheckCircle2 className="w-3 h-3 ml-auto text-emerald-500" />}
                </div>
              ))}
            </div>
          </section>

          {/* Memory / Stats */}
          <section>
            <div className="text-[10px] font-bold text-[#928374] tracking-widest uppercase mb-3 flex items-center gap-2">
              <Bot className="w-3 h-3" /> Memory & Stats
            </div>
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="bg-[#1d2021] border border-[#3c3836] p-3 rounded-lg">
                <div className="text-[#a89984] text-[10px] mb-1">LEARNED FACTS</div>
                <div className="text-lg text-white font-bold">2,841</div>
              </div>
              <div className="bg-[#1d2021] border border-[#3c3836] p-3 rounded-lg">
                <div className="text-[#a89984] text-[10px] mb-1">TASKS DONE</div>
                <div className="text-lg text-white font-bold">{completedTasks}</div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[#3c3836] bg-[#1d2021] grid grid-cols-3 gap-3">
          <button className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-[#3c3836] bg-[#121110] text-[#a89984] hover:text-white hover:bg-[#3c3836] transition-colors text-xs font-bold">
            <Pause className="w-4 h-4" /> Pause
          </button>
          <button onClick={onOpenWorkstation} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#ebdbb2] text-[#121110] hover:bg-white transition-colors text-xs font-bold">
            <Terminal className="w-4 h-4" /> Inspect
          </button>
          <button onClick={onOpenCall} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-[#3c3836] bg-[#121110] text-[#a89984] hover:text-white hover:bg-[#3c3836] transition-colors text-xs font-bold">
            <MessageSquare className="w-4 h-4" /> Message
          </button>
        </div>

      </div>
    </>
  );
}
