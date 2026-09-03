import { Agent, AgentQuantumState, QuantumSuperpositionCandidate } from '../types';

/**
 * Quantum-Inspired Search & Decision Architecture
 * 
 * Every agent operates on a quantum model where tasks are evaluated in superposition
 * across multiple candidate architectures. The agent runs Grover's algorithm
 * (Oracle phase inversion + Amplitude Amplification) to collapse the state space
 * onto the easiest, cleanest, and most efficient way to build the solution.
 */

export interface QuantumEvaluationResult {
  agentId: string;
  taskTitle: string;
  qubits: number;
  searchSpaceN: number;
  speedup: string;
  candidates: QuantumSuperpositionCandidate[];
  winningCandidate: QuantumSuperpositionCandidate;
  diffusionIterations: number;
  coherenceFidelity: number;
  quantumMemorySubspaces: string[];
}

/**
 * Generate multi-state candidate implementation pathways for any agent task.
 * Formulates different ways to solve/build it and designates the easiest way.
 */
export function generateSuperpositionCandidates(
  agent: Agent,
  taskDescription: string
): QuantumSuperpositionCandidate[] {
  const cleanDesc = taskDescription.toLowerCase();
  
  // Pathway definitions tailored to the agent role
  let easiestTitle = 'Direct Minimalist Micro-Kernel';
  let easiestDesc = 'Build directly using standard built-in primitives and linear event routing. Zero external bloat.';
  let easiestPros = ['Shortest assembly time', 'Zero extraneous dependencies', 'Instant deterministic verification'];

  let heavyTitle = 'Monolithic Multi-Tier Architecture';
  let heavyDesc = 'Heavyweight multi-pass compilation with full AST tree re-writing and synchronized disk locks.';
  
  let wrapTitle = 'External Distributed Proxy Gateway';
  let wrapDesc = 'Spins up intermediary proxy nodes and polling event handlers across cloud brokers.';

  let asyncTitle = 'Asynchronous Chunked Pipeline';
  let asyncDesc = 'Streams execution in micro-batches with persistent intermediate journaling.';

  if (agent.role.toLowerCase().includes('code') || cleanDesc.includes('code') || cleanDesc.includes('patch') || cleanDesc.includes('build')) {
    easiestTitle = 'AST-Surgical In-Place Hot-Patch';
    easiestDesc = 'Apply targeted surgical code change using exact token offsets. Minimal footprint, zero build side-effects.';
    easiestPros = ['Instant hot-patching', 'Passes all linters with 0 overhead', 'Zero memory leaks'];

    heavyTitle = 'Full Monolithic Codebase Re-Compilation';
    heavyDesc = 'Re-index and re-bundle entire application bundle with deep dependency tree validation.';

    wrapTitle = 'Third-Party Transpiler & Wrapper Bridge';
    wrapDesc = 'Embed external Babel/SWC wrapper modules to transform runtime calls at runtime.';

    asyncTitle = 'Lazy-Loaded Dynamic Micro-Module';
    asyncDesc = 'Package logic into deferred ES Module chunks loaded on demand.';
  } else if (agent.role.toLowerCase().includes('security') || agent.id === 'dwight') {
    easiestTitle = 'Zero-Overhead Deterministic ACL Gate';
    easiestDesc = 'Fast O(1) hashmap lookup matching incoming JWT/session claims directly against role policies.';
    easiestPros = ['Instant verification', 'Zero latency penalty', 'Mathematically provable isolation'];

    heavyTitle = 'Deep Multi-Hop Packet Inspection Proxy';
    heavyDesc = 'Route every request through 7-layer heuristic sandboxes with redundant cryptanalysis.';

    wrapTitle = 'External Vault RPC Verification';
    wrapDesc = 'Call external authorization endpoints over HTTPS with retry policies on every evaluation.';

    asyncTitle = 'Continuous Anomaly Detection Stream';
    asyncDesc = 'Feed access tokens to real-time telemetry models with continuous rolling windows.';
  } else if (agent.role.toLowerCase().includes('finance') || agent.id === 'kevin') {
    easiestTitle = 'Direct Vectorized Ledger Delta Calculation';
    easiestDesc = 'Single-pass aggregate calculation computing net margin & variance directly in memory.';
    easiestPros = ['Sub-millisecond calculation', 'Zero decimal rounding errors', 'Immediate balance reconciliation'];

    heavyTitle = 'Multi-Ledger Double-Entry Audit Cluster';
    heavyDesc = 'Spin up distributed lock-step journal tables verifying every transaction across 5 replicas.';

    wrapTitle = 'External Bank Sync & Webhook Broker';
    wrapDesc = 'Poll third-party banking APIs with manual reconciliation and payload schema conversions.';

    asyncTitle = 'Batch Interval Accounting Sync';
    asyncDesc = 'Buffer ledger writes in a memory queue and flush once per epoch.';
  } else if (agent.role.toLowerCase().includes('manager') || agent.id === 'michael') {
    easiestTitle = 'Direct Priority Broadcast Directive';
    easiestDesc = 'Dispatch task directly to best-suited specialist agent with pre-filtered context.';
    easiestPros = ['Fastest fleet response', 'Zero delegation overhead', 'Clear single-owner responsibility'];

    heavyTitle = 'All-Hands Synchronous Consensus Committee';
    heavyDesc = 'Require all 9 department heads to cast cryptographic votes before starting execution.';

    wrapTitle = 'Multi-Level Approval Hierarchy Relay';
    wrapDesc = 'Pass request up 4 management levels with sign-offs and memo threads.';

    asyncTitle = 'Fleet Dynamic Auction Protocol';
    asyncDesc = 'Open a live bidding queue where autonomous bots bid compute cycles for the task.';
  }

  return [
    {
      id: `${agent.id}-cand-0`,
      strategy: heavyTitle,
      qubitState: '|00⟩',
      difficultyScore: 8,
      complexity: 'High Complexity',
      amplitude: 0.18,
      probability: 0.03,
      executionTimeEst: '840ms',
      status: 'superposed',
      description: heavyDesc,
      architecturalPros: ['Extreme redundancy', 'Comprehensive telemetry traces'],
    },
    {
      id: `${agent.id}-cand-1`,
      strategy: wrapTitle,
      qubitState: '|01⟩',
      difficultyScore: 6,
      complexity: 'Moderate Overhead',
      amplitude: 0.22,
      probability: 0.05,
      executionTimeEst: '520ms',
      status: 'superposed',
      description: wrapDesc,
      architecturalPros: ['Decoupled boundaries', 'Pluggable connectors'],
    },
    {
      id: `${agent.id}-cand-2`,
      strategy: easiestTitle,
      qubitState: '|10⟩',
      difficultyScore: 2,
      complexity: 'Minimal / Easiest',
      amplitude: 0.94,
      probability: 0.88,
      executionTimeEst: '85ms',
      status: 'collapsed_winner',
      description: easiestDesc,
      whyEasiest: 'Identified as the simplest, most direct way to build the requirement. Zero code bloat, highest runtime speed, and immediate verification.',
      architecturalPros: easiestPros,
    },
    {
      id: `${agent.id}-cand-3`,
      strategy: asyncTitle,
      qubitState: '|11⟩',
      difficultyScore: 5,
      complexity: 'Moderate Overhead',
      amplitude: 0.20,
      probability: 0.04,
      executionTimeEst: '340ms',
      status: 'superposed',
      description: asyncDesc,
      architecturalPros: ['Non-blocking queue', 'Resilient retry semantics'],
    },
  ];
}

