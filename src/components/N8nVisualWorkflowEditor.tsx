import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Mail,
  CheckSquare,
  Bot,
  Database,
  Globe,
  Sliders,
  Settings,
  Code2,
  Download,
  Share2,
  FileText,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  X,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/speech';

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'agent' | 'service' | 'logic';
  subType: string;
  label: string;
  category: 'Trigger' | 'Agent' | 'Slack' | 'Email' | 'Jira' | 'GitHub' | 'Sheets' | 'AI' | 'Database';
  x: number;
  y: number;
  config: Record<string, any>;
  status?: 'idle' | 'running' | 'success' | 'failed';
  outputData?: any;
}

export interface WorkflowEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  animated?: boolean;
}

interface N8nVisualWorkflowEditorProps {
  onSaveToFleet?: (workflow: any) => void;
  onTriggerAgentTask?: (prompt: string) => void;
}

// Preset Palette Items for Drag & Drop
const PALETTE_ITEMS = [
  {
    type: 'trigger' as const,
    subType: 'webhook',
    label: 'Webhook Trigger',
    category: 'Trigger' as const,
    icon: Globe,
    color: '#ff6d5a',
    bg: 'bg-[#ff6d5a]/15',
    border: 'border-[#ff6d5a]/40',
    description: 'Listen for inbound POST HTTP events',
    defaultConfig: { path: '/webhook/fleet-event', method: 'POST', auth: 'None' },
  },
  {
    type: 'trigger' as const,
    subType: 'schedule',
    label: 'Schedule Interval',
    category: 'Trigger' as const,
    icon: Clock,
    color: '#fabd2f',
    bg: 'bg-[#fabd2f]/15',
    border: 'border-[#fabd2f]/40',
    description: 'Trigger periodic batch runs',
    defaultConfig: { interval: 'Every 1 hour', cron: '0 * * * *' },
  },
  {
    type: 'agent' as const,
    subType: 'corecoder',
    label: 'CoreCoder (Engineering)',
    category: 'Agent' as const,
    icon: Bot,
    color: '#83a598',
    bg: 'bg-[#83a598]/15',
    border: 'border-[#83a598]/40',
    description: 'AST analysis, code generation & debugging',
    defaultConfig: { agentName: 'CoreCoder', action: 'CODE_REVIEW', maxTokens: 2048 },
  },
  {
    type: 'agent' as const,
    subType: 'safetyguard',
    label: 'SafetyGuard (Security)',
    category: 'Agent' as const,
    icon: Shield,
    color: '#fb4934',
    bg: 'bg-[#fb4934]/15',
    border: 'border-[#fb4934]/40',
    description: 'OWASP vulnerability scanning & permission audit',
    defaultConfig: { agentName: 'SafetyGuard', action: 'AUDIT_REQUEST', strictMode: true },
  },
  {
    type: 'agent' as const,
    subType: 'michael',
    label: 'Michael (Executive Lead)',
    category: 'Agent' as const,
    icon: Sparkles,
    color: '#d79921',
    bg: 'bg-[#d79921]/15',
    border: 'border-[#d79921]/40',
    description: 'Strategic delegation, synthesis & standups',
    defaultConfig: { agentName: 'MichaelScott', action: 'STRATEGIC_DELEGATE', persona: 'Encouraging Lead' },
  },
  {
    type: 'service' as const,
    subType: 'slack',
    label: 'Slack Notification',
    category: 'Slack' as const,
    icon: MessageSquare,
    color: '#4a154b',
    bg: 'bg-[#4a154b]/30',
    border: 'border-[#e01e5a]/40',
    description: 'Post rich block message to #engineering or DM',
    defaultConfig: { channel: '#fleet-alerts', messageTemplate: '🤖 Agent *{{agent}}* completed task: {{task}}' },
  },
  {
    type: 'service' as const,
    subType: 'email',
    label: 'Email Dispatch (SMTP/Gmail)',
    category: 'Email' as const,
    icon: Mail,
    color: '#ea4335',
    bg: 'bg-[#ea4335]/15',
    border: 'border-[#ea4335]/40',
    description: 'Dispatch executive briefing or customer response',
    defaultConfig: { to: 'team@company.internal', subject: '[Alert] Fleet Automation Report', template: 'Daily Summary' },
  },
  {
    type: 'service' as const,
    subType: 'jira',
    label: 'Jira Software Ticket',
    category: 'Jira' as const,
    icon: CheckSquare,
    color: '#0052cc',
    bg: 'bg-[#0052cc]/20',
    border: 'border-[#0052cc]/40',
    description: 'Create bug, task, or epic in Jira sprint board',
    defaultConfig: { projectKey: 'ENG', issueType: 'Task', priority: 'High', summary: 'Automated Agent Bug Report' },
  },
  {
    type: 'service' as const,
    subType: 'sheets',
    label: 'Google Sheets Telemetry',
    category: 'Sheets' as const,
    icon: FileText,
    color: '#0f9d58',
    bg: 'bg-[#0f9d58]/15',
    border: 'border-[#0f9d58]/40',
    description: 'Append row with execution metrics & token logs',
    defaultConfig: { spreadsheetId: 'q3_fleet_telemetry', sheetName: 'Runs', appendMode: true },
  },
  {
    type: 'logic' as const,
    subType: 'gemini',
    label: 'Gemini AI Transform',
    category: 'AI' as const,
    icon: Sparkles,
    color: '#b16286',
    bg: 'bg-[#b16286]/15',
    border: 'border-[#b16286]/40',
    description: 'Summarize, categorize, or translate payload',
    defaultConfig: { model: 'gemini-2.5-pro', prompt: 'Summarize this incident into 3 concise executive bullet points.' },
  },
];

