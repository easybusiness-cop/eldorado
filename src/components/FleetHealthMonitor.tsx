import React, { useState, useMemo } from 'react';
import { Agent, FleetTask, AgentLog, QuantumSuperpositionCandidate } from '../types';
import { Activity, Zap, Cpu, Sparkles, Layers, Atom, CheckCircle2, ChevronRight, X, Play, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { getAgentQuantumState, generateSuperpositionCandidates, runQuantumModelForTask } from '../utils/quantumEngine';
import { soundFx } from '../utils/speech';

interface FleetHealthMonitorProps {
  agents: Agent[];
  tasks: FleetTask[];
  logs?: AgentLog[];
  selectedAgentId?: string;
  onSelectAgent?: (agentId: string) => void;
  compact?: boolean;
}

export interface ThroughputTier {
  tier: 'idle' | 'low' | 'medium' | 'high' | 'ultra';
  label: string;
  color: string;
  glowColor: string;
  bgBadge: string;
  textBadge: string;
  pulseSpeed: string;
  intensity: number;
}

export function getAgentThroughputTier(agent: Agent, isWorking: boolean): ThroughputTier {
  if (!isWorking) {
    return {
      tier: 'idle',
      label: 'IDLE / READY',
      color: '#686f82',
      glowColor: 'rgba(104, 111, 130, 0.2)',
      bgBadge: 'rgba(255, 255, 255, 0.05)',
      textBadge: '#a0a7b9',
      pulseSpeed: '0s',
      intensity: 0.2,
    };
  }

  const tokens = agent.tokensProcessed || 0;
  if (tokens > 4000) {
    return {
      tier: 'ultra',
      label: 'QUANTUM PEAK',
      color: '#ff4da6',
      glowColor: 'rgba(255, 77, 166, 0.6)',
      bgBadge: 'rgba(255, 77, 166, 0.2)',
      textBadge: '#ffb3d9',
      pulseSpeed: '0.6s',
      intensity: 1.0,
    };
  }

  if (tokens > 1500) {
    return {
      tier: 'high',
      label: 'HIGH VELOCITY',
      color: '#00d9ff',
      glowColor: 'rgba(0, 217, 255, 0.5)',
      bgBadge: 'rgba(0, 217, 255, 0.2)',
      textBadge: '#80ebff',
      pulseSpeed: '1.0s',
      intensity: 0.8,
    };
  }

  if (tokens > 500) {
    return {
      tier: 'medium',
      label: 'ACTIVE COMPUTE',
      color: '#7c5cff',
      glowColor: 'rgba(124, 92, 255, 0.4)',
      bgBadge: 'rgba(124, 92, 255, 0.2)',
      textBadge: '#c4b5fd',
      pulseSpeed: '1.5s',
      intensity: 0.5,
    };
  }

  return {
    tier: 'low',
    label: 'BASE DISPATCH',
    color: '#34d399',
    glowColor: 'rgba(52, 211, 153, 0.3)',
    bgBadge: 'rgba(52, 211, 153, 0.15)',
    textBadge: '#a7f3d0',
    pulseSpeed: '2.0s',
    intensity: 0.3,
  };
}

export function formatTokenThroughput(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
  return `${tokens}`;
}

export const FleetHealthMonitor: React.FC<FleetHealthMonitorProps> = ({
  agents,
  tasks,
  selectedAgentId,
  onSelectAgent,
  compact = false,
}) => {
  const [monitorMode, setMonitorMode] = useState<'throughput' | 'quantum'>('throughput');
  const [inspectedAgentId, setInspectedAgentId] = useState<string | null>(null);
  const [isSimulatingQuantum, setIsSimulatingQuantum] = useState(false);
  const [sweepProgress, setSweepProgress] = useState(0);

  // Compute live aggregates
  const { totalTokens, activeWorkingCount } = useMemo(() => {
    let total = 0;
    let working = 0;
    for (const a of agents) {
      total += a.tokensProcessed || 0;
      if (a.status === 'working' || a.status === 'thinking') {
        working++;
      }
    }
    return {
      totalTokens: total,
      activeWorkingCount: working,
    };
  }, [agents]);

  // Agent selected for detailed quantum superposition inspection
  const inspectedAgent = useMemo(() => {
    if (!inspectedAgentId) return null;
    return agents.find(a => a.id === inspectedAgentId) || null;
  }, [inspectedAgentId, agents]);

  // Generate or read quantum state for an agent
  const getSuperpositionState = (agent: Agent) => {
    const candidates = agent.quantumState?.superpositionCandidates || generateSuperpositionCandidates(agent, agent.currentTask || 'Operational maintenance');
    const winning = candidates.find(c => c.complexity === 'Minimal / Easiest' || c.status === 'collapsed_winner') || candidates[2];
    const isEvaluating = agent.status === 'working' || agent.status === 'thinking' || isSimulatingQuantum;
    return {
      candidates,
      winning,
      isEvaluating,
      phase: isEvaluating ? 'amplitude_amplification' : (agent.quantumState?.phase || 'measurement_collapsed'),
      qubits: 4,
      fidelity: 99.8,
    };
  };

  const handleTriggerFleetQuantumSweep = () => {
    if (isSimulatingQuantum) return;
    setIsSimulatingQuantum(true);
    setSweepProgress(15);
    soundFx.playClick();

    const t1 = setTimeout(() => {
      setSweepProgress(55);
    }, 400);

    const t2 = setTimeout(() => {
      setSweepProgress(90);
    }, 850);

    const t3 = setTimeout(() => {
      setSweepProgress(100);
      setIsSimulatingQuantum(false);
      soundFx.playSuccessChime();
    }, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  };

  return (
    <div className={`fleet-health-monitor ${compact ? 'p-2.5 rounded-lg' : 'p-3.5 rounded-xl'} bg-[#12141c] border border-white/10 text-white font-mono shadow-xl relative overflow-hidden`}>
      {/* Background Pulse Ambience */}
      <div 
        className="absolute -right-16 -top-16 w-56 h-56 rounded-full pointer-events-none opacity-20 blur-3xl transition-all duration-700"
        style={{
          background: monitorMode === 'quantum'
            ? 'radial-gradient(circle, #00d9ff 0%, #bdae93 60%, transparent 80%)'
            : (activeWorkingCount > 0 
                ? 'radial-gradient(circle, #8b5cf6 0%, #00d9ff 100%)' 
                : 'radial-gradient(circle, #686f82 0%, transparent 70%)')
        }}
      />

      {/* Top Header with Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
            monitorMode === 'quantum' 
              ? 'bg-[#00d9ff]/20 border-[#00d9ff]/40 text-[#00d9ff]' 
              : 'bg-[#7c5cff]/20 border-[#7c5cff]/40 text-[#00d9ff]'
          }`}>
            {monitorMode === 'quantum' ? (
              <Atom className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
            ) : (
              <Activity className="w-4 h-4 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs tracking-wider text-white">
                {monitorMode === 'quantum' ? 'QUANTUM SUPERPOSITION SEARCH ENGINE' : 'FLEET HEALTH & THROUGHPUT MONITOR'}
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-[#70788e]">
              {monitorMode === 'quantum'
                ? 'Multi-path superposition evaluation • Grover amplitude amplification • Wavefunction collapse to easiest build path'
                : 'Real-time token velocity & autonomous processing telemetry'}
            </p>
          </div>
        </div>

        {/* View Mode Selector Tabs & Actions */}
        <div className="flex items-center gap-2">
          <div className="bg-black/50 p-1 rounded-lg border border-white/10 flex items-center gap-1 text-xs">
            <button
              onClick={() => setMonitorMode('quantum')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                monitorMode === 'quantum'
                  ? 'bg-[#00d9ff]/20 text-[#00d9ff] border border-[#00d9ff]/40 shadow-sm'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              <Atom className="w-3 h-3" />
              <span>Quantum States (|ψ⟩)</span>
            </button>
            <button
              onClick={() => setMonitorMode('throughput')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                monitorMode === 'throughput'
                  ? 'bg-[#7c5cff]/20 text-[#c4b5fd] border border-[#7c5cff]/40 shadow-sm'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3 text-[#fabd2f]" />
              <span>Throughput</span>
            </button>
          </div>

          {monitorMode === 'quantum' && (
            <button
              onClick={handleTriggerFleetQuantumSweep}
              disabled={isSimulatingQuantum}
              className="px-2.5 py-1 rounded bg-gradient-to-r from-[#00d9ff]/20 to-[#7c5cff]/20 hover:from-[#00d9ff]/30 hover:to-[#7c5cff]/30 border border-[#00d9ff]/40 text-[#00d9ff] text-[10px] font-bold flex items-center gap-1.5 transition-all shadow cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3" />
              <span>{isSimulatingQuantum ? `Amplifying... ${sweepProgress}%` : 'Run Quantum Sweep'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sweep Progress Bar */}
      {isSimulatingQuantum && (
        <div className="w-full h-1 bg-white/5 overflow-hidden relative">
          <div 
            className="h-full bg-gradient-to-r from-[#00d9ff] via-[#7c5cff] to-[#34d399] transition-all duration-300"
            style={{ width: `${sweepProgress}%` }}
          />
        </div>
      )}

      {/* QUANTUM SUPERPOSITION MATRIX VIEW */}
      {monitorMode === 'quantum' ? (
        <div className="mt-3 relative z-10">
          <div className="flex items-center justify-between text-[10px] text-[#70788e] mb-2 font-bold tracking-wider uppercase">
            <span className="flex items-center gap-1.5 text-[#00d9ff]">
              <Layers className="w-3 h-3" />
              Agent Task Superposition Space (4 Qubits • 16 States Evaluated in Parallel)
            </span>
            <span className="text-[9px] text-[#34d399] flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Oracle collapses to easiest build path
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {agents.map((agent) => {
              const { candidates, winning, isEvaluating } = getSuperpositionState(agent);
              const isSelected = selectedAgentId === agent.id;

              return (
                <div
                  key={agent.id}
                  onClick={() => {
                    onSelectAgent?.(agent.id);
                    setInspectedAgentId(agent.id);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                    isSelected 
                      ? 'border-[#00d9ff] bg-[#00d9ff]/10 shadow-[0_0_15px_rgba(0,217,255,0.2)]' 
                      : 'border-white/10 bg-black/40 hover:border-[#00d9ff]/50 hover:bg-white/5'
                  }`}
                >
                  {/* Top Bar: Identity & Superposition Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {agent.avatar && agent.avatar.startsWith('http') ? (
                        <img 
                          src={agent.avatar} 
                          alt={agent.name} 
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 rounded-full object-cover shrink-0 border border-white/20" 
                        />
                      ) : (
                        <span className="text-base shrink-0">{agent.avatar || '🤖'}</span>
                      )}
                      <div className="truncate">
                        <div className="font-bold text-xs text-white truncate">{agent.name}</div>
                        <div className="text-[9px] text-[#70788e] truncate">{agent.role}</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider flex items-center gap-1 ${
                        isEvaluating
                          ? 'bg-[#00d9ff]/20 text-[#00d9ff] border border-[#00d9ff]/30 animate-pulse'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                      }`}>
                        <Atom className="w-2.5 h-2.5" />
                        {isEvaluating ? 'SUPERPOSITION' : 'COLLAPSED'}
                      </span>
                      <span className="text-[8px] text-[#8b949e] font-mono mt-0.5">
                        |ψ⟩ 4-Qubits
                      </span>
                    </div>
                  </div>

                  {/* Amplitude Distribution Spectrum */}
                  <div className="mb-2 bg-black/50 p-2 rounded-lg border border-white/5 space-y-1.5">
                    <div className="text-[8px] text-[#8b949e] font-bold uppercase tracking-wider flex justify-between items-center">
                      <span>Evaluated Pathways:</span>
                      <span className="text-[#00d9ff]">Amplified Amplitude</span>
                    </div>

                    <div className="space-y-1">
                      {candidates.map((cand) => {
                        const isWinner = cand.complexity === 'Minimal / Easiest' || cand.status === 'collapsed_winner';
                        const pct = Math.round(cand.probability * 100);

                        return (
                          <div key={cand.id} className="text-[9px]">
                            <div className="flex items-center justify-between mb-0.5 text-[8px]">
                              <span className={`font-mono truncate max-w-[130px] ${isWinner ? 'text-[#34d399] font-bold' : 'text-[#8b949e]'}`}>
                                {cand.qubitState} {cand.strategy}
                              </span>
                              <span className={`font-bold ${isWinner ? 'text-[#34d399]' : 'text-[#70788e]'}`}>
                                {pct}%
                              </span>
                            </div>
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isWinner
                                    ? 'bg-gradient-to-r from-[#00d9ff] to-[#34d399] shadow-[0_0_8px_#34d399]'
                                    : 'bg-white/20'
                                }`}
                                style={{ width: `${Math.max(6, pct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Collapsed Easiest Way Banner */}
                  <div className="bg-emerald-500/10 border border-emerald-500/25 p-1.5 rounded-lg flex items-center justify-between gap-1 text-[9px]">
                    <div className="truncate flex items-center gap-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">Easiest Way: {winning?.strategy || 'Direct Optimization'}</span>
                    </div>
                    <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[8px] shrink-0 font-bold">
                      Diff {winning?.difficultyScore ?? 2}/10
                    </span>
                  </div>

                  {/* Click to inspect prompt */}
                  <div className="mt-2 text-right">
                    <span className="text-[8px] text-[#00d9ff] group-hover:underline inline-flex items-center gap-0.5">
                      Inspect Wavefunction <ChevronRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* THROUGHPUT TELEMETRY VIEW */
        <div className="mt-3 relative z-10">
          <div className="text-[10px] text-[#70788e] font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Worker Real-Time Throughput Pulses</span>
            <span className="text-[9px] lowercase opacity-75">color intensity maps to token rate</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {agents.map((agent) => {
              const isWorking = agent.status === 'working' || agent.status === 'thinking';
              const tier = getAgentThroughputTier(agent, isWorking);
              const isSelected = selectedAgentId === agent.id;
              const tokenFormatted = formatTokenThroughput(agent.tokensProcessed || 0);
              const { winning } = getSuperpositionState(agent);

              return (
                <button
                  key={agent.id}
                  onClick={() => {
                    onSelectAgent?.(agent.id);
                    setInspectedAgentId(agent.id);
                  }}
                  className={`p-2 rounded-lg text-left transition-all relative overflow-hidden group cursor-pointer border ${
                    isSelected 
                      ? 'border-[#7c5cff] bg-[#7c5cff]/15 ring-1 ring-[#7c5cff]/40' 
                      : 'border-white/10 bg-white/3 hover:bg-white/6'
                  }`}
                  style={{
                    boxShadow: isWorking 
                      ? `0 0 ${12 * tier.intensity}px ${tier.glowColor}` 
                      : 'none',
                    borderColor: isWorking ? tier.color : undefined
                  }}
                >
                  {isWorking && (
                    <span 
                      className="absolute inset-0 rounded-lg pointer-events-none opacity-25 animate-ping"
                      style={{
                        backgroundColor: tier.color,
                        animationDuration: tier.pulseSpeed
                      }}
                    />
                  )}

                  <div className="flex items-center justify-between mb-1 relative z-10">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {agent.avatar && agent.avatar.startsWith('http') ? (
                        <img 
                          src={agent.avatar} 
                          alt={agent.name} 
                          referrerPolicy="no-referrer"
                          className="w-4 h-4 rounded-full object-cover shrink-0 border border-white/20" 
                        />
                      ) : (
                        <span className="text-xs shrink-0">{agent.avatar || '🤖'}</span>
                      )}
                      <span className="font-bold text-[11px] text-white truncate max-w-[70px]">{agent.name}</span>
                    </div>

                    <span 
                      className={`w-2 h-2 rounded-full ${isWorking ? 'animate-pulse' : ''}`}
                      style={{
                        backgroundColor: tier.color,
                        boxShadow: isWorking ? `0 0 8px ${tier.color}` : 'none'
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[9px] relative z-10 mb-1">
                    <span 
                      className="px-1 py-0.2 rounded font-bold uppercase tracking-tight"
                      style={{
                        backgroundColor: tier.bgBadge,
                        color: tier.textBadge
                      }}
                    >
                      {isWorking ? `${tokenFormatted}/s` : 'IDLE'}
                    </span>
                    <span className="text-[#70788e] text-[8px] font-mono">
                      {agent.role.slice(0, 10)}
                    </span>
                  </div>

                  {/* Micro Quantum Superposition Pill */}
                  <div className="relative z-10 text-[8px] text-[#00d9ff] bg-[#00d9ff]/10 px-1 py-0.5 rounded flex items-center justify-between border border-[#00d9ff]/20">
                    <span className="font-mono flex items-center gap-0.5">
                      <Atom className="w-2 h-2 text-[#00d9ff]" />
                      |ψ⟩ Easiest
                    </span>
                    <span className="text-[#34d399] font-bold truncate max-w-[50px]">
                      {winning.strategy.slice(0, 8)}..
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* INSPECTED AGENT QUANTUM SUPERPOSITION MODAL / DRAWER */}
      {inspectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#181a20] border border-[#00d9ff]/40 rounded-2xl w-full max-w-2xl text-white shadow-2xl p-5 relative overflow-hidden flex flex-col max-h-[90vh]">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00d9ff]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
              <div className="flex items-center gap-3">
                {inspectedAgent.avatar && inspectedAgent.avatar.startsWith('http') ? (
                  <img 
                    src={inspectedAgent.avatar} 
                    alt={inspectedAgent.name} 
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover border border-white/20" 
                  />
                ) : (
                  <span className="text-3xl p-2 rounded-xl bg-black/40 border border-white/10">
                    {inspectedAgent.avatar || '🤖'}
                  </span>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{inspectedAgent.name}</h3>
                    <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-[#00d9ff]/20 text-[#00d9ff] border border-[#00d9ff]/40">
                      QUANTUM DECISION ENGINE
                    </span>
                  </div>
                  <p className="text-xs text-[#8b949e]">{inspectedAgent.role} • 4-Qubit Superposition Register</p>
                </div>
              </div>

              <button
                onClick={() => setInspectedAgentId(null)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-[#8b949e] hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quantum Evaluation Details Body */}
            <div className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1 relative z-10">
              {/* Telemetry Overview Bar */}
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div className="bg-black/40 border border-white/10 p-3 rounded-xl">
                  <span className="text-[10px] text-[#70788e] uppercase font-bold block mb-1">State Space</span>
                  <span className="text-sm font-bold text-[#00d9ff] font-mono">16 Parallel States</span>
                  <span className="text-[10px] text-[#8b949e] block mt-0.5">2⁴ Qubit basis</span>
                </div>
                <div className="bg-black/40 border border-white/10 p-3 rounded-xl">
                  <span className="text-[10px] text-[#70788e] uppercase font-bold block mb-1">Oracle Speedup</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">O(√N) [4x Speedup]</span>
                  <span className="text-[10px] text-[#8b949e] block mt-0.5">k = 2 optimal steps</span>
                </div>
                <div className="bg-black/40 border border-white/10 p-3 rounded-xl">
                  <span className="text-[10px] text-[#70788e] uppercase font-bold block mb-1">Coherence Fidelity</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">99.8% Coherent</span>
                  <span className="text-[10px] text-[#8b949e] block mt-0.5">Zero thermal decoherence</span>
                </div>
              </div>

              {/* Candidate Pathways in Superposition */}
              <div className="bg-black/50 border border-white/10 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#00d9ff]" />
                    <span>Candidate Pathways Evaluated in Superposition</span>
                  </h4>
                  <span className="text-[10px] text-[#70788e]">
                    Agent tests all ways, chooses easiest to build
                  </span>
                </div>

                <div className="space-y-3">
                  {getSuperpositionState(inspectedAgent).candidates.map((cand) => {
                    const isWinner = cand.complexity === 'Minimal / Easiest' || cand.status === 'collapsed_winner';
                    const pct = Math.round(cand.probability * 100);

                    return (
                      <div
                        key={cand.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isWinner
                            ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_12px_rgba(52,211,153,0.15)]'
                            : 'bg-black/30 border-white/5 text-[#8b949e]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded font-mono text-[9px] bg-white/5 border border-white/10 text-white font-bold">
                              {cand.qubitState}
                            </span>
                            <span className={`text-xs font-bold ${isWinner ? 'text-emerald-300' : 'text-white'}`}>
                              {cand.strategy}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              isWinner
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-white/5 text-[#70788e]'
                            }`}>
                              {isWinner ? '★ COLLAPSED WINNER: EASIEST' : 'REJECTED (OVERHEAD)'}
                            </span>
                            <span className="text-xs font-bold text-[#00d9ff]">
                              {pct}% Amplitude
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] leading-relaxed mb-2 text-[#a0a7b9]">
                          {cand.description}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[10px]">
                          <div className="flex items-center gap-3">
                            <span className="text-[#8b949e]">
                              Build Complexity: <strong className={isWinner ? 'text-emerald-400' : 'text-amber-400'}>{cand.complexity}</strong>
                            </span>
                            <span className="text-[#8b949e]">
                              Difficulty Score: <strong className={isWinner ? 'text-emerald-400' : 'text-rose-400'}>{cand.difficultyScore}/10</strong>
                            </span>
                            <span className="text-[#8b949e]">
                              Est. Run: <strong className="text-[#00d9ff]">{cand.executionTimeEst}</strong>
                            </span>
                          </div>

                          {cand.whyEasiest && (
                            <span className="text-emerald-400 font-bold italic text-[10px]">
                              {cand.whyEasiest}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quantum Memory Context Subspaces */}
              <div className="bg-black/40 border border-white/10 p-3 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#8b949e]">
                  <Atom className="w-4 h-4 text-[#00d9ff]" />
                  <span>Quantum Memory Entanglement Subspaces:</span>
                  <span className="text-white font-mono text-[11px]">/memory/company, /memory/department/{inspectedAgent.departmentId || 'general'}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">High-Probability Context Match</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between relative z-10">
              <span className="text-[10px] text-[#70788e]">
                All fleet agents utilize Grover Amplitude Amplification before committing execution.
              </span>
              <button
                onClick={() => setInspectedAgentId(null)}
                className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
