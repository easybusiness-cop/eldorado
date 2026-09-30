import React, { useState, useEffect, useRef } from 'react';
import { soundFx } from '../utils/speech';
import {
  AlertTriangle,
  Flame,
  Zap,
  ShieldCheck,
  Activity,
  CheckCircle2,
  X,
  Cpu,
  Server,
  Database,
  RefreshCw,
  Play,
  Download,
  ExternalLink,
  FileCode,
  Folder,
  ChevronRight,
  ChevronDown,
  Terminal,
  Layers,
  Radio,
  Clock,
  Sparkles,
  ArrowRight,
  Check,
  Code,
  ShieldAlert,
} from 'lucide-react';

export interface ChaosScenario {
  id: string;
  name: string;
  category: 'cloud_infra' | 'api_mesh' | 'workforce_queue' | 'database' | 'runtime';
  severity: 'LOW' | 'HIGH' | 'CRITICAL' | 'CATASTROPHIC';
  description: string;
  affectedComponents: string[];
  symptoms: string[];
  blastRadiusPercent: number;
  initialHealthDrop: number;
  errorRateSpike: number;
  latencySpikeMs: number;
  primaryResponders: {
    name: string;
    role: string;
    avatar?: string;
  }[];
  patchFile: {
    path: string;
    name: string;
    description: string;
    code: string;
  };
  sampleAgentDialogue: {
    agent: string;
    role: string;
    phase: 'detect' | 'analyze' | 'plan' | 'patch' | 'verify';
    message: string;
    quantumState: string;
    timestampOffsetSec: number;
  }[];
  rfcPlan: {
    incidentId: string;
    rootCause: string;
    blastRadius: string;
    hotfixStrategy: string;
    regressionMitigation: string;
  };
}

interface CrisisSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenIdeWithCode?: (code: string, name: string) => void;
  onCodeApplied?: (module: any) => void;
  onTriggerManualHeal?: () => Promise<void>;
}

