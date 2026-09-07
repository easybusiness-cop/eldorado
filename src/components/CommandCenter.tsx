import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Agent, AgentLog, FleetTask, AttachedFile, SystemTelemetry, UserProfile } from '../types';
import { soundFx, speakText, createSpeechRecognizer, parseMissionVoiceTrigger, parseAgentVoiceDelegation, startMicrophoneAudioCapture, AudioCaptureController, cleanAgentName } from '../utils/speech';
import { FleetD3PerformanceChart } from './FleetD3PerformanceChart';
import { FleetTaskCompletionBarChart } from './FleetTaskCompletionBarChart';
import { FleetTokenTrendsLineChart } from './FleetTokenTrendsLineChart';
import { FleetHealthMonitor } from './FleetHealthMonitor';
import { RuffloObjectivesPanel } from './RuffloObjectivesPanel';
import { RuffloLoopPanel } from './RuffloLoopPanel';
import { MasterMetaPanel } from './MasterMetaPanel';
import { EngineeringDepartmentPanel } from './EngineeringDepartmentPanel';
import { SpiderWebPanel } from './SpiderWebPanel';
import confetti from 'canvas-confetti';
import { runAgentStandardWorkflow, STANDARD_WORKFLOW_STAGES, WorkflowExecutionState } from '../utils/agentWorkflowEngine';
import {
  Terminal,
  Activity,
  CheckSquare,
  HelpCircle,
  Zap,
  Brain,
  Network,
  ListFilter,
  Command,
  Cpu,
  Send,
  Paperclip,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Code2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X,
  Sparkles,
  Shield,
  Search,
  BarChart3,
  TrendingUp,
  Folder,
  Link,
  DollarSign,
  Briefcase,
  Award,
  Radio,
  Target,
  Rocket,
} from 'lucide-react';

interface CommandCenterProps {
  agents: Agent[];
  selectedAgent: Agent;
  onSelectAgent: (agentId: string) => void;
  logs: AgentLog[];
  tasks: FleetTask[];
  onAddTask: (task: Partial<FleetTask>) => void;
  onExecutePrompt: (prompt: string, attachedFile?: AttachedFile) => Promise<void>;
  onExecuteCode: (code: string) => Promise<{ success: boolean; logs: string[]; output: any }>;
  onOpenIde: () => void;
  autoMode: boolean;
  onToggleAutoMode: () => void;
  userProfile: UserProfile;
  telemetry: SystemTelemetry;
  onSetWorkspaceTab?: (tab: 'command' | 'fleet' | 'network') => void;
  company?: any;
  departments?: any[];
  projects?: any[];
  missions?: any[];
  audits?: any[];
  accounts?: any[];
}

type TabType =
  | 'department'
  | 'spider-web'
  | 'master'
  | 'loop'
  | 'terminal'
  | 'task-rates'
  | 'token-trends'
  | 'projects'
  | 'integrations'
  | 'workflows'
  | 'ledger'
  | 'compliance'
  | 'analytics'
  | 'monitor'
  | 'tasks'
  | 'ask me'
  | 'triggers'
  | 'memory'
  | 'graph'
  | 'activity'
  | 'commands'
  | 'workers'
  | 'rufflo';

