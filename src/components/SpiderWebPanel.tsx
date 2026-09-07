import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  Activity,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Plus,
  Radio,
  Share2,
  RefreshCw,
  Terminal as TerminalIcon,
  Flame,
  RotateCcw,
  Play,
  Lock,
  Users,
  Network,
  ArrowRight,
  Sliders,
  Sparkles,
  Link as LinkIcon,
  Search,
} from 'lucide-react';
import { useTaskRingSocket, TaskRingAgent, TaskRingItem } from '../lib/useTaskRingSocket';
import { Agent } from '../types';

interface SpiderWebPanelProps {
  agents?: Agent[];
}

export function SpiderWebPanel({ agents: fleetAgents }: SpiderWebPanelProps) {
  const {
    connected,
    snapshot,
    spiderAgents: serverAgents,
    queue: serverQueue,
    networkStrength: liveNetworkStrength,
    lastHardenMs: liveHardenMs,
    totalCompleted: liveCompleted,
    commandRingStatus,
    telemetryLogs: liveLogs,
    triggerCommand,
    assignTask,
    completeTask: socketCompleteTask,
    failoverAgent: socketFailoverAgent,
    swarmSolve,
    autoSolveNext,
    syncFleet,
    collaborate,
  } = useTaskRingSocket();

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [customTaskDesc, setCustomTaskDesc] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<number>(1);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'engineering' | 'workforce' | 'collaborating'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSwarmModal, setShowSwarmModal] = useState<boolean>(false);
  const [swarmGoalInput, setSwarmGoalInput] = useState<string>('');
  const [pairingTargetId, setPairingTargetId] = useState<string>('');

  // Fixed Canvas Center matching exact Spider Canvas specification (820 x 620)
  const CX = 410;
  const CY = 310;

  // Sync frontend fleet agents on mount or when fleet agents change
  useEffect(() => {
    if (fleetAgents && fleetAgents.length > 0) {
      syncFleet(fleetAgents);
    }
  }, [fleetAgents, syncFleet]);

  // Priority pulse speed helper correlated to task priority
  const getAgentPriority = (agent: { status: string; task: { priority?: number } | null }): number | 'idle' => {
    if (agent.status === 'busy' && agent.task) {
      return agent.task.priority || 1;
    }
    return 'idle';
  };

  const getPulseSpeedForPriority = (priority: number | string): string => {
    if (priority === 1 || priority === '1') return '0.45s';
    if (priority === 2 || priority === '2') return '0.90s';
    if (priority === 3 || priority === '3') return '1.80s';
    if (priority === 4 || priority === '4') return '2.60s';
    return '3.60s';
  };

  // Comprehensive connected agents data with coordinates and fallback
  const agentsData = useMemo(() => {
    if (serverAgents && serverAgents.length > 0) {
      return serverAgents.map((a) => {
        // Ensure coordinates exist
        let cx = a.cx ?? 410;
        let cy = a.cy ?? 310;
        if (!a.cx || !a.cy) {
          const r = a.radius || (a.category === 'workforce' ? 280 : a.category === 'engineering' ? 210 : 130);
          const rad = ((a.angle || 0) * Math.PI) / 180;
          cx = Math.round(CX + r * Math.cos(rad));
          cy = Math.round(CY + r * Math.sin(rad));
        }

        return {
          ...a,
          cx,
          cy,
          color: a.color || (a.category === 'workforce' ? '#38bdf8' : '#22ff88'),
          category: a.category || (a.id.startsWith('A') || a.id.startsWith('ENG') ? 'engineering' : 'workforce'),
          specialties: a.specialties || ['general', 'task-solving'],
        };
      });
    }

    // Default 19 connected nodes fallback (10 Engineering + 9 Workforce)
    const calcPos = (deg: number, r: number) => {
      const rad = (deg * Math.PI) / 180;
      return {
        cx: Math.round(CX + r * Math.cos(rad)),
        cy: Math.round(CY + r * Math.sin(rad)),
      };
    };

    return [
      // Inner Ring (R=130)
      { id: 'michael', name: 'Michael Scott', role: 'Floor Orchestrator', category: 'workforce' as const, status: 'busy' as const, color: '#fabd2f', radius: 130, angle: 270, ...calcPos(270, 130), task: { id: 'T-890', desc: 'Floor-wide standup & fleet task delegation', priority: 1, agentId: 'michael', started: Date.now() - 5000, signature: 'sig_ms_890', status: 'active' as const }, tasksCompleted: 35, lastHeartbeat: Date.now(), signature: 'sec-key-ms', specialties: ['orchestration', 'leadership', 'strategy'] },
      { id: 'ENG-10', name: 'EngineeringDeptEngineer', role: 'Master Orchestration', category: 'engineering' as const, status: 'busy' as const, color: '#83a598', radius: 130, angle: 330, ...calcPos(330, 130), task: { id: 'T-891', desc: 'Engineering lifecycle orchestration', priority: 1, agentId: 'ENG-10', started: Date.now() - 3200, signature: 'sig_e10_891', status: 'active' as const }, tasksCompleted: 28, lastHeartbeat: Date.now(), signature: 'sec-key-e10', specialties: ['lifecycle', 'department', 'engineering'] },
      { id: 'dwight', name: 'Dwight Schrute', role: 'Asst. Regional Manager & Enforcer', category: 'workforce' as const, status: 'idle' as const, color: '#b8bb26', radius: 130, angle: 30, ...calcPos(30, 130), task: null, tasksCompleted: 31, lastHeartbeat: Date.now(), signature: 'sec-key-ds', specialties: ['enforcement', 'safety', 'audit'] },
      { id: 'ENG-9', name: 'MasterMetaAgent', role: 'Self-Improvement & Meta', category: 'engineering' as const, status: 'idle' as const, color: '#d3869b', radius: 130, angle: 90, ...calcPos(90, 130), task: null, tasksCompleted: 22, lastHeartbeat: Date.now(), signature: 'sec-key-e9', specialties: ['meta', 'evolution', 'self-improvement'] },
      { id: 'ENG-7', name: 'NegotiationEngineer', role: 'Team Coordination & Consensus', category: 'engineering' as const, status: 'idle' as const, color: '#64ffda', radius: 130, angle: 150, ...calcPos(150, 130), task: null, tasksCompleted: 20, lastHeartbeat: Date.now(), signature: 'sec-key-e7', specialties: ['coordination', 'consensus', 'dispatch'] },
      { id: 'pam', name: 'Pam Beesly', role: 'Operations & Workflow Dispatcher', category: 'workforce' as const, status: 'idle' as const, color: '#f472b6', radius: 130, angle: 210, ...calcPos(210, 130), task: null, tasksCompleted: 26, lastHeartbeat: Date.now(), signature: 'sec-key-pb', specialties: ['operations', 'intake', 'admin'] },

      // Mid Ring (R=210)
      { id: 'A1', name: 'CoreCoder (ENG-1)', role: 'MIT-Level Coder', category: 'engineering' as const, status: 'busy' as const, color: '#22ff88', radius: 210, angle: 225, ...calcPos(225, 210), task: { id: 'T-892', desc: 'Crimson protocol override & AST codegen', priority: 1, agentId: 'A1', started: Date.now() - 4200, signature: 'sig_a1_892', status: 'active' as const }, tasksCompleted: 24, lastHeartbeat: Date.now(), signature: 'sec-key-a1', specialties: ['code', 'typescript', 'react', 'refactor'], collaboratorId: 'A3' },
      { id: 'A2', name: 'RepoArch (ENG-2)', role: 'Architecture & Git Engine', category: 'engineering' as const, status: 'idle' as const, color: '#00e5ff', radius: 210, angle: 270, ...calcPos(270, 210), task: null, tasksCompleted: 19, lastHeartbeat: Date.now(), signature: 'sec-key-a2', specialties: ['git', 'repo', 'branch', 'ast'] },
      { id: 'A3', name: 'SecurityQA (ENG-3)', role: 'Testing & QA Validation', category: 'engineering' as const, status: 'busy' as const, color: '#ffdd00', radius: 210, angle: 315, ...calcPos(315, 210), task: { id: 'T-893', desc: 'Automated test suite regression', priority: 1, agentId: 'A3', started: Date.now() - 2100, signature: 'sig_a3_893', status: 'active' as const }, tasksCompleted: 21, lastHeartbeat: Date.now(), signature: 'sec-key-a3', specialties: ['test', 'qa', 'assert', 'coverage'], collaboratorId: 'A1' },
      { id: 'A4', name: 'SafetyGuard (ENG-4)', role: 'Security & Guardrails', category: 'engineering' as const, status: 'idle' as const, color: '#ff7700', radius: 210, angle: 0, ...calcPos(0, 210), task: null, tasksCompleted: 16, lastHeartbeat: Date.now(), signature: 'sec-key-a4', specialties: ['security', 'safety', 'guardrails', 'firewall'] },
      { id: 'A5', name: 'InfraStaging (ENG-5)', role: 'Deployment & Public API', category: 'engineering' as const, status: 'idle' as const, color: '#b388ff', radius: 210, angle: 45, ...calcPos(45, 210), task: null, tasksCompleted: 15, lastHeartbeat: Date.now(), signature: 'sec-key-a5', specialties: ['deploy', 'cloud', 'docker', 'api'] },
      { id: 'A6', name: 'OutcomeEval (ENG-6)', role: 'Outcome Metrics & Scoring', category: 'engineering' as const, status: 'idle' as const, color: '#ff4081', radius: 210, angle: 90, ...calcPos(90, 210), task: null, tasksCompleted: 18, lastHeartbeat: Date.now(), signature: 'sec-key-a6', specialties: ['evaluation', 'metric', 'benchmark'] },
      { id: 'A7', name: 'ConsensusNode (ENG-7)', role: 'Distributed Consensus & Ring Mesh', category: 'engineering' as const, status: 'busy' as const, color: '#64ffda', radius: 210, angle: 135, ...calcPos(135, 210), task: { id: 'T-894', desc: 'Distributed consensus sync', priority: 2, agentId: 'A7', started: Date.now() - 6000, signature: 'sig_a7_894', status: 'active' as const }, tasksCompleted: 17, lastHeartbeat: Date.now(), signature: 'sec-key-a7', specialties: ['distributed', 'consensus', 'sync'] },
      { id: 'A8', name: 'CurriculumMgr (ENG-8)', role: 'CSE Syllabus & Skill Growth', category: 'engineering' as const, status: 'idle' as const, color: '#76ff03', radius: 210, angle: 180, ...calcPos(180, 210), task: null, tasksCompleted: 12, lastHeartbeat: Date.now(), signature: 'sec-key-a8', specialties: ['curriculum', 'training', 'syllabus', 'skill'] },

      // Outer Ring (R=280)
      { id: 'jim', name: 'Jim Halpert', role: 'Senior Sales & Account Strategy', category: 'workforce' as const, status: 'idle' as const, color: '#38bdf8', radius: 280, angle: 290, ...calcPos(290, 280), task: null, tasksCompleted: 29, lastHeartbeat: Date.now(), signature: 'sec-key-jh', specialties: ['sales', 'negotiation', 'client', 'pitch'] },
      { id: 'stanley', name: 'Stanley Hudson', role: 'Enterprise Accounts & Pipeline', category: 'workforce' as const, status: 'idle' as const, color: '#fb923c', radius: 280, angle: 340, ...calcPos(340, 280), task: null, tasksCompleted: 23, lastHeartbeat: Date.now(), signature: 'sec-key-sh', specialties: ['enterprise', 'contracts', 'pipeline', 'sales'] },
      { id: 'angela', name: 'Angela Martin', role: 'Accounting & Financial Audits', category: 'workforce' as const, status: 'idle' as const, color: '#a78bfa', radius: 280, angle: 30, ...calcPos(30, 280), task: null, tasksCompleted: 34, lastHeartbeat: Date.now(), signature: 'sec-key-am', specialties: ['accounting', 'audit', 'finance', 'ledger'] },
      { id: 'kevin', name: 'Kevin Malone', role: 'Data Analytics & Number Crunching', category: 'workforce' as const, status: 'idle' as const, color: '#fbbf24', radius: 280, angle: 80, ...calcPos(80, 280), task: null, tasksCompleted: 19, lastHeartbeat: Date.now(), signature: 'sec-key-km', specialties: ['math', 'numbers', 'payroll', 'data'] },
      { id: 'toby', name: 'Toby Flenderson', role: 'HR, Ethics & Regulatory Compliance', category: 'workforce' as const, status: 'idle' as const, color: '#94a3b8', radius: 280, angle: 130, ...calcPos(130, 280), task: null, tasksCompleted: 17, lastHeartbeat: Date.now(), signature: 'sec-key-tf', specialties: ['hr', 'policy', 'ethics', 'compliance'] },
      { id: 'kelly', name: 'Kelly Kapoor', role: 'Customer Relations & Social Outreach', category: 'workforce' as const, status: 'idle' as const, color: '#f43f5e', radius: 280, angle: 180, ...calcPos(180, 280), task: null, tasksCompleted: 25, lastHeartbeat: Date.now(), signature: 'sec-key-kk', specialties: ['customer', 'social', 'marketing', 'outreach'] },
    ];
  }, [serverAgents]);

  // Filtered agents for directory display
  const filteredAgents = useMemo(() => {
    return agentsData.filter((a) => {
      if (categoryFilter === 'engineering' && a.category !== 'engineering') return false;
      if (categoryFilter === 'workforce' && a.category !== 'workforce') return false;
      if (categoryFilter === 'collaborating' && !a.collaboratorId && a.status !== 'busy') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          a.role.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          (a.task && a.task.desc.toLowerCase().includes(q)) ||
          a.specialties?.some((s) => s.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [agentsData, categoryFilter, searchQuery]);

  // Intelligent auto-route predictor: shows user who will receive the task before deploying
  const predictedAgent = useMemo(() => {
    if (!customTaskDesc.trim()) return null;
    const text = customTaskDesc.toLowerCase();
    let best = null;
    let maxScore = 0;

    for (const agent of agentsData) {
      let score = 0;
      for (const skill of agent.specialties || []) {
        if (text.includes(skill.toLowerCase())) score += 3;
      }
      if (text.includes(agent.role.toLowerCase().slice(0, 5))) score += 2;
      if (score > maxScore) {
        maxScore = score;
        best = agent;
      }
    }
    return maxScore > 0 ? best : null;
  }, [customTaskDesc, agentsData]);

  const taskQueue = serverQueue.length > 0 ? serverQueue : [
    { id: 'T-895', desc: 'MIT heap priority queue balancer & latency analyzer', priority: 1, agentId: null, started: 0, status: 'queued' as const, signature: 'sig_q_895fa' },
    { id: 'T-896', desc: 'Zero-day payload mitigation & network firewall hardening', priority: 2, agentId: null, started: 0, status: 'queued' as const, signature: 'sig_q_89601' },
    { id: 'T-897', desc: 'Enterprise account contract validation & SLA renegotiation', priority: 3, agentId: null, started: 0, status: 'queued' as const, signature: 'sig_q_897ee' },
    { id: 'T-898', desc: 'Financial ledger quarterly tax reconciliation & ledger audit', priority: 2, agentId: null, started: 0, status: 'queued' as const, signature: 'sig_q_898acct' },
  ];

  const handleAssignTask = (desc: string, priority: number = 1, preferredAgentId?: string) => {
    assignTask({ desc, priority, preferredAgentId });
  };

  const handleTriggerSwarm = (goal: string, priority: number = 1) => {
    swarmSolve(goal, priority);
    setShowSwarmModal(false);
    setSwarmGoalInput('');
  };

  const selectedAgent = agentsData.find((a) => a.id === selectedAgentId);

  // Cross-agent active collaboration links (to render dynamic Bezier curves between collaborating nodes)
  const activeCollabPairs = useMemo(() => {
    const pairs: Array<{ a: typeof agentsData[0]; b: typeof agentsData[0] }> = [];
    const seen = new Set<string>();

    for (const agent of agentsData) {
      if (agent.collaboratorId) {
        const peer = agentsData.find((x) => x.id === agent.collaboratorId);
        if (peer) {
          const key = [agent.id, peer.id].sort().join('-');
          if (!seen.has(key)) {
            seen.add(key);
            pairs.push({ a: agent, b: peer });
          }
        }
      }
    }
    return pairs;
  }, [agentsData]);

  const busyCount = agentsData.filter((a) => a.status === 'busy').length;
  const idleCount = agentsData.filter((a) => a.status === 'idle').length;

  return (
    <div className="flex flex-col gap-4 animate-in text-[#ebdbb2] font-sans">
      {/* TOP HEADER: Universal Spider-Web Network Stats */}
      <div
        className="rufflo-panel"
        style={{
          border: '1px solid var(--border-accent, #fabd2f)',
          background: 'linear-gradient(135deg, rgba(16,16,16,0.95), rgba(24,24,24,0.98))',
        }}
      >
        <div className="p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#3c3836] pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#22ff88]/15 border border-[#22ff88]/40 flex items-center justify-center text-[#22ff88] shadow-[0_0_15px_rgba(34,255,136,0.2)]">
                <Network className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold tracking-wider text-white font-mono uppercase">
                    Universal Spider-Web Task Network
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22ff88]/20 text-[#22ff88] border border-[#22ff88]/30 font-bold">
                    {connected ? 'CONNECTED • ZERO POLLING' : 'CONNECTING...'}
                  </span>
                </div>
                <div className="text-xs text-[#a89984] font-mono mt-0.5">
                  Full multi-agent mesh: {agentsData.length} agents connected across 3 concentric coordination rings
                </div>
              </div>
            </div>

            {/* Quick Solve Action Suite */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowSwarmModal(true)}
                className="px-3 py-1.5 rounded bg-gradient-to-r from-[#fabd2f] to-[#ffaa00] text-black font-bold text-xs font-mono flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,189,47,0.3)] hover:brightness-110 active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 fill-black" />
                <span>🚀 Swarm Solve</span>
              </button>

              <button
                type="button"
                onClick={() => autoSolveNext()}
                className="px-3 py-1.5 rounded bg-[#22ff88]/20 border border-[#22ff88]/50 text-[#22ff88] font-bold text-xs font-mono flex items-center gap-1.5 hover:bg-[#22ff88]/30 active:scale-95 transition-all"
                title="Automatically solve the next queued task via highest-scoring domain specialist"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>⚡ Auto-Solve Next</span>
              </button>

              <button
                type="button"
                onClick={() => triggerCommand('harden')}
                className="px-3 py-1.5 rounded bg-[#1d2021] border border-[#ffaa00]/40 text-[#ffaa00] text-xs font-mono flex items-center gap-1.5 hover:border-[#ffaa00] transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Harden (47ms)</span>
              </button>

              <button
                type="button"
                onClick={() => triggerCommand('halt')}
                className="px-2.5 py-1.5 rounded bg-[#1d2021] border border-[#fb4934]/40 text-[#fb4934] text-xs font-mono flex items-center gap-1 hover:border-[#fb4934] transition-colors"
                title="Safely stabilize all active streams"
              >
                <span>Halt</span>
              </button>
            </div>
          </div>

          {/* Telemetry Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-mono">
            <div className="p-2 rounded bg-black/40 border border-[#282828] flex flex-col">
              <span className="text-[10px] text-[#928374] uppercase">Connected Fleet</span>
              <span className="text-white font-bold text-sm mt-0.5">
                {agentsData.length} Agents Online
              </span>
            </div>
            <div className="p-2 rounded bg-black/40 border border-[#282828] flex flex-col">
              <span className="text-[10px] text-[#928374] uppercase">Active Streams</span>
              <span className="text-[#fabd2f] font-bold text-sm mt-0.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#fabd2f] animate-ping" />
                {busyCount} Busy / {idleCount} Idle
              </span>
            </div>
            <div className="p-2 rounded bg-black/40 border border-[#282828] flex flex-col">
              <span className="text-[10px] text-[#928374] uppercase">Network Strength</span>
              <span className="text-[#22ff88] font-bold text-sm mt-0.5">
                {liveNetworkStrength.toFixed(1)}%
              </span>
            </div>
            <div className="p-2 rounded bg-black/40 border border-[#282828] flex flex-col">
              <span className="text-[10px] text-[#928374] uppercase">Harden Loop</span>
              <span className="text-[#00e5ff] font-bold text-sm mt-0.5">
                Every {liveHardenMs}ms
              </span>
            </div>
            <div className="p-2 rounded bg-black/40 border border-[#282828] flex flex-col">
              <span className="text-[10px] text-[#928374] uppercase">Total Solved</span>
              <span className="text-[#b8bb26] font-bold text-sm mt-0.5">
                {liveCompleted} Tasks
              </span>
            </div>
            <div className="p-2 rounded bg-black/40 border border-[#282828] flex flex-col">
              <span className="text-[10px] text-[#928374] uppercase">Command Ring</span>
              <span
                className={`font-bold text-sm mt-0.5 ${
                  commandRingStatus === 'PULSING' ? 'text-[#ff4444] animate-pulse' : 'text-[#22ff88]'
                }`}
              >
                {commandRingStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SWARM SOLVE MODAL */}
      {showSwarmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181615] border-2 border-[#fabd2f] rounded-2xl max-w-xl w-full p-6 shadow-[0_0_50px_rgba(250,189,47,0.3)] animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#3c3836] mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#fabd2f]" />
                <h3 className="text-base font-bold text-white font-mono">
                  Autonomous Multi-Agent Swarm Solver
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSwarmModal(false)}
                className="text-[#928374] hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#a89984] mb-4 leading-relaxed">
              Decompose any complex goal into parallel subtasks distributed across the web network. Connected agents will stream data packets collaboratively to solve the objective in real time.
            </p>

            <div className="flex flex-col gap-3 mb-4">
              <label className="text-[11px] font-mono text-[#ebdbb2] font-bold">Goal or Objective:</label>
              <input
                type="text"
                value={swarmGoalInput}
                onChange={(e) => setSwarmGoalInput(e.target.value)}
                placeholder="e.g. Build and test secure authentication microservice with deployment..."
                className="w-full bg-black/70 border border-[#504945] focus:border-[#fabd2f] rounded-lg px-3 py-2 text-sm text-white font-mono outline-none"
                autoFocus
              />
            </div>

            <div className="mb-5">
              <div className="text-[11px] font-mono text-[#928374] mb-2 uppercase font-bold">
                Or Select High-Impact Swarm Preset:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => handleTriggerSwarm('Implement and test secure authentication microservice', 1)}
                  className="p-2.5 rounded bg-black/40 border border-[#22ff88]/30 hover:border-[#22ff88] text-left hover:bg-[#22ff88]/10 text-[#ebdbb2] transition-colors flex flex-col gap-1"
                >
                  <span className="text-[#22ff88] font-bold">💻 Auth Microservice Swarm</span>
                  <span className="text-[10px] text-[#928374]">CoreCoder + QA + Security + Infra</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerSwarm('Enterprise client pitch, value proposal & contract audit', 1)}
                  className="p-2.5 rounded bg-black/40 border border-[#38bdf8]/30 hover:border-[#38bdf8] text-left hover:bg-[#38bdf8]/10 text-[#ebdbb2] transition-colors flex flex-col gap-1"
                >
                  <span className="text-[#38bdf8] font-bold">📈 Enterprise Client Deal</span>
                  <span className="text-[10px] text-[#928374]">Michael + Jim + Stanley + Angela</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerSwarm('Zero-day vulnerability patch & network firewall hardening', 1)}
                  className="p-2.5 rounded bg-black/40 border border-[#ffaa00]/30 hover:border-[#ffaa00] text-left hover:bg-[#ffaa00]/10 text-[#ebdbb2] transition-colors flex flex-col gap-1"
                >
                  <span className="text-[#ffaa00] font-bold">🛡️ Zero-Day Security Patch</span>
                  <span className="text-[10px] text-[#928374]">SafetyGuard + RepoArch + Infra</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerSwarm('Execute autonomous engineering department full lifecycle', 1)}
                  className="p-2.5 rounded bg-black/40 border border-[#d3869b]/30 hover:border-[#d3869b] text-left hover:bg-[#d3869b]/10 text-[#ebdbb2] transition-colors flex flex-col gap-1"
                >
                  <span className="text-[#d3869b] font-bold">⚙️ Full Department Lifecycle</span>
                  <span className="text-[10px] text-[#928374]">All 10 Engineering Specialists</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3c3836]">
              <button
                type="button"
                onClick={() => setShowSwarmModal(false)}
                className="px-4 py-1.5 rounded border border-[#504945] text-xs font-mono text-[#a89984] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!swarmGoalInput.trim()}
                onClick={() => handleTriggerSwarm(swarmGoalInput.trim(), 1)}
                className="px-4 py-1.5 rounded bg-[#fabd2f] text-black font-bold text-xs font-mono hover:brightness-110 disabled:opacity-40"
              >
                Launch Swarm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN 3-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* LEFT COLUMN (3 cols): Connected Agent Directory & Filter */}
        <div className="xl:col-span-3 flex flex-col gap-3">
          <div className="rufflo-panel">
            <div className="rufflo-panel-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#fabd2f]" />
                <span className="rufflo-panel-title">Connected Fleet ({agentsData.length})</span>
              </div>
              <span className="text-[10px] font-mono text-[#22ff88]">{busyCount} active</span>
            </div>

            {/* Category Filter Tabs */}
            <div className="p-2 bg-[#0d0e10] border-b border-[#282828] flex items-center gap-1 text-[10px] font-mono flex-wrap">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-2 py-1 rounded transition-colors ${
                  categoryFilter === 'all' ? 'bg-[#fabd2f] text-black font-bold' : 'text-[#a89984] hover:bg-[#282828]'
                }`}
              >
                All ({agentsData.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('engineering')}
                className={`px-2 py-1 rounded transition-colors ${
                  categoryFilter === 'engineering' ? 'bg-[#22ff88] text-black font-bold' : 'text-[#a89984] hover:bg-[#282828]'
                }`}
              >
                Engineering (10)
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('workforce')}
                className={`px-2 py-1 rounded transition-colors ${
                  categoryFilter === 'workforce' ? 'bg-[#38bdf8] text-black font-bold' : 'text-[#a89984] hover:bg-[#282828]'
                }`}
              >
                Workforce (9)
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('collaborating')}
                className={`px-2 py-1 rounded transition-colors ${
                  categoryFilter === 'collaborating' ? 'bg-[#ffaa00] text-black font-bold' : 'text-[#a89984] hover:bg-[#282828]'
                }`}
              >
                Active
              </button>
            </div>

            {/* Search filter input */}
            <div className="p-2 border-b border-[#282828] bg-black/40">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#181615] border border-[#3c3836]">
                <Search className="w-3 h-3 text-[#7c6f64]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter agents by skill or name..."
                  className="bg-transparent text-xs text-white outline-none w-full font-mono placeholder:text-[#504945]"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="text-[#928374] text-xs">✕</button>
                )}
              </div>
            </div>

            {/* Agent List */}
            <div className="p-2.5 flex flex-col gap-2 max-h-[580px] overflow-y-auto">
              {filteredAgents.map((agent) => {
                const isSelected = selectedAgentId === agent.id;
                const isBusy = agent.status === 'busy';
                const isDropped = agent.status === 'dropped';
                const priority = getAgentPriority(agent);

                return (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1d2021] border-[#fabd2f] shadow-[0_0_12px_rgba(250,189,47,0.25)]'
                        : isBusy
                        ? 'bg-[#181615] border-[#504945] hover:border-[#fabd2f]'
                        : isDropped
                        ? 'bg-[#282828]/60 border-[#fb4934]/60'
                        : 'bg-[#141617] border-[#282828] hover:border-[#3c3836]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: isDropped ? '#fb4934' : isBusy ? '#fabd2f' : '#22ff88',
                            boxShadow: isBusy ? '0 0 8px #fabd2f' : '0 0 6px #22ff88',
                          }}
                        />
                        <span className="font-mono text-xs font-bold text-white truncate max-w-[130px]">
                          {agent.name}
                        </span>
                        <span className="text-[10px] text-[#928374] font-mono">({agent.id})</span>
                      </div>
                      <span
                        className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-bold ${
                          isDropped
                            ? 'bg-[#fb4934]/20 text-[#fb4934]'
                            : isBusy
                            ? 'bg-[#fabd2f]/20 text-[#fabd2f]'
                            : 'bg-[#22ff88]/20 text-[#22ff88]'
                        }`}
                      >
                        {agent.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#a89984] mb-1.5 truncate">{agent.role}</div>

                    {/* Active Task snippet */}
                    {agent.task ? (
                      <div className="p-2 rounded bg-black/50 border border-[#3c3836] flex flex-col gap-1 text-[11px]">
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold text-[#fabd2f]">{agent.task.id}</span>
                          <span className="text-[9px] px-1 rounded bg-[#ffaa00]/20 text-[#ffaa00]">
                            P{agent.task.priority} (stream active)
                          </span>
                        </div>
                        <div className="text-[#ebdbb2] truncate">{agent.task.desc}</div>

                        {agent.collaboratorId && (
                          <div className="text-[9px] text-[#00e5ff] font-mono flex items-center gap-1 mt-0.5">
                            <LinkIcon className="w-2.5 h-2.5" />
                            <span>Mesh Link: {agent.collaboratorId}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[10px] font-mono text-[#7c6f64] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#504945]" />
                        <span>Ready in ring • {agent.specialties?.slice(0, 2).join(', ')}</span>
                      </div>
                    )}

                    {/* Quick Row Actions */}
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#282828] text-[10px] font-mono text-[#928374]">
                      <span>Completed: {agent.tasksCompleted}</span>
                      <div className="flex items-center gap-1.5">
                        {agent.task && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              socketCompleteTask(agent.id);
                            }}
                            className="px-2 py-0.5 rounded bg-[#22ff88]/20 text-[#22ff88] hover:bg-[#22ff88]/30 font-bold"
                          >
                            Solve
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            socketFailoverAgent(agent.id);
                          }}
                          className="px-2 py-0.5 rounded bg-[#fb4934]/20 text-[#fb4934] hover:bg-[#fb4934]/30"
                        >
                          {agent.status === 'dropped' ? 'Restore' : 'Failover'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN (6 cols): Full-Scale Live Spider-Web SVG Canvas */}
        <div className="xl:col-span-6 flex flex-col gap-3">
          <div className="rufflo-panel overflow-hidden">
            <div className="rufflo-panel-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#22ff88] animate-pulse" />
                <span className="rufflo-panel-title">
                  Interactive Spider-Web Mesh ({agentsData.length} Nodes Connected)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#22ff88]">
                  {connected ? 'REAL-TIME BROADCAST' : 'OFFLINE'}
                </span>
                <span className="w-2 h-2 rounded-full bg-[#22ff88] animate-ping" />
              </div>
            </div>

            {/* Pulse Speed Legend */}
            <div className="px-4 py-1.5 bg-[#0a0a0c] border-b border-[#282828] flex items-center justify-between text-[11px] font-mono flex-wrap gap-2">
              <span className="text-[#a89984] flex items-center gap-1.5 font-bold">
                <Activity className="w-3.5 h-3.5 text-[#22ff88]" />
                PACKET STREAM SPEEDS:
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[#ffaa00]">
                  <span className="w-2 h-2 rounded-full bg-[#ffaa00] animate-pulse" />
                  P1: 0.45s rapid
                </span>
                <span className="flex items-center gap-1 text-[#00e5ff]">
                  <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-pulse" />
                  P2: 0.90s steady
                </span>
                <span className="flex items-center gap-1 text-[#83a598]">
                  <span className="w-2 h-2 rounded-full bg-[#83a598]" />
                  P3: 1.80s normal
                </span>
                <span className="flex items-center gap-1 text-[#504945]">
                  <span className="w-2 h-2 rounded-full bg-[#504945]" />
                  Idle: 3.60s
                </span>
              </div>
            </div>

            {/* SVG Spider Canvas */}
            <div
              className="web-container flex items-center justify-center p-3 relative"
              id="spiderWebContainer"
              style={{ background: '#050505', minHeight: '620px' }}
            >
              <svg
                id="spiderCanvas"
                width="820"
                height="620"
                viewBox="0 0 820 620"
                style={{
                  background: '#050505',
                  borderRadius: '20px',
                  boxShadow: '0 0 60px rgba(34,255,136,0.15)',
                  display: 'block',
                  maxWidth: '100%',
                  height: 'auto',
                }}
              >
                <defs>
                  <radialGradient id="commandGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ff4444" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#ff4444" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="ringPulse" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#22ff88" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#22ff88" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Concentric Rings (Progress & Strength) */}
                {/* Inner Ring (R=130): Orchestration & Meta Command */}
                <circle
                  cx={CX}
                  cy={CY}
                  r="130"
                  fill="none"
                  stroke="#22ff88"
                  strokeWidth="2"
                  strokeDasharray="8 4"
                  opacity="0.3"
                />
                <text x={CX} y={CY - 134} textAnchor="middle" fill="#83a598" fontSize="9" fontFamily="monospace" opacity="0.6">
                  INNER RING: ORCHESTRATION & META (R=130)
                </text>

                {/* Mid Ring (R=210): Engineering Execution */}
                <circle
                  cx={CX}
                  cy={CY}
                  r="210"
                  fill="none"
                  stroke="#22ff88"
                  strokeWidth="2.5"
                  strokeDasharray="12 6"
                  opacity="0.35"
                />
                <text x={CX} y={CY - 214} textAnchor="middle" fill="#22ff88" fontSize="9" fontFamily="monospace" opacity="0.6">
                  MID RING: ENGINEERING SPECIALISTS (R=210)
                </text>

                {/* Outer Ring (R=280): Enterprise & Workforce Fleet */}
                <circle
                  cx={CX}
                  cy={CY}
                  r="280"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeDasharray="14 7"
                  opacity="0.25"
                />
                <text x={CX} y={CY - 284} textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="monospace" opacity="0.5">
                  OUTER RING: ENTERPRISE & WORKFORCE FLEET (R=280)
                </text>

                {/* Perimeter threads connecting all nodes in a structural spider web */}
                {/* Inner ring perimeter */}
                <polygon
                  points={agentsData
                    .filter((a) => a.radius === 130 || (!a.radius && a.id.length <= 4 && ['michael', 'ENG-10', 'dwight', 'ENG-9', 'ENG-7', 'pam'].includes(a.id)))
                    .map((a) => `${a.cx},${a.cy}`)
                    .join(' ')}
                  fill="none"
                  stroke="#22ff88"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.2"
                />

                {/* Mid ring perimeter */}
                <polygon
                  points={agentsData
                    .filter((a) => a.radius === 210 || (!a.radius && a.id.startsWith('A')))
                    .map((a) => `${a.cx},${a.cy}`)
                    .join(' ')}
                  fill="none"
                  stroke="#22ff88"
                  strokeWidth="1.2"
                  strokeDasharray="6 4"
                  opacity="0.25"
                />

                {/* Outer ring perimeter */}
                <polygon
                  points={agentsData
                    .filter((a) => a.radius === 280 || (!a.radius && ['jim', 'stanley', 'angela', 'kevin', 'toby', 'kelly'].includes(a.id)))
                    .map((a) => `${a.cx},${a.cy}`)
                    .join(' ')}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="8 6"
                  opacity="0.2"
                />

                {/* Radial spokes connecting center hub to every connected agent node */}
                {agentsData.map((agent) => (
                  <line
                    key={`spoke-${agent.id}`}
                    x1={CX}
                    y1={CY}
                    x2={agent.cx}
                    y2={agent.cy}
                    stroke={agent.status === 'busy' ? '#fabd2f' : '#22ff88'}
                    strokeWidth={agent.status === 'busy' ? 1.5 : 0.9}
                    strokeDasharray={agent.status === 'busy' ? 'none' : '4 4'}
                    opacity={agent.status === 'busy' ? 0.35 : 0.15}
                    className="spider-static"
                  />
                ))}

                {/* CROSS-AGENT COLLABORATION BEZIER THREADS (Peer-to-Peer Packet Surge) */}
                <g id="crossAgentThreads">
                  {activeCollabPairs.map(({ a, b }) => {
                    const midX = (a.cx + b.cx) / 2 + (b.cy - a.cy) * 0.25;
                    const midY = (a.cy + b.cy) / 2 - (b.cx - a.cx) * 0.25;
                    return (
                      <g key={`collab-${a.id}-${b.id}`}>
                        <path
                          d={`M${a.cx} ${a.cy} Q${midX} ${midY} ${b.cx} ${b.cy}`}
                          fill="none"
                          stroke="rgba(0, 229, 255, 0.25)"
                          strokeWidth="3"
                        />
                        <path
                          className="data-packet-thread priority-1"
                          data-priority="1"
                          d={`M${a.cx} ${a.cy} Q${midX} ${midY} ${b.cx} ${b.cy}`}
                          fill="none"
                          stroke="#00e5ff"
                          strokeWidth="3.5"
                          style={{
                            '--pulse-speed': '0.65s',
                            '--packet-speed': '0.65s',
                          } as React.CSSProperties}
                        />
                      </g>
                    );
                  })}
                </g>

                {/* RADIATING DATA PACKET FLOW THREADS (From Center to Busy Agents via CSS Keyframes) */}
                <g id="taskThreads">
                  {agentsData.map((agent) => {
                    const priority = getAgentPriority(agent);
                    const pulseSpeed = getPulseSpeedForPriority(priority);
                    const isBusy = agent.status === 'busy' && !!agent.task;
                    const midX = (CX + agent.cx) / 2 + (agent.cy - CY) * 0.2;
                    const midY = (CY + agent.cy) / 2 - (agent.cx - CX) * 0.2;

                    return (
                      <g key={`thread-live-${agent.id}`} data-priority={priority}>
                        {/* Underlying subtle guide curve */}
                        <path
                          d={`M${CX} ${CY} Q${midX} ${midY} ${agent.cx} ${agent.cy}`}
                          fill="none"
                          stroke={isBusy ? 'rgba(250, 189, 47, 0.2)' : 'rgba(34, 255, 136, 0.08)'}
                          strokeWidth="1.2"
                          className="spider-static"
                        />
                        {/* Data packet thread animated with CSS keyframe dataPacketFlow & dataPacketPulse */}
                        {isBusy && (
                          <g id={`active-thread-group-${agent.id}`}>
                            <path
                              id={`thread-${agent.id}`}
                              className={`data-packet-thread priority-${priority}`}
                              data-priority={priority}
                              data-agent-id={agent.id}
                              data-packet-stream="true"
                              d={`M${CX} ${CY} Q${midX} ${midY} ${agent.cx} ${agent.cy}`}
                              fill="none"
                              stroke={
                                priority === 1
                                  ? '#ffaa00'
                                  : priority === 2
                                  ? '#ffdd00'
                                  : '#22ff88'
                              }
                              strokeWidth={priority === 1 ? 5.5 : priority === 2 ? 3.8 : 2.2}
                              opacity={0.95}
                              style={{
                                '--pulse-speed': pulseSpeed,
                                '--packet-speed': pulseSpeed,
                              } as React.CSSProperties}
                            />

                            {/* Visual priority-based animation overlay glow path */}
                            <path
                              className="priority-overlay-glow animate-pulse"
                              d={`M${CX} ${CY} Q${midX} ${midY} ${agent.cx} ${agent.cy}`}
                              fill="none"
                              stroke={
                                priority === 1
                                  ? '#ffaa00'
                                  : priority === 2
                                  ? '#ffdd00'
                                  : '#22ff88'
                              }
                              strokeWidth={(priority === 1 ? 5.5 : priority === 2 ? 3.8 : 2.2) * 1.6}
                              opacity={0.4}
                              style={{
                                filter: 'blur(3px)',
                                strokeDasharray: priority === 1 ? '5 10' : priority === 2 ? '10 20' : '15 30',
                                animation: `dataPacketFlow ${pulseSpeed} linear infinite`,
                              }}
                            />
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>

                {/* AGENT SPOKES (All Connected Agents Rendered as Interactive Nodes) */}
                <g id="agentSpokes">
                  {agentsData.map((agent) => {
                    const priority = getAgentPriority(agent);
                    const isBusy = agent.status === 'busy';
                    const isSelected = selectedAgentId === agent.id;
                    const pulseSpeed = getPulseSpeedForPriority(priority);

                    // Short label for SVG node (e.g. A1, E10, MS, DS, JH, etc.)
                    const label = agent.id.startsWith('A')
                      ? agent.id
                      : agent.id.startsWith('ENG-')
                      ? `E${agent.id.replace('ENG-', '')}`
                      : agent.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2);

                    return (
                      <g
                        key={`spoke-node-${agent.id}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedAgentId(agent.id)}
                        data-priority={priority}
                      >
                        {/* Active Selection or Priority Halo */}
                        {isSelected && (
                          <circle
                            cx={agent.cx}
                            cy={agent.cy}
                            r="26"
                            fill="none"
                            stroke="#fabd2f"
                            strokeWidth="2.5"
                            strokeDasharray="4 2"
                            opacity="0.9"
                          />
                        )}

                        {isBusy && (
                          <circle
                            cx={agent.cx}
                            cy={agent.cy}
                            r="23"
                            fill="none"
                            stroke={priority === 1 ? '#ffaa00' : priority === 2 ? '#00e5ff' : '#83a598'}
                            strokeWidth="2"
                            opacity="0.75"
                          />
                        )}

                        {/* Node circle */}
                        <circle
                          cx={agent.cx}
                          cy={agent.cy}
                          r="18"
                          fill={agent.color || '#22ff88'}
                          stroke="#111"
                          strokeWidth="4"
                        />

                        {/* Node short label */}
                        <text
                          x={agent.cx}
                          y={agent.cy + 5}
                          textAnchor="middle"
                          fill="#111"
                          fontSize="11"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {label}
                        </text>

                        {/* Connected status dot on node perimeter */}
                        <circle
                          cx={agent.cx + 12}
                          cy={agent.cy - 12}
                          r="4"
                          fill={agent.status === 'dropped' ? '#fb4934' : isBusy ? '#fabd2f' : '#22ff88'}
                          stroke="#111"
                          strokeWidth="1.5"
                        />

                        {/* Local animated data packet tail curve for active agents */}
                        {isBusy && (
                          <path
                            className={`data-packet-thread priority-${priority}`}
                            data-priority={priority}
                            d={`M${agent.cx} ${agent.cy + 18} Q${agent.cx - 25} ${agent.cy + 35} ${agent.cx - 10} ${agent.cy + 50}`}
                            fill="none"
                            stroke={priority === 1 ? '#ffaa00' : '#22ff88'}
                            strokeWidth="3"
                            style={{
                              '--pulse-speed': pulseSpeed,
                              '--packet-speed': pulseSpeed,
                            } as React.CSSProperties}
                          />
                        )}
                      </g>
                    );
                  })}
                </g>

                {/* CENTRAL COMMAND RING HUB (Interactive click to pulse/deploy) */}
                <g
                  style={{ cursor: 'pointer' }}
                  onClick={() => triggerCommand('deploy', { desc: 'Command Ring Center Manual Pulse' })}
                >
                  <circle cx={CX} cy={CY} r="54" fill="rgba(255,68,68,0.15)">
                    <animate attributeName="r" values="48;58;48" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={CX} cy={CY} r="42" fill="#111" stroke="#ff4444" strokeWidth="6" />
                  <text x={CX} y={CY + 4} textAnchor="middle" fill="#ff4444" fontSize="13" fontWeight="900" fontFamily="monospace">
                    COMMAND
                  </text>
                  <text x={CX} y={CY + 18} textAnchor="middle" fill="#ff4444" fontSize="10" fontWeight="bold" fontFamily="monospace">
                    RING
                  </text>
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (3 cols): Task Queue & Real-Time Telemetry */}
        <div className="xl:col-span-3 flex flex-col gap-3">
          {/* FIFO Task Queue */}
          <div className="rufflo-panel">
            <div className="rufflo-panel-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#83a598]" />
                <span className="rufflo-panel-title">Task Ring Queue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => autoSolveNext()}
                  className="px-2 py-0.5 text-[9px] font-mono rounded bg-[#22ff88]/20 text-[#22ff88] hover:bg-[#22ff88]/30 font-bold"
                  title="Auto-solve top task immediately"
                >
                  Solve Next
                </button>
                <span className="text-[10px] font-mono text-[#fabd2f]">{taskQueue.length} Queued</span>
              </div>
            </div>

            <div className="p-3 flex flex-col gap-2 max-h-[290px] overflow-y-auto">
              {taskQueue.map((task) => (
                <div
                  key={task.id}
                  className="p-2.5 rounded bg-[#181615] border border-[#3c3836] flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#83a598]" />
                      <span className="font-mono text-xs font-bold text-[#83a598]">{task.id}</span>
                    </div>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        task.priority === 1
                          ? 'bg-[#ffaa00]/20 text-[#ffaa00]'
                          : task.priority === 2
                          ? 'bg-[#00e5ff]/20 text-[#00e5ff]'
                          : 'bg-[#83a598]/20 text-[#83a598]'
                      }`}
                    >
                      P{task.priority} • {task.status}
                    </span>
                  </div>
                  <div className="text-xs text-[#ebdbb2] leading-snug">{task.desc}</div>
                  <div className="text-[9px] font-mono text-[#7c6f64] flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span className="truncate max-w-[120px]">{task.signature}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => autoSolveNext()}
                      className="text-[#22ff88] hover:underline"
                    >
                      Accelerate →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2.5 border-t border-[#3c3836] bg-[#121314]">
              <button
                type="button"
                onClick={() => triggerCommand('deploy')}
                className="rufflo-btn rufflo-btn-primary w-full justify-center text-xs"
                style={{ height: 32 }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Process Spider-Web Ring Flow</span>
              </button>
            </div>
          </div>

          {/* Real-time Telemetry & Failover Stream */}
          <div className="rufflo-panel">
            <div className="rufflo-panel-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-[#83a598]" />
                <span className="rufflo-panel-title">Mesh Telemetry Stream</span>
              </div>
              <span className="text-[10px] font-mono text-[#22ff88]">ZERO-POLLING</span>
            </div>
            <div
              className="p-2.5 font-mono text-[10px] leading-relaxed overflow-y-auto max-h-[250px] bg-[#0c0d0e] text-[#a89984] flex flex-col gap-1"
              style={{ borderRadius: '0 0 8px 8px' }}
            >
              {(liveLogs.length > 0 ? liveLogs : [
                `[${new Date().toLocaleTimeString()}] 🕸️ Universal Agent Mesh online: all 19 agents connected`,
                `[${new Date().toLocaleTimeString()}] 🔒 Cryptographic task signing online`,
                `[${new Date().toLocaleTimeString()}] ⚡ Command Ring status: ACTIVE`,
              ]).map((log, i) => (
                <div key={i} className="break-words">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SELECTED AGENT INSPECTION DRAWER */}
      {selectedAgent && (
        <div
          className="rufflo-panel p-4"
          style={{
            background: 'linear-gradient(180deg, #181615, #141617)',
            border: '2px solid var(--border-accent, #fabd2f)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#3c3836] pb-3 mb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-black font-mono text-sm"
                style={{ backgroundColor: selectedAgent.color || '#22ff88' }}
              >
                {selectedAgent.id.startsWith('A')
                  ? selectedAgent.id
                  : selectedAgent.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white font-mono">{selectedAgent.name}</h3>
                  <span className="text-xs font-mono text-[#928374]">({selectedAgent.id})</span>
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                      selectedAgent.status === 'busy'
                        ? 'bg-[#fabd2f]/20 text-[#fabd2f]'
                        : selectedAgent.status === 'dropped'
                        ? 'bg-[#fb4934]/20 text-[#fb4934]'
                        : 'bg-[#22ff88]/20 text-[#22ff88]'
                    }`}
                  >
                    {selectedAgent.status}
                  </span>
                </div>
                <div className="text-xs text-[#a89984]">{selectedAgent.role} • Ring Category: {selectedAgent.category}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {selectedAgent.task && (
                <button
                  type="button"
                  onClick={() => socketCompleteTask(selectedAgent.id)}
                  className="px-3 py-1 text-xs rounded bg-[#22ff88]/20 text-[#22ff88] border border-[#22ff88]/40 hover:bg-[#22ff88]/30 font-bold font-mono"
                >
                  ✓ Complete Task
                </button>
              )}

              <button
                type="button"
                onClick={() => socketFailoverAgent(selectedAgent.id)}
                className="px-3 py-1 text-xs rounded bg-[#fb4934]/20 text-[#fb4934] border border-[#fb4934]/40 hover:bg-[#fb4934]/30 font-mono"
              >
                {selectedAgent.status === 'dropped' ? 'Restore Node' : 'Simulate Failover & Reroute'}
              </button>

              <button
                type="button"
                onClick={() => setSelectedAgentId(null)}
                className="text-[#928374] hover:text-white text-xs font-mono px-2 py-1"
              >
                Close ✕
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <span className="text-[#928374] uppercase text-[10px] block mb-1">Domain Specialties</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedAgent.specialties?.map((spec) => (
                  <span key={spec} className="px-2 py-0.5 rounded bg-black/50 border border-[#3c3836] text-[#ebdbb2]">
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[#928374] uppercase text-[10px] block mb-1">Active Mesh Link</span>
              {selectedAgent.collaboratorId ? (
                <div className="flex items-center gap-1.5 text-[#00e5ff]">
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Actively paired with {selectedAgent.collaboratorId}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={pairingTargetId}
                    onChange={(e) => setPairingTargetId(e.target.value)}
                    className="bg-black/60 border border-[#3c3836] rounded px-2 py-1 text-xs text-white"
                  >
                    <option value="">Pair with peer...</option>
                    {agentsData
                      .filter((a) => a.id !== selectedAgent.id)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.id})
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    disabled={!pairingTargetId}
                    onClick={() => {
                      if (pairingTargetId) {
                        collaborate(
                          selectedAgent.id,
                          pairingTargetId,
                          `Collaborative task solving between ${selectedAgent.name} & peer`
                        );
                        setPairingTargetId('');
                      }
                    }}
                    className="px-2.5 py-1 rounded bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40 disabled:opacity-40 hover:bg-[#00e5ff]/30"
                  >
                    Pair Link
                  </button>
                </div>
              )}
            </div>

            <div>
              <span className="text-[#928374] uppercase text-[10px] block mb-1">Cryptographic Signature</span>
              <div className="text-[10px] text-[#7c6f64] flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>{selectedAgent.signature}</span>
              </div>
              <div className="text-[#a89984] mt-1">Lifetime Tasks: {selectedAgent.tasksCompleted}</div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM BAR: Intelligent Task Dispatcher with Skill-Based Routing */}
      <div
        className="rufflo-panel p-3"
        style={{
          background: 'linear-gradient(180deg, var(--bg-2, #1d2021), #141617)',
          border: '1px solid var(--border-accent, #fabd2f)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-[#928374] uppercase font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#fb4934]" /> Presets:
            </span>
            <button
              type="button"
              onClick={() => handleAssignTask('MIT syllabus graph algorithm optimization & code generation', 2)}
              className="px-2.5 py-1 text-xs rounded bg-[#1d2021] border border-[#22ff88]/40 hover:border-[#22ff88] text-[#22ff88] transition-colors flex items-center gap-1"
            >
              <span>Code Opt (P2)</span>
            </button>
            <button
              type="button"
              onClick={() => handleAssignTask('Run automated test suite and regression assertion', 1)}
              className="px-2.5 py-1 text-xs rounded bg-[#1d2021] border border-[#ffdd00]/40 hover:border-[#ffdd00] text-[#ffdd00] transition-colors flex items-center gap-1"
            >
              <span>Test Suite (P1)</span>
            </button>
            <button
              type="button"
              onClick={() => handleAssignTask('Enterprise sales deal negotiation with Fortune 500 client', 2)}
              className="px-2.5 py-1 text-xs rounded bg-[#1d2021] border border-[#38bdf8]/40 hover:border-[#38bdf8] text-[#38bdf8] transition-colors flex items-center gap-1"
            >
              <span>Sales Pitch (P2)</span>
            </button>
            <button
              type="button"
              onClick={() => handleAssignTask('Financial ledger audit and quarterly tax balance check', 3)}
              className="px-2.5 py-1 text-xs rounded bg-[#1d2021] border border-[#a78bfa]/40 hover:border-[#a78bfa] text-[#a78bfa] transition-colors flex items-center gap-1"
            >
              <span>Audit (P3)</span>
            </button>
          </div>

          {/* Custom Task Dispatch Input with Priority Selection & Auto-Route Predictor */}
          <div className="flex-1 min-w-[320px] max-w-[620px] flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-black/60 border border-[#504945] rounded p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedPriority(1)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded font-bold transition-all ${
                    selectedPriority === 1
                      ? 'bg-[#ffaa00] text-black shadow-sm'
                      : 'text-[#ffaa00] hover:bg-[#ffaa00]/10'
                  }`}
                  title="Priority 1 (0.45s Rapid Stream)"
                >
                  P1 (0.45s)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPriority(2)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded font-bold transition-all ${
                    selectedPriority === 2
                      ? 'bg-[#00e5ff] text-black shadow-sm'
                      : 'text-[#00e5ff] hover:bg-[#00e5ff]/10'
                  }`}
                  title="Priority 2 (0.90s Steady Stream)"
                >
                  P2 (0.90s)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPriority(3)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded font-bold transition-all ${
                    selectedPriority === 3
                      ? 'bg-[#83a598] text-black shadow-sm'
                      : 'text-[#83a598] hover:bg-[#83a598]/10'
                  }`}
                  title="Priority 3 (1.80s Normal Stream)"
                >
                  P3 (1.80s)
                </button>
              </div>

              <input
                type="text"
                value={customTaskDesc}
                onChange={(e) => setCustomTaskDesc(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customTaskDesc.trim()) {
                    handleAssignTask(customTaskDesc.trim(), selectedPriority);
                    setCustomTaskDesc('');
                  }
                }}
                placeholder={`Deploy task to mesh network with Priority ${selectedPriority}...`}
                className="flex-1 bg-black/60 border border-[#504945] focus:border-[#fabd2f] text-xs px-3 py-1.5 rounded text-white font-mono outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (customTaskDesc.trim()) {
                    handleAssignTask(customTaskDesc.trim(), selectedPriority);
                    setCustomTaskDesc('');
                  }
                }}
                className="rufflo-btn rufflo-btn-primary text-xs shrink-0"
                style={{ height: 32 }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Deploy Task</span>
              </button>
            </div>

            {/* Live Auto-Route Prediction Pill */}
            {predictedAgent && (
              <div className="text-[10px] font-mono text-[#22ff88] flex items-center gap-1 pl-1">
                <ArrowRight className="w-3 h-3" />
                <span>
                  Skill-based match: Auto-routing to <strong>{predictedAgent.name}</strong> ({predictedAgent.role})
                </span>
              </div>
            )}
          </div>

          {/* Ring Telemetry Pill */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-[#22ff88]">
              <span className="w-2 h-2 rounded-full bg-[#22ff88] animate-pulse" />
              <span>{agentsData.length} Nodes Online</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#fabd2f]">
              <Shield className="w-3.5 h-3.5 text-[#fabd2f]" />
              <span>Signed & Hardened</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
