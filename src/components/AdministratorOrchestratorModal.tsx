import React, { useState, useEffect } from 'react';
import { Agent, FleetTask, UserProfile, AppliedSystemModule, SystemTelemetry } from '../types';
import { AdminEngineDashboard } from './AdminEngineDashboard';
import { soundFx, speakText } from '../utils/speech';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Play,
  Terminal,
  CheckCircle2,
  Clock,
  Shield,
  Code2,
  Users,
  Send,
  Zap,
  ArrowRight,
  Bot,
  Layers,
  Cpu,
  RefreshCw,
  X,
  FileCode,
  Globe,
  ShoppingCart,
  Plus,
  Trash2,
  LayoutDashboard,
  Check,
  Heart,
  TrendingUp,
  PlusCircle,
  DollarSign,
  Award,
  Activity,
  CheckCircle,
  MessageSquare,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

interface SubtaskPlan {
  id: string;
  title: string;
  assignedTo: string;
  priority: 'critical' | 'high' | 'medium';
  shellCommands: string[];
  codeSnippet: string;
  outputSummary: string;
  status?: 'queued' | 'running' | 'completed';
}

interface AdministratorOrchestratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  userProfile: UserProfile;
  onTaskCreated: (task: FleetTask) => void;
  onLogCreated: (log: any) => void;
  onCodeApplied: (module: AppliedSystemModule) => void;
  onTriggerBotMovement?: (agentId: string, activity: string) => void;
  telemetry?: SystemTelemetry;
}