const PRESET_TEMPLATES = [
  {
    id: 'tpl-sec-jira-slack',
    name: 'Security Alert → SafetyGuard → Jira & Slack',
    nodes: [
      {
        id: 'node-1',
        type: 'trigger' as const,
        subType: 'webhook',
        label: 'Webhook Trigger',
        category: 'Trigger' as const,
        x: 40,
        y: 160,
        config: { path: '/webhook/security-alert', method: 'POST' },
        status: 'idle' as const,
      },
      {
        id: 'node-2',
        type: 'agent' as const,
        subType: 'safetyguard',
        label: 'SafetyGuard (Security)',
        category: 'Agent' as const,
        x: 290,
        y: 160,
        config: { agentName: 'SafetyGuard', action: 'AUDIT_SECURITY_PAYLOAD' },
        status: 'idle' as const,
      },
      {
        id: 'node-3',
        type: 'service' as const,
        subType: 'jira',
        label: 'Jira Software Ticket',
        category: 'Jira' as const,
        x: 550,
        y: 70,
        config: { projectKey: 'SEC', issueType: 'Bug', priority: 'Highest', summary: 'Critical Security Vulnerability Detected' },
        status: 'idle' as const,
      },
      {
        id: 'node-4',
        type: 'service' as const,
        subType: 'slack',
        label: 'Slack Notification',
        category: 'Slack' as const,
        x: 550,
        y: 250,
        config: { channel: '#security-war-room', messageTemplate: '🚨 *URGENT*: SafetyGuard detected vulnerability in runtime: {{details}}' },
        status: 'idle' as const,
      },
    ],
    edges: [
      { id: 'e-1-2', sourceNodeId: 'node-1', targetNodeId: 'node-2' },
      { id: 'e-2-3', sourceNodeId: 'node-2', targetNodeId: 'node-3' },
      { id: 'e-2-4', sourceNodeId: 'node-2', targetNodeId: 'node-4' },
    ],
  },
  {
    id: 'tpl-standup-email-sheets',
    name: 'Scheduled Standup → Michael Lead → Email & Sheets',
    nodes: [
      {
        id: 'node-1',
        type: 'trigger' as const,
        subType: 'schedule',
        label: 'Schedule Interval',
        category: 'Trigger' as const,
        x: 40,
        y: 160,
        config: { interval: 'Every weekday at 9am', cron: '0 9 * * 1-5' },
        status: 'idle' as const,
      },
      {
        id: 'node-2',
        type: 'agent' as const,
        subType: 'michael',
        label: 'Michael (Executive Lead)',
        category: 'Agent' as const,
        x: 290,
        y: 160,
        config: { agentName: 'MichaelScott', action: 'GENERATE_DAILY_STANDUP' },
        status: 'idle' as const,
      },
      {
        id: 'node-3',
        type: 'service' as const,
        subType: 'email',
        label: 'Email Dispatch (SMTP/Gmail)',
        category: 'Email' as const,
        x: 550,
        y: 70,
        config: { to: 'executives@company.internal', subject: 'Fleet Autonomous Standup Digest' },
        status: 'idle' as const,
      },
      {
        id: 'node-4',
        type: 'service' as const,
        subType: 'sheets',
        label: 'Google Sheets Telemetry',
        category: 'Sheets' as const,
        x: 550,
        y: 250,
        config: { spreadsheetId: 'q3_executive_metrics', sheetName: 'DailyStandups' },
        status: 'idle' as const,
      },
    ],
    edges: [
      { id: 'e-1-2', sourceNodeId: 'node-1', targetNodeId: 'node-2' },
      { id: 'e-2-3', sourceNodeId: 'node-2', targetNodeId: 'node-3' },
      { id: 'e-2-4', sourceNodeId: 'node-2', targetNodeId: 'node-4' },
    ],
  },
];

