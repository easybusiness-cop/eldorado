import React, { useEffect, useRef, useState } from 'react';
import { UserProfile } from '../types';
import { soundFx } from '../utils/speech';
import {
  Moon,
  Sun,
  Maximize,
  Minimize,
  User,
  Code,
  Sparkles,
  Phone,
  Globe,
  FolderGit2,
  Cpu,
  Zap,
  Search,
  BarChart3,
  Database,
  MoreHorizontal,
  Shield,
  Layers,
  Sliders,
  Brain,
  Rocket,
  Activity,
  ClipboardList,
  Workflow,
  Send,
  Flame,
  Bot,
  Network,
} from 'lucide-react';

interface TopNavigationProps {
  userProfile: UserProfile;
  onOpenSearch?: () => void;
  onOpenAuth: () => void;
  onOpenPreferences: () => void;
  onOpenAdminOrchestrator?: () => void;
  onOpenIde: () => void;
  onOpenDynamicFeatures: () => void;
  onOpenCall: () => void;
  onOpenWeb: () => void;
  onOpenRepos: () => void;
  onOpenDebugger: () => void;
  onOpenSystemModules: () => void;
  onOpenDb?: () => void;
  onOpenAnalytics?: () => void;
  onOpenAcademy?: () => void;
  onOpenMasterEvolution?: () => void;
  onOpenWorkspace?: () => void;
  onOpenPublicApiHub?: () => void;
  onOpenMunderdifflinDashboard?: () => void;
  onOpenAgentCommunication?: () => void;
  onOpenAgentSkillMatrix?: () => void;
  onOpenAgentSops?: () => void;
  onOpenDynamicKnowledgeBase?: () => void;
  onOpenSupabaseDiagnostic?: () => void;
  onOpenTelegram?: () => void;
  onOpenCrashalyst?: () => void;
  onOpenPredictiveLoadBalancer?: () => void;
  onOpenApiGatewayMicroservices?: () => void;
  onOpenComposioHub?: () => void;
  onOpenOpenWebUI?: () => void;
  onOpenCrisisSimulation?: () => void;
  onSelectCorporationTab?: () => void;
  dynamicFeatureCount: number;
  systemModulesCount: number;
  autoMode: boolean;
  onToggleAutoMode: () => void;
  theme: string;
  onToggleTheme: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

type NavCategory = {
  title: string;
  color: string;
  items: Array<{
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    onClick?: () => void;
    badge?: string;
  }>;
};

export const TopNavigation: React.FC<TopNavigationProps> = (props) => {
  const {
    userProfile,
    onOpenSearch,
    onOpenAuth,
    onOpenPreferences,
    onOpenAdminOrchestrator,
    onOpenIde,
    onOpenDynamicFeatures,
    onOpenCall,
    onOpenWeb,
    onOpenRepos,
    onOpenDebugger,
    onOpenSystemModules,
    onOpenDb,
    onOpenAnalytics,
    onOpenAcademy,
    onOpenMasterEvolution,
    onOpenWorkspace,
    onOpenPublicApiHub,
    onOpenMunderdifflinDashboard,
    onOpenAgentCommunication,
    onOpenAgentSkillMatrix,
    onOpenAgentSops,
    onOpenDynamicKnowledgeBase,
    onOpenSupabaseDiagnostic,
    onOpenTelegram,
    onOpenCrashalyst,
    onOpenPredictiveLoadBalancer,
    onOpenApiGatewayMicroservices,
    onOpenComposioHub,
    onOpenOpenWebUI,
    onOpenCrisisSimulation,
    onSelectCorporationTab,
    dynamicFeatureCount,
    systemModulesCount,
    autoMode,
    onToggleAutoMode,
    theme,
    onToggleTheme,
    isFullscreen,
    onToggleFullscreen,
  } = props;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const click = (fn?: () => void) => {
    soundFx.playClick?.();
    fn?.();
    setMenuOpen(false);
  };

  // Primary Highlight Buttons for Quick Access
  const quickRails = [
    {
      id: 'corporation',
      label: 'Virtual Corp',
      icon: <Layers className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />,
      onClick: onSelectCorporationTab,
    },
    {
      id: 'ide',
      label: 'Cloud IDE',
      icon: <Code className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />,
      onClick: onOpenIde,
    },
    {
      id: 'composio',
      label: 'Composio 3P',
      icon: <Zap className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />,
      onClick: onOpenComposioHub,
    },
    {
      id: 'chaos-lab',
      label: 'Chaos Lab',
      icon: <Flame className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />,
      onClick: onOpenCrisisSimulation,
    },
  ];

  // Comprehensive Catalog of All Features categorized for the Mega Menu
  const featureCategories: NavCategory[] = [
    {
      title: 'CORE INTELLIGENCE & ORG',
      color: 'text-emerald-400 border-emerald-500/30',
      items: [
        {
          id: 'corp',
          label: 'Virtual AI Corporation',
          description: 'Autonomous Hierarchy, Persistent Employees, Strategy',
          icon: <Layers className="w-4 h-4 text-emerald-400" />,
          onClick: onSelectCorporationTab,
          badge: 'CORE',
        },
        {
          id: 'radar',
          label: 'Knowledge Radar & Memory',
          description: 'Layered Company Memory & Brain Vector Sync',
          icon: <Brain className="w-4 h-4 text-purple-400" />,
          onClick: onOpenDynamicKnowledgeBase,
        },
        {
          id: 'munderdifflin',
          label: 'Munder Diffl.in Scranton Branch',
          description: 'Branch Operations, Sales Calls, Paper Orders',
          icon: <ClipboardList className="w-4 h-4 text-amber-400" />,
          onClick: onOpenMunderdifflinDashboard,
        },
        {
          id: 'comms',
          label: 'Inter-Agent Voice & Comms',
          description: 'Live synthesized voice frequency and speech streams',
          icon: <Phone className="w-4 h-4 text-cyan-400" />,
          onClick: onOpenAgentCommunication,
        },
        {
          id: 'skills',
          label: 'Agent Skill Matrix & SOPs',
          description: 'Operational protocols, access boundaries & badges',
          icon: <Shield className="w-4 h-4 text-sky-400" />,
          onClick: onOpenAgentSkillMatrix,
        },
      ],
    },
    {
      title: 'ENGINEERING & TOOLING',
      color: 'text-cyan-400 border-cyan-500/30',
      items: [
        {
          id: 'ide',
          label: 'Cloud IDE & Code Studio',
          description: 'Sandboxed TypeScript, AST transpilation, unit tests',
          icon: <Code className="w-4 h-4 text-amber-400" />,
          onClick: onOpenIde,
          badge: 'IDE',
        },
        {
          id: 'repos',
          label: 'GitHub Repositories',
          description: 'Branch commits, PR workflows, automated sync',
          icon: <FolderGit2 className="w-4 h-4 text-zinc-300" />,
          onClick: onOpenRepos,
        },
        {
          id: 'deployments',
          label: 'Deployment Pipelines',
          description: 'Zero-downtime hotfixes and canary releases',
          icon: <Rocket className="w-4 h-4 text-blue-400" />,
          onClick: onOpenDynamicFeatures,
        },
        {
          id: 'debugger',
          label: 'SRE Diagnostics & Terminal',
          description: 'Real-time stack traces, heap dump analysis, logs',
          icon: <Activity className="w-4 h-4 text-emerald-400" />,
          onClick: onOpenDebugger,
        },
        {
          id: 'modules',
          label: `System Modules (${systemModulesCount})`,
          description: 'Dynamic hot-swappable plugins and capabilities',
          icon: <Cpu className="w-4 h-4 text-indigo-400" />,
          onClick: onOpenSystemModules,
        },
      ],
    },
    {
      title: 'INTEGRATIONS & MESH',
      color: 'text-orange-400 border-orange-500/30',
      items: [
        {
          id: 'composio',
          label: 'Composio 3P SaaS Suite',
          description: 'Connect Slack, GitHub, Jira, Gmail, Stripe tools',
          icon: <Zap className="w-4 h-4 text-orange-400" />,
          onClick: onOpenComposioHub,
          badge: 'HOT',
        },
        {
          id: 'supabase',
          label: 'Supabase PostgreSQL DB',
          description: 'Relational persistence, migrations, live telemetry',
          icon: <Database className="w-4 h-4 text-emerald-400" />,
          onClick: onOpenSupabaseDiagnostic,
        },
        {
          id: 'apigateway',
          label: 'API Gateway & Microservices',
          description: 'Multi-service routing with zero-trust token mesh',
          icon: <Network className="w-4 h-4 text-teal-400" />,
          onClick: onOpenApiGatewayMicroservices,
        },
        {
          id: 'telegram',
          label: 'Telegram Intelligence Hub',
          description: 'Live channels stream, global search & bot gateway',
          icon: <Send className="w-4 h-4 text-sky-400" />,
          onClick: onOpenTelegram,
          badge: 'LIVE',
        },
      ],
    },
    {
      title: 'RESILIENCE, SRE & EVOLUTION',
      color: 'text-rose-400 border-rose-500/30',
      items: [
        {
          id: 'chaos',
          label: 'Chaos Crisis Simulator',
          description: 'Outage injection, circuit breakers, Toby self-healing',
          icon: <Flame className="w-4 h-4 text-rose-400" />,
          onClick: onOpenCrisisSimulation,
          badge: 'CRISIS',
        },
        {
          id: 'loadbalancer',
          label: 'Predictive Load Balancer',
          description: 'Dynamic concurrency scaling and token load balancing',
          icon: <Sliders className="w-4 h-4 text-amber-400" />,
          onClick: onOpenPredictiveLoadBalancer,
        },
        {
          id: 'crashalyst',
          label: 'Firebase Crashalyst',
          description: 'Crash reporting, stack trace diagnosis, telemetry',
          icon: <Activity className="w-4 h-4 text-red-400" />,
          onClick: onOpenCrashalyst,
        },
        {
          id: 'academy',
          label: 'Agent Academy',
          description: 'Curriculum learning, benchmark evaluations, certifications',
          icon: <Sparkles className="w-4 h-4 text-violet-400" />,
          onClick: onOpenAcademy,
        },
        {
          id: 'evolution',
          label: 'Master Meta-Evolution',
          description: 'Autonomous genetic prompt tuning and model distillation',
          icon: <Rocket className="w-4 h-4 text-fuchsia-400" />,
          onClick: onOpenMasterEvolution,
        },
      ],
    },
  ];

  return (
    <header className="rufflo-topbar select-none">
      {/* Brand Mark with Genuine Executive Styling */}
      <div 
        className="rufflo-brand cursor-pointer flex items-center gap-2.5 py-1 px-1.5 rounded-lg hover:bg-white/5 transition-colors" 
        onClick={() => click(onSelectCorporationTab)}
        title="Rufflo Autonomous Operating System - Return to Overview"
      >
        <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700/80 flex items-center justify-center font-black text-white text-xs shadow-xs">
          R
        </div>
        <div className="flex flex-col">
          <div className="text-xs font-bold tracking-wider text-white flex items-center gap-1.5">
            <span>RUFFLO OS</span>
            <span className="text-[10px] font-mono font-normal text-zinc-400">v4.5</span>
          </div>
          <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            <span>Autonomous Fleet</span>
          </div>
        </div>
      </div>

      {/* Global Search Bar */}
      <button
        type="button"
        className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800/90 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs transition-colors shadow-xs"
        onClick={() => click(onOpenSearch)}
        title="Open Command Palette (⌘K)"
      >
        <Search className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-zinc-400 text-xs">Search agents, missions, tools...</span>
        <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-400 font-mono">
          ⌘K
        </kbd>
      </button>

      {/* Primary Quick Rail: Curated & Crisp */}
      <nav className="hidden lg:flex items-center gap-1 min-w-0">
        {quickRails.map((item) => (
          <button
            key={item.id}
            type="button"
            className="group h-8 px-2.5 rounded-md text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            title={item.label}
            onClick={() => click(item.onClick)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Right cluster */}
      <div className="rufflo-top-actions flex items-center gap-1.5 ml-auto">
        <button
          type="button"
          className={`h-8 px-2.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
            autoMode
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-950/60'
              : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
          title="Toggle Auto / Manual Dispatch Mode"
          onClick={() => click(onToggleAutoMode)}
        >
          <Zap className={`w-3.5 h-3.5 ${autoMode ? 'text-emerald-400' : 'text-zinc-500'}`} />
          <span className="hidden sm:inline font-mono font-semibold">{autoMode ? 'AUTO' : 'MANUAL'}</span>
        </button>

        <button
          type="button"
          className="h-8 w-8 rounded-md bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
          title="Toggle Theme"
          onClick={() => click(onToggleTheme)}
        >
          {theme === 'dark' || theme?.includes('dark') ? (
            <Sun className="w-3.5 h-3.5 text-zinc-400 hover:text-amber-300" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-zinc-400 hover:text-indigo-300" />
          )}
        </button>

        <button
          type="button"
          className="h-8 w-8 rounded-md bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
          title="Toggle Fullscreen"
          onClick={() => click(onToggleFullscreen)}
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          className="h-8 px-2.5 rounded-md bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/80 hover:border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Account Profile & Credentials"
          onClick={() => click(onOpenAuth)}
        >
          <User className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden lg:inline max-w-[110px] truncate font-medium text-xs">
            {userProfile?.displayName || userProfile?.username || 'Executive'}
          </span>
        </button>

        {/* All Features Menu Trigger */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="h-8 px-2.5 rounded-md text-xs font-semibold text-zinc-100 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Open Enterprise Module Catalog (28 Modules)"
            onClick={() => {
              soundFx.playClick?.();
              setMenuOpen((v) => !v);
            }}
          >
            <MoreHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Modules</span>
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-zinc-700/80 text-zinc-300">28</span>
          </button>

          {/* Mega Menu Dropdown */}
          {menuOpen && (
            <div
              className="module-catalog animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tracking-wide">
                    RUFFLO ENTERPRISE MODULE SUITE
                  </span>
                  <span className="text-[10px] font-mono font-medium bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-white/10">
                    28 Connected Subsystems
                  </span>
                </div>
                <span className="text-xs text-zinc-400">Direct subsystem routing</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featureCategories.map((cat) => (
                  <div key={cat.title} className="flex flex-col gap-2">
                    <div className={`text-[10px] font-bold font-mono uppercase tracking-wider pb-1 border-b border-white/10 text-zinc-400`}>
                      {cat.title}
                    </div>
                    <div className="flex flex-col gap-1">
                      {cat.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => click(item.onClick)}
                          className="flex items-start gap-2.5 p-2 rounded-lg text-left bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 hover:border-white/15 transition-colors group cursor-pointer"
                        >
                          <div className="p-1.5 rounded-md bg-zinc-800/80 border border-white/10 shrink-0 text-zinc-300 group-hover:text-white">
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">
                                {item.label}
                              </span>
                              {item.badge && (
                                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded border border-white/10">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-snug line-clamp-1">
                              {item.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => click(onOpenPreferences)}
                    className="text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                    <span>System Preferences</span>
                  </button>
                  <button
                    onClick={() => click(onOpenAdminOrchestrator)}
                    className="text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <Shield className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Governance & Audit Logs</span>
                  </button>
                </div>
                <div className="text-[11px] font-mono text-zinc-500">
                  Version 4.5.0-Quantum · Runtime Protected
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavigation;