export const CrisisSimulationModal: React.FC<CrisisSimulationModalProps> = ({
  isOpen,
  onClose,
  onOpenIdeWithCode,
  onCodeApplied,
  onTriggerManualHeal,
}) => {
  const [scenarios, setScenarios] = useState<ChaosScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('firebase_sync_failure');
  const [severity, setSeverity] = useState<'LOW' | 'HIGH' | 'CRITICAL' | 'CATASTROPHIC'>('CRITICAL');
  const [activeTab, setActiveTab] = useState<'cockpit' | 'scenarios' | 'explorer' | 'postmortem'>('cockpit');

  // Active Simulation Runtime State
  const [isOutageActive, setIsOutageActive] = useState<boolean>(false);
  const [simulationStage, setSimulationStage] = useState<
    'nominal' | 'outage_injected' | 'quantum_telemetry' | 'rfc_planned' | 'patch_deployed' | 'verified'
  >('nominal');
  const [healthScore, setHealthScore] = useState<number>(99.8);
  const [errorRate, setErrorRate] = useState<number>(0.02);
  const [latencyMs, setLatencyMs] = useState<number>(24);
  const [injectedAt, setInjectedAt] = useState<number | null>(null);
  const [recoveredAt, setRecoveredAt] = useState<number | null>(null);

  // Live Agent Dialogue & Timeline
  const [visibleDialogueCount, setVisibleDialogueCount] = useState<number>(0);
  const [isAutoProgressing, setIsAutoProgressing] = useState<boolean>(true);
  const [isDeployingPatch, setIsDeployingPatch] = useState<boolean>(false);
  const [deployStep, setDeployStep] = useState<number>(0);
  const [logs, setLogs] = useState<{ id: string; timestamp: string; level: string; message: string }[]>([]);

  // File Explorer State
  const [selectedFilePath, setSelectedFilePath] = useState<string>('src/patches/firebase_resilience_circuit_breaker.ts');
  const [treeExpanded, setTreeExpanded] = useState<Record<string, boolean>>({
    'src': true,
    'src/patches': true,
    'src/services': true,
  });

  const timerRef = useRef<any>(null);

  // Fetch scenarios from API or fallback
  useEffect(() => {
    const loadScenarios = async () => {
      try {
        const res = await fetch('/api/chaos/scenarios');
        if (res.ok) {
          const data = await res.json();
          if (data.scenarios && data.scenarios.length > 0) {
            setScenarios(data.scenarios);
            if (data.activeState && data.activeState.isOutageActive) {
              setIsOutageActive(true);
              setSimulationStage(data.activeState.stage);
              setSelectedScenarioId(data.activeState.activeScenario.id);
              setHealthScore(data.activeState.healthScore);
              setErrorRate(data.activeState.errorRate);
              setLatencyMs(data.activeState.latencyMs);
              setSelectedFilePath(data.activeState.activeScenario.patchFile.path);
            }
          }
        }
      } catch (err) {
        console.warn('Chaos API load failed, using local scenarios', err);
      }
    };

    if (isOpen) {
      loadScenarios();
    }
  }, [isOpen]);

  const activeScenario =
    scenarios.find((s) => s.id === selectedScenarioId) ||
    scenarios[0] ||
    null;

  // Sync selected file path when scenario changes
  useEffect(() => {
    if (activeScenario && !isOutageActive) {
      setSelectedFilePath(activeScenario.patchFile.path);
    }
  }, [selectedScenarioId, activeScenario, isOutageActive]);

  // Stepped autonomous agent conversation progression
  useEffect(() => {
    if (isOutageActive && activeScenario && isAutoProgressing) {
      const maxDialogue = activeScenario.sampleAgentDialogue.length;
      if (visibleDialogueCount < maxDialogue) {
        timerRef.current = setTimeout(() => {
          setVisibleDialogueCount((prev) => {
            const next = prev + 1;
            soundFx.playClick();
            if (next >= 2 && simulationStage === 'outage_injected') {
              setSimulationStage('quantum_telemetry');
            }
            if (next >= 3 && simulationStage === 'quantum_telemetry') {
              setSimulationStage('rfc_planned');
            }
            return next;
          });
        }, 1800);
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOutageActive, visibleDialogueCount, activeScenario, isAutoProgressing, simulationStage]);

  if (!isOpen) return null;

  // 1. INJECT CHAOS OUTAGE
  const handleInjectOutage = async () => {
    if (!activeScenario) return;
    soundFx.playError();
    setIsOutageActive(true);
    setSimulationStage('outage_injected');
    setInjectedAt(Date.now());
    setRecoveredAt(null);
    setVisibleDialogueCount(1);
    setIsAutoProgressing(true);

    const dropModifier = severity === 'CATASTROPHIC' ? 1.2 : severity === 'HIGH' ? 1.0 : 0.7;
    const targetHealth = Math.max(14, Number((100 - activeScenario.initialHealthDrop * dropModifier).toFixed(1)));
    const targetError = Number((activeScenario.errorRateSpike * dropModifier).toFixed(1));
    const targetLatency = Math.round(activeScenario.latencySpikeMs * dropModifier);

    setHealthScore(targetHealth);
    setErrorRate(targetError);
    setLatencyMs(targetLatency);
    setSelectedFilePath(activeScenario.patchFile.path);

    const now = new Date().toLocaleTimeString();
    setLogs([
      {
        id: `chaos-err-${Date.now()}`,
        timestamp: now,
        level: 'error',
        message: `🚨 [CHAOS TRIGGERED] ${activeScenario.name} injected at ${severity} severity.`,
      },
      {
        id: `chaos-blast-${Date.now()}`,
        timestamp: now,
        level: 'warn',
        message: `Blast Radius: ~${activeScenario.blastRadiusPercent}%. Impacted: ${activeScenario.affectedComponents.join(', ')}`,
      },
    ]);

    setActiveTab('cockpit');

    try {
      await fetch('/api/chaos/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: activeScenario.id, severity }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // 2. AUTO-DEPLOY PATCH (CLOSED-LOOP RESTORATION)
  const handleAutoDeployPatch = async () => {
    if (!activeScenario) return;
    soundFx.playClick();
    setIsDeployingPatch(true);
    setDeployStep(1);

    // Step 1: Sandbox validation
    setTimeout(() => {
      setDeployStep(2);
      soundFx.playClick();
    }, 600);

    // Step 2: Runtime Hot-reload
    setTimeout(() => {
      setDeployStep(3);
      soundFx.playClick();
    }, 1300);

    // Step 3: Verify and complete
    setTimeout(async () => {
      setDeployStep(4);
      soundFx.playNotification();
      setIsDeployingPatch(false);
      setIsOutageActive(false);
      setSimulationStage('verified');
      setRecoveredAt(Date.now());
      setHealthScore(99.9);
      setErrorRate(0.01);
      setLatencyMs(22);
      setVisibleDialogueCount(activeScenario.sampleAgentDialogue.length);

      const now = new Date().toLocaleTimeString();
      setLogs((prev) => [
        {
          id: `chaos-resolved-${Date.now()}`,
          timestamp: now,
          level: 'success',
          message: `✅ [CLOSED-LOOP RECOVERED] Patch ${activeScenario.patchFile.name} deployed. System 100% nominal.`,
        },
        ...prev,
      ]);

      try {
        const res = await fetch('/api/chaos/deploy-patch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.appliedModule && onCodeApplied) {
            onCodeApplied(data.appliedModule);
          }
        }
      } catch (e) {
        console.error(e);
      }

      if (onTriggerManualHeal) {
        onTriggerManualHeal();
      }
    }, 2200);
  };

  // 3. RESET SIMULATION
  const handleResetSystem = async () => {
    soundFx.playClick();
    setIsOutageActive(false);
    setSimulationStage('nominal');
    setHealthScore(99.8);
    setErrorRate(0.02);
    setLatencyMs(24);
    setInjectedAt(null);
    setRecoveredAt(null);
    setVisibleDialogueCount(0);
    setDeployStep(0);
    setLogs([]);

    try {
      await fetch('/api/chaos/reset', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  // Download Post-Mortem Report
  const handleDownloadPostMortem = () => {
    if (!activeScenario) return;
    soundFx.playClick();
    const markdown = `# Incident Post-Mortem: ${activeScenario.rfcPlan.incidentId}
**Incident Title:** ${activeScenario.name}
**Severity:** ${severity}
**Status:** RESOLVED (Closed-Loop Autonomous Healing)
**Triggered At:** ${injectedAt ? new Date(injectedAt).toISOString() : 'N/A'}
**Restored At:** ${recoveredAt ? new Date(recoveredAt).toISOString() : 'N/A'}
**Duration:** ${injectedAt && recoveredAt ? `${Math.round((recoveredAt - injectedAt) / 1000)} seconds` : '38 seconds'}

## 1. Summary & Impact
- **Blast Radius:** ~${activeScenario.blastRadiusPercent}% of cluster workloads
- **Trough Fleet Health:** ${healthScore}%
- **Peak Error Rate:** ${errorRate}%
- **Max Latency:** ${latencyMs}ms
- **Affected Subsystems:** ${activeScenario.affectedComponents.join(', ')}

## 2. Root Cause Analysis (RCA)
${activeScenario.rfcPlan.rootCause}

## 3. Autonomous Remediation Strategy
${activeScenario.rfcPlan.hotfixStrategy}

## 4. Deployed Patch
- **Path:** \`${activeScenario.patchFile.path}\`
- **Module:** ${activeScenario.patchFile.name}
- **Responders:** ${activeScenario.primaryResponders.map((r) => `${r.name} (${r.role})`).join(', ')}

\`\`\`typescript
${activeScenario.patchFile.code}
\`\`\`

## 5. Regression Safeguards
${activeScenario.rfcPlan.regressionMitigation}

---
*Generated by Rufflo Quantum Autonomous Company OS - Chaos Engineering Daemon*
`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PostMortem_${activeScenario.rfcPlan.incidentId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const allAvailablePatchFiles = scenarios.map((s) => ({
    path: s.patchFile.path,
    name: s.patchFile.name,
    scenarioId: s.id,
    code: s.patchFile.code,
    description: s.patchFile.description,
  }));

  const activeFile =
    allAvailablePatchFiles.find((f) => f.path === selectedFilePath) ||
    allAvailablePatchFiles[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs font-mono select-none p-2 sm:p-4">
      <div className="w-full max-w-6xl bg-[#1d2021] border-2 border-[#fabd2f] rounded-lg shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[850px] animate-in zoom-in-95 duration-200 text-[#ebdbb2]">
        {/* Top Header HUD */}
        <div className="px-4 py-2.5 bg-[#282828] border-b border-[#3c3836] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-sm bg-[#fabd2f]/10 border border-[#fabd2f]/30">
              <Flame className="w-4 h-4 text-[#fabd2f] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-[#ebdbb2]">
                  RUFFLO CHAOS LAB // CRISIS OUTAGE INJECTOR
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-[#fabd2f]/20 text-[#fabd2f] border border-[#fabd2f]/40">
                  AUTONOMOUS HEALING HARNESS
                </span>
              </div>
              <div className="text-[10px] text-[#a89984] flex items-center gap-2">
                <span>Real-time closed-loop failure injection & quantum patch deployment</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* System Status Pill */}
            {isOutageActive ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-red-950/80 border border-red-500 text-red-400 text-xs font-bold animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>P0 CRITICAL OUTAGE ACTIVE</span>
              </div>
            ) : simulationStage === 'verified' ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-emerald-950/80 border border-emerald-500 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>SYSTEM RESTORED (100% NOMINAL)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#1d2021] border border-[#504945] text-emerald-400 text-xs font-bold">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>STATUS: NOMINAL (STABLE)</span>
              </div>
            )}

            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-1 hover:text-red-400 rounded text-[#a89984] hover:bg-[#3c3836] transition-colors"
              title="Close Chaos Lab"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tab Bar */}
        <div className="px-4 py-2 bg-[#181615] border-b border-[#3c3836] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('cockpit');
              }}
              className={`px-3 py-1.5 rounded-sm font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'cockpit'
                  ? 'bg-[#fabd2f] text-[#1d2021]'
                  : 'text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#282828]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Incident Cockpit & Telemetry</span>
              {isOutageActive && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('scenarios');
              }}
              className={`px-3 py-1.5 rounded-sm font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'scenarios'
                  ? 'bg-[#fabd2f] text-[#1d2021]'
                  : 'text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#282828]'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-[#fb4934]" />
              <span>Inject Failure Scenarios ({scenarios.length})</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('explorer');
              }}
              className={`px-3 py-1.5 rounded-sm font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'explorer'
                  ? 'bg-[#fabd2f] text-[#1d2021]'
                  : 'text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#282828]'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-[#8ec07c]" />
              <span>Live File Explorer & Code Patches</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('postmortem');
              }}
              className={`px-3 py-1.5 rounded-sm font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'postmortem'
                  ? 'bg-[#fabd2f] text-[#1d2021]'
                  : 'text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#282828]'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-[#83a598]" />
              <span>Post-Mortem & RFC Audit</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isOutageActive && (
              <button
                onClick={handleAutoDeployPatch}
                disabled={isDeployingPatch}
                className="px-3 py-1.5 rounded-sm bg-emerald-500 text-black font-bold flex items-center gap-1.5 hover:bg-emerald-400 active:scale-95 transition-transform shadow-lg shadow-emerald-500/20"
              >
                <Zap className="w-3.5 h-3.5 fill-black" />
                <span>{isDeployingPatch ? 'Deploying Hotfix...' : 'Auto-Deploy Hotfix'}</span>
              </button>
            )}

            <button
              onClick={handleResetSystem}
              className="px-2.5 py-1.5 rounded-sm border border-[#504945] text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#282828] transition-colors flex items-center gap-1"
              title="Reset metrics to 100% baseline"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Live Metrics HUD Banner */}
        <div className="p-3 bg-[#181615] border-b border-[#3c3836] grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Health Gauge */}
          <div
            className={`p-2.5 rounded-sm border transition-colors ${
              healthScore < 50
                ? 'bg-red-950/40 border-red-500/60'
                : healthScore < 80
                ? 'bg-amber-950/40 border-amber-500/60'
                : 'bg-[#282828] border-[#3c3836]'
            }`}
          >
            <div className="text-[10px] text-[#a89984] font-bold uppercase flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Activity
                  className={`w-3 h-3 ${healthScore < 50 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}
                />
                FLEET HEALTH
              </span>
              <span className="text-[9px] text-[#7c6f64]">SLA Target: 99.9%</span>
            </div>
            <div
              className={`text-2xl font-black mt-0.5 tracking-tight ${
                healthScore < 50 ? 'text-red-400' : healthScore < 80 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {healthScore}%
            </div>
            <div className="w-full bg-[#1d2021] h-1.5 rounded-full overflow-hidden mt-1.5 border border-[#3c3836]">
              <div
                className={`h-full transition-all duration-700 ${
                  healthScore < 50 ? 'bg-red-500' : healthScore < 80 ? 'bg-amber-500' : 'bg-emerald-400'
                }`}
                style={{ width: `${healthScore}%` }}
              />
            </div>
          </div>

          {/* Error Rate */}
          <div
            className={`p-2.5 rounded-sm border transition-colors ${
              errorRate > 10 ? 'bg-red-950/40 border-red-500/60' : 'bg-[#282828] border-[#3c3836]'
            }`}
          >
            <div className="text-[10px] text-[#a89984] font-bold uppercase flex items-center justify-between">
              <span className="flex items-center gap-1">
                <AlertTriangle className={`w-3 h-3 ${errorRate > 10 ? 'text-red-400 animate-bounce' : 'text-[#7c6f64]'}`} />
                ERROR RATE
              </span>
              <span className="text-[9px] text-[#7c6f64]">Threshold: &lt;0.5%</span>
            </div>
            <div
              className={`text-2xl font-black mt-0.5 tracking-tight ${
                errorRate > 10 ? 'text-red-400' : 'text-[#ebdbb2]'
              }`}
            >
              {errorRate}%
            </div>
            <div className="text-[10px] text-[#7c6f64] mt-1 flex items-center justify-between">
              <span>Failures/sec</span>
              <span className={errorRate > 10 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                {errorRate > 10 ? 'CRITICAL HIGH' : 'NOMINAL'}
              </span>
            </div>
          </div>

          {/* Mean Cluster Latency */}
          <div
            className={`p-2.5 rounded-sm border transition-colors ${
              latencyMs > 500 ? 'bg-amber-950/40 border-amber-500/60' : 'bg-[#282828] border-[#3c3836]'
            }`}
          >
            <div className="text-[10px] text-[#a89984] font-bold uppercase flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#83a598]" />
                MEAN LATENCY
              </span>
              <span className="text-[9px] text-[#7c6f64]">Target: &lt;50ms</span>
            </div>
            <div
              className={`text-2xl font-black mt-0.5 tracking-tight ${
                latencyMs > 500 ? 'text-amber-400' : 'text-[#83a598]'
              }`}
            >
              {latencyMs}ms
            </div>
            <div className="text-[10px] text-[#7c6f64] mt-1 flex items-center justify-between">
              <span>Ingress p99</span>
              <span className={latencyMs > 500 ? 'text-amber-400 font-bold' : 'text-[#a89984]'}>
                {latencyMs * 2}ms
              </span>
            </div>
          </div>

          {/* Active Scenario / Circuit Breakers */}
          <div className="p-2.5 rounded-sm bg-[#282828] border border-[#3c3836]">
            <div className="text-[10px] text-[#a89984] font-bold uppercase flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Server className="w-3 h-3 text-[#fabd2f]" />
                INJECTOR TARGET
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#3c3836] text-[#fabd2f]">
                {severity}
              </span>
            </div>
            <div className="text-xs font-bold text-[#fabd2f] mt-1 truncate" title={activeScenario?.name}>
              {activeScenario?.name || 'Firebase Sync Failure'}
            </div>
            <div className="text-[10px] text-[#a89984] mt-1 flex items-center justify-between">
              <span>Blast Radius</span>
              <span className="text-red-400 font-bold">~{activeScenario?.blastRadiusPercent || 68}%</span>
            </div>
          </div>
        </div>

        {/* MAIN BODY VIEWPORT */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-[#1d2021]">
          {/* TAB 1: COCKPIT & LIVE TELEMETRY */}
          {activeTab === 'cockpit' && (
            <div className="p-4 flex flex-col gap-4">
              {/* Outage Injected Banner */}
              {isOutageActive ? (
                <div className="p-3.5 rounded-sm bg-gradient-to-r from-red-950/90 to-[#282828] border-2 border-red-500/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded bg-red-900/60 border border-red-500 animate-pulse text-red-300">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-sm bg-red-600 text-white font-black uppercase">
                          ACTIVE INCIDENT {activeScenario?.rfcPlan.incidentId}
                        </span>
                        <span className="text-xs font-bold text-red-400">
                          {activeScenario?.name}
                        </span>
                      </div>
                      <p className="text-xs text-[#ebdbb2] mt-1 max-w-2xl">
                        {activeScenario?.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-[#a89984]">
                        <span className="text-red-400 font-bold">Affected Components:</span>
                        {activeScenario?.affectedComponents.map((c) => (
                          <span
                            key={c}
                            className="px-1.5 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-red-300"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleAutoDeployPatch}
                      disabled={isDeployingPatch}
                      className="w-full sm:w-auto px-4 py-2 rounded-sm bg-emerald-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-emerald-400 active:scale-95 transition-all shadow-lg shadow-emerald-500/30"
                    >
                      <Zap className="w-4 h-4 fill-black" />
                      <span>{isDeployingPatch ? 'Compiling & Hot-Patching...' : 'Auto-Deploy Hotfix Patch'}</span>
                    </button>
                    <span className="text-[10px] text-[#7c6f64]">
                      Autonomous closed-loop resolution
                    </span>
                  </div>
                </div>
              ) : simulationStage === 'verified' ? (
                <div className="p-3.5 rounded-sm bg-gradient-to-r from-emerald-950/90 to-[#282828] border-2 border-emerald-500/80 flex items-center justify-between shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-emerald-900/60 border border-emerald-500 text-emerald-300">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-sm bg-emerald-500 text-black font-black uppercase">
                          INCIDENT RESTORED & CLOSED
                        </span>
                        <span className="text-xs font-bold text-emerald-400">
                          {activeScenario?.rfcPlan.incidentId} Resolved
                        </span>
                      </div>
                      <p className="text-xs text-[#ebdbb2] mt-1">
                        Hotfix <span className="font-bold text-emerald-300">{activeScenario?.patchFile.name}</span> deployed into active cluster runtime. All telemetry probes reporting 100% nominal green.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadPostMortem}
                      className="px-3 py-1.5 rounded-sm bg-[#3c3836] border border-[#504945] text-xs font-bold text-[#ebdbb2] hover:bg-[#504945] flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Post-Mortem</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('scenarios')}
                      className="px-3 py-1.5 rounded-sm bg-[#fabd2f] text-black text-xs font-bold hover:bg-[#fabd2f]/90 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Inject Next Scenario</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-sm bg-[#282828] border border-[#3c3836] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#ebdbb2] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>SYSTEM IN NOMINAL STATE // READY FOR CHAOS INJECTION</span>
                    </div>
                    <p className="text-[11px] text-[#a89984] mt-1">
                      Choose an outage failure scenario from the list to test closed-loop autonomous self-healing, real-time agent telemetry, and live patch deployment.
                    </p>
                  </div>
                  <button
                    onClick={handleInjectOutage}
                    className="px-4 py-2 rounded-sm bg-[#fb4934] text-white text-xs font-bold flex items-center gap-2 hover:bg-red-500 transition-colors shadow-lg shadow-red-500/20"
                  >
                    <Flame className="w-4 h-4" />
                    <span>INJECT OUTAGE NOW</span>
                  </button>
                </div>
              )}

              {/* Deployment Progress Bar if deploying */}
              {isDeployingPatch && (
                <div className="p-3 bg-[#181615] border border-emerald-500/50 rounded-sm flex flex-col gap-2 animate-pulse">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      AUTONOMOUS CODE DEPLOYMENT IN PROGRESS
                    </span>
                    <span>Step {deployStep} of 4</span>
                  </div>
                  <div className="w-full bg-[#282828] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-300"
                      style={{ width: `${(deployStep / 4) * 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-[#a89984]">
                    {deployStep === 1 && 'Running Zero-Trust Security Sandbox AST inspection...'}
                    {deployStep === 2 && 'Mounting hotfix to active backend execution broker...'}
                    {deployStep === 3 && 'Draining pending write queues and re-establishing live sockets...'}
                    {deployStep === 4 && 'Verifying synthetic probes and closing circuit breakers...'}
                  </div>
                </div>
              )}

              {/* Two Column Layout: Quantum Telemetry Thread & Active RFC Plan */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: Agent Quantum Telemetry Thread */}
                <div className="p-3 bg-[#282828] border border-[#3c3836] rounded-sm flex flex-col h-[400px]">
                  <div className="pb-2 mb-2 border-b border-[#3c3836] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#fabd2f]" />
                      <span className="font-bold text-xs uppercase tracking-wider text-[#ebdbb2]">
                        AGENT QUANTUM TELEMETRY THREAD
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-[#a89984]">
                        {visibleDialogueCount} / {activeScenario?.sampleAgentDialogue.length || 0} msgs
                      </span>
                      {isOutageActive && (
                        <button
                          onClick={() => {
                            if (activeScenario) {
                              setVisibleDialogueCount(activeScenario.sampleAgentDialogue.length);
                              setSimulationStage('rfc_planned');
                            }
                          }}
                          className="px-1.5 py-0.5 rounded bg-[#3c3836] text-[#fabd2f] hover:bg-[#504945]"
                        >
                          Show All
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
                    {visibleDialogueCount === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#7c6f64]">
                        <Cpu className="w-8 h-8 mb-2 opacity-40 text-[#a89984]" />
                        <p className="font-bold text-xs text-[#a89984]">Telemetry Channel Dormant</p>
                        <p className="text-[11px] mt-1 max-w-xs">
                          Inject an outage to watch autonomous agents awaken, debate root causes, and deploy hotfixes.
                        </p>
                      </div>
                    ) : (
                      activeScenario?.sampleAgentDialogue.slice(0, visibleDialogueCount).map((item, idx) => {
                        const isLatest = idx === visibleDialogueCount - 1;
                        return (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-sm border transition-all ${
                              isLatest
                                ? 'bg-[#1d2021] border-[#fabd2f]/60 shadow-md'
                                : 'bg-[#181615] border-[#3c3836]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-[#fabd2f]/20 border border-[#fabd2f]/40 flex items-center justify-center text-[10px] font-bold text-[#fabd2f]">
                                  {item.agent[0]}
                                </div>
                                <span className="font-bold text-[#ebdbb2] text-[11px]">
                                  {item.agent}
                                </span>
                                <span className="text-[9px] text-[#a89984]">
                                  ({item.role})
                                </span>
                              </div>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#282828] text-[#8ec07c] font-mono">
                                {item.phase.toUpperCase()}
                              </span>
                            </div>

                            <p className="text-[11px] text-[#d5c4a1] mt-1 leading-relaxed">
                              {item.message}
                            </p>

                            <div className="mt-2 pt-1 border-t border-[#3c3836]/60 flex items-center justify-between text-[9px] text-[#7c6f64]">
                              <span className="font-mono text-[#83a598]">
                                State: {item.quantumState}
                              </span>
                              <span>+00:0{item.timestampOffsetSec}s</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right: Incident RFC Plan & Live Code Patch Summary */}
                <div className="p-3 bg-[#282828] border border-[#3c3836] rounded-sm flex flex-col h-[400px]">
                  <div className="pb-2 mb-2 border-b border-[#3c3836] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-xs uppercase tracking-wider text-[#ebdbb2]">
                        INCIDENT RFC RESOLUTION & HOTFIX
                      </span>
                    </div>
                    {activeScenario && (
                      <span className="text-[10px] text-[#a89984]">
                        ID: {activeScenario.rfcPlan.incidentId}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                    {activeScenario ? (
                      <>
                        <div className="p-2.5 rounded bg-[#181615] border border-[#3c3836]">
                          <div className="text-[10px] font-bold text-[#fabd2f] uppercase mb-1">
                            1. Root Cause Analysis (RCA)
                          </div>
                          <p className="text-[11px] text-[#d5c4a1] leading-relaxed">
                            {activeScenario.rfcPlan.rootCause}
                          </p>
                        </div>

                        <div className="p-2.5 rounded bg-[#181615] border border-[#3c3836]">
                          <div className="text-[10px] font-bold text-[#8ec07c] uppercase mb-1">
                            2. Blast Radius & Impact
                          </div>
                          <p className="text-[11px] text-[#d5c4a1] leading-relaxed">
                            {activeScenario.rfcPlan.blastRadius}
                          </p>
                        </div>

                        <div className="p-2.5 rounded bg-[#181615] border border-[#3c3836]">
                          <div className="text-[10px] font-bold text-[#83a598] uppercase mb-1">
                            3. Recommended Hotfix Patch
                          </div>
                          <p className="text-[11px] text-[#d5c4a1] leading-relaxed">
                            {activeScenario.rfcPlan.hotfixStrategy}
                          </p>
                          <div className="mt-2 p-2 rounded bg-[#1d2021] border border-[#3c3836] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileCode className="w-4 h-4 text-[#fabd2f]" />
                              <div>
                                <div className="text-[11px] font-bold text-[#ebdbb2]">
                                  {activeScenario.patchFile.name}
                                </div>
                                <div className="text-[9px] text-[#7c6f64] font-mono">
                                  {activeScenario.patchFile.path}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                soundFx.playClick();
                                setSelectedFilePath(activeScenario.patchFile.path);
                                setActiveTab('explorer');
                              }}
                              className="px-2 py-1 rounded bg-[#282828] text-[#fabd2f] hover:bg-[#3c3836] text-[10px] font-bold"
                            >
                              Inspect Diff →
                            </button>
                          </div>
                        </div>

                        <div className="p-2.5 rounded bg-[#181615] border border-[#3c3836]">
                          <div className="text-[10px] font-bold text-[#d3869b] uppercase mb-1">
                            4. Regression Safeguards
                          </div>
                          <p className="text-[11px] text-[#d5c4a1] leading-relaxed">
                            {activeScenario.rfcPlan.regressionMitigation}
                          </p>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INJECT FAILURE SCENARIOS GRID */}
          {activeTab === 'scenarios' && (
            <div className="p-4 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-[#3c3836]">
                <div>
                  <h3 className="text-sm font-bold text-[#ebdbb2]">
                    SELECT MOCK OUTAGE SCENARIO (CHAOS ENGINEERING)
                  </h3>
                  <p className="text-xs text-[#a89984]">
                    Choose a critical failure pattern and customize injection severity to benchmark closed-loop resilience.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#a89984] font-bold">Severity:</span>
                  {(['LOW', 'HIGH', 'CRITICAL', 'CATASTROPHIC'] as const).map((sev) => (
                    <button
                      key={sev}
                      onClick={() => {
                        soundFx.playClick();
                        setSeverity(sev);
                      }}
                      className={`px-2.5 py-1 rounded-sm text-xs font-bold transition-colors ${
                        severity === sev
                          ? 'bg-[#fb4934] text-white'
                          : 'bg-[#282828] text-[#a89984] hover:bg-[#3c3836]'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {scenarios.map((scenario) => {
                  const isSelected = selectedScenarioId === scenario.id;
                  return (
                    <div
                      key={scenario.id}
                      onClick={() => {
                        soundFx.playClick();
                        setSelectedScenarioId(scenario.id);
                      }}
                      className={`p-3.5 rounded-sm border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#282828] border-[#fabd2f] shadow-lg shadow-[#fabd2f]/10 ring-1 ring-[#fabd2f]'
                          : 'bg-[#181615] border-[#3c3836] hover:border-[#504945] hover:bg-[#201d1c]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#3c3836] text-[#fabd2f]">
                            {scenario.category.toUpperCase()}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                              scenario.severity === 'CATASTROPHIC'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                : scenario.severity === 'CRITICAL'
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                            }`}
                          >
                            {scenario.severity}
                          </span>
                        </div>

                        <div className="font-bold text-sm text-[#ebdbb2] mb-1">
                          {scenario.name}
                        </div>
                        <p className="text-xs text-[#a89984] leading-relaxed line-clamp-2">
                          {scenario.description}
                        </p>

                        <div className="mt-3 pt-2 border-t border-[#3c3836] grid grid-cols-3 gap-1 text-center">
                          <div className="p-1 rounded bg-[#1d2021]">
                            <div className="text-[9px] text-[#7c6f64]">Blast Radius</div>
                            <div className="text-xs font-bold text-red-400">
                              ~{scenario.blastRadiusPercent}%
                            </div>
                          </div>
                          <div className="p-1 rounded bg-[#1d2021]">
                            <div className="text-[9px] text-[#7c6f64]">Error Spike</div>
                            <div className="text-xs font-bold text-orange-400">
                              +{scenario.errorRateSpike}%
                            </div>
                          </div>
                          <div className="p-1 rounded bg-[#1d2021]">
                            <div className="text-[9px] text-[#7c6f64]">Latency</div>
                            <div className="text-xs font-bold text-[#83a598]">
                              +{scenario.latencySpikeMs}ms
                            </div>
                          </div>
                        </div>

                        <div className="mt-2.5 text-[10px] text-[#7c6f64]">
                          <span className="font-bold text-[#a89984]">Responders:</span>{' '}
                          {scenario.primaryResponders.map((r) => r.name).join(', ')}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 flex items-center justify-between">
                        <span className="text-[10px] text-[#a89984] truncate">
                          File: {scenario.patchFile.name.split(' ')[0]}...
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedScenarioId(scenario.id);
                            handleInjectOutage();
                          }}
                          className="px-3 py-1 rounded bg-[#fb4934] text-white text-xs font-bold hover:bg-red-500 flex items-center gap-1 transition-colors"
                        >
                          <Flame className="w-3 h-3" />
                          <span>Inject</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: LIVE FILE EXPLORER & CODE PATCH VIEWER */}
          {activeTab === 'explorer' && (
            <div className="flex h-full min-h-[500px]">
              {/* Explorer Sidebar */}
              <div className="w-64 bg-[#181615] border-r border-[#3c3836] p-3 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold text-[#a89984] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Folder className="w-3.5 h-3.5 text-[#fabd2f]" />
                    <span>PROJECT FILE EXPLORER</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    {/* src folder */}
                    <div>
                      <div
                        onClick={() =>
                          setTreeExpanded((p) => ({ ...p, src: !p.src }))
                        }
                        className="flex items-center gap-1 py-1 px-1.5 rounded hover:bg-[#282828] cursor-pointer text-[#ebdbb2]"
                      >
                        {treeExpanded['src'] ? (
                          <ChevronDown className="w-3.5 h-3.5 text-[#a89984]" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-[#a89984]" />
                        )}
                        <Folder className="w-3.5 h-3.5 text-[#fabd2f]" />
                        <span className="font-bold">src</span>
                      </div>

                      {treeExpanded['src'] && (
                        <div className="pl-4 space-y-1 mt-0.5">
                          {/* patches folder */}
                          <div>
                            <div
                              onClick={() =>
                                setTreeExpanded((p) => ({
                                  ...p,
                                  'src/patches': !p['src/patches'],
                                }))
                              }
                              className="flex items-center gap-1 py-1 px-1.5 rounded hover:bg-[#282828] cursor-pointer text-[#8ec07c]"
                            >
                              {treeExpanded['src/patches'] ? (
                                <ChevronDown className="w-3 h-3 text-[#a89984]" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-[#a89984]" />
                              )}
                              <Folder className="w-3.5 h-3.5 text-[#8ec07c]" />
                              <span className="font-bold">patches</span>
                            </div>

                            {treeExpanded['src/patches'] && (
                              <div className="pl-4 space-y-0.5 mt-0.5">
                                {allAvailablePatchFiles.map((patch) => {
                                  const isSelected = selectedFilePath === patch.path;
                                  const isTarget = activeScenario?.patchFile.path === patch.path;
                                  return (
                                    <div
                                      key={patch.path}
                                      onClick={() => {
                                        soundFx.playClick();
                                        setSelectedFilePath(patch.path);
                                      }}
                                      className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer text-[11px] truncate ${
                                        isSelected
                                          ? 'bg-[#fabd2f] text-black font-bold'
                                          : 'text-[#d5c4a1] hover:bg-[#282828]'
                                      }`}
                                      title={patch.path}
                                    >
                                      <FileCode
                                        className={`w-3 h-3 shrink-0 ${
                                          isSelected ? 'text-black' : isTarget ? 'text-[#fabd2f]' : 'text-[#8ec07c]'
                                        }`}
                                      />
                                      <span className="truncate">
                                        {patch.path.replace('src/patches/', '')}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* services folder */}
                          <div>
                            <div
                              onClick={() =>
                                setTreeExpanded((p) => ({
                                  ...p,
                                  'src/services': !p['src/services'],
                                }))
                              }
                              className="flex items-center gap-1 py-1 px-1.5 rounded hover:bg-[#282828] cursor-pointer text-[#83a598]"
                            >
                              {treeExpanded['src/services'] ? (
                                <ChevronDown className="w-3 h-3 text-[#a89984]" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-[#a89984]" />
                              )}
                              <Folder className="w-3.5 h-3.5 text-[#83a598]" />
                              <span className="font-bold">services</span>
                            </div>

                            {treeExpanded['src/services'] && (
                              <div className="pl-4 space-y-0.5 mt-0.5 text-[11px] text-[#a89984]">
                                <div className="py-1 px-2 rounded hover:bg-[#282828] flex items-center gap-1.5">
                                  <FileCode className="w-3 h-3 text-[#83a598]" />
                                  <span>agentExecutionLoop.ts</span>
                                </div>
                                <div className="py-1 px-2 rounded hover:bg-[#282828] flex items-center gap-1.5">
                                  <FileCode className="w-3 h-3 text-[#83a598]" />
                                  <span>agentFactory.ts</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded bg-[#282828] border border-[#3c3836] text-[10px] text-[#a89984]">
                  <div className="font-bold text-[#ebdbb2] mb-0.5">Runtime Sandbox</div>
                  <span>Patches execute in an isolated V8 container before deployment.</span>
                </div>
              </div>

              {/* Code Diff & Editor View */}
              <div className="flex-1 flex flex-col bg-[#1d2021]">
                {/* File Header Bar */}
                <div className="px-4 py-2 bg-[#282828] border-b border-[#3c3836] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-[#fabd2f]" />
                    <span className="font-bold text-xs text-[#ebdbb2]">
                      {activeFile?.path}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#3c3836] text-[#8ec07c]">
                      TypeScript
                    </span>
                    {activeScenario?.patchFile.path === activeFile?.path && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#fabd2f]/20 text-[#fabd2f] font-bold">
                        ACTIVE HOTFIX TARGET
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {onOpenIdeWithCode && (
                      <button
                        onClick={() => {
                          soundFx.playClick();
                          onOpenIdeWithCode(activeFile?.code || '', activeFile?.name || 'Patch');
                        }}
                        className="px-2.5 py-1 rounded bg-[#3c3836] hover:bg-[#504945] text-[10px] font-bold text-[#ebdbb2] flex items-center gap-1"
                      >
                        <Code className="w-3 h-3" />
                        <span>Open in IDE</span>
                      </button>
                    )}

                    <button
                      onClick={handleAutoDeployPatch}
                      disabled={isDeployingPatch}
                      className="px-3 py-1 rounded bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3 fill-black" />
                      <span>Deploy to Live Fleet</span>
                    </button>
                  </div>
                </div>

                {/* File Description Header */}
                <div className="px-4 py-2 bg-[#181615] border-b border-[#3c3836] text-xs text-[#a89984]">
                  <span className="font-bold text-[#ebdbb2]">{activeFile?.name}:</span>{' '}
                  {activeFile?.description}
                </div>

                {/* Code Content */}
                <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed bg-[#1d2021] text-[#ebdbb2]">
                  <pre className="whitespace-pre">
                    <code>
                      {activeFile?.code.split('\n').map((line, idx) => {
                        const isComment = line.trim().startsWith('//');
                        const isKeyword =
                          line.includes('export') ||
                          line.includes('function') ||
                          line.includes('return') ||
                          line.includes('const') ||
                          line.includes('import');
                        const isAddition = line.includes('RECOVERED') || line.includes('CLOSED') || line.includes('HEALTHY') || line.includes('DEFRAGMENTED');

                        return (
                          <div
                            key={idx}
                            className={`flex ${
                              isAddition ? 'bg-emerald-950/40 text-emerald-300' : ''
                            }`}
                          >
                            <span className="w-8 text-[#7c6f64] select-none text-right pr-3 shrink-0">
                              {idx + 1}
                            </span>
                            <span
                              className={
                                isComment
                                  ? 'text-[#928374] italic'
                                  : isAddition
                                  ? 'text-emerald-300 font-bold'
                                  : isKeyword
                                  ? 'text-[#fabd2f]'
                                  : 'text-[#ebdbb2]'
                              }
                            >
                              {line}
                            </span>
                          </div>
                        );
                      })}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: POST-MORTEM & AUDIT LOGS */}
          {activeTab === 'postmortem' && (
            <div className="p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#3c3836]">
                <div>
                  <h3 className="text-sm font-bold text-[#ebdbb2]">
                    INCIDENT POST-MORTEM & CONTINUOUS AUDIT LOGS
                  </h3>
                  <p className="text-xs text-[#a89984]">
                    Detailed telemetry timeline and cryptographic deployment ledger.
                  </p>
                </div>
                <button
                  onClick={handleDownloadPostMortem}
                  className="px-3 py-1.5 rounded bg-[#fabd2f] text-black text-xs font-bold hover:bg-[#fabd2f]/90 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Markdown Report</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Event Audit Log Stream */}
                <div className="p-3 rounded bg-[#282828] border border-[#3c3836] h-[360px] flex flex-col">
                  <div className="text-xs font-bold text-[#ebdbb2] mb-2 flex items-center justify-between">
                    <span>INCIDENT AUDIT LOG STREAM</span>
                    <span className="text-[10px] text-[#a89984]">{logs.length} events logged</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 text-xs font-mono pr-1">
                    {logs.length === 0 ? (
                      <div className="text-[#7c6f64] text-center p-6">No incident logs recorded yet.</div>
                    ) : (
                      logs.map((log) => (
                        <div
                          key={log.id}
                          className={`p-2 rounded border text-[11px] ${
                            log.level === 'error'
                              ? 'bg-red-950/40 border-red-500/50 text-red-300'
                              : log.level === 'warn'
                              ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                              : log.level === 'success'
                              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                              : 'bg-[#181615] border-[#3c3836] text-[#ebdbb2]'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[9px] text-[#a89984] mb-0.5">
                            <span>{log.timestamp}</span>
                            <span className="uppercase font-bold">{log.level}</span>
                          </div>
                          <div>{log.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Post-Mortem Card */}
                <div className="p-3 rounded bg-[#282828] border border-[#3c3836] h-[360px] overflow-y-auto text-xs space-y-3">
                  <div className="text-xs font-bold text-[#fabd2f]">
                    EXECUTIVE POST-MORTEM SUMMARY
                  </div>

                  <div className="p-2.5 rounded bg-[#181615] border border-[#3c3836]">
                    <span className="text-[10px] text-[#a89984] font-bold uppercase">Target System:</span>
                    <div className="font-bold text-[#ebdbb2] mt-0.5">{activeScenario?.name}</div>
                    <div className="text-[11px] text-[#d5c4a1] mt-1">{activeScenario?.description}</div>
                  </div>

                  <div className="p-2.5 rounded bg-[#181615] border border-[#3c3836]">
                    <span className="text-[10px] text-[#a89984] font-bold uppercase">Root Cause:</span>
                    <div className="text-[11px] text-[#d5c4a1] mt-1">{activeScenario?.rfcPlan.rootCause}</div>
                  </div>

                  <div className="p-2.5 rounded bg-[#181615] border border-[#3c3836]">
                    <span className="text-[10px] text-[#a89984] font-bold uppercase">Resolution Time:</span>
                    <div className="text-[11px] text-emerald-400 font-bold mt-1">
                      ~38 seconds (Autonomous Zero-Downtime Hot-Patch)
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-[#181615] border border-[#3c3836]">
                    <span className="text-[10px] text-[#a89984] font-bold uppercase">Zero-Downtime Guarantee:</span>
                    <div className="text-[11px] text-[#d5c4a1] mt-1">
                      {activeScenario?.rfcPlan.regressionMitigation}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="px-4 py-2 bg-[#282828] border-t border-[#3c3836] flex items-center justify-between text-xs text-[#a89984]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>V8 MicroVM Sandbox: ONLINE</span>
            </span>
            <span>•</span>
            <span>Zero-Trust Broker: ACTIVE</span>
            <span>•</span>
            <span>Hot-Patch Engine: READY</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#7c6f64]">
              Rufflo OS Continuous Resilience v4.2
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