export const N8nVisualWorkflowEditor: React.FC<N8nVisualWorkflowEditorProps> = ({
  onSaveToFleet,
  onTriggerAgentTask,
}) => {
  const [nodes, setNodes] = useState<WorkflowNode[]>(PRESET_TEMPLATES[0].nodes);
  const [edges, setEdges] = useState<WorkflowEdge[]>(PRESET_TEMPLATES[0].edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-2');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState<number>(-1);
  const [connectingSourceNodeId, setConnectingSourceNodeId] = useState<string | null>(null);
  const [workflowTitle, setWorkflowTitle] = useState('Enterprise Agent Automation Pipeline');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Dragging state on canvas
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Handle Drag from Palette
  const handleDropFromPalette = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(20, Math.min(rect.width - 240, e.clientX - rect.left - 100));
    const y = Math.max(20, Math.min(rect.height - 100, e.clientY - rect.top - 40));

    try {
      const paletteData = JSON.parse(e.dataTransfer.getData('application/json'));
      const newNode: WorkflowNode = {
        id: `node-${Date.now()}`,
        type: paletteData.type,
        subType: paletteData.subType,
        label: paletteData.label,
        category: paletteData.category,
        x,
        y,
        config: { ...paletteData.defaultConfig },
        status: 'idle',
      };

      setNodes((prev) => [...prev, newNode]);
      setSelectedNodeId(newNode.id);
      soundFx.playClick();
    } catch {
      // ignore
    }
  };

  // Node Dragging logic on canvas
  const handleMouseDownNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setDraggingNodeId(nodeId);
    setDragOffset({
      x: e.clientX - node.x,
      y: e.clientY - node.y,
    });
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (!draggingNodeId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(10, Math.min(rect.width - 220, e.clientX - dragOffset.x));
    const newY = Math.max(10, Math.min(rect.height - 90, e.clientY - dragOffset.y));

    setNodes((prev) =>
      prev.map((n) => (n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n))
    );
  };

  const handleMouseUpCanvas = () => {
    setDraggingNodeId(null);
  };

  // Connection Linking
  const handleStartConnection = (e: React.MouseEvent, sourceId: string) => {
    e.stopPropagation();
    setConnectingSourceNodeId(sourceId);
    soundFx.playClick();
  };

  const handleCompleteConnection = (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    if (!connectingSourceNodeId || connectingSourceNodeId === targetId) {
      setConnectingSourceNodeId(null);
      return;
    }

    // Check if edge already exists
    const exists = edges.some(
      (edge) => edge.sourceNodeId === connectingSourceNodeId && edge.targetNodeId === targetId
    );

    if (!exists) {
      const newEdge: WorkflowEdge = {
        id: `e-${connectingSourceNodeId}-${targetId}`,
        sourceNodeId: connectingSourceNodeId,
        targetNodeId: targetId,
      };
      setEdges((prev) => [...prev, newEdge]);
      soundFx.playSuccess();
    }
    setConnectingSourceNodeId(null);
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) =>
      prev.filter((e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId)
    );
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
    soundFx.playClick();
  };

  const handleDeleteEdge = (edgeId: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
    soundFx.playClick();
  };

  // Simulation Runner
  const handleRunSimulation = async () => {
    if (isSimulating || nodes.length === 0) return;
    setIsSimulating(true);
    soundFx.playClick();

    // Reset status
    setNodes((prev) => prev.map((n) => ({ ...n, status: 'idle', outputData: undefined })));

    // Step 1: Run trigger nodes
    const triggerNodes = nodes.filter((n) => n.type === 'trigger');
    for (const tNode of triggerNodes) {
      setNodes((prev) =>
        prev.map((n) => (n.id === tNode.id ? { ...n, status: 'running' } : n))
      );
      await new Promise((r) => setTimeout(r, 600));
      setNodes((prev) =>
        prev.map((n) =>
          n.id === tNode.id
            ? {
                ...n,
                status: 'success',
                outputData: {
                  event: 'inbound_post_received',
                  source: 'n8n_gateway',
                  timestamp: new Date().toLocaleTimeString(),
                  payload: { severity: 'CRITICAL', issue: 'High memory saturation' },
                },
              }
            : n
        )
      );
      soundFx.playNotification();
    }

    // Step 2: Run Agent / intermediate nodes
    const agentNodes = nodes.filter((n) => n.type === 'agent' || n.type === 'logic');
    for (const aNode of agentNodes) {
      setNodes((prev) =>
        prev.map((n) => (n.id === aNode.id ? { ...n, status: 'running' } : n))
      );
      await new Promise((r) => setTimeout(r, 900));
      setNodes((prev) =>
        prev.map((n) =>
          n.id === aNode.id
            ? {
                ...n,
                status: 'success',
                outputData: {
                  agent: aNode.label,
                  decision: 'DISPATCH_TRIAGE_WORKFLOW',
                  summary: 'Audited log trace, isolated thread deadlock, created ticket draft',
                  tokensUsed: 412,
                },
              }
            : n
        )
      );
      soundFx.playNotification();
    }

    // Step 3: Run Service Nodes (Slack, Jira, Email, Sheets)
    const serviceNodes = nodes.filter((n) => n.type === 'service');
    for (const sNode of serviceNodes) {
      setNodes((prev) =>
        prev.map((n) => (n.id === sNode.id ? { ...n, status: 'running' } : n))
      );
      await new Promise((r) => setTimeout(r, 700));
      setNodes((prev) =>
        prev.map((n) =>
          n.id === sNode.id
            ? {
                ...n,
                status: 'success',
                outputData: {
                  service: sNode.category,
                  status: 'DISPATCHED_200_OK',
                  result: `Successfully notified ${sNode.category} with live agent payload.`,
                },
              }
            : n
        )
      );
      soundFx.playSuccess();
    }

    setIsSimulating(false);
  };

  // Export Workflow as n8n format JSON
  const handleExportN8nJson = () => {
    const n8nWorkflowSpec = {
      name: workflowTitle,
      nodes: nodes.map((node, idx) => ({
        id: node.id,
        name: node.label,
        type:
          node.type === 'trigger'
            ? 'n8n-nodes-base.webhook'
            : node.category === 'Slack'
            ? 'n8n-nodes-base.slack'
            : node.category === 'Email'
            ? 'n8n-nodes-base.emailSend'
            : node.category === 'Jira'
            ? 'n8n-nodes-base.jira'
            : node.category === 'Sheets'
            ? 'n8n-nodes-base.googleSheets'
            : 'n8n-nodes-base.httpRequest',
        typeVersion: 1,
        position: [node.x, node.y],
        parameters: node.config,
      })),
      connections: edges.reduce((acc: any, edge) => {
        const src = nodes.find((n) => n.id === edge.sourceNodeId);
        const tgt = nodes.find((n) => n.id === edge.targetNodeId);
        if (src && tgt) {
          if (!acc[src.label]) acc[src.label] = { main: [[]] };
          acc[src.label].main[0].push({ node: tgt.label, type: 'main', index: 0 });
        }
        return acc;
      }, {}),
      active: true,
      settings: { executionOrder: 'v1' },
    };

    const jsonStr = JSON.stringify(n8nWorkflowSpec, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedNotification(true);
    soundFx.playSuccess();
    setTimeout(() => setCopiedNotification(false), 2500);

    if (onSaveToFleet) {
      onSaveToFleet(n8nWorkflowSpec);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#181a1b] text-[#ebdbb2] rounded-xl overflow-hidden border border-[#3c3836]">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#282828] border-b border-[#3c3836]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#ff6d5a]/20 border border-[#ff6d5a]/40 flex items-center justify-center text-[#ff6d5a]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <input
              type="text"
              value={workflowTitle}
              onChange={(e) => setWorkflowTitle(e.target.value)}
              className="bg-transparent text-sm font-bold text-white focus:outline-none focus:border-b focus:border-[#fabd2f] border-b border-transparent pb-0.5"
            />
            <div className="text-[11px] text-[#a89984] flex items-center gap-2">
              <span>{nodes.length} Nodes</span>
              <span>•</span>
              <span>{edges.length} Connectors</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Preset Selector */}
          <div className="flex items-center gap-1 bg-[#1d2021] p-1 rounded-lg border border-[#3c3836]">
            {PRESET_TEMPLATES.map((tpl, i) => (
              <button
                key={tpl.id}
                onClick={() => {
                  setNodes(tpl.nodes);
                  setEdges(tpl.edges);
                  setSelectedNodeId(tpl.nodes[0]?.id || null);
                  soundFx.playClick();
                }}
                className="px-2.5 py-1 text-[11px] font-semibold text-[#a89984] hover:text-white rounded hover:bg-[#32302f] transition-colors"
              >
                Template {i + 1}
              </button>
            ))}
          </div>

          {/* Import Button */}
          <button
            onClick={() => {
              const jsonStr = prompt("Paste your n8n workflow JSON here:");
              if (!jsonStr) return;
              try {
                const parsed = JSON.parse(jsonStr);
                
                if (parsed.nodes && Array.isArray(parsed.nodes)) {
                  // Attempt to map n8n nodes to our visual format
                  const newNodes: WorkflowNode[] = [];
                  const newEdges: WorkflowEdge[] = [];

                  // Map nodes
                  parsed.nodes.forEach((n: any) => {
                    newNodes.push({
                      id: n.id || `node-${Date.now()}-${Math.random()}`,
                      type: 'logic',
                      subType: 'custom',
                      label: n.name || n.type,
                      category: 'AI',
                      x: n.position ? n.position[0] + 500 : Math.random() * 500, // adjust pos
                      y: n.position ? n.position[1] + 300 : Math.random() * 500,
                      config: { n8nType: n.type, ...n.parameters },
                      status: 'idle',
                      outputData: null
                    });
                  });
                  
                  // Map edges from n8n connections format
                  if (parsed.connections) {
                     Object.keys(parsed.connections).forEach((sourceNodeName) => {
                       const sourceNodeObj = newNodes.find(n => n.label === sourceNodeName);
                       if (!sourceNodeObj) return;

                       const outPorts = parsed.connections[sourceNodeName];
                       Object.keys(outPorts).forEach(portName => {
                         const connections = outPorts[portName];
                         connections.forEach((connList: any[]) => {
                            if (Array.isArray(connList)) {
                               connList.forEach(conn => {
                                 const targetNodeObj = newNodes.find(n => n.label === conn.node);
                                 if (targetNodeObj) {
                                   newEdges.push({
                                     id: `e-${sourceNodeObj.id}-${targetNodeObj.id}-${Math.random()}`,
                                     sourceNodeId: sourceNodeObj.id,
                                     targetNodeId: targetNodeObj.id
                                   });
                                 }
                               });
                            }
                         });
                       });
                     });
                  }

                  if (newNodes.length > 0) {
                     setNodes(newNodes);
                     setEdges(newEdges);
                     if (parsed.name) setWorkflowTitle(parsed.name);
                     soundFx.playSuccess();
                     alert(`Successfully imported ${newNodes.length} nodes from n8n JSON.`);
                  }
                } else {
                  alert("Invalid n8n format: No nodes array found.");
                }

              } catch (e) {
                alert("Failed to parse JSON. Please ensure it is valid.");
              }
            }}
            className="px-3 py-1.5 bg-[#458588] hover:bg-[#83a598] text-white font-bold text-xs rounded-lg shadow flex items-center gap-1.5 transition-colors"
          >
            Import JSON
          </button>

          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="px-3.5 py-1.5 bg-[#b8bb26] hover:bg-[#98971a] text-[#1d2021] font-bold text-xs rounded-lg shadow flex items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-[#1d2021] ${isSimulating ? 'animate-spin' : ''}`} />
            {isSimulating ? 'Simulating Pipeline...' : 'Test Run Pipeline'}
          </button>

          <button
            onClick={handleExportN8nJson}
            className="px-3 py-1.5 bg-[#ff6d5a] hover:bg-[#ff5540] text-white font-bold text-xs rounded-lg shadow flex items-center gap-1.5 transition-colors"
          >
            {copiedNotification ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            {copiedNotification ? 'n8n JSON Copied!' : 'Export to n8n'}
          </button>
        </div>
      </div>

      {/* Main Workspace Area: Sidebar Palette + Canvas + Node Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Drag & Drop Node Palette */}
        <div className="w-64 bg-[#202020] border-r border-[#3c3836] flex flex-col p-3 overflow-y-auto space-y-3">
          <div className="text-[11px] font-bold text-[#a89984] uppercase tracking-wider px-1">
            Drag Nodes to Canvas
          </div>

          <div className="space-y-2">
            {PALETTE_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify(item));
                  }}
                  className={`p-2.5 rounded-xl border ${item.border} ${item.bg} cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform select-none`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${item.color}30`, color: item.color }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-[#ebdbb2] leading-tight">{item.label}</span>
                  </div>
                  <p className="text-[10px] text-[#a89984] mt-1 pl-8 leading-snug">{item.description}</p>
                </div>
              );
            })}
          </div>

          {/* Helper Tips */}
          <div className="p-3 bg-[#1d2021] border border-[#3c3836] rounded-xl text-[11px] text-[#928374] space-y-1 mt-auto">
            <p className="font-semibold text-[#a89984] flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#fabd2f]" /> Canvas Instructions:
            </p>
            <p>• Drag items into the grid</p>
            <p>• Drag nodes to reposition</p>
            <p>• Click output port (<span className="text-[#fabd2f]">●</span>) to link next node</p>
          </div>
        </div>

        {/* CENTER: Infinite-Grid Visual Canvas */}
        <div
          ref={canvasRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropFromPalette}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
          className="flex-1 relative bg-[#181a1b] overflow-hidden select-none cursor-default"
          style={{
            backgroundImage: 'radial-gradient(#3c3836 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          {/* SVG Connection Wires */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff6d5a" />
                <stop offset="100%" stopColor="#fabd2f" />
              </linearGradient>
            </defs>

            {edges.map((edge) => {
              const src = nodes.find((n) => n.id === edge.sourceNodeId);
              const tgt = nodes.find((n) => n.id === edge.targetNodeId);
              if (!src || !tgt) return null;

              const x1 = src.x + 200;
              const y1 = src.y + 40;
              const x2 = tgt.x;
              const y2 = tgt.y + 40;

              const dx = Math.abs(x2 - x1) * 0.5;
              const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

              const isSrcActive = src.status === 'running' || src.status === 'success';

              return (
                <g key={edge.id}>
                  {/* Background shadow path */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="#282828"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  {/* Active glowing path */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={isSrcActive ? 'url(#edge-gradient)' : '#504945'}
                    strokeWidth={isSrcActive ? '3' : '2'}
                    strokeDasharray={isSrcActive ? '6,6' : 'none'}
                    className={isSrcActive ? 'animate-pulse' : ''}
                  />
                </g>
              );
            })}
          </svg>

          {/* Interactive Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isConnecting = connectingSourceNodeId === node.id;

            let iconColor = '#fabd2f';
            let IconComponent = Bot;

            if (node.category === 'Trigger') {
              iconColor = '#ff6d5a';
              IconComponent = Globe;
            } else if (node.category === 'Slack') {
              iconColor = '#e01e5a';
              IconComponent = MessageSquare;
            } else if (node.category === 'Email') {
              iconColor = '#ea4335';
              IconComponent = Mail;
            } else if (node.category === 'Jira') {
              iconColor = '#0052cc';
              IconComponent = CheckSquare;
            } else if (node.category === 'Sheets') {
              iconColor = '#0f9d58';
              IconComponent = FileText;
            } else if ((node.category as string) === 'Security' || node.subType === 'safetyguard') {
              iconColor = '#fb4934';
              IconComponent = Shield;
            }

            return (
              <motion.div
                key={node.id}
                onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                style={{
                  transform: `translate(${node.x}px, ${node.y}px)`,
                  width: 200,
                }}
                className={`absolute z-10 bg-[#282828] rounded-xl border shadow-xl cursor-move transition-all ${
                  isSelected
                    ? 'border-[#fabd2f] ring-2 ring-[#fabd2f]/30 shadow-2xl'
                    : 'border-[#3c3836] hover:border-[#504945]'
                }`}
              >
                {/* Input Anchor Port (Left) */}
                {node.type !== 'trigger' && (
                  <button
                    onClick={(e) => handleCompleteConnection(e, node.id)}
                    title="Connect input port"
                    className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#1d2021] border-2 border-[#83a598] hover:bg-[#83a598] hover:scale-125 transition-all flex items-center justify-center z-20"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#83a598]" />
                  </button>
                )}

                {/* Node Header */}
                <div className="p-3 border-b border-[#3c3836] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${iconColor}25`, color: iconColor }}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-white truncate max-w-[100px]">
                      {node.label}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  {node.status === 'running' && (
                    <span className="w-2 h-2 rounded-full bg-[#fabd2f] animate-ping" />
                  )}
                  {node.status === 'success' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#b8bb26]" />
                  )}
                </div>

                {/* Node Body Details */}
                <div className="p-2.5 text-[11px] text-[#a89984] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#928374]">Category:</span>
                    <span className="font-mono text-[#ebdbb2]">{node.category}</span>
                  </div>
                  {node.config?.channel && (
                    <div className="flex justify-between truncate">
                      <span className="text-[#928374]">Target:</span>
                      <span className="font-mono text-[#ebdbb2] truncate">{node.config.channel}</span>
                    </div>
                  )}
                  {node.config?.projectKey && (
                    <div className="flex justify-between">
                      <span className="text-[#928374]">Project:</span>
                      <span className="font-mono text-[#ebdbb2]">{node.config.projectKey}</span>
                    </div>
                  )}
                </div>

                {/* Output Anchor Port (Right) */}
                <button
                  onClick={(e) => handleStartConnection(e, node.id)}
                  title="Click to drag connection wire"
                  className={`absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center z-20 ${
                    isConnecting
                      ? 'bg-[#fabd2f] border-white scale-125 animate-bounce'
                      : 'bg-[#1d2021] border-[#fabd2f] hover:bg-[#fabd2f] hover:scale-125'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fabd2f]" />
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* RIGHT: Selected Node Inspector Panel */}
        <div className="w-80 bg-[#202020] border-l border-[#3c3836] p-4 flex flex-col justify-between overflow-y-auto">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#3c3836]">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Settings className="w-4 h-4 text-[#fabd2f]" />
                    Node Inspector
                  </h4>
                  <p className="text-[11px] text-[#a89984]">{selectedNode.label}</p>
                </div>
                <button
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="p-1.5 text-[#fb4934] hover:bg-[#fb4934]/20 rounded-lg transition-colors"
                  title="Delete Node"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Node Title Edit */}
              <div>
                <label className="text-xs font-medium text-[#ebdbb2] mb-1 block">Node Display Name</label>
                <input
                  type="text"
                  value={selectedNode.label}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNodes((prev) =>
                      prev.map((n) => (n.id === selectedNode.id ? { ...n, label: val } : n))
                    );
                  }}
                  className="w-full bg-[#181a1b] border border-[#3c3836] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#fabd2f]"
                />
              </div>

              {/* Dynamic Config by Category */}
              {selectedNode.category === 'Slack' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-[#ebdbb2] mb-1 block">Slack Channel / Target</label>
                    <input
                      type="text"
                      value={selectedNode.config?.channel || '#engineering'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes((prev) =>
                          prev.map((n) =>
                            n.id === selectedNode.id ? { ...n, config: { ...n.config, channel: val } } : n
                          )
                        );
                      }}
                      className="w-full bg-[#181a1b] border border-[#3c3836] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#fabd2f]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#ebdbb2] mb-1 block">Message Template</label>
                    <textarea
                      rows={3}
                      value={selectedNode.config?.messageTemplate || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes((prev) =>
                          prev.map((n) =>
                            n.id === selectedNode.id
                              ? { ...n, config: { ...n.config, messageTemplate: val } }
                              : n
                          )
                        );
                      }}
                      className="w-full bg-[#181a1b] border border-[#3c3836] rounded-lg p-2 text-xs font-mono text-[#ebdbb2] resize-none"
                    />
                  </div>
                </div>
              )}

              {selectedNode.category === 'Email' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-[#ebdbb2] mb-1 block">Recipient Email (To:)</label>
                    <input
                      type="text"
                      value={selectedNode.config?.to || 'ops@company.internal'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes((prev) =>
                          prev.map((n) =>
                            n.id === selectedNode.id ? { ...n, config: { ...n.config, to: val } } : n
                          )
                        );
                      }}
                      className="w-full bg-[#181a1b] border border-[#3c3836] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#fabd2f]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#ebdbb2] mb-1 block">Subject Header</label>
                    <input
                      type="text"
                      value={selectedNode.config?.subject || 'Alert'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes((prev) =>
                          prev.map((n) =>
                            n.id === selectedNode.id ? { ...n, config: { ...n.config, subject: val } } : n
                          )
                        );
                      }}
                      className="w-full bg-[#181a1b] border border-[#3c3836] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#fabd2f]"
                    />
                  </div>
                </div>
              )}

              {selectedNode.category === 'Jira' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-[#ebdbb2] mb-1 block">Jira Project Key</label>
                    <input
                      type="text"
                      value={selectedNode.config?.projectKey || 'ENG'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes((prev) =>
                          prev.map((n) =>
                            n.id === selectedNode.id ? { ...n, config: { ...n.config, projectKey: val } } : n
                          )
                        );
                      }}
                      className="w-full bg-[#181a1b] border border-[#3c3836] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#fabd2f]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#ebdbb2] mb-1 block">Issue Type</label>
                    <select
                      value={selectedNode.config?.issueType || 'Task'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes((prev) =>
                          prev.map((n) =>
                            n.id === selectedNode.id ? { ...n, config: { ...n.config, issueType: val } } : n
                          )
                        );
                      }}
                      className="w-full bg-[#181a1b] border border-[#3c3836] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#fabd2f]"
                    >
                      <option value="Bug">Bug</option>
                      <option value="Task">Task</option>
                      <option value="Epic">Epic</option>
                      <option value="Story">Story</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedNode.category === 'Agent' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-[#ebdbb2] mb-1 block">Autonomous Agent Lead</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedNode.config?.agentName || selectedNode.label}
                      className="w-full bg-[#181a1b] border border-[#3c3836] rounded-lg px-3 py-1.5 text-xs text-[#a89984] focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#ebdbb2] mb-1 block">Agent Directive / Prompt</label>
                    <textarea
                      rows={3}
                      placeholder="Prompt instructions for this pipeline step..."
                      value={selectedNode.config?.prompt || 'Perform autonomous analysis and format payload for next node.'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes((prev) =>
                          prev.map((n) =>
                            n.id === selectedNode.id ? { ...n, config: { ...n.config, prompt: val } } : n
                          )
                        );
                      }}
                      className="w-full bg-[#181a1b] border border-[#3c3836] rounded-lg p-2 text-xs font-mono text-[#ebdbb2] resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Live Output Inspector */}
              {selectedNode.outputData && (
                <div className="p-3 bg-[#181a1b] border border-[#3c3836] rounded-xl space-y-1.5">
                  <div className="text-xs font-semibold text-[#b8bb26] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Live Node Output
                  </div>
                  <pre className="text-[10px] font-mono text-[#a89984] bg-black/40 p-2 rounded max-h-32 overflow-y-auto">
                    {JSON.stringify(selectedNode.outputData, null, 2)}
                  </pre>
                </div>
              )}

              {/* Adjustable Config JSON block */}
              <div className="mt-4 pt-4 border-t border-[#3c3836]">
                <label className="text-xs font-medium text-[#ebdbb2] mb-1 block">Adjustable Configuration (Raw JSON)</label>
                <ConfigEditor 
                  config={selectedNode.config} 
                  onChange={(newConfig) => {
                    setNodes((prev) =>
                      prev.map((n) =>
                        n.id === selectedNode.id ? { ...n, config: newConfig } : n
                      )
                    );
                  }}
                />
                <p className="text-[9px] text-[#928374] mt-1">Edit JSON to adjust any configuration parameters dynamically.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#a89984] text-xs text-center">
              <Sliders className="w-8 h-8 mb-2 opacity-40" />
              Click any node on the canvas to inspect & configure properties.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ConfigEditor: React.FC<{ config: any, onChange: (config: any) => void }> = ({ config, onChange }) => {
  const [text, setText] = useState(JSON.stringify(config, null, 2));
  const [error, setError] = useState(false);

  useEffect(() => {
    // Only update text from props if it represents a fundamentally different object to avoid cursor jumps
    try {
      const parsedText = JSON.parse(text);
      if (JSON.stringify(parsedText) !== JSON.stringify(config)) {
        setText(JSON.stringify(config, null, 2));
      }
    } catch {
      // If currently invalid, maybe we let it be until they fix it
    }
  }, [config, text]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    try {
      const parsed = JSON.parse(val);
      setError(false);
      onChange(parsed);
    } catch {
      setError(true);
    }
  };

  return (
    <textarea
      rows={6}
      value={text}
      onChange={handleChange}
      className={`w-full bg-[#181a1b] border rounded-lg p-2 text-xs font-mono text-[#ebdbb2] resize-y focus:outline-none ${error ? 'border-[#fb4934]' : 'border-[#3c3836] focus:border-[#fabd2f]'}`}
    />
  );
};
