import React, { useState, useEffect } from 'react';
import { Agent, FleetTask } from '../types';
import { Bot, Terminal, ShieldAlert, Cpu, Globe, CheckCircle2, ChevronRight, MessageSquare, Play, Pause, Activity, Send, Radio, Check, ExternalLink, Loader2 } from 'lucide-react';

interface AgentDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
  tasks: FleetTask[];
  onOpenWorkstation: () => void;
  onOpenCall: () => void;
  onToggleTelegramSync?: (agentId: string, enabled: boolean, channelId?: string) => void;
}

const TELEGRAM_CHANNELS = [
  { id: '-1001928374650', title: '⚡ Rufflo Autonomous Fleet War Room', category: 'fleet_operations' },
  { id: '-1002049182391', title: '🛠️ Dunder Mifflin Engineering Guild', category: 'engineering' },
  { id: '-1003182938472', title: '🛡️ SafetyGuard & Security Overwatch', category: 'security' },
  { id: '-1004920193821', title: '📢 Executive Dispatch & Direct Feed', category: 'executive' },
];

export function AgentDetailDrawer({ 
  isOpen, 
  onClose, 
  agent, 
  tasks, 
  onOpenWorkstation, 
  onOpenCall,
  onToggleTelegramSync
}: AgentDetailDrawerProps) {
  if (!isOpen || !agent) return null;

  const [syncEnabled, setSyncEnabled] = useState<boolean>(agent.telegramSyncEnabled ?? false);
  const [targetChannelId, setTargetChannelId] = useState<string>(agent.telegramChannelId || '-1001928374650');
  const [testPingSending, setTestPingSending] = useState<boolean>(false);
  const [testPingStatus, setTestPingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (agent) {
      setSyncEnabled(agent.telegramSyncEnabled ?? false);
      setTargetChannelId(agent.telegramChannelId || '-1001928374650');
    }
  }, [agent]);

  const agentTasks = tasks.filter(t => t.assignedTo === agent.id);
  const activeTask = agentTasks.find(t => t.status === 'running');
  const completedTasks = agentTasks.filter(t => t.status === 'completed').length;

  const handleToggleSync = (newVal: boolean) => {
    setSyncEnabled(newVal);
    if (onToggleTelegramSync) {
      onToggleTelegramSync(agent.id, newVal, targetChannelId);
    }
  };

  const handleChannelChange = (channelId: string) => {
    setTargetChannelId(channelId);
    if (syncEnabled && onToggleTelegramSync) {
      onToggleTelegramSync(agent.id, true, channelId);
    }
  };

  const handleSendTestPing = async () => {
    setTestPingSending(true);
    setTestPingStatus(null);
    try {
      const channel = TELEGRAM_CHANNELS.find(c => c.id === targetChannelId);
      const res = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: targetChannelId,
          text: `⚡ [TELEGRAM SYNC VERIFIED] Agent ${agent.name} (${agent.role}) is live-linked to Telegram! System logs & interactions routed autonomously.`,
          senderName: `${agent.name} (Agent)`,
          agentId: agent.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setTestPingStatus(`✓ Delivered to ${channel?.title || 'Telegram Channel'}!`);
      } else {
        setTestPingStatus('⚠ Failed to dispatch test ping.');
      }
    } catch {
      setTestPingStatus('⚠ Dispatch connection error.');
    } finally {
      setTestPingSending(false);
      setTimeout(() => setTestPingStatus(null), 4000);
    }
  };

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

          {/* Telegram Integration */}
          <section className="bg-[#1a232e]/60 border border-[#24a1de]/30 rounded-xl p-4 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#24a1de]/20 border border-[#24a1de]/40 flex items-center justify-center text-[#24a1de]">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    Sync to Telegram
                    {syncEnabled && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold uppercase animate-pulse">
                        LIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#a89984] leading-tight">
                    Route logs, reasoning & chats to a Telegram channel
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => handleToggleSync(!syncEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  syncEnabled ? 'bg-[#24a1de]' : 'bg-[#3c3836]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    syncEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {syncEnabled ? (
              <div className="pt-2 border-t border-[#24a1de]/20 space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-[10px] text-[#24a1de] uppercase tracking-wider font-bold mb-1.5">
                    Linked Telegram Channel
                  </label>
                  <select
                    value={targetChannelId}
                    onChange={(e) => handleChannelChange(e.target.value)}
                    className="w-full bg-[#121110] border border-[#24a1de]/40 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#24a1de]"
                  >
                    {TELEGRAM_CHANNELS.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 text-[11px] text-[#a89984]">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>Auto-route system logs & diagnostics</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>Mirror chat responses & standup dispatches</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>Real-time webhook routing enabled</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleSendTestPing}
                    disabled={testPingSending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#24a1de]/20 border border-[#24a1de]/40 text-[#38bdf8] hover:bg-[#24a1de]/30 transition-colors text-xs font-bold disabled:opacity-50"
                  >
                    {testPingSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{testPingSending ? 'Sending Ping...' : 'Send Test Ping'}</span>
                  </button>

                  {testPingStatus && (
                    <span className="text-[10px] font-bold text-emerald-400 animate-in fade-in">
                      {testPingStatus}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-[#7c6f64] italic">
                Toggle ON to connect {agent.name} to Telegram for real-time channel broadcasting.
              </div>
            )}
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
