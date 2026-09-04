import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Agent,
  AgentLog,
  FleetTask,
  DynamicFeature,
  UserProfile,
  UserPreferences,
  AttachedFile,
  SystemTelemetry,
} from './types';
import {
  INITIAL_AGENTS,
  INITIAL_DYNAMIC_FEATURES,
  INITIAL_TRIGGERS,
} from './constants/initialAgents';
import { soundFx, speakText } from './utils/speech';
import { TopNavigation } from './components/TopNavigation';
import { CommandCenter } from './components/CommandCenter';
import { FleetHealthMonitor, getAgentThroughputTier, formatTokenThroughput } from './components/FleetHealthMonitor';
import { ModalManager, ModalManagerState } from './components/ModalManager';
import { DepartmentHubView } from './components/DepartmentHubView';
import { MunderdifflinDashboard } from './components/MunderdifflinDashboard';
import { RuffloIntelligenceChatbot } from './components/RuffloIntelligenceChatbot';

import { initializeSystemRuntime, sendAndApplySystemCode } from './utils/systemRuntime';
import { Zap } from 'lucide-react';
import { VoiceWaveform } from './components/VoiceWaveform';
import {
  initializeAgentQuantumState,
  runQuantumModelForTask,
  searchQuantumMemory,
} from './utils/quantumEngine';

const DEFAULT_USER: UserProfile = {
  id: 'usr-admin-01',
  username: 'admin',
  displayName: 'Michael G. Scott',
  email: 'easybusiness.cop@gmail.com',
  avatar: '👔',
  role: 'admin',
  preferences: {
    theme: 'retro-beige',
    defaultAgentId: 'michael',
    autoMode: true,
    voiceEnabled: true,
    voiceAutoSpeak: true,
    speechRate: 1.0,
    speechPitch: 1.0,
    continuousDebug: true,
    autoApplyCodeToSystem: true,
    tone: 'Witty & Professional (The Office style)',
    companyName: 'Dunder Mifflin Paper Co.',
    customInstructions: 'Focus on maximum fleet alignment and clean execution.',
    memorySummary: 'Active multi-agent fleet operations session with 9 healthy workers.',
  },
  createdAt: Date.now() - 86400000,
  lastLogin: Date.now(),
};


function Icon({ children }: { children: React.ReactNode }) {
  return <span className="icon">{children}</span>;
}

function StatusDot({ status }: { status: string }) {
  return (
    <span className={`status-dot ${status}`}>
      <span />
    </span>
  );
}

function Activity({ color, agent, action, time }: { key?: React.Key; color: string; agent: string; action: string; time: string; }) {
  return (
    <div className="activity-row">
      <span className="activity-line" style={{ background: color }} />
      <div className="activity-avatar" style={{ background: `${color}22`, color }}>
        {agent[0]}
      </div>
      <div className="activity-text">
        <strong>{agent}</strong>
        <span>{action}</span>
      </div>
      <time>{time} ago</time>
    </div>
  );
}

function Tool({ name, icon, active = false }: { name: string; icon: string; active?: boolean; }) {
  return (
    <div className="tool-row">
      <span className="tool-icon">{icon}</span>
      <span>{name}</span>
      <span className={`tool-status ${active ? "connected" : ""}`}>
        {active ? "Connected" : "Offline"}
      </span>
    </div>
  );
}