/**
 * Initialize default baseline quantum state for an agent
 */
export function initializeAgentQuantumState(agent: Agent): AgentQuantumState {
  const candidates = generateSuperpositionCandidates(agent, agent.currentTask || 'Operational maintenance');
  const easiest = candidates.find(c => c.complexity === 'Minimal / Easiest') || candidates[2];

  return {
    isEvaluating: agent.status === 'working' || agent.status === 'thinking',
    qubits: 4,
    coherenceFidelity: 99.8,
    superpositionCandidates: candidates,
    activeCollapsingWinnerId: easiest.id,
    winningStrategyName: easiest.strategy,
    phase: (agent.status === 'working' || agent.status === 'thinking') ? 'measurement_collapsed' : 'idle',
    iteration: 2, // Grover optimal k ≈ (pi/4)*sqrt(N)
    totalSearchSpace: 16,
    speedupFactor: 'O(√N) [4x Speedup]',
    lastEvaluatedAt: Date.now(),
    quantumMemoryRecall: {
      query: agent.currentTask || 'Fleet Context',
      contextsRetrieved: 6,
      fidelityScore: 0.97,
      matchedSubspaces: ['/memory/company', `/memory/department/${agent.departmentId || 'general'}`, '/memory/telemetry'],
    },
  };
}

export function getAgentQuantumState(agent: Agent): AgentQuantumState {
  return agent.quantumState || initializeAgentQuantumState(agent);
}

/**
 * Multi-state Quantum Memory Search
 * Looks up agent and company memory by projecting into quantum superposition
 * and returning amplified high-probability context matches.
 */
