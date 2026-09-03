import React, { useState } from 'react';
import { DynamicFeature } from '../types';
import { soundFx } from '../utils/speech';
import {
  Layers,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Code2,
  Play,
  CheckCircle,
  X,
  Sparkles,
  Calculator,
  ShieldCheck,
  Share2,
  FolderGit2,
} from 'lucide-react';

interface DynamicFeaturesProps {
  isOpen: boolean;
  onClose: () => void;
  features: DynamicFeature[];
  onToggleFeature: (featureId: string) => void;
  onRemoveFeature: (featureId: string) => void;
  onAddFeature: (feature: Partial<DynamicFeature>) => void;
  onEditInIde: (feature: DynamicFeature) => void;
  onExecuteCode: (code: string) => Promise<{ success: boolean; logs: string[]; output: any }>;
}

export const DynamicFeatures: React.FC<DynamicFeaturesProps> = ({
  isOpen,
  onClose,
  features,
  onToggleFeature,
  onRemoveFeature,
  onAddFeature,
  onEditInIde,
  onExecuteCode,
}) => {
  const [activeTestFeature, setActiveTestFeature] = useState<DynamicFeature | null>(null);
  const [testOutput, setTestOutput] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  if (!isOpen) return null;

  const handleRunFeature = async (feat: DynamicFeature) => {
    soundFx.playClick();
    setIsExecuting(true);
    setActiveTestFeature(feat);
    try {
      const res = await onExecuteCode(feat.code);
      setTestOutput(res);
      soundFx.playNotification();
    } catch (err: any) {
      setTestOutput({ success: false, error: err.message });
    } finally {
      setIsExecuting(false);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calculator':
        return <Calculator className="w-4 h-4 text-amber-500" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case 'Share2':
        return <Share2 className="w-4 h-4 text-purple-500" />;
      case 'FolderGit2':
        return <FolderGit2 className="w-4 h-4 text-cyan-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs font-mono select-none p-4">
      <div className="w-full max-w-2xl bg-[#fbf1c7] dark:bg-[#1d2021] border-2 border-[#fabd2f] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#ebdbb2] dark:bg-[#282828] border-b border-[#d5c4a1] dark:border-[#3c3836]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#b57614] dark:text-[#fabd2f]" />
            <span className="font-bold text-xs uppercase tracking-wider text-[#3c3836] dark:text-[#ebdbb2]">
              DYNAMIC FEATURE & TOOL REGISTRY ({features.length})
            </span>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1 hover:text-red-500 rounded text-[#7c6f64] dark:text-[#a89984]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-[#d5c4a1] dark:border-[#3c3836] text-[11px] text-[#7c6f64] dark:text-[#a89984]">
            <span>Active Modules (Installed by Coding Agent / User)</span>
            <button
              onClick={() => {
                const name = prompt('Feature Name:');
                if (name) {
                  onAddFeature({
                    name,
                    description: 'Custom dynamic widget created via Command Center',
                    category: 'utility',
                    icon: 'Sparkles',
                    enabled: true,
                    addedByAgent: 'Operator / Ruflo Coder',
                    code: `// ${name} Module\nfunction run() {\n  return { status: "success", executedAt: new Date().toISOString() };\n}\nreturn { run };`,
                  });
                  soundFx.playNotification();
                }
              }}
              className="px-2 py-0.5 bg-[#fabd2f] text-[#1d2021] font-bold rounded flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>+ New Feature</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {features.map((feat) => (
              <div
                key={feat.id}
                className={`p-3 rounded border transition-all ${
                  feat.enabled
                    ? 'bg-[#ebdbb2] dark:bg-[#282828] border-[#d5c4a1] dark:border-[#3c3836]'
                    : 'bg-[#ebdbb2]/30 dark:bg-[#181615] border-[#d5c4a1] dark:border-[#3c3836] opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded bg-[#fbf1c7] dark:bg-[#1d2021] border border-[#d5c4a1] dark:border-[#3c3836] mt-0.5">
                      {getIcon(feat.icon)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#3c3836] dark:text-[#ebdbb2]">{feat.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded uppercase font-bold bg-[#d5c4a1] dark:bg-[#3c3836] text-[#7c6f64] dark:text-[#a89984]">
                          {feat.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7c6f64] dark:text-[#a89984] mt-0.5">{feat.description}</p>
                      <div className="text-[10px] text-[#b57614] dark:text-[#fabd2f] mt-1">
                        Added by: {feat.addedByAgent}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleRunFeature(feat)}
                      disabled={isExecuting}
                      className="p-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40"
                      title="Run Live Test in Sandboxed VM"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onEditInIde(feat);
                      }}
                      className="p-1.5 rounded bg-[#83a598]/20 hover:bg-[#83a598]/30 text-[#076678] dark:text-[#83a598] border border-[#83a598]/40"
                      title="Edit Code in IDE"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        soundFx.playClick();
                        onToggleFeature(feat.id);
                      }}
                      className="p-1.5 text-[#3c3836] dark:text-[#ebdbb2]"
                      title="Enable / Disable Feature"
                    >
                      {feat.enabled ? (
                        <ToggleRight className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-zinc-400" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        soundFx.playClick();
                        if (confirm(`Remove "${feat.name}" feature?`)) {
                          onRemoveFeature(feat.id);
                        }
                      }}
                      className="p-1.5 hover:text-red-500 text-[#7c6f64] dark:text-[#a89984]"
                      title="Delete Feature Module"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sandbox Test Output Drawer */}
                {activeTestFeature?.id === feat.id && testOutput && (
                  <div className="mt-2.5 p-2 rounded bg-[#1d2021] text-[#ebdbb2] border border-[#3c3836] font-mono text-[10px]">
                    <div className="font-bold text-emerald-400 pb-1 border-b border-[#3c3836] mb-1">
                      SANDBOX VM TEST EXECUTION RESULT:
                    </div>
                    <pre className="text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(testOutput, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
