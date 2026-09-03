import React, { useState, useEffect } from 'react';
import { DynamicFeature } from '../types';
import { soundFx } from '../utils/speech';
import { sendAndApplySystemCode } from '../utils/systemRuntime';
import {
  Code2,
  Play,
  Save,
  X,
  FileCode,
  CheckCircle2,
  Terminal,
  Sparkles,
  Layers,
  Zap,
  ShieldCheck,
  Activity,
  Cloud,
  Cpu,
  RefreshCw,
  Server,
  Flame,
  Layout,
  Globe,
  Lock,
  ArrowUpRight,
  Sliders,
  Check,
  AlertTriangle
} from 'lucide-react';

interface IdeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureToEdit?: DynamicFeature | null;
  onSaveFeature: (updatedFeature: DynamicFeature) => void;
  onExecuteCode: (code: string) => Promise<{ success: boolean; logs: string[]; output: any }>;
}

export const IdeModal: React.FC<IdeModalProps> = ({
  isOpen,
  onClose,
  featureToEdit,
  onSaveFeature,
  onExecuteCode,
}) => {
  const [activeTab, setActiveTab] = useState<'ide' | 'website_builder' | 'self_healing' | 'cloudrun'>('ide');
  const [featureName, setFeatureName] = useState(featureToEdit?.name || 'Autonomous Fleet Pipeline');
  const [code, setCode] = useState(
    featureToEdit?.code ||
      `// Ruflo Autonomous Dynamic Feature Sandbox
// Executed in secure Node.js VM with Dwight Zero-Trust Audit & Toby 24/7 Self-Healing

function runAutonomousPipeline() {
  const telemetry = {
    fleetWorkersActive: 12,
    clusterStatus: "SYSTEM_OPTIMAL",
    zeroTrustAudit: "PASSED (Dwight Schrute)",
    selfHealingDaemon: "HEALTH_SCORE_99.9% (Toby Flenderson)",
    cloudRunTarget: "dist/server.cjs (Port 3000)",
    timestamp: new Date().toLocaleTimeString(),
  };

  console.log("[Pipeline Step 1] Dwight Zero-Trust verified IAM permissions: OK");
  console.log("[Pipeline Step 2] Toby Memory Sweep: 0 heap leaks detected");
  console.log("[Pipeline Step 3] Output compiled & ready for Cloud Run rollout.");

  return telemetry;
}

return runAutonomousPipeline();`
  );

  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [zeroTrustAudit, setZeroTrustAudit] = useState<{ passed: boolean; auditedBy: string; riskLevel: string } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [autoApplyBackend, setAutoApplyBackend] = useState(true);
  const [appliedBadge, setAppliedBadge] = useState<string | null>(null);

  // Website UI Builder Live Preview State
  const [componentPreviewTitle, setComponentPreviewTitle] = useState('Real-Time Fleet Executive Banner');
  const [componentPreviewTheme, setComponentPreviewTheme] = useState<'gruvbox' | 'emerald' | 'amber'>('gruvbox');
  const [componentMetricValue, setComponentMetricValue] = useState('99.98%');
  const [componentStatusText, setComponentStatusText] = useState('All 12 Fleet Agents Operational');

  // Cloud Run Deployment State
  const [cloudRunData, setCloudRunData] = useState<any>(null);
  const [isDeployingCloudRun, setIsDeployingCloudRun] = useState(false);
  const [deploySuccessLog, setDeploySuccessLog] = useState<any>(null);

  // Self-Healing Telemetry State
  const [healingLoading, setHealingLoading] = useState(false);
  const [healingStats, setHealingStats] = useState({
    heapUsedMB: 48.2,
    healthScore: 99.9,
    patchesApplied: 14,
    lastSweep: 'Just now'
  });

  useEffect(() => {
    if (isOpen) {
      fetchCloudRunStatus();
    }
  }, [isOpen]);

  const fetchCloudRunStatus = async () => {
    try {
      const res = await fetch('/api/deployment/cloudrun');
      if (res.ok) {
        const data = await res.json();
        setCloudRunData(data);
      }
    } catch (e) {
      console.warn('Cloud Run status fetch fallback:', e);
    }
  };

  if (!isOpen) return null;

  const handleRun = async () => {
    soundFx.playClick();
    setIsExecuting(true);
    const start = Date.now();
    try {
      // Direct call to /api/code/execute
      const res = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, author: 'Ruflo Coder & Operator' })
      });
      const data = await res.json();
      
      setExecutionTimeMs(data.executionTimeMs || Date.now() - start);
      setConsoleOutput(data.logs || []);
      setExecutionResult(data.output || (data.error ? { error: data.error } : 'Executed Successfully'));
      if (data.zeroTrustVerdict) {
        setZeroTrustAudit(data.zeroTrustVerdict);
      }

      if (autoApplyBackend && data.success) {
        const applyRes = await sendAndApplySystemCode(
          code,
          featureName,
          'Ruflo Live IDE Sandbox',
          'system_runtime'
        );
        if (applyRes.module) {
          setAppliedBadge(`⚡ Auto-Applied to System Codes & Backend (v${applyRes.module.version})`);
        }
      }

      soundFx.playSuccessChime();
    } catch (err: any) {
      setConsoleOutput(['[ERROR] ' + (err.message || 'Execution error')]);
      setExecutionTimeMs(Date.now() - start);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleTriggerSelfHealing = async () => {
    soundFx.playClick();
    setHealingLoading(true);
    try {
      const res = await fetch('/api/debugger/trigger-heal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Operator-Triggered 24/7 Self-Healing Sweep' })
      });
      if (res.ok) {
        const data = await res.json();
        setHealingStats(prev => ({
          ...prev,
          patchesApplied: data.patchesApplied || prev.patchesApplied + 1,
          healthScore: 99.9,
          lastSweep: new Date().toLocaleTimeString()
        }));
        soundFx.playNotification();
      }
    } catch (e) {
      console.warn('Self-heal trigger failed:', e);
    } finally {
      setHealingLoading(false);
    }
  };

  const handleTriggerCloudRunDeploy = async () => {
    soundFx.playClick();
    setIsDeployingCloudRun(true);
    try {
      const res = await fetch('/api/deployment/cloudrun/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          releaseTag: `v2.5.${Math.floor(Date.now() / 1000).toString().slice(-4)}`,
          author: 'Autonomous Roy Anderson / Operator'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDeploySuccessLog(data);
        soundFx.playSuccessChime();
      }
    } catch (e) {
      console.error('Cloud Run trigger failed:', e);
    } finally {
      setIsDeployingCloudRun(false);
    }
  };

  const handleSave = async () => {
    soundFx.playNotification();
    if (autoApplyBackend) {
      await sendAndApplySystemCode(code, featureName, 'Ruflo IDE Editor', 'system_runtime');
    }

    const updated: DynamicFeature = {
      id: featureToEdit?.id || `feat-${Date.now()}`,
      name: featureName,
      description: featureToEdit?.description || 'Custom feature module added via IDE',
      icon: featureToEdit?.icon || 'Code2',
      category: featureToEdit?.category || 'code',
      enabled: true,
      code,
      addedByAgent: 'Ruflo Coder / Operator',
      createdAt: featureToEdit?.createdAt || Date.now(),
    };
    onSaveFeature(updated);
    onClose();
  };

  // Code Presets
  const codePresets = [
    {
      label: 'Telemetry Monitor',
      snippet: `function auditCluster() {
  return {
    agents: ["michael", "dwight", "cline", "jim", "kevin", "toby"],
    status: "HEALTHY",
    memoryPressure: "LOW",
    uptimeSeconds: 84320,
    zeroTrustChecked: true
  };
}
return auditCluster();`
    },
    {
      label: 'Dwight Zero-Trust Check',
      snippet: `function dwightSecurityEnforcement() {
  console.log("[Dwight] Enforcing zero-trust perimeter policy on all DB writes...");
  const policy = {
    allowRawDrop: false,
    requireAdminToken: true,
    whitelistedIPs: ["127.0.0.1", "10.0.0.0/8"],
    status: "ACTIVE_ENFORCEMENT"
  };
  return policy;
}
return dwightSecurityEnforcement();`
    },
    {
      label: 'Toby Self-Heal Daemon',
      snippet: `function tobySelfHealingSweep() {
  console.log("[Toby] Running heap de-fragmentation and active task sanity sweep...");
  return {
    sweepResult: "CLEAN",
    heapClearedMB: 14.8,
    orphanedSocketsClosed: 0,
    nextSweepIn: "300s"
  };
}
return tobySelfHealingSweep();`
    },
    {
      label: 'Cloud Run Express Route',
      snippet: `function generateCloudRunRoute() {
  return {
    path: "/api/autonomous/company-health",
    method: "GET",
    handler: "res.json({ ok: true, cluster: 'asia-southeast1', port: 3000 })",
    containerTarget: "dist/server.cjs"
  };
}
return generateCloudRunRoute();`
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs font-mono select-none p-2 md:p-4">
      <div className="w-full max-w-5xl bg-[#1d2021] border-2 border-[#fabd2f] rounded-xl shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* IDE Suite Top Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#282828] border-b border-[#3c3836] text-xs gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#fabd2f]/10 border border-[#fabd2f]/30 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-[#fabd2f]" />
            </div>
            <div>
              <span className="font-bold text-[#ebdbb2]">AUTONOMOUS DEV & DEPLOY SUITE</span>
              <span className="hidden sm:inline text-[10px] text-[#928374] ml-2">Node VM • 24/7 Self-Heal • Cloud Run</span>
            </div>
          </div>

          {/* Module Mode Tabs */}
          <div className="flex items-center bg-[#1d2021] p-1 rounded-lg border border-[#3c3836] gap-1">
            <button
              onClick={() => { soundFx.playClick(); setActiveTab('ide'); }}
              className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'ide'
                  ? 'bg-[#fabd2f] text-[#1d2021]'
                  : 'text-[#a89984] hover:text-[#ebdbb2]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Live IDE</span>
            </button>

            <button
              onClick={() => { soundFx.playClick(); setActiveTab('website_builder'); }}
              className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'website_builder'
                  ? 'bg-[#fabd2f] text-[#1d2021]'
                  : 'text-[#a89984] hover:text-[#ebdbb2]'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>UI Builder</span>
            </button>

            <button
              onClick={() => { soundFx.playClick(); setActiveTab('self_healing'); }}
              className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'self_healing'
                  ? 'bg-emerald-500 text-[#1d2021]'
                  : 'text-[#a89984] hover:text-[#ebdbb2]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>24/7 Self-Healing</span>
            </button>

            <button
              onClick={() => { soundFx.playClick(); setActiveTab('cloudrun'); }}
              className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'cloudrun'
                  ? 'bg-sky-500 text-[#1d2021]'
                  : 'text-[#a89984] hover:text-[#ebdbb2]'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Cloud Run</span>
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="p-1.5 hover:bg-rose-500/20 text-[#a89984] hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Notification Banner if Applied */}
        {appliedBadge && (
          <div className="px-4 py-1.5 bg-emerald-500/15 text-emerald-400 border-b border-emerald-500/30 text-[11px] font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {appliedBadge}
            </span>
            <button onClick={() => setAppliedBadge(null)} className="cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TAB 1: LIVE IDE & SANDBOXED EXECUTION */}
        {activeTab === 'ide' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Action Sub-header */}
            <div className="px-4 py-2 bg-[#1d2021] border-b border-[#3c3836] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[#928374] font-bold text-[11px]">MODULE NAME:</span>
                <input
                  type="text"
                  value={featureName}
                  onChange={(e) => setFeatureName(e.target.value)}
                  className="px-2.5 py-1 bg-[#181615] border border-[#3c3836] rounded text-[#ebdbb2] font-bold text-xs focus:ring-1 focus:ring-[#fabd2f] focus:outline-none w-48 sm:w-64"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Presets */}
                <div className="hidden lg:flex items-center gap-1 mr-2">
                  <span className="text-[10px] text-[#7c6f64]">Presets:</span>
                  {codePresets.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        soundFx.playClick();
                        setCode(preset.snippet);
                      }}
                      className="px-2 py-0.5 rounded bg-[#282828] hover:bg-[#3c3836] text-[10px] text-[#ebdbb2] border border-[#3c3836] transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <label className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold cursor-pointer bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                  <Zap className="w-3 h-3 fill-current" />
                  <span>Hot-Apply:</span>
                  <input
                    type="checkbox"
                    checked={autoApplyBackend}
                    onChange={(e) => setAutoApplyBackend(e.target.checked)}
                    className="rounded accent-emerald-500"
                  />
                </label>

                <button
                  onClick={handleRun}
                  disabled={isExecuting}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-[#1d2021] font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isExecuting ? 'Running VM...' : 'Execute Code'}</span>
                </button>

                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-[#fabd2f] hover:bg-[#d79921] text-[#1d2021] font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Feature</span>
                </button>
              </div>
            </div>

            {/* Split Editor & Console */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Code Editor */}
              <div className="flex-1 flex flex-col bg-[#181615] border-r border-[#3c3836]">
                <div className="px-3 py-1.5 bg-[#282828] text-[10px] text-[#a89984] border-b border-[#3c3836] flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold">
                    <FileCode className="w-3 h-3 text-[#fabd2f]" />
                    <span>feature.ts (Sandboxed Node.js VM Sandbox)</span>
                  </span>
                  <span className="text-[#928374]">UTF-8 • TypeScript ESNext</span>
                </div>

                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 p-3.5 bg-[#181615] text-[#b8bb26] font-mono text-xs focus:outline-none resize-none leading-relaxed select-text border-none"
                  spellCheck={false}
                />
              </div>

              {/* Right Output Console & Telemetry */}
              <div className="w-full md:w-88 flex flex-col bg-[#1d2021]">
                <div className="px-3 py-1.5 bg-[#282828] text-[10px] text-[#a89984] border-b border-[#3c3836] flex items-center justify-between font-bold">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3 h-3 text-emerald-400" />
                    <span>VM EXECUTION LOGS</span>
                  </div>
                  {executionTimeMs !== null && (
                    <span className="text-emerald-400 text-[9px] font-mono">
                      {executionTimeMs}ms
                    </span>
                  )}
                </div>

                <div className="flex-1 p-3 overflow-y-auto space-y-2 font-mono text-[11px] text-[#ebdbb2] select-text">
                  {consoleOutput.length === 0 && !executionResult && (
                    <div className="text-[#928374] text-center mt-8 text-xs px-4">
                      Press <span className="text-emerald-400 font-bold">"Execute Code"</span> to run in the isolated sandbox VM. Dwight Zero-Trust and Toby Self-Healing will audit the output.
                    </div>
                  )}

                  {consoleOutput.map((log, i) => (
                    <div key={i} className="text-[#a89984] leading-relaxed">
                      {log}
                    </div>
                  ))}

                  {/* Return Value */}
                  {executionResult !== null && executionResult !== undefined && (
                    <div className="mt-3 p-2.5 rounded-lg bg-[#282828] border border-[#3c3836]">
                      <div className="text-[10px] text-emerald-400 font-bold mb-1 flex items-center justify-between">
                        <span>RETURNED DATA:</span>
                        <span className="text-[9px] text-[#928374]">Type: {typeof executionResult}</span>
                      </div>
                      <pre className="text-emerald-300 whitespace-pre-wrap overflow-x-auto text-[10px] leading-relaxed">
                        {typeof executionResult === 'object'
                          ? JSON.stringify(executionResult, null, 2)
                          : String(executionResult)}
                      </pre>
                    </div>
                  )}

                  {/* Dwight Zero-Trust Badge in Console */}
                  {zeroTrustAudit && (
                    <div className="mt-3 p-2 rounded-lg bg-[#181615] border border-emerald-500/30 text-[10px] text-emerald-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold">Dwight Schrute Zero-Trust Audit: {zeroTrustAudit.passed ? 'PASSED' : 'FLAGGED'}</div>
                        <div className="text-[#928374] text-[9px]">Audited by {zeroTrustAudit.auditedBy} • Risk: {zeroTrustAudit.riskLevel}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUTONOMOUS WEBSITE & UI BUILDER */}
        {activeTab === 'website_builder' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#181615]">
            {/* Left Controls */}
            <div className="w-full md:w-80 p-4 bg-[#1d2021] border-r border-[#3c3836] flex flex-col gap-4 overflow-y-auto">
              <div className="text-xs font-bold text-[#fabd2f] uppercase tracking-wider flex items-center gap-1.5">
                <Layout className="w-4 h-4" />
                <span>Component Configurator</span>
              </div>

              <div>
                <label className="text-[11px] text-[#a89984] font-bold block mb-1">Banner Title</label>
                <input
                  type="text"
                  value={componentPreviewTitle}
                  onChange={(e) => setComponentPreviewTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#181615] border border-[#3c3836] rounded text-xs text-[#ebdbb2] focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#a89984] font-bold block mb-1">Highlight Metric</label>
                <input
                  type="text"
                  value={componentMetricValue}
                  onChange={(e) => setComponentMetricValue(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#181615] border border-[#3c3836] rounded text-xs text-[#ebdbb2] focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#a89984] font-bold block mb-1">Status Subtext</label>
                <input
                  type="text"
                  value={componentStatusText}
                  onChange={(e) => setComponentStatusText(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#181615] border border-[#3c3836] rounded text-xs text-[#ebdbb2] focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#a89984] font-bold block mb-1">Theme Palette</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['gruvbox', 'emerald', 'amber'] as const).map((thm) => (
                    <button
                      key={thm}
                      onClick={() => setComponentPreviewTheme(thm)}
                      className={`px-2 py-1 rounded text-[10px] font-bold capitalize border transition-colors cursor-pointer ${
                        componentPreviewTheme === thm
                          ? 'bg-[#fabd2f] text-[#1d2021] border-[#fabd2f]'
                          : 'bg-[#181615] text-[#a89984] border-[#3c3836]'
                      }`}
                    >
                      {thm}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[#3c3836] mt-auto">
                <button
                  onClick={() => {
                    soundFx.playSuccessChime();
                    setAppliedBadge('⚡ Component live-mounted to dynamic feature catalog!');
                  }}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-[#1d2021] font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Mount Component to App</span>
                </button>
              </div>
            </div>

            {/* Right Live Render Viewport */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center bg-radial from-[#282828] to-[#181615] overflow-y-auto">
              <div className="w-full max-w-xl">
                <div className="text-[11px] text-[#928374] font-bold mb-2 flex items-center justify-between">
                  <span>LIVE COMPONENT PREVIEW</span>
                  <span className="text-emerald-400">● Interactive Sandbox Active</span>
                </div>

                {/* Rendered Card */}
                <div className={`p-6 rounded-2xl border shadow-2xl transition-all ${
                  componentPreviewTheme === 'gruvbox'
                    ? 'bg-[#282828] border-[#fabd2f]/40 text-[#ebdbb2]'
                    : componentPreviewTheme === 'emerald'
                    ? 'bg-[#1e2a22] border-emerald-500/40 text-emerald-100'
                    : 'bg-[#2d2417] border-amber-500/40 text-amber-100'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-[#fabd2f]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm tracking-tight">{componentPreviewTitle}</h4>
                        <div className="text-[10px] opacity-70">Automated Corporate OS Engine</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      LIVE
                    </span>
                  </div>

                  <div className="my-4 p-4 rounded-xl bg-black/25 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] opacity-60 font-bold uppercase tracking-wider">Cluster Velocity</div>
                      <div className="text-2xl font-black mt-0.5">{componentMetricValue}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] opacity-60 font-bold uppercase tracking-wider">Status</div>
                      <div className="text-xs font-bold text-emerald-400 mt-1">{componentStatusText}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-[11px] opacity-70">
                    <span>Generated by Ruflo Live IDE</span>
                    <span>100% Client + Server Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 24/7 SELF-HEALING & ZERO-TRUST TELEMETRY */}
        {activeTab === 'self_healing' && (
          <div className="flex-1 p-6 overflow-y-auto bg-[#181615] space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#3c3836]">
              <div>
                <h3 className="text-sm font-bold text-[#ebdbb2] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>24/7 Continuous Self-Healing & Zero-Trust Engine</span>
                </h3>
                <p className="text-xs text-[#928374] mt-1">
                  Toby Flenderson executes background memory defragmentation sweeps while Dwight Schrute enforces zero-trust permission audits.
                </p>
              </div>

              <button
                onClick={handleTriggerSelfHealing}
                disabled={healingLoading}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-[#1d2021] font-bold text-xs rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${healingLoading ? 'animate-spin' : ''}`} />
                <span>{healingLoading ? 'Sweeping Memory...' : 'Trigger Instant Self-Heal Sweep'}</span>
              </button>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#282828] border border-[#3c3836]">
                <div className="text-[10px] text-[#928374] font-bold uppercase">Health Score</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">{healingStats.healthScore}%</div>
                <div className="text-[10px] text-[#a89984] mt-1">0 fatal exceptions recorded</div>
              </div>

              <div className="p-4 rounded-xl bg-[#282828] border border-[#3c3836]">
                <div className="text-[10px] text-[#928374] font-bold uppercase">Patches Applied</div>
                <div className="text-2xl font-black text-[#fabd2f] mt-1">{healingStats.patchesApplied}</div>
                <div className="text-[10px] text-[#a89984] mt-1">Self-healed without downtime</div>
              </div>

              <div className="p-4 rounded-xl bg-[#282828] border border-[#3c3836]">
                <div className="text-[10px] text-[#928374] font-bold uppercase">Heap Memory Used</div>
                <div className="text-2xl font-black text-sky-400 mt-1">{healingStats.heapUsedMB} MB</div>
                <div className="text-[10px] text-[#a89984] mt-1">Optimal allocation limits</div>
              </div>

              <div className="p-4 rounded-xl bg-[#282828] border border-[#3c3836]">
                <div className="text-[10px] text-[#928374] font-bold uppercase">Zero-Trust Guard</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">ENFORCED</div>
                <div className="text-[10px] text-[#a89984] mt-1">Dwight Schrute active sentinel</div>
              </div>
            </div>

            {/* Guardians Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#282828] border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs text-emerald-400">Toby Flenderson • Self-Healing Daemon</span>
                </div>
                <p className="text-xs text-[#ebdbb2] leading-relaxed">
                  Monitors active VM workers, IPC communications, and garbage collection. In case of unexpected runtime script errors, Toby automatically isolates the fault and applies a non-blocking hot patch.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#282828] border border-[#fabd2f]/30">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-[#fabd2f]" />
                  <span className="font-bold text-xs text-[#fabd2f]">Dwight Schrute • Zero-Trust Sentinel</span>
                </div>
                <p className="text-xs text-[#ebdbb2] leading-relaxed">
                  Inspects every inbound code payload for unauthorized subprocess spawning (`child_process`), destructive deletions (`rmdirSync`), or secret credential exfiltration before execution is permitted.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: 1-CLICK CLOUD RUN PRODUCTION DEPLOYMENT */}
        {activeTab === 'cloudrun' && (
          <div className="flex-1 p-6 overflow-y-auto bg-[#181615] space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#3c3836]">
              <div>
                <h3 className="text-sm font-bold text-[#ebdbb2] flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-sky-400" />
                  <span>One-Click Google Cloud Run Production Distribution</span>
                </h3>
                <p className="text-xs text-[#928374] mt-1">
                  Bundles entire application with Vite & Node.js into a standalone single-file distribution (<code className="text-sky-300">dist/server.cjs</code>) ready for container ingress on Port 3000.
                </p>
              </div>

              <button
                onClick={handleTriggerCloudRunDeploy}
                disabled={isDeployingCloudRun}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-[#1d2021] font-bold text-xs rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>{isDeployingCloudRun ? 'Packaging Bundle...' : 'Trigger 1-Click Rollout'}</span>
              </button>
            </div>

            {/* Cloud Run Manifest Card */}
            <div className="p-5 rounded-xl bg-[#282828] border border-[#3c3836] space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#ebdbb2] flex items-center gap-2">
                  <Server className="w-4 h-4 text-sky-400" />
                  <span>Production Distribution Manifest</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                  {cloudRunData?.distribution?.status || 'READY_FOR_ROLLOUT'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#1d2021] border border-[#3c3836]">
                  <div className="text-[10px] text-[#928374] font-bold">ENTRYPOINT ARTIFACT</div>
                  <div className="font-bold text-sky-300 mt-1">dist/server.cjs</div>
                  <div className="text-[9px] text-[#7c6f64] mt-0.5">esbuild CommonJS bundle</div>
                </div>

                <div className="p-3 rounded-lg bg-[#1d2021] border border-[#3c3836]">
                  <div className="text-[10px] text-[#928374] font-bold">INGRESS NETWORK BIND</div>
                  <div className="font-bold text-emerald-300 mt-1">0.0.0.0:3000</div>
                  <div className="text-[9px] text-[#7c6f64] mt-0.5">Container Port 3000 (Required)</div>
                </div>

                <div className="p-3 rounded-lg bg-[#1d2021] border border-[#3c3836]">
                  <div className="text-[10px] text-[#928374] font-bold">CLIENT ASSETS</div>
                  <div className="font-bold text-[#fabd2f] mt-1">dist/ (Vite SPA)</div>
                  <div className="text-[9px] text-[#7c6f64] mt-0.5">Static bundle + Express fallback</div>
                </div>
              </div>

              {/* Deployment Success Banner */}
              {deploySuccessLog && (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Cloud Run Production Release Successful ({deploySuccessLog.releaseTag})</span>
                  </div>
                  <div className="text-[11px] text-[#ebdbb2] font-mono">
                    Live Target: <a href={deploySuccessLog.endpoint} target="_blank" rel="noreferrer" className="text-sky-400 underline">{deploySuccessLog.endpoint}</a>
                  </div>
                  <div className="text-[10px] text-[#928374]">
                    Health Check: {deploySuccessLog.healthCheck} • Deployed by: {deploySuccessLog.deployedBy}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