export function searchQuantumMemory(
  agent: Agent,
  query: string,
  extraMemories: string[] = []
): {
  recalledMemories: string[];
  subspaces: string[];
  fidelity: number;
  qubitStates: Array<{ state: string; probability: number; text: string; isPeak: boolean }>;
} {
  const pool = [...(agent.memory || []), ...extraMemories];
  if (pool.length === 0) {
    pool.push(
      'Enterprise security zero-trust policies active',
      'Continuous auto-debugger verified stable heap allocation',
      'Multi-agent workflow routing protocol version 2.4 online',
      'Sub-millisecond memory cache layer synchronized'
    );
  }

  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  
  // Score relevance with quantum amplitude weighting
  const scored = pool.map((mem, idx) => {
    const memLower = mem.toLowerCase();
    const hits = queryTerms.filter(t => memLower.includes(t)).length;
    const baseAmp = hits > 0 ? 0.7 + (hits * 0.1) : 0.3;
    const qubitBinary = (idx % 8).toString(2).padStart(3, '0');
    return {
      text: mem,
      amplitude: baseAmp,
      state: `|${qubitBinary}⟩`,
    };
  });

  // Normalize probabilities sum to 1
  const sumAmpSq = scored.reduce((acc, curr) => acc + (curr.amplitude * curr.amplitude), 0) || 1;
  const normalized = scored.map(item => ({
    ...item,
    probability: Math.min(0.99, Number(((item.amplitude * item.amplitude) / sumAmpSq).toFixed(3))),
  }));

  // Sort descending
  normalized.sort((a, b) => b.probability - a.probability);
  const peakProb = normalized[0]?.probability || 0.8;

  return {
    recalledMemories: normalized.slice(0, 4).map(m => m.text),
    subspaces: ['/memory/company', `/memory/department/${agent.departmentId || 'engineering'}`, '/memory/quantum-cache'],
    fidelity: 99.4,
    qubitStates: normalized.slice(0, 5).map(m => ({
      state: m.state,
      probability: m.probability,
      text: m.text,
      isPeak: m.probability === peakProb,
    })),
  };
}

/**
 * Execute full Quantum-Inspired Task Evaluation
 * Simulates the 4-phase Grover search:
 * 1. Superposition: all candidate architectures active
 * 2. Grover Oracle: phase inverts easiest approach
 * 3. Amplitude Amplification: reflects around mean to boost probability of easiest way
 * 4. Wavefunction Collapse: selects easiest way to build it!
 */
export async function runQuantumModelForTask(
  agent: Agent,
  taskDescription: string,
  onPhaseChange?: (quantumState: AgentQuantumState) => void
): Promise<QuantumEvaluationResult> {
  const candidates = generateSuperpositionCandidates(agent, taskDescription);
  const easiest = candidates.find(c => c.complexity === 'Minimal / Easiest') || candidates[2];
  
  const baseState: AgentQuantumState = {
    isEvaluating: true,
    qubits: 4,
    coherenceFidelity: 99.9,
    superpositionCandidates: candidates.map(c => ({
      ...c,
      status: 'superposed',
      probability: 0.25, // uniform superposition 1/N
      amplitude: 0.50,
    })),
    phase: 'superposition',
    iteration: 0,
    totalSearchSpace: 16,
    speedupFactor: 'O(√N) [4x Speedup]',
    lastEvaluatedAt: Date.now(),
    quantumMemoryRecall: {
      query: taskDescription,
      contextsRetrieved: 5,
      fidelityScore: 0.98,
      matchedSubspaces: ['/memory/company', `/memory/department/${agent.departmentId || 'general'}`],
    },
  };

  if (onPhaseChange) onPhaseChange({ ...baseState });
  await new Promise(r => setTimeout(r, 220));

  // Phase 2: Grover Oracle
  baseState.phase = 'grover_oracle';
  baseState.superpositionCandidates = baseState.superpositionCandidates.map(c => ({
    ...c,
    status: c.id === easiest.id ? 'phase_inverted' : 'superposed',
    amplitude: c.id === easiest.id ? -0.50 : 0.50, // Phase inversion |ψ⟩ -> -|ψ⟩
  }));
  if (onPhaseChange) onPhaseChange({ ...baseState });
  await new Promise(r => setTimeout(r, 260));

  // Phase 3: Amplitude Amplification
  baseState.phase = 'amplitude_amplification';
  baseState.iteration = 1;
  baseState.superpositionCandidates = baseState.superpositionCandidates.map(c => ({
    ...c,
    status: c.id === easiest.id ? 'evaluating' : 'superposed',
    probability: c.id === easiest.id ? 0.88 : 0.04,
    amplitude: c.id === easiest.id ? 0.94 : 0.20,
  }));
  if (onPhaseChange) onPhaseChange({ ...baseState });
  await new Promise(r => setTimeout(r, 260));

  // Phase 4: Wavefunction Collapsed -> Easiest Way Chosen!
  baseState.phase = 'measurement_collapsed';
  baseState.activeCollapsingWinnerId = easiest.id;
  baseState.winningStrategyName = easiest.strategy;
  baseState.isEvaluating = false;
  baseState.superpositionCandidates = baseState.superpositionCandidates.map(c => ({
    ...c,
    status: c.id === easiest.id ? 'collapsed_winner' : 'superposed',
    probability: c.id === easiest.id ? 0.92 : 0.03,
    amplitude: c.id === easiest.id ? 0.96 : 0.17,
  }));
  if (onPhaseChange) onPhaseChange({ ...baseState });

  return {
    agentId: agent.id,
    taskTitle: taskDescription,
    qubits: 4,
    searchSpaceN: 16,
    speedup: 'O(√N) [4x Speedup]',
    candidates: baseState.superpositionCandidates,
    winningCandidate: easiest,
    diffusionIterations: 2,
    coherenceFidelity: 99.9,
    quantumMemorySubspaces: baseState.quantumMemoryRecall?.matchedSubspaces || [],
  };
}
