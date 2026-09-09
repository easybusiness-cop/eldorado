import React, { useState, useEffect } from 'react';
import { Agent, FleetTask } from '../types';
import { 
  Bot, 
  Terminal, 
  ShieldAlert, 
  Cpu, 
  Globe, 
  CheckCircle2, 
  ChevronRight, 
  MessageSquare, 
  Play, 
  Pause, 
  Activity, 
  Send, 
  Radio, 
  Check, 
  ExternalLink, 
  Loader2,
  ArrowRightLeft,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { soundFx } from '../utils/speech';

interface AgentDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
  tasks: FleetTask[];
  onOpenWorkstation: () => void;
  onOpenCall: () => void;
  onToggleTelegramSync?: (agentId: string, enabled: boolean, channelId?: string) => void;
  agents?: Agent[];
  onReassignTask?: (taskId: string, newAssignedTo: string) => Promise<void> | void;
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
  onToggleTelegramSync,
  agents = [],
  onReassignTask
}: AgentDetailDrawerProps) {
  if (!isOpen || !agent) return null;

  const [syncEnabled, setSyncEnabled] = useState<boolean>(agent.telegramSyncEnabled ?? false);
  const [targetChannelId, setTargetChannelId] = useState<string>(agent.telegramChannelId || '-1001928374650');
  const [testPingSending, setTestPingSending] = useState<boolean>(false);
  const [testPingStatus, setTestPingStatus] = useState<string | null>(null);

  // Auto-delegate prompt modal state
  const [showDelegateModal, setShowDelegateModal] = useState<boolean>(false);
  const [delegateTaskId, setDelegateTaskId] = useState<string>('');
  const [delegateTargetAgentId, setDelegateTargetAgentId] = useState<string>('');
  const [delegateStatus, setDelegateStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isDelegating, setIsDelegating] = useState<boolean>(false);

  useEffect(() => {
    if (agent) {
      setSyncEnabled(agent.telegramSyncEnabled ?? false);
      setTargetChannelId(agent.telegramChannelId || '-1001928374650');
      setShowDelegateModal(false);
      setDelegateStatus(null);
    }
  }, [agent]);

  const agentTasks = tasks.filter(t => t.assignedTo === agent.id);
  const activeTask = agentTasks.find(t => t.status === 'running') || agentTasks[0];
  const completedTasks = agentTasks.filter(t => t.status === 'completed').length;

  // Active / non-completed tasks eligible for delegation
  const nonCompletedTasks = agentTasks.filter(t => t.status !== 'completed');
  const lowPriorityTasks = nonCompletedTasks.filter(t => t.priority === 'low' || t.priority === 'medium');
  const delegatableTasks = lowPriorityTasks.length > 0 ? lowPriorityTasks : nonCompletedTasks;

  // Candidate peer agents (excluding the current agent)
  const candidateAgents = (agents || [])
    .filter(a => a.id !== agent.id)
    .map(a => {
      const peerActiveTasks = tasks.filter(t => t.assignedTo === a.id && t.status !== 'completed');
      return {
        ...a,
        activeTaskCount: peerActiveTasks.length,
        isIdle: a.status === 'idle' || peerActiveTasks.length === 0,
      };
    })
    .sort((a, b) => {
      if (a.isIdle && !b.isIdle) return -1;
      if (!a.isIdle && b.isIdle) return 1;
      return a.activeTaskCount - b.activeTaskCount;
    });

  const bestIdleCandidate = candidateAgents.find(a => a.isIdle) || candidateAgents[0];

  const handleOpenAutoDelegate = () => {
    soundFx.playClick();
    if (nonCompletedTasks.length === 0) {
      setDelegateStatus({
        type: 'error',
        message: `${agent.name} has no active tasks to delegate.`,
      });
      setTimeout(() => setDelegateStatus(null), 3500);
      return;
    }
    if (candidateAgents.length === 0) {
      setDelegateStatus({
        type: 'error',
        message: `No candidate peer agents found in the fleet.`,
      });
      setTimeout(() => setDelegateStatus(null), 3500);
      return;
    }

    // Default to lowest-priority task first, and top idle candidate
    const initialTaskId = delegatableTasks[0]?.id || nonCompletedTasks[0]?.id || '';
    const initialTargetId = bestIdleCandidate?.id || candidateAgents[0]?.id || '';

    setDelegateTaskId(initialTaskId);
    setDelegateTargetAgentId(initialTargetId);
    setShowDelegateModal(true);
    setDelegateStatus(null);
  };

  const handleConfirmDelegation = async () => {
    if (!delegateTaskId || !delegateTargetAgentId) return;
    setIsDelegating(true);
    try {
      const targetAgent = candidateAgents.find(a => a.id === delegateTargetAgentId);
      const targetTask = agentTasks.find(t => t.id === delegateTaskId);
      const taskTitle = targetTask ? targetTask.title : 'Task';
      const targetName = targetAgent ? targetAgent.name : delegateTargetAgentId;

      if (onReassignTask) {
        await onReassignTask(delegateTaskId, delegateTargetAgentId);
      }

      soundFx.playNotification();
      setDelegateStatus({
        type: 'success',
        message: `✓ Reassigned "${taskTitle}" to ${targetName}!`,
      });

      setTimeout(() => {
        setIsDelegating(false);
        setShowDelegateModal(false);
        setDelegateStatus(null);
      }, 2000);
    } catch (e: any) {
      setIsDelegating(false);
      setDelegateStatus({
        type: 'error',
        message: e?.message || 'Failed to reassign task.',
      });
    }
  };

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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Current Mission & Task Queue */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold text-[#928374] tracking-widest uppercase flex items-center gap-2">
                <Activity className="w-3 h-3" /> Operational Tasks ({agentTasks.length})
              </div>
              <button
                type="button"
                onClick={handleOpenAutoDelegate}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:text-amber-300 text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                title="Auto-delegate low-priority tasks from this agent to an idle peer"
              >
                <ArrowRightLeft className="w-3 h-3 text-amber-300" />
                <span>⚡ Auto-Delegate</span>
              </button>
            </div>

            {/* Auto-Delegate Prompt Card / Modal */}
            {showDelegateModal && (
              <div className="p-4 rounded-xl bg-[#1d2021] border border-amber-500/40 shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <ArrowRightLeft className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        Auto-Delegate Workload
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Low-Priority Focus
                        </span>
                      </h4>
                      <p className="text-[11px] text-[#a89984]">
                        Reassign from {agent.name} ({nonCompletedTasks.length} active) to an available peer.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDelegateModal(false)}
                    className="text-[#a89984] hover:text-white p-1 text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* Task Selection */}
                <div>
                  <label className="block text-[10px] text-[#a89984] uppercase font-mono font-bold mb-1">
                    Select Task to Reassign ({delegatableTasks.length} eligible)
                  </label>
                  <select
                    value={delegateTaskId}
                    onChange={(e) => setDelegateTaskId(e.target.value)}
                    className="w-full bg-[#121110] border border-[#3c3836] rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                  >
                    {delegatableTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.priority ? t.priority.toUpperCase() : 'MED'}] {t.title} ({t.progress || 0}%)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Destination Agent */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] text-[#a89984] uppercase font-mono font-bold">
                      Destination Agent
                    </label>
                    {bestIdleCandidate && (
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Best: {bestIdleCandidate.name} ({bestIdleCandidate.isIdle ? 'Idle' : `${bestIdleCandidate.activeTaskCount} tasks`})
                      </span>
                    )}
                  </div>
                  <select
                    value={delegateTargetAgentId}
                    onChange={(e) => setDelegateTargetAgentId(e.target.value)}
                    className="w-full bg-[#121110] border border-[#3c3836] rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    {candidateAgents.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.isIdle ? '⚡ IDLE (0 Tasks)' : `${c.activeTaskCount} Active Tasks`} [{c.role}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Feedback */}
                {delegateStatus && (
                  <div className={`p-2 rounded text-[11px] font-mono font-medium flex items-center gap-2 ${delegateStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/10 text-red-300 border border-red-500/30'}`}>
                    <span>{delegateStatus.message}</span>
                  </div>
                )}

                {/* Confirmation Prompt Actions */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDelegateModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-[#3c3836] bg-[#121110] text-[#a89984] hover:text-white text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelegation}
                    disabled={isDelegating || !delegateTaskId || !delegateTargetAgentId}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#121110] font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {isDelegating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
                    <span>Confirm Delegation</span>
                  </button>
                </div>
              </div>
            )}

            {activeTask ? (
              <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                    Primary Mission • {activeTask.priority || 'medium'} priority
                  </span>
                  <span className="text-xs text-emerald-400 font-mono font-bold">{activeTask.progress || 78}%</span>
                </div>
                <h3 className="text-white font-medium mb-3 text-sm">{activeTask.title || activeTask.description}</h3>
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-[#3c3836] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full relative" style={{ width: `${activeTask.progress || 78}%` }}>
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

            {/* List of other queued/assigned tasks */}
            {agentTasks.length > 1 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] text-[#a89984] uppercase font-mono font-bold">
                  Assigned Queue ({agentTasks.length - 1} additional)
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {agentTasks.filter(t => t.id !== activeTask?.id).map(t => (
                    <div key={t.id} className="p-2 rounded bg-[#1d2021]/80 border border-[#3c3836] flex items-center justify-between text-xs">
                      <div className="truncate mr-2">
                        <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded mr-1.5 ${t.priority === 'low' ? 'bg-blue-500/20 text-blue-300' : t.priority === 'medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}`}>
                          {t.priority || 'med'}
                        </span>
                        <span className="text-[#ebdbb2] truncate">{t.title}</span>
                      </div>
                      <span className="text-[10px] text-[#a89984] font-mono whitespace-nowrap">{t.status}</span>
                    </div>
                  ))}
                </div>
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
        <div className="p-4 border-t border-[#3c3836] bg-[#1d2021] grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={handleOpenAutoDelegate}
            className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 transition-colors text-xs font-bold cursor-pointer"
            title="Auto-delegate low-priority tasks to an idle peer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" /> Delegate
          </button>
          <button className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-lg border border-[#3c3836] bg-[#121110] text-[#a89984] hover:text-white hover:bg-[#3c3836] transition-colors text-xs font-bold">
            <Pause className="w-3.5 h-3.5" /> Pause
          </button>
          <button onClick={onOpenWorkstation} className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-lg bg-[#ebdbb2] text-[#121110] hover:bg-white transition-colors text-xs font-bold">
            <Terminal className="w-3.5 h-3.5" /> Inspect
          </button>
          <button onClick={onOpenCall} className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-lg border border-[#3c3836] bg-[#121110] text-[#a89984] hover:text-white hover:bg-[#3c3836] transition-colors text-xs font-bold">
            <MessageSquare className="w-3.5 h-3.5" /> Message
          </button>
        </div>

      </div>
    </>
  );
}