export default function App() {
  const [agents, setAgents] = useState<Agent[]>(() => INITIAL_AGENTS);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(() => INITIAL_AGENTS[0]?.id || 'michael');
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [tasks, setTasks] = useState<FleetTask[]>([]);
  const [dynamicFeatures, setDynamicFeatures] = useState<DynamicFeature[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('munderdiffl_user_profile');
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });

  const [telemetry, setTelemetry] = useState<SystemTelemetry>({
    uptime: 0,
    cyclesRun: 0,
    healthScore: 100,
    patchesApplied: 0,
    activeWorkers: 0,
    heapUsedMB: 0,
    heapTotalMB: 0,
    rssMB: 0,
    logs: [],
  });

  const [autoMode, setAutoMode] = useState<boolean>(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Centralized Modal Management
  const [modalState, setModalState] = useState<ModalManagerState>({
    isSearchOpen: false,
    isAuthOpen: false,
    isPreferencesOpen: false,
    isAdminOrchestratorOpen: false,
    isDynamicFeaturesOpen: false,
    isIdeOpen: false,
    isCallOpen: false,
    isWorkstationOpen: false,
    isAgentDetailOpen: false,
    isWebOpen: false,
    isReposOpen: false,
    isDebuggerOpen: false,
    isSystemModulesOpen: false,
    isAcademyOpen: false,
    isMasterEvolutionOpen: false,
    isCompanyDbOpen: false,
    isAnalyticsOpen: false,
    isWorkspaceOpen: false,
    isPublicApiOpen: false,
    isSocialPluginOpen: false,
    isDeploymentPipelineOpen: false,
    isMunderdifflinDashboardOpen: false,
    isDynamicKbOpen: false,
    isSupabaseDiagnosticOpen: false,
  });

  const openModal = (key: keyof ModalManagerState) => {
    setModalState((prev) => ({ ...prev, [key]: true }));
  };

  const closeModal = (key: keyof ModalManagerState) => {
    setModalState((prev) => ({ ...prev, [key]: false }));
  };

  const closeAllModals = () => {
    setModalState({
      isSearchOpen: false,
      isAuthOpen: false,
      isPreferencesOpen: false,
      isAdminOrchestratorOpen: false,
      isDynamicFeaturesOpen: false,
      isIdeOpen: false,
      isCallOpen: false,
      isWorkstationOpen: false,
      isAgentDetailOpen: false,
      isWebOpen: false,
      isReposOpen: false,
      isDebuggerOpen: false,
      isSystemModulesOpen: false,
      isAcademyOpen: false,
      isMasterEvolutionOpen: false,
      isCompanyDbOpen: false,
      isAnalyticsOpen: false,
      isWorkspaceOpen: false,
      isPublicApiOpen: false,
      isSocialPluginOpen: false,
      isDeploymentPipelineOpen: false,
      isMunderdifflinDashboardOpen: false,
      isDynamicKbOpen: false,
      isSupabaseDiagnosticOpen: false,
    });
  };

  // Helper setters for full backward compatibility
  const createModalSetter = (key: keyof ModalManagerState) => (v: boolean | ((prev: boolean) => boolean)) => {
    setModalState((prev) => ({
      ...prev,
      [key]: typeof v === 'function' ? v(prev[key]) : v,
    }));
  };

  const setIsSearchOpen = createModalSetter('isSearchOpen');
  const setIsAuthOpen = createModalSetter('isAuthOpen');
  const setIsPreferencesOpen = createModalSetter('isPreferencesOpen');
  const setIsAdminOrchestratorOpen = createModalSetter('isAdminOrchestratorOpen');
  const setIsDynamicFeaturesOpen = createModalSetter('isDynamicFeaturesOpen');
  const setIsIdeOpen = createModalSetter('isIdeOpen');
  const setIsCallOpen = createModalSetter('isCallOpen');
  const setIsWorkstationOpen = createModalSetter('isWorkstationOpen');
  const setIsAgentDetailOpen = createModalSetter('isAgentDetailOpen');
  const setIsWebOpen = createModalSetter('isWebOpen');
  const setIsReposOpen = createModalSetter('isReposOpen');
  const setIsDebuggerOpen = createModalSetter('isDebuggerOpen');
  const setIsSystemModulesOpen = createModalSetter('isSystemModulesOpen');
  const setIsAcademyOpen = createModalSetter('isAcademyOpen');
  const setIsMasterEvolutionOpen = createModalSetter('isMasterEvolutionOpen');
  const setIsCompanyDbOpen = createModalSetter('isCompanyDbOpen');
  const setIsAnalyticsOpen = createModalSetter('isAnalyticsOpen');
  const setIsWorkspaceOpen = createModalSetter('isWorkspaceOpen');
  const setIsPublicApiOpen = createModalSetter('isPublicApiOpen');
  const setIsSocialPluginOpen = createModalSetter('isSocialPluginOpen');
  const setIsDeploymentPipelineOpen = createModalSetter('isDeploymentPipelineOpen');
  const setIsMunderdifflinDashboardOpen = createModalSetter('isMunderdifflinDashboardOpen');
  const setIsDynamicKbOpen = createModalSetter('isDynamicKbOpen');

  // Initial tab to display when MunderdifflinDashboard is launched
  const [dashboardInitialTab, setDashboardInitialTab] = useState<'roster_and_assign' | 'monitor' | 'outputs' | 'knowledge' | 'pipelines' | 'communication' | 'skills' | 'sops'>('roster_and_assign');

  const [systemModulesCount, setSystemModulesCount] = useState<number>(1);
  const [featureToEditInIde, setFeatureToEditInIde] = useState<DynamicFeature | null>(null);
  const [autoApplyToast, setAutoApplyToast] = useState<{
    show: boolean;
    agentName: string;
    moduleName: string;
  } | null>(null);

  // Real persistent Company OS States
  const [company, setCompany] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  // Initialize client-side system runtime and fetch active system modules + company details
  useEffect(() => {
    initializeSystemRuntime();
    
    const fetchActiveModules = async () => {
      try {
        const res = await fetch('/api/system/active-modules', {
          headers: { Accept: 'application/json' },
        });
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const data = await res.json();
          if (data.success && data.modules) {
            setSystemModulesCount(data.modules.length);
          }
        }
      } catch (e) {}
    };

    const fetchCompanyDetails = async () => {
      try {
        const res = await fetch('/api/company/details', {
          headers: { Accept: 'application/json' },
        });
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const data = await res.json();
          if (data.success) {
            setCompany(data.company);
            setDepartments(data.departments);
            setProjects(data.projects);
            setMissions(data.missions);
            setAudits(data.audits);
            setAccounts(data.accounts);
            if (data.tasks) {
              setTasks(data.tasks);
            }
            if (data.employees) {
              setAgents((prev) => {
                const initialMap = new Map(INITIAL_AGENTS.map((a) => [a.id, a]));
                return data.employees.map((dbEmp: any) => {
                  const initialAgent = initialMap.get(dbEmp.id);
                  if (initialAgent) {
                    return {
                      ...initialAgent,
                      tokensProcessed: dbEmp.kpis.tokensProcessed,
                      trainingRecord: dbEmp.trainingRecord || initialAgent.trainingRecord,
                      memory: dbEmp.memorySummary ? [dbEmp.memorySummary, ...initialAgent.memory.slice(1)] : initialAgent.memory,
                    };
                  } else {
                    const nickname = dbEmp.id.replace('emp-', '').slice(0, 8).toUpperCase();
                    let avatar = '👤';
                    let color = '#a89984';
                    if (dbEmp.department === 'executive') { avatar = '👔'; color = '#fabd2f'; }
                    else if (dbEmp.department === 'engineering') { avatar = '💻'; color = '#8ec07c'; }
                    else if (dbEmp.department === 'security') { avatar = '🛡️'; color = '#b8bb26'; }
                    else if (dbEmp.department === 'marketing') { avatar = '📣'; color = '#83a598'; }
                    else if (dbEmp.department === 'operations') { avatar = '📋'; color = '#d3869b'; }
                    else if (dbEmp.department === 'finance') { avatar = '📊'; color = '#fe8019'; }
                    else if (dbEmp.department === 'growth') { avatar = '🚀'; color = '#d65d0e'; }
                    else if (dbEmp.department === 'research') { avatar = '🔍'; color = '#fb4934'; }
                    else if (dbEmp.department === 'reliability') { avatar = '⚙️'; color = '#928374'; }

                    const offsetIdx = data.employees.indexOf(dbEmp) % 8;
                    let baseDeskX = 200;
                    let baseDeskY = 400;
                    let zone: 'management' | 'sales' | 'accounting' | 'reception' | 'annex' | 'kitchen' | 'conference' = 'sales';

                    if (dbEmp.department === 'executive') { baseDeskX = 110 + offsetIdx * 15; baseDeskY = 120 + offsetIdx * 5; zone = 'management'; }
                    else if (dbEmp.department === 'engineering') { baseDeskX = 390 + offsetIdx * 12; baseDeskY = 220 + offsetIdx * 8; zone = 'management'; }
                    else if (dbEmp.department === 'security') { baseDeskX = 180 + offsetIdx * 15; baseDeskY = 410 + offsetIdx * 5; zone = 'sales'; }
                    else if (dbEmp.department === 'marketing') { baseDeskX = 110 + offsetIdx * 15; baseDeskY = 410 + offsetIdx * 5; zone = 'sales'; }
                    else if (dbEmp.department === 'operations') { baseDeskX = 330 + offsetIdx * 12; baseDeskY = 510 + offsetIdx * 6; zone = 'reception'; }
                    else if (dbEmp.department === 'finance') { baseDeskX = 260 + offsetIdx * 15; baseDeskY = 410 + offsetIdx * 5; zone = 'accounting'; }
                    else if (dbEmp.department === 'growth') { baseDeskX = 330 + offsetIdx * 15; baseDeskY = 410 + offsetIdx * 5; zone = 'annex'; }
                    else if (dbEmp.department === 'research') { baseDeskX = 410 + offsetIdx * 15; baseDeskY = 410 + offsetIdx * 5; zone = 'sales'; }
                    else if (dbEmp.department === 'reliability') { baseDeskX = 460 + offsetIdx * 12; baseDeskY = 510 + offsetIdx * 6; zone = 'annex'; }

                    return {
                      id: dbEmp.id,
                      name: dbEmp.name,
                      nickname: nickname,
                      role: dbEmp.role,
                      title: dbEmp.role,
                      avatar: avatar,
                      color: color,
                      deskPosition: { x: baseDeskX, y: baseDeskY, facing: 'south', zone },
                      status: dbEmp.status || 'idle',
                      currentTask: dbEmp.currentTask || 'Ready for operations',
                      capabilities: dbEmp.skills || [],
                      systemPrompt: dbEmp.jobDescription || '',
                      memory: [dbEmp.memorySummary || 'Initialized in database.'],
                      voicePitch: 1.0,
                      voiceRate: 1.0,
                      tokensProcessed: dbEmp.kpis.tokensProcessed || 0,
                      trainingRecord: dbEmp.trainingRecord,
                    };
                  }
                });
              });
            }
          }
        }
      } catch (e) {
        // Quiet fallback when dev server is restarting or initializing
        console.debug('Company details poll skipped (waiting for backend sync)');
      }
    };

    fetchActiveModules();
    fetchCompanyDetails();
    
    const intervalModules = setInterval(fetchActiveModules, 15000);
    const intervalDetails = setInterval(fetchCompanyDetails, 5000);
    
    return () => {
      clearInterval(intervalModules);
      clearInterval(intervalDetails);
    };
  }, []);

  // Global Keyboard Shortcut (Cmd/Ctrl + K) for Quick Search Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        soundFx.playClick();
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Trigger Instant Manual Debugger Self-Healing
  const handleTriggerManualHeal = async () => {
    try {
      const res = await fetch('/api/debugger/trigger-heal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Operator Console Manual Trigger' }),
      });
      const data = await res.json();
      if (data.success) {
        setTelemetry((prev) => ({
          ...prev,
          patchesApplied: data.patchesApplied,
          healthScore: data.healthScore,
          logs: [
            {
              id: `dbg-manual-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              level: 'success',
              message: `[Self-Healing Patch #${data.patchesApplied}] Instant memory de-fragmentation and zero-trust audit executed.`,
            },
            ...prev.logs,
          ],
        }));
      }
    } catch (e) {
      console.error('Manual heal error:', e);
    }
  };

  // Import Repo dynamic tool into fleet
  const handleImportRepoTool = (feature: Partial<DynamicFeature>) => {
    const feat: DynamicFeature = {
      id: `feat-repo-${Date.now()}`,
      name: feature.name || 'Imported Repo Module',
      description: feature.description || 'Open-source tool connector',
      category: feature.category || 'code',
      icon: feature.icon || 'FolderGit2',
      enabled: true,
      code: feature.code || 'return true;',
      addedByAgent: feature.addedByAgent || 'Stanley Hudson / OSINT Hub',
      createdAt: Date.now(),
    };

    setDynamicFeatures((prev) => [feat, ...prev]);

    // Add log
    setLogs((prev) => [
      {
        id: `log-import-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'success',
        message: `[Tool Mounted] ${feat.name} successfully imported into active fleet registry.`,
        agentId: 'stanley',
      },
      ...prev,
    ]);
  };

  // Analyze fetched web content
  const handleAnalyzeWebContent = (content: string, title: string) => {
    handleExecutePrompt(
      `Analyze the following fetched web resource "${title}":\n\n\`\`\`\n${content.slice(0, 3000)}\n\`\`\`\n\nProvide key architectural insights, security evaluation, and recommendations for our fleet.`
    );
  };

  // Mount code snippet directly to live IDE
  const handleMountToIde = (code: string, title: string) => {
    const feat: DynamicFeature = {
      id: `feat-ide-${Date.now()}`,
      name: title || 'Mounted Code Feature',
      description: `Imported from web/repo resource`,
      category: 'code',
      icon: 'Code',
      enabled: true,
      code: code || '// Live code snippet\nreturn { status: "ready" };',
      addedByAgent: 'Ruflo Coder',
      createdAt: Date.now(),
    };
    setFeatureToEditInIde(feat);
    setIsIdeOpen(true);
  };

  // Sync user profile to localStorage
  useEffect(() => {
    localStorage.setItem('munderdiffl_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Poll system telemetry from Express backend
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch('/api/system-telemetry');
        if (res.ok) {
          const data = await res.json();
          setTelemetry(data);
        }
      } catch (e) {
        // Fallback simulated increment if network glitch
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 6000);
    return () => clearInterval(interval);
  }, []);

  // Autonomous Standup / Fleet activity timer in Auto Mode
  useEffect(() => {
    if (!autoMode) return;

    const interval = setInterval(() => {
      // Pick a random idle agent and give them a short working routine
      setAgents((prev) => {
        const idleAgents = prev.filter((a) => a.status === 'idle');
        if (idleAgents.length === 0) return prev;

        const target = idleAgents[Math.floor(Math.random() * idleAgents.length)];
        const agentPhrases: Record<string, string[]> = {
          jim: ['Looking into Q3 lead generation...', 'Closing deal with regional client.'],
          pam: ['Filing expense reports.', 'Sorting office memo backlog.'],
          kevin: ['Calculating cookie jar ROI.', 'Balancing ledger columns.'],
          ryan: ['Posting new social trend hook.', 'Optimizing conversion funnel.'],
          stanley: ['Reviewing open-source repository licenses.', 'Working on crosswords.'],
          dwight: ['Zero perimeter breaches detected.', 'Checking security cameras.'],
        };

        const phrases = agentPhrases[target.id] || ['Processing background thread...'];
        const text = phrases[Math.floor(Math.random() * phrases.length)];

        return prev.map((a) =>
          a.id === target.id
            ? {
                ...a,
                speechBubble: { text, expiresAt: Date.now() + 10000 },
                tokensProcessed: a.tokensProcessed + 120,
              }
            : a
        );
      });
    }, 12000);

    return () => clearInterval(interval);
  }, [autoMode]);


  // Autonomous Agent-to-Agent Communication Module
  useEffect(() => {
    if (!autoMode) return;

    const commsInterval = setInterval(() => {
      setAgents((prevAgents) => {
        const available = prevAgents.filter((a) => a.status === 'idle');
        if (available.length < 2) return prevAgents;

        const sender = available[Math.floor(Math.random() * available.length)];
        let receiver = available[Math.floor(Math.random() * available.length)];
        let tries = 0;
        while (receiver.id === sender.id && tries < 5) {
          receiver = available[Math.floor(Math.random() * available.length)];
          tries++;
        }
        if (receiver.id === sender.id) return prevAgents;

        const topics = [
          `Hey @${receiver.nickname}, the cross-department workflow parameters look solid. Merging now.`,
          `@${receiver.nickname}, can you review the latest resource allocation for our project?`,
          `Pinging @${receiver.nickname} to confirm the dependency audits are green.`,
          `@${receiver.nickname} I've updated the shared knowledge base with my findings.`,
          `Syncing with @${receiver.nickname} on the latest telemetry reports.`,
          `@${receiver.nickname}, just pushed the automated patches. Please verify on your end.`
        ];
        const message = topics[Math.floor(Math.random() * topics.length)];

        const commLog = {
          id: `comm-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          agentId: sender.id,
          message: `[Inter-Department Sync] ${message}`
        };

        setLogs((prev) => prev.some(l => l.id === commLog.id) ? prev : [commLog, ...prev]);

        return prevAgents.map((a) => {
          if (a.id === sender.id) {
            return { ...a, speechBubble: { text: `Messaging ${receiver.nickname}...`, expiresAt: Date.now() + 8000 } };
          }
          if (a.id === receiver.id) {
            return { ...a, speechBubble: { text: `Receiving sync from ${sender.nickname}...`, expiresAt: Date.now() + 8000 } };
          }
          return a;
        });
      });
    }, 18000);

    return () => clearInterval(commsInterval);
  }, [autoMode]);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  // Execute Prompt via Express Server-Side Gemini API with Quantum Multi-Path Evaluation
  const handleExecutePrompt = async (prompt: string, attachedFile?: AttachedFile) => {
    if (!selectedAgent) return;
    // 1. Mark selected agent as working
    setAgents((prev) =>
      prev.map((a) => (a.id === selectedAgentId ? { ...a, status: 'working' } : a))
    );

    // 2. Add user input log
    const userLog: AgentLog = {
      id: `usr-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      agentId: selectedAgent.id,
      message: `> ${prompt}${attachedFile ? ` [Attached: ${attachedFile.name}]` : ''}`,
    };
    setLogs((prev) => prev.some(l => l.id === userLog.id) ? prev : [...prev, userLog]);

    // 2b. Quantum-Inspired Superposition Multi-Path Evaluation
    let quantumWinner: any = null;
    try {
      const qResult = await runQuantumModelForTask(selectedAgent, prompt, (intermediateState) => {
        setAgents((prev) =>
          prev.map((a) => (a.id === selectedAgentId ? { ...a, quantumState: intermediateState } : a))
        );
      });
      quantumWinner = qResult.winningCandidate;

      const qLog: AgentLog = {
        id: `qnt-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'info',
        agentId: selectedAgent.id,
        message: `[QUANTUM MODEL EVALUATION] Evaluated 4 architecture pathways in superposition (|00⟩, |01⟩, |10⟩, |11⟩). Grover oracle amplified probability on easiest build path: "${quantumWinner.strategy}" (Difficulty: ${quantumWinner.difficultyScore}/10). Collapsing wavefunction onto lean build.`,
        codeSnippet: `// Quantum Search Decision Register |ψ⟩ -> |${quantumWinner.qubitState}⟩\n{\n  easiestBuildPath: "${quantumWinner.strategy}",\n  difficultyScore: "${quantumWinner.difficultyScore}/10",\n  whyEasiest: "${quantumWinner.whyEasiest || quantumWinner.description}",\n  speedupFactor: "${qResult.speedup}"\n}`,
      };
      setLogs((prev) => [...prev, qLog]);
    } catch (qErr) {
      console.warn("Quantum simulation non-fatal warning:", qErr);
    }

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          agentName: selectedAgent.name,
          agentRole: selectedAgent.role,
          prompt: quantumWinner 
            ? `${prompt}\n[QUANTUM BUILD DIRECTIVE: Use the easiest identified pathway: "${quantumWinner.strategy}" (Difficulty: ${quantumWinner.difficultyScore}/10). Build it with minimal code bloat and zero superfluous complexity.]`
            : prompt,
          userPreferences: userProfile.preferences,
          userProfile: {
            username: userProfile.username,
            displayName: userProfile.displayName,
            role: userProfile.role,
          },
          attachedFile,
        }),
      });

      const data = await response.json();
      const replyText = data.text || 'Directive completed.';

      // Add agent reply log
      const agentLog: AgentLog = {
        id: `agt-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'success',
        agentId: selectedAgent.id,
        message: replyText,
        codeSnippet: data.codeSnippet,
        appliedToSystem: Boolean(data.codeSnippet),
        systemModuleName: data.systemModule?.name || (data.codeSnippet ? `${selectedAgent.name} Auto-Module` : undefined),
      };

      setLogs((prev) => prev.some(l => l.id === agentLog.id) ? prev : [...prev, agentLog]);

      // If code was generated, auto-apply to system codes and notify
      if (data.codeSnippet) {
        const modName = data.systemModule?.name || `${selectedAgent.name} Auto Patch`;
        sendAndApplySystemCode(
          data.codeSnippet,
          modName,
          selectedAgent.name,
          'system_runtime',
          { userProfile }
        ).then((res) => {
          if (res.success) {
            setSystemModulesCount((c) => Math.max(c + 1, 1));
          }
        });

        setAutoApplyToast({
          show: true,
          agentName: selectedAgent.name,
          moduleName: modName,
        });
        setTimeout(() => {
          setAutoApplyToast(null);
        }, 6000);
      }

      // Speak agent reply if voice TTS is enabled
      if (userProfile.preferences.voiceAutoSpeak) {
        speakText(
          replyText,
          selectedAgent,
          userProfile.preferences.speechRate,
          userProfile.preferences.speechPitch
        );
      }

      // Update agent speech bubble and memory
      setAgents((prev) =>
        prev.map((a) =>
          a.id === selectedAgentId
            ? {
                ...a,
                status: 'idle',
                tokensProcessed: a.tokensProcessed + 450,
                speechBubble: {
                  text: replyText.slice(0, 45) + '...',
                  expiresAt: Date.now() + 10000,
                },
                memory: [prompt.slice(0, 60), ...a.memory.slice(0, 5)],
              }
            : a
        )
      );

      // Create completed task in list
      setTasks((prev) => [
        {
          id: `tsk-${Date.now()}`,
          title: prompt.slice(0, 40) + '...',
          description: `Executed by ${selectedAgent.name}`,
          assignedTo: selectedAgent.id,
          status: 'completed',
          progress: 100,
          priority: 'medium',
          output: replyText,
          codeSnippet: data.codeSnippet,
          createdAt: Date.now(),
          completedAt: Date.now(),
        },
        ...prev,
      ]);
    } catch (err: any) {
      const errorLog: AgentLog = {
        id: `err-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'error',
        agentId: selectedAgent.id,
        message: `Execution failed: ${err.message || 'Server error'}. Toby auto-debugger patch scheduled.`,
      };
      setLogs((prev) => prev.some(l => l.id === errorLog.id) ? prev : [...prev, errorLog]);

      setAgents((prev) =>
        prev.map((a) => (a.id === selectedAgentId ? { ...a, status: 'idle' } : a))
      );
    }
  };

  // Execute dynamic sandboxed code
  const handleExecuteCode = async (code: string) => {
    const res = await fetch('/api/execute-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, context: { user: userProfile } }),
    });
    return await res.json();
  };

  // Standup Trigger
  const handleTriggerStandup = () => {
    handleExecutePrompt(
      'Call an all-hands hourly standup with the entire fleet. Summarize what each agent is working on and ensure maximum alignment.'
    );
  };

  // Add task to fleet using Agent Execution Loop Service
  const handleAddTask = async (task: Partial<FleetTask>) => {
    const title = task.title || 'Untitled Objective';
    const description = task.description || `Autonomous workspace execution loop requested for task "${title}".`;
    const assignedTo = task.assignedTo || selectedAgentId;
    const priority = task.priority || 'medium';

    try {
      const res = await fetch('/api/agent/execute-loop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'prj-alpha',
          assignedTo,
          title,
          description,
          priority,
          userProfile: {
            username: userProfile.username,
            displayName: userProfile.displayName,
            role: userProfile.role,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.task) {
          // Add the newly created/updated task to the local queue
          setTasks((prev) => [data.task, ...prev].filter((t, index, self) => self.findIndex(tx => tx.id === t.id) === index));
          
          if (data.success) {
            // Success notification and trigger agent thought logging
            const targetEmp = agents.find((a) => a.id === assignedTo);
            const agentName = targetEmp ? targetEmp.name : 'Selected worker';
            setLogs((prev) => [
              {
                id: `log-ingest-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString(),
                level: 'info',
                agentId: assignedTo,
                message: `[Task Approved] ${agentName} has initialized their execution loop for task: "${title}". Permissions check verified (Required authority level passed).`,
              },
              ...prev,
            ]);
          } else {
            // Blocked notification with reason
            setLogs((prev) => [
              {
                id: `log-blocked-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString(),
                level: 'warn',
                agentId: assignedTo,
                message: `[Task Blocked] Permissions or authority mismatch. Reason: ${data.permissionCheck?.reason || 'Access denied.'}`,
              },
              ...prev,
            ]);
          }
        }
      }
    } catch (e) {
      console.error('Failed to create and execute task under agent execution loop:', e);
    }
  };

  // Add newly provisioned agent to fleet & persist locally
  const handleAddAgent = (newAgent: Agent) => {
    const agentWithState = {
      ...newAgent,
      quantumState: newAgent.quantumState || initializeAgentQuantumState(newAgent),
    };
    setAgents((prev) => [agentWithState, ...prev]);
    try {
      const saved = localStorage.getItem('munderdiffl_custom_agents');
      const custom: Agent[] = saved ? JSON.parse(saved) : [];
      custom.unshift(newAgent);
      localStorage.setItem('munderdiffl_custom_agents', JSON.stringify(custom));
    } catch (e) {}

    // Add log
    setLogs((prev) => [
      {
        id: `log-agent-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'success',
        agentId: newAgent.id,
        message: `[Agent Commissioned] ${newAgent.name} (${newAgent.role}) provisioned with Authority Level ${newAgent.authorityLevel}. Added to Scranton Fleet roster.`,
      },
      ...prev,
    ]);
  };

  
  const [workspaceTab, setWorkspaceTab] = useState<'command' | 'fleet' | 'network'>('command');
  const [activeDepartment, setActiveDepartment] = useState("Overview");
  const [command, setCommand] = useState("");

  const departmentsList = [
    ["Executive", "⌘", "#fabd2f", "executive"],
    ["Engineering", "◈", "#8ec07c", "engineering"],
    ["Security", "✦", "#b8bb26", "security"],
    ["Marketing", "◇", "#83a598", "marketing"],
    ["Operations", "◎", "#d3869b", "operations"],
    ["Finance", "○", "#fe8019", "finance"],
    ["Research", "△", "#fb4934", "research"],
  ];

  const visibleAgents = useMemo(() => {
    if (activeDepartment === "Overview") return agents;
    const deptInfo = departmentsList.find(d => d[0] === activeDepartment);
    const deptKey = deptInfo ? deptInfo[3] : '';
    return agents.filter((agent) => agent.department === deptKey);
  }, [activeDepartment, agents]);

  const executeCommand = () => {
    if (!command.trim()) return;
    handleExecutePrompt(command);
    setCommand("");
  };

  const getAgentColor = (dept: string) => {
    const info = departmentsList.find(d => d[3] === dept);
    return info ? info[2] : '#a89984';
  };


  return (
    <div className="rufflo-shell rufflo-app" style={{ minHeight: '100vh' }}>
      {/* BACKGROUND */}
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />

      {/* TOP NAVIGATION */}
      <TopNavigation
        userProfile={userProfile}
        onOpenSearch={() => { closeAllModals(); openModal('isSearchOpen'); }}
        onOpenAuth={() => { closeAllModals(); openModal('isAuthOpen'); }}
        onOpenPreferences={() => { closeAllModals(); openModal('isPreferencesOpen'); }}
        onOpenAdminOrchestrator={() => { closeAllModals(); openModal('isAdminOrchestratorOpen'); }}
        onOpenIde={() => { closeAllModals(); openModal('isIdeOpen'); }}
        onOpenDynamicFeatures={() => { closeAllModals(); openModal('isDynamicFeaturesOpen'); }}
        onOpenCall={() => { closeAllModals(); openModal('isCallOpen'); }}
        onOpenWeb={() => { closeAllModals(); openModal('isWebOpen'); }}
        onOpenRepos={() => { closeAllModals(); openModal('isReposOpen'); }}
        onOpenDebugger={() => { closeAllModals(); openModal('isDebuggerOpen'); }}
        onOpenSystemModules={() => { closeAllModals(); openModal('isSystemModulesOpen'); }}
        onOpenDb={() => { closeAllModals(); openModal('isCompanyDbOpen'); }}
        onOpenAnalytics={() => { closeAllModals(); openModal('isAnalyticsOpen'); }}
        onOpenAcademy={() => { closeAllModals(); openModal('isAcademyOpen'); }}
        onOpenMasterEvolution={() => { closeAllModals(); openModal('isMasterEvolutionOpen'); }}
        onOpenWorkspace={() => { closeAllModals(); openModal('isWorkspaceOpen'); }}
        onOpenPublicApiHub={() => { closeAllModals(); openModal('isPublicApiOpen'); }}
        onOpenMunderdifflinDashboard={() => { closeAllModals(); setDashboardInitialTab('roster_and_assign'); openModal('isMunderdifflinDashboardOpen'); }}
        onOpenAgentCommunication={() => { closeAllModals(); setDashboardInitialTab('communication'); openModal('isMunderdifflinDashboardOpen'); }}
        onOpenAgentSkillMatrix={() => { closeAllModals(); setDashboardInitialTab('skills'); openModal('isMunderdifflinDashboardOpen'); }}
        onOpenAgentSops={() => { closeAllModals(); setDashboardInitialTab('sops'); openModal('isMunderdifflinDashboardOpen'); }}
        onOpenDynamicKnowledgeBase={() => { closeAllModals(); openModal('isDynamicKbOpen'); }}
        onOpenSupabaseDiagnostic={() => { closeAllModals(); openModal('isSupabaseDiagnosticOpen'); }}
        dynamicFeatureCount={dynamicFeatures.length}
        systemModulesCount={32}
        autoMode={autoMode}
        onToggleAutoMode={() => setAutoMode(!autoMode)}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.().catch(() => {});
            setIsFullscreen(true);
          } else {
            document.exitFullscreen?.().catch(() => {});
            setIsFullscreen(false);
          }
        }}
      />

      {/* MAIN */}
      <div className="rufflo-main">
        <main className="main-grid rufflo-content animate-in">
        {/* LEFT SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="section-label">COMMAND</div>
            <button className={`nav-item ${activeDepartment === "Overview" && workspaceTab === "command" ? "active" : ""}`} onClick={() => { closeAllModals(); setActiveDepartment('Overview'); setWorkspaceTab('command'); }}>
              <Icon>⚡</Icon>
              <span>Command Center</span>
            </button>
            <button className={`nav-item ${activeDepartment === "Overview" && workspaceTab === "fleet" ? "active" : ""}`} onClick={() => { closeAllModals(); setActiveDepartment('Overview'); setWorkspaceTab('fleet'); }}>
              <Icon>👥</Icon>
              <span>Fleet Telemetry</span>
            </button>
            <button className={`nav-item ${activeDepartment === "Overview" && workspaceTab === "network" ? "active" : ""}`} onClick={() => { closeAllModals(); setActiveDepartment('Overview'); setWorkspaceTab('network'); }}>
              <Icon>🌐</Icon>
              <span>Company Network</span>
            </button>
            <button className={`nav-item ${activeDepartment === "Munderdifflin" ? "active" : ""}`} onClick={() => { closeAllModals(); setActiveDepartment('Munderdifflin'); }}>
              <Icon>📋</Icon>
              <span>Munderdiffl.in Agents</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); setDashboardInitialTab('communication'); openModal('isMunderdifflinDashboardOpen'); }}>
              <Icon>💬</Icon>
              <span>Agent Communication</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); setDashboardInitialTab('skills'); openModal('isMunderdifflinDashboardOpen'); }}>
              <Icon>🎯</Icon>
              <span>Skill Matrix</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); setDashboardInitialTab('sops'); openModal('isMunderdifflinDashboardOpen'); }}>
              <Icon>📁</Icon>
              <span>Agent SOPs & Data</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isDynamicKbOpen'); }}>
              <Icon>🧠</Icon>
              <span>Knowledge Base</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isAdminOrchestratorOpen'); }}>
              <Icon>◉</Icon>
              <span>Mission Control</span>
            </button>
          </div>

          <div className="sidebar-section">
            <div className="section-label">ORGANIZATION</div>
            {departmentsList.map(([name, symbol, color, deptKey]) => (
              <button
                key={name}
                className={`nav-item department ${activeDepartment === name ? "active" : ""}`}
                onClick={() => { closeAllModals(); setActiveDepartment(name); }}
              >
                <span className="department-icon" style={{ color, borderColor: `${color}55`, background: `${color}12` }}>{symbol}</span>
                <span>{name}</span>
                <span className="department-count">{agents.filter((a) => a.department === deptKey).length}</span>
              </button>
            ))}
          </div>

          <div className="sidebar-section">
            <div className="section-label">INTELLIGENCE</div>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isSearchOpen'); }}>
              <Icon>⌘</Icon>
              <span>Memory</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isAcademyOpen'); }}>
              <Icon>◇</Icon>
              <span>Knowledge</span>
            </button>
          </div>

          <div className="sidebar-section">
            <div className="section-label">DEVELOPMENT</div>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isAdminOrchestratorOpen'); }}>
              <Icon>▣</Icon>
              <span>Projects</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isIdeOpen'); }}>
              <Icon>&lt;/&gt;</Icon>
              <span>Code</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isDebuggerOpen'); }}>
              <Icon>_</Icon>
              <span>Terminal</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isReposOpen'); }}>
              <Icon>⌥</Icon>
              <span>GitHub</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isDeploymentPipelineOpen'); }}>
              <Icon>↗</Icon>
              <span>Deployments</span>
            </button>
          </div>

          <div className="sidebar-section bottom-section">
            <div className="section-label">SYSTEM</div>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isSupabaseDiagnosticOpen'); }}>
              <Icon>⚡</Icon>
              <span className="text-[#38bdf8] font-bold">Supabase Sync</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isSystemModulesOpen'); }}>
              <Icon>⚡</Icon>
              <span>Integrations</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isDebuggerOpen'); }}>
              <Icon>◈</Icon>
              <span>Security</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isAdminOrchestratorOpen'); }}>
              <Icon>≡</Icon>
              <span>Logs</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isPreferencesOpen'); }}>
              <Icon>⚙</Icon>
              <span>Settings</span>
            </button>
          </div>
        </aside>

        {/* CENTER */}
        <section className="workspace" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div className="flex-1 flex flex-col min-h-0">
                  <div className="workspace-header">
                    <div>
                      <div className="eyebrow">RUFFLO / {activeDepartment === "Munderdifflin" ? "SCRANTON BRANCH" : activeDepartment === "Overview" ? "COMMAND NETWORK" : activeDepartment.toUpperCase()}</div>
                      <h1>{activeDepartment === "Overview" ? (workspaceTab === 'command' ? "Command Center" : workspaceTab === 'fleet' ? "Agent Fleet Telemetry" : "Company Intelligence Network") : activeDepartment === "Munderdifflin" ? "Munder Diffl.in Agents" : activeDepartment}</h1>
                      <p>{activeDepartment === "Munderdifflin" ? "Autonomous task dispatch, live telemetry, and agent output memos." : "Coordinate autonomous agents, missions, knowledge and software operations."}</p>
                    </div>
                    <div className="workspace-actions">
                      {activeDepartment === 'Overview' && (
                        <div className="flex items-center gap-1 bg-[#121216] p-1 rounded-lg border border-white/10 mr-2">
                          <button
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${workspaceTab === 'command' ? 'bg-[#fabd2f]/20 text-[#fabd2f] border border-[#fabd2f]/40 shadow-sm' : 'text-[#8a857c] hover:text-[#f4f1ea]'}`}
                            onClick={() => setWorkspaceTab('command')}
                          >
                            ⚡ Command
                          </button>
                          <button
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${workspaceTab === 'fleet' ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40 shadow-sm' : 'text-[#8a857c] hover:text-[#f4f1ea]'}`}
                            onClick={() => setWorkspaceTab('fleet')}
                          >
                            👥 Fleet
                          </button>
                          <button
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${workspaceTab === 'network' ? 'bg-[#a78bfa]/20 text-[#a78bfa] border border-[#a78bfa]/40 shadow-sm' : 'text-[#8a857c] hover:text-[#f4f1ea]'}`}
                            onClick={() => setWorkspaceTab('network')}
                          >
                            🌐 Network
                          </button>
                        </div>
                      )}
                      <button
                        className="secondary-button"
                        style={{ borderColor: '#fabd2f', color: '#fabd2f' }}
                        onClick={() => setActiveDepartment(activeDepartment === 'Munderdifflin' ? 'Overview' : 'Munderdifflin')}
                      >
                        {activeDepartment === 'Munderdifflin' ? '← Overview Grid' : '📋 Munderdiffl.in'}
                      </button>
                      <button
                        className="secondary-button"
                        style={{ borderColor: '#b8bb26', color: '#b8bb26' }}
                        onClick={() => { closeAllModals(); openModal('isDynamicKbOpen'); }}
                      >
                        🧠 Knowledge
                      </button>
                      <button className="secondary-button" onClick={() => { closeAllModals(); openModal('isAdminOrchestratorOpen'); }}>+ New Mission</button>
                      <button className="primary-button" onClick={handleTriggerStandup}><span>▶</span> Run Operation</button>
                    </div>
                  </div>

                  {activeDepartment === "Munderdifflin" ? (
                    <div className="flex-1 min-h-0 mt-4 rounded-xl border border-white/10 shadow-lg overflow-hidden">
                      <MunderdifflinDashboard
                        agents={agents}
                        tasks={tasks}
                        onAddTask={handleAddTask}
                        onAddAgent={handleAddAgent}
                      />
                    </div>
                  ) : activeDepartment !== "Overview" ? (
                    <div style={{ marginBottom: 24 }}>
                      <DepartmentHubView
                        departmentName={activeDepartment}
                        departmentKey={departmentsList.find(d => d[0] === activeDepartment)?.[3] || 'executive'}
                        departmentColor={getAgentColor(departmentsList.find(d => d[0] === activeDepartment)?.[3] || '')}
                        departmentSymbol={departmentsList.find(d => d[0] === activeDepartment)?.[1] || '⌘'}
                        agents={agents}
                        tasks={tasks}
                        onSelectAgent={(id) => {
                          setSelectedAgentId(id);
                        }}
                        onOpenAgentDetail={(id) => {
                          setSelectedAgentId(id);
                          openModal('isAgentDetailOpen');
                        }}
                        onExecutePrompt={handleExecutePrompt}
                        onBackToOverview={() => setActiveDepartment('Overview')}
                      />
                    </div>
                  ) : workspaceTab === 'command' ? (
                    <div className="flex-1 min-h-0 flex flex-col">
                      <CommandCenter
                        agents={agents}
                        selectedAgent={selectedAgent}
                        onSelectAgent={setSelectedAgentId}
                        logs={logs}
                        tasks={tasks}
                        onAddTask={handleAddTask}
                        onExecutePrompt={handleExecutePrompt}
                        onExecuteCode={handleExecuteCode}
                        onOpenIde={() => { closeAllModals(); openModal('isIdeOpen'); }}
                        autoMode={autoMode}
                        onToggleAutoMode={() => setAutoMode(!autoMode)}
                        userProfile={userProfile}
                        telemetry={telemetry}
                        departments={departments}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="metric-grid">
                        <div className="metric-card">
                          <span className="metric-icon purple">◉</span>
                          <div><span>Active Agents</span><strong>{agents.length}</strong></div>
                          <small>+8.4%</small>
                        </div>
                        <div className="metric-card">
                          <span className="metric-icon cyan">◆</span>
                          <div><span>Running Missions</span><strong>{tasks.length}</strong></div>
                          <small>+12.1%</small>
                        </div>
                        <div className="metric-card">
                          <span className="metric-icon green">↗</span>
                          <div><span>Tasks Completed</span><strong>{tasks.filter(t => t.status === 'completed').length}</strong></div>
                          <small>+24.7%</small>
                        </div>
                        <div className="metric-card">
                          <span className="metric-icon pink">⚡</span>
                          <div><span>System Efficiency</span><strong>{telemetry.healthScore}%</strong></div>
                          <small>+3.2%</small>
                        </div>
                      </div>

                  {workspaceTab === 'network' && (
                    <div className="panel company-panel" style={{ marginBottom: 24 }}>
                      <div className="panel-header">
                        <div><span className="panel-kicker">LIVE ORGANISATION</span><h2>Autonomous Company Network</h2></div>
                        <div className="live-label"><StatusDot status="working" /> LIVE</div>
                      </div>
                      <div className="company-network">
                        <div className="network-grid" />
                        <div className="company-node ceo-node">
                          <div className="node-avatar ceo">R</div>
                          <div><strong>RUFFLO CORE</strong><span>Executive Intelligence</span></div>
                        </div>
                        <div className="connector vertical" />
                        <div className="department-network">
                          {departmentsList.slice(0, 6).map(([name, symbol, color, deptKey], index) => {
                            const departmentAgent = agents.find((agent) => agent.department === deptKey);
                            return (
                              <button
                                key={name}
                                className={`network-department ${activeDepartment === name ? "selected" : ""}`}
                                style={{ ["--dept-color" as any]: color }}
                                onClick={() => setActiveDepartment(name)}
                              >
                                <div className="network-dept-icon">{symbol}</div>
                                <div className="network-dept-info">
                                  <strong>{name}</strong>
                                  <span>{departmentAgent ? departmentAgent.name : "No active agent"}</span>
                                </div>
                                <StatusDot status={departmentAgent?.status || "idle"} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fleet Health & Real-Time Throughput Monitor */}
                  <div style={{ marginBottom: 20 }}>
                    <FleetHealthMonitor
                      agents={agents}
                      tasks={tasks}
                      logs={logs}
                      selectedAgentId={selectedAgent?.id}
                      onSelectAgent={(agentId) => {
                        setSelectedAgentId(agentId);
                      }}
                    />
                  </div>

                  {/* Agent Fleet Telemetry Grid */}
                  <div className="agents-section" style={{ marginTop: 0 }}>
                    <div className="section-heading">
                      <div>
                        <span className="panel-kicker">AGENT FLEET TELEMETRY</span>
                        <h2>Active Workforce & Pulse Intensity ({agents.length} Agents)</h2>
                      </div>
                      <button className="text-button" onClick={() => { closeAllModals(); openModal('isSearchOpen'); }}>View all agents →</button>
                    </div>
                    <div className="agent-grid">
                        {visibleAgents.map((agent) => {
                          const agentColor = getAgentColor(agent.department);
                          const isWorking = agent.status === 'working' || agent.status === 'thinking';
                          const tier = getAgentThroughputTier(agent, isWorking);
                          const formattedTokens = formatTokenThroughput(agent.tokensProcessed || 0);

                          return (
                            <button
                              key={agent.id}
                              className={`agent-card ${selectedAgent?.id === agent.id ? "selected" : ""} ${isWorking ? "processing-pulse" : ""}`}
                              style={{
                                ['--pulse-duration' as any]: tier.pulseSpeed,
                                ['--pulse-border-color' as any]: isWorking ? tier.color : undefined,
                                ['--pulse-border-glow' as any]: tier.color,
                                ['--pulse-glow-start' as any]: tier.glowColor,
                                ['--pulse-glow-mid' as any]: tier.glowColor,
                                ['--pulse-glow-end' as any]: 'transparent',
                              }}
                              onClick={() => { closeAllModals(); setSelectedAgentId(agent.id); openModal('isAgentDetailOpen'); }}
                            >
                              {/* Subtle pulse halo glow overlay */}
                              {isWorking && (
                                <div
                                  className="pulse-halo"
                                  style={{
                                    ['--pulse-border-glow' as any]: tier.color
                                  }}
                                />
                              )}

                              <div className="agent-card-top">
                                <div className="agent-avatar" style={{ background: `linear-gradient(135deg, ${agentColor}, #151722)` }}>
                                  {agent.name.charAt(0)}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {isWorking && (
                                    <span
                                      className="throughput-badge"
                                      style={{
                                        backgroundColor: tier.bgBadge,
                                        color: tier.textBadge,
                                        border: `1px solid ${tier.color}44`
                                      }}
                                    >
                                      ⚡ {formattedTokens}/s
                                    </span>
                                  )}
                                  <StatusDot status={agent.status} />
                                </div>
                              </div>
                              <div className="agent-info">
                                <strong>{agent.name}</strong>
                                <span>{agent.role}</span>
                              </div>
                              <div className="agent-task">
                                <small>CURRENT MISSION</small>
                                <p>{agent.currentTask || 'Awaiting directive'}</p>
                              </div>

                              {/* Quantum State Superposition Layer */}
                              <div 
                                className="quantum-state-card-layer"
                                style={{
                                  margin: '6px 0',
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  background: isWorking ? 'rgba(0, 217, 255, 0.12)' : 'rgba(0, 217, 255, 0.05)',
                                  border: isWorking ? '1px solid rgba(0, 217, 255, 0.45)' : '1px solid rgba(0, 217, 255, 0.2)',
                                  textAlign: 'left',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '3px',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ color: '#00d9ff', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>|ψ⟩</span> {agent.quantumState?.phase === 'superposition' ? 'Evaluating 4 Paths...' : 'Quantum Model'}
                                  </span>
                                  <span style={{ color: '#34d399', fontSize: '9px', fontWeight: 'bold', background: 'rgba(52, 211, 153, 0.15)', padding: '1px 4px', borderRadius: '4px' }}>
                                    Diff {agent.quantumState?.superpositionCandidates?.find(c => c.complexity === 'Minimal / Easiest')?.difficultyScore || 2}/10
                                  </span>
                                </div>
                                <div style={{ color: '#ebdbb2', fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  <span style={{ color: '#8ec07c', fontWeight: 'bold' }}>Easiest:</span> {agent.quantumState?.winningStrategyName || 'Direct Minimalist Patch'}
                                </div>
                                {/* Mini 4-state superposition wave indicator */}
                                <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
                                  {(agent.quantumState?.superpositionCandidates || []).slice(0, 4).map((cand, ci) => (
                                    <div
                                      key={cand.id || ci}
                                      title={`${cand.strategy} (${cand.qubitState}) - Diff: ${cand.difficultyScore}/10`}
                                      style={{
                                        flex: 1,
                                        height: '3px',
                                        borderRadius: '2px',
                                        background: cand.complexity === 'Minimal / Easiest' 
                                          ? '#34d399' 
                                          : isWorking ? 'rgba(0, 217, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)',
                                        boxShadow: cand.complexity === 'Minimal / Easiest' ? '0 0 4px #34d399' : undefined
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>

                              <div className="progress">
                                <div 
                                  className="progress-value" 
                                  style={{ 
                                    width: `${Math.max(10, Math.floor(Math.random() * 100))}%`, 
                                    background: isWorking ? tier.color : agentColor,
                                    boxShadow: isWorking ? `0 0 8px ${tier.color}` : undefined
                                  }} 
                                />
                              </div>
                              <div className="agent-footer">
                                <span style={{ color: isWorking ? tier.color : undefined }}>
                                  {isWorking ? `● ${tier.label}` : agent.status.toUpperCase()}
                                </span>
                                <span>{formattedTokens}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="panel activity-panel">
                    <div className="panel-header">
                      <div><span className="panel-kicker">REAL-TIME TELEMETRY & QUANTUM ALIGNMENT</span><h2>Agent Activity & Communication</h2></div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button className="text-button text-[#fabd2f] font-bold" onClick={() => { closeAllModals(); setDashboardInitialTab('communication'); setIsMunderdifflinDashboardOpen(true); }}>💬 Threads (Quantum) →</button>
                        <button className="text-button text-[#b8bb26] font-bold" onClick={() => { closeAllModals(); setDashboardInitialTab('skills'); setIsMunderdifflinDashboardOpen(true); }}>🎯 Skill Matrix →</button>
                        <button className="text-button" onClick={() => { closeAllModals(); setIsAdminOrchestratorOpen(true); }}>Events →</button>
                      </div>
                    </div>
                    <div className="activity-list">
                      {logs.slice(0, 4).map(log => (
                        <Activity
                          key={log.id}
                          color={getAgentColor(agents.find(a => a.id === log.agentId)?.department || '')}
                          agent={agents.find(a => a.id === log.agentId)?.name || 'System'}
                          action={log.message.slice(0, 60) + (log.message.length > 60 ? '...' : '')}
                          time={log.timestamp}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
        </section>

        {/* RIGHT COPILOT: RUFFLO INTELLIGENCE CHATBOT */}
        <aside className="copilot flex flex-col   p-0 border-l border-[#3c3836]">
          <RuffloIntelligenceChatbot
            agents={agents}
            tasks={tasks}
            onExecutePrompt={handleExecutePrompt}
            onOpenDashboard={() => { closeAllModals(); setIsMunderdifflinDashboardOpen(true); }}
            onOpenKnowledgeBase={() => { closeAllModals(); setIsDynamicKbOpen(true); }}
            onAssignTask={handleAddTask}
          />
        </aside>
      </main>
    </div>

      {/* BOTTOM STATUS BAR */}
      <footer className="statusbar">
        <div className="status-live">
          <span className="health-pulse" /> RUFFLO CORE ONLINE
        </div>
        <div className="status-stream">
          {logs.slice(0,4).map(l => (
             <span key={l.id}>{agents.find(a => a.id === l.agentId)?.name || 'System'} → {l.message.slice(0, 30)}</span>
          ))}
        </div>
        <div>v4.0.0 · Secure Runtime</div>
      </footer>

      <ModalManager
        state={modalState}
        onClose={closeModal}
        onOpen={openModal}
        closeAll={closeAllModals}
        agents={agents}
        tasks={tasks}
        departments={departments}
        userProfile={userProfile}
        selectedAgent={selectedAgent}
        onSelectAgent={setSelectedAgentId}
        onLogin={setUserProfile}
        onUpdatePreferences={(newPrefs) => setUserProfile((prev) => ({ ...prev, preferences: { ...prev.preferences, ...newPrefs } }))}
        dynamicFeatures={dynamicFeatures}
        featureToEditInIde={featureToEditInIde}
        setFeatureToEditInIde={setFeatureToEditInIde}
        onToggleFeature={(id) => setDynamicFeatures((prev) => prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)))}
        onRemoveFeature={(id) => setDynamicFeatures((prev) => prev.filter((f) => f.id !== id))}
        onAddFeature={(newFeat) => {
          const feat = {
            id: `feat-${Date.now()}`,
            name: newFeat.name || 'Custom Feature',
            description: newFeat.description || '',
            category: newFeat.category || 'utility',
            icon: newFeat.icon || 'Sparkles',
            enabled: true,
            code: newFeat.code || 'return true;',
            addedByAgent: newFeat.addedByAgent || 'User',
            createdAt: Date.now(),
          };
          setDynamicFeatures((prev) => [feat, ...prev]);
        }}
        onSaveFeature={(savedFeat) => {
          setDynamicFeatures((prev) => {
            const exists = prev.some((f) => f.id === savedFeat.id);
            if (exists) {
              return prev.map((f) => (f.id === savedFeat.id ? savedFeat : f));
            }
            return [savedFeat, ...prev];
          });
        }}
        onExecuteCode={handleExecuteCode}
        onExecutePrompt={handleExecutePrompt}
        onAnalyzeWebContent={handleAnalyzeWebContent}
        onMountToIde={handleMountToIde}
        onImportRepoTool={handleImportRepoTool}
        onTriggerManualHeal={handleTriggerManualHeal}
        onAddTask={handleAddTask}
        onAddAgent={handleAddAgent}
        onUpdateAgent={(updatedAgent) => {
          setAgents((prev) => prev.map((a) => (a.id === updatedAgent.id ? updatedAgent : a)));
        }}
        onTaskCreated={(task) => setTasks((prev) => [task, ...prev])}
        onLogCreated={(log) => setLogs((prev) => prev.some(l => l.id === log.id) ? prev : [log, ...prev])}
        onCodeApplied={(mod) => {
          setSystemModulesCount((c) => Math.max(c + 1, 1));
          setAutoApplyToast({
            show: true,
            agentName: mod.source || 'Employee Bot',
            moduleName: mod.name,
          });
          setTimeout(() => setAutoApplyToast(null), 6000);
        }}
        autoApplyToast={autoApplyToast}
        onDismissToast={() => setAutoApplyToast(null)}
        initialDashboardTab={dashboardInitialTab}
      />
    </div>
  );
}
