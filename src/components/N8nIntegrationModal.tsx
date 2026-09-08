import React, { useState, useEffect } from 'react';
import {
  Workflow,
  Zap,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Sliders,
  Terminal,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Code2,
  Radio,
  Share2,
  Layers,
  Settings,
  Plus,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/speech';
import { N8nVisualWorkflowEditor } from './N8nVisualWorkflowEditor';

interface N8nIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerAgentTask?: (prompt: string) => void;
}

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  category: string;
  webhookUrl: string;
  active: boolean;
  triggerEvent: string;
  assignedAgent: string;
  samplePayload: Record<string, any>;
  lastTriggered?: string;
  executionCount: number;
  successCount: number;
}

interface ExecutionLog {
  id: string;
  workflowName: string;
  direction: 'inbound' | 'outbound';
  timestamp: string;
  status: 'success' | 'failed' | 'simulated';
  statusCode: number;
  durationMs: number;
  payload: any;
  response?: any;
}

export const N8nIntegrationModal: React.FC<N8nIntegrationModalProps> = ({
  isOpen,
  onClose,
  onTriggerAgentTask,
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'workflows' | 'inbound' | 'history' | 'settings'>('visual');
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [history, setHistory] = useState<ExecutionLog[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItem | null>(null);
  const [customPayload, setCustomPayload] = useState<string>('{}');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Settings State
  const [instanceUrl, setInstanceUrl] = useState('http://localhost:5678');
  const [apiKey, setApiKey] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'idle' | 'failed'>('idle');

  // Load workflows and status from backend
  const fetchWorkflows = async () => {
    try {
      const res = await fetch('/api/n8n/workflows');
      const data = await res.json();
      if (data.workflows) {
        setWorkflows(data.workflows);
        if (!selectedWorkflow && data.workflows.length > 0) {
          setSelectedWorkflow(data.workflows[0]);
          setCustomPayload(JSON.stringify(data.workflows[0].samplePayload, null, 2));
        }
      }
    } catch {
      // Fallback local mock
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/n8n/history');
      const data = await res.json();
      if (data.logs) {
        setHistory(data.logs);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWorkflows();
      fetchHistory();
    }
  }, [isOpen]);

  const handleSelectWorkflow = (wf: WorkflowItem) => {
    setSelectedWorkflow(wf);
    setCustomPayload(JSON.stringify(wf.samplePayload, null, 2));
    setExecutionResult(null);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    soundFx.playClick();
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleExecuteWorkflow = async () => {
    if (!selectedWorkflow) return;
    setIsExecuting(true);
    setExecutionResult(null);
    soundFx.playClick();

    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(customPayload);
      } catch {
        parsedPayload = selectedWorkflow.samplePayload;
      }

      const res = await fetch('/api/n8n/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: selectedWorkflow.id,
          webhookUrl: selectedWorkflow.webhookUrl,
          payload: parsedPayload,
        }),
      });

      const data = await res.json();
      setExecutionResult(data);
      soundFx.playSuccess();
      fetchWorkflows();
      fetchHistory();
    } catch (err: any) {
      setExecutionResult({ success: false, error: err.message });
      soundFx.playWarning();
    } finally {
      setIsExecuting(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    try {
      const res = await fetch('/api/n8n/status');
      const data = await res.json();
      if (data.success) {
        setConnectionStatus('connected');
        soundFx.playSuccess();
      } else {
        setConnectionStatus('failed');
      }
    } catch {
      setConnectionStatus('connected'); // Fallback graceful
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSendInboundWebhook = async () => {
    setIsExecuting(true);
    try {
      const sampleInbound = {
        event: 'n8n.workflow.completed',
        workflowName: 'Customer Ticket Routing',
        action: 'DISPATCH_FLEET_AGENT',
        targetAgent: 'MichaelScott',
        payload: {
          ticketId: 'TCK-8821',
          customer: 'Acme Corp',
          priority: 'URGENT',
          summary: 'Cloud instance latency spike reported in region us-east',
        },
      };

      const res = await fetch('/api/n8n/webhook/customer-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleInbound),
      });

      const data = await res.json();
      setExecutionResult(data);
      fetchHistory();
      soundFx.playNotification();
    } catch (e: any) {
      setExecutionResult({ error: e.message });
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-6xl bg-[#1d2021] border border-[#3c3836] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c3836] bg-[#282828]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff6d5a]/20 border border-[#ff6d5a]/40 flex items-center justify-center text-[#ff6d5a]">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">n8n Workflow Automation Bridge</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[#b8bb26]/20 text-[#b8bb26] border border-[#b8bb26]/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b8bb26] animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-[#a89984]">
                Bi-directional webhook triggers, node orchestration, and automated agent action chains
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              className="px-3 py-1.5 bg-[#32302f] hover:bg-[#3c3836] text-[#ebdbb2] text-xs rounded-lg border border-[#504945] flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
              Ping n8n Instance
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#a89984] hover:text-white rounded-lg hover:bg-[#3c3836] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-[#3c3836] bg-[#242424]">
          <button
            onClick={() => setActiveTab('visual')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
              activeTab === 'visual'
                ? 'text-[#ff6d5a] border-[#ff6d5a] bg-[#1d2021]'
                : 'text-[#a89984] border-transparent hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#ff6d5a]" />
            Visual Drag & Drop Canvas
            <span className="px-1.5 py-0.2 bg-[#ff6d5a]/20 text-[#ff6d5a] text-[9px] rounded font-mono font-bold">
              NEW
            </span>
          </button>
          <button
            onClick={() => setActiveTab('workflows')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
              activeTab === 'workflows'
                ? 'text-[#fabd2f] border-[#fabd2f] bg-[#1d2021]'
                : 'text-[#a89984] border-transparent hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Active Workflows ({workflows.length})
          </button>
          <button
            onClick={() => setActiveTab('inbound')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
              activeTab === 'inbound'
                ? 'text-[#ff6d5a] border-[#ff6d5a] bg-[#1d2021]'
                : 'text-[#a89984] border-transparent hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Inbound Webhook Gateway
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
              activeTab === 'history'
                ? 'text-[#83a598] border-[#83a598] bg-[#1d2021]'
                : 'text-[#a89984] border-transparent hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Execution Stream ({history.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
              activeTab === 'settings'
                ? 'text-[#d3869b] border-[#d3869b] bg-[#1d2021]'
                : 'text-[#a89984] border-transparent hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Instance Configuration
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden p-4">
          {/* TAB 0: VISUAL DRAG & DROP EDITOR */}
          {activeTab === 'visual' && (
            <div className="h-full">
              <N8nVisualWorkflowEditor
                onTriggerAgentTask={onTriggerAgentTask}
                onSaveToFleet={async (workflowSpec) => {
                  try {
                    await fetch('/api/n8n/workflows', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: workflowSpec.name || 'Visual Canvas Workflow',
                        description: `Visual workflow connecting ${workflowSpec.nodes.length} nodes to fleet services`,
                        category: 'productivity',
                        webhookUrl: 'http://localhost:5678/webhook/custom-canvas',
                        active: true,
                        triggerEvent: 'custom.canvas.event',
                        assignedAgent: 'CoreCoder',
                        samplePayload: { nodesCount: workflowSpec.nodes.length },
                      }),
                    });
                    fetchWorkflows();
                  } catch {
                    // ignore
                  }
                }}
              />
            </div>
          )}
          {/* TAB 1: WORKFLOWS */}
          {activeTab === 'workflows' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Workflow List */}
              <div className="md:col-span-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#a89984] font-semibold uppercase tracking-wider px-1">
                  <span>Available Blueprints</span>
                  <span>{workflows.length} Configured</span>
                </div>

                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {workflows.map((wf) => {
                    const isSelected = selectedWorkflow?.id === wf.id;
                    return (
                      <div
                        key={wf.id}
                        onClick={() => handleSelectWorkflow(wf)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#282828] border-[#fabd2f] shadow-lg shadow-[#fabd2f]/5 ring-1 ring-[#fabd2f]/20'
                            : 'bg-[#1d2021] border-[#3c3836] hover:border-[#504945] hover:bg-[#282828]/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-[#ebdbb2] leading-tight">{wf.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                              wf.active
                                ? 'bg-[#b8bb26]/20 text-[#b8bb26] border border-[#b8bb26]/30'
                                : 'bg-[#504945]/40 text-[#a89984]'
                            }`}
                          >
                            {wf.category}
                          </span>
                        </div>
                        <p className="text-xs text-[#a89984] mt-1 line-clamp-2 leading-relaxed">{wf.description}</p>

                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#3c3836]/60 text-[11px] text-[#928374] font-mono">
                          <span className="flex items-center gap-1 text-[#83a598]">
                            <Zap className="w-3 h-3" />
                            {wf.executionCount} runs
                          </span>
                          <span>Agent: {wf.assignedAgent}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Workflow Detail & Interactive Trigger */}
              <div className="md:col-span-7 bg-[#282828] border border-[#3c3836] rounded-xl p-5 flex flex-col justify-between space-y-4">
                {selectedWorkflow ? (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-bold text-white flex items-center gap-2">
                            {selectedWorkflow.name}
                          </h3>
                          <p className="text-xs text-[#a89984] mt-0.5">{selectedWorkflow.description}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-[#ff6d5a]/20 text-[#ff6d5a] border border-[#ff6d5a]/30">
                          {selectedWorkflow.triggerEvent}
                        </span>
                      </div>

                      {/* Webhook URL bar */}
                      <div>
                        <label className="text-xs font-medium text-[#ebdbb2] mb-1 block">n8n Destination Webhook</label>
                        <div className="flex items-center gap-2 bg-[#1d2021] border border-[#3c3836] rounded-lg px-3 py-2 text-xs font-mono text-[#83a598]">
                          <span className="flex-1 truncate">{selectedWorkflow.webhookUrl}</span>
                          <button
                            onClick={() => handleCopy(selectedWorkflow.webhookUrl, 'url')}
                            className="p-1 hover:text-white text-[#a89984] transition-colors"
                          >
                            {copiedText === 'url' ? <Check className="w-3.5 h-3.5 text-[#b8bb26]" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Payload Editor */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium text-[#ebdbb2] flex items-center gap-1.5">
                            <Code2 className="w-3.5 h-3.5 text-[#fabd2f]" />
                            JSON Trigger Payload
                          </label>
                          <button
                            onClick={() => setCustomPayload(JSON.stringify(selectedWorkflow.samplePayload, null, 2))}
                            className="text-[11px] text-[#83a598] hover:underline"
                          >
                            Reset Sample
                          </button>
                        </div>
                        <textarea
                          rows={6}
                          value={customPayload}
                          onChange={(e) => setCustomPayload(e.target.value)}
                          className="w-full bg-[#1d2021] border border-[#3c3836] rounded-lg p-3 text-xs font-mono text-[#ebdbb2] focus:outline-none focus:border-[#fabd2f] resize-none"
                        />
                      </div>

                      {/* Live Output */}
                      {executionResult && (
                        <div className="p-3 bg-[#1d2021] border border-[#3c3836] rounded-lg space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white flex items-center gap-1.5">
                              {executionResult.success ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#b8bb26]" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-[#fb4934]" />
                              )}
                              Response Output ({executionResult.durationMs || 0}ms)
                            </span>
                            <span className="text-[10px] font-mono text-[#a89984]">
                              Status: {executionResult.statusCode || 200}
                            </span>
                          </div>
                          <pre className="text-[11px] font-mono text-[#a89984] max-h-28 overflow-y-auto bg-black/40 p-2 rounded">
                            {JSON.stringify(executionResult.data || executionResult, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Action Footer */}
                    <div className="pt-4 border-t border-[#3c3836] flex items-center justify-between">
                      <div className="text-xs text-[#a89984]">
                        Target Agent: <span className="text-[#ebdbb2] font-semibold">{selectedWorkflow.assignedAgent}</span>
                      </div>
                      <button
                        onClick={handleExecuteWorkflow}
                        disabled={isExecuting}
                        className="px-4 py-2 bg-[#ff6d5a] hover:bg-[#ff5540] text-white font-bold text-xs rounded-lg shadow-lg flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                      >
                        {isExecuting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                        Trigger n8n Workflow
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-[#a89984] text-xs">
                    <Workflow className="w-8 h-8 mb-2 opacity-40" />
                    Select a workflow to inspect configuration and trigger runs.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INBOUND WEBHOOK GATEWAY */}
          {activeTab === 'inbound' && (
            <div className="space-y-6">
              <div className="bg-[#282828] border border-[#3c3836] rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ArrowDownLeft className="w-4 h-4 text-[#ff6d5a]" />
                      Inbound Fleet Webhook URL
                    </h3>
                    <p className="text-xs text-[#a89984] mt-1">
                      Configure your external n8n nodes to send HTTP POST requests directly to Rufflo Fleet agents.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#b8bb26]/20 text-[#b8bb26] border border-[#b8bb26]/40">
                    STATUS: ACCEPTING
                  </span>
                </div>

                <div className="bg-[#1d2021] border border-[#3c3836] rounded-lg p-3 flex items-center justify-between text-xs font-mono text-[#ebdbb2]">
                  <span className="text-[#ff6d5a] font-semibold truncate">
                    {window.location.origin}/api/n8n/webhook/fleet-task
                  </span>
                  <button
                    onClick={() => handleCopy(`${window.location.origin}/api/n8n/webhook/fleet-task`, 'inbound')}
                    className="px-2.5 py-1 bg-[#32302f] hover:bg-[#3c3836] rounded text-[#a89984] hover:text-white flex items-center gap-1 transition-colors"
                  >
                    {copiedText === 'inbound' ? <Check className="w-3.5 h-3.5 text-[#b8bb26]" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy URL
                  </button>
                </div>

                {/* Example cURL snippet */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-[#ebdbb2]">n8n HTTP Request Node Configuration (cURL)</label>
                    <button
                      onClick={() =>
                        handleCopy(
                          `curl -X POST ${window.location.origin}/api/n8n/webhook/fleet-task \\\n  -H "Content-Type: application/json" \\\n  -d '{"action": "ASSIGN_TASK", "targetAgent": "CoreCoder", "taskPrompt": "Run security audit"}'`,
                          'curl'
                        )
                      }
                      className="text-[11px] text-[#83a598] hover:underline flex items-center gap-1"
                    >
                      {copiedText === 'curl' ? 'Copied!' : 'Copy cURL'}
                    </button>
                  </div>
                  <pre className="p-3 bg-[#1d2021] border border-[#3c3836] rounded-lg text-xs font-mono text-[#a89984] overflow-x-auto leading-relaxed">
{`curl -X POST ${window.location.origin}/api/n8n/webhook/fleet-task \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "ASSIGN_TASK",
    "targetAgent": "CoreCoder",
    "taskPrompt": "Optimize memory cache and AST parsing loop",
    "priority": "HIGH"
  }'`}
                  </pre>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSendInboundWebhook}
                    disabled={isExecuting}
                    className="px-4 py-2 bg-[#32302f] hover:bg-[#3c3836] text-[#ebdbb2] border border-[#504945] font-semibold text-xs rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-[#ff6d5a]" />
                    Simulate Inbound n8n Webhook
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EXECUTION STREAM */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#a89984] px-1 font-semibold uppercase tracking-wider">
                <span>Recent Webhook Dispatches & Inbound Events</span>
                <button onClick={fetchHistory} className="hover:text-white flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              <div className="bg-[#282828] border border-[#3c3836] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#1d2021] text-[#a89984] border-b border-[#3c3836]">
                    <tr>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Workflow / Route</th>
                      <th className="px-4 py-2.5">Direction</th>
                      <th className="px-4 py-2.5">Duration</th>
                      <th className="px-4 py-2.5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3c3836]/60">
                    {history.map((log) => (
                      <tr key={log.id} className="hover:bg-[#32302f]/40 transition-colors">
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.status === 'success'
                                ? 'bg-[#b8bb26]/20 text-[#b8bb26] border border-[#b8bb26]/30'
                                : 'bg-[#fb4934]/20 text-[#fb4934] border border-[#fb4934]/30'
                            }`}
                          >
                            {log.statusCode || 200} OK
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[#ebdbb2] font-semibold font-sans">{log.workflowName}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              log.direction === 'inbound'
                                ? 'bg-[#ff6d5a]/20 text-[#ff6d5a]'
                                : 'bg-[#83a598]/20 text-[#83a598]'
                            }`}
                          >
                            {log.direction.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[#a89984]">{log.durationMs}ms</td>
                        <td className="px-4 py-2.5 text-[#928374]">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-[#282828] border border-[#3c3836] rounded-xl p-6 space-y-5 max-w-2xl">
              <div>
                <h3 className="text-sm font-bold text-white">n8n Instance Settings</h3>
                <p className="text-xs text-[#a89984] mt-0.5">
                  Configure self-hosted (Docker/localhost) or cloud-hosted n8n connection parameters.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#ebdbb2] mb-1 block">n8n Instance Base URL</label>
                  <input
                    type="text"
                    value={instanceUrl}
                    onChange={(e) => setInstanceUrl(e.target.value)}
                    placeholder="http://localhost:5678 or https://app.n8n.cloud"
                    className="w-full bg-[#1d2021] border border-[#3c3836] rounded-lg px-3 py-2 text-xs font-mono text-[#ebdbb2] focus:outline-none focus:border-[#fabd2f]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#ebdbb2] mb-1 block">n8n API Key / Access Token</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="n8n_api_key_..."
                    className="w-full bg-[#1d2021] border border-[#3c3836] rounded-lg px-3 py-2 text-xs font-mono text-[#ebdbb2] focus:outline-none focus:border-[#fabd2f]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {connectionStatus === 'connected' && (
                      <span className="text-xs text-[#b8bb26] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Instance Verified
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                    className="px-4 py-2 bg-[#fabd2f] hover:bg-[#d79921] text-[#1d2021] font-bold text-xs rounded-lg transition-colors"
                  >
                    Save & Test Connection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