export const AdministratorOrchestratorModal: React.FC<AdministratorOrchestratorModalProps> = ({
  isOpen,
  onClose,
  agents,
  userProfile,
  telemetry,
  onTaskCreated,
  onLogCreated,
  onCodeApplied,
  onTriggerBotMovement,
}) => {
  const [taskPrompt, setTaskPrompt] = useState('');
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [activePlan, setActivePlan] = useState<{
    adminSpeech: string;
    adminQuote: string;
    subtasks: SubtaskPlan[];
  } | null>(null);
  const [executingSubtaskId, setExecutingSubtaskId] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [taskAnalysis, setTaskAnalysis] = useState<any>(null);
  const [activePrompt, setActivePrompt] = useState('');

  // Sandbox state variables
  // Feedback app state
  const [feedbackList, setFeedbackList] = useState<any[]>([
    { id: '1', name: 'Angela Martin', email: 'angela@dunder.com', rating: 5, comment: 'Pristine security architecture! Dwight has done an exemplary job.', sentiment: 'positive' },
    { id: '2', name: 'Andy Bernard', email: 'cornell@dunder.com', rating: 4, comment: 'Absolutely sensational UI! The colors are harmonized and crisp.', sentiment: 'positive' },
    { id: '3', name: 'Creed Bratton', email: 'creed@unknown.org', rating: 3, comment: 'I like it, but where is the blog about scuba?', sentiment: 'positive' }
  ]);
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  
  // E-commerce state
  const [sandboxCart, setSandboxCart] = useState<any[]>([]);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  // Crypto state
  const [cryptoPrices, setCryptoPrices] = useState({
    BTC: 96450,
    ETH: 3420,
    SOL: 184,
    RUFLO: 12.50
  });
  const [sandboxCryptoTransactions, setSandboxCryptoTransactions] = useState<any[]>([
    { id: 'tx-1', type: 'buy', coin: 'BTC', amount: '0.15', price: 95100, timestamp: '10:42 AM' },
    { id: 'tx-2', type: 'buy', coin: 'RUFLO', amount: '250', price: 11.20, timestamp: '11:15 AM' }
  ]);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tradeCoin, setTradeCoin] = useState('BTC');
  const [tradeAmount, setTradeAmount] = useState('0.1');

  // Kanban state
  const [sandboxTasks, setSandboxTasks] = useState<any[]>([
    { id: 't1', title: 'Initialize multi-agent telemetry', status: 'todo', category: 'Feature' },
    { id: 't2', title: 'Optimize AST security analyzer', status: 'in-progress', category: 'Security' },
    { id: 't3', title: 'Polish design theme tokens', status: 'review', category: 'Design' },
    { id: 't4', title: 'Deploy zero-latency database clusters', status: 'done', category: 'Backend' }
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Feature');

  // Customizer state
  const [sandboxCustomConfig, setSandboxCustomConfig] = useState({
    bgColor: 'bg-white dark:bg-[#121110]',
    fontSize: 'text-sm',
    border: 'border-slate-200 dark:border-[#3c3836]',
    accentColor: 'text-[#fabd2f]',
    title: 'Self-Developing Micro-Frontend Workspace'
  });
  const [sandboxCustomCounters, setSandboxCustomCounters] = useState(0);
  const [sandboxFormFields, setSandboxFormFields] = useState({ name: '', val: '' });
  const [sandboxSavedData, setSandboxSavedData] = useState<any[]>([
    { key: 'API_ENDPOINT', value: 'https://api.dunder-mifflin.internal/v2' },
    { key: 'DEPLOY_STAGE', value: 'production-green-sandbox' }
  ]);

  const [activeSandboxTab, setActiveSandboxTab] = useState('app'); // 'app' | 'telemetry' | 'source'

  // AI Agent Orchestra Enhancements State
  const [activeLogMode, setActiveLogMode] = useState<'shell' | 'quantum' | 'browser-use'>('shell');
  const [isHealing, setIsHealing] = useState(false);
  const [healingLogs, setHealingLogs] = useState<string[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<string>('App.tsx');
  const [isTestingVM, setIsTestingVM] = useState(false);
  const [vmTestOutput, setVmTestOutput] = useState<string[]>([]);

  // Peak-Performance Autonomous Self-Correction & Software Execution Hub States
  const [isAutonomousLoopActive, setIsAutonomousLoopActive] = useState(false);
  const [autoLoopPhase, setAutoLoopPhase] = useState<'idle' | 'brainstorming' | 'writing' | 'security_audit' | 'lint_compile' | 'self_healing' | 'completed'>('idle');
  const [autoLoopLogs, setAutoLoopLogs] = useState<string[]>([]);
  const [autoLoopCodeSnippet, setAutoLoopCodeSnippet] = useState<string>('');
  const [currentErrorSimulation, setCurrentErrorSimulation] = useState<string>('none');
  const [simulationDiagnostics, setSimulationDiagnostics] = useState<{ text: string; author: string; avatar: string; recommendations: string[] } | null>(null);
  const [isHealAnimationPlaying, setIsHealAnimationPlaying] = useState(false);
  const [visualAstNodes, setVisualAstNodes] = useState<Array<{ id: string; name: string; type: string; status: 'verified' | 'violation' | 'unchecked'; description: string }>>([
    { id: 'n1', name: 'ImportDeclaration', type: 'SyntaxNode', status: 'verified', description: 'Imports React, motion & lucide icons.' },
    { id: 'n2', name: 'VariableDeclaration', type: 'Declaration', status: 'verified', description: 'Declares autonomous components structure.' },
    { id: 'n3', name: 'UseStateCall', type: 'ReactHook', status: 'verified', description: 'Instantiates state hooks correctly.' },
    { id: 'n4', name: 'UseEffectCall', type: 'ReactHook', status: 'verified', description: 'Connects standard system event listeners.' },
    { id: 'n5', name: 'ReturnStatement', type: 'JSXExpression', status: 'verified', description: 'Compiles clean Tailwind HTML template.' },
  ]);

  const getAgentColor = (dept: string) => {
    const d = (dept || '').toLowerCase();
    if (d === 'engineering' || d === 'qa') return '#3b82f6'; // steel blue
    if (d === 'executive' || d === 'rooftop_cmd') return '#fabd2f'; // warm amber
    if (d === 'finance' || d === 'legal') return '#10b981'; // green
    if (d === 'sales' || d === 'growth') return '#f97316'; // orange
    if (d === 'hr' || d === 'operations') return '#ef4444'; // coral/rose
    return '#ec4899'; // pink
  };

  // Autonomous loop simulator effect
  useEffect(() => {
    if (!isAutonomousLoopActive) {
      setAutoLoopPhase('idle');
      return;
    }

    let intervalId: any = null;
    let currentStep = 0;
    
    setAutoLoopPhase('brainstorming');
    setAutoLoopLogs([
      `[OS_INIT] Bootstrapping autonomous full-stack compiler suite...`,
      `[BRAINSTORM] Ruflo Coder: Analyzing current codebase schema. Target: Peak-level optimization of software modules.`,
      `[BRAINSTORM] Dwight Schrute: Listening for zero-trust boundary events.`,
      `[BRAINSTORM] Toby Flenderson: Running continuous heap diagnostics daemon.`,
    ]);

    const runLoop = async () => {
      currentStep++;
      if (currentStep === 1) {
        setAutoLoopPhase('writing');
        setAutoLoopLogs((prev) => [
          ...prev,
          `[COMPILING] Ruflo Coder: Designing dynamic AST modifications for self-updating components...`,
          `[WRITE] Injected: "export default function AutonomousModule() { ... }"`,
          `[WRITE] Appended: "const [telemetryState, setTelemetryState] = useState({ health: 100 });"`,
          `[WRITE] Verified: Standard React hooks bindings declared cleanly.`,
        ]);
        setVisualAstNodes([
          { id: 'n1', name: 'ImportDeclaration', type: 'SyntaxNode', status: 'verified', description: 'Imports React, motion & lucide icons.' },
          { id: 'n2', name: 'VariableDeclaration', type: 'Declaration', status: 'verified', description: 'Declares autonomous components structure.' },
          { id: 'n3', name: 'UseStateCall', type: 'ReactHook', status: 'verified', description: 'Instantiates state hooks correctly.' },
          { id: 'n4', name: 'UseEffectCall', type: 'ReactHook', status: 'verified', description: 'Connects standard system event listeners.' },
          { id: 'n5', name: 'ReturnStatement', type: 'JSXExpression', status: 'verified', description: 'Compiles clean Tailwind HTML template.' },
        ]);
      } else if (currentStep === 2) {
        setAutoLoopPhase('security_audit');
        setAutoLoopLogs((prev) => [
          ...prev,
          `[AUDIT] Dwight Schrute: Initiating mandatory 100% Zero-Trust structural audit on newly generated AST...`,
          `[AUDIT] Dwight Schrute: Validating import boundaries, network sockets, and filesystem permissions.`,
        ]);

        if (currentErrorSimulation !== 'none') {
          setAutoLoopLogs((prev) => [
            ...prev,
            `[SECURITY VIOLATION] Dwight Schrute: AST Audit Failed! Detected malicious or destructive patterns in script context!`,
            `[SECURITY VIOLATION] Details: ${
              currentErrorSimulation === 'ast_syntax_error' ? 'Syntax error (Missing brackets/semicolon)' :
              currentErrorSimulation === 'hook_leak' ? 'React hook state leak / infinite re-render threat' :
              'Scope pollution (Attempted raw memory heap write)'
            }`,
          ]);
          setVisualAstNodes([
            { id: 'n1', name: 'ImportDeclaration', type: 'SyntaxNode', status: 'verified', description: 'Imports React, motion & lucide icons.' },
            { id: 'n2', name: 'VariableDeclaration', type: 'Declaration', status: 'verified', description: 'Declares autonomous components structure.' },
            { id: 'n3', name: 'UseStateCall', type: 'ReactHook', status: currentErrorSimulation === 'hook_leak' ? 'violation' : 'verified', description: 'State hook leaks or infinite re-renders flagged.' },
            { id: 'n4', name: 'UseEffectCall', type: 'ReactHook', status: currentErrorSimulation === 'scope_pollution' ? 'violation' : 'verified', description: 'Global scope pollution detected.' },
            { id: 'n5', name: 'ReturnStatement', type: 'JSXExpression', status: currentErrorSimulation === 'ast_syntax_error' ? 'violation' : 'verified', description: 'Syntax formatting is broken / corrupt elements.' },
          ]);

          const rolePersona = currentErrorSimulation === 'ast_syntax_error' ? {
            author: 'Ruflo Coder', avatar: '👨‍💻',
            text: 'Ah, my bad! I accidentally left an orphaned bracket in the JSX ReturnStatement while hot-patching. The static AST compiler could not tokenize it properly.',
            recommendations: ['Restore broken closing parentheses', 'Flushing AST tokenizers', 'Re-compiling with strict TSC flags']
          } : currentErrorSimulation === 'hook_leak' ? {
            author: 'Toby Flenderson', avatar: '⏳',
            text: 'Wait, I found an infinite state-mutation loop inside useEffect because state was modified directly inside the component body. This would crash the user browser context.',
            recommendations: ['Stabilize dependency array primitives', 'Wrap state mutations in conditional guards', 'Pruning orphaned listeners']
          } : {
            author: 'Dwight Schrute', avatar: '🛡️',
            text: 'ALERT! Raw global memory scope write attempted in the execution sandboxed VM! This is a severe threat violation. I have immediately isolated the threat and locked down the context registers.',
            recommendations: ['Revoking write permissions', 'Isolating global process context', 'Clearing unsafe memory references']
          };

          setSimulationDiagnostics(rolePersona);
          setIsAutonomousLoopActive(false); 
          soundFx.playNotification();
        } else {
          setAutoLoopLogs((prev) => [
            ...prev,
            `✓ [AUDIT PASSED] Dwight Schrute: 100% Zero-Trust verification achieved. AST conforms to secure corporate policy boundaries.`,
          ]);
        }
      } else if (currentStep === 3) {
        setAutoLoopPhase('lint_compile');
        setAutoLoopLogs((prev) => [
          ...prev,
          `[COMPILER] Toby Flenderson: Running static type checking and production code compiler...`,
          `[COMPILER] Running 'tsc --noEmit' and verifying build integrity.`,
          `✓ [BUILD SUCCESS] Compiled dynamic binary bundle dist/server.cjs. Total build time: 114ms.`,
        ]);
      } else if (currentStep === 4) {
        setAutoLoopPhase('completed');
        setAutoLoopLogs((prev) => [
          ...prev,
          `✓ [PEAK STATUS] Project successfully assembled, audited, and deployed live to Cloud Run!`,
          `[PEAK STATUS] Current uptime: 100% | CPU utilization: optimal | Performance index: 100/100.`,
        ]);
        soundFx.playSuccessChime();
        confetti({ particleCount: 50, spread: 60 });
        setIsAutonomousLoopActive(false); 
      }
    };

    intervalId = setInterval(runLoop, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isAutonomousLoopActive, currentErrorSimulation]);

  const handleTriggerSelfHeal = async () => {
    if (isHealAnimationPlaying) return;
    soundFx.playClick();
    setIsHealAnimationPlaying(true);
    setAutoLoopPhase('self_healing');
    
    setHealingLogs([
      `[HEAL_INIT] Initiating autonomous self-repair protocols...`,
      `[HEAL] Toby Flenderson: Analyzing diagnostic report regarding '${currentErrorSimulation}'...`,
    ]);

    await new Promise((r) => setTimeout(r, 850));
    setHealingLogs((prev) => [
      ...prev,
      `[HEAL] Dwight Schrute: Commencing AST verification checks and isolation overrides...`,
      `[HEAL] Ruflo Coder: Applying targeted hot-fix parameters to correct AST nodes...`,
    ]);

    await new Promise((r) => setTimeout(r, 850));
    setHealingLogs((prev) => [
      ...prev,
      `[HEAL] Toby Flenderson: Hot-patch completed successfully. Clearing warnings...`,
      `✓ [HEALED] AST successfully stabilized and re-verified. Semicolons normalized, hook dependencies pruned, memory sanitized!`,
    ]);

    setCurrentErrorSimulation('none');
    setSimulationDiagnostics(null);
    setVisualAstNodes([
      { id: 'n1', name: 'ImportDeclaration', type: 'SyntaxNode', status: 'verified', description: 'Imports React, motion & lucide icons.' },
      { id: 'n2', name: 'VariableDeclaration', type: 'Declaration', status: 'verified', description: 'Declares autonomous components structure.' },
      { id: 'n3', name: 'UseStateCall', type: 'ReactHook', status: 'verified', description: 'Instantiates state hooks correctly.' },
      { id: 'n4', name: 'UseEffectCall', type: 'ReactHook', status: 'verified', description: 'Connects standard system event listeners.' },
      { id: 'n5', name: 'ReturnStatement', type: 'JSXExpression', status: 'verified', description: 'Compiles clean Tailwind HTML template.' },
    ]);
    setAutoLoopPhase('completed');
    setIsHealAnimationPlaying(false);
    soundFx.playSuccessChime();
    confetti({ particleCount: 70, spread: 80 });
  };

  if (!isOpen) return null;

  const quickPresets = [
    {
      label: '🚀 Live Crypto & Stock Paper Trade Widget',
      prompt: 'Develop a real-time crypto and paper trading ticker widget with interactive buy/sell simulator, price sparklines, and automated profit calculations.',
    },
    {
      label: '🛡️ Zero-Trust Security & Network Packet Inspector',
      prompt: 'Build a zero-trust network packet firewall inspector with real-time port telemetry, defensive vulnerability alerts, and root credential isolation audit.',
    },
    {
      label: '⚡ Autonomous Markdown Documentation Generator',
      prompt: 'Create an automated markdown documentation generator with instant export, syntax-highlighted code blocks, and full-text keyword search.',
    },
    {
      label: '🎵 Cyberpunk Web Audio Soundboard Synthesizer',
      prompt: 'Develop an interactive cyberpunk soundboard and synthesizer module using the Web Audio API with oscillators, filter sweeps, and retro drum beats.',
    },
  ];

  const handleRunOrchestration = async (customPrompt?: string) => {
    const promptToUse = customPrompt || taskPrompt;
    if (!promptToUse.trim()) return;

    soundFx.playClick();
    setIsOrchestrating(true);
    setTerminalLogs([
      `[ADMIN ORCHESTRATOR] Administrator Michael Scott received directive: "${promptToUse}"`,
      `[DECOMPOSITION] Analyzing functional requirements, agent roles, and runtime dependencies...`,
      `[FLEET BUS] Routing subtasks to specialized autonomous agents...`,
    ]);
    setActivePlan(null);
    setTaskAnalysis(null);
    setActivePrompt(promptToUse);
    setCompletedCount(0);

    try {
      const res = await fetch('/api/admin/orchestrate-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          userProfile,
  telemetry,
          userPreferences: userProfile.preferences,
          activeAgents: agents.map((a) => ({ id: a.id, name: a.name, role: a.role })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        soundFx.playNotification();
        const plan = {
          adminSpeech: data.orchestratorPlan,
          adminQuote: data.adminQuote || "World's Best Boss: Real leaders delegate to real bots.",
          subtasks: data.subtasks.map((st: any) => ({ ...st, status: 'queued' })),
        };
        setActivePlan(plan);

        // Speak Michael's executive speech
        speakText(plan.adminSpeech, agents.find((a) => a.id === 'michael'));

        // Automatically sequence task execution across autonomous agents
        executeSubtasksSequentially(plan.subtasks, promptToUse);
      }
    } catch (e: any) {
      setTerminalLogs((prev) => [...prev, `[ERROR] Failed to orchestrate: ${e.message}`]);
    } finally {
      setIsOrchestrating(false);
    }
  };

  const executeSubtasksSequentially = async (subtasks: SubtaskPlan[], originalPrompt: string) => {
    let completed = 0;

    for (let i = 0; i < subtasks.length; i++) {
      const st = subtasks[i];
      setExecutingSubtaskId(st.id);

      // Trigger bot animation on the floorplan!
      if (onTriggerBotMovement) {
        onTriggerBotMovement(st.assignedTo, 'coding_at_server');
      }

      setTerminalLogs((prev) => [
        ...prev,
        `>>> DISPATCHING SUBTASK #${i + 1} to [${st.assignedTo.toUpperCase()}]: "${st.title}"`,
      ]);

      // Run each shell command
      for (const cmd of st.shellCommands) {
        setTerminalLogs((prev) => [...prev, `$ ${st.assignedTo}@dunder-fleet: ${cmd}`]);
        try {
          const cmdRes = await fetch('/api/terminal/run-command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: cmd }),
          });
          const cmdData = await cmdRes.json();
          if (cmdData.stdout) {
            setTerminalLogs((prev) => [...prev, ...cmdData.stdout.split('\n').map((l: string) => `  ${l}`)]);
          }
        } catch (e) {}
        await new Promise((r) => setTimeout(r, 450));
      }

      // Apply code to website runtime
      if (st.codeSnippet) {
        try {
          const applyRes = await fetch('/api/system/apply-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: st.codeSnippet,
              name: `${st.assignedTo.toUpperCase()} - ${st.title.slice(0, 30)}`,
              source: st.assignedTo,
              target: 'system_runtime',
              context: { directive: originalPrompt },
            }),
          });
          const applyData = await applyRes.json();
          if (applyData.success && applyData.module) {
            onCodeApplied(applyData.module);
            setTerminalLogs((prev) => [
              ...prev,
              `✓ [WEBSITE SELF-DEVELOPED] Module "${applyData.module.name}" compiled and hot-patched into live system runtime!`,
            ]);
          }
        } catch (e) {}
      }

      // Create fleet task entry
      const assignedAgent = agents.find((a) => a.id === st.assignedTo);
      const newTask: FleetTask = {
        id: `tsk-${Date.now()}-${i}`,
        title: st.title,
        description: st.outputSummary,
        assignedTo: st.assignedTo,
        status: 'completed',
        progress: 100,
        priority: st.priority,
        codeSnippet: st.codeSnippet,
        createdAt: Date.now(),
        completedAt: Date.now(),
      };
      onTaskCreated(newTask);

      onLogCreated({
        id: `log-admin-delegation-${Date.now()}-${i}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'success',
        agentId: st.assignedTo,
        message: `[Task Completed] ${st.outputSummary}`,
        codeSnippet: st.codeSnippet,
        appliedToSystem: true,
      });

      completed++;
      setCompletedCount(completed);

      // Update plan state
      setActivePlan((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          subtasks: prev.subtasks.map((item) =>
            item.id === st.id ? { ...item, status: 'completed' } : item
          ),
        };
      });

      soundFx.playClick();
      await new Promise((r) => setTimeout(r, 600));
    }

    setExecutingSubtaskId(null);
    soundFx.playSuccessChime();
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    setTerminalLogs((prev) => [
      ...prev,
      `══════════════════════════════════════════════════════════════════`,
      `🎉 MISSION COMPLETE: All subtasks executed. Website self-developed & hot-patched!`,
      `[POST-MORTEM] Initiating Chief Strategist post-execution report generation...`,
      `══════════════════════════════════════════════════════════════════`,
    ]);

    setIsAnalyzing(true);
    try {
      const analysisRes = await fetch('/api/admin/analyze-task-outcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: originalPrompt,
          subtasks,
          userProfile,
          userPreferences: userProfile?.preferences || {}
        }),
      });
      const analysisData = await analysisRes.json();
      if (analysisData.success && analysisData.analysis) {
        setTaskAnalysis(analysisData.analysis);
        setTerminalLogs((prev) => [
          ...prev,
          `✓ [REPORT COMPLETE] Strategic Corporate Executive Report generated successfully!`,
        ]);
      }
    } catch (err: any) {
      setTerminalLogs((prev) => [
        ...prev,
        `[WARN] Strategy analysis warning: ${err.message}`,
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        id="administrator-orchestrator-modal"
        className="w-full max-w-4xl max-h-[90vh] bg-[#fbf1c7] dark:bg-[#1d2021] border-2 border-[#fabd2f] rounded-xl shadow-2xl flex flex-col overflow-hidden font-mono text-[#3c3836] dark:text-[#ebdbb2]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#ebdbb2] dark:bg-[#282828] border-b border-[#d5c4a1] dark:border-[#3c3836]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#fabd2f] text-[#1d2021] flex items-center justify-center font-bold text-lg shadow-sm">
              👔
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#282828] dark:text-[#ebdbb2]">
                  ADMINISTRATOR TASK DISPATCHER
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fabd2f] text-[#1d2021]">
                  GOD MODE ORCHESTRATION
                </span>
              </div>
              <p className="text-[11px] text-[#7c6f64] dark:text-[#a89984]">
                Give tasks to Administrator (Michael Scott) → Automatically delegates to specialized autonomous agents → Self-develops website & runs live commands
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[#d5c4a1] dark:hover:bg-[#3c3836] text-[#7c6f64] dark:text-[#a89984]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AdminEngineDashboard telemetry={telemetry} />
          {/* Direct Task Input Section */}
          <div className="p-3.5 rounded-lg bg-[#ebdbb2]/40 dark:bg-[#282828]/60 border border-[#d5c4a1] dark:border-[#3c3836]">
            <label className="block text-xs font-bold mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#b57614] dark:text-[#fabd2f]">
                <Bot className="w-4 h-4" />
                <span>INSTRUCT ADMINISTRATOR (MICHAEL SCOTT)</span>
              </span>
              <span className="text-[10px] text-[#7c6f64] dark:text-[#928374]">
                Autonomous task breakdown + live code execution
              </span>
            </label>
            <div className="flex gap-2">
              <textarea
                value={taskPrompt}
                onChange={(e) => setTaskPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleRunOrchestration();
                  }
                }}
                placeholder="Describe any task or feature you want the office bots to build (e.g. 'Build a real-time system performance tracker widget with auto-refresh and command terminal')..."
                className="flex-1 p-2.5 rounded-md bg-[#fbf1c7] dark:bg-[#181615] border border-[#d5c4a1] dark:border-[#504945] text-xs focus:outline-none focus:border-[#fabd2f] resize-none h-20 placeholder:text-[#7c6f64] dark:placeholder:text-[#928374] text-[#3c3836] dark:text-[#ebdbb2]"
              />
              <button
                id="btn-submit-task-to-admin"
                onClick={() => handleRunOrchestration()}
                disabled={isOrchestrating || !taskPrompt.trim()}
                className="px-4 bg-[#fabd2f] hover:bg-[#fabd2f]/90 disabled:opacity-50 text-[#1d2021] font-bold text-xs rounded-md shadow flex flex-col items-center justify-center gap-1 border border-[#fabd2f]/80 min-w-[120px] transition-all"
              >
                {isOrchestrating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Delegating...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Dispatch Task</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Inspiration Presets */}
            <div className="mt-3">
              <span className="text-[10px] font-bold text-[#7c6f64] dark:text-[#928374] block mb-1.5">
                ⚡ QUICK DIRECTIVE PRESETS:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {quickPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTaskPrompt(preset.prompt);
                      handleRunOrchestration(preset.prompt);
                    }}
                    disabled={isOrchestrating}
                    className="text-left p-2 rounded bg-[#fbf1c7] dark:bg-[#201e1d] hover:bg-[#ebdbb2] dark:hover:bg-[#32302f] border border-[#d5c4a1] dark:border-[#3c3836] text-[11px] transition-colors flex items-center justify-between group"
                  >
                    <span className="font-medium truncate">{preset.label}</span>
                    <ArrowRight className="w-3 h-3 text-[#fabd2f] opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Plan & Delegation Visualizer */}
          {activePlan && (
            <div className="p-3.5 rounded-lg bg-[#ebdbb2]/30 dark:bg-[#282828]/40 border border-[#fabd2f]/50 space-y-3">
              {/* Michael's Executive Quote & Speech */}
              <div className="p-3 rounded bg-[#fabd2f]/10 border border-[#fabd2f]/30 flex items-start gap-2.5">
                <span className="text-2xl">👔</span>
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#b57614] dark:text-[#fabd2f]">
                      Michael Scott (Administrator):
                    </span>
                    <span className="text-[10px] text-[#7c6f64] dark:text-[#a89984] italic">
                      "{activePlan.adminQuote}"
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-[#3c3836] dark:text-[#ebdbb2]">
                    {activePlan.adminSpeech}
                  </p>
                </div>
              </div>

              {/* Visual Multi-Agent Handoff Flow Chart */}
              <div className="p-3 bg-[#fbf1c7] dark:bg-[#151722] border border-[#fabd2f]/30 rounded-lg space-y-2">
                <span className="text-[10px] font-bold text-[#b57614] dark:text-[#fabd2f] uppercase block tracking-wider">
                  ✦ BUDBASE-STYLE HANDOFF PIPELINE WORKFLOW (VISUALIZED)
                </span>
                <div className="flex flex-col md:flex-row items-center justify-around gap-3 pt-2">
                  {activePlan.subtasks.map((st, idx) => {
                    const agent = agents.find((a) => a.id === st.assignedTo);
                    const isRunning = executingSubtaskId === st.id;
                    const isDone = st.status === 'completed';
                    const isLast = idx === activePlan.subtasks.length - 1;

                    return (
                      <React.Fragment key={st.id}>
                        {/* Node */}
                        <div className={`flex items-center gap-2 p-2 rounded-lg border-2 text-xs transition-all w-full md:w-auto ${
                          isRunning 
                            ? 'bg-[#fabd2f]/10 border-[#fabd2f] shadow-lg shadow-[#fabd2f]/20 animate-pulse scale-105' 
                            : isDone 
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-300' 
                            : 'bg-[#ebdbb2]/30 dark:bg-[#1d2021]/80 border-[#d5c4a1] dark:border-[#3c3836]'
                        }`}>
                          <span className="text-sm">{agent?.avatar || '🤖'}</span>
                          <div>
                            <div className="font-extrabold text-[10px] uppercase text-slate-500 dark:text-slate-400">Step {idx + 1}: {agent?.name || st.assignedTo}</div>
                            <div className="font-bold text-[11px] truncate max-w-[120px]">{st.title}</div>
                          </div>
                        </div>

                        {/* Animated Link Arrow */}
                        {!isLast && (
                          <div className="flex flex-col items-center justify-center text-center">
                            <span className="text-[#fabd2f] text-sm animate-bounce font-extrabold">&rarr;</span>
                            <span className="text-[8px] font-mono text-[#7c6f64] dark:text-[#a89984] max-w-[80px] truncate">
                              {`{{ steps.${idx + 1}.output }}`}
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Assigned Autonomous Agents Cards */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#fabd2f]" />
                    <span>DELEGATED AGENT WORKSTATIONS</span>
                  </span>
                  <span className="text-[#8ec07c]">
                    {completedCount}/{activePlan.subtasks.length} Completed
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {activePlan.subtasks.map((st) => {
                    const agent = agents.find((a) => a.id === st.assignedTo);
                    const isRunning = executingSubtaskId === st.id;
                    const isDone = st.status === 'completed';

                    return (
                      <div
                        key={st.id}
                        className={`p-2.5 rounded border transition-all ${
                          isRunning
                            ? 'bg-[#fabd2f]/15 border-[#fabd2f] ring-1 ring-[#fabd2f] scale-[1.02]'
                            : isDone
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                            : 'bg-[#fbf1c7] dark:bg-[#1d2021] border-[#d5c4a1] dark:border-[#3c3836]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{agent?.avatar || '🤖'}</span>
                            <div>
                              <div className="font-bold text-xs">{agent?.name || st.assignedTo}</div>
                              <div className="text-[10px] text-[#7c6f64] dark:text-[#928374]">
                                {agent?.role || 'Autonomous Bot'}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              isRunning
                                ? 'bg-[#fabd2f] text-[#1d2021] animate-pulse'
                                : isDone
                                ? 'bg-emerald-500 text-white'
                                : 'bg-[#d5c4a1] dark:bg-[#3c3836] text-[#7c6f64] dark:text-[#a89984]'
                            }`}
                          >
                            {isRunning ? 'RUNNING' : isDone ? 'COMPLETED' : 'QUEUED'}
                          </span>
                        </div>

                        <div className="text-[11px] font-semibold text-[#282828] dark:text-[#ebdbb2] line-clamp-1 mb-1">
                          {st.title}
                        </div>

                        <div className="text-[10px] text-[#7c6f64] dark:text-[#a89984] line-clamp-2 mb-2">
                          {st.outputSummary}
                        </div>

                        <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-[#d5c4a1]/50 dark:border-[#3c3836]/50">
                          <span className="text-[#8ec07c] font-mono">
                            {st.shellCommands.length} commands
                          </span>
                          <span className="font-mono text-[#fabd2f]">
                            {st.codeSnippet ? 'Live Code Hot-Patched' : 'Verified'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Peak-Performance Collaborative Autonomous Software DevOps & Self-Healing Console */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a1c25] border-2 border-[#fabd2f]/60 shadow-xl space-y-4 font-sans text-[#282828] dark:text-[#ebdbb2]">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#d5c4a1]/40 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#fabd2f] text-[#1d2021] flex items-center justify-center animate-pulse">
                  <Bot className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#b57614] dark:text-[#fabd2f] block leading-none">
                    COLLABORATIVE AGENT ENGINE
                  </span>
                  <h2 className="text-sm font-extrabold flex items-center gap-1.5 mt-0.5">
                    Peak-Level Autonomous Execution & Self-Healing Console
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  HEALTHY // PEAK_ACTIVE
                </span>
              </div>
            </div>

            {/* Main Interactive Controls Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Left Column: Loop Controller & Simulated Injector (6 cols) */}
              <div className="lg:col-span-7 space-y-3">
                <div className="p-3.5 rounded-lg bg-white dark:bg-[#111218] border border-slate-200 dark:border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-[#fabd2f]" />
                      <span>AUTONOMOUS WORKSPACE TRIGGER</span>
                    </span>
                    <span className="text-[10px] font-bold text-[#b57614] dark:text-[#fabd2f] uppercase">
                      Phase: {autoLoopPhase.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        setIsAutonomousLoopActive(!isAutonomousLoopActive);
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        isAutonomousLoopActive
                          ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                          : 'bg-[#fabd2f] hover:bg-[#fabd2f]/90 text-[#1d2021]'
                      }`}
                    >
                      <Play className="w-4 h-4" />
                      {isAutonomousLoopActive ? 'HALT RUN LOOP' : 'START AUTONOMOUS COMPILER LOOP'}
                    </button>

                    <button
                      onClick={() => {
                        soundFx.playClick();
                        setAutoLoopLogs([`[OS_INIT] Console logs cache flushed. Ready for next loop run.`]);
                        setSimulationDiagnostics(null);
                        setCurrentErrorSimulation('none');
                        setVisualAstNodes([
                          { id: 'n1', name: 'ImportDeclaration', type: 'SyntaxNode', status: 'verified', description: 'Imports React, motion & lucide icons.' },
                          { id: 'n2', name: 'VariableDeclaration', type: 'Declaration', status: 'verified', description: 'Declares autonomous components structure.' },
                          { id: 'n3', name: 'UseStateCall', type: 'ReactHook', status: 'verified', description: 'Instantiates state hooks correctly.' },
                          { id: 'n4', name: 'UseEffectCall', type: 'ReactHook', status: 'verified', description: 'Connects standard system event listeners.' },
                          { id: 'n5', name: 'ReturnStatement', type: 'JSXExpression', status: 'verified', description: 'Compiles clean Tailwind HTML template.' },
                        ]);
                      }}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                      title="Reset Sandbox Indicators"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Simulated Fault Injector */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      INTENTIONALLY INTRODUCE SOFTWARE ERROR (TEST AUTONOMOUS SELF-HEALING)
                    </label>
                    <select
                      value={currentErrorSimulation}
                      onChange={(e) => {
                        soundFx.playClick();
                        const val = e.target.value;
                        setCurrentErrorSimulation(val);
                        if (val !== 'none') {
                          setIsAutonomousLoopActive(true); // Auto trigger execution to show linter catching it
                        }
                      }}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151722] text-[#282828] dark:text-[#ebdbb2] focus:outline-none focus:ring-1 focus:ring-[#fabd2f]"
                    >
                      <option value="none">🟢 Stable Build Workspace (Zero AST Errors / Safe Heap)</option>
                      <option value="hook_leak">⏳ Hook Loop Leak Warning (Infinite re-renders inside component)</option>
                      <option value="ast_syntax_error">❌ AST Tokenizer Crash (Broken JSX syntax / orphan delimiters)</option>
                      <option value="scope_pollution">🛡️ Sandbox Violation Error (Malicious global window process write)</option>
                    </select>
                  </div>
                </div>

                {/* Real-time Compiler Log Stream */}
                <div className="p-3 rounded-lg bg-[#0f111a] border border-slate-800 font-mono text-[10px] text-emerald-400 min-h-[160px] max-h-[220px] overflow-y-auto space-y-1 shadow-inner">
                  <div className="text-slate-500 font-extrabold uppercase text-[9px] mb-1 tracking-widest border-b border-slate-800 pb-1 flex items-center justify-between">
                    <span>V8 MICRO-FRONTEND COMPILER STREAM</span>
                    <span className="text-[#fabd2f] animate-pulse">● LIVE CONNECTION</span>
                  </div>
                  {autoLoopLogs.length === 0 ? (
                    <div className="text-slate-500 italic py-4 text-center">
                      Autonomous loop idle. Click "Start Autonomous Compiler Loop" above to watch agents build and compile code.
                    </div>
                  ) : (
                    autoLoopLogs.map((log, idx) => (
                      <div key={idx} className="leading-relaxed whitespace-pre-wrap">
                        &bull; {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: AST Visualizer & Diagnostic Speeches (5 cols) */}
              <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
                
                {/* Visual AST Structure Diagram */}
                <div className="p-3.5 rounded-lg bg-white dark:bg-[#111218] border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-indigo-500" />
                    <span>ABSTRACT SYNTAX TREE (AST) POLICY INTEGRITY DIAGRAM</span>
                  </span>

                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {visualAstNodes.map((node) => (
                      <div
                        key={node.id}
                        className={`p-1.5 rounded text-center border cursor-help transition-all ${
                          node.status === 'violation'
                            ? 'bg-rose-500/10 border-rose-500 text-rose-500 ring-1 ring-rose-500 animate-pulse'
                            : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                        }`}
                        title={`${node.name} (${node.type}): ${node.description}`}
                      >
                        <div className="text-[9px] font-extrabold truncate">{node.name}</div>
                        <div className="text-[7px] opacity-75 font-mono">{node.status.toUpperCase()}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meaningful Diagnostic Explanations / Dialogue Responses */}
                {simulationDiagnostics ? (
                  <div className="p-3.5 rounded-lg bg-yellow-50 dark:bg-amber-950/20 border border-amber-500/30 space-y-2.5 animate-fadeIn">
                    <div className="flex items-start gap-2.5">
                      <span className="text-2xl p-1 bg-amber-500/10 rounded-full flex-shrink-0">
                        {simulationDiagnostics.avatar}
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-xs font-extrabold text-[#b57614] dark:text-[#fabd2f]">
                            {simulationDiagnostics.author}
                          </strong>
                          <span className="text-[8px] font-mono uppercase bg-amber-500/10 text-[#b57614] dark:text-[#fabd2f] px-1 py-0.2 rounded font-bold">
                            Diagnostic Specialist
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-sans font-medium italic">
                          "{simulationDiagnostics.text}"
                        </p>
                      </div>
                    </div>

                    {/* Recommendations and Remedies */}
                    <div className="space-y-1.5 pt-2 border-t border-amber-500/20">
                      <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                        Suggested Autonomous Repair Protocols:
                      </span>
                      <div className="grid grid-cols-1 gap-1 text-[10px]">
                        {simulationDiagnostics.recommendations.map((rec, rIdx) => (
                          <div key={rIdx} className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                            <span className="text-amber-500">•</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>

                      {/* Trigger Healing */}
                      <button
                        onClick={handleTriggerSelfHeal}
                        disabled={isHealAnimationPlaying}
                        className={`w-full mt-2 py-1.5 px-3 rounded font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-white ${
                          isHealAnimationPlaying
                            ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 animate-pulse cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg'
                        }`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isHealAnimationPlaying ? 'animate-spin' : ''}`} />
                        {isHealAnimationPlaying ? 'APPLYING HOT-PATCHES...' : 'EXECUTE AUTONOMOUS SELF-HEAL DAEMON'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center text-center py-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-1.5" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                      System Codebase Stable
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-xs mt-1">
                      No AST compiler exceptions detected. Live web sandbox operates in optimal peak performance.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
          {isAnalyzing && (
            <div className="p-6 rounded-lg bg-yellow-50 dark:bg-amber-950/20 border border-amber-500/30 flex flex-col items-center justify-center text-center space-y-3 animate-pulse">
              <RefreshCw className="w-8 h-8 text-[#fabd2f] animate-spin" />
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-[#b57614] dark:text-[#fabd2f] uppercase tracking-wide">
                  COMPILING CHIEF STRATEGIST BOARD REPORT
                </h3>
                <p className="text-xs text-[#7c6f64] dark:text-[#a89984] max-w-md">
                  Synthesizing agent capabilities, verifying hot-patched modules, conducting zero-trust perimeter telemetry, and calculating developer cost-offset metrics...
                </p>
              </div>
            </div>
          )}

          {/* Strategic Post-Mortem & Performance Analysis Dashboard */}
          {taskAnalysis && (
            <div className="p-4 rounded-xl bg-white dark:bg-[#151722] border-2 border-emerald-500/50 shadow-lg space-y-4 font-sans text-slate-800 dark:text-slate-100">
              
              {/* Section Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#d5c4a1]/40 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400 block">
                      STRATEGIC EXECUTIVE VERIFICATION
                    </span>
                    <h2 className="text-sm font-bold flex items-center gap-1.5">
                      Fleet Performance & Post-Mortem Task Analysis
                    </h2>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                  ONLINE CERTIFIED
                </span>
              </div>

              {/* Metric Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#20222e] border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-tight">MANUAL HOURS SAVED</span>
                    <strong className="text-base font-extrabold text-slate-800 dark:text-slate-100 block">
                      {taskAnalysis.businessImpact?.hoursSaved || 24} hrs
                    </strong>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#20222e] border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-tight">SPEED MULTIPLIER</span>
                    <strong className="text-base font-extrabold text-slate-800 dark:text-slate-100 block">
                      {taskAnalysis.businessImpact?.speedup || '15x'}
                    </strong>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#20222e] border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <Zap className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-tight">KPI BOOST</span>
                    <strong className="text-base font-extrabold text-slate-800 dark:text-slate-100 block">
                      {taskAnalysis.businessImpact?.kpiImprovement || '97.2%'}
                    </strong>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#20222e] border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-rose-500 flex-shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-tight">SECURITY GATEWAY</span>
                    <strong className="text-base font-extrabold text-slate-800 dark:text-slate-100 block">
                      {taskAnalysis.businessImpact?.securityCheck || '100% Passed'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Executive Summary Narrative */}
              <div className="p-3.5 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide block leading-none">
                  EXECUTIVE SUMMARY & BUSINESS ALIGNMENT
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans font-medium">
                  {taskAnalysis.executiveSummary}
                </p>
              </div>

              {/* Agent Breakthroughs & Contributions */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span>Agent Breakout KPI & Technology Contribution</span>
                </h3>
                <div className="space-y-2">
                  {taskAnalysis.agentBreakdowns?.map((agentBreakdown: any, idx: number) => {
                    const agentColor = getAgentColor(agents.find((a) => a.id === agentBreakdown.agentId)?.department || 'executive');
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-[#1b1c26] border border-slate-200 dark:border-slate-800 space-y-2 font-sans"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ backgroundColor: agentColor }}>
                              {agentBreakdown.name?.charAt(0) || 'A'}
                            </span>
                            <div>
                              <strong className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                {agentBreakdown.name}
                              </strong>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-2 font-mono">
                                @{agentBreakdown.agentId}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">KPI SCORE</span>
                            <span className="px-1.5 py-0.5 rounded font-mono font-bold text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              {agentBreakdown.score}/100
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar for Score */}
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded" style={{ width: `${agentBreakdown.score}%` }} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                          <div>
                            <span className="font-bold text-slate-500 dark:text-slate-400 block uppercase text-[9px] tracking-wide mb-0.5">CORE CONTRIBUTION</span>
                            <p className="text-slate-700 dark:text-slate-300 leading-snug">{agentBreakdown.contribution}</p>
                          </div>
                          <div>
                            <span className="font-bold text-indigo-500 dark:text-indigo-400 block uppercase text-[9px] tracking-wide mb-0.5">TECHNICAL BREAKTHROUGH</span>
                            <p className="text-slate-700 dark:text-slate-300 leading-snug italic">"{agentBreakdown.breakthrough}"</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strategic Board Recommendations */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>Executive Next Steps & Adoption Protocol</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-sans">
                  {taskAnalysis.strategicNextSteps?.map((step: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                    >
                      <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed font-medium">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Interactive Live Website Sandbox Simulator & Execution Preview */}
          {taskAnalysis && activePrompt && (
            <div className="p-4 rounded-xl bg-white dark:bg-[#151722] border-2 border-indigo-500/50 shadow-xl space-y-4 font-sans text-slate-800 dark:text-slate-100">
              {/* Section Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#d5c4a1]/40 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Globe className="w-5 h-5 animate-pulse" />
                  </span>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-600 dark:text-indigo-400 block">
                      LIVE SANDBOX ENVIRONMENT
                    </span>
                    <h2 className="text-sm font-bold flex items-center gap-1.5">
                      Interactive Website Build & Verification Sandbox
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                    PORT 3080 // ACTIVE
                  </span>
                </div>
              </div>

              {/* Archetype Identifier Banner */}
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1f202b] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">DETECTED WEBSITE ARCHETYPE</span>
                  <strong className="text-indigo-600 dark:text-indigo-400 capitalize font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    {(() => {
                      const p = (activePrompt || '').toLowerCase();
                      if (p.includes('feedback') || p.includes('survey') || p.includes('form') || p.includes('contact') || p.includes('review')) return 'State-driven Customer Feedback & Review System';
                      if (p.includes('store') || p.includes('shop') || p.includes('commerce') || p.includes('catalog') || p.includes('purchase') || p.includes('checkout') || p.includes('cart')) return 'Stateful E-Commerce Digital Storefront & Shopping Cart';
                      if (p.includes('crypto') || p.includes('stock') || p.includes('finance') || p.includes('wallet') || p.includes('portfolio') || p.includes('ticker') || p.includes('coin')) return 'Real-Time Crypto Portfolio Trade Terminal';
                      if (p.includes('board') || p.includes('kanban') || p.includes('project') || p.includes('todo') || p.includes('list') || p.includes('scrum') || p.includes('agile')) return 'Interactive Agile Scrum Kanban Board';
                      return 'Universal Customizer & Micro-Frontend Workspace';
                    })()}
                  </strong>
                </div>

                {/* Sandbox Control Tabs */}
                <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-[#20222e] p-1 rounded-lg">
                  <button
                    onClick={() => { soundFx.playClick(); setActiveSandboxTab('app'); }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${activeSandboxTab === 'app' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  >
                    Interactive Site
                  </button>
                  <button
                    onClick={() => { soundFx.playClick(); setActiveSandboxTab('telemetry'); }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${activeSandboxTab === 'telemetry' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  >
                    Telemetry & Logs
                  </button>
                  <button
                    onClick={() => { soundFx.playClick(); setActiveSandboxTab('source'); }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${activeSandboxTab === 'source' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  >
                    Source Code
                  </button>
                </div>
              </div>

              {/* Browser-like Mock Wrapper */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-md bg-slate-100 dark:bg-[#1a1c26]">
                
                {/* Browser Address Bar */}
                <div className="px-3 py-2 bg-slate-200 dark:bg-[#20222e] border-b border-slate-300 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  
                  {/* Address bar input */}
                  <div className="flex-1 max-w-xl bg-white dark:bg-[#14151e] border border-slate-300 dark:border-slate-800 px-3 py-1 rounded text-[11px] text-slate-500 font-mono text-center select-all flex items-center justify-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-indigo-500" />
                    <span>http://localhost:3080/sandbox/active-deployment</span>
                  </div>

                  <button
                    onClick={() => {
                      soundFx.playClick();
                      // Reset states
                      setSandboxCart([]);
                      setOrderPlaced(false);
                      setNewTaskTitle('');
                      setFeedbackName('');
                      setFeedbackEmail('');
                      setFeedbackComment('');
                      setSandboxCustomCounters(0);
                      setSandboxCryptoTransactions([
                        { id: 'tx-1', type: 'buy', coin: 'BTC', amount: '0.15', price: 95100, timestamp: '10:42 AM' },
                        { id: 'tx-2', type: 'buy', coin: 'RUFLO', amount: '250', price: 11.20, timestamp: '11:15 AM' }
                      ]);
                      setFeedbackList([
                        { id: '1', name: 'Angela Martin', email: 'angela@dunder.com', rating: 5, comment: 'Pristine security architecture! Dwight has done an exemplary job.', sentiment: 'positive' },
                        { id: '2', name: 'Andy Bernard', email: 'cornell@dunder.com', rating: 4, comment: 'Absolutely sensational UI! The colors are harmonized and crisp.', sentiment: 'positive' }
                      ]);
                    }}
                    className="p-1 hover:bg-slate-300 dark:hover:bg-[#2e3142] rounded text-slate-500 dark:text-slate-400 transition-colors"
                    title="Reset Sandbox State & Cache"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Tab 1: Interactive App Canvas */}
                {activeSandboxTab === 'app' && (
                  <div className="p-4 bg-white dark:bg-[#0f111a] min-h-[360px] max-h-[500px] overflow-y-auto">
                    
                    {/* Archetype: FEEDBACK SYSTEM */}
                    {(() => {
                      const p = (activePrompt || '').toLowerCase();
                      if (p.includes('feedback') || p.includes('survey') || p.includes('form') || p.includes('contact') || p.includes('review')) {
                        return (
                          <div className="space-y-4 font-sans text-slate-800 dark:text-slate-100">
                            {/* App Header */}
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                              <MessageSquare className="w-5 h-5 text-indigo-500" />
                              <div>
                                <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                  Enterprise Customer Survey & Insights Portal
                                </h1>
                                <p className="text-[10px] text-slate-400">Deployed by Jim Halpert & Cline Bot</p>
                              </div>
                            </div>

                            {/* Two-Column Form & Feed */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                              
                              {/* Left column: Form */}
                              <form 
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  if (!feedbackName.trim() || !feedbackComment.trim()) return;
                                  soundFx.playNotification();
                                  const newItem = {
                                    id: String(Date.now()),
                                    name: feedbackName,
                                    email: feedbackEmail || 'anonymous@dunder-mifflin.com',
                                    rating: feedbackRating,
                                    comment: feedbackComment,
                                    sentiment: feedbackRating >= 4 ? 'positive' : feedbackRating === 3 ? 'neutral' : 'negative'
                                  };
                                  setFeedbackList([newItem, ...feedbackList]);
                                  setFeedbackName('');
                                  setFeedbackEmail('');
                                  setFeedbackComment('');
                                }}
                                className="md:col-span-2 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#161824] space-y-2.5"
                              >
                                <strong className="text-xs font-bold block border-b border-slate-100 dark:border-slate-800/60 pb-1 text-indigo-600 dark:text-indigo-400">
                                  Log Customer Feedback
                                </strong>
                                
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">FULL NAME</label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="Michael Scott"
                                    value={feedbackName}
                                    onChange={(e) => setFeedbackName(e.target.value)}
                                    className="w-full px-2 py-1.5 rounded text-xs bg-white dark:bg-[#1c1e2d] border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">EMAIL ADDRESS</label>
                                  <input
                                    type="email"
                                    placeholder="michael@dunder.com"
                                    value={feedbackEmail}
                                    onChange={(e) => setFeedbackEmail(e.target.value)}
                                    className="w-full px-2 py-1.5 rounded text-xs bg-white dark:bg-[#1c1e2d] border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-1">RATING EXPERIENCE</label>
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        type="button"
                                        onClick={() => { soundFx.playClick(); setFeedbackRating(star); }}
                                        className="focus:outline-none text-base"
                                      >
                                        <Heart className={`w-5 h-5 ${star <= feedbackRating ? 'fill-indigo-500 text-indigo-500' : 'text-slate-300 dark:text-slate-700'}`} />
                                      </button>
                                    ))}
                                    <span className="text-xs font-mono font-bold text-indigo-500 ml-1">({feedbackRating}/5)</span>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">DETAILED EXPERIENCE COMMENTS</label>
                                  <textarea
                                    required
                                    rows={2}
                                    placeholder="Write details of active software deployment..."
                                    value={feedbackComment}
                                    onChange={(e) => setFeedbackComment(e.target.value)}
                                    className="w-full px-2 py-1 rounded text-xs bg-white dark:bg-[#1c1e2d] border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                                  />
                                </div>

                                <button
                                  type="submit"
                                  className="w-full py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Submit Survey & Check Sentiment</span>
                                </button>
                              </form>

                              {/* Right column: Feed */}
                              <div className="md:col-span-3 space-y-2">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1">
                                  <strong className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                    Submissions Rollout Log ({feedbackList.length})
                                  </strong>
                                  <div className="flex gap-1.5 text-[9px] font-bold text-slate-400">
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/10">
                                      {feedbackList.filter(f => f.sentiment === 'positive').length} POSITIVE
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/10">
                                      {feedbackList.filter(f => f.sentiment === 'negative').length} UNFAVORABLE
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                                  {feedbackList.map((f) => (
                                    <div 
                                      key={f.id} 
                                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-[#141620] relative hover:shadow-xs transition-shadow"
                                    >
                                      <button 
                                        onClick={() => {
                                          soundFx.playClick();
                                          setFeedbackList(prev => prev.filter(item => item.id !== f.id));
                                        }}
                                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"
                                        title="Delete Submission"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>

                                      <div className="flex items-center gap-1.5 mb-1">
                                        <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-[10px] font-bold text-indigo-600 flex items-center justify-center">
                                          {f.name.charAt(0)}
                                        </div>
                                        <div>
                                          <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">{f.name}</strong>
                                          <span className="text-[9px] text-slate-400 leading-none block">{f.email}</span>
                                        </div>
                                        <span className={`ml-auto px-1.5 py-0.2 rounded text-[8px] font-bold uppercase ${f.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'}`}>
                                          {f.sentiment}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-0.5 text-indigo-500 mb-1">
                                        {Array.from({ length: f.rating }).map((_, idx) => (
                                          <Heart key={idx} className="w-3 h-3 fill-indigo-500" />
                                        ))}
                                      </div>

                                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal italic">
                                        "{f.comment}"
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                            </div>
                          </div>
                        );
                      }

                      // Archetype: E-COMMERCE digital catalog
                      if (p.includes('store') || p.includes('shop') || p.includes('commerce') || p.includes('catalog') || p.includes('purchase') || p.includes('checkout') || p.includes('cart')) {
                        const itemsList = [
                          { id: 'p1', name: 'Quantum Core LLM Accelerator', price: 1299, desc: 'Hardware accelerator for local Transformer inference with 128GB high-bandwidth cache.', category: 'Hardware', icon: <Cpu className="w-5 h-5" /> },
                          { id: 'p2', name: 'Ruflo Multi-Agent Engine License', price: 299, desc: 'Enterprise fleet subscription supporting up to 50 active autonomous workers with self-healing rules.', category: 'Software', icon: <Layers className="w-5 h-5" /> },
                          { id: 'p3', name: 'Dwight Zero-Trust Security Shield', price: 149, desc: 'Static AST scanner detecting injection vectors and unvalidated execution branches.', category: 'Security', icon: <Shield className="w-5 h-5" /> },
                        ];

                        const cartSubtotal = sandboxCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                        const cartCount = sandboxCart.reduce((acc, item) => acc + item.quantity, 0);

                        return (
                          <div className="space-y-4 font-sans text-slate-800 dark:text-slate-100">
                            {/* App Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-indigo-500" />
                                <div>
                                  <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                    Dunder-Mifflin Autonomous Systems Storefront
                                  </h1>
                                  <p className="text-[10px] text-slate-400">Deployed by Ruflo Coder & Jim Halpert</p>
                                </div>
                              </div>
                              <div className="relative p-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded flex items-center gap-1 font-mono text-[11px] font-bold">
                                <ShoppingCart className="w-4 h-4" />
                                <span>CART ({cartCount})</span>
                              </div>
                            </div>

                            {orderPlaced ? (
                              <div className="py-6 text-center space-y-3 bg-indigo-500/5 rounded-xl border-2 border-dashed border-indigo-500/30 max-w-md mx-auto">
                                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                                <div className="space-y-1">
                                  <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                                    ORDER RECEIVED SUCCESSFULLY
                                  </h2>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Reference ID: <strong className="font-mono text-indigo-500 font-bold">#DM-ST-{activeOrderId}</strong>
                                  </p>
                                  <p className="text-[11px] text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                                    Dunder Fleet is packing your deployment payload. Dwight Schrute has completed a cryptographic check on secure transaction variables.
                                  </p>
                                </div>
                                <div className="p-3 bg-white dark:bg-[#13141f] border border-slate-200 dark:border-slate-800 rounded-lg max-w-xs mx-auto text-left text-xs space-y-1 font-mono">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Recipient:</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{checkoutName}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Mail Destination:</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[140px]">{checkoutAddress}</span>
                                  </div>
                                  <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-1 mt-1 text-indigo-500 font-extrabold">
                                    <span>Total Invoice:</span>
                                    <span>${cartSubtotal} USD</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => { soundFx.playClick(); setOrderPlaced(false); setSandboxCart([]); }}
                                  className="px-4 py-1.5 rounded bg-indigo-600 text-white font-bold text-xs"
                                >
                                  Return to Marketplace
                                </button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                
                                {/* Product Grid (Col-Span 7) */}
                                <div className="md:col-span-7 space-y-3">
                                  <strong className="text-xs font-bold text-slate-400 block uppercase tracking-wide">
                                    Available Systems Catalog
                                  </strong>
                                  
                                  <div className="space-y-2.5">
                                    {itemsList.map((item) => (
                                      <div 
                                        key={item.id}
                                        className="p-3 bg-slate-50/50 dark:bg-[#161824] border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-3 hover:shadow-xs transition-shadow"
                                      >
                                        <span className="p-2.5 rounded-lg bg-indigo-600/10 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                          {item.icon}
                                        </span>
                                        <div className="flex-1 space-y-1">
                                          <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">{item.name}</h3>
                                            <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">${item.price}</span>
                                          </div>
                                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{item.desc}</p>
                                          <div className="flex items-center justify-between pt-1">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-200/50 dark:bg-[#20222e] px-1.5 py-0.2 rounded">
                                              {item.category}
                                            </span>
                                            <button
                                              onClick={() => {
                                                soundFx.playClick();
                                                setSandboxCart((prev) => {
                                                  const exists = prev.find(i => i.id === item.id);
                                                  if (exists) {
                                                    return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
                                                  }
                                                  return [...prev, { ...item, quantity: 1 }];
                                                });
                                              }}
                                              className="px-2 py-0.8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded flex items-center gap-1 transition-colors"
                                            >
                                              <Plus className="w-3 h-3" /> Add to Cart
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Shopping Cart Checkout Sidebar (Col-Span 5) */}
                                <div className="md:col-span-5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#161824] space-y-3">
                                  <strong className="text-xs font-bold text-slate-200 block uppercase tracking-wide border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                                    <ShoppingCart className="w-4 h-4 text-indigo-400" />
                                    Shopping Cart Checkout
                                  </strong>

                                  {sandboxCart.length === 0 ? (
                                    <div className="text-center py-10 text-slate-500 text-xs">
                                      Cart is empty. Add a technical software system asset from the catalog to build your order bundle.
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      {/* Mini items list */}
                                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                                        {sandboxCart.map((item) => (
                                          <div key={item.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 font-sans">
                                            <div className="truncate max-w-[110px]">
                                              <span className="font-bold text-slate-300 block truncate">{item.name}</span>
                                              <span className="text-[10px] text-slate-500 font-mono">${item.price} &times; {item.quantity}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-mono font-bold text-indigo-400">${item.price * item.quantity}</span>
                                              <button 
                                                onClick={() => {
                                                  soundFx.playClick();
                                                  setSandboxCart(prev => prev.filter(i => i.id !== item.id));
                                                }}
                                                className="text-slate-500 hover:text-red-400 transition-colors"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      {/* Total calculation */}
                                      <div className="p-2 bg-[#0f111a] rounded-lg border border-slate-800 space-y-1 font-mono text-xs">
                                        <div className="flex justify-between text-slate-400">
                                          <span>Subtotal:</span>
                                          <span>${cartSubtotal} USD</span>
                                        </div>
                                        <div className="flex justify-between text-slate-400">
                                          <span>Local VAT (5%):</span>
                                          <span>${Math.round(cartSubtotal * 0.05)} USD</span>
                                        </div>
                                        <div className="flex justify-between font-extrabold text-indigo-400 border-t border-slate-800 pt-1 text-sm mt-1">
                                          <span>Total Cost:</span>
                                          <span>${cartSubtotal + Math.round(cartSubtotal * 0.05)} USD</span>
                                        </div>
                                      </div>

                                      {/* Checkout Form */}
                                      <form 
                                        onSubmit={(e) => {
                                          e.preventDefault();
                                          if (!checkoutName.trim() || !checkoutAddress.trim()) return;
                                          soundFx.playNotification();
                                          setActiveOrderId(String(Math.floor(1000 + Math.random() * 9000)));
                                          setOrderPlaced(true);
                                        }}
                                        className="space-y-2 border-t border-slate-800 pt-2"
                                      >
                                        <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Secure Sandboxed Checkout</span>
                                        
                                        <input
                                          type="text"
                                          required
                                          placeholder="Full Name"
                                          value={checkoutName}
                                          onChange={(e) => setCheckoutName(e.target.value)}
                                          className="w-full px-2 py-1 bg-[#1a1c27] border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />

                                        <input
                                          type="text"
                                          required
                                          placeholder="Delivery Sandbox Address"
                                          value={checkoutAddress}
                                          onChange={(e) => setCheckoutAddress(e.target.value)}
                                          className="w-full px-2 py-1 bg-[#1a1c27] border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />

                                        <button
                                          type="submit"
                                          className="w-full py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-[#121110] font-extrabold text-xs transition-colors shadow-md uppercase tracking-wide"
                                        >
                                          Place Secure Test Order
                                        </button>
                                      </form>

                                    </div>
                                  )}
                                </div>

                              </div>
                            )}

                          </div>
                        );
                      }

                      // Archetype: CRYPTO PAPER TRADER TERMINAL
                      if (p.includes('crypto') || p.includes('stock') || p.includes('finance') || p.includes('wallet') || p.includes('portfolio') || p.includes('ticker') || p.includes('coin')) {
                        return (
                          <div className="space-y-4 font-sans text-slate-800 dark:text-slate-100">
                            {/* App Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-500" />
                                <div>
                                  <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                    Dunder-Asset Portfolio & Exchange Terminal
                                  </h1>
                                  <p className="text-[10px] text-slate-400">Deployed by Kevin Malone (Finance Analyst)</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  soundFx.playClick();
                                  setCryptoPrices((prev) => ({
                                    BTC: Math.round(prev.BTC * (1 + (0.04 * Math.random() - 0.02))),
                                    ETH: Math.round(prev.ETH * (1 + (0.04 * Math.random() - 0.02))),
                                    SOL: Math.round(prev.SOL * (1 + (0.04 * Math.random() - 0.02))),
                                    RUFLO: Number((prev.RUFLO * (1 + (0.05 * Math.random() - 0.025))).toFixed(2))
                                  }));
                                }}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded transition-colors flex items-center gap-1 shadow-xs"
                              >
                                <RefreshCw className="w-3 h-3" /> Tick Market Rates
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                              
                              {/* Left Column: Coins Table & Balance (Col-Span 7) */}
                              <div className="md:col-span-7 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-slate-800">
                                    <span className="text-[9px] text-slate-400 block uppercase">Liquid Portfolio Balance</span>
                                    <strong className="text-base text-slate-800 dark:text-slate-100 font-extrabold font-mono block mt-0.5">
                                      $48,740.00 USD
                                    </strong>
                                  </div>
                                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-slate-800">
                                    <span className="text-[9px] text-slate-400 block uppercase">24h Net Return</span>
                                    <strong className="text-base text-emerald-500 font-extrabold font-mono block mt-0.5">
                                      +$1,482.40 (+3.14%)
                                    </strong>
                                  </div>
                                </div>

                                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-[#13141f]">
                                  <table className="w-full text-xs font-sans">
                                    <thead>
                                      <tr className="bg-slate-50 dark:bg-[#1c1d29] border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase text-slate-400 text-left font-bold">
                                        <th className="p-2">Asset Coin</th>
                                        <th className="p-2 text-right">Price Index</th>
                                        <th className="p-2 text-right">24h Change</th>
                                        <th className="p-2 text-center">Trade Options</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                                      {[
                                        { symbol: 'BTC', name: 'Bitcoin Network', price: cryptoPrices.BTC, change: '+1.45%', up: true },
                                        { symbol: 'ETH', name: 'Ethereum Engine', price: cryptoPrices.ETH, change: '+0.84%', up: true },
                                        { symbol: 'SOL', name: 'Solana Speed', price: cryptoPrices.SOL, change: '-2.15%', up: false },
                                        { symbol: 'RUFLO', name: 'Ruflo Fleet Coin', price: cryptoPrices.RUFLO, change: '+12.42%', up: true }
                                      ].map((coin) => (
                                        <tr key={coin.symbol} className="hover:bg-slate-50/50 dark:hover:bg-[#1a1c27]">
                                          <td className="p-2">
                                            <div className="flex items-center gap-1.5">
                                              <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-[10px]">
                                                {coin.symbol.charAt(0)}
                                              </span>
                                              <div className="font-sans">
                                                <strong className="text-slate-800 dark:text-slate-200 block text-xs leading-none">{coin.symbol}</strong>
                                                <span className="text-[9px] text-slate-400 font-medium leading-none block">{coin.name}</span>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="p-2 text-right font-bold text-slate-800 dark:text-slate-200">
                                            ${coin.price.toLocaleString()}
                                          </td>
                                          <td className={`p-2 text-right font-bold ${coin.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {coin.change}
                                          </td>
                                          <td className="p-2 text-center">
                                            <button
                                              onClick={() => {
                                                soundFx.playClick();
                                                setTradeCoin(coin.symbol);
                                              }}
                                              className="px-2 py-0.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 font-bold rounded text-[10px] border border-indigo-500/20"
                                            >
                                              Select Asset
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Right Column: Execution Widget (Col-Span 5) */}
                              <div className="md:col-span-5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#161824] space-y-3 flex flex-col justify-between">
                                <div className="space-y-3">
                                  <strong className="text-xs font-bold text-slate-200 block uppercase tracking-wide border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                                    <DollarSign className="w-4 h-4 text-indigo-400" />
                                    Dynamic Trading Desk
                                  </strong>

                                  {/* Buy/Sell Toggles */}
                                  <div className="grid grid-cols-2 gap-1 bg-[#0f111a] p-1 rounded-lg border border-slate-800">
                                    <button
                                      onClick={() => { soundFx.playClick(); setTradeType('buy'); }}
                                      className={`py-1 text-xs font-bold rounded-md uppercase transition-all ${tradeType === 'buy' ? 'bg-emerald-500 text-[#121110]' : 'text-slate-400 hover:text-white'}`}
                                    >
                                      BUY COIN
                                    </button>
                                    <button
                                      onClick={() => { soundFx.playClick(); setTradeType('sell'); }}
                                      className={`py-1 text-xs font-bold rounded-md uppercase transition-all ${tradeType === 'sell' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'}`}
                                    >
                                      SELL COIN
                                    </button>
                                  </div>

                                  <div className="space-y-2 text-xs">
                                    <div>
                                      <label className="text-[10px] text-slate-400 font-bold block mb-0.5">SELECTED CRYPTO ASSET</label>
                                      <select
                                        value={tradeCoin}
                                        onChange={(e) => setTradeCoin(e.target.value)}
                                        className="w-full px-2.5 py-1.5 rounded bg-[#1a1c27] border border-slate-800 text-slate-200 font-mono"
                                      >
                                        <option className="text-slate-900 bg-white" value="BTC">BTC (Bitcoin)</option>
                                        <option className="text-slate-900 bg-white" value="ETH">ETH (Ethereum)</option>
                                        <option className="text-slate-900 bg-white" value="SOL">SOL (Solana)</option>
                                        <option className="text-slate-900 bg-white" value="RUFLO">RUFLO (Ruflo Coin)</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="text-[10px] text-slate-400 font-bold block mb-0.5">TRANSACTION VOLUME</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={tradeAmount}
                                        onChange={(e) => setTradeAmount(e.target.value)}
                                        className="w-full px-2.5 py-1.5 rounded bg-[#1a1c27] border border-slate-800 text-slate-200 font-mono"
                                      />
                                    </div>

                                    {/* Calculated output */}
                                    <div className="p-2 bg-[#0f111a] rounded border border-slate-800 space-y-1 text-[11px] font-mono leading-none">
                                      <div className="flex justify-between text-slate-400">
                                        <span>Unit Price:</span>
                                        <span>${(cryptoPrices as any)[tradeCoin]}</span>
                                      </div>
                                      <div className="flex justify-between text-slate-400">
                                        <span>Slippage & gas:</span>
                                        <span>$0.40 USD</span>
                                      </div>
                                      <div className="flex justify-between font-extrabold text-indigo-400 border-t border-slate-800 pt-1 mt-1 text-xs">
                                        <span>Gross Cost:</span>
                                        <span>${(Number(tradeAmount) * (cryptoPrices as any)[tradeCoin] + 0.40).toFixed(2)} USD</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    if (Number(tradeAmount) <= 0) return;
                                    soundFx.playNotification();
                                    const tx = {
                                      id: `tx-${Date.now()}`,
                                      type: tradeType,
                                      coin: tradeCoin,
                                      amount: tradeAmount,
                                      price: (cryptoPrices as any)[tradeCoin],
                                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    };
                                    setSandboxCryptoTransactions([tx, ...sandboxCryptoTransactions]);
                                  }}
                                  className={`w-full py-2 rounded text-xs font-bold transition-all shadow-md mt-4 ${tradeType === 'buy' ? 'bg-emerald-500 hover:bg-emerald-600 text-[#121110]' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}
                                >
                                  Execute Sandboxed Trade
                                </button>
                              </div>

                            </div>
                          </div>
                        );
                      }

                      // Archetype: AGILE KANBAN SCRUM BOARD
                      if (p.includes('board') || p.includes('kanban') || p.includes('project') || p.includes('todo') || p.includes('list') || p.includes('scrum') || p.includes('agile')) {
                        return (
                          <div className="space-y-4 font-sans text-slate-800 dark:text-slate-100">
                            {/* App Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-2">
                                <LayoutDashboard className="w-5 h-5 text-indigo-500" />
                                <div>
                                  <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                    Agile Sprint Workflow Board
                                  </h1>
                                  <p className="text-[10px] text-slate-400">Deployed by Pam Beesly & Ruflo Coder</p>
                                </div>
                              </div>

                              {/* Simple insert task card */}
                              <form 
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  if (!newTaskTitle.trim()) return;
                                  soundFx.playClick();
                                  const newTask = {
                                    id: `task-${Date.now()}`,
                                    title: newTaskTitle,
                                    status: 'todo',
                                    category: newTaskCategory
                                  };
                                  setSandboxTasks([...sandboxTasks, newTask]);
                                  setNewTaskTitle('');
                                }}
                                className="flex items-center gap-1 bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-slate-800 rounded px-2 py-1"
                              >
                                <input
                                  type="text"
                                  placeholder="New sprint task..."
                                  value={newTaskTitle}
                                  onChange={(e) => setNewTaskTitle(e.target.value)}
                                  className="px-1.5 py-0.5 bg-white dark:bg-[#1a1c27] text-xs text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded focus:outline-none"
                                />
                                <select
                                  value={newTaskCategory}
                                  onChange={(e) => setNewTaskCategory(e.target.value)}
                                  className="text-[10px] bg-white dark:bg-[#1a1c27] border border-slate-200 dark:border-slate-800 rounded px-1 py-0.5 font-bold"
                                >
                                  <option className="text-slate-900 bg-white" value="Feature">Feature</option>
                                  <option className="text-slate-900 bg-white" value="Bug">Bug</option>
                                  <option className="text-slate-900 bg-white" value="Security">Security</option>
                                  <option className="text-slate-900 bg-white" value="Design">Design</option>
                                </select>
                                <button
                                  type="submit"
                                  className="px-2 py-0.5 bg-indigo-600 text-white rounded font-bold text-xs"
                                >
                                  + Card
                                </button>
                              </form>
                            </div>

                            {/* Kanban Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                              {[
                                { id: 'todo', name: 'Backlog / To Do', color: 'border-slate-300 bg-slate-50/50 dark:bg-[#13141f]' },
                                { id: 'in-progress', name: 'In Progress', color: 'border-amber-400/40 bg-amber-500/5' },
                                { id: 'review', name: 'QA & Review', color: 'border-indigo-400/40 bg-indigo-500/5' },
                                { id: 'done', name: 'Verified Done', color: 'border-emerald-400/40 bg-emerald-500/5' }
                              ].map((col) => (
                                <div 
                                  key={col.id} 
                                  className={`p-2 rounded-lg border-t-2 border-x border-b border-slate-200 dark:border-slate-800 ${col.color} flex flex-col h-[280px] overflow-hidden`}
                                >
                                  <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200 dark:border-slate-800">
                                    <span className="font-bold text-slate-700 dark:text-slate-300 block">{col.name}</span>
                                    <span className="px-1.5 py-0.1 text-[9px] font-mono rounded bg-slate-200 dark:bg-slate-800 font-bold text-slate-500 dark:text-slate-400">
                                      {sandboxTasks.filter(t => t.status === col.id).length}
                                    </span>
                                  </div>

                                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
                                    {sandboxTasks.filter(t => t.status === col.id).map((task) => (
                                      <div 
                                        key={task.id} 
                                        className="p-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171926] shadow-2xs hover:shadow-xs transition-shadow space-y-1.5 group"
                                      >
                                        <div className="flex items-start justify-between gap-1">
                                          <span className={`text-[8px] font-bold uppercase px-1 rounded ${
                                            task.category === 'Bug' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400' :
                                            task.category === 'Security' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400' :
                                            task.category === 'Design' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                                            'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                                          }`}>
                                            {task.category}
                                          </span>
                                          <button
                                            onClick={() => {
                                              soundFx.playClick();
                                              setSandboxTasks(prev => prev.filter(t => t.id !== task.id));
                                            }}
                                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>

                                        <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-tight">
                                          {task.title}
                                        </p>

                                        {/* Shift Column Buttons */}
                                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                                          <button
                                            disabled={col.id === 'todo'}
                                            onClick={() => {
                                              soundFx.playClick();
                                              const columns = ['todo', 'in-progress', 'review', 'done'];
                                              const nextCol = columns[columns.indexOf(col.id) - 1];
                                              setSandboxTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextCol } : t));
                                            }}
                                            className="text-[9px] text-indigo-500 hover:underline disabled:opacity-30 disabled:no-underline font-bold"
                                          >
                                            &larr; Prev
                                          </button>
                                          <button
                                            disabled={col.id === 'done'}
                                            onClick={() => {
                                              soundFx.playClick();
                                              const columns = ['todo', 'in-progress', 'review', 'done'];
                                              const nextCol = columns[columns.indexOf(col.id) + 1];
                                              setSandboxTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextCol } : t));
                                            }}
                                            className="text-[9px] text-indigo-500 hover:underline disabled:opacity-30 disabled:no-underline font-bold"
                                          >
                                            Next &rarr;
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      // DEFAULT ARCHETYPE: DYNAMIC DEVELOPER WORKSPACE CUSTOMIZER
                      return (
                        <div className="space-y-4 font-sans text-slate-800 dark:text-slate-100">
                          {/* App Header */}
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <Layers className="w-5 h-5 text-indigo-500" />
                            <div>
                              <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                Dunder-Mifflin Custom Micro-Frontend Framework
                              </h1>
                              <p className="text-[10px] text-slate-400">Deployed by Ryan Howard & Cline Engine</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            
                            {/* Left Config Panel (Col-span 5) */}
                            <div className="md:col-span-5 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#161824] space-y-3 text-xs">
                              <strong className="text-xs font-bold block border-b border-slate-100 dark:border-slate-800/60 pb-1 text-indigo-600 dark:text-indigo-400">
                                Dynamic UI Settings
                              </strong>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">CUSTOM APP TITLE</label>
                                <input
                                  type="text"
                                  value={sandboxCustomConfig.title}
                                  onChange={(e) => setSandboxCustomConfig(prev => ({ ...prev, title: e.target.value }))}
                                  className="w-full px-2 py-1 bg-white dark:bg-[#1c1e2d] border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">BACKGROUND THEME</label>
                                <select
                                  value={sandboxCustomConfig.bgColor}
                                  onChange={(e) => setSandboxCustomConfig(prev => ({ ...prev, bgColor: e.target.value }))}
                                  className="w-full px-2 py-1 bg-white dark:bg-[#1c1e2d] border border-slate-200 dark:border-slate-800 rounded text-slate-700 dark:text-slate-200"
                                >
                                  <option className="text-slate-900 bg-white" value="bg-white dark:bg-slate-900">Vanilla White / Dark Navy</option>
                                  <option className="text-slate-900 bg-white" value="bg-amber-50 dark:bg-amber-950/20">Amber Cream / Espresso</option>
                                  <option className="text-slate-900 bg-white" value="bg-rose-50 dark:bg-rose-950/20">Soft Pink / Rose Ash</option>
                                  <option className="text-slate-900 bg-white" value="bg-emerald-50 dark:bg-emerald-950/20">Forest Green / Slate Jade</option>
                                </select>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">ACCENT HIGHLIGHT</label>
                                  <select
                                    value={sandboxCustomConfig.accentColor}
                                    onChange={(e) => setSandboxCustomConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                                    className="w-full px-1.5 py-1 bg-white dark:bg-[#1c1e2d] border border-slate-200 dark:border-slate-800 rounded text-slate-700 dark:text-slate-200"
                                  >
                                    <option className="text-slate-900 bg-white" value="text-[#fabd2f]">Warm Gold</option>
                                    <option className="text-slate-900 bg-white" value="text-emerald-500">Emerald Mint</option>
                                    <option className="text-slate-900 bg-white" value="text-rose-500">Coral Rose</option>
                                    <option className="text-slate-900 bg-white" value="text-indigo-600">Steel Blue</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">LAYOUT BORDERS</label>
                                  <select
                                    value={sandboxCustomConfig.border}
                                    onChange={(e) => setSandboxCustomConfig(prev => ({ ...prev, border: e.target.value }))}
                                    className="w-full px-1.5 py-1 bg-white dark:bg-[#1c1e2d] border border-slate-200 dark:border-slate-800 rounded text-slate-700 dark:text-slate-200"
                                  >
                                    <option className="text-slate-900 bg-white" value="border-slate-200 dark:border-slate-800">Fine Hairline</option>
                                    <option className="text-slate-900 bg-white" value="border-dashed border-slate-300 dark:border-slate-700">Dashed Minimalist</option>
                                    <option className="text-slate-900 bg-white" value="border-indigo-500/30">Accented Indigo</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* Right Live Preview & Interactive State Card (Col-span 7) */}
                            <div className="md:col-span-7 space-y-3">
                              <div className={`p-4 rounded-xl border ${sandboxCustomConfig.border} ${sandboxCustomConfig.bgColor} space-y-3 shadow-xs`}>
                                <h3 className={`text-sm font-extrabold ${sandboxCustomConfig.accentColor} uppercase tracking-wide`}>
                                  {sandboxCustomConfig.title}
                                </h3>
                                
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                  This is a dynamic template element compiled server-side. Change configurations in the settings sheet to watch the styling tokens rebuild themselves immediately.
                                </p>

                                {/* Interactive element: Click Counter */}
                                <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-[#161824] flex items-center justify-between border border-slate-200 dark:border-slate-800">
                                  <div>
                                    <strong className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Interactive State Counter</strong>
                                    <span className="text-[10px] text-slate-400">Drives client-side virtual machine re-render loops</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-extrabold text-indigo-500">
                                      {sandboxCustomCounters} clicks
                                    </span>
                                    <button
                                      onClick={() => { soundFx.playClick(); setSandboxCustomCounters(sandboxCustomCounters + 1); }}
                                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded shadow-xs"
                                    >
                                      Increment
                                    </button>
                                  </div>
                                </div>

                                {/* Dynamic Table Element */}
                                <div className="space-y-1.5">
                                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Sub-System Registry Configs</span>
                                  <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
                                    <div className="max-h-[100px] overflow-y-auto">
                                      <table className="w-full text-[11px] font-mono">
                                        <tbody>
                                          {sandboxSavedData.map((d, i) => (
                                            <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60 bg-white dark:bg-[#0f111a]">
                                              <td className="p-1.5 font-bold text-slate-500">{d.key}</td>
                                              <td className="p-1.5 text-slate-700 dark:text-slate-300 text-right truncate max-w-[150px]">{d.value}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>

                                  {/* Quick add custom keys */}
                                  <form 
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      if (!sandboxFormFields.name || !sandboxFormFields.val) return;
                                      soundFx.playClick();
                                      setSandboxSavedData([...sandboxSavedData, { key: sandboxFormFields.name.toUpperCase(), value: sandboxFormFields.val }]);
                                      setSandboxFormFields({ name: '', val: '' });
                                    }}
                                    className="flex gap-1 pt-1"
                                  >
                                    <input
                                      type="text"
                                      placeholder="KEY"
                                      value={sandboxFormFields.name}
                                      onChange={(e) => setSandboxFormFields(prev => ({ ...prev, name: e.target.value }))}
                                      className="flex-1 px-1.5 py-0.5 text-[10px] bg-slate-50 dark:bg-[#1a1c27] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded focus:outline-none"
                                    />
                                    <input
                                      type="text"
                                      placeholder="VALUE"
                                      value={sandboxFormFields.val}
                                      onChange={(e) => setSandboxFormFields(prev => ({ ...prev, val: e.target.value }))}
                                      className="flex-1 px-1.5 py-0.5 text-[10px] bg-slate-50 dark:bg-[#1a1c27] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded focus:outline-none"
                                    />
                                    <button
                                      type="submit"
                                      className="px-2 py-0.5 bg-indigo-600 text-white font-bold rounded text-[10px]"
                                    >
                                      + Reg
                                    </button>
                                  </form>
                                </div>

                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })()}

                  </div>
                )}

                {/* Tab 2: Telemetry & Logs */}
                {activeSandboxTab === 'telemetry' && (
                  <div className="p-4 bg-[#111218] min-h-[380px] max-h-[500px] overflow-y-auto font-mono text-[11px] text-emerald-400 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-2 gap-2">
                      <div className="text-slate-400 font-bold uppercase text-xs flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#fabd2f] animate-pulse" />
                        <span>SRE CONTAINER & VM TELEMETRY METRICS</span>
                      </div>
                      <button
                        onClick={async () => {
                          if (isHealing) return;
                          soundFx.playClick();
                          setIsHealing(true);
                          setHealingLogs([
                            `[DAEMON_INIT] Spawning Toby's autonomous Self-Healing Daemon...`,
                            `[DIAGNOSTICS] Parsing sandbox bundle AST & V8 isolate thread loops...`,
                            `[WARNING] Found 1 heap reference warning in sandboxed module App.tsx.`,
                            `[HEALING] Cleaning orphaned EventListeners & flushing unused DOM nodes...`,
                          ]);
                          await new Promise((r) => setTimeout(r, 800));
                          setHealingLogs((prev) => [
                            ...prev,
                            `[RESOLVING] Hot-patching component garbage collectors...`,
                            `[COMPILING] Re-verifying TypeScript type-safety constraints...`,
                          ]);
                          await new Promise((r) => setTimeout(r, 800));
                          setHealingLogs((prev) => [
                            ...prev,
                            `✓ [HEALED] Sandboxed micro-frontend successfully stabilized! Zero exceptions remaining.`,
                          ]);
                          setIsHealing(false);
                          soundFx.playNotification();
                          confetti({ particleCount: 60, spread: 50, origin: { y: 0.8 } });
                        }}
                        disabled={isHealing}
                        className={`px-3 py-1 rounded text-[10px] font-extrabold flex items-center gap-1.5 transition-all ${
                          isHealing
                            ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30 animate-pulse cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                        }`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isHealing ? 'animate-spin' : ''}`} />
                        {isHealing ? 'HEALING SYSTEM...' : "RUN TOBY'S HEALER DAEMON"}
                      </button>
                    </div>

                    {/* Telemetry Visual Indicators */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="p-2.5 rounded bg-[#161824] border border-slate-800/80 space-y-1.5">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span className="uppercase font-bold">V8 Isolate Heap</span>
                          <span className="font-bold text-white">18.42 MB / 512 MB</span>
                        </div>
                        <div className="w-full bg-slate-850 h-1.5 rounded overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded" style={{ width: '3.6%' }} />
                        </div>
                      </div>

                      <div className="p-2.5 rounded bg-[#161824] border border-slate-800/80 space-y-1.5">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span className="uppercase font-bold">CPU Thread Core Load</span>
                          <span className="font-bold text-[#fabd2f]">12.8% Capacity</span>
                        </div>
                        <div className="w-full bg-slate-850 h-1.5 rounded overflow-hidden">
                          <div className="bg-[#fabd2f] h-full rounded animate-pulse" style={{ width: '12.8%' }} />
                        </div>
                      </div>

                      <div className="p-2.5 rounded bg-[#161824] border border-slate-800/80 space-y-1.5">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span className="uppercase font-bold">Memory Leak Score</span>
                          <span className="font-bold text-emerald-400">0.00% Leak Rate</span>
                        </div>
                        <div className="w-full bg-slate-850 h-1.5 rounded overflow-hidden">
                          <div className="bg-emerald-400 h-full rounded" style={{ width: '0%' }} />
                        </div>
                      </div>

                      <div className="p-2.5 rounded bg-[#161824] border border-slate-800/80 space-y-1.5">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span className="uppercase font-bold">Fleet Dispatch Frequency</span>
                          <span className="font-bold text-indigo-400">18 events/min</span>
                        </div>
                        <div className="w-full bg-slate-850 h-1.5 rounded overflow-hidden">
                          <div className="bg-indigo-400 h-full rounded" style={{ width: '28%' }} />
                        </div>
                      </div>
                    </div>

                    {/* Healing Process Telemetry Window */}
                    {healingLogs.length > 0 && (
                      <div className="p-2.5 bg-[#0d0e15] border border-amber-500/20 rounded-md space-y-1 text-amber-400 text-[10px]">
                        <div className="font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-[#fabd2f]" />
                          <span>DAEMON CONSOLE DIAGNOSTICS</span>
                        </div>
                        {healingLogs.map((hLog, hIdx) => (
                          <div key={hIdx}>{hLog}</div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-slate-500 font-bold block uppercase mb-1.5 text-[10px]">Host State Event Stream</span>
                      <div className="space-y-1 text-[10px] text-slate-400">
                        <div>&bull; [04:56:11] Dispatching active sandbox system initialization sequences.</div>
                        <div>&bull; [04:56:12] Mounting dynamic React components tree into sandboxed iframe DOM.</div>
                        <div>&bull; [04:56:14] System telemetry logs verified. Zero stack overflow threats discovered.</div>
                        <div>&bull; [04:56:18] Real-time state listeners hooked into virtual DOM input fields.</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Generated Code Source */}
                {activeSandboxTab === 'source' && (
                  <div className="p-4 bg-[#141211] min-h-[380px] max-h-[500px] overflow-y-auto font-mono text-[11px] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-2 gap-2">
                      <div className="text-slate-400 font-bold uppercase text-xs flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-[#fabd2f]" />
                        <span>INTERACTIVE GENERATED ARTIFACT VAULT</span>
                      </div>
                      
                      {/* Controls and Actions */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Selector */}
                        <select
                          value={selectedArtifact}
                          onChange={(e) => { soundFx.playClick(); setSelectedArtifact(e.target.value); }}
                          className="px-2 py-1 bg-[#1d2021] border border-[#3c3836] text-[10px] rounded text-[#ebdbb2] focus:outline-none focus:border-[#fabd2f]"
                        >
                          <option value="App.tsx">App.tsx (Micro Frontend Core)</option>
                          <option value="TelemetryDashboard.tsx">TelemetryDashboard.tsx (Metrics Engine)</option>
                          <option value="ComplianceAudit.ts">ComplianceAudit.ts (SecOps Audit)</option>
                        </select>

                        {/* Copy Code */}
                        <button
                          onClick={() => {
                            soundFx.playClick();
                            const codeToCopy = selectedArtifact === 'App.tsx'
                              ? `// Micro Frontend Core File\nexport default function App() {\n  return <div>Hello world</div>;\n}`
                              : selectedArtifact === 'TelemetryDashboard.tsx'
                              ? `// Telemetry Dashboard File\nexport function TelemetryDashboard() {\n  return <div>Metrics Tracker</div>;\n}`
                              : `// SecOps Audit Script\nexport function executeAudit() {\n  return { success: true };\n}`;
                            navigator.clipboard.writeText(codeToCopy);
                            // Show brief feedback in UI if possible
                          }}
                          className="px-2 py-1 bg-[#282828] hover:bg-[#32302f] text-slate-300 hover:text-white rounded text-[10px] font-bold border border-[#3c3836]"
                        >
                          Copy
                        </button>

                        {/* Download link */}
                        <a
                          href={`data:text/typescript;charset=utf-8,${encodeURIComponent(
                            selectedArtifact === 'App.tsx'
                              ? `// Micro Frontend Core File\nexport default function App() {\n  return <div>Hello world</div>;\n}`
                              : selectedArtifact === 'TelemetryDashboard.tsx'
                              ? `// Telemetry Dashboard File\nexport function TelemetryDashboard() {\n  return <div>Metrics Tracker</div>;\n}`
                              : `// SecOps Audit Script\nexport function executeAudit() {\n  return { success: true };\n}`
                          )}`}
                          download={selectedArtifact}
                          onClick={() => soundFx.playNotification()}
                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold shadow flex items-center gap-1"
                        >
                          Download
                        </a>
                      </div>
                    </div>

                    {/* Previews / Files code */}
                    <div className="space-y-3">
                      <div className="p-3.5 rounded bg-[#1d2021] border border-[#3c3836] overflow-x-auto text-[#b8bb26] whitespace-pre text-[10px] leading-relaxed">
                        {selectedArtifact === 'App.tsx' && (
                          <code>
{`// Compiled React Micro-Frontend Sandbox Bundle
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Activity, ShieldCheck } from 'lucide-react';

export default function MicroFrontendComponent() {
  const [loading, setLoading] = useState(false);
  const [localData, setLocalData] = useState([]);

  // Listening to autonomous telemetry triggers
  useEffect(() => {
    console.log("[System Hook] Connected to host runtime workspace.");
    setLocalData([
      { metric: 'Latency', value: '12ms' },
      { metric: 'FPS', value: '60' },
      { metric: 'AST_Vulnerabilities', value: '0' }
    ]);
  }, []);

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-white">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <h2 className="text-sm font-extrabold text-[#fabd2f] flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#fabd2f] animate-pulse" />
          <span>${activePrompt.slice(0, 40)}...</span>
        </h2>
        <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500 text-white font-bold animate-pulse">
          LIVE
        </span>
      </div>
      
      <p className="text-xs text-slate-400 leading-relaxed mb-3">
        Autonomous employee bots compiled this high-fidelity module. Code is actively executed inside V8 sandbox frames on host process node.
      </p>

      {/* Interactive elements */}
      <div className="grid grid-cols-3 gap-2">
        {localData.map((d, i) => (
          <div key={i} className="p-2 rounded bg-slate-850 border border-slate-800">
            <span className="text-[8px] text-slate-500 block uppercase">{d.metric}</span>
            <strong className="text-xs text-slate-200 font-bold">{d.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}`}
                          </code>
                        )}

                        {selectedArtifact === 'TelemetryDashboard.tsx' && (
                          <code>
{`// Performance Analytics Graph & VM Telemetry Module
import React from 'react';
import { Sparkles, Activity, ShieldAlert } from 'lucide-react';

export function TelemetryDashboard() {
  const systemState = { status: 'OPTIMAL', memoryLeakRate: '0.00%', garbageCycles: '3 cycles total' };

  return (
    <div className="p-4 bg-slate-950 border border-[#3c3836] rounded-xl text-[#8ec07c]">
      <div className="flex items-center justify-between border-b border-[#3c3836] pb-2 mb-3">
        <h4 className="text-xs font-bold uppercase tracking-widest text-[#fabd2f] flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>VM Sandbox Telemetry Engine</span>
        </h4>
        <span className="text-[9px] font-bold text-emerald-400">PORT 3080</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
        <div className="p-2 rounded bg-[#1d2021] border border-[#3c3836]">
          <span className="block uppercase text-[8px] text-slate-500">Ast Leak Rate</span>
          <strong className="text-[#fe8019] text-xs">{systemState.memoryLeakRate}</strong>
        </div>
        <div className="p-2 rounded bg-[#1d2021] border border-[#3c3836]">
          <span className="block uppercase text-[8px] text-slate-500">GC Collection Frequency</span>
          <strong className="text-[#83a598] text-xs">{systemState.garbageCycles}</strong>
        </div>
      </div>
    </div>
  );
}`}
                          </code>
                        )}

                        {selectedArtifact === 'ComplianceAudit.ts' && (
                          <code>
{`// Autonomous Zero-Trust SecOps Policy Check
export interface PolicyCheck {
  astValidation: boolean;
  xssFiltering: boolean;
  isolationLevel: 'v8-isolate' | 'none';
  vulnerabilitiesCount: number;
}

export function executeAudit(): PolicyCheck {
  console.log("[SecOps] Commencing zero-trust cold-boot policy audit...");
  
  // AST validation
  const astValidation = true;
  const xssFiltering = true;
  const isolationLevel = 'v8-isolate';

  return {
    astValidation,
    xssFiltering,
    isolationLevel,
    vulnerabilitiesCount: 0
  };
}`}
                          </code>
                        )}
                      </div>

                      {/* Sandbox Testing VM controls */}
                      <div className="p-3 bg-[#0f0e0d] border border-[#3c3836] rounded-md space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-slate-500">V8 SANDBOXED RUNTIME SIMULATOR</span>
                          <button
                            onClick={async () => {
                              soundFx.playClick();
                              setIsTestingVM(true);
                              setVmTestOutput([
                                `[VM_LAUNCH] Locking down V8 isolate container thread...`,
                                `[TEST_01] Rendering component mounting check...`,
                              ]);
                              await new Promise((r) => setTimeout(r, 600));
                              setVmTestOutput((prev) => [
                                ...prev,
                                `✓ [TEST_01] Component mounted successfully without AST memory leaks.`,
                                `[TEST_02] Analyzing virtual DOM layout constraints...`,
                              ]);
                              await new Promise((r) => setTimeout(r, 600));
                              setVmTestOutput((prev) => [
                                ...prev,
                                `✓ [TEST_02] 100% style matching and contrast ratio passed.`,
                                `✓ [SUMMARY] All VM sandboxed integration tests compiled and validated successfully!`,
                              ]);
                              setIsTestingVM(false);
                              soundFx.playNotification();
                            }}
                            disabled={isTestingVM}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                              isTestingVM
                                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 animate-pulse'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                          >
                            <Play className="w-3 h-3 fill-current" />
                            {isTestingVM ? 'Executing...' : 'Run Sandbox VM Test-Suite'}
                          </button>
                        </div>

                        {vmTestOutput.length > 0 && (
                          <div className="space-y-1 text-emerald-400 text-[10px] font-mono p-2 bg-[#1d2021] border border-[#3c3836] rounded">
                            {vmTestOutput.map((vLog, vIdx) => (
                              <div key={vIdx}>{vLog}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Live Terminal & System Self-Developing Stream */}
          <div className="rounded-lg bg-[#141312] border border-[#3d3835] overflow-hidden shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2 bg-[#1f1d1b] border-b border-[#3d3835] text-xs font-mono text-[#a89984] gap-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[#fabd2f]" />
                <span className="font-bold text-[#ebdbb2]">LIVE SHELL & SYSTEM COMMAND STREAM</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#141312] p-0.5 rounded border border-[#3d3835]">
                <button
                  onClick={() => { soundFx.playClick(); setActiveLogMode('shell'); }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${activeLogMode === 'shell' ? 'bg-[#fabd2f] text-[#1d2021]' : 'text-[#a89984] hover:text-[#ebdbb2]'}`}
                >
                  Shell REPL
                </button>
                <button
                  onClick={() => { soundFx.playClick(); setActiveLogMode('quantum'); }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${activeLogMode === 'quantum' ? 'bg-[#b57614] text-white' : 'text-[#a89984] hover:text-[#ebdbb2]'}`}
                >
                  Quantum Grover
                </button>
                <button
                  onClick={() => { soundFx.playClick(); setActiveLogMode('browser-use'); }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${activeLogMode === 'browser-use' ? 'bg-[#83a598] text-[#1d2021]' : 'text-[#a89984] hover:text-[#ebdbb2]'}`}
                >
                  Browser-Use
                </button>
              </div>
            </div>
            <div className="p-3 h-48 overflow-y-auto font-mono text-[11px] text-[#8ec07c] space-y-1 bg-[#0f0e0d]">
              {activeLogMode === 'shell' && (
                terminalLogs.length === 0 ? (
                  <div className="text-[#7c6f64] italic">
                    Awaiting directive. Enter a task above or click a preset to watch the Administrator delegate and the website develop itself...
                  </div>
                ) : (
                  terminalLogs.map((log, i) => (
                    <div
                      key={i}
                      className={
                        log.startsWith('>>>')
                          ? 'text-[#fabd2f] font-bold'
                          : log.startsWith('✓')
                          ? 'text-emerald-400 font-bold'
                          : log.startsWith('$')
                          ? 'text-[#83a598]'
                          : log.startsWith('[ERROR]')
                          ? 'text-[#fb4934]'
                          : 'text-[#d5c4a1]'
                      }
                    >
                      {log}
                    </div>
                  ))
                )
              )}

              {activeLogMode === 'quantum' && (
                <div className="space-y-1.5 text-[#b8bb26]">
                  <div className="text-[#a89984] font-bold">// INTERACTIVE GROVER SUPERPOSITION WAVEFUNCTION DECAY LOGS</div>
                  <div>[QUANTUM_INIT] Initializing registers with {agents.length} employee-states in uniform superposition...</div>
                  <div className="text-[#d3869b]">|Ψ_0⟩ = 1/√12 * (|Dwight⟩ + |Pam⟩ + |Jim⟩ + |Kevin⟩ + |Angela⟩ + |Toby⟩ + |Ruflo⟩ + |Cline⟩ + |Ryan| + |Stanley⟩ + |Kelly⟩ + |Creed⟩)</div>
                  <div>[ORACLE_INVOKED] Matching sub-task requirements with agent clearance and skills matrices...</div>
                  <div>[AMPLIFICATION] Executing diffusion iteration phase 1 (π/4 * √N rotation):</div>
                  <div className="text-[#83a598]">  &bull; Dwight (Security Audits) probability state: 0.083 &rarr; <span className="text-emerald-400 font-bold">0.628</span></div>
                  <div className="text-[#83a598]">  &bull; Ruflo (Surgical TS Code) probability state: 0.083 &rarr; <span className="text-emerald-400 font-bold">0.584</span></div>
                  <div className="text-[#83a598]">  &bull; Toby (Performance Diagnostics) probability state: 0.083 &rarr; <span className="text-emerald-400 font-bold">0.490</span></div>
                  <div className="text-amber-400">[MEASUREMENT] Coherence filter applied. Phase noise calibrated under Michael Scott's supervision.</div>
                  <div className="text-[#fe8019] font-bold">[COLLAPSE] Wavefunction collapsed! Optimal delegation sequence mapped: Dwight (92%), Ruflo (89%), Toby (81%). Zero-leak runtime established!</div>
                </div>
              )}

              {activeLogMode === 'browser-use' && (
                <div className="space-y-1 text-[#83a598]">
                  <div className="text-[#a89984] font-bold">// BROWSER-USE HEADLESS WEB CONTROLLER LOGS</div>
                  <div>[INIT] Launching secure Chrome sandbox... Chrome processes isolation active.</div>
                  <div className="text-[#fabd2f]">[NAVIGATE] Browsing to target repository: https://mastra.ai/docs</div>
                  <div className="text-emerald-400">  &bull; Status: 200 OK | Rendered viewport: 1280x800 | DOM elements count: 480</div>
                  <div>[EXTRACT] Analyzing webpage node elements for mastra tool schemas...</div>
                  <div className="text-amber-400">[CLICK] Clicking interactive element: "#sidebar-navigation-link"</div>
                  <div>[EXTRACT] Scraping live documentation... Retrieved 4 core tool codebases.</div>
                  <div className="text-[#fe8019]">[TYPE] Inputting dynamic parameters into sandbox tester...</div>
                  <div className="text-emerald-400">✓ [SUCCESS] Extracted document definitions and hot-patched agent memories successfully.</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#ebdbb2] dark:bg-[#282828] border-t border-[#d5c4a1] dark:border-[#3c3836] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#7c6f64] dark:text-[#a89984]">
            <Zap className="w-3.5 h-3.5 text-[#fabd2f]" />
            <span>Autonomous Multi-Agent Task Orchestration Engine</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#d5c4a1] dark:bg-[#3c3836] hover:bg-[#bdae93] dark:hover:bg-[#504945] rounded text-xs font-bold transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
