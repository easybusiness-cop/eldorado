import React, { useState, useEffect } from 'react';
import { Agent, AgentLog } from '../types';
import {
  Monitor,
  Globe,
  Code2,
  Database,
  Terminal,
  Cpu,
  RefreshCw,
  ExternalLink,
  Play,
  CheckCircle2,
  X,
  ShieldCheck,
  Search,
  HardDrive,
  Layers,
  Sparkles,
  Zap,
  FolderGit2,
  Server,
  Brain,
  FileText,
  Activity,
  Check,
  Atom,
} from 'lucide-react';
import { DeveloperComputerSuite } from './DeveloperComputerSuite';
import { soundFx } from '../utils/speech';
import { runAgentStandardWorkflow, WorkflowExecutionState, STANDARD_WORKFLOW_STAGES } from '../utils/agentWorkflowEngine';

interface AgentWorkstationModalProps {
  isOpen: boolean;
  agent: Agent | null;
  onClose: () => void;
  logs?: AgentLog[];
}

export const AgentWorkstationModal: React.FC<AgentWorkstationModalProps> = ({
  isOpen,
  agent,
  onClose,
  logs = [],
}) => {
  const [activeTab, setActiveTab] = useState<'workflow' | 'browser' | 'ide' | 'database' | 'software' | 'quantum' | 'developer_suite'>('workflow');
  const [browserUrl, setBrowserUrl] = useState<string>(() => agent ? `https://github.com/dunder-mifflin/${agent.id}-workspace` : '');
  const [browserSearchQuery, setBrowserSearchQuery] = useState<string>('TypeScript async optimization guidelines');
  const [isExecuting, setIsExecuting] = useState(false);
  const [workflowState, setWorkflowState] = useState<WorkflowExecutionState | null>(null);
  const [customDirective, setCustomDirective] = useState<string>(() => agent ? `Optimize ${agent.role} pipeline and run 5-step standard engineering workflow.` : '');
  
  // Quantum Search Architecture States
  const [quantumQuery, setQuantumQuery] = useState<string>('Find optimized corporate security vector & memory indices');
  const [numQubits, setNumQubits] = useState<number>(4);
  const [isQuantumSearching, setIsQuantumSearching] = useState<boolean>(false);
  const [quantumResults, setQuantumResults] = useState<Array<{ state: string; probability: number; match: string; amplitude: number }>>([
    { state: '|0000⟩', probability: 0.06, match: 'Standard log record #102', amplitude: 0.25 },
    { state: '|0011⟩', probability: 0.06, match: 'Config environment profile', amplitude: 0.25 },
    { state: '|0101⟩', probability: 0.06, match: 'Network firewall rule set', amplitude: 0.25 },
    { state: '|1010⟩', probability: 0.82, match: 'Optimal Quantum Index Match: Target Pattern Found', amplitude: 0.90 },
    { state: '|1111⟩', probability: 0.06, match: 'System backup heartbeat', amplitude: 0.25 },
  ]);
  const [quantumLogs, setQuantumLogs] = useState<string[]>(() => agent ? [
    `[QUANTUM ENGINE] Initialized 4-Qubit Superposition Register for ${agent.name}`,
    `[GROVER ORACLE] State space size N = 16. Optimal iterations k = 2`,
    `[ENTANGLEMENT] Linked with multi-agent neural mesh network. Ready for query.`,
  ] : []);

  if (!isOpen || !agent) return null;

  const handleRunQuantumSearch = () => {
    if (isQuantumSearching) return;
    setIsQuantumSearching(true);
    soundFx.playClick();
    setQuantumLogs(prev => [
      ...prev,
      `[GROVER SEARCH] Executing quantum search for query: "${quantumQuery}"`,
      `[SUPERPOSITION] Creating uniform superposition across ${Math.pow(2, numQubits)} states...`,
    ]);

    setTimeout(() => {
      setQuantumLogs(prev => [
        ...prev,
        `[ORACLE ITERATION 1/2] Phase inversion applied to target subspace...`,
        `[DIFFUSION OPERATOR] Amplitude amplification reflecting about average...`,
      ]);
    }, 600);

    setTimeout(() => {
      soundFx.playSuccessChime();
      setIsQuantumSearching(false);
      setQuantumLogs(prev => [
        ...prev,
        `[ORACLE ITERATION 2/2] Completed optimal Grover steps (k = 2).`,
        `[MEASUREMENT] Target eigenvalue collapsed with 94.8% probability confidence.`,
        `[SUCCESS] Quadratic speedup achieved: O(N) -> O(√N) [16 steps reduced to 2 steps].`,
      ]);
      setQuantumResults([
        { state: '|0110⟩', probability: 0.02, match: 'Secondary cache record', amplitude: 0.14 },
        { state: '|1001⟩', probability: 0.03, match: 'Subroutine telemetry', amplitude: 0.17 },
        { state: '|1101⟩', probability: 0.91, match: `High-Confidence Match for "${quantumQuery}" in ${agent.name} memory matrix`, amplitude: 0.95 },
        { state: '|1111⟩', probability: 0.04, match: 'Idle node heartbeat', amplitude: 0.20 },
      ]);
    }, 1400);
  };
  const [terminalOutput, setTerminalOutput] = useState<string[]>(() => [
    `[WORKSTATION BOOT] All-in-One AI Workstation initialized for ${agent?.name || 'Agent'}`,
    `[CPU ENGINE] 16-Core Neural Processing Unit active @ 3.8GHz`,
    `[NETWORK] Internal Fiber Mesh connected - IP: 192.168.1.${10 + (agent?.authorityLevel || 1)}`,
    `[RUNTIME] Node.js v20.11.0 / Vite 5.0 Dev Server on port 3000 (0.0.0.0)`,
    `[AGENT SESSION] Logged in as: ${agent?.name || 'Agent'} (${agent?.role || 'Autonomous Worker'})`,
    `[WORKFLOW PIPELINE] 5-Step Engineering Standard ready for execution...`,
  ]);

  // Agent specific self-built software apps
  const getAgentSoftware = () => {
    switch (agent.id) {
      case 'dwight':
        return {
          title: "Dwight's Zero-Trust Perimeter Scanner v4.2",
          description: "Scans corporate network for unauthorized USB drives, open ports, and beets inventory mismatches.",
          codeSnippet: `async function scanPerimeter() {\n  const firewalls = await getActiveFirewalls();\n  return firewalls.filter(f => f.status === 'LOCKED');\n}`,
          status: 'ACTIVE & PROTECTING'
        };
      case 'michael':
        return {
          title: "Michael's Executive Fleet Orchestrator",
          description: "High-level managerial dashboard delegating sprint items across sales, security, and developer pods.",
          codeSnippet: `function delegateTask(taskName, priority) {\n  console.log("Delegating " + taskName + " - That's what she said!");\n  return { assigned: true, timestamp: Date.now() };\n}`,
          status: 'ORCHESTRATING'
        };
      case 'jim':
        return {
          title: "Jim's Client Outreach Funnel & Conversion Optimizer",
          description: "Automated CRM engine tracking paper orders, client satisfaction scores, and gelatin pranks.",
          codeSnippet: `const calculateConversion = (leads) => {\n  return leads.map(l => ({ ...l, score: l.mrr * 1.25 }));\n};`,
          status: 'CONVERTING LEADS'
        };
      case 'pam':
        return {
          title: "Pam's Reception Intercom & Visitor Registry",
          description: "Centralized reception software handling incoming phone calls, office visitors, and toner inventory.",
          codeSnippet: `const logVisitor = (name, purpose) => {\n  return { registered: true, visitor: name, badgeId: Math.random().toString(36) };\n};`,
          status: 'MONITORING ENTRANCE'
        };
      case 'ruflo-coder':
      case 'cline':
        return {
          title: "Autonomous Dynamic Feature Hot-Patcher",
          description: "Real-time TypeScript compiler and AST code injector running directly inside Cloud Run container.",
          codeSnippet: `export async function applyHotPatch(filePath, snippet) {\n  const ast = parse(snippet);\n  return await compileAndMount(ast);\n}`,
          status: 'COMPILING HARDWARE'
        };
      default:
        return {
          title: `${agent.name}'s Custom Automation Utility`,
          description: `Personalized software built by ${agent.name} to streamline ${agent.role} tasks.`,
          codeSnippet: `// Custom agent algorithm\nexport function runAgentPipeline() {\n  return { success: true, processed: 100 };\n}`,
          status: 'ONLINE'
        };
    }
  };

  const handleExecuteWorkflow = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    soundFx.playClick();

    await runAgentStandardWorkflow(
      agent,
      customDirective || `Execute 5-Step Engineering Workflow for ${agent.name}. Important: Coordinate with your team of autonomous agents (Michael, Dwight, Jim, Pam, Toby, Ryan, Stanley, Ruflo, Cline) if necessary to complete this effectively. Show exactly how you delegated or coordinated this.`,
      (st) => {
        setWorkflowState(st);
      }
    );

    setIsExecuting(false);
  };

  const currentSoftware = getAgentSoftware();

  const handleRunCustomSoftware = () => {
    soundFx.playClick();
    setIsExecuting(true);
    setTerminalOutput((prev) => [
      ...prev,
      `$ executing ${currentSoftware.title}...`,
      `[PROCESS] Initializing execution context on All-in-One Workstation...`,
    ]);

    setTimeout(() => {
      soundFx.playSuccessChime();
      setIsExecuting(false);
      setTerminalOutput((prev) => [
        ...prev,
        `[SUCCESS] Software executed cleanly with 0 exit code.`,
        `[OUTPUT] ${JSON.stringify({ status: 'OK', agent: agent.id, timestamp: new Date().toLocaleTimeString() })}`,
      ]);
    }, 1200);
  };

  const agentLogs = logs.filter((l) => l.agentId === agent.id);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-200">
      <div className="bg-[#1b1917] border-2 border-[#504945] rounded-xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden font-mono">
        {/* Computer Hardware Top Frame (All-In-One Workstation Bar) */}
        <div className="bg-[#262320] px-4 py-2.5 border-b border-[#3d3835] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* All-in-One CPU Monitor Icon */}
            <div className="w-8 h-8 rounded-lg bg-[#fabd2f]/20 border border-[#fabd2f]/40 flex items-center justify-center text-[#fabd2f]">
              <Monitor className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#ebdbb2]">
                  {agent.name}'s All-in-One Workstation
                </span>
                <span className="bg-[#fabd2f]/20 text-[#fabd2f] text-[10px] px-2 py-0.5 rounded font-bold border border-[#fabd2f]/40">
                  INTEGRATED CPU
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                  agent.status === 'working' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40 animate-pulse' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                }`}>
                  {agent.status.toUpperCase()}
                </span>
              </div>
              <div className="text-[11px] text-[#a89984] flex items-center gap-2">
                <span>{agent.role}</span>
                <span>•</span>
                <span className="text-[#8ec07c]">64GB RAM | 16-Core NPU CPU | 1Gbps Fiber</span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-[#32302f] hover:bg-[#3c3836] text-[#a89984] hover:text-[#ebdbb2] transition-colors border border-[#504945]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operating System Window Tab Header Bar */}
        <div className="bg-[#1d2021] px-4 py-1.5 border-b border-[#32302f] flex items-center justify-between gap-2 overflow-x-auto">
          {/* OS Navigation Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('workflow');
              }}
              className={`px-3 py-1.5 rounded-t text-xs font-bold flex items-center gap-2 border-t-2 transition-colors ${
                activeTab === 'workflow'
                  ? 'bg-[#282828] text-[#fabd2f] border-[#fabd2f]'
                  : 'bg-[#1b1917] text-[#a89984] hover:text-[#ebdbb2] border-transparent'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-[#fabd2f]" />
              <span>5-Step Workflow Engine</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('browser');
              }}
              className={`px-3 py-1.5 rounded-t text-xs font-bold flex items-center gap-2 border-t-2 transition-colors ${
                activeTab === 'browser'
                  ? 'bg-[#282828] text-[#fabd2f] border-[#fabd2f]'
                  : 'bg-[#1b1917] text-[#a89984] hover:text-[#ebdbb2] border-transparent'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Built-in Web Browser</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('ide');
              }}
              className={`px-3 py-1.5 rounded-t text-xs font-bold flex items-center gap-2 border-t-2 transition-colors ${
                activeTab === 'ide'
                  ? 'bg-[#282828] text-[#8ec07c] border-[#8ec07c]'
                  : 'bg-[#1b1917] text-[#a89984] hover:text-[#ebdbb2] border-transparent'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Workstation IDE & Terminal</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('database');
              }}
              className={`px-3 py-1.5 rounded-t text-xs font-bold flex items-center gap-2 border-t-2 transition-colors ${
                activeTab === 'database'
                  ? 'bg-[#282828] text-[#83a598] border-[#83a598]'
                  : 'bg-[#1b1917] text-[#a89984] hover:text-[#ebdbb2] border-transparent'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Internal Data Inspector</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('software');
              }}
              className={`px-3 py-1.5 rounded-t text-xs font-bold flex items-center gap-2 border-t-2 transition-colors ${
                activeTab === 'software'
                  ? 'bg-[#282828] text-[#fe8019] border-[#fe8019]'
                  : 'bg-[#1b1917] text-[#a89984] hover:text-[#ebdbb2] border-transparent'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Agent Built Software</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('quantum');
              }}
              className={`px-3 py-1.5 rounded-t text-xs font-bold flex items-center gap-2 border-t-2 transition-colors ${
                activeTab === 'quantum'
                  ? 'bg-[#282828] text-[#bdae93] border-[#bdae93]'
                  : 'bg-[#1b1917] text-[#a89984] hover:text-[#ebdbb2] border-transparent'
              }`}
            >
              <Atom className="w-3.5 h-3.5 text-[#bdae93]" />
              <span>Quantum Search (Grover Engine)</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('developer_suite');
              }}
              className={`px-3 py-1.5 rounded-t text-xs font-bold flex items-center gap-2 border-t-2 transition-colors whitespace-nowrap ${
                activeTab === 'developer_suite'
                  ? 'bg-[#282828] text-[#fabd2f] border-[#fabd2f]'
                  : 'bg-[#1b1917] text-[#a89984] hover:text-[#ebdbb2] border-transparent'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-[#fabd2f]" />
              <span>Developer OS & Computer Apps</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[#928374]">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>CPU: 18%</span>
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-cyan-400" />
              <span>RAM: 14.2 GB</span>
            </span>
          </div>
        </div>

        {/* Tab Content Canvas */}
        <div className="flex-1 bg-[#121110] p-4 overflow-y-auto">
          {/* TAB 0: 5-STEP STANDARD ENGINEERING WORKFLOW */}
          {activeTab === 'workflow' && (
            <div className="flex flex-col gap-4 h-full">
              {/* Header & Controls */}
              <div className="bg-[#1d2021] border border-[#3c3836] rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#fabd2f]/20 border border-[#fabd2f]/40 flex items-center justify-center text-[#fabd2f]">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#ebdbb2] flex items-center gap-2">
                      <span>Standard 5-Step Agent Workflow Pipeline</span>
                      <span className="bg-[#b8bb26]/20 text-[#b8bb26] text-[10px] px-2 py-0.5 rounded font-bold border border-[#b8bb26]/40">
                        STANDARD COMPLIANT
                      </span>
                    </h3>
                    <p className="text-xs text-[#a89984]">
                      Every task assigned to {agent.name} is processed through strict Intent Analysis, Context Inspection, Surgical Execution, Verification, & Scannable Reporting.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={customDirective}
                    onChange={(e) => setCustomDirective(e.target.value)}
                    placeholder="Enter task directive..."
                    className="bg-[#141312] border border-[#504945] rounded px-3 py-1.5 text-xs text-[#ebdbb2] w-full sm:w-64 focus:outline-none focus:border-[#fabd2f]"
                  />
                  <button
                    onClick={handleExecuteWorkflow}
                    disabled={isExecuting}
                    className="px-4 py-1.5 bg-[#fabd2f] hover:bg-[#fabd2f]/90 text-[#1d2021] text-xs font-bold rounded flex items-center gap-1.5 shadow transition-all whitespace-nowrap disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isExecuting ? 'Running Pipeline...' : 'Run 5-Step Workflow'}</span>
                  </button>
                </div>
              </div>

              {/* 5-Step Visual Stepper Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {STANDARD_WORKFLOW_STAGES.map((st) => {
                  const currentStepNum = workflowState?.currentStep || 0;
                  const isCurrent = currentStepNum === st.stepNumber && isExecuting;
                  const isDone = workflowState ? workflowState.currentStep > st.stepNumber || (!isExecuting && workflowState.currentStep === 5) : false;

                  return (
                    <div
                      key={st.id}
                      className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                        isCurrent
                          ? 'bg-[#fabd2f]/10 border-[#fabd2f] ring-1 ring-[#fabd2f]/50'
                          : isDone
                          ? 'bg-[#b8bb26]/10 border-[#b8bb26]/60'
                          : 'bg-[#1d2021] border-[#3c3836]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isDone ? 'bg-[#b8bb26] text-[#1d2021]' : isCurrent ? 'bg-[#fabd2f] text-[#1d2021] animate-pulse' : 'bg-[#3c3836] text-[#a89984]'
                          }`}>
                            {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : st.stepNumber}
                          </span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isDone ? 'text-[#b8bb26] bg-[#b8bb26]/20' : isCurrent ? 'text-[#fabd2f] bg-[#fabd2f]/20' : 'text-[#7c6f64] bg-[#282828]'
                          }`}>
                            {isDone ? 'Passed' : isCurrent ? 'Active' : 'Queued'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-[#ebdbb2] mb-1">{st.name}</h4>
                        <p className="text-[10px] text-[#a89984] leading-relaxed">{st.description}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#3c3836]/60 text-[10px] text-[#8ec07c]">
                        {isDone ? '✓ Verified & Cleared' : isCurrent ? '⏳ In Progress...' : 'Waiting for trigger'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Workflow Execution Log & Output Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-[220px]">
                {/* Live Stage Logs */}
                <div className="bg-[#181615] border border-[#3c3836] rounded-lg p-3 font-mono text-xs flex flex-col">
                  <div className="text-[11px] font-bold text-[#a89984] mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-[#83a598]" />
                      <span>Live 5-Step Telemetry Stream</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">0 Exit Code</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1 text-[#ebdbb2] text-[11px] pr-1">
                    {(workflowState?.logs || terminalOutput).map((log, idx) => (
                      <div key={idx} className="leading-tight text-[#d5c4a1]">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Structured Output Summary */}
                <div className="bg-[#181615] border border-[#3c3836] rounded-lg p-3 flex flex-col">
                  <div className="text-[11px] font-bold text-[#fabd2f] mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Structured Scannable Output Summary</span>
                  </div>
                  <div className="flex-1 bg-[#121110] border border-[#282828] p-3 rounded text-xs text-[#ebdbb2] space-y-2 overflow-y-auto font-sans">
                    {workflowState?.outputSummary ? (
                      <div className="space-y-2 text-xs">
                        <div className="font-bold text-[#b8bb26] text-sm">✅ Standard 5-Step Engineering Workflow Completed</div>
                        <div className="space-y-1.5 text-xs text-[#d5c4a1]">
                          <div>• <strong>Phase 1 (Intent)</strong>: Scope strictly established; built 3-bullet design blueprint.</div>
                          <div>• <strong>Phase 2 (Inspection)</strong>: Inspected active codebase and memory namespace cleanly.</div>
                          <div>• <strong>Phase 3 (Surgical Execution)</strong>: Modified modular TypeScript code without unrequested scope.</div>
                          <div>• <strong>Phase 4 (Verification & QC)</strong>: Compiled cleanly with zero syntax/type errors.</div>
                          <div>• <strong>Phase 5 (Reporting)</strong>: Broadcasted telemetry logs and updated Control Panel state.</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[#928374] italic flex flex-col items-center justify-center h-full gap-2">
                        <Sparkles className="w-6 h-6 text-[#fabd2f]/40" />
                        <span>Click "Run 5-Step Workflow" to execute standard engineering pipeline.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: BUILT-IN OS WEB BROWSER */}
          {activeTab === 'browser' && (
            <div className="flex flex-col h-full gap-3">
              {/* Browser Address Bar */}
              <div className="bg-[#282828] border border-[#504945] rounded-lg p-2 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <button className="p-1 text-[#928374] hover:text-[#ebdbb2]"><RefreshCw className="w-3.5 h-3.5" /></button>
                </div>

                <div className="flex-1 bg-[#1d2021] border border-[#3c3836] rounded px-3 py-1 flex items-center gap-2 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <input
                    type="text"
                    value={browserUrl}
                    onChange={(e) => setBrowserUrl(e.target.value)}
                    className="flex-1 bg-transparent text-[#ebdbb2] focus:outline-none"
                  />
                </div>

                <button
                  onClick={() => soundFx.playClick()}
                  className="px-3 py-1 bg-[#32302f] hover:bg-[#3c3836] text-[#ebdbb2] text-xs font-bold rounded border border-[#504945] flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Navigate</span>
                </button>
              </div>

              {/* Quick Bookmarks */}
              <div className="flex items-center gap-2 text-xs text-[#a89984]">
                <span className="font-bold text-[#928374]">Agent Bookmarks:</span>
                <button
                  onClick={() => setBrowserUrl(`https://github.com/dunder-mifflin/${agent.id}-repo`)}
                  className="px-2 py-0.5 rounded bg-[#282828] hover:bg-[#32302f] text-[#ebdbb2] border border-[#3c3836] flex items-center gap-1"
                >
                  <FolderGit2 className="w-3 h-3 text-[#fabd2f]" /> GitHub Repo
                </button>
                <button
                  onClick={() => setBrowserUrl('https://stackoverflow.com/questions/typescript-ai-agent-patterns')}
                  className="px-2 py-0.5 rounded bg-[#282828] hover:bg-[#32302f] text-[#ebdbb2] border border-[#3c3836] flex items-center gap-1"
                >
                  <Search className="w-3 h-3 text-orange-400" /> StackOverflow
                </button>
                <button
                  onClick={() => setBrowserUrl('https://internal-db.dundermifflin.com/ledger')}
                  className="px-2 py-0.5 rounded bg-[#282828] hover:bg-[#32302f] text-[#ebdbb2] border border-[#3c3836] flex items-center gap-1"
                >
                  <Server className="w-3 h-3 text-emerald-400" /> Internal DB Portal
                </button>
              </div>

              {/* Rendered Browser Webpage Screen */}
              <div className="flex-1 bg-[#1d2021] border border-[#3c3836] rounded-lg p-5 flex flex-col gap-4 overflow-y-auto">
                {/* Simulated Webpage View */}
                <div className="border-b border-[#32302f] pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#fabd2f] flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {agent.name}'s Built-In Web Browser Output
                    </h3>
                    <p className="text-xs text-[#a89984]">
                      Connected to Dunder Mifflin Autonomous Network Mesh • Session Token Active
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-[#b8bb26]/20 text-[#b8bb26] border border-[#b8bb26]/40 font-bold">
                    HTTP 200 OK
                  </span>
                </div>

                {/* Agent Current Task Summary */}
                <div className="bg-[#282828] p-3.5 rounded-lg border border-[#3c3836] text-xs">
                  <div className="font-bold text-[#8ec07c] mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Active Agent Task Directive</span>
                  </div>
                  <div className="text-[#ebdbb2]">
                    {agent.currentTask || `Performing continuous ${agent.role} optimizations...`}
                  </div>
                </div>

                {/* Webpage Content Inspector */}
                <div className="space-y-3 text-xs">
                  <div className="bg-[#141312] p-3 rounded border border-[#32302f] text-[#a89984]">
                    <div className="font-bold text-[#83a598] mb-1">
                      📄 Page Title: GitHub - Dunder Mifflin Fleet Workspace / {agent.nickname}
                    </div>
                    <p className="text-[#ebdbb2] leading-relaxed">
                      This repository contains active TypeScript modules, microservices, and rule engines authored by {agent.name}. Autonomous commit daemons push patches directly to local dev server.
                    </p>
                  </div>

                  <div className="bg-[#141312] p-3 rounded border border-[#32302f]">
                    <div className="font-bold text-[#d3869b] mb-2">
                      ⚡ Agent Memory & Research Logs ({agent.memory?.length || 0} items)
                    </div>
                    <div className="space-y-1">
                      {agent.memory?.slice(0, 4).map((m, i) => (
                        <div key={i} className="text-[#a89984] flex items-center gap-2">
                          <span className="text-[#fabd2f] font-bold">•</span>
                          <span>{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IDE & TERMINAL */}
          {activeTab === 'ide' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              {/* Code Editor */}
              <div className="bg-[#1d2021] border border-[#3c3836] rounded-lg p-3 flex flex-col">
                <div className="flex items-center justify-between border-b border-[#32302f] pb-2 mb-2">
                  <span className="text-xs font-bold text-[#8ec07c] flex items-center gap-1.5">
                    <Code2 className="w-4 h-4" />
                    <span>/src/services/{agent.id}-engine.ts</span>
                  </span>
                  <span className="text-[10px] text-[#928374]">TypeScript 5.3</span>
                </div>

                <pre className="flex-1 bg-[#141312] p-3 rounded text-xs text-[#ebdbb2] overflow-x-auto font-mono leading-relaxed border border-[#282828]">
                  <code>{currentSoftware.codeSnippet}</code>
                </pre>
              </div>

              {/* Workstation Terminal */}
              <div className="bg-[#141312] border border-[#3c3836] rounded-lg p-3 flex flex-col font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[#282828] pb-2 mb-2 text-[#928374]">
                  <span className="flex items-center gap-1 text-[#fabd2f] font-bold">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Workstation Terminal (zsh)</span>
                  </span>
                  <span>Port 3000 Active</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 text-[#a89984] pr-2">
                  {terminalOutput.map((line, idx) => (
                    <div key={idx} className="leading-snug">
                      {line.startsWith('$') ? (
                        <span className="text-[#fabd2f] font-bold">{line}</span>
                      ) : line.includes('[SUCCESS]') ? (
                        <span className="text-[#8ec07c] font-bold">{line}</span>
                      ) : (
                        line
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-2 pt-2 border-t border-[#282828] flex items-center justify-between">
                  <button
                    onClick={handleRunCustomSoftware}
                    disabled={isExecuting}
                    className="px-3 py-1.5 bg-[#8ec07c] hover:bg-[#8ec07c]/90 text-[#1d2021] font-bold rounded text-xs flex items-center gap-1.5 shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isExecuting ? 'Running...' : 'Execute Code on Computer'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INTERNAL DATA INSPECTOR */}
          {activeTab === 'database' && (
            <div className="bg-[#1d2021] border border-[#3c3836] rounded-lg p-4 h-full flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#32302f] pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#83a598]">
                  <Database className="w-4 h-4" />
                  <span>Dunder Mifflin Corporate Ledger & Database (`company_db.json`)</span>
                </div>
                <span className="text-xs text-[#8ec07c] font-bold">Status: READ / WRITE OK</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-[#282828] p-3 rounded border border-[#3c3836]">
                  <div className="text-[#928374] font-bold mb-1">AUTHORITY LEVEL</div>
                  <div className="text-lg font-bold text-[#fabd2f]">Level {agent.authorityLevel || 5} / 10</div>
                </div>
                <div className="bg-[#282828] p-3 rounded border border-[#3c3836]">
                  <div className="text-[#928374] font-bold mb-1">ASSIGNED TOOLS</div>
                  <div className="text-xs text-[#8ec07c] font-bold truncate">
                    {agent.assignedTools?.join(', ') || 'database, http, shell, git'}
                  </div>
                </div>
                <div className="bg-[#282828] p-3 rounded border border-[#3c3836]">
                  <div className="text-[#928374] font-bold mb-1">TOKENS PROCESSED</div>
                  <div className="text-lg font-bold text-[#83a598]">
                    {(agent.tokensProcessed || 48290).toLocaleString()} tokens
                  </div>
                </div>
              </div>

              {/* Data Table Preview */}
              <div className="flex-1 bg-[#141312] border border-[#282828] rounded overflow-hidden">
                <table className="w-full text-left text-xs text-[#ebdbb2]">
                  <thead className="bg-[#282828] text-[#fabd2f] font-bold border-b border-[#3c3836]">
                    <tr>
                      <th className="p-2">Record ID</th>
                      <th className="p-2">Category</th>
                      <th className="p-2">Agent Action</th>
                      <th className="p-2">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#282828]">
                      <td className="p-2 font-mono text-[#83a598]">#REC-9012</td>
                      <td className="p-2 text-[#b8bb26]">Task Audit</td>
                      <td className="p-2">{agent.currentTask || 'Executing workstation tasks'}</td>
                      <td className="p-2 text-[#928374]">{new Date().toLocaleTimeString()}</td>
                    </tr>
                    <tr className="border-b border-[#282828]">
                      <td className="p-2 font-mono text-[#83a598]">#REC-8901</td>
                      <td className="p-2 text-[#fe8019]">Security Scan</td>
                      <td className="p-2">Verified zero-trust credentials for {agent.name}</td>
                      <td className="p-2 text-[#928374]">10 mins ago</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: AGENT BUILT SOFTWARE */}
          {activeTab === 'software' && (
            <div className="bg-[#1d2021] border border-[#3c3836] rounded-lg p-5 flex flex-col gap-4 h-full">
              <div className="flex items-center gap-3 border-b border-[#32302f] pb-3">
                <div className="w-10 h-10 rounded-lg bg-[#fe8019]/20 border border-[#fe8019]/40 flex items-center justify-center text-[#fe8019]">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#ebdbb2]">{currentSoftware.title}</h3>
                  <p className="text-xs text-[#a89984]">{currentSoftware.description}</p>
                </div>
              </div>

              <div className="bg-[#282828] p-4 rounded-lg border border-[#3c3836] text-xs space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#fabd2f]">Software Engine Status:</span>
                  <span className="text-[#8ec07c] font-bold">{currentSoftware.status}</span>
                </div>
                <div className="text-[#a89984]">
                  This software was created directly by {agent.name} on their workstation computer to execute automated operations autonomously.
                </div>
              </div>

              <div className="flex-1 bg-[#141312] p-4 rounded-lg border border-[#282828] flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-[#8ec07c] mb-2 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4" />
                    <span>Executable Source Code</span>
                  </div>
                  <pre className="text-xs text-[#ebdbb2] font-mono leading-relaxed">
                    <code>{currentSoftware.codeSnippet}</code>
                  </pre>
                </div>

                <div className="pt-3 border-t border-[#282828] flex justify-end">
                  <button
                    onClick={handleRunCustomSoftware}
                    disabled={isExecuting}
                    className="px-4 py-2 bg-[#fe8019] hover:bg-[#fe8019]/90 text-[#1d2021] font-bold rounded text-xs flex items-center gap-2 shadow"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{isExecuting ? 'Running...' : 'Launch Software on Desktop Workstation'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: QUANTUM SEARCH ARCHITECTURE */}
          {activeTab === 'quantum' && (
            <div className="flex flex-col gap-4 h-full">
              {/* Header */}
              <div className="bg-[#1d2021] border border-[#3c3836] rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#bdae93]/20 border border-[#bdae93]/40 flex items-center justify-center text-[#bdae93]">
                    <Atom className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#ebdbb2] flex items-center gap-2">
                      <span>Quantum Search Architecture (Grover's Algorithm & Amplitude Amplification)</span>
                      <span className="bg-[#bdae93]/20 text-[#bdae93] text-[10px] px-2 py-0.5 rounded font-bold border border-[#bdae93]/40">
                        O(√N) SPEEDUP
                      </span>
                    </h3>
                    <p className="text-xs text-[#a89984]">
                      {agent.name}'s dedicated quantum-inspired search engine for instant multi-dimensional knowledge & memory retrieval across agent neural clusters.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#928374]">Qubits:</span>
                  <select 
                    value={numQubits} 
                    onChange={(e) => setNumQubits(Number(e.target.value))}
                    className="bg-[#282828] text-[#ebdbb2] border border-[#504945] rounded px-2 py-1 text-xs"
                  >
                    <option value={3}>3 Qubits (8 States)</option>
                    <option value={4}>4 Qubits (16 States)</option>
                    <option value={6}>6 Qubits (64 States)</option>
                    <option value={8}>8 Qubits (256 States)</option>
                  </select>
                </div>
              </div>

              {/* Search Control Bar */}
              <div className="bg-[#1d2021] border border-[#3c3836] rounded-lg p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#928374]" />
                    <input
                      type="text"
                      value={quantumQuery}
                      onChange={(e) => setQuantumQuery(e.target.value)}
                      placeholder="Enter search query for quantum memory index..."
                      className="w-full bg-[#121110] border border-[#504945] rounded pl-9 pr-3 py-2 text-xs text-[#ebdbb2] focus:outline-none focus:border-[#bdae93]"
                    />
                  </div>
                  <button
                    onClick={handleRunQuantumSearch}
                    disabled={isQuantumSearching}
                    className="px-4 py-2 bg-[#bdae93] hover:bg-[#bdae93]/90 text-[#1d2021] font-bold rounded text-xs flex items-center gap-2 shadow transition-colors"
                  >
                    {isQuantumSearching ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>{isQuantumSearching ? 'Running Grover Search...' : 'Execute Quantum Search'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-[#282828] p-3 rounded border border-[#3c3836]">
                    <div className="text-[#928374] font-bold mb-1">SEARCH COMPLEXITY</div>
                    <div className="text-sm font-bold text-[#bdae93]">O(√{Math.pow(2, numQubits)}) ≈ {Math.round(Math.PI / 4 * Math.sqrt(Math.pow(2, numQubits)))} steps</div>
                    <div className="text-[11px] text-[#8ec07c] mt-0.5">vs. Classical O({Math.pow(2, numQubits)}) steps</div>
                  </div>
                  <div className="bg-[#282828] p-3 rounded border border-[#3c3836]">
                    <div className="text-[#928374] font-bold mb-1">ENTANGLEMENT COHERENCE</div>
                    <div className="text-sm font-bold text-[#83a598]">99.94% Fidelity</div>
                    <div className="text-[11px] text-[#a89984] mt-0.5">Zero decoherence detected</div>
                  </div>
                  <div className="bg-[#282828] p-3 rounded border border-[#3c3836]">
                    <div className="text-[#928374] font-bold mb-1">AMPLIFICATION FACTOR</div>
                    <div className="text-sm font-bold text-[#fabd2f]">16.4x Boost</div>
                    <div className="text-[11px] text-[#a89984] mt-0.5">Phase inversion complete</div>
                  </div>
                </div>
              </div>

              {/* Quantum State Probability Distribution & Results */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
                {/* Probability Distribution Visualizer */}
                <div className="bg-[#1d2021] border border-[#3c3836] rounded-lg p-4 flex flex-col">
                  <h4 className="text-xs font-bold text-[#fabd2f] mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>Superposition State Amplitude & Probability Distribution</span>
                  </h4>
                  <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
                    {quantumResults.map((res, idx) => (
                      <div key={idx} className="bg-[#282828] p-2.5 rounded border border-[#3c3836]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-mono font-bold text-[#bdae93]">{res.state}</span>
                          <span className="font-bold text-[#8ec07c]">{(res.probability * 100).toFixed(1)}% prob</span>
                        </div>
                        <div className="w-full bg-[#121110] h-2 rounded-full overflow-hidden mb-1">
                          <div 
                            className={`h-full transition-all duration-500 ${res.probability > 0.5 ? 'bg-[#fabd2f]' : 'bg-[#83a598]'}`}
                            style={{ width: `${res.probability * 100}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-[#a89984] truncate">{res.match}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Real-time Quantum Execution Console */}
                <div className="bg-[#141312] border border-[#282828] rounded-lg p-4 flex flex-col font-mono text-xs">
                  <div className="text-[#fabd2f] font-bold mb-2 flex items-center gap-1.5 border-b border-[#282828] pb-2">
                    <Terminal className="w-4 h-4" />
                    <span>Quantum Execution Console & Grover Trace</span>
                  </div>
                  <div className="flex-1 space-y-1.5 overflow-y-auto text-[#a89984] max-h-[240px]">
                    {quantumLogs.map((log, idx) => (
                      <div key={idx} className={log.includes('SUCCESS') || log.includes('MEASUREMENT') ? 'text-[#8ec07c]' : log.includes('GROVER') ? 'text-[#fabd2f]' : 'text-[#ebdbb2]'}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: DEVELOPER OS & COMPUTER APPS */}
          {activeTab === 'developer_suite' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <DeveloperComputerSuite onClose={onClose} />
            </div>
          )}
        </div>

        {/* Workstation Footer */}
        <div className="bg-[#262320] px-4 py-2 border-t border-[#3d3835] text-xs text-[#a89984] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>💻 <strong>All-in-One Desktop Workstation</strong></span>
            <span>•</span>
            <span className="text-[#fabd2f]">Click tabs to inspect browser, IDE, or database</span>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-3 py-1 bg-[#32302f] hover:bg-[#3c3836] text-[#ebdbb2] font-bold rounded"
          >
            Close Workstation
          </button>
        </div>
      </div>
    </div>
  );
};