export const CommandCenter: React.FC<CommandCenterProps> = ({
  agents,
  selectedAgent,
  onSelectAgent,
  logs,
  tasks,
  onAddTask,
  onExecutePrompt,
  onExecuteCode,
  onOpenIde,
  autoMode,
  onToggleAutoMode,
  userProfile,
  telemetry,
  onSetWorkspaceTab,
  company,
  departments = [],
  projects = [],
  missions = [],
  audits = [],
  accounts = [],
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('department');
  const [inputPrompt, setInputPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fontSize, setFontSize] = useState(12);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [micAudioLevel, setMicAudioLevel] = useState(0);
  const [liveVoiceTranscript, setLiveVoiceTranscript] = useState('');
  const [activeVoiceMission, setActiveVoiceMission] = useState<{
    id: string;
    title: string;
    objective: string;
    status: string;
    progress: number;
    tasksCount: number;
    timestamp: number;
  } | null>(null);
  const [voiceTriggerNotice, setVoiceTriggerNotice] = useState<{
    message: string;
    missionName: string;
    timestamp: number;
  } | null>(null);
  const [isInitializingMission, setIsInitializingMission] = useState(false);
  const audioCaptureRef = useRef<AudioCaptureController | null>(null);
  const lastTriggeredMissionRef = useRef<string | null>(null);
  const [voiceSpeechEnabled, setVoiceSpeechEnabled] = useState(userProfile.preferences.voiceAutoSpeak ?? true);
  const [bypassPermissions, setBypassPermissions] = useState(true);
  const [commandFilter, setCommandFilter] = useState('');

  // Enterprise Workflow, Approvals & Compliance state
  const [workflowTemplates, setWorkflowTemplates] = useState<any[]>([]);
  const [activeWorkflowsList, setActiveWorkflowsList] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [securityTestResult, setSecurityTestResult] = useState<any>(null);
  const [isRunningSecurityTest, setIsRunningSecurityTest] = useState(false);
  const [selectedWorkflowTemplate, setSelectedWorkflowTemplate] = useState<string>('finance-audit');
  const [workflowTriggerAgentId, setWorkflowTriggerAgentId] = useState<string>('kevin');
  const [controlPanelWorkflowState, setControlPanelWorkflowState] = useState<WorkflowExecutionState | null>(null);
  const [isCPWorkflowRunning, setIsCPWorkflowRunning] = useState<boolean>(false);
  const [cpWorkflowDirective, setCpWorkflowDirective] = useState<string>('Execute 5-step standard engineering workflow & optimization pipeline.');

  const handleRunControlPanelStandardWorkflow = async () => {
    if (isCPWorkflowRunning) return;
    setIsCPWorkflowRunning(true);
    soundFx.playClick();

    const targetAgent = agents.find((a) => a.id === workflowTriggerAgentId) || selectedAgent;

    await runAgentStandardWorkflow(
      targetAgent,
      cpWorkflowDirective || `Execute 5-step standard engineering workflow for ${targetAgent.name}`,
      (st) => {
        setControlPanelWorkflowState(st);
      }
    );

    setIsCPWorkflowRunning(false);
    soundFx.playNotification();
  };

  const fetchWorkflowsAndApprovals = async () => {
    const defaultTemplates = [
      {
        templateId: 'finance-audit',
        name: 'Quarterly Financial Ledger Consolidation',
        departmentId: 'finance',
        steps: [
          { id: 'step-1', name: 'Fetch Recent Expenses Ledger', tool: 'database', action: 'execute_query', status: 'PENDING' },
          { id: 'step-2', name: 'Verify Bank Statement Ledger Reconciliation', tool: 'http', action: 'fetch_endpoint', status: 'PENDING' },
          { id: 'step-3', name: 'Generate Executive Reconciliation Invoice Entries', tool: 'database', action: 'execute_query', status: 'PENDING' }
        ]
      },
      {
        templateId: 'crm-enrichment',
        name: 'Lead Qualification & Custom CRM Ingestion',
        departmentId: 'growth',
        steps: [
          { id: 'step-1', name: 'Query High MRR Lead Candidates', tool: 'web', action: 'google_search', status: 'PENDING' },
          { id: 'step-2', name: 'Log Prospects in Company DB Ledger', tool: 'database', action: 'execute_query', status: 'PENDING' }
        ]
      },
      {
        templateId: 'devops-deploy',
        name: 'DevOps Automated Patch Deployment Pipeline',
        departmentId: 'engineering',
        steps: [
          { id: 'step-1', name: 'Fetch Open-Source Repository Patches', tool: 'github', action: 'create_pull_request', status: 'PENDING' },
          { id: 'step-2', name: 'Re-verify Staging Environment Health Checks', tool: 'http', action: 'fetch_endpoint', status: 'PENDING' }
        ]
      }
    ];

    const defaultApprovalsList = [
      {
        id: 'app-demo-1',
        executionId: 'ex-101',
        requestedBy: 'Dwight Schrute',
        agentId: 'dwight',
        action: 'database.execute_query',
        parameters: { sql: "DELETE FROM audit_logs WHERE risk_level = 'low'" },
        riskLevel: 'HIGH',
        reason: 'Database cleanup of non-critical audit events',
        status: 'PENDING',
        createdAt: Date.now() - 3600000,
        expiresAt: Date.now() + 82800000
      }
    ];

    try {
      const results = await Promise.allSettled([
        fetch('/api/workflows/templates', { headers: { Accept: 'application/json' } }),
        fetch('/api/workflows', { headers: { Accept: 'application/json' } }),
        fetch('/api/approvals', { headers: { Accept: 'application/json' } })
      ]);

      const [tplResult, wfResult, appResult] = results;

      if (tplResult.status === 'fulfilled' && tplResult.value.ok) {
        const contentType = tplResult.value.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await tplResult.value.json();
          if (data.success && Array.isArray(data.templates) && data.templates.length > 0) {
            setWorkflowTemplates(data.templates);
          } else {
            setWorkflowTemplates((prev) => prev.length > 0 ? prev : defaultTemplates);
          }
        }
      } else {
        setWorkflowTemplates((prev) => prev.length > 0 ? prev : defaultTemplates);
      }

      if (wfResult.status === 'fulfilled' && wfResult.value.ok) {
        const contentType = wfResult.value.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await wfResult.value.json();
          if (data.success && Array.isArray(data.workflows)) {
            setActiveWorkflowsList(data.workflows);
          }
        }
      }

      if (appResult.status === 'fulfilled' && appResult.value.ok) {
        const contentType = appResult.value.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await appResult.value.json();
          if (data.success && Array.isArray(data.approvals)) {
            setApprovals(data.approvals);
          } else {
            setApprovals((prev) => prev.length > 0 ? prev : defaultApprovalsList);
          }
        }
      } else {
        setApprovals((prev) => prev.length > 0 ? prev : defaultApprovalsList);
      }
    } catch (e) {
      setWorkflowTemplates((prev) => prev.length > 0 ? prev : defaultTemplates);
      setApprovals((prev) => prev.length > 0 ? prev : defaultApprovalsList);
    }
  };

  useEffect(() => {
    fetchWorkflowsAndApprovals();
    const interval = setInterval(fetchWorkflowsAndApprovals, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApprovalDecision = async (approvalId: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      soundFx.playClick();
      const res = await fetch(`/api/approvals/${approvalId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          decider: userProfile.displayName || "Michael Scott"
        })
      });
      if (res.ok) {
        soundFx.playNotification();
        fetchWorkflowsAndApprovals();
      }
    } catch (e) {
      console.error("Failed to make approval decision:", e);
    }
  };

  const handleTriggerWorkflow = async () => {
    try {
      soundFx.playClick();
      const res = await fetch('/api/workflows/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedWorkflowTemplate,
          agentId: workflowTriggerAgentId
        })
      });
      if (res.ok) {
        soundFx.playNotification();
        fetchWorkflowsAndApprovals();
      }
    } catch (e) {
      console.error("Failed to trigger workflow:", e);
    }
  };

  const handleRunSecurityTests = async () => {
    try {
      soundFx.playClick();
      setIsRunningSecurityTest(true);
      const res = await fetch('/api/security/test-suite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.results) {
          setSecurityTestResult(data.results);
          soundFx.playNotification();
        }
      }
    } catch (e) {
      console.error("Failed to run security tests:", e);
    } finally {
      setIsRunningSecurityTest(false);
    }
  };

  const terminalEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto scroll terminal logs
  useEffect(() => {
    if (activeTab === 'terminal') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  // Cleanup microphone audio capture and speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (audioCaptureRef.current) {
        audioCaptureRef.current.stop();
      }
    };
  }, []);

  // Voice Trigger Mission Initializer: "Rufflo, initialize [Mission Name]"
  const handleInitializeVoiceMission = async (missionName: string) => {
    if (!missionName || !missionName.trim()) return;
    const cleanName = missionName.trim();
    setIsInitializingMission(true);
    soundFx.playSuccessChime();

    confetti({
      particleCount: 45,
      spread: 70,
      origin: { y: 0.65, x: 0.5 },
    });

    const missionId = `mis-vce-${Date.now()}`;
    const newVoiceMission = {
      id: missionId,
      title: cleanName,
      objective: `Autonomous fleet execution for mission "${cleanName}" initiated via microphone voice trigger.`,
      status: 'active',
      progress: 25,
      tasksCount: 4,
      timestamp: Date.now()
    };

    setActiveVoiceMission(newVoiceMission);
    setVoiceTriggerNotice({
      message: `Voice trigger detected: "Rufflo, initialize ${cleanName}"`,
      missionName: cleanName,
      timestamp: Date.now()
    });

    // Speak audio confirmation via SpeechSynthesis
    if (voiceSpeechEnabled) {
      speakText(
        `Mission ${cleanName} initialized. Ruflo intelligence has registered the mission and dispatched execution tasks across the fleet.`,
        selectedAgent
      );
    }

    // 1. Create Mission in backend DB
    try {
      await fetch('/api/missions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mission: {
            id: missionId,
            title: cleanName,
            objective: `Execute autonomous workflow for "${cleanName}" commanded via voice trigger.`,
            projectId: projects[0]?.id || 'prj-alpha',
            stages: [
              { id: 'stg-1', name: 'Scope & Architecture Decomposition', status: 'completed' },
              { id: 'stg-2', name: 'Zero-Trust Security & Perimeter Audit', status: 'in_progress' },
              { id: 'stg-3', name: 'Full-Stack Implementation & Dynamic Feature Tooling', status: 'in_progress' },
              { id: 'stg-4', name: 'Continuous Telemetry & Quality Assurance', status: 'pending' },
            ]
          },
          agentId: selectedAgent.id || 'michael'
        })
      });
    } catch (e) {
      console.warn('API mission creation fallback:', e);
    }

    // 2. Dispatch mission tasks to fleet agents
    const subtasks: FleetTask[] = [
      {
        id: `tsk-vce-arch-${Date.now()}`,
        title: `[Mission: ${cleanName}] Scope & System Architecture Blueprint`,
        description: `Decompose architecture for mission "${cleanName}"`,
        assignedTo: 'michael',
        priority: 'high',
        status: 'running',
        progress: 40,
        createdAt: Date.now(),
      },
      {
        id: `tsk-vce-sec-${Date.now() + 1}`,
        title: `[Mission: ${cleanName}] Defensive Security & Permissions Audit`,
        description: `Audit perimeter and IAM roles for mission "${cleanName}"`,
        assignedTo: 'dwight',
        priority: 'critical',
        status: 'queued',
        progress: 10,
        createdAt: Date.now() + 1,
      },
      {
        id: `tsk-vce-eng-${Date.now() + 2}`,
        title: `[Mission: ${cleanName}] Full-Stack Engineering & Dynamic Tool Execution`,
        description: `Execute engineering pipeline for mission "${cleanName}"`,
        assignedTo: 'cline',
        priority: 'high',
        status: 'queued',
        progress: 0,
        createdAt: Date.now() + 2,
      },
      {
        id: `tsk-vce-qa-${Date.now() + 3}`,
        title: `[Mission: ${cleanName}] Continuous Memory Sweep & Telemetry Verification`,
        description: `Validate IPC channels and error-free memory logs for mission "${cleanName}"`,
        assignedTo: 'toby',
        priority: 'medium',
        status: 'queued',
        progress: 0,
        createdAt: Date.now() + 3,
      }
    ];

    subtasks.forEach((st) => onAddTask(st));

    // Progress simulation for HUD
    setTimeout(() => {
      setActiveVoiceMission((prev) => prev ? { ...prev, progress: 65 } : null);
    }, 4000);
    setTimeout(() => {
      setActiveVoiceMission((prev) => prev ? { ...prev, progress: 100, status: 'completed' } : null);
      setIsInitializingMission(false);
    }, 9000);
  };

  // Direct Voice Agent Delegation Handler: "Rufflo, tell [Agent] to [Task]"
  const handleVoiceAgentDelegation = (agentIdOrName: string, taskDescription: string) => {
    if (!taskDescription || !taskDescription.trim()) return;
    const targetAgent = agents.find(
      (a) => a.id.toLowerCase() === agentIdOrName.toLowerCase() ||
             a.name.toLowerCase().includes(agentIdOrName.toLowerCase())
    ) || selectedAgent;

    soundFx.playSuccessChime();
    onSelectAgent(targetAgent);

    setVoiceTriggerNotice({
      message: `Delegated to ${targetAgent.name}: "${taskDescription}"`,
      missionName: taskDescription,
      timestamp: Date.now(),
    });

    if (voiceSpeechEnabled) {
      speakText(
        `Task dispatched to ${targetAgent.name}. ${targetAgent.name} has accepted "${taskDescription}".`,
        targetAgent
      );
    }

    const delegatedTask: FleetTask = {
      id: `tsk-voice-del-${Date.now()}`,
      title: taskDescription,
      description: `Voice-delegated instruction: "${taskDescription}"`,
      assignedTo: targetAgent.id,
      priority: 'high',
      status: 'running',
      progress: 20,
      createdAt: Date.now(),
    };

    onAddTask(delegatedTask);

    // Call execution loop API
    fetch('/api/agent/execute-loop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: projects[0]?.id || 'prj-alpha',
        assignedTo: targetAgent.id,
        title: taskDescription,
        description: `Voice-delegated operational instruction for ${targetAgent.name}: ${taskDescription}`,
        priority: 'high',
        userProfile,
      }),
    }).catch((err) => console.warn('Voice execute loop fallback:', err));
  };

  // Voice speech recognition handler with Microphone Browser API & Trigger Detection
  const toggleVoiceRecording = async () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (audioCaptureRef.current) {
        audioCaptureRef.current.stop();
        audioCaptureRef.current = null;
      }
      setIsListening(false);
      setMicAudioLevel(0);
      return;
    }

    soundFx.playClick();
    setLiveVoiceTranscript('');

    // 1. Microphone Browser API: Capture live audio stream & VU meter levels
    try {
      const audioCapture = await startMicrophoneAudioCapture((level) => {
        setMicAudioLevel(level);
      });
      if (audioCapture) {
        audioCaptureRef.current = audioCapture;
      }
    } catch (err) {
      console.warn('Microphone capture stream failed:', err);
    }

    // 2. Speech-to-Text with Wake-Trigger parsing: "Rufflo, initialize [Mission Name]" or "Rufflo, tell [Agent] to [Task]"
    const recognizer = createSpeechRecognizer(
      (transcript, isFinal) => {
        setLiveVoiceTranscript(transcript);

        // Check for specific spoken commands: "Create task for Dwight" or "Display fleet health" directly
        const cleanTranscript = transcript.toLowerCase().trim();

        // 1. "Display fleet health" / "Show fleet health"
        if (
          cleanTranscript.includes('display fleet health') || 
          cleanTranscript.includes('show fleet health') || 
          cleanTranscript.includes('display fleet') || 
          cleanTranscript.includes('show fleet telemetry')
        ) {
          if (lastTriggeredMissionRef.current !== 'cmd-display-fleet-health') {
            lastTriggeredMissionRef.current = 'cmd-display-fleet-health';
            if (onSetWorkspaceTab) {
              onSetWorkspaceTab('fleet');
            }
            setVoiceTriggerNotice({
              message: 'Voice Command: Displaying Fleet Health Monitor',
              type: 'success' as any
            });
            if (voiceSpeechEnabled) {
              speakText('Displaying agent fleet health and telemetry monitor.', selectedAgent);
            }
          }
          return;
        }

        // 2. "Display spider web" / "Show spider web" / "Show network" / "Display network"
        if (
          cleanTranscript.includes('display spider web') || 
          cleanTranscript.includes('show spider web') || 
          cleanTranscript.includes('show network') || 
          cleanTranscript.includes('display network') ||
          cleanTranscript.includes('show spider-web')
        ) {
          if (lastTriggeredMissionRef.current !== 'cmd-display-spider-web') {
            lastTriggeredMissionRef.current = 'cmd-display-spider-web';
            if (onSetWorkspaceTab) {
              onSetWorkspaceTab('network');
            }
            setVoiceTriggerNotice({
              message: 'Voice Command: Displaying Company Intelligence Network',
              type: 'success' as any
            });
            if (voiceSpeechEnabled) {
              speakText('Opening company intelligence spider web network.', selectedAgent);
            }
          }
          return;
        }

        // 3. "Display command center" / "Show command center" / "Show command"
        if (
          cleanTranscript.includes('display command center') || 
          cleanTranscript.includes('show command center') || 
          cleanTranscript.includes('show command')
        ) {
          if (lastTriggeredMissionRef.current !== 'cmd-display-command-center') {
            lastTriggeredMissionRef.current = 'cmd-display-command-center';
            if (onSetWorkspaceTab) {
              onSetWorkspaceTab('command');
            }
            setVoiceTriggerNotice({
              message: 'Voice Command: Displaying Command Center',
              type: 'success' as any
            });
            if (voiceSpeechEnabled) {
              speakText('Opening central command and dispatch center.', selectedAgent);
            }
          }
          return;
        }

        // 4. "Create task for Dwight" or "Create task for Jim" or "Create task for [Agent]"
        const createTaskRegex = /(?:create\s+task\s+for\s+)([a-zA-Z\s\-0-9]+?)(?:\s+to\s+(.+))?$/i;
        const matchCreate = transcript.match(createTaskRegex);
        if (matchCreate && matchCreate[1]) {
          const rawAgent = matchCreate[1].trim();
          const taskDescription = matchCreate[2] ? matchCreate[2].trim() : '';
          const agentId = cleanAgentName(rawAgent);
          const targetAgent = agents.find((a) => a.id === agentId || a.name.toLowerCase().includes(rawAgent.toLowerCase()));

          if (targetAgent) {
            const cacheKey = `cmd-create-task-${targetAgent.id}-${taskDescription.toLowerCase()}`;
            if (lastTriggeredMissionRef.current !== cacheKey) {
              lastTriggeredMissionRef.current = cacheKey;
              
              const titleText = taskDescription ? taskDescription.charAt(0).toUpperCase() + taskDescription.slice(1) : `${targetAgent.name} System Update`;
              const descriptionText = taskDescription 
                ? `Voice-delegated instruction: "${taskDescription}"`
                : `Autonomous workspace execution loop requested via voice command for ${targetAgent.name}.`;

              const delegatedTask: FleetTask = {
                id: `tsk-voice-del-${Date.now()}`,
                title: titleText,
                description: descriptionText,
                assignedTo: targetAgent.id,
                priority: 'high',
                status: 'running',
                progress: 20,
                createdAt: Date.now(),
              };

              onAddTask(delegatedTask);

              // Call execution loop API
              fetch('/api/agent/execute-loop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  projectId: 'prj-alpha',
                  assignedTo: targetAgent.id,
                  title: titleText,
                  description: descriptionText,
                  priority: 'high',
                  userProfile,
                }),
              }).catch((err) => console.warn('Voice execute loop fallback:', err));

              setVoiceTriggerNotice({
                message: `Voice Command: Created task for ${targetAgent.name}`,
                type: 'success' as any
              });

              if (voiceSpeechEnabled) {
                speakText(`Created task for ${targetAgent.name}. Task title: ${titleText}. Initializing autonomous execution loop.`, targetAgent);
              }
            }
            return;
          }
        }

        // Check for voice-to-text trigger: "Rufflo, initialize [Mission Name]"
        const detectedMission = parseMissionVoiceTrigger(transcript);
        if (detectedMission && lastTriggeredMissionRef.current !== `mis-${detectedMission.toLowerCase()}`) {
          lastTriggeredMissionRef.current = `mis-${detectedMission.toLowerCase()}`;
          handleInitializeVoiceMission(detectedMission);
          return;
        }

        // Check for direct voice agent delegation: "Rufflo, tell [Agent] to [Task]"
        const detectedDelegation = parseAgentVoiceDelegation(transcript);
        if (detectedDelegation && lastTriggeredMissionRef.current !== `del-${detectedDelegation.agentName}-${detectedDelegation.taskDescription.toLowerCase()}`) {
          lastTriggeredMissionRef.current = `del-${detectedDelegation.agentName}-${detectedDelegation.taskDescription.toLowerCase()}`;
          handleVoiceAgentDelegation(detectedDelegation.agentName, detectedDelegation.taskDescription);
          return;
        }

        if (isFinal) {
          setInputPrompt((prev) => (prev ? prev + ' ' + transcript : transcript));
        }
      },
      (err) => {
        console.warn('Speech Recognition Error:', err);
        setIsListening(false);
        setMicAudioLevel(0);
        if (audioCaptureRef.current) {
          audioCaptureRef.current.stop();
          audioCaptureRef.current = null;
        }
      },
      () => {
        setIsListening(false);
        setMicAudioLevel(0);
        if (audioCaptureRef.current) {
          audioCaptureRef.current.stop();
          audioCaptureRef.current = null;
        }
      },
      { continuous: true }
    );

    if (recognizer) {
      recognitionRef.current = recognizer;
      try {
        recognizer.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
        setMicAudioLevel(0);
      }
    } else {
      setIsListening(true);
    }
  };

  // Handle file attachment
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundFx.playNotification();
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setAttachedFile({
        name: file.name,
        size: file.size,
        type: file.type || 'text/plain',
        content,
      });
    };
    reader.readAsText(file);
  };

  // Handle message submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() && !attachedFile) return;

    const currentPrompt = inputPrompt;
    const currentFile = attachedFile;

    setInputPrompt('');
    setAttachedFile(null);
    setIsProcessing(true);
    soundFx.playClick();

    try {
      await onExecutePrompt(currentPrompt, currentFile || undefined);
      soundFx.playNotification();
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.8, x: 0.8 },
      });
    } catch (err) {
      console.error('Error executing prompt:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'department' as TabType, label: 'department', icon: <Cpu className="w-3.5 h-3.5 text-[#fabd2f]" /> },
    { id: 'spider-web' as TabType, label: 'spider web', icon: <Network className="w-3.5 h-3.5 text-[#22ff88]" /> },
    { id: 'master', label: 'master', icon: <Cpu className="w-3.5 h-3.5 text-[#fabd2f]" /> },
    { id: 'loop', label: 'loop', icon: <Cpu className="w-3.5 h-3.5 text-[#fabd2f]" /> },
    { id: 'terminal', label: 'terminal', icon: <Terminal className="w-3.5 h-3.5" /> },
    { id: 'task-rates', label: 'task rates', icon: <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'token-trends', label: 'token trends', icon: <TrendingUp className="w-3.5 h-3.5 text-[#fabd2f]" /> },
    { id: 'projects', label: 'projects', icon: <Briefcase className="w-3.5 h-3.5 text-[#076678]" /> },
    { id: 'integrations', label: 'integrations', icon: <Link className="w-3.5 h-3.5 text-[#8f3f71]" /> },
    { id: 'workflows', label: 'workflows', icon: <Cpu className="w-3.5 h-3.5 text-[#b16286]" /> },
    { id: 'ledger', label: 'ledger', icon: <DollarSign className="w-3.5 h-3.5 text-[#b57614]" /> },
    { id: 'compliance', label: 'compliance', icon: <Shield className="w-3.5 h-3.5 text-[#98971a]" /> },
    { id: 'analytics', label: 'fleet performance', icon: <BarChart3 className="w-3.5 h-3.5 text-[#fabd2f]" /> },
    { id: 'monitor', label: 'monitor', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'tasks', label: 'tasks', icon: <CheckSquare className="w-3.5 h-3.5" /> },
    { id: 'ask me', label: 'ask me', icon: <HelpCircle className="w-3.5 h-3.5" /> },
    { id: 'triggers', label: 'triggers', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'memory', label: 'memory', icon: <Brain className="w-3.5 h-3.5" /> },
    { id: 'graph', label: 'graph', icon: <Network className="w-3.5 h-3.5" /> },
    { id: 'activity', label: 'activity', icon: <ListFilter className="w-3.5 h-3.5" /> },
    { id: 'commands', label: 'commands', icon: <Command className="w-3.5 h-3.5" /> },
    { id: 'workers', label: 'workers', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'rufflo', label: 'Rufflo Loop', icon: <Target className="w-3.5 h-3.5 text-rose-500" /> },
  ];

  return (
    <div
      className="flex flex-col h-full overflow-hidden animate-in"
      style={{
        background: 'var(--bg-1)',
        color: 'var(--text-0)',
        border: '1px solid var(--border-0)',
        borderRadius: 'var(--radius-lg)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Command Center Header */}
      <div
        className="flex items-center justify-between gap-3 px-3"
        style={{
          height: 48,
          borderBottom: '1px solid var(--border-0)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        {/* Agent Info & Status */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 99,
              background: 'var(--status-running)',
            }}
            className="animate-pulse-soft"
          />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-2)' }}>
            Command Center
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-1)' }} className="truncate">
            {selectedAgent.name} - {selectedAgent.currentTask || selectedAgent.title}
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            id="btn-open-d3"
            onClick={() => {
              soundFx.playClick();
              setActiveTab('analytics');
            }}
            className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 border transition-colors ${
              activeTab === 'analytics'
                ? 'bg-[#fabd2f] text-[#1d2021] border-[#fabd2f]'
                : 'bg-[#fabd2f]/10 hover:bg-[#fabd2f]/25 text-[#b57614] dark:text-[#fabd2f] border-[#fabd2f]/40'
            }`}
            title="Open D3 Fleet Performance Dashboard"
          >
            <BarChart3 className="w-3 h-3" />
            <span>Fleet Performance</span>
          </button>

          <button
            id="btn-toggle-auto"
            onClick={() => {
              soundFx.playClick();
              onToggleAutoMode();
            }}
            className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 border transition-colors ${
              autoMode
                ? 'bg-[#b8bb26] text-[#1d2021] border-[#98971a]'
                : 'bg-[#d5c4a1] dark:bg-[#3c3836] text-[#504945] dark:text-[#ebdbb2] border-[#bdae93] dark:border-[#504945]'
            }`}
            title="Toggle Fleet Autonomous Mode"
          >
            <Play className={`w-3 h-3 ${autoMode ? 'fill-current' : ''}`} />
            <span>auto</span>
          </button>

          <button
            id="btn-open-ide"
            onClick={() => {
              soundFx.playClick();
              onOpenIde();
            }}
            className="px-2 py-1 rounded text-[11px] font-bold bg-[#83a598]/20 hover:bg-[#83a598]/30 text-[#076678] dark:text-[#83a598] border border-[#83a598]/40 flex items-center gap-1"
            title="Open Live Dynamic Feature IDE"
          >
            <Code2 className="w-3 h-3" />
            <span>{'<> IDE'}</span>
          </button>
        </div>
      </div>

      {/* Tab rail */}
      <div
        className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto no-scrollbar"
        style={{ borderBottom: '1px solid var(--border-0)', background: 'var(--bg-2)' }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              id={`tab-${String(tab.id).replace(/\s+/g, '-')}`}
              onClick={() => {
                soundFx.playClick();
                setActiveTab(tab.id);
              }}
              className="rufflo-btn"
              style={{
                height: 30,
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                borderColor: isActive ? 'var(--border-accent)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-2)',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Canvas */}
      <div className="flex-1 min-h-0 overflow-auto p-3" style={{ background: 'var(--bg-1)' }}>
        {activeTab === 'department' && (
          <EngineeringDepartmentPanel />
        )}

        {activeTab === 'spider-web' && (
          <SpiderWebPanel agents={agents} />
        )}

        {activeTab === 'master' && (
          <MasterMetaPanel />
        )}

        {activeTab === 'loop' && (
          <RuffloLoopPanel />
        )}

        {/* Tab Content Display */}
        {activeTab !== 'loop' && activeTab !== 'master' && activeTab !== 'department' && activeTab !== 'spider-web' && (
          <div className="animate-in space-y-4">
        {/* 1. Projects Portfolio View */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#d5c4a1] dark:border-[#3c3836]">
              <span className="font-bold text-xs uppercase tracking-wider text-[#076678] dark:text-[#83a598]">Company Projects Portfolio</span>
              <span className="text-[10px] text-[#7c6f64] dark:text-[#928374] font-bold">({projects.length} Active Workspaces)</span>
            </div>

            {/* Quick Create Project */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const nameInput = form.elements.namedItem('prjName') as HTMLInputElement;
              const descInput = form.elements.namedItem('prjDesc') as HTMLInputElement;
              const budgetInput = form.elements.namedItem('prjBudget') as HTMLInputElement;
              
              if (!nameInput.value.trim()) return;

              try {
                const res = await fetch('/api/projects/create', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    project: {
                      name: nameInput.value,
                      description: descInput.value,
                      budget: Number(budgetInput.value) || 15000,
                    },
                    agentId: 'michael'
                  }),
                });
                if (res.ok) {
                  soundFx.playNotification();
                  nameInput.value = '';
                  descInput.value = '';
                  budgetInput.value = '15000';
                }
              } catch (err) {
                console.error(err);
              }
            }} className="p-3.5 rounded bg-[#ebdbb2]/30 dark:bg-[#282828]/40 border border-[#d5c4a1]/80 dark:border-[#3c3836]/80 space-y-2">
              <div className="text-[11px] font-bold text-[#b57614] dark:text-[#fabd2f]">CREATE AUTONOMOUS SOFTWARE WORKSPACE</div>
              <div className="grid grid-cols-2 gap-2">
                <input name="prjName" placeholder="Project Name (e.g. Project Beta)" className="p-1 px-2 rounded border border-[#d5c4a1] dark:border-[#3c3836] bg-[#fbf1c7] dark:bg-[#1d2021] text-xs outline-none focus:border-[#fabd2f]" required />
                <input name="prjBudget" type="number" defaultValue="15000" placeholder="Budget ($ USD)" className="p-1 px-2 rounded border border-[#d5c4a1] dark:border-[#3c3836] bg-[#fbf1c7] dark:bg-[#1d2021] text-xs outline-none focus:border-[#fabd2f]" />
              </div>
              <input name="prjDesc" placeholder="Describe the workspace objective or software requirements..." className="w-full p-1 px-2 rounded border border-[#d5c4a1] dark:border-[#3c3836] bg-[#fbf1c7] dark:bg-[#1d2021] text-xs outline-none focus:border-[#fabd2f]" />
              <button type="submit" className="w-full py-1 rounded bg-[#076678] hover:bg-[#076678]/90 text-white font-bold transition-colors">
                + Provision Workspace & Assign Michael
              </button>
            </form>

            {/* Projects List */}
            <div className="space-y-3">
              {projects.map((proj) => {
                const percentSpent = proj.budget > 0 ? Math.min(100, Math.round((proj.spent / proj.budget) * 100)) : 0;
                return (
                  <div key={proj.id} className="p-3 rounded bg-[#ebdbb2]/60 dark:bg-[#282828]/60 border-2 border-[#d5c4a1] dark:border-[#3c3836] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#076678] dark:text-[#83a598]">
                        <span>💼</span>
                        <span>{proj.name}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border ${
                        proj.priority === 'critical' 
                          ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30' 
                          : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      }`}>
                        {proj.priority} priority
                      </span>
                    </div>

                    <p className="text-[11px] text-[#7c6f64] dark:text-[#a89984] leading-relaxed">
                      {proj.description}
                    </p>

                    {/* Spent vs Budget */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-[#7c6f64] dark:text-[#928374]">
                        <span>Budget allocation</span>
                        <span className="font-bold font-mono text-[#3c3836] dark:text-[#ebdbb2]">
                          ${proj.spent.toLocaleString()} / ${proj.budget.toLocaleString()} ({percentSpent}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#d5c4a1]/50 dark:bg-[#1d2021] rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#076678] dark:bg-[#83a598] h-full transition-all" style={{ width: `${percentSpent}%` }} />
                      </div>
                    </div>

                    {/* Milestones */}
                    {proj.milestones && proj.milestones.length > 0 && (
                      <div className="pt-1.5 border-t border-[#d5c4a1]/60 dark:border-[#3c3836]/60 space-y-1">
                        <div className="text-[10px] font-bold text-[#b57614] dark:text-[#fabd2f] uppercase tracking-wider">Milestones Checklist</div>
                        <div className="grid grid-cols-1 gap-1">
                          {proj.milestones.map((m: any) => (
                            <div key={m.id} className="flex items-center justify-between text-[11px] font-mono text-[#504945] dark:text-[#ebdbb2]">
                              <span className="flex items-center gap-1.5">
                                <span className={m.status === 'completed' ? 'text-emerald-500 font-bold' : 'text-amber-500'}>
                                  {m.status === 'completed' ? '✓' : '○'}
                                </span>
                                <span className={m.status === 'completed' ? 'line-through opacity-60' : ''}>{m.name}</span>
                              </span>
                              <span className="text-[9px] text-[#928374]">{m.dueDate}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Deployments */}
                    {proj.deployments && proj.deployments.length > 0 && (
                      <div className="pt-1.5 border-t border-[#d5c4a1]/60 dark:border-[#3c3836]/60 text-[10px] space-y-1">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Production Environments</div>
                        {proj.deployments.map((d: any) => (
                          <div key={d.id} className="flex justify-between items-center bg-[#1d2021]/10 dark:bg-[#1d2021]/50 p-1.5 rounded border border-emerald-500/20">
                            <span className="text-[#98971a] dark:text-emerald-400 font-bold uppercase">{d.env}</span>
                            <a href={d.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-sky-600 dark:text-sky-400 font-mono truncate max-w-[200px]">
                              {d.url}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Run Factory Pipeline Action */}
                    <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-[#d5c4a1]/60 dark:border-[#3c3836]/60 gap-2">
                      <span className="text-[10px] text-[#7c6f64] dark:text-[#a89984] font-bold">
                        Workspace: <code className="bg-[#1d2021]/10 dark:bg-[#1d2021]/60 px-1 py-0.2 rounded font-mono text-[9px]">./workspace/{proj.id}</code>
                      </span>
                      <button
                        id={`run-factory-${proj.id}`}
                        onClick={async () => {
                          soundFx.playClick();
                          const btn = document.getElementById(`run-factory-${proj.id}`) as HTMLButtonElement;
                          if (btn) btn.disabled = true;
                          try {
                            const res = await fetch(`/api/projects/run-pipeline`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ projectId: proj.id, userProfile }),
                            });
                            const result = await res.json();
                            if (result.success) {
                              soundFx.playNotification();
                              confetti();
                              alert(`🚀 SOFTWARE FACTORY PIPELINE COMPLETED SUCCESSFULLY!\n\nAll 6 phases executed:\n1. Architecture: Pete Miller drafted the technical specification.\n2. Code Gen: Ruflo-coder and specialized devs wrote files under './workspace/${proj.id}/src/'.\n3. Security Scan: Dwight Schrute conducted application scanning and audited credentials.\n4. Test Suite: Vitest verified build parsing, imports, and syntax.\n5. Production Build: Roy Anderson packaged and prepared the release.\n6. Finance Ledger: Kevin Malone computed token costs and processed organizational ledger updates.`);
                            } else {
                              alert(`❌ Pipeline failed: ${result.error}`);
                            }
                          } catch (err: any) {
                            alert(`❌ Operational Error: ${err.message}`);
                          } finally {
                            if (btn) btn.disabled = false;
                          }
                        }}
                        className="px-2.5 py-1 text-[10px] font-bold rounded bg-[#b57614] hover:bg-[#b57614]/95 text-white shadow-sm flex items-center gap-1 cursor-pointer w-full sm:w-auto justify-center"
                      >
                        <Zap size={10} className="animate-pulse text-[#fabd2f]" />
                        Run Software Factory Pipeline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Connected Integrations View */}
        {activeTab === 'integrations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#d5c4a1] dark:border-[#3c3836]">
              <span className="font-bold text-xs uppercase tracking-wider text-[#8f3f71] dark:text-[#d3869b]">Connected Integrations</span>
              <span className="text-[10px] text-[#7c6f64] dark:text-[#928374] font-bold">({accounts.filter(a => a.status === 'CONNECTED').length} Online)</span>
            </div>

            <div className="space-y-3">
              {accounts.map((acc) => {
                const isConnected = acc.status === 'CONNECTED';
                return (
                  <div key={acc.provider} className="p-3.5 rounded bg-[#ebdbb2]/60 dark:bg-[#282828]/60 border-2 border-[#d5c4a1] dark:border-[#3c3836] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🔌</span>
                        <div>
                          <div className="font-bold text-xs">{acc.provider}</div>
                          <div className="text-[10px] text-[#7c6f64] dark:text-[#a89984]">{acc.account}</div>
                        </div>
                      </div>
                      
                      <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border ${
                        isConnected 
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                          : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                      }`}>
                        ■ {acc.status}
                      </span>
                    </div>

                    {/* Scopes */}
                    {acc.scopes && acc.scopes.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] text-[#7c6f64] dark:text-[#928374] uppercase tracking-wider">Authorized Permission Scopes:</div>
                        <div className="flex flex-wrap gap-1">
                          {acc.scopes.map((s: string) => (
                            <span key={s} className="px-1.5 py-0.2 rounded bg-[#1d2021]/15 dark:bg-[#1d2021]/60 font-mono text-[9px] text-[#504945] dark:text-[#ebdbb2] border border-[#d5c4a1] dark:border-[#3c3836]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-[#d5c4a1]/60 dark:border-[#3c3836]/60">
                      <span className="text-[#928374]">Last synced: {acc.lastUsed ? new Date(acc.lastUsed).toLocaleTimeString() : 'Never'}</span>
                      
                      <button 
                        onClick={async () => {
                          const nextStatus = isConnected ? 'NOT_CONNECTED' : 'CONNECTED';
                          try {
                            const res = await fetch('/api/accounts/update-status', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ provider: acc.provider, status: nextStatus, agentId: 'michael' })
                            });
                            if (res.ok) {
                              soundFx.playClick();
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          isConnected 
                            ? 'bg-red-500/10 hover:bg-red-500/25 text-red-700 dark:text-red-400 border-red-500/30' 
                            : 'bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {isConnected ? 'Revoke Tokens' : 'Authorize OAuth'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. CFO Ledger View */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#d5c4a1] dark:border-[#3c3836]">
              <span className="font-bold text-xs uppercase tracking-wider text-[#b57614] dark:text-[#fabd2f]">Finance & Cost Ledger</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">Runway: {company?.runwayMonths || 18} Mos</span>
            </div>

            {/* High Level Metrics Cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded bg-[#ebdbb2]/50 dark:bg-[#282828]/50 border border-[#d5c4a1] dark:border-[#3c3836] text-center">
                <div className="text-[10px] text-[#7c6f64] dark:text-[#928374]">MONTHLY RECURRING REVENUE</div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  ${company?.mrr?.toLocaleString() || '45,000'}/mo
                </div>
              </div>
              <div className="p-3 rounded bg-[#ebdbb2]/50 dark:bg-[#282828]/50 border border-[#d5c4a1] dark:border-[#3c3836] text-center">
                <div className="text-[10px] text-[#7c6f64] dark:text-[#928374]">CAPITAL DEPOSIT</div>
                <div className="text-base font-bold text-sky-600 dark:text-sky-400 font-mono">
                  $500,000.00
                </div>
              </div>
            </div>

            {/* LLM Cost breakdown of active worker threads */}
            <div className="p-3 rounded bg-[#ebdbb2]/30 dark:bg-[#282828]/30 border border-[#d5c4a1] dark:border-[#3c3836] space-y-2">
              <div className="text-[11px] font-bold text-[#b57614] dark:text-[#fabd2f] uppercase tracking-wider">Departmental Worker Cost Gating</div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {agents.map((emp) => {
                  const processed = emp.tokensProcessed || 0;
                  // estimate cost directly
                  const estCost = (processed / 1000000) * 0.075;
                  return (
                    <div key={emp.id} className="flex justify-between items-center text-[11px] py-1 border-b border-[#d5c4a1]/50 dark:border-[#3c3836]/40">
                      <div className="flex items-center gap-1.5">
                        <span>{emp.avatar}</span>
                        <div>
                          <div className="font-bold text-[#3c3836] dark:text-[#ebdbb2]">{emp.name}</div>
                          <div className="text-[9px] text-[#928374]">{emp.title}</div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold text-red-600 dark:text-red-400">${estCost.toFixed(5)}</div>
                        <div className="text-[9px] text-[#928374]">{processed.toLocaleString()} Tokens</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3.5. Autonomous Business Workflows View */}
        {activeTab === 'workflows' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-[#d5c4a1] dark:border-[#3c3836]">
              <span className="font-bold text-xs uppercase tracking-wider text-[#b16286] flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-[#fabd2f]" />
                <span>Enterprise Workflow Orchestrator & 5-Step Pipeline</span>
              </span>
              <span className="text-[10px] text-[#7c6f64] dark:text-[#928374] font-bold">Standard 5-Step Engine Active</span>
            </div>

            {/* Live 5-Step Agent Standard Workflow Panel */}
            <div className="p-3.5 rounded bg-[#ebdbb2]/40 dark:bg-[#282828]/50 border-2 border-[#fabd2f]/60 dark:border-[#fabd2f]/40 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-[#fabd2f]/20 border border-[#fabd2f]/40 flex items-center justify-center text-[#fabd2f] font-bold">
                    5S
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#3c3836] dark:text-[#ebdbb2] flex items-center gap-2">
                      <span>Standard 5-Step Agent Engineering Pipeline</span>
                      <span className="bg-[#b8bb26]/20 text-[#98971a] dark:text-[#b8bb26] text-[9px] px-1.5 py-0.2 rounded font-bold border border-[#b8bb26]/30 uppercase">
                        Active Agent Engine
                      </span>
                    </h4>
                    <p className="text-[10px] text-[#7c6f64] dark:text-[#a89984]">
                      Intent Analysis → Context Inspection → Surgical Execution → Auto Verification → Scannable Summary
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRunControlPanelStandardWorkflow}
                  disabled={isCPWorkflowRunning}
                  className="px-3 py-1.5 bg-[#fabd2f] hover:bg-[#fabd2f]/90 text-[#1d2021] rounded font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isCPWorkflowRunning ? 'Executing 5-Step Engine...' : 'Run 5-Step Workflow'}</span>
                </button>
              </div>

              {/* Directive input & Target Agent */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] text-[#7c6f64] dark:text-[#928374] uppercase font-bold">Task Directive</label>
                  <input
                    type="text"
                    value={cpWorkflowDirective}
                    onChange={(e) => setCpWorkflowDirective(e.target.value)}
                    className="w-full p-1.5 bg-[#fbf1c7] dark:bg-[#181615] border border-[#d5c4a1] dark:border-[#3c3836] rounded text-[11px] outline-none text-[#3c3836] dark:text-[#ebdbb2] focus:border-[#fabd2f]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[#7c6f64] dark:text-[#928374] uppercase font-bold">Target Agent</label>
                  <select
                    value={workflowTriggerAgentId}
                    onChange={(e) => setWorkflowTriggerAgentId(e.target.value)}
                    className="w-full p-1.5 bg-[#fbf1c7] dark:bg-[#181615] border border-[#d5c4a1] dark:border-[#3c3836] rounded text-[11px] font-mono focus:outline-none text-[#3c3836] dark:text-[#ebdbb2]"
                  >
                    {agents.map((ag) => (
                      <option className="text-slate-900 bg-white" key={ag.id} value={ag.id}>
                        {ag.name} ({ag.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stepper Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {STANDARD_WORKFLOW_STAGES.map((st) => {
                  const currentStepNum = controlPanelWorkflowState?.currentStep || 0;
                  const isCurrent = currentStepNum === st.stepNumber && isCPWorkflowRunning;
                  const isDone = controlPanelWorkflowState
                    ? controlPanelWorkflowState.currentStep > st.stepNumber || (!isCPWorkflowRunning && controlPanelWorkflowState.currentStep === 5)
                    : false;

                  return (
                    <div
                      key={st.id}
                      className={`p-2 rounded border transition-all ${
                        isCurrent
                          ? 'bg-[#fabd2f]/15 border-[#fabd2f] ring-1 ring-[#fabd2f]'
                          : isDone
                          ? 'bg-[#b8bb26]/15 border-[#b8bb26]/60'
                          : 'bg-[#fbf1c7]/50 dark:bg-[#1d2021]/50 border-[#d5c4a1] dark:border-[#3c3836]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                          isDone ? 'bg-[#b8bb26] text-[#1d2021]' : isCurrent ? 'bg-[#fabd2f] text-[#1d2021] animate-pulse' : 'bg-[#d5c4a1] dark:bg-[#3c3836] text-[#7c6f64] dark:text-[#a89984]'
                        }`}>
                          {st.stepNumber}
                        </span>
                        <span className="text-[9px] font-bold uppercase text-[#7c6f64] dark:text-[#a89984]">
                          {isDone ? '✓ DONE' : isCurrent ? 'RUNNING' : 'QUEUED'}
                        </span>
                      </div>
                      <div className="font-bold text-[10px] text-[#3c3836] dark:text-[#ebdbb2] truncate">{st.name}</div>
                    </div>
                  );
                })}
              </div>

              {/* Logs Stream */}
              {controlPanelWorkflowState && (
                <div className="p-2.5 rounded bg-[#181615] border border-[#3c3836] text-[10px] space-y-1 max-h-36 overflow-y-auto font-mono text-[#d5c4a1]">
                  {controlPanelWorkflowState.logs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                  {controlPanelWorkflowState.outputSummary && (
                    <div className="pt-2 text-emerald-400 font-bold border-t border-[#3c3836]">
                      {controlPanelWorkflowState.outputSummary}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Trigger Workflow Subsection */}
            <div className="p-3 rounded bg-[#ebdbb2]/30 dark:bg-[#282828]/30 border border-[#d5c4a1] dark:border-[#3c3836] space-y-2">
              <div className="font-bold text-[11px] text-[#3c3836] dark:text-[#ebdbb2] uppercase tracking-wider">Trigger New Autonomous Business Workflow</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#7c6f64] dark:text-[#928374] uppercase font-bold">Workflow Template</label>
                  <select
                    value={selectedWorkflowTemplate}
                    onChange={(e) => setSelectedWorkflowTemplate(e.target.value)}
                    className="w-full p-1.5 bg-[#fbf1c7] dark:bg-[#181615] border border-[#d5c4a1] dark:border-[#3c3836] rounded text-[11px] font-mono focus:outline-none text-[#3c3836] dark:text-[#ebdbb2]"
                  >
                    <option className="text-slate-900 bg-white" value="finance-audit">Quarterly Financial Ledger Consolidation</option>
                    <option className="text-slate-900 bg-white" value="crm-enrichment">Lead Qualification & Custom CRM Ingestion</option>
                    <option className="text-slate-900 bg-white" value="devops-deploy">DevOps Automated Patch Deployment Pipeline</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[#7c6f64] dark:text-[#928374] uppercase font-bold">Triggering Department Head</label>
                  <select
                    value={workflowTriggerAgentId}
                    onChange={(e) => setWorkflowTriggerAgentId(e.target.value)}
                    className="w-full p-1.5 bg-[#fbf1c7] dark:bg-[#181615] border border-[#d5c4a1] dark:border-[#3c3836] rounded text-[11px] font-mono focus:outline-none text-[#3c3836] dark:text-[#ebdbb2]"
                  >
                    <option className="text-slate-900 bg-white" value="michael">Michael Scott (CEO & Staff)</option>
                    <option className="text-slate-900 bg-white" value="kevin">Kevin Malone (Finance)</option>
                    <option className="text-slate-900 bg-white" value="dwight">Dwight Schrute (Security)</option>
                    <option className="text-slate-900 bg-white" value="ruflo">Ruflo (Engineering CTO)</option>
                    <option className="text-slate-900 bg-white" value="ryan">Ryan Howard (Growth)</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleTriggerWorkflow}
                className="w-full mt-2 py-1.5 bg-[#b16286] hover:bg-[#8f3f71] text-white rounded font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Instantiate & Launch Autonomous Process</span>
              </button>
            </div>

            {/* Active Workflows Section */}
            <div className="space-y-2">
              <div className="font-bold text-[11px] text-[#3c3836] dark:text-[#ebdbb2] uppercase tracking-wider">Active Executions</div>
              {activeWorkflowsList.length === 0 ? (
                <div className="p-4 text-center text-[#7c6f64] dark:text-[#928374] text-[11px] bg-[#ebdbb2]/10 dark:bg-[#282828]/10 rounded border border-[#d5c4a1]/40 dark:border-[#3c3836]/30">
                  No active business workflows triggered. Select a template above to initiate.
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {activeWorkflowsList.map((wf) => {
                    const statusColors: Record<string, string> = {
                      PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                      RUNNING: 'bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse',
                      BLOCKED: 'bg-red-500/15 text-red-600 border-red-500/30 font-bold',
                      COMPLETED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                      FAILED: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
                    };
                    return (
                      <div key={wf.id} className="p-3 rounded bg-[#ebdbb2]/40 dark:bg-[#282828]/40 border border-[#d5c4a1] dark:border-[#3c3836] space-y-2">
                        <div className="flex items-center justify-between font-mono">
                          <div className="font-bold text-[#b57614] dark:text-[#fabd2f] truncate max-w-[180px]">
                            {wf.name}
                          </div>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${statusColors[wf.status] || 'bg-gray-500/20 text-gray-500'}`}>
                            {wf.status}
                          </span>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center justify-between text-[10px] text-[#7c6f64] dark:text-[#928374] font-mono">
                          <span>ID: {wf.id}</span>
                          <span>Triggered By: {wf.triggeredBy.toUpperCase()}</span>
                        </div>

                        {/* Steps Process Map */}
                        <div className="space-y-1.5 pt-1 border-t border-[#d5c4a1]/50 dark:border-[#3c3836]/40">
                          {wf.steps.map((step: any, idx: number) => {
                            const stepStatusColors: Record<string, string> = {
                              PENDING: 'text-[#928374]',
                              RUNNING: 'text-blue-500 font-bold animate-pulse',
                              COMPLETED: 'text-emerald-600 dark:text-emerald-400 font-bold',
                              BLOCKED: 'text-red-500 font-bold',
                              FAILED: 'text-rose-500 font-bold',
                            };
                            return (
                              <div key={step.id} className="text-[11px] leading-relaxed">
                                <div className="flex items-center justify-between">
                                  <span className={`${stepStatusColors[step.status]} flex items-center gap-1`}>
                                    {step.status === 'COMPLETED' ? '✓' : step.status === 'BLOCKED' ? '⚠' : idx + 1 + '.'} {step.name}
                                  </span>
                                  <span className="text-[9px] uppercase bg-[#1d2021]/10 dark:bg-[#1d2021]/50 px-1 rounded text-[#7c6f64] dark:text-[#a89984]">
                                    {step.tool}.{step.action}
                                  </span>
                                </div>
                                {step.output && (
                                  <pre className="mt-1 ml-3 p-1.5 bg-[#1d2021] text-emerald-400 rounded text-[10px] overflow-x-auto whitespace-pre-wrap max-h-24">
                                    {JSON.stringify(step.output, null, 2)}
                                  </pre>
                                )}
                                {step.error && (
                                  <div className="mt-1 ml-3 p-1.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded text-[10px]">
                                    ERROR: {step.error}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Resume Button if Blocked */}
                        {wf.status === 'BLOCKED' && (
                          <div className="flex items-center justify-between bg-red-500/5 p-2 rounded border border-red-500/15 text-[10px]">
                            <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                              <span>⚠ Halted at Zero-Trust Security Gateway!</span>
                            </span>
                            <button
                              onClick={async () => {
                                soundFx.playClick();
                                try {
                                  const res = await fetch(`/api/workflows/${wf.id}/resume`, {
                                    method: 'POST',
                                  });
                                  if (res.ok) {
                                    soundFx.playNotification();
                                    fetchWorkflowsAndApprovals();
                                  }
                                } catch (e) {
                                  console.error("Failed to resume workflow:", e);
                                }
                              }}
                              className="px-2 py-0.5 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition-colors"
                            >
                              Resume Flow
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. Zero-Trust Compliance Log View */}
        {activeTab === 'compliance' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#d5c4a1] dark:border-[#3c3836]">
              <span className="font-bold text-xs uppercase tracking-wider text-[#98971a]">Zero-Trust Compliance Log</span>
              <span className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase animate-pulse">■ SECURED Perimeter</span>
            </div>

            {/* SSRF Header Banner */}
            <div className="p-3 rounded bg-red-500/10 dark:bg-red-500/5 border border-red-500/20 text-[#7c6f64] dark:text-[#a89984] text-[11px] leading-relaxed">
              <strong>SSRF PROTECTION ACTIVE</strong>: Private loopback addresses, metadata server IP ranges, and system command shell invocations are completely gated by Dwight's zero-trust supervisor rules.
            </div>

            {/* Human Approvals Gate */}
            <div className="space-y-2 border-b border-[#d5c4a1] dark:border-[#3c3836] pb-3">
              <div className="font-bold text-xs uppercase tracking-wider text-[#d65d0e] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#d65d0e]" />
                <span>Pending Human-in-the-Loop Approvals</span>
              </div>
              {approvals.filter(a => a.status === 'PENDING').length === 0 ? (
                <div className="p-3 text-center text-[#7c6f64] dark:text-[#928374] text-[11px] bg-emerald-500/5 rounded border border-emerald-500/20">
                  ✓ Perimeter secure. No pending authorization requests.
                </div>
              ) : (
                <div className="space-y-2">
                  {approvals.filter(a => a.status === 'PENDING').map((app) => (
                    <div key={app.id} className="p-2.5 rounded bg-[#fbf1c7] dark:bg-[#1d2021]/85 border border-[#d5c4a1] dark:border-[#3c3836] text-[11px] space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-[#076678] dark:text-sky-400 uppercase">⚡ {app.action}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-500/20 text-red-600 dark:text-red-400 font-bold border border-red-500/25">
                          {app.riskLevel} Risk
                        </span>
                      </div>
                      <div className="text-[10px] text-[#7c6f64] dark:text-[#928374]">
                        Requester: <strong>{app.requestedBy.toUpperCase()}</strong> | Reason: {app.reason}
                      </div>
                      <div className="space-y-1 bg-[#1d2021] text-emerald-400 p-2 rounded text-[10px] font-mono max-h-32 overflow-y-auto">
                        <div className="text-[9px] text-[#a89984] border-b border-[#3c3836] pb-0.5 mb-1 uppercase font-bold">Execution Parameters:</div>
                        <pre className="whitespace-pre-wrap font-bold">{JSON.stringify(app.parameters, null, 2)}</pre>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          onClick={() => handleApprovalDecision(app.id, 'REJECTED')}
                          className="px-2.5 py-1 text-[10px] bg-red-500/10 hover:bg-red-500/25 text-red-700 dark:text-red-400 rounded border border-red-500/20 font-bold transition-colors"
                        >
                          Reject Action
                        </button>
                        <button
                          onClick={() => handleApprovalDecision(app.id, 'APPROVED')}
                          className="px-2.5 py-1 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-sm transition-colors"
                        >
                          Approve & Execute
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comprehensive Zero-Trust Test Suite Controls */}
            <div className="space-y-2 border-b border-[#d5c4a1] dark:border-[#3c3836] pb-3">
              <div className="font-bold text-xs uppercase tracking-wider text-[#98971a] flex items-center justify-between">
                <span>Enterprise Security Validation Test Suite</span>
                <button
                  disabled={isRunningSecurityTest}
                  onClick={handleRunSecurityTests}
                  className="px-2 py-1 bg-[#98971a] hover:bg-[#79740e] disabled:opacity-50 text-[#fbf1c7] rounded text-[10px] font-bold flex items-center gap-1 shadow-sm transition-colors"
                >
                  {isRunningSecurityTest ? 'Testing...' : 'Trigger Tests'}
                </button>
              </div>

              {securityTestResult ? (
                <div className="p-3 rounded bg-[#1d2021] text-emerald-400 border border-[#3c3836] text-[11px] font-mono space-y-2">
                  <div className="flex items-center justify-between border-b border-[#3c3836] pb-1.5">
                    <span className="font-bold text-[#fabd2f]">SYSTEM COMPLIANCE SCORE</span>
                    <span className="font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-500/25">
                      {securityTestResult.score}% PASSED
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {securityTestResult.tests.map((test: any, idx: number) => (
                      <div key={idx} className="flex items-start justify-between leading-normal border-b border-[#3c3836]/40 pb-1">
                        <div>
                          <div className="font-bold text-slate-200">{test.name}</div>
                          <div className="text-[10px] text-[#a89984]">{test.description}</div>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold px-1 rounded text-[9px] ${test.status === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {test.status}
                          </span>
                          <div className="text-[9px] text-[#928374]">{test.durationMs}ms</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center text-[#7c6f64] dark:text-[#928374] text-[11px] bg-[#ebdbb2]/10 dark:bg-[#282828]/10 rounded border border-[#d5c4a1]/40 dark:border-[#3c3836]/30">
                  Test suite ready. Click "Trigger Tests" to run multi-tenant & sandbox compliance assertions.
                </div>
              )}
            </div>

            {/* Audits stream */}
            <div className="space-y-2">
              <div className="font-bold text-[11px] uppercase tracking-wider text-[#7c6f64] dark:text-[#928374]">Secure Audit Ledger Streams</div>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {audits.map((aud) => {
                  const isCrit = aud.riskLevel === 'critical' || aud.riskLevel === 'high';
                  return (
                    <div key={aud.id} className="p-2.5 rounded bg-[#ebdbb2]/40 dark:bg-[#282828]/40 border border-[#d5c4a1] dark:border-[#3c3836] text-[11px] space-y-1 text-[#3c3836] dark:text-[#ebdbb2]">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-[#b57614] dark:text-[#fabd2f]">
                          ⚙ {aud.agentId.toUpperCase()}
                        </span>
                        <span className={`px-1 py-0.2 rounded text-[9px] font-bold uppercase ${
                          isCrit 
                            ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/25' 
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {aud.riskLevel} risk
                        </span>
                      </div>

                      <div className="text-[#3c3836] dark:text-[#ebdbb2] leading-normal font-mono">
                        <span className="text-[#7c6f64] dark:text-[#a89984]">Tool call:</span> <code className="bg-[#1d2021]/15 dark:bg-[#1d2021]/60 px-1 py-0.2 rounded font-bold text-[#076678] dark:text-sky-400">{aud.tool}</code>
                      </div>

                      <div className="text-[#7c6f64] dark:text-[#a89984] text-[11px] truncate">
                        {aud.action}
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-[#928374] pt-1 border-t border-[#d5c4a1]/40 dark:border-[#3c3836]/30">
                        <span>Result: {aud.result}</span>
                        <span>{new Date(aud.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 1. Terminal View */}
        {activeTab === 'terminal' && (
          <div className="flex flex-col h-full font-mono space-y-2">
            {/* Active Voice Trigger Mission Inception Banner */}
            {activeVoiceMission && (
              <div className="p-3 rounded-lg bg-gradient-to-r from-[#b57614]/15 via-[#fabd2f]/10 to-emerald-500/15 border border-[#fabd2f]/40 text-xs space-y-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#fabd2f] text-[#1d2021] flex items-center justify-center font-bold">
                      <Rocket className="w-3.5 h-3.5 animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-sm text-[#b57614] dark:text-[#fabd2f]">
                        <span>MISSION INITIALIZED:</span>
                        <span className="text-[#3c3836] dark:text-[#ebdbb2] underline underline-offset-2">{activeVoiceMission.title}</span>
                      </div>
                      <div className="text-[10px] text-[#7c6f64] dark:text-[#928374]">
                        Triggered via Voice Command • Fleet execution active across 4 agents
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      activeVoiceMission.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-[#fabd2f]/20 text-[#b57614] dark:text-[#fabd2f] border border-[#fabd2f]/40 animate-pulse'
                    }`}>
                      {activeVoiceMission.status === 'completed' ? 'COMPLETED' : 'IN PROGRESS'}
                    </span>
                    <button
                      onClick={() => setActiveVoiceMission(null)}
                      className="p-1 hover:text-red-500 text-[#7c6f64]"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-[#7c6f64] dark:text-[#928374]">
                    <span>Fleet Execution Progress</span>
                    <span className="font-bold text-[#b57614] dark:text-[#fabd2f]">{activeVoiceMission.progress}%</span>
                  </div>
                  <div className="w-full bg-[#d5c4a1] dark:bg-[#3c3836] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#fabd2f] h-full transition-all duration-700 ease-out"
                      style={{ width: `${activeVoiceMission.progress}%` }}
                    />
                  </div>
                </div>

                {/* Subtask Badges */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 text-[10px]">
                  <div className="px-2 py-1 rounded bg-[#ebdbb2] dark:bg-[#1d2021] border border-[#d5c4a1] dark:border-[#3c3836] flex items-center justify-between">
                    <span className="truncate">📐 Architecture</span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  </div>
                  <div className="px-2 py-1 rounded bg-[#ebdbb2] dark:bg-[#1d2021] border border-[#d5c4a1] dark:border-[#3c3836] flex items-center justify-between">
                    <span className="truncate">🛡️ Security</span>
                    <span className="text-[#b57614] dark:text-[#fabd2f] font-bold text-[9px]">ACTIVE</span>
                  </div>
                  <div className="px-2 py-1 rounded bg-[#ebdbb2] dark:bg-[#1d2021] border border-[#d5c4a1] dark:border-[#3c3836] flex items-center justify-between">
                    <span className="truncate">⚡ Engineering</span>
                    <span className="text-[#076678] dark:text-[#83a598] font-bold text-[9px]">QUEUED</span>
                  </div>
                  <div className="px-2 py-1 rounded bg-[#ebdbb2] dark:bg-[#1d2021] border border-[#d5c4a1] dark:border-[#3c3836] flex items-center justify-between">
                    <span className="truncate">📊 QA & Audit</span>
                    <span className="text-[#7c6f64] dark:text-[#928374] font-bold text-[9px]">QUEUED</span>
                  </div>
                </div>
              </div>
            )}

            {/* Terminal Sub-header */}
            <div className="flex items-center justify-between text-[11px] pb-1 border-b border-[#d5c4a1] dark:border-[#282828] text-[#7c6f64] dark:text-[#928374]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>live - pty pty-god</span>
                {isListening && (
                  <span className="flex items-center gap-1 text-[10px] text-red-500 font-bold px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 animate-pulse">
                    <Radio className="w-3 h-3 animate-spin" />
                    <span>MIC ACTIVE • SAY "Rufflo, initialize [Mission]"</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center border border-[#d5c4a1] dark:border-[#3c3836] rounded px-1">
                  <button
                    onClick={() => setFontSize((s) => Math.max(10, s - 1))}
                    className="px-1 hover:text-amber-500"
                  >
                    -
                  </button>
                  <span className="px-1 text-[10px]">{fontSize}px</span>
                  <button
                    onClick={() => setFontSize((s) => Math.min(16, s + 1))}
                    className="px-1 hover:text-amber-500"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Terminal Output Logs */}
            <div
              className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-mono select-text"
              style={{ fontSize: `${fontSize}px` }}
            >
              {logs.map((log) => {
                const isSelectedAgentLog = log.agentId === selectedAgent.id;
                return (
                  <div
                    key={log.id}
                    className={`p-2 rounded border transition-all ${
                      isSelectedAgentLog
                        ? 'bg-[#ebdbb2]/30 dark:bg-[#282828]/60 border-[#d5c4a1] dark:border-[#3c3836]'
                        : 'bg-transparent border-transparent opacity-85'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[10px] text-[#7c6f64] dark:text-[#928374] mb-1">
                      <span className="font-bold text-[#b57614] dark:text-[#fabd2f]">
                        ● {log.agentId.toUpperCase()}
                      </span>
                      <span>[{log.timestamp}]</span>
                      <span
                        className={`uppercase font-bold px-1 rounded text-[9px] ${
                          log.level === 'error'
                            ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                            : log.level === 'warn'
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                            : log.level === 'success'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {log.level}
                      </span>
                    </div>

                    <div className="text-[#3c3836] dark:text-[#d5c4a1] whitespace-pre-wrap leading-relaxed">
                      {log.message}
                    </div>

                    {/* Syntax Code Snippet if present */}
                    {log.codeSnippet && (
                      <div className="mt-2 bg-[#1d2021] text-[#ebdbb2] p-2.5 rounded border border-[#3c3836] overflow-x-auto text-[11px]">
                        <div className="flex items-center justify-between text-[10px] text-[#a89984] pb-1 border-b border-[#3c3836] mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-emerald-400 flex items-center gap-1">
                              <Zap className="w-3 h-3 fill-current" /> AUTO-APPLIED TO BACKEND SYSTEM
                            </span>
                            {log.systemModuleName && (
                              <span className="text-[#fabd2f]">({log.systemModuleName})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(log.codeSnippet!);
                                soundFx.playNotification();
                              }}
                              className="hover:text-amber-400 font-bold"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        <pre className="font-mono text-emerald-400 leading-normal">{log.codeSnippet}</pre>
                      </div>
                    )}
                  </div>
                );
              })}

              {isProcessing && (
                <div className="flex items-center gap-2 p-2 text-amber-600 dark:text-amber-400 animate-pulse text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>{selectedAgent.name} is ruminating & executing...</span>
                </div>
              )}

              <div ref={terminalEndRef} />
            </div>

            {/* Context & Token Status */}
            <div className="pt-2 border-t border-[#d5c4a1] dark:border-[#282828] text-[10px] flex items-center justify-between text-[#7c6f64] dark:text-[#928374]">
              <div className="flex items-center gap-2">
                <span>ctx 144k/1000k (14%)</span>
                <span>•</span>
                <span
                  onClick={() => setBypassPermissions(!bypassPermissions)}
                  className="cursor-pointer hover:underline text-[#b57614] dark:text-[#fabd2f]"
                >
                  » bypass permissions {bypassPermissions ? 'ON' : 'OFF'} (shift+tab to cycle)
                </span>
              </div>
              <button
                onClick={() => setActiveTab('analytics')}
                className="text-[#fabd2f] hover:underline flex items-center gap-1 font-bold"
              >
                <BarChart3 className="w-3 h-3" />
                <span>/rc D3 Telemetry & Stream Active</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Task Completion Rates Bar Chart View */}
        {activeTab === 'task-rates' && (
          <div className="space-y-4">
            <FleetTaskCompletionBarChart
              agents={agents}
              tasks={tasks}
              onSelectAgent={onSelectAgent}
            />
          </div>
        )}

        {/* 3. Token Processing Trends Line Chart View (Recharts) */}
        {activeTab === 'token-trends' && (
          <div className="space-y-4">
            <FleetTokenTrendsLineChart
              agents={agents}
              logs={logs}
              selectedAgentId={selectedAgent.id}
              onSelectAgent={onSelectAgent}
            />
          </div>
        )}

        {/* 4. D3 Analytics & Comprehensive Performance Suite */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            {/* Top Quick Visualizers */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <FleetTaskCompletionBarChart
                agents={agents}
                tasks={tasks}
                onSelectAgent={onSelectAgent}
              />
              <FleetTokenTrendsLineChart
                agents={agents}
                logs={logs}
                selectedAgentId={selectedAgent.id}
                onSelectAgent={onSelectAgent}
              />
            </div>

            {/* D3 Deep Flow Engine */}
            <div className="h-full min-h-[460px] border border-[#d5c4a1] dark:border-[#3c3836] rounded-lg overflow-hidden">
              <FleetD3PerformanceChart
                agents={agents}
                tasks={tasks}
                telemetry={telemetry || {
                  uptime: 120,
                  cyclesRun: 15,
                  healthScore: 99.8,
                  patchesApplied: 14,
                  activeWorkers: agents.length,
                  heapUsedMB: 28.4,
                  heapTotalMB: 48.0,
                  rssMB: 62.1,
                  logs: [],
                }}
                logs={logs}
                selectedAgentId={selectedAgent.id}
                onSelectAgent={onSelectAgent}
              />
            </div>
          </div>
        )}

        {/* 5. Monitor & Telemetry View */}
        {activeTab === 'monitor' && (
          <div className="space-y-4">
            {/* Real-time Fleet Health Monitor with subtle visual pulses */}
            <FleetHealthMonitor
              agents={agents}
              tasks={tasks}
              logs={logs}
              selectedAgentId={selectedAgent.id}
              onSelectAgent={onSelectAgent}
            />

            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">FLEET TELEMETRY & SYSTEM HEALTH</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setActiveTab('task-rates');
                  }}
                  className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-sm"
                >
                  <CheckSquare className="w-3 h-3" />
                  <span>Task Rates</span>
                </button>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setActiveTab('token-trends');
                  }}
                  className="px-2 py-1 bg-[#fabd2f] text-[#1d2021] rounded text-[11px] font-bold flex items-center gap-1 shadow-sm"
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>Token Trends</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="p-2.5 rounded bg-[#ebdbb2] dark:bg-[#282828] border border-[#d5c4a1] dark:border-[#3c3836]">
                <div className="text-[10px] text-[#7c6f64] dark:text-[#928374]">SYSTEM HEALTH</div>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {typeof telemetry?.healthScore === 'number' && !isNaN(telemetry.healthScore) ? telemetry.healthScore : 99.8}%
                </div>
                <div className="text-[9px] text-[#7c6f64] dark:text-[#928374]">0 Fatal Crashes</div>
              </div>

              <div className="p-2.5 rounded bg-[#ebdbb2] dark:bg-[#282828] border border-[#d5c4a1] dark:border-[#3c3836]">
                <div className="text-[10px] text-[#7c6f64] dark:text-[#928374]">HEAP MEMORY</div>
                <div className="text-lg font-bold text-[#076678] dark:text-[#83a598]">
                  {typeof telemetry?.heapUsedMB === 'number' && !isNaN(telemetry.heapUsedMB) ? telemetry.heapUsedMB : 28.4} MB
                </div>
                <div className="text-[9px] text-[#7c6f64] dark:text-[#928374]">Total: {typeof telemetry?.heapTotalMB === 'number' && !isNaN(telemetry.heapTotalMB) ? telemetry.heapTotalMB : 48.0} MB</div>
              </div>

              <div className="p-2.5 rounded bg-[#ebdbb2] dark:bg-[#282828] border border-[#d5c4a1] dark:border-[#3c3836]">
                <div className="text-[10px] text-[#7c6f64] dark:text-[#928374]">DEBUG CYCLES</div>
                <div className="text-lg font-bold text-[#b57614] dark:text-[#fabd2f]">
                  #{telemetry?.cyclesRun ?? 15}
                </div>
                <div className="text-[9px] text-[#7c6f64] dark:text-[#928374]">24*7 Continuous Loop</div>
              </div>

              <div className="p-2.5 rounded bg-[#ebdbb2] dark:bg-[#282828] border border-[#d5c4a1] dark:border-[#3c3836]">
                <div className="text-[10px] text-[#7c6f64] dark:text-[#928374]">AUTO PATCHES</div>
                <div className="text-lg font-bold text-[#8f3f71] dark:text-[#d3869b]">
                  {telemetry?.patchesApplied ?? 14}
                </div>
                <div className="text-[9px] text-[#7c6f64] dark:text-[#928374]">Self-Healed In Memory</div>
              </div>
            </div>

            {/* Token Trends & Task Completion Widgets in Monitor */}
            <div className="grid grid-cols-1 gap-4">
              <FleetTokenTrendsLineChart
                agents={agents}
                logs={logs}
                selectedAgentId={selectedAgent.id}
                onSelectAgent={onSelectAgent}
              />
              <FleetTaskCompletionBarChart
                agents={agents}
                tasks={tasks}
                onSelectAgent={onSelectAgent}
              />
            </div>

            {/* 24/7 Diagnostics Feed */}
            <div className="p-3 rounded bg-[#ebdbb2]/40 dark:bg-[#282828]/50 border border-[#d5c4a1] dark:border-[#3c3836]">
              <div className="flex items-center justify-between pb-2 border-b border-[#d5c4a1] dark:border-[#3c3836] mb-2 font-bold text-[11px]">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  <span>24*7 Continuous Auto-Debugger Stream (Toby Daemon)</span>
                </div>
                <span className="text-[10px] text-emerald-500 font-bold">ONLINE & SCANNING</span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto font-mono text-[11px]">
                {(telemetry?.logs || []).map((dbgLog) => (
                  <div key={dbgLog.id} className="flex items-start gap-2 text-[#504945] dark:text-[#ebdbb2]">
                    <span className="text-[#928374] text-[10px]">[{dbgLog.timestamp}]</span>
                    <span className="text-emerald-600 dark:text-emerald-400">»</span>
                    <span>{dbgLog.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. Tasks & Queue View */}
        {activeTab === 'tasks' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">FLEET TASK QUEUE ({tasks.length})</span>
              <button
                onClick={() => {
                  const title = prompt('Enter task objective:');
                  if (title) {
                    onAddTask({
                      title,
                      description: `Autonomous task dispatched by ${userProfile.displayName}`,
                      assignedTo: selectedAgent.id,
                      priority: 'high',
                      status: 'running',
                      progress: 10,
                    });
                    soundFx.playNotification();
                  }
                }}
                className="px-2 py-1 bg-[#fabd2f] text-[#1d2021] rounded text-[11px] font-bold"
              >
                + Dispatch Task
              </button>
            </div>

            <div className="space-y-2">
              {tasks.map((task) => {
                const assignedAgent = agents.find((a) => a.id === task.assignedTo);
                return (
                  <div
                    key={task.id}
                    className="p-2.5 rounded bg-[#ebdbb2] dark:bg-[#282828] border border-[#d5c4a1] dark:border-[#3c3836] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <span>{assignedAgent?.avatar}</span>
                        <span>{task.title}</span>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                          task.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#7c6f64] dark:text-[#a89984]">{task.description}</p>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#d5c4a1] dark:bg-[#181615] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#fabd2f] h-full transition-all duration-500"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Ask Me / Quick Presets View */}
        {activeTab === 'ask me' && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#b57614] dark:text-[#fabd2f]">
              QUICK ACTION DIRECTIVES FOR {selectedAgent.name.toUpperCase()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                {
                  title: 'Defensive Security Audit',
                  desc: 'Audit runtime vulnerabilities, zero-trust tokens, and perimeter access logs.',
                  agentId: 'dwight',
                  prompt: 'Execute a comprehensive defensive cybersecurity audit on the system and generate a vulnerability remediation report.',
                },
                {
                  title: 'Viral Social Campaign',
                  desc: 'Generate high-engagement Twitter/X threads and LinkedIn growth hooks.',
                  agentId: 'ryan',
                  prompt: 'Create a 5-tweet viral thread and marketing growth strategy on autonomous multi-agent workforces.',
                },
                {
                  title: 'P&L Runway Calculation',
                  desc: 'Audit monthly expenses, calculate burn rate, and generate financial projections.',
                  agentId: 'kevin',
                  prompt: 'Audit company numbers: Starting with $500,000 capital and $25,000 monthly burn, calculate runway and give 3 cost optimization strategies.',
                },
                {
                  title: 'Open Source Repo Indexing',
                  desc: 'Search GitHub architecture patterns and package dependencies.',
                  agentId: 'stanley',
                  prompt: 'Analyze top open-source multi-agent frameworks, architecture tradeoffs, and licensing recommendations.',
                },
                {
                  title: 'Cline Autonomous Web Dev',
                  desc: 'Build full-stack React components, refactor UI, and apply live system patches.',
                  agentId: 'cline',
                  prompt: 'Build a high-performance web development dashboard widget with interactive controls, responsive design, and auto-applied system code.',
                },
                {
                  title: 'Dynamic Feature Injection',
                  desc: 'Write and mount a new live interactive widget into the dashboard.',
                  agentId: 'ruflo-coder',
                  prompt: 'Write and inject a new dynamic feature tool widget for real-time team latency and sentiment tracking.',
                },
                {
                  title: 'Hourly Fleet Standup',
                  desc: 'Gather all 9 agents in the conference room for task synchronization.',
                  agentId: 'michael',
                  prompt: 'Call an all-hands hourly standup with the entire fleet. Summarize what each agent is working on and ensure maximum alignment.',
                },
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectAgent(preset.agentId);
                    setInputPrompt(preset.prompt);
                    setActiveTab('terminal');
                    soundFx.playClick();
                  }}
                  className="p-2.5 rounded text-left bg-[#ebdbb2] dark:bg-[#282828] hover:bg-[#d5c4a1] dark:hover:bg-[#3c3836] border border-[#d5c4a1] dark:border-[#3c3836] transition-colors group"
                >
                  <div className="font-bold text-xs text-[#b57614] dark:text-[#fabd2f] group-hover:underline">
                    ⚡ {preset.title}
                  </div>
                  <div className="text-[11px] text-[#7c6f64] dark:text-[#a89984] mt-0.5">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. Memory & Context View */}
        {activeTab === 'memory' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#d5c4a1] dark:border-[#3c3836]">
              <span className="font-bold text-xs">{selectedAgent.name.toUpperCase()} LONG-TERM MEMORY</span>
              <span className="text-[10px] text-[#7c6f64] dark:text-[#928374]">
                {selectedAgent.memory.length} indexed facts
              </span>
            </div>

            <div className="space-y-1.5">
              {selectedAgent.memory.map((mem, i) => (
                <div
                  key={i}
                  className="p-2 rounded bg-[#ebdbb2] dark:bg-[#282828] border border-[#d5c4a1] dark:border-[#3c3836] text-[11px] flex items-start gap-2"
                >
                  <Brain className="w-3.5 h-3.5 text-[#b57614] dark:text-[#fabd2f] shrink-0 mt-0.5" />
                  <span>{mem}</span>
                </div>
              ))}
            </div>

            {/* Personalized User Context */}
            <div className="mt-4 p-2.5 rounded bg-[#ebdbb2]/40 dark:bg-[#282828]/40 border border-[#d5c4a1] dark:border-[#3c3836]">
              <div className="font-bold text-[11px] text-[#b57614] dark:text-[#fabd2f] mb-1">
                USER PERSONALIZATION PROFILE
              </div>
              <div className="text-[11px] space-y-1 text-[#504945] dark:text-[#ebdbb2]">
                <div>• User: <strong className="text-[#3c3836] dark:text-[#fbf1c7]">{userProfile.displayName}</strong> ({userProfile.role})</div>
                <div>• Company: <strong>{userProfile.preferences.companyName}</strong></div>
                <div>• Tone: <strong>{userProfile.preferences.tone}</strong></div>
                <div>• Custom Directives: <strong>{userProfile.preferences.customInstructions || 'None'}</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* 6. Collaboration Graph */}
        {activeTab === 'graph' && (
          <div className="space-y-3">
            <div className="text-xs font-bold mb-2">AUTONOMOUS AGENT ORCHESTRATION BUS</div>
            <div className="p-4 rounded bg-[#ebdbb2] dark:bg-[#282828] border border-[#d5c4a1] dark:border-[#3c3836] text-center space-y-3">
              <div className="inline-block p-2 rounded bg-[#fabd2f] text-[#1d2021] font-bold text-xs">
                👑 MICHAEL SCOTT (Floor Orchestrator)
              </div>
              <div className="text-[#7c6f64] dark:text-[#928374] text-xs">↓ Multi-Agent Delegation Bus ↓</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                <div className="p-2 rounded bg-[#3c3836] text-emerald-400 font-bold">
                  🛡️ Dwight (Security)
                </div>
                <div className="p-2 rounded bg-[#3c3836] text-sky-400 font-bold">
                  ⚡ Ruflo (Code & Tools)
                </div>
                <div className="p-2 rounded bg-[#3c3836] text-amber-400 font-bold">
                  📊 Kevin (Finance)
                </div>
                <div className="p-2 rounded bg-[#3c3836] text-purple-400 font-bold">
                  📱 Ryan (Growth)
                </div>
              </div>
              <div className="text-[#7c6f64] dark:text-[#928374] text-[10px] mt-2">
                24*7 Background Daemon (Toby) self-heals memory & synchronizes IPC bus continuously.
              </div>
            </div>
          </div>
        )}

        {/* 7. Triggers */}
        {activeTab === 'triggers' && (
          <div className="space-y-3">
            <div className="font-bold text-xs mb-1">AUTONOMOUS & VOICE TRIGGERS</div>

            {/* Voice-to-Text Mission Trigger Card */}
            <div className="p-3 rounded bg-gradient-to-r from-[#b57614]/15 to-[#fabd2f]/10 border border-[#fabd2f]/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-[#fabd2f] text-[#1d2021]">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[#b57614] dark:text-[#fabd2f]">
                      Voice-to-Text Mission Trigger
                    </div>
                    <div className="text-[10px] text-[#7c6f64] dark:text-[#928374]">
                      Microphone Browser API • Wake Phrase: <code className="px-1 py-0.5 rounded bg-[#ebdbb2] dark:bg-[#1d2021] font-bold text-[#3c3836] dark:text-[#ebdbb2]">"Rufflo, initialize [Mission Name]"</code>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {isListening ? 'LISTENING (MIC ACTIVE)' : 'READY'}
                  </span>
                  <button
                    onClick={toggleVoiceRecording}
                    className="px-2.5 py-1 rounded bg-[#fabd2f] hover:bg-[#d79921] text-[#1d2021] font-bold text-[10px] flex items-center gap-1 shadow-sm transition-colors"
                  >
                    {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                    <span>{isListening ? 'Stop Mic' : 'Start Mic'}</span>
                  </button>
                </div>
              </div>

              {/* Live VU meter in triggers tab if listening */}
              {isListening && (
                <div className="p-2 rounded bg-[#ebdbb2]/50 dark:bg-[#1d2021]/80 border border-[#d5c4a1] dark:border-[#3c3836] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-red-500 animate-pulse">● REC</span>
                    <div className="flex items-end gap-0.5 h-3">
                      {[15, 40, 75, 50, 90, 60, 30, 80].map((h, i) => (
                        <div
                          key={i}
                          className="w-1 bg-[#fabd2f] rounded-full transition-all duration-75"
                          style={{
                            height: `${Math.max(20, Math.min(100, (micAudioLevel * (h / 50))))}%`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-[#7c6f64] dark:text-[#928374]">
                      {liveVoiceTranscript ? `"${liveVoiceTranscript}"` : 'Listening for "Rufflo, initialize [Mission Name]"...'}
                    </span>
                  </div>
                </div>
              )}

              {/* Quick simulation buttons */}
              <div className="pt-1 border-t border-[#fabd2f]/20">
                <div className="text-[10px] font-bold text-[#7c6f64] dark:text-[#928374] mb-1.5">
                  Voice Commands (Missions & Direct Agent Delegation):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Rufflo, initialize Cloud Migration Phase 1', type: 'mission' },
                    { label: 'Rufflo, initialize Zero-Trust Security Audit', type: 'mission' },
                    { label: 'Rufflo, tell Dwight to audit perimeter security', type: 'delegation' },
                    { label: 'Rufflo, tell Jim to launch viral outreach campaign', type: 'delegation' },
                    { label: 'Rufflo, tell Kevin to calculate Q3 server runway', type: 'delegation' },
                    { label: 'Rufflo, tell Toby to execute IPC memory sweep', type: 'delegation' },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        soundFx.playClick();
                        setLiveVoiceTranscript(item.label);
                        if (item.type === 'mission') {
                          const mission = parseMissionVoiceTrigger(item.label);
                          if (mission) handleInitializeVoiceMission(mission);
                        } else {
                          const del = parseAgentVoiceDelegation(item.label);
                          if (del) handleVoiceAgentDelegation(del.agentName, del.taskDescription);
                        }
                      }}
                      className="px-2 py-1 rounded bg-[#ebdbb2] dark:bg-[#1d2021] hover:bg-[#d5c4a1] dark:hover:bg-[#3c3836] text-[10px] font-medium border border-[#d5c4a1] dark:border-[#3c3836] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Sparkles className={`w-2.5 h-2.5 ${item.type === 'mission' ? 'text-[#fabd2f]' : 'text-emerald-500'}`} />
                      <span>"{item.label}"</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {[
              { name: 'Hourly Standup Broadcast', target: 'Michael', cond: 'Interval: 60m', active: true },
              { name: 'Continuous Memory & Health Sweep', target: 'Toby', cond: 'Interval: 8s', active: true },
              { name: 'Zero-Trust Privilege Escalation Alert', target: 'Dwight', cond: 'Event: Auth Change', active: true },
              { name: 'Live Feature Hot-Reload Daemon', target: 'Ruflo Coder', cond: 'Event: File/IDE Edit', active: true },
            ].map((t, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded bg-[#ebdbb2] dark:bg-[#282828] border border-[#d5c4a1] dark:border-[#3c3836] flex items-center justify-between text-[11px]"
              >
                <div>
                  <div className="font-bold">{t.name}</div>
                  <div className="text-[10px] text-[#7c6f64] dark:text-[#928374]">
                    Assigned: {t.target} | {t.cond}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                  ACTIVE
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 8. Activity Log View */}
        {activeTab === 'activity' && (
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="font-bold text-xs mb-1">FLEET AUDIT ACTIVITY TRAIL</div>
            {logs.slice(-15).map((l) => (
              <div key={l.id} className="p-1.5 rounded bg-[#ebdbb2]/30 dark:bg-[#282828]/40 flex items-center gap-2">
                <span className="text-[10px] text-[#928374]">[{l.timestamp}]</span>
                <strong className="text-[#b57614] dark:text-[#fabd2f] uppercase text-[10px]">{l.agentId}:</strong>
                <span className="truncate">{l.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* 9. Commands Palette */}
        {activeTab === 'commands' && (
          <div className="space-y-2">
            <div className="font-bold text-xs mb-1">TERMINAL SLASH COMMANDS</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {[
                { cmd: '/standup', desc: 'Trigger an all-hands fleet standup meeting in the conference room' },
                { cmd: '/audit_security', desc: 'Run zero-trust defensive security scan with Dwight' },
                { cmd: '/runway', desc: 'Calculate runway and P&L unit economics with Kevin' },
                { cmd: '/viral_thread', desc: 'Generate social media post campaign with Ryan' },
                { cmd: '/open_ide', desc: 'Launch dynamic feature live code editor' },
                { cmd: '/toggle_auto', desc: 'Switch between autonomous and manual mode' },
              ].map((c, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setInputPrompt(c.cmd);
                    setActiveTab('terminal');
                  }}
                  className="p-2 rounded bg-[#ebdbb2] dark:bg-[#282828] hover:bg-[#d5c4a1] dark:hover:bg-[#3c3836] cursor-pointer border border-[#d5c4a1] dark:border-[#3c3836]"
                >
                  <code className="text-[#b57614] dark:text-[#fabd2f] font-bold">{c.cmd}</code>
                  <p className="text-[10px] text-[#7c6f64] dark:text-[#928374] mt-0.5">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. Background Workers */}
        {activeTab === 'workers' && (
          <div className="space-y-2">
            <div className="font-bold text-xs mb-2">ACTIVE BACKGROUND THREADS & DAEMONS (24*7)</div>
            {[
              { name: 'Toby Continuous Debugger Loop', thread: 'Worker-01', cpu: '1.2%', status: 'Running' },
              { name: 'Ruflo IPC Message Bus', thread: 'Worker-02', cpu: '0.8%', status: 'Running' },
              { name: 'Telemetry & Garbage Collector', thread: 'Worker-03', cpu: '0.4%', status: 'Running' },
              { name: 'Autonomous Task Scheduler', thread: 'Worker-04', cpu: '0.9%', status: 'Running' },
            ].map((w, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded bg-[#ebdbb2] dark:bg-[#282828] border border-[#d5c4a1] dark:border-[#3c3836] flex items-center justify-between text-[11px]"
              >
                <div>
                  <div className="font-bold">{w.name}</div>
                  <div className="text-[10px] text-[#7c6f64] dark:text-[#928374]">
                    Thread: {w.thread} • CPU: {w.cpu}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 11. Rufflo Loop Dashboard */}
        {activeTab === 'rufflo' && (
          <RuffloObjectivesPanel />
        )}
        </div>
        )}
      </div>

      {/* Input Queue Box with Attachments, Voice, and Actions */}
      <div className="p-2.5 bg-[#ebdbb2] dark:bg-[#282828] border-t border-[#d5c4a1] dark:border-[#3c3836]">
        {/* Attached File Preview Badge */}
        {attachedFile && (
          <div className="flex items-center justify-between px-2 py-1 mb-2 bg-[#d5c4a1] dark:bg-[#1d2021] rounded border border-[#bdae93] dark:border-[#3c3836] text-[11px]">
            <div className="flex items-center gap-1.5 truncate">
              <FileText className="w-3.5 h-3.5 text-[#b57614] dark:text-[#fabd2f]" />
              <span className="font-bold truncate">{attachedFile.name}</span>
              <span className="text-[10px] text-[#7c6f64] dark:text-[#928374]">
                ({Math.round(attachedFile.size / 1024)} KB)
              </span>
            </div>
            <button
              onClick={() => setAttachedFile(null)}
              className="p-0.5 hover:text-red-500"
              title="Remove File"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="relative flex flex-col gap-1.5">
          {/* Voice Trigger Notice or Live Microphone Status Banner */}
          {isListening && (
            <div className="p-2 rounded bg-[#1d2021] text-[#ebdbb2] border border-red-500/40 space-y-1.5 animate-in fade-in slide-in-from-bottom-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                    Microphone Active • Audio Analyser Running
                  </span>
                </div>
                {/* Live VU meter waveform bars */}
                <div className="flex items-end gap-0.5 h-3.5 px-2 py-0.5 rounded bg-black/40 border border-[#3c3836]">
                  {[20, 50, 85, 60, 100, 70, 40, 90, 55, 30].map((bar, i) => (
                    <div
                      key={i}
                      className="w-1 bg-[#fabd2f] rounded-full transition-all duration-75"
                      style={{
                        height: `${Math.max(15, Math.min(100, micAudioLevel * (bar / 50)))}%`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 text-[#a89984] truncate">
                  <Sparkles className="w-3 h-3 text-[#fabd2f] shrink-0" />
                  <span className="text-[#fabd2f] font-semibold">Wake Phrase:</span>
                  <span className="font-mono truncate">"Rufflo, initialize [Mission Name]"</span>
                </div>
                {liveVoiceTranscript && (
                  <span className="text-emerald-400 font-mono italic truncate max-w-[240px]">
                    "{liveVoiceTranscript}"
                  </span>
                )}
              </div>
            </div>
          )}

          {voiceTriggerNotice && !isListening && (
            <div className="px-2.5 py-1.5 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 animate-in fade-in">
              <div className="flex items-center gap-1.5 font-medium truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="font-bold">Voice Trigger Active:</span>
                <span className="truncate">{voiceTriggerNotice.message}</span>
              </div>
              <button
                onClick={() => setVoiceTriggerNotice(null)}
                className="p-0.5 hover:text-red-500 shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#7c6f64] dark:text-[#928374]">
              QUEUE - {selectedAgent.name.toUpperCase()}
            </div>
            {/* Quick Voice Trigger Test Chips */}
            <div className="hidden sm:flex items-center gap-1">
              <span className="text-[9px] text-[#7c6f64] dark:text-[#928374]">Voice Trigger:</span>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  const phrase = 'Rufflo, initialize Security Audit';
                  setLiveVoiceTranscript(phrase);
                  const mission = parseMissionVoiceTrigger(phrase);
                  if (mission) handleInitializeVoiceMission(mission);
                }}
                className="px-1.5 py-0.5 rounded bg-[#d5c4a1] dark:bg-[#3c3836] hover:bg-[#c6b690] dark:hover:bg-[#504945] text-[9px] text-[#3c3836] dark:text-[#ebdbb2] border border-[#bdae93] dark:border-[#504945] flex items-center gap-1 transition-colors"
                title="Simulate Voice Command: 'Rufflo, initialize Security Audit'"
              >
                <Sparkles className="w-2.5 h-2.5 text-[#b57614] dark:text-[#fabd2f]" />
                <span>"Rufflo, initialize Security Audit"</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <textarea
              id="input-command-queue"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={`${selectedAgent.name} is ready — queue a message or task, or say "Rufflo, initialize [Mission Name]"`}
              rows={2}
              className="w-full px-2.5 py-1.5 bg-[#fbf1c7] dark:bg-[#181615] text-[#3c3836] dark:text-[#ebdbb2] border border-[#d5c4a1] dark:border-[#3c3836] rounded font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#fabd2f] resize-none"
            />

            <div className="flex items-center justify-between">
              {/* Left Action Buttons */}
              <div className="flex items-center gap-1.5">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  id="btn-attach-files"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-1 rounded bg-[#d5c4a1] dark:bg-[#3c3836] hover:bg-[#c6b690] dark:hover:bg-[#504945] text-[#3c3836] dark:text-[#ebdbb2] text-[11px] font-bold flex items-center gap-1 border border-[#bdae93] dark:border-[#504945]"
                  title="Attach File (.ts, .py, .json, .csv, docs)"
                >
                  <Paperclip className="w-3 h-3" />
                  <span>+ files</span>
                </button>

                {/* Voice Input (Speech-to-Text & Microphone Browser API) */}
                <button
                  type="button"
                  id="btn-voice-input"
                  onClick={toggleVoiceRecording}
                  className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 border transition-colors ${
                    isListening
                      ? 'bg-red-500 text-white border-red-600 animate-pulse shadow-sm'
                      : 'bg-[#d5c4a1] dark:bg-[#3c3836] hover:bg-[#c6b690] dark:hover:bg-[#504945] text-[#3c3836] dark:text-[#ebdbb2] border-[#bdae93] dark:border-[#504945]'
                  }`}
                  title='Capture Microphone Audio / Say "Rufflo, initialize [Mission Name]"'
                >
                  {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  <span>{isListening ? 'listening (mic on)...' : 'voice trigger'}</span>
                </button>

                {/* Voice TTS Auto-Speak Toggle */}
                <button
                  type="button"
                  id="btn-toggle-tts"
                  onClick={() => {
                    soundFx.playClick();
                    setVoiceSpeechEnabled(!voiceSpeechEnabled);
                  }}
                  className={`p-1 rounded border text-[11px] ${
                    voiceSpeechEnabled
                      ? 'bg-[#fabd2f]/20 text-[#b57614] dark:text-[#fabd2f] border-[#fabd2f]/40'
                      : 'bg-[#d5c4a1] dark:bg-[#3c3836] text-[#7c6f64] dark:text-[#928374] border-[#bdae93] dark:border-[#504945]'
                  }`}
                  title="Toggle Agent Voice Audio Response (TTS)"
                >
                  {voiceSpeechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Send Button */}
              <button
                type="submit"
                id="btn-send-command"
                disabled={isProcessing || (!inputPrompt.trim() && !attachedFile)}
                className="px-3 py-1 rounded bg-[#fabd2f] hover:bg-[#d79921] disabled:opacity-50 text-[#1d2021] font-bold text-xs flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
              >
                <span>send</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
