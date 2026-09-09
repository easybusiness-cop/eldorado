import React, { useState, useEffect, useMemo } from 'react';
import { Agent, FleetTask } from '../types';
import { Atom, Zap, Sparkles, GitBranch, CheckCircle2, ArrowRight, RefreshCw, Cpu, Activity, ShieldCheck, Play } from 'lucide-react';
import { soundFx } from '../utils/speech';

export interface StrategyOption {
  id: string;
  braKet: string;
  name: string;
  type: 'minimalist' | 'monolith' | 'proxy' | 'pipeline';
  complexityScore: number; // 0.0 to 1.0 (lower is easier/cleaner)
  steps: number;
  estLatencyMs: number;
  amplitude: number; // Probability amplitude 0 to 1
  isWinner: boolean;
  status: 'evaluating' | 'collapsed' | 'pruned';
  description: string;
}

interface QuantumWavefunctionIndicatorProps {
  agents: Agent[];
  tasks?: FleetTask[];
  compact?: boolean;
  onSelectAgent?: (agentId: string) => void;
  selectedAgentId?: string;
}

export const QuantumWavefunctionIndicator: React.FC<QuantumWavefunctionIndicatorProps> = ({
  agents,
  tasks = [],
  compact = false,
  onSelectAgent,
  selectedAgentId,
}) => {
  // Select active agent
  const activeAgent = useMemo(() => {
    if (selectedAgentId) {
      const found = agents.find((a) => a.id === selectedAgentId);
      if (found) return found;
    }
    const working = agents.find((a) => a.status === 'working');
    return working || agents[0] || {
      id: 'core-engineer',
      name: 'Dwight Schrute',
      role: 'Core Systems Architect',
      status: 'working',
    };
  }, [agents, selectedAgentId]);

  // Current task context
  const activeTaskTitle = useMemo(() => {
    const task = tasks.find((t) => (t.assignedTo === activeAgent.id || (t as any).agentId === activeAgent.id) && (t.status === 'running' || (t.status as string) === 'in-progress'));
    if (task) return task.title;
    return `Optimize AST Zero-Trust Validator Gate for ${activeAgent.name}`;
  }, [tasks, activeAgent]);

  // Wavefunction state machine: 'superposition' -> 'grover_diffusion' -> 'collapsed'
  const [waveState, setWaveState] = useState<'superposition' | 'grover_diffusion' | 'collapsed'>('collapsed');
  const [groverIteration, setGroverIteration] = useState<number>(3);
  const [coherenceFidelity, setCoherenceFidelity] = useState<number>(99.8);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('opt-00');
  const [isAutoCycling, setIsAutoCycling] = useState<boolean>(true);
  const [collapseProgress, setCollapseProgress] = useState<number>(100);

  // Strategy options representing the quantum superposition paths
  const strategies: StrategyOption[] = useMemo(() => {
    const isCodeAgent = (activeAgent.role || '').toLowerCase().includes('code') || activeAgent.id === 'dwight' || activeAgent.id === 'jim';
    const isSecurity = (activeAgent.role || '').toLowerCase().includes('security') || activeAgent.id === 'toby';
    
    if (isCodeAgent) {
      return [
        {
          id: 'opt-00',
          braKet: '|00⟩',
          name: 'AST-Surgical In-Place Hot-Patch',
          type: 'minimalist',
          complexityScore: 0.12,
          steps: 1,
          estLatencyMs: 18,
          amplitude: waveState === 'collapsed' ? 0.984 : waveState === 'grover_diffusion' ? 0.72 : 0.25,
          isWinner: true,
          status: waveState === 'collapsed' ? 'collapsed' : 'evaluating',
          description: 'Apply targeted surgical token offsets directly in AST memory. Zero build side-effects.',
        },
        {
          id: 'opt-01',
          braKet: '|01⟩',
          name: 'Monolithic Codebase Re-Compilation',
          type: 'monolith',
          complexityScore: 0.88,
          steps: 6,
          estLatencyMs: 420,
          amplitude: waveState === 'collapsed' ? 0.005 : waveState === 'grover_diffusion' ? 0.09 : 0.25,
          isWinner: false,
          status: waveState === 'collapsed' ? 'pruned' : 'evaluating',
          description: 'Re-index entire AST tree with heavy disk locking and multi-pass compiler validation.',
        },
        {
          id: 'opt-10',
          braKet: '|10⟩',
          name: 'Transpiler Wrapper Proxy Bridge',
          type: 'proxy',
          complexityScore: 0.65,
          steps: 4,
          estLatencyMs: 195,
          amplitude: waveState === 'collapsed' ? 0.006 : waveState === 'grover_diffusion' ? 0.11 : 0.25,
          isWinner: false,
          status: waveState === 'collapsed' ? 'pruned' : 'evaluating',
          description: 'Mount runtime Babel/SWC transform hooks around dynamic invocations.',
        },
        {
          id: 'opt-11',
          braKet: '|11⟩',
          name: 'Asynchronous Chunked Pipeline',
          type: 'pipeline',
          complexityScore: 0.38,
          steps: 2,
          estLatencyMs: 64,
          amplitude: waveState === 'collapsed' ? 0.005 : waveState === 'grover_diffusion' ? 0.08 : 0.25,
          isWinner: false,
          status: waveState === 'collapsed' ? 'pruned' : 'evaluating',
          description: 'Package logic into deferred ES Module chunks and stream in micro-batches.',
        },
      ];
    }

    if (isSecurity) {
      return [
        {
          id: 'opt-00',
          braKet: '|00⟩',
          name: 'Deterministic O(1) Hash ACL Gate',
          type: 'minimalist',
          complexityScore: 0.09,
          steps: 1,
          estLatencyMs: 4,
          amplitude: waveState === 'collapsed' ? 0.991 : waveState === 'grover_diffusion' ? 0.76 : 0.25,
          isWinner: true,
          status: waveState === 'collapsed' ? 'collapsed' : 'evaluating',
          description: 'Direct zero-copy hash evaluation of incoming token claims against immutable bitmask policies.',
        },
        {
          id: 'opt-01',
          braKet: '|01⟩',
          name: 'Deep Multi-Hop Heuristic Sandbox',
          type: 'monolith',
          complexityScore: 0.92,
          steps: 7,
          estLatencyMs: 510,
          amplitude: waveState === 'collapsed' ? 0.003 : waveState === 'grover_diffusion' ? 0.08 : 0.25,
          isWinner: false,
          status: waveState === 'collapsed' ? 'pruned' : 'evaluating',
          description: 'Spawn isolated VM instances for every incoming request with cryptanalysis verification.',
        },
        {
          id: 'opt-10',
          braKet: '|10⟩',
          name: 'External Vault Webhook RPC',
          type: 'proxy',
          complexityScore: 0.74,
          steps: 3,
          estLatencyMs: 230,
          amplitude: waveState === 'collapsed' ? 0.003 : waveState === 'grover_diffusion' ? 0.09 : 0.25,
          isWinner: false,
          status: waveState === 'collapsed' ? 'pruned' : 'evaluating',
          description: 'Authenticate against external key management over TLS with backoff retries.',
        },
        {
          id: 'opt-11',
          braKet: '|11⟩',
          name: 'Rolling Window Anomaly Telemetry',
          type: 'pipeline',
          complexityScore: 0.42,
          steps: 2,
          estLatencyMs: 78,
          amplitude: waveState === 'collapsed' ? 0.003 : waveState === 'grover_diffusion' ? 0.07 : 0.25,
          isWinner: false,
          status: waveState === 'collapsed' ? 'pruned' : 'evaluating',
          description: 'Buffer token events in an in-memory ring and compute rolling anomaly scores.',
        },
      ];
    }

    return [
      {
        id: 'opt-00',
        braKet: '|00⟩',
        name: 'Direct Minimalist Micro-Kernel',
        type: 'minimalist',
        complexityScore: 0.14,
        steps: 1,
        estLatencyMs: 12,
        amplitude: waveState === 'collapsed' ? 0.982 : waveState === 'grover_diffusion' ? 0.74 : 0.25,
        isWinner: true,
        status: waveState === 'collapsed' ? 'collapsed' : 'evaluating',
        description: 'Direct deterministic execution via native dispatch. Zero dependencies or boilerplate.',
      },
      {
        id: 'opt-01',
        braKet: '|01⟩',
        name: 'Distributed Multi-Tier Broker',
        type: 'monolith',
        complexityScore: 0.82,
        steps: 5,
        estLatencyMs: 380,
        amplitude: waveState === 'collapsed' ? 0.006 : waveState === 'grover_diffusion' ? 0.09 : 0.25,
        isWinner: false,
        status: waveState === 'collapsed' ? 'pruned' : 'evaluating',
        description: 'Spin up coordinated consensus nodes across distributed fleet queues.',
      },
      {
        id: 'opt-10',
        braKet: '|10⟩',
        name: 'Synchronous Consensus Committee',
        type: 'proxy',
        complexityScore: 0.71,
        steps: 4,
        estLatencyMs: 260,
        amplitude: waveState === 'collapsed' ? 0.006 : waveState === 'grover_diffusion' ? 0.10 : 0.25,
        isWinner: false,
        status: waveState === 'collapsed' ? 'pruned' : 'evaluating',
        description: 'Require quorum sign-off from multiple department agent workers before dispatch.',
      },
      {
        id: 'opt-11',
        braKet: '|11⟩',
        name: 'Dynamic Auction Bid Protocol',
        type: 'pipeline',
        complexityScore: 0.36,
        steps: 2,
        estLatencyMs: 55,
        amplitude: waveState === 'collapsed' ? 0.006 : waveState === 'grover_diffusion' ? 0.07 : 0.25,
        isWinner: false,
        status: waveState === 'collapsed' ? 'pruned' : 'evaluating',
        description: 'Auction execution cycles to lowest-latency available worker agent.',
      },
    ];
  }, [activeAgent, waveState]);

  // Winning strategy (easiest / lowest complexity)
  const winningStrategy = useMemo(() => {
    return strategies.find((s) => s.isWinner) || strategies[0];
  }, [strategies]);

  // Selected strategy for inspection
  const inspectedStrategy = useMemo(() => {
    return strategies.find((s) => s.id === selectedStrategyId) || winningStrategy;
  }, [strategies, selectedStrategyId, winningStrategy]);

  // Trigger quantum wavefunction collapse animation
  const triggerCollapseCycle = () => {
    soundFx.playClick();
    setWaveState('superposition');
    setCollapseProgress(25);
    setCoherenceFidelity(88.4);

    // Stage 1: Grover amplitude amplification
    setTimeout(() => {
      setWaveState('grover_diffusion');
      setCollapseProgress(72);
      setGroverIteration((prev) => prev + 1);
      setCoherenceFidelity(95.2);
    }, 700);

    // Stage 2: Wavefunction collapse to easiest/cleanest path
    setTimeout(() => {
      setWaveState('collapsed');
      setCollapseProgress(100);
      setCoherenceFidelity(99.8);
      soundFx.playSuccess();
    }, 1600);
  };

  // Auto-cycle periodic simulation if enabled
  useEffect(() => {
    if (!isAutoCycling) return;
    const interval = setInterval(() => {
      // Subtle pulse to simulate continuous quantum state updates
      setCoherenceFidelity((prev) => +(99.4 + Math.random() * 0.5).toFixed(1));
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoCycling]);

  return (
    <div className={`bg-[#181615] rounded-xl border border-[#3c3836] overflow-hidden ${compact ? 'p-3' : 'p-4'}`}>
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#3c3836]">
        <div className="flex items-center gap-2.5">
          <div className="relative p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Atom className={`w-5 h-5 ${waveState !== 'collapsed' ? 'animate-spin' : ''}`} />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-xs tracking-wider text-[#fbf1c7]">
                QUANTUM WAVEFUNCTION COLLAPSE
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#7c5cff]/20 text-[#c4b5fd] border border-[#7c5cff]/40">
                GROVER ORACLE N=4
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                waveState === 'collapsed'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
              }`}>
                {waveState === 'collapsed' ? '● COLLAPSED (DETERMINISTIC)' : waveState === 'grover_diffusion' ? '⚡ AMPLIFYING |ψ⟩' : '🌀 SUPERPOSITION'}
              </span>
            </div>
            <p className="text-[11px] text-[#a89984] flex items-center gap-1.5 mt-0.5">
              <span>Agent: <strong className="text-[#fabd2f] font-mono">{activeAgent.name}</strong></span>
              <span className="text-[#504945]">•</span>
              <span>Objective: <span className="text-[#ebdbb2] font-mono">{activeTaskTitle}</span></span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Agent Picker */}
          {agents.length > 1 && (
            <select
              value={activeAgent.id}
              onChange={(e) => {
                soundFx.playClick();
                onSelectAgent?.(e.target.value);
              }}
              className="bg-[#282828] text-[#ebdbb2] border border-[#3c3836] rounded px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-[#fabd2f]"
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.role.slice(0, 18)})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={triggerCollapseCycle}
            disabled={waveState !== 'collapsed'}
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              waveState !== 'collapsed'
                ? 'bg-[#3c3836] text-[#7c6f64] cursor-not-allowed'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 active:scale-95'
            }`}
            title="Evaluate quantum superposition across all strategic paths and collapse to the easiest route"
          >
            <RefreshCw className={`w-3 h-3 ${waveState !== 'collapsed' ? 'animate-spin' : ''}`} />
            <span>Collapse Wavefunction</span>
          </button>
        </div>
      </div>

      {/* Real-time State & Coherence Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3 p-2 rounded-lg bg-[#201d1c] border border-[#3c3836] text-[10px] font-mono">
        <div className="flex items-center justify-between px-2 py-1 bg-[#181615] rounded border border-[#3c3836]/60">
          <span className="text-[#a89984]">PROBABILITY AMPLITUDE:</span>
          <span className="font-bold text-emerald-400">|⟨win|ψ⟩|² = {(winningStrategy.amplitude * 100).toFixed(1)}%</span>
        </div>
        <div className="flex items-center justify-between px-2 py-1 bg-[#181615] rounded border border-[#3c3836]/60">
          <span className="text-[#a89984]">COHERENCE FIDELITY:</span>
          <span className="font-bold text-[#83a598]">{coherenceFidelity}%</span>
        </div>
        <div className="flex items-center justify-between px-2 py-1 bg-[#181615] rounded border border-[#3c3836]/60">
          <span className="text-[#a89984]">DIFFUSION ITERATIONS:</span>
          <span className="font-bold text-[#fabd2f]">#{groverIteration} (O(√N))</span>
        </div>
        <div className="flex items-center justify-between px-2 py-1 bg-[#181615] rounded border border-[#3c3836]/60">
          <span className="text-[#a89984]">ORACLE SPEEDUP:</span>
          <span className="font-bold text-[#d3869b]">2.0x QUADRATIC</span>
        </div>
      </div>

      {/* Pathfinding Tree Visualizer: Root Node -> 4 Candidate Superposition Paths */}
      <div className="relative mt-2 p-4 rounded-xl bg-gradient-to-b from-[#141211] to-[#1d1b1a] border border-[#3c3836] overflow-hidden">
        {/* Ambient quantum grid glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.06),transparent_70%)] pointer-events-none" />

        {/* Root Objective Node */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#282828] border-2 border-[#fabd2f]/70 text-[#fbf1c7] shadow-lg shadow-[#fabd2f]/10">
            <Cpu className="w-4 h-4 text-[#fabd2f]" />
            <span className="font-mono font-bold text-xs">ROOT OBJECTIVE: |ψ₀⟩</span>
            <span className="text-[10px] text-[#a89984] font-mono">
              [Uniform Superposition 1/√4 ∑|i⟩]
            </span>
          </div>
          <div className="w-0.5 h-5 bg-gradient-to-b from-[#fabd2f]/70 to-[#3c3836]" />
        </div>

        {/* 4 Strategy Options in Superposition */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative z-10">
          {strategies.map((opt) => {
            const isSelected = selectedStrategyId === opt.id;
            const isWinner = opt.isWinner;
            const isPruned = opt.status === 'pruned';

            return (
              <div
                key={opt.id}
                onClick={() => {
                  soundFx.playClick();
                  setSelectedStrategyId(opt.id);
                }}
                className={`group relative p-3 rounded-lg border transition-all cursor-pointer text-left ${
                  isWinner
                    ? 'bg-emerald-950/20 border-emerald-500/60 shadow-md shadow-emerald-500/10'
                    : isPruned
                    ? 'bg-[#181615]/80 border-[#3c3836]/60 opacity-60 hover:opacity-90'
                    : 'bg-[#282828]/50 border-[#3c3836] hover:border-[#504945]'
                } ${isSelected ? 'ring-2 ring-[#fabd2f]' : ''}`}
              >
                {/* State Vector Badge & Status */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[11px] ${
                      isWinner
                        ? 'bg-emerald-500 text-[#181615]'
                        : 'bg-[#3c3836] text-[#ebdbb2]'
                    }`}>
                      {opt.braKet}
                    </span>
                    <span className="text-[10px] font-mono text-[#a89984] uppercase">
                      {opt.type}
                    </span>
                  </div>

                  {isWinner ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      OPTIMAL PATH
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[#7c6f64]">
                      {opt.status === 'pruned' ? 'PRUNED' : 'EVAL'}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h4 className={`text-xs font-bold font-mono line-clamp-1 mb-1 ${
                  isWinner ? 'text-emerald-300' : 'text-[#ebdbb2]'
                }`}>
                  {opt.name}
                </h4>

                {/* Description */}
                <p className="text-[10px] text-[#a89984] line-clamp-2 h-7 leading-relaxed mb-3">
                  {opt.description}
                </p>

                {/* Amplitude Bar */}
                <div className="space-y-1 mb-2">
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="text-[#a89984]">Amplitude |α|²:</span>
                    <span className={`font-bold ${isWinner ? 'text-emerald-400' : 'text-[#a89984]'}`}>
                      {(opt.amplitude * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#181615] overflow-hidden border border-[#3c3836]/40">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isWinner
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : 'bg-[#504945]'
                      }`}
                      style={{ width: `${Math.max(4, opt.amplitude * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Footer */}
                <div className="pt-2 border-t border-[#3c3836]/50 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#7c6f64]">Complexity: <strong className={isWinner ? 'text-emerald-400' : 'text-[#fabd2f]'}>{(opt.complexityScore * 10).toFixed(1)}/10</strong></span>
                  <span className="text-[#7c6f64]">{opt.estLatencyMs}ms</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Pathway Details Drawer */}
        <div className="mt-4 p-3 rounded-lg bg-[#201d1c] border border-[#3c3836] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded ${inspectedStrategy.isWinner ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#fabd2f]/20 text-[#fabd2f]'}`}>
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[#fbf1c7] font-bold">Selected Path: {inspectedStrategy.braKet} {inspectedStrategy.name}</span>
                {inspectedStrategy.isWinner && (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30">
                    EASIEST / CLEANEST PATHWAY
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#a89984] mt-0.5">
                {inspectedStrategy.description} • Latency: ~{inspectedStrategy.estLatencyMs}ms • Steps: {inspectedStrategy.steps}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-[#a89984]">Path Status:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              inspectedStrategy.isWinner
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-[#3c3836] text-[#a89984]'
            }`}>
              {inspectedStrategy.isWinner ? 'COLLAPSED INTO EXECUTION' : 'FILTERED BY GROVER ORACLE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
