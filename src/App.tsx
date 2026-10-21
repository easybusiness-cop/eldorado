import React, { lazy, Suspense, useState, useEffect, useRef, useMemo } from 'react';
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
} from './types.ts';
import {
  INITIAL_AGENTS,
  INITIAL_DYNAMIC_FEATURES,
  INITIAL_TRIGGERS,
  INITIAL_FLEET_TASKS,
} from './constants/initialAgents.ts';
import { soundFx, speakText } from './utils/speech.ts';
import { TopNavigation } from './components/TopNavigation.tsx';
import { FleetHealthMonitor, getAgentThroughputTier, formatTokenThroughput } from './components/FleetHealthMonitor.tsx';
import type { ModalManagerState } from './components/ModalManager.tsx';
import type { CascadeRunData } from './components/ExecutiveSummaryModal.tsx';
import { generateExecutiveSummaryMarkdown } from './utils/markdownGenerator.ts';
const ModalManager = lazy(() => import('./components/ModalManager.tsx').then(({ ModalManager }) => ({ default: ModalManager })));
const DepartmentHubView = lazy(() => import('./components/DepartmentHubView.tsx').then(({ DepartmentHubView }) => ({ default: DepartmentHubView })));
const MunderdifflinDashboard = lazy(() => import('./components/MunderdifflinDashboard.tsx').then(({ MunderdifflinDashboard }) => ({ default: MunderdifflinDashboard })));
const RuffloIntelligence = lazy(() => import('./components/RuffloIntelligence.tsx').then(({ RuffloIntelligence }) => ({ default: RuffloIntelligence })));
const CommandCenter = lazy(() => import('./components/CommandCenter.tsx').then(({ CommandCenter }) => ({ default: CommandCenter })));
import { SmartTaskSuggestion } from './utils/smartTaskSuggestions.ts';
import { SmartSuggestionTooltip } from './components/SmartSuggestionTooltip.tsx';
const VirtualCorporationView = lazy(() => import('./components/corporation/VirtualCorporationView.tsx').then(({ VirtualCorporationView }) => ({ default: VirtualCorporationView })));
import { initializeSystemRuntime, sendAndApplySystemCode } from './utils/systemRuntime.ts';
import { Zap } from 'lucide-react';
import {
  initializeAgentQuantumState,
  runQuantumModelForTask,
  searchQuantumMemory,
} from './utils/quantumEngine.ts';

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
  const [tasks, setTasks] = useState<FleetTask[]>(() => INITIAL_FLEET_TASKS);
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
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return localStorage.getItem('rufflo_theme') === 'dark' ? 'dark' : 'light';
  });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('rufflo_theme', theme);
  }, [theme]);

  // Centralized Modal Management
  const [modalState, setModalState] = useState<ModalManagerState>({
    isSearchOpen: false,
    isAuthOpen: false,
    isPreferencesOpen: false,
    isAdminOrchestratorOpen: false,
    isDynamicFeaturesOpen: false,
    isIdeOpen: false,
    isIntelligenceOpen: false,
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
    isTelegramOpen: false,
    isPublicApiOpen: false,
    isSocialPluginOpen: false,
    isDeploymentPipelineOpen: false,
    isMunderdifflinDashboardOpen: false,
    isDynamicKbOpen: false,
    isSupabaseDiagnosticOpen: false,
    isExecutiveSummaryOpen: false,
    isPredictiveLoadBalancerOpen: false,
    isCrashalystOpen: false,
    isApiGatewayMicroservicesOpen: false,
    isComposioHubOpen: false,
    isOpenWebUiOpen: false,

    isCrisisSimulationOpen: false,
  });

  const [executiveSummaryRun, setExecutiveSummaryRun] = useState<CascadeRunData | null>(null);
  const [executiveSummaryMarkdown, setExecutiveSummaryMarkdown] = useState<string>('');

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
      isIntelligenceOpen: false,
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
      isTelegramOpen: false,
      isPublicApiOpen: false,
      isSocialPluginOpen: false,
      isDeploymentPipelineOpen: false,
      isMunderdifflinDashboardOpen: false,
      isDynamicKbOpen: false,
      isSupabaseDiagnosticOpen: false,
      isExecutiveSummaryOpen: false,
      isPredictiveLoadBalancerOpen: false,
      isCrashalystOpen: false,
      isApiGatewayMicroservicesOpen: false,
      isOpenWebUiOpen: false,
      isCrisisSimulationOpen: false,
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

  const [showOtherPanels, setShowOtherPanels] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Initial tab to display when MunderdifflinDashboard is launched
  const [dashboardInitialTab, setDashboardInitialTab] = useState<'roster_and_assign' | 'monitor' | 'outputs' | 'knowledge' | 'pipelines' | 'communication' | 'skills' | 'sops'>('roster_and_assign');

  const [systemModulesCount, setSystemModulesCount] = useState<number>(1);
  const [featureToEditInIde, setFeatureToEditInIde] = useState<DynamicFeature | null>(null);
  const [hoveredCardAgentId, setHoveredCardAgentId] = useState<string | null>(null);
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
            if (data.tasks && data.tasks.length > 0) {
              setTasks(data.tasks);
            } else {
              setTasks(INITIAL_FLEET_TASKS);
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

        const commLog: AgentLog = {
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

    // 2c. If chatting with CEO (Michael Scott), trigger the full Corporate Command Cascade Loop!
    if (selectedAgent.id === 'michael') {
      try {
        const cascadeRes = await fetch('/api/autonomy/cascade/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: prompt }),
        });
        const cascadeData = await cascadeRes.json();
        if (cascadeData.success && cascadeData.run) {
          const run = cascadeData.run;

          // Add CEO Directive & COO Deconstruction Logs
          setLogs((prev) => [
            ...prev,
            {
              id: `ceo-dir-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              level: 'info',
              agentId: 'michael',
              message: `[👑 CEO DIRECTIVE DISPATCHED] "${run.ceoDirective?.speech}"\nMandate to COO Dwight: "${run.ceoDirective?.mandate}"`,
            },
            {
              id: `coo-plan-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              level: 'info',
              agentId: 'dwight',
              message: `[💼 COO DWIGHT SCHRUTE DECONSTRUCTION] "${run.executivePlan?.analysis}"\nMobilized Departments: ${run.executivePlan?.activatedDepartments?.join(', ')}`,
            },
          ]);

          // Add logs for each department mission and simultaneous employees
          for (const [deptKey, mission] of Object.entries(run.departmentMissions as Record<string, any>)) {
            for (const task of mission.assignedTasks) {
              setLogs((prev) => [
                ...prev,
                {
                  id: `tsk-${task.taskId}`,
                  timestamp: new Date().toLocaleTimeString(),
                  level: 'success',
                  agentId: task.assignedAgentId,
                  message: `[🏢 ${deptKey.toUpperCase()} // ${mission.hodName} ➔ ${task.assignedAgentName}] Delivered: "${task.taskTitle}" in ${(task.executionTimeMs / 1000).toFixed(1)}s\n\n${task.output?.slice(0, 300)}...`,
                  codeSnippet: task.codeSnippet,
                },
              ]);

              // If an engineering specialist produced code, auto-apply it to system modules
              if (task.codeSnippet) {
                const modName = `${task.assignedAgentName} Autonomous Code`;
                sendAndApplySystemCode(
                  task.codeSnippet,
                  modName,
                  task.assignedAgentName,
                  'system_runtime',
                  { userProfile }
                ).then((res) => {
                  if (res.success) setSystemModulesCount((c) => Math.max(c + 1, 1));
                });
              }
            }
          }

          // Final CEO Response Log
          const finalReply = run.ceoFinalResponse || 'All departments executed concurrently!';
          const ceoLog: AgentLog = {
            id: `ceo-final-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            level: 'success',
            agentId: 'michael',
            message: finalReply,
          };
          setLogs((prev) => [...prev, ceoLog]);

          // Speak if voice enabled
          if (userProfile.preferences.voiceAutoSpeak) {
            speakText(finalReply, selectedAgent, userProfile.preferences.speechRate, userProfile.preferences.speechPitch);
          }

          // Update CEO state
          setAgents((prev) =>
            prev.map((a) =>
              a.id === 'michael'
                ? {
                    ...a,
                    status: 'idle',
                    tokensProcessed: a.tokensProcessed + 950,
                    speechBubble: {
                      text: `Dispatched & Conquered: ${prompt.slice(0, 35)}...`,
                      expiresAt: Date.now() + 12000,
                    },
                    memory: [prompt.slice(0, 60), ...a.memory.slice(0, 5)],
                  }
                : a
            )
          );

          // Add completed tasks for all departments
          setTasks((prev) => [
            ...prev,
            {
              id: `cascade-${Date.now()}`,
              title: `Corporate Cascade: ${prompt.slice(0, 35)}...`,
              description: `Concurrently executed by ${run.metrics?.totalEmployeesInvolved} employees across ${run.metrics?.totalDepartments} departments`,
              assignedTo: 'michael',
              status: 'completed',
              progress: 100,
              priority: 'high',
              department: 'Executive',
              createdAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
            },
          ]);

          // Automatically generate executive summary report in Markdown format and open modal window
          const summaryMarkdown = generateExecutiveSummaryMarkdown(run);
          setExecutiveSummaryRun(run);
          setExecutiveSummaryMarkdown(summaryMarkdown);
          setModalState((prev) => ({
            ...prev,
            isExecutiveSummaryOpen: true,
          }));

          return;
        }
      } catch (cascadeErr) {
        console.warn("Cascade execution fallback to standard agent chat:", cascadeErr);
      }
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

      // Auto-sync agent response & log to Telegram if agent has Telegram sync enabled
      if (selectedAgent.telegramSyncEnabled) {
        const chatId = selectedAgent.telegramChannelId || '-1001928374650';
        fetch('/api/telegram/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId,
            text: `🤖 [AUTO-SYNC LOG] ${selectedAgent.name}: ${replyText}`,
            senderName: `${selectedAgent.name} (Agent)`,
            agentId: selectedAgent.id,
          }),
        }).catch((tErr) => console.warn('Telegram auto-sync failed:', tErr));
      }

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

      return {
        success: true,
        text: replyText,
        codeSnippet: data.codeSnippet,
      };
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

      return {
        success: false,
        text: `Execution failed: ${err.message || 'Server error'}`,
      };
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
          
          // Update the agent's status to 'working' and currentTask
          setAgents((prev) =>
            prev.map((a) =>
              a.id === assignedTo
                ? { ...a, status: 'working', currentTask: title }
                : a
            )
          );

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

  // Auto-delegate / reassign task to balance workload
  const handleReassignTask = async (taskId: string, newAssignedTo: string) => {
    try {
      // 1. Optimistic local update of tasks
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, assignedTo: newAssignedTo } : t))
      );

      const targetEmp = agents.find((a) => a.id === newAssignedTo);
      const targetName = targetEmp ? targetEmp.name : newAssignedTo;
      const reassignedTask = tasks.find((t) => t.id === taskId);
      const taskTitle = reassignedTask ? reassignedTask.title : taskId;

      // Update target agent status to working if previously idle
      setAgents((prev) =>
        prev.map((a) => {
          if (a.id === newAssignedTo) {
            return { ...a, status: 'working', currentTask: taskTitle };
          }
          return a;
        })
      );

      setLogs((prev) => [
        {
          id: `log-reassign-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          agentId: newAssignedTo,
          message: `[Auto-Delegation] Task "${taskTitle}" reallocated to ${targetName}. Workload balanced across autonomous fleet.`,
        },
        ...prev,
      ]);

      // 2. Persist to backend
      await fetch('/api/tasks/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, newAssignedTo }),
      });
    } catch (e) {
      console.error('Failed to auto-delegate task:', e);
    }
  };

  // Assign recommended next mission directly from Smart Suggestion tooltip
  const handleAssignSmartTask = (agentId: string, suggestion: SmartTaskSuggestion) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId) {
          return {
            ...a,
            status: 'working',
            currentTask: suggestion.title,
            tokensProcessed: (a.tokensProcessed || 0) + 240,
          };
        }
        return a;
      })
    );

    const targetAgent = agents.find((a) => a.id === agentId);
    const agentName = targetAgent ? targetAgent.name : agentId;

    setLogs((prev) => [
      {
        id: `log-smart-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'info',
        agentId,
        message: `[Smart Suggestion] Queued mission "${suggestion.title}" to ${agentName} based on verified skillset in "${suggestion.primarySkill}" (${suggestion.matchScore}% suitability match).`,
      },
      ...prev,
    ]);
    soundFx.playSuccess();
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

  
  const [workspaceTab, setWorkspaceTab] = useState<'command' | 'corporation' | 'fleet' | 'network' | 'engineering' | 'integrations' | 'chaos'>('command');
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
        onOpenTelegram={() => { closeAllModals(); openModal('isTelegramOpen'); }}
        onOpenPredictiveLoadBalancer={() => { closeAllModals(); openModal('isPredictiveLoadBalancerOpen'); }}
        onOpenCrashalyst={() => { closeAllModals(); openModal('isCrashalystOpen'); }}
        onOpenApiGatewayMicroservices={() => { closeAllModals(); openModal('isApiGatewayMicroservicesOpen'); }}
        onOpenComposioHub={() => { closeAllModals(); openModal('isComposioHubOpen'); }}
        onOpenOpenWebUI={() => { closeAllModals(); openModal('isOpenWebUiOpen'); }}

        onOpenCrisisSimulation={() => { closeAllModals(); openModal('isCrisisSimulationOpen'); }}
        onOpenIntelligence={() => { closeAllModals(); openModal('isIntelligenceOpen'); }}
        onOpenPublicApiHub={() => { closeAllModals(); openModal('isPublicApiOpen'); }}
        onOpenMunderdifflinDashboard={() => { closeAllModals(); setDashboardInitialTab('roster_and_assign'); openModal('isMunderdifflinDashboardOpen'); }}
        onOpenAgentCommunication={() => { closeAllModals(); setDashboardInitialTab('communication'); openModal('isMunderdifflinDashboardOpen'); }}
        onOpenAgentSkillMatrix={() => { closeAllModals(); setDashboardInitialTab('skills'); openModal('isMunderdifflinDashboardOpen'); }}
        onOpenAgentSops={() => { closeAllModals(); setDashboardInitialTab('sops'); openModal('isMunderdifflinDashboardOpen'); }}
        onOpenDynamicKnowledgeBase={() => { closeAllModals(); openModal('isDynamicKbOpen'); }}
        onOpenSupabaseDiagnostic={() => { closeAllModals(); openModal('isSupabaseDiagnosticOpen'); }}
        onSelectCorporationTab={() => { closeAllModals(); setActiveDepartment('Overview'); setWorkspaceTab('corporation'); }}
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
        <main className="main-grid rufflo-content animate-in no-copilot">
        {/* LEFT SIDEBAR */}
        <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-show' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
          <div className="sidebar-section">
            <div className="section-label">OPERATIONAL HUBS</div>
            <button className={`nav-item ${activeDepartment === "Overview" && workspaceTab === "command" ? "active" : ""}`} onClick={() => { closeAllModals(); setActiveDepartment('Overview'); setWorkspaceTab('command'); }}>
              <Icon>⚡</Icon>
              <span>Command Center</span>
            </button>
            <button className={`nav-item ${activeDepartment === "Overview" && workspaceTab === "corporation" ? "active" : ""}`} onClick={() => { closeAllModals(); setActiveDepartment('Overview'); setWorkspaceTab('corporation'); }}>
              <Icon>🏢</Icon>
              <span>Virtual Corporation</span>
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
              <span>Skill Matrix & SOPs</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isDynamicKbOpen'); }}>
              <Icon>🧠</Icon>
              <span>Knowledge Base & Radar</span>
            </button>
          </div>

          <div className="sidebar-section">
            <div className="section-label">ENGINEERING SUITE</div>
            <button className={`nav-item ${activeDepartment === "Overview" && workspaceTab === "engineering" ? "active" : ""}`} onClick={() => { closeAllModals(); setActiveDepartment('Overview'); setWorkspaceTab('engineering'); }}>
              <Icon>💻</Icon>
              <span className="text-[#38bdf8] font-semibold">Software Builder Hub</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isIdeOpen'); }}>
              <Icon>&lt;/&gt;</Icon>
              <span>Cloud IDE Workbench</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isReposOpen'); }}>
              <Icon>⌥</Icon>
              <span>GitHub Repositories</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isDeploymentPipelineOpen'); }}>
              <Icon>↗</Icon>
              <span>Deployments & Hotfixes</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isDebuggerOpen'); }}>
              <Icon>_</Icon>
              <span>Terminal & Profiler</span>
            </button>
          </div>

          <div className="sidebar-section">
            <div className="section-label">SYSTEM & INTEGRATIONS</div>
            <button className={`nav-item ${activeDepartment === "Overview" && workspaceTab === "integrations" ? "active" : ""}`} onClick={() => { closeAllModals(); setActiveDepartment('Overview'); setWorkspaceTab('integrations'); }}>
              <Icon>⚡</Icon>
              <span className="text-[#34d399] font-semibold">Integration Mesh</span>
            </button>
            <button className={`nav-item ${activeDepartment === "Overview" && workspaceTab === "chaos" ? "active" : ""}`} onClick={() => { closeAllModals(); setActiveDepartment('Overview'); setWorkspaceTab('chaos'); }}>
              <Icon>🔥</Icon>
              <span className="text-[#fb4934] font-semibold">Chaos Crisis Lab</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isApiGatewayMicroservicesOpen'); }}>
              <Icon>🌐</Icon>
              <span>API Gateway Mesh</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isComposioHubOpen'); }}>
              <Icon>⚡</Icon>
              <span>Composio 3P Tools</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isSupabaseDiagnosticOpen'); }}>
              <Icon>🗄</Icon>
              <span>Supabase Postgres</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isTelegramOpen'); }}>
              <Icon>✈</Icon>
              <span>Telegram Intelligence</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isPredictiveLoadBalancerOpen'); }}>
              <Icon>⚖</Icon>
              <span>Load Balancer</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isAcademyOpen'); }}>
              <Icon>🎓</Icon>
              <span>Agent Academy</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isMasterEvolutionOpen'); }}>
              <Icon>🚀</Icon>
              <span>Meta-Evolution</span>
            </button>
          </div>

          <div className="sidebar-section relative">
            <div className="section-label">DEPARTMENTS</div>
            {departmentsList.map(([name, symbol, color, deptKey]) => {
              const isActive = activeDepartment === name;
              return (
                <button
                  key={name}
                  id={`sidebar-dept-${deptKey}`}
                  className={`nav-item department relative transition-colors duration-200 ${isActive ? "active font-semibold text-white" : "hover:text-[#f5f5f4]"}`}
                  onClick={() => { closeAllModals(); setActiveDepartment(name); }}
                  style={{
                    color: isActive ? color : undefined,
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-department-bg"
                      className="absolute inset-0 rounded-lg pointer-events-none"
                      style={{
                        background: `${color}14`,
                        borderColor: `${color}35`,
                        borderWidth: 1,
                        borderStyle: 'solid',
                      }}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}

                  <span className="department-icon relative z-10 transition-transform duration-200" style={{ color, borderColor: `${color}55`, background: `${color}12` }}>{symbol}</span>
                  <span className="relative z-10">{name}</span>
                  <span className="department-count relative z-10" style={{ color: isActive ? color : undefined }}>{agents.filter((a) => a.department === deptKey).length}</span>

                  {isActive && (
                    <motion.div
                      layoutId="active-department-underline"
                      className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full pointer-events-none"
                      style={{
                        backgroundColor: color,
                        boxShadow: `0 0 10px ${color}aa`,
                      }}
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="sidebar-section bottom-section">
            <div className="section-label">SETTINGS & AUDIT</div>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isAdminOrchestratorOpen'); }}>
              <Icon>≡</Icon>
              <span>Governance & Logs</span>
            </button>
            <button className="nav-item" onClick={() => { closeAllModals(); openModal('isPreferencesOpen'); }}>
              <Icon>⚙</Icon>
              <span>System Preferences</span>
            </button>
          </div>
        </aside>


        {/* CENTER */}
        <section className="workspace" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {isMobileMenuOpen && (
            <div 
              className="fixed inset-0 top-[56px] bg-black/60 backdrop-blur-xs z-[999] md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
          <div className="workspace-content flex flex-col">
                  <div className="workspace-header">
                    <div className="flex items-start gap-3">
                      <button 
                        className="md:hidden p-2 mt-1 bg-[#121216] rounded-lg border border-white/10 text-[#fabd2f] hover:bg-[#181822] transition-colors flex items-center justify-center cursor-pointer"
                        style={{ minWidth: '40px', minHeight: '40px' }}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle Navigation Sidebar"
                      >
                        {isMobileMenuOpen ? "✕" : "☰"}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                          <span className="font-semibold text-zinc-300">RUFFLO OS</span>
                          <span className="text-zinc-600">/</span>
                          <span>
                            {activeDepartment === "Munderdifflin"
                              ? "SCRANTON BRANCH"
                              : activeDepartment === "Overview"
                              ? (workspaceTab === 'corporation' ? "VIRTUAL CORPORATION" : workspaceTab === 'engineering' ? "SOFTWARE BUILDER" : workspaceTab === 'integrations' ? "INTEGRATION MESH" : workspaceTab === 'chaos' ? "CHAOS SRE LAB" : workspaceTab.toUpperCase())
                              : activeDepartment.toUpperCase()}
                          </span>
                          <span className="text-zinc-600">·</span>
                          <span className="text-zinc-400 font-normal">{agents.length} Agents Online</span>
                        </div>
                        <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
                          {activeDepartment === "Overview" ? (
                            workspaceTab === 'command' ? "Rufflo Command Intelligence" :
                            workspaceTab === 'corporation' ? "Virtual AI Corporation & Optimizer" :
                            workspaceTab === 'fleet' ? "Agent Fleet Telemetry & Matrix" :
                            workspaceTab === 'engineering' ? "Software Builder & Cloud IDE" :
                            workspaceTab === 'integrations' ? "Enterprise Integration Mesh" :
                            workspaceTab === 'chaos' ? "Chaos Crisis & Outage Lab" :
                            "Company Network Topology"
                          ) : activeDepartment === "Munderdifflin" ? (
                            "Munder Diffl.in Scranton Branch Operations"
                          ) : (
                            `${activeDepartment} Department Hub`
                          )}
                        </h1>
                        <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed">
                          {activeDepartment === "Munderdifflin"
                            ? "Autonomous branch tasks, sales dispatch, and agent output memos."
                            : workspaceTab === 'corporation'
                            ? "Executive strategic reasoning, persistent AI workforce, autonomous optimizer engine, decisions, and continuous discovery."
                            : workspaceTab === 'engineering'
                            ? "Autonomous 10-Agent software engineering engine generating production code, smoke-tests, and live deployments."
                            : workspaceTab === 'chaos'
                            ? "Real-world operational crisis injection to stress-test circuit breakers and Toby's Self-Healing daemon."
                            : workspaceTab === 'integrations'
                            ? "Enterprise connectors for Composio SaaS, Supabase PostgreSQL, Telegram Bot API, ArXiv Open Science, and API microservices mesh."
                            : "Autonomous AI agents, workflows, knowledge base, microservices, and software operations."}
                        </p>
                      </div>
                    </div>

                    {/* Header Action Toolbar */}
                    <div className="workspace-actions flex-wrap gap-2 mt-3 sm:mt-0">
                      {activeDepartment === 'Overview' && workspaceTab === 'command' && (
                        <button
                          type="button"
                          className="h-8 px-2.5 rounded-md text-xs font-medium border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
                          onClick={() => setShowOtherPanels(!showOtherPanels)}
                        >
                          {showOtherPanels ? 'Hide Console Panels' : 'Console Panels'}
                        </button>
                      )}
                      
                      <button
                        type="button"
                        className="h-8 px-2.5 rounded-md text-xs font-medium border border-zinc-700/80 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        onClick={() => setActiveDepartment(activeDepartment === 'Munderdifflin' ? 'Overview' : 'Munderdifflin')}
                      >
                        {activeDepartment === 'Munderdifflin' ? '← Overview Grid' : 'Scranton Branch'}
                      </button>
                      <button
                        type="button"
                        className="h-8 px-2.5 rounded-md text-xs font-medium border border-zinc-700/80 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        onClick={() => { closeAllModals(); openModal('isDynamicKbOpen'); }}
                      >
                        Knowledge Radar
                      </button>
                      <button
                        type="button"
                        className="h-8 px-2.5 rounded-md text-xs font-medium border border-zinc-700/80 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        onClick={() => { closeAllModals(); openModal('isCrisisSimulationOpen'); }}
                        title="Open Chaos Outage Injector"
                      >
                        Chaos Lab
                      </button>
                      <button 
                        type="button"
                        className="h-8 px-3 rounded-md text-xs font-medium border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors cursor-pointer"
                        onClick={() => { closeAllModals(); openModal('isAdminOrchestratorOpen'); }}
                      >
                        + New Mission
                      </button>
                      <button 
                        type="button"
                        className="h-8 px-3.5 rounded-md text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        onClick={handleTriggerStandup}
                      >
                        <span>▶</span>
                        <span>Run Operation</span>
                      </button>
                    </div>
                  </div>

                  {/* Refined Segmented Control for Core Workspaces */}
                  {activeDepartment === 'Overview' && (
                    <div className="mb-4 flex items-center gap-1 bg-zinc-900/70 p-1 rounded-lg border border-zinc-800/80 overflow-x-auto no-scrollbar shadow-xs">
                      {[
                        { id: 'command', label: 'Command Center', icon: '⚡' },
                        { id: 'corporation', label: 'Virtual Corporation', icon: '🏢' },
                        { id: 'fleet', label: 'Agent Fleet', icon: '👥' },
                        { id: 'engineering', label: 'Software Builder', icon: '💻' },
                        { id: 'integrations', label: 'Integration Mesh', icon: '⚡' },
                        { id: 'chaos', label: 'Chaos & SRE', icon: '🔥' },
                        { id: 'network', label: 'Company Network', icon: '🌐' },
                      ].map((tab) => {
                        const isActive = workspaceTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            className={`h-7 px-3 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                              isActive
                                ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700 font-semibold'
                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                            }`}
                            onClick={() => setWorkspaceTab(tab.id as any)}
                          >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}


                  {activeDepartment === "Munderdifflin" ? (
                    <div className="flex-1 min-h-0 mt-4 rounded-xl border border-white/10 shadow-lg overflow-hidden">
                      <Suspense fallback={<div className="p-4 text-sm text-zinc-400">Loading dashboard...</div>}>
                        <MunderdifflinDashboard
                          agents={agents}
                          tasks={tasks}
                          onAddTask={handleAddTask}
                          onAddAgent={handleAddAgent}
                        />
                      </Suspense>
                    </div>
                  ) : activeDepartment !== "Overview" ? (
                    <div style={{ marginBottom: 24 }}>
                      <Suspense fallback={<div className="p-4 text-sm text-zinc-400">Loading department...</div>}>
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
                      </Suspense>
                    </div>
                  ) : workspaceTab === 'command' ? (
                    <div className="flex-1 min-h-0 flex flex-col gap-6">
                      <Suspense fallback={<div className="p-4 text-sm text-zinc-400">Loading intelligence...</div>}>
                        <RuffloIntelligence
                          userProfile={userProfile}
                          agents={agents}
                          tasks={tasks}
                          onAddTask={handleAddTask}
                          onUpdateTask={(task) => {
                            setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
                          }}
                          onAddLog={(log) => {
                            const newLog = {
                              id: log.id || `log-intel-${Date.now()}`,
                              timestamp: log.timestamp || new Date().toLocaleTimeString(),
                              level: log.level || 'info',
                              agentId: log.agentId || 'scott',
                              message: log.message || '',
                            };
                            setLogs((prev) => prev.some(l => l.id === newLog.id) ? prev : [newLog, ...prev]);
                          }}
                        />
                      </Suspense>
                      {showOtherPanels && (
                        <div className="mt-6 border-t border-white/10 pt-6 animate-in">
                          <h3 className="text-sm font-semibold text-[#fabd2f] mb-4 uppercase tracking-wider flex items-center gap-2">
                            <span>⚙️</span> Advanced CommandCenter Console
                          </h3>
                          <Suspense fallback={<div className="p-4 text-sm text-zinc-400">Loading command center...</div>}>
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
                              onSetWorkspaceTab={setWorkspaceTab}
                              departments={departments}
                              onOpenCrisisSimulation={() => { closeAllModals(); openModal('isCrisisSimulationOpen'); }}
                              onOpenComposioHub={() => { closeAllModals(); openModal('isComposioHubOpen'); }}
                            />
                          </Suspense>

                        </div>
                      )}
                    </div>
                  ) : workspaceTab === 'corporation' ? (
                    <div className="flex-1 min-h-[820px] flex flex-col rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[#0d0f17]">
                      <Suspense fallback={<div className="p-4 text-sm text-zinc-400">Loading corporation view...</div>}>
                        <VirtualCorporationView />
                      </Suspense>
                    </div>
                  ) : workspaceTab === 'engineering' ? (
                    <div className="flex-1 flex flex-col gap-5">
                      {/* Top Engineering Suite Banner */}
                      <div className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-[#10172b] to-cyan-950/30 p-5 shadow-xl shadow-blue-950/20">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                💻
                              </span>
                              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                                Autonomous Software Construction Engine
                              </h2>
                            </div>
                            <p className="text-xs text-zinc-300">
                              Autonomous 10-Agent Engineering Department generating production TypeScript, React components, and microservices with smoke-test execution.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-zinc-950 font-bold rounded-lg text-xs shadow-lg shadow-blue-500/30 hover:brightness-110 flex items-center gap-1.5 cursor-pointer"
                              onClick={() => { closeAllModals(); openModal('isIdeOpen'); }}
                            >
                              <span>&lt;/&gt;</span>
                              <span>Launch Cloud IDE</span>
                            </button>
                            <button
                              className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg text-xs border border-white/10 flex items-center gap-1.5 cursor-pointer"
                              onClick={() => { closeAllModals(); openModal('isReposOpen'); }}
                            >
                              <span>⌥</span>
                              <span>GitHub</span>
                            </button>
                            <button
                              className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg text-xs border border-white/10 flex items-center gap-1.5 cursor-pointer"
                              onClick={() => { closeAllModals(); openModal('isDeploymentPipelineOpen'); }}
                            >
                              <span>↗</span>
                              <span>Deployments</span>
                            </button>
                            <button
                              className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg text-xs border border-white/10 flex items-center gap-1.5 cursor-pointer"
                              onClick={() => { closeAllModals(); openModal('isDebuggerOpen'); }}
                            >
                              <span>_</span>
                              <span>Terminal</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Code Construction Workbench */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-[#121624] p-5 flex flex-col justify-between shadow-lg">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                                🛠 Rapid Autonomous Code Builder
                              </span>
                              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                                Sandboxed V8 Ready
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 mb-4">
                              Specify a target software module or microservice to generate, test, and inject into the running system automatically.
                            </p>
                            <div className="flex items-center gap-2 mb-3">
                              <input
                                type="text"
                                className="flex-1 px-3 py-2 bg-black/50 border border-white/15 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                                placeholder="e.g. Build an encrypted JWT session validator middleware with redis caching"
                                defaultValue="Build a rate-limited telemetry ingestion middleware with circuit breaker fallback"
                                id="software-builder-objective-input"
                              />
                              <button
                                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold rounded-lg text-xs shadow-md shadow-cyan-500/30 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                onClick={() => {
                                  const input = document.getElementById('software-builder-objective-input') as HTMLInputElement;
                                  handleExecuteCode(input?.value || 'Build telemetry middleware');
                                }}
                              >
                                <span>⚡ Build & Smoke Test</span>
                              </button>
                            </div>
                          </div>

                          <div className="rounded-lg bg-black/60 border border-white/10 p-3 font-mono text-[11px] text-zinc-300 space-y-1 mt-3">
                            <div className="text-zinc-500">// Recent SoftwareBuilder Execution Stream</div>
                            <div className="text-emerald-400">✓ AST Parse: 0 syntax errors detected</div>
                            <div className="text-cyan-300">✓ Sandboxed Compilation: TypeScript 5.8 emit completed in 240ms</div>
                            <div className="text-purple-300">✓ Unit Tests: 4/4 assertions passed with 100% branch coverage</div>
                          </div>
                        </div>

                        {/* Quick Stats / Environment Matrix */}
                        <div className="rounded-xl border border-white/10 bg-[#121624] p-5 space-y-4 shadow-lg">
                          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                            <span>◈</span> System Runtime Status
                          </h3>
                          <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between items-center py-1 border-b border-white/5">
                              <span className="text-zinc-400">Node Environment</span>
                              <span className="font-mono text-emerald-400">v20.x (Sandboxed)</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-white/5">
                              <span className="text-zinc-400">Active Repositories</span>
                              <span className="font-mono text-cyan-300">3 Connected</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-white/5">
                              <span className="text-zinc-400">Deployment Pipeline</span>
                              <span className="font-mono text-emerald-400">Healthy (0 Hotfixes)</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-white/5">
                              <span className="text-zinc-400">Auto-Apply to System</span>
                              <span className="font-mono text-amber-300">{userProfile.preferences.autoApplyCodeToSystem ? 'ENABLED' : 'DISABLED'}</span>
                            </div>
                          </div>
                          <button
                            className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            onClick={() => { closeAllModals(); openModal('isDebuggerOpen'); }}
                          >
                            Open SRE Diagnostics & Profiler →
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : workspaceTab === 'integrations' ? (
                    <div className="flex-1 flex flex-col gap-5">
                      {/* Top Integrations Banner */}
                      <div className="rounded-xl border border-teal-500/30 bg-gradient-to-r from-teal-950/40 via-[#10172b] to-emerald-950/30 p-5 shadow-xl shadow-teal-950/20">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
                                ⚡
                              </span>
                              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                                Enterprise Integrations & SaaS Mesh
                              </h2>
                            </div>
                            <p className="text-xs text-zinc-300">
                              Direct connectors to Composio, Supabase PostgreSQL, Telegram Intelligence, Chromium Browser, and external API gateways.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="px-3 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-zinc-950 font-bold rounded-lg text-xs shadow-lg shadow-teal-500/30 hover:brightness-110 flex items-center gap-1.5 cursor-pointer"
                              onClick={() => { closeAllModals(); openModal('isComposioHubOpen'); }}
                            >
                              <span>⚡</span>
                              <span>Composio Hub</span>
                            </button>
                            <button
                              className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg text-xs border border-white/10 flex items-center gap-1.5 cursor-pointer"
                              onClick={() => { closeAllModals(); openModal('isSupabaseDiagnosticOpen'); }}
                            >
                              <span>🗄</span>
                              <span>Supabase</span>
                            </button>
                            <button
                              className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg text-xs border border-white/10 flex items-center gap-1.5 cursor-pointer"
                              onClick={() => { closeAllModals(); openModal('isWebOpen'); }}
                            >
                              <span>🌐</span>
                              <span>Browser & Web Radar</span>
                            </button>
                            <button
                              className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg text-xs border border-white/10 flex items-center gap-1.5 cursor-pointer"
                              onClick={() => { closeAllModals(); openModal('isTelegramOpen'); }}
                            >
                              <span>✈</span>
                              <span>Telegram</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Integrations Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-xl border border-white/10 bg-[#121624] p-4 space-y-3 shadow">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span>⚡</span> Composio 3P SaaS Hub
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">CONNECTED</span>
                          </div>
                          <p className="text-xs text-zinc-400">Slack, GitHub, Jira, Gmail, Stripe automated connectors.</p>
                          <button
                            className="w-full py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-cyan-300 border border-white/10 transition-colors cursor-pointer"
                            onClick={() => { closeAllModals(); openModal('isComposioHubOpen'); }}
                          >
                            Open Composio Tools & Actions →
                          </button>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-[#121624] p-4 space-y-3 shadow">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span>🌐</span> API Gateway & Mesh
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">HEALTHY</span>
                          </div>
                          <p className="text-xs text-zinc-400">Multi-service routing with zero-trust token authentication.</p>
                          <button
                            className="w-full py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-cyan-300 border border-white/10 transition-colors cursor-pointer"
                            onClick={() => { closeAllModals(); openModal('isApiGatewayMicroservicesOpen'); }}
                          >
                            View Microservices Mesh →
                          </button>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-[#121624] p-4 space-y-3 shadow">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span>🗄</span> Supabase PostgreSQL
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">SYNCED</span>
                          </div>
                          <p className="text-xs text-zinc-400">Relational persistence for fleet tasks and audit ledgers.</p>
                          <button
                            className="w-full py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-cyan-300 border border-white/10 transition-colors cursor-pointer"
                            onClick={() => { closeAllModals(); openModal('isSupabaseDiagnosticOpen'); }}
                          >
                            Test Database Connection →
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : workspaceTab === 'chaos' ? (
                    <div className="flex-1 flex flex-col gap-5">
                      {/* Top Chaos Banner */}
                      <div className="rounded-xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-[#10172b] to-red-950/30 p-5 shadow-xl shadow-rose-950/20">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                🔥
                              </span>
                              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                                Chaos Crisis & Outage Injection Workbench
                              </h2>
                            </div>
                            <p className="text-xs text-zinc-300">
                              Inject real-world operational failure scenarios to stress-test agent recovery, circuit breakers, and Toby's Self-Healing daemon.
                            </p>
                          </div>
                          <button
                            className="px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold rounded-lg text-xs shadow-lg shadow-rose-500/30 hover:brightness-110 flex items-center gap-1.5 cursor-pointer"
                            onClick={() => { closeAllModals(); openModal('isCrisisSimulationOpen'); }}
                          >
                            <span>🔥</span>
                            <span>Open Full Chaos Simulator</span>
                          </button>
                        </div>
                      </div>

                      {/* Outage Scenarios Quick Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="rounded-xl border border-white/10 bg-[#121624] p-4 space-y-2.5 shadow">
                          <span className="text-xs font-bold text-rose-300 block">⚡ Gateway 504 Timeout</span>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">Simulates 100% upstream timeout on third-party tool APIs to test circuit breaker tripping.</p>
                          <button
                            className="w-full py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded text-xs font-bold transition-colors cursor-pointer"
                            onClick={() => { closeAllModals(); openModal('isCrisisSimulationOpen'); }}
                          >
                            Inject Scenario →
                          </button>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-[#121624] p-4 space-y-2.5 shadow">
                          <span className="text-xs font-bold text-amber-300 block">🗄 DB Split-Brain Desync</span>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">Forces replica discrepancy to evaluate distributed consensus and rollback rollback mechanics.</p>
                          <button
                            className="w-full py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded text-xs font-bold transition-colors cursor-pointer"
                            onClick={() => { closeAllModals(); openModal('isCrisisSimulationOpen'); }}
                          >
                            Inject Scenario →
                          </button>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-[#121624] p-4 space-y-2.5 shadow">
                          <span className="text-xs font-bold text-cyan-300 block">🔒 Auth Token Revocation</span>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">Simulates credential expiry to verify zero-trust re-authentication handshakes.</p>
                          <button
                            className="w-full py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded text-xs font-bold transition-colors cursor-pointer"
                            onClick={() => { closeAllModals(); openModal('isCrisisSimulationOpen'); }}
                          >
                            Inject Scenario →
                          </button>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-[#121624] p-4 space-y-2.5 shadow">
                          <span className="text-xs font-bold text-purple-300 block">💾 Sandbox Memory OOM</span>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">Simulates 512MB RAM exhaustion to verify dynamic container container resizing.</p>
                          <button
                            className="w-full py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 rounded text-xs font-bold transition-colors cursor-pointer"
                            onClick={() => { closeAllModals(); openModal('isCrisisSimulationOpen'); }}
                          >
                            Inject Scenario →
                          </button>
                        </div>
                      </div>
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

                          // Subtle Heartbeat glowing pulse dynamics calculated from token processing volume
                          const tokens = agent.tokensProcessed || 0;
                          const tokenLoadFactor = Math.min(1, Math.max(0, tokens / 4500));

                          // Pulse speed cadence: resting rate (~2.4s) down to ultra peak throughput (~0.75s)
                          const heartbeatSpeed = isWorking
                            ? (tokens > 4000 ? '0.75s' : tokens > 1500 ? '1.05s' : tokens > 500 ? '1.45s' : '1.85s')
                            : (tokens > 4000 ? '1.3s' : tokens > 1500 ? '1.7s' : tokens > 500 ? '2.1s' : '2.5s');

                          const heartbeatScale1 = (0.025 + tokenLoadFactor * 0.035).toFixed(3);
                          const heartbeatScale2 = (0.045 + tokenLoadFactor * 0.055).toFixed(3);

                          const blur1 = `${Math.round(5 + tokenLoadFactor * 7)}px`;
                          const blur2 = `${Math.round(8 + tokenLoadFactor * 12)}px`;
                          const blur3 = `${Math.round(10 + tokenLoadFactor * 16)}px`;
                          const blur4 = `${Math.round(16 + tokenLoadFactor * 22)}px`;
                          const spread1 = `${Math.round(1 + tokenLoadFactor * 2)}px`;
                          const spread2 = `${Math.round(2 + tokenLoadFactor * 3)}px`;
                          const spread3 = `${Math.round(2 + tokenLoadFactor * 4)}px`;
                          const spread4 = `${Math.round(3 + tokenLoadFactor * 5)}px`;

                          const pulseHex = isWorking ? tier.color : (tokens > 1000 ? tier.color : agentColor);
                          const toRgba = (hex: string, alpha: number) => {
                            const cleanHex = hex.replace('#', '');
                            if (cleanHex.length === 6) {
                              const r = parseInt(cleanHex.substring(0, 2), 16);
                              const g = parseInt(cleanHex.substring(2, 4), 16);
                              const b = parseInt(cleanHex.substring(4, 6), 16);
                              return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
                            }
                            return tier.glowColor || 'rgba(52, 211, 153, 0.4)';
                          };

                          const heartbeatGlow1 = toRgba(pulseHex, 0.2 + tokenLoadFactor * 0.35);
                          const heartbeatGlow2 = toRgba(pulseHex, 0.35 + tokenLoadFactor * 0.45);
                          const heartbeatGlowPeak = toRgba(pulseHex, 0.55 + tokenLoadFactor * 0.4);
                          const heartbeatGlowOuter = toRgba(pulseHex, 0.25 + tokenLoadFactor * 0.35);
                          const ringColor = toRgba(pulseHex, 0.3 + tokenLoadFactor * 0.5);

                          return (
                            <button
                              key={agent.id}
                              id={`agent-card-main-${agent.id}`}
                              className={`agent-card ${selectedAgent?.id === agent.id ? "selected" : ""} ${isWorking ? "processing-pulse" : ""}`}
                              style={{
                                ['--pulse-duration' as any]: tier.pulseSpeed,
                                ['--pulse-border-color' as any]: isWorking ? tier.color : undefined,
                                ['--pulse-border-glow' as any]: tier.color,
                                ['--pulse-glow-start' as any]: tier.glowColor,
                                ['--pulse-glow-mid' as any]: tier.glowColor,
                                ['--pulse-glow-end' as any]: 'transparent',
                              }}
                              onMouseEnter={() => setHoveredCardAgentId(agent.id)}
                              onMouseLeave={() => setHoveredCardAgentId(null)}
                              onClick={() => { closeAllModals(); setSelectedAgentId(agent.id); openModal('isAgentDetailOpen'); }}
                            >
                              {/* Smart Suggestion Hover Tooltip */}
                              <SmartSuggestionTooltip
                                agent={agent}
                                isVisible={hoveredCardAgentId === agent.id}
                                position="top"
                                onAssignTask={handleAssignSmartTask}
                              />

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
                                <div
                                  className="agent-avatar agent-avatar-heartbeat"
                                  style={{
                                    background: `linear-gradient(135deg, ${agentColor}, #151722)`,
                                    ['--heartbeat-speed' as any]: heartbeatSpeed,
                                    ['--heartbeat-scale-1' as any]: heartbeatScale1,
                                    ['--heartbeat-scale-2' as any]: heartbeatScale2,
                                    ['--heartbeat-blur-1' as any]: blur1,
                                    ['--heartbeat-blur-2' as any]: blur2,
                                    ['--heartbeat-blur-3' as any]: blur3,
                                    ['--heartbeat-blur-4' as any]: blur4,
                                    ['--heartbeat-spread-1' as any]: spread1,
                                    ['--heartbeat-spread-2' as any]: spread2,
                                    ['--heartbeat-spread-3' as any]: spread3,
                                    ['--heartbeat-spread-4' as any]: spread4,
                                    ['--heartbeat-glow-1' as any]: heartbeatGlow1,
                                    ['--heartbeat-glow-2' as any]: heartbeatGlow2,
                                    ['--heartbeat-glow-peak' as any]: heartbeatGlowPeak,
                                    ['--heartbeat-glow-outer' as any]: heartbeatGlowOuter,
                                    ['--heartbeat-ring-color' as any]: ringColor,
                                    ['--ring-initial-opacity' as any]: (0.2 + tokenLoadFactor * 0.4).toFixed(2),
                                    ['--ring-peak-opacity' as any]: (0.45 + tokenLoadFactor * 0.45).toFixed(2),
                                    ['--ring-scale' as any]: (tokenLoadFactor * 0.12).toFixed(2),
                                  }}
                                  title={`${agent.name} • Token Processing Load: ${formattedTokens} tokens (${tier.label})`}
                                >
                                  {agent.avatar && agent.avatar.startsWith('http') ? (
                                    <img
                                      src={agent.avatar}
                                      alt={agent.name}
                                      className="w-full h-full object-cover rounded-[10px]"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    agent.avatar || agent.name.charAt(0)
                                  )}
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
                                  <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>|ψ⟩</span> {agent.quantumState?.phase === 'superposition' ? 'Evaluating 4 Paths...' : 'Quantum Model'}
                                  </span>
                                  <span style={{ color: '#34d399', fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', background: 'rgba(52, 211, 153, 0.15)', padding: '1px 5px', borderRadius: '4px' }}>
                                    Diff {agent.quantumState?.superpositionCandidates?.find(c => c.complexity === 'Minimal / Easiest')?.difficultyScore || 2}/10
                                  </span>
                                </div>
                                <div style={{ color: '#cbd5e1', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  <span style={{ color: '#86efac', fontWeight: 600 }}>Easiest:</span> {agent.quantumState?.winningStrategyName || 'Direct Minimalist Patch'}
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
                          time={typeof log.timestamp === 'number' ? new Date(log.timestamp).toLocaleTimeString() : String(log.timestamp)}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
        </section>
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

      <Suspense fallback={null}>
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
        onReassignTask={handleReassignTask}
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
        executiveSummaryRun={executiveSummaryRun}
        executiveSummaryMarkdown={executiveSummaryMarkdown}
      />
      </Suspense>
    </div>
  );
}
