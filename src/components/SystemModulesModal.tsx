import React, { useState, useEffect } from 'react';
import { AppliedSystemModule } from '../types';
import { sendAndApplySystemCode } from '../utils/systemRuntime';
import { soundFx } from '../utils/speech';
import {
  Cpu,
  Zap,
  Play,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Code,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Server,
  Sparkles,
  ShieldCheck,
  Terminal,
  Layers,
} from 'lucide-react';

interface SystemModulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenIdeWithCode?: (code: string, name: string) => void;
}

export const SystemModulesModal: React.FC<SystemModulesModalProps> = ({
  isOpen,
  onClose,
  onOpenIdeWithCode,
}) => {
  const [modules, setModules] = useState<AppliedSystemModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState<AppliedSystemModule | null>(null);
  const [customPatchCode, setCustomPatchCode] = useState(
    `// Write system code to immediately deploy to backend & website runtime
export function applyCustomEnhancement(system) {
  console.log("[System Hook] Custom enhancement active across fleet.");
  return {
    status: "ENHANCED",
    timestamp: new Date().toLocaleTimeString(),
    fleetHealth: 100
  };
}
return applyCustomEnhancement(system);`
  );
  const [patchName, setPatchName] = useState('Custom System Enhancement');
  const [isApplying, setIsApplying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Fetch active system modules from backend
  const fetchModules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/active-modules');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.modules) {
          setModules(data.modules);
          if (!selectedModule && data.modules.length > 0) {
            setSelectedModule(data.modules[0]);
          }
        }
      }
    } catch (e) {
      // Graceful handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchModules();
    }
  }, [isOpen]);

  // Apply new custom system code
  const handleApplyCustomPatch = async () => {
    if (!customPatchCode.trim()) return;
    setIsApplying(true);
    soundFx.playClick();
    try {
      const result = await sendAndApplySystemCode(
        customPatchCode,
        patchName,
        'Operator Console',
        'system_runtime'
      );
      if (result.success && result.module) {
        soundFx.playNotification();
        setStatusMessage(`⚡ Code sent to backend and applied to system runtime!`);
        fetchModules();
        setSelectedModule(result.module);
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        setStatusMessage(`⚠️ Applied with notice: ${result.error || 'Check logs'}`);
      }
    } catch (err: any) {
      setStatusMessage(`❌ Error applying code: ${err.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  // Toggle Module Status
  const handleToggleModule = async (id: string) => {
    soundFx.playClick();
    try {
      const res = await fetch('/api/system/toggle-module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          fetchModules();
        }
      }
    } catch (e) {
      // Graceful error isolation
    }
  };

  // Rollback / Remove Module
  const handleRollback = async (id: string) => {
    soundFx.playClick();
    try {
      const res = await fetch('/api/system/rollback-module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          fetchModules();
          setSelectedModule(null);
        }
      }
    } catch (e) {
      // Graceful error isolation
    }
  };

  if (!isOpen) return null;

  const activeCount = modules.filter((m) => m.status === 'active').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs font-mono select-none p-3 sm:p-4">
      <div className="w-full max-w-5xl bg-[#1d2021] border-2 border-[#fabd2f] rounded-lg shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-in zoom-in-95 duration-200 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#282828] border-b border-[#3c3836]">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-[#fabd2f]/20 text-[#fabd2f]">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="font-bold text-sm text-[#ebdbb2] flex items-center gap-2">
                <span>SYSTEM CODE & BACKEND RUNTIME REGISTRY</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  AUTO-SYNC ACTIVE
                </span>
              </div>
              <p className="text-[10px] text-[#a89984]">
                Any code written by the coder team or agents is automatically transmitted to the backend & applied to the live website system codes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchModules}
              className="p-1.5 rounded bg-[#3c3836] hover:bg-[#504945] text-[#ebdbb2] transition-colors"
              title="Refresh Module Registry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-1.5 rounded bg-[#3c3836] hover:bg-[#cc241d] text-[#ebdbb2] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#181615] border-b border-[#3c3836]">
          <div className="p-2 rounded bg-[#282828] border border-[#3c3836]">
            <span className="text-[10px] text-[#928374] block uppercase">Active System Patches</span>
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {activeCount} / {modules.length} Live
            </span>
          </div>

          <div className="p-2 rounded bg-[#282828] border border-[#3c3836]">
            <span className="text-[10px] text-[#928374] block uppercase">Backend Transport</span>
            <span className="text-sm font-bold text-[#83a598] flex items-center gap-1 mt-0.5">
              <Server className="w-3.5 h-3.5" />
              Express Node VM
            </span>
          </div>

          <div className="p-2 rounded bg-[#282828] border border-[#3c3836]">
            <span className="text-[10px] text-[#928374] block uppercase">Client Website Sync</span>
            <span className="text-sm font-bold text-[#fabd2f] flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              Hot-Patch Enabled
            </span>
          </div>

          <div className="p-2 rounded bg-[#282828] border border-[#3c3836]">
            <span className="text-[10px] text-[#928374] block uppercase">Perimeter Isolation</span>
            <span className="text-sm font-bold text-purple-400 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Zero-Trust V8
            </span>
          </div>
        </div>

        {/* Status Toast Banner */}
        {statusMessage && (
          <div className="px-4 py-2 bg-[#fabd2f]/20 border-b border-[#fabd2f]/40 text-[#fabd2f] font-bold flex items-center justify-between animate-in fade-in">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left Column: Applied Modules List */}
          <div className="md:col-span-5 border-r border-[#3c3836] flex flex-col bg-[#1d2021] overflow-hidden">
            <div className="p-2 bg-[#282828] border-b border-[#3c3836] flex items-center justify-between">
              <span className="font-bold text-[#ebdbb2] flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#fabd2f]" />
                APPLIED SYSTEM MODULES
              </span>
              <span className="text-[10px] text-[#a89984]">{modules.length} registered</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {modules.map((mod) => {
                const isSelected = selectedModule?.id === mod.id;
                return (
                  <div
                    key={mod.id}
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedModule(mod);
                    }}
                    className={`p-2.5 rounded border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#3c3836] border-[#fabd2f] shadow-md'
                        : 'bg-[#282828] border-[#3c3836] hover:border-[#504945]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="font-bold text-[#ebdbb2] text-[11px] truncate flex items-center gap-1">
                        <Code className="w-3 h-3 text-[#83a598]" />
                        <span>{mod.name}</span>
                      </div>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                          mod.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {mod.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#928374] mt-1.5">
                      <span>Source: {mod.source}</span>
                      <span>{new Date(mod.appliedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                );
              })}

              {modules.length === 0 && !loading && (
                <div className="p-8 text-center text-[#7c6f64]">
                  <Cpu className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No custom system patches registered yet.</p>
                  <p className="text-[10px] mt-1">
                    When Ruflo Coder or any agent produces code, it appears here automatically.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Code Inspector & Deployer */}
          <div className="md:col-span-7 flex flex-col bg-[#181615] overflow-hidden">
            {selectedModule ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Module Action Toolbar */}
                <div className="p-3 bg-[#282828] border-b border-[#3c3836] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-[#ebdbb2] flex items-center gap-2">
                      <span>{selectedModule.name}</span>
                      <span className="text-[10px] text-[#928374] font-normal">
                        (v{selectedModule.version} &bull; {selectedModule.target})
                      </span>
                    </div>
                    <span className="text-[10px] text-[#a89984]">
                      Deployed by {selectedModule.source} at{' '}
                      {new Date(selectedModule.appliedAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleModule(selectedModule.id)}
                      className={`px-2 py-1 rounded font-bold text-[10px] flex items-center gap-1 transition-colors ${
                        selectedModule.status === 'active'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                      }`}
                    >
                      {selectedModule.status === 'active' ? (
                        <>
                          <ToggleRight className="w-3.5 h-3.5" /> Disable
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-3.5 h-3.5" /> Enable
                        </>
                      )}
                    </button>

                    {onOpenIdeWithCode && (
                      <button
                        onClick={() => {
                          onOpenIdeWithCode(selectedModule.code, selectedModule.name);
                          onClose();
                        }}
                        className="px-2 py-1 rounded bg-[#83a598]/20 text-[#83a598] border border-[#83a598]/40 hover:bg-[#83a598]/30 font-bold text-[10px] flex items-center gap-1"
                      >
                        <Code className="w-3.5 h-3.5" /> Edit in IDE
                      </button>
                    )}

                    <button
                      onClick={() => handleRollback(selectedModule.id)}
                      className="p-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                      title="Rollback & Unload"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Code Body */}
                <div className="flex-1 overflow-y-auto p-3 font-mono text-xs bg-[#141211] text-[#ebdbb2] border-b border-[#3c3836]">
                  <div className="text-[10px] text-[#7c6f64] mb-1 uppercase font-bold flex items-center gap-1">
                    <Terminal className="w-3 h-3" /> System Code Definition
                  </div>
                  <pre className="p-2.5 rounded bg-[#1d2021] border border-[#3c3836] whitespace-pre-wrap overflow-x-auto text-[#b8bb26] text-[11px] leading-relaxed">
                    {selectedModule.code}
                  </pre>

                  {/* Execution Output / Telemetry */}
                  {selectedModule.output && (
                    <div className="mt-3">
                      <div className="text-[10px] text-[#7c6f64] mb-1 uppercase font-bold">
                        Execution Output / Return Value
                      </div>
                      <pre className="p-2 rounded bg-[#282828] border border-[#3c3836] text-[#fabd2f] text-[10px] whitespace-pre-wrap overflow-x-auto">
                        {typeof selectedModule.output === 'object'
                          ? JSON.stringify(selectedModule.output, null, 2)
                          : String(selectedModule.output)}
                      </pre>
                    </div>
                  )}

                  {/* Console Logs */}
                  {selectedModule.logs && selectedModule.logs.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[10px] text-[#7c6f64] mb-1 uppercase font-bold">
                        Sandbox VM Console Logs
                      </div>
                      <div className="p-2 rounded bg-[#282828] border border-[#3c3836] space-y-0.5 text-[10px]">
                        {selectedModule.logs.map((l, i) => (
                          <div key={i} className="text-[#a89984]">
                            {l}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Custom Live Code Deployer Section */
              <div className="flex-1 flex flex-col p-4 overflow-y-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-[#fabd2f]" />
                  <span className="font-bold text-[#ebdbb2] text-sm">
                    DEPLOY CODE DIRECTLY TO BACKEND & SYSTEM RUNTIME
                  </span>
                </div>
                <p className="text-[11px] text-[#a89984] mb-3">
                  Write JavaScript/TypeScript functions or hooks below. It will instantly execute on the Express Node VM backend, register as an active system patch, and hot-patch the website.
                </p>

                <div className="mb-2">
                  <label className="text-[10px] text-[#928374] block mb-1">PATCH NAME</label>
                  <input
                    type="text"
                    value={patchName}
                    onChange={(e) => setPatchName(e.target.value)}
                    className="w-full px-2.5 py-1 bg-[#1d2021] border border-[#3c3836] rounded text-[#ebdbb2] focus:ring-1 focus:ring-[#fabd2f] focus:outline-none font-bold"
                  />
                </div>

                <div className="flex-1 flex flex-col min-h-[220px]">
                  <label className="text-[10px] text-[#928374] block mb-1">SYSTEM CODE BODY</label>
                  <textarea
                    value={customPatchCode}
                    onChange={(e) => setCustomPatchCode(e.target.value)}
                    className="flex-1 w-full p-2.5 bg-[#141211] border border-[#3c3836] rounded text-[#b8bb26] font-mono text-[11px] leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-[#fabd2f]"
                  />
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleApplyCustomPatch}
                    disabled={isApplying}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-[#1d2021] font-bold rounded flex items-center gap-2 transition-all shadow-md"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>{isApplying ? 'Applying to Backend...' : 'Send to Backend & Apply Code'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#282828] border-t border-[#3c3836] flex items-center justify-between text-[10px] text-[#928374]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Real-time bidirectional synchronization with Express Node.js backend</span>
          </div>
          <button
            onClick={() => {
              setSelectedModule(null);
              setPatchName('Custom System Patch #' + (modules.length + 1));
            }}
            className="px-2 py-1 rounded bg-[#3c3836] hover:bg-[#fabd2f] hover:text-[#1d2021] text-[#ebdbb2] font-bold transition-colors"
          >
            + Deploy New System Code
          </button>
        </div>
      </div>
    </div>
  );
};
