import React from 'react';
import { UserProfile } from '../types';
import { soundFx } from '../utils/speech';
import {
  Moon,
  Sun,
  Maximize,
  Minimize,
  Sliders,
  User,
  Shield,
  Layers,
  Code,
  Sparkles,
  Phone,
  Globe,
  FolderGit2,
  Cpu,
  Zap,
  Search,
  Command,
  BarChart3,
  Mail,
  Database,
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
  dynamicFeatureCount: number;
  systemModulesCount: number;
  autoMode: boolean;
  onToggleAutoMode: () => void;
  theme: string;
  onToggleTheme: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
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
  dynamicFeatureCount,
  systemModulesCount,
  autoMode,
  onToggleAutoMode,
  theme,
  onToggleTheme,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <header className="flex items-center justify-between px-3 py-1.5 bg-[#ebdbb2] dark:bg-[#181615] border-b-2 border-[#d5c4a1] dark:border-[#3c3836] font-mono text-xs select-none">
      {/* Left: Window Controls, Version Badge & Auto Mode */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Retro Window Dot Controls */}
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#cc241d] border border-[#9d0006] inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#fabd2f] border border-[#b57614] inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#b8bb26] border border-[#79740e] inline-block" />
        </div>

        {/* Brand Stamp */}
        <div className="flex items-center gap-1.5">
          <div className="px-1.5 py-0.5 rounded bg-[#cc241d] text-white font-bold text-[10px] tracking-tighter shadow-sm">
            MUNDER DIFFL.IN
          </div>
          <span className="hidden sm:inline text-[11px] font-bold text-[#7c6f64] dark:text-[#a89984]">
            v0.4.0
          </span>
        </div>

        {/* Auto Mode Indicator */}
        <button
          id="btn-nav-auto"
          onClick={() => {
            soundFx.playClick();
            onToggleAutoMode();
          }}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
            autoMode
              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40'
              : 'bg-[#d5c4a1] dark:bg-[#282828] text-[#7c6f64] dark:text-[#928374]'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              autoMode ? 'bg-emerald-500 animate-ping' : 'bg-zinc-500'
            }`}
          />
          <span>auto mode {autoMode ? 'on' : 'off'}</span>
        </button>
      </div>

      {/* Middle/Right Quick Action Badges */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
        {/* Global Quick Search (Cmd+K) Button */}
        {onOpenSearch && (
          <button
            id="btn-nav-search-palette"
            onClick={() => {
              soundFx.playClick();
              onOpenSearch();
            }}
            className="px-2.5 py-1 rounded bg-[#2d3748]/70 hover:bg-[#2d3748] text-[#f0f6fc] border border-[#4a5568] flex items-center gap-2 font-bold text-[11px] transition-all shadow-sm group"
            title="Quick Search & Navigation Command Palette (Cmd/Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-[#fabd2f] group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Search Fleet</span>
            <kbd className="text-[10px] bg-[#1a202c] text-[#a0aec0] px-1.5 py-0.5 rounded border border-[#4a5568] font-mono">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Munderdiffl.in Agents Dashboard Button */}
        {onOpenMunderdifflinDashboard && (
          <button
            id="btn-nav-munderdifflin-dashboard"
            onClick={() => {
              soundFx.playClick();
              onOpenMunderdifflinDashboard();
            }}
            className="px-2.5 py-1 rounded bg-[#b57614] hover:bg-[#8f5d0f] text-[#fbf1c7] border border-[#fabd2f] flex items-center gap-1.5 font-bold text-[11px] transition-all shadow-sm"
            title="Open Munder Diffl.in Agents Dashboard: Task Dispatch & Live Progress"
          >
            <span className="text-xs">📋</span>
            <span>Munderdiffl.in Agents</span>
          </button>
        )}

        {/* Agent Communication Threads Button */}
        {onOpenAgentCommunication && (
          <button
            id="btn-nav-agent-communication"
            onClick={() => {
              soundFx.playClick();
              onOpenAgentCommunication();
            }}
            className="px-2.5 py-1 rounded bg-[#fabd2f] hover:bg-[#fabd2f]/90 text-[#1d2021] border border-[#d79921] flex items-center gap-1.5 font-bold text-[11px] transition-all shadow-sm"
            title="Visual Messaging Threads with Quantum Alignment Telemetry"
          >
            <span className="text-xs">💬</span>
            <span className="hidden lg:inline">Agent</span> Communication
          </button>
        )}

        {/* Agent Skill Matrix Button */}
        {onOpenAgentSkillMatrix && (
          <button
            id="btn-nav-agent-skill-matrix"
            onClick={() => {
              soundFx.playClick();
              onOpenAgentSkillMatrix();
            }}
            className="px-2.5 py-1 rounded bg-[#427b58] hover:bg-[#346246] text-[#fbf1c7] border border-[#2d543c] flex items-center gap-1.5 font-bold text-[11px] transition-all shadow-sm"
            title="Agent Skill Matrix & Personalized Learning Modules"
          >
            <span className="text-xs">🎯</span>
            <span className="hidden lg:inline">Skill</span> Matrix
          </button>
        )}

        {/* Agent SOPs Button */}
        {onOpenAgentSops && (
          <button
            id="btn-nav-agent-sops"
            onClick={() => {
              soundFx.playClick();
              onOpenAgentSops();
            }}
            className="px-2.5 py-1 rounded bg-[#076678] hover:bg-[#076678]/90 text-[#fbf1c7] border border-[#076678] flex items-center gap-1.5 font-bold text-[11px] transition-all shadow-sm"
            title="Agent Standard Operating Procedures & Verified Data Clearance"
          >
            <span className="text-xs">📁</span>
            <span className="hidden lg:inline">Agent</span> SOPs
          </button>
        )}

        {/* Dynamic Knowledge Base Button */}
        {onOpenDynamicKnowledgeBase && (
          <button
            id="btn-nav-dynamic-kb"
            onClick={() => {
              soundFx.playClick();
              onOpenDynamicKnowledgeBase();
            }}
            className="px-2.5 py-1 rounded bg-[#b8bb26] hover:bg-[#98971a] text-[#1d2021] border border-[#79740e] flex items-center gap-1.5 font-bold text-[11px] transition-all shadow-sm"
            title="Dynamic Knowledge Base for AI Agents (Hacking, Marketing, Finance, Coding, Social Media)"
          >
            <span className="text-xs">🧠</span>
            <span>Knowledge Base</span>
          </button>
        )}

        {/* CSE Agent Academy Button */}
        {onOpenAcademy && (
          <button
            id="btn-nav-academy"
            onClick={() => {
              soundFx.playClick();
              onOpenAcademy();
            }}
            className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500 flex items-center gap-1 font-bold text-[11px] transition-all shadow-sm"
            title="CSE Agent Training Academy"
          >
            <span className="text-xs">🎓</span>
            <span>CSE Academy</span>
          </button>
        )}

        {/* Master Self-Evolution Button */}
        {onOpenMasterEvolution && (
          <button
            id="btn-nav-master-evolution"
            onClick={() => {
              soundFx.playClick();
              onOpenMasterEvolution();
            }}
            className="px-2 py-1 rounded bg-purple-700 hover:bg-purple-800 text-white border border-purple-500 flex items-center gap-1 font-bold text-[11px] transition-all shadow-sm"
            title="Master Agent Self-Evolution & Repository Intelligence"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Master Evolution</span>
          </button>
        )}
        {/* Administrator Task Dispatcher Button */}
        {onOpenAdminOrchestrator && (
          <button
            id="btn-nav-admin-orchestrator"
            onClick={() => {
              soundFx.playClick();
              onOpenAdminOrchestrator();
            }}
            className="px-2 py-1 rounded bg-[#fabd2f] hover:bg-[#fabd2f]/90 text-[#1d2021] border border-[#fabd2f] flex items-center gap-1 font-bold text-[11px] transition-all shadow-sm"
            title="Administrator Task Dispatcher: Assign high-level tasks to autonomous agents"
          >
            <span className="text-xs">👔</span>
            <span>Admin Dispatch</span>
          </button>
        )}
                {onOpenDb && (
          <button
            id="btn-nav-db"
            onClick={() => {
              soundFx.playClick();
              onOpenDb();
            }}
            className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 flex items-center gap-1 font-bold text-[11px] transition-all shadow-sm"
            title="Company Database (Supabase)"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Database</span>
          </button>
        )}
                {onOpenAnalytics && (
          <button
            id="btn-nav-analytics"
            onClick={() => {
              soundFx.playClick();
              onOpenAnalytics();
            }}
            className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500 flex items-center gap-1 font-bold text-[11px] transition-all shadow-sm"
            title="Executive Analytics & Fleet Intelligence"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>
        )}
        {onOpenWorkspace && (
          <button
            id="btn-nav-workspace"
            onClick={() => {
              soundFx.playClick();
              onOpenWorkspace();
            }}
            className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white border border-red-500 flex items-center gap-1 font-bold text-[11px] transition-all shadow-sm animate-pulse"
            title="Google Workspace Hub (Gmail, Calendar, Docs, Sheets)"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Google Workspace</span>
          </button>
        )}
        {onOpenPublicApiHub && (
          <button
            id="btn-nav-public-api-hub"
            onClick={() => {
              soundFx.playClick();
              onOpenPublicApiHub();
            }}
            className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-700 text-white border border-cyan-500 flex items-center gap-1 font-bold text-[11px] transition-all shadow-sm"
            title="Live Public API Integrator Hub"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Public API Hub</span>
          </button>
        )}
        {/* 1-on-1 Hotline Audio Call */}
        <button
          id="btn-nav-call"
          onClick={() => {
            soundFx.playClick();
            onOpenCall();
          }}
          className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 flex items-center gap-1 font-bold text-[11px] transition-colors"
          title="Direct 1-on-1 Agent Audio Call Hotline"
        >
          <Phone className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Call Hotline</span>
        </button>

        {/* Web & Profile Explorer */}
        <button
          id="btn-nav-web"
          onClick={() => {
            soundFx.playClick();
            onOpenWeb();
          }}
          className="px-2 py-1 rounded bg-[#d5c4a1] dark:bg-[#282828] hover:bg-[#fabd2f] hover:text-[#1d2021] text-[#3c3836] dark:text-[#ebdbb2] border border-[#bdae93] dark:border-[#504945] flex items-center gap-1 font-bold text-[11px] transition-colors"
          title="Fetch Any Web File or Developer Profile"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Web Files</span>
        </button>

        {/* Open-Source Repos Hub */}
        <button
          id="btn-nav-repos"
          onClick={() => {
            soundFx.playClick();
            onOpenRepos();
          }}
          className="px-2 py-1 rounded bg-[#d5c4a1] dark:bg-[#282828] hover:bg-[#fabd2f] hover:text-[#1d2021] text-[#3c3836] dark:text-[#ebdbb2] border border-[#bdae93] dark:border-[#504945] flex items-center gap-1 font-bold text-[11px] transition-colors"
          title="Open-Source Repositories Hub"
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Repos</span>
        </button>

        {/* 24x7 Backend Debugger Cockpit */}
        <button
          id="btn-nav-debugger"
          onClick={() => {
            soundFx.playClick();
            onOpenDebugger();
          }}
          className="px-2 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-700 dark:text-purple-300 border border-purple-500/40 flex items-center gap-1 font-bold text-[11px] transition-colors"
          title="24/7 Continuous Background Debugger"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span className="hidden md:inline">24/7 Debug</span>
        </button>

        {/* System Codes & Auto-Applied Backend Patches */}
        <button
          id="btn-nav-system-codes"
          onClick={() => {
            soundFx.playClick();
            onOpenSystemModules();
          }}
          className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-bold text-[11px] transition-colors"
          title="System Code & Auto-Applied Backend Runtime Registry"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>System Codes ({systemModulesCount})</span>
        </button>

        {/* Dynamic Feature Hub Button */}
        <button
          id="btn-dynamic-features"
          onClick={() => {
            soundFx.playClick();
            onOpenDynamicFeatures();
          }}
          className="px-2 py-1 rounded bg-[#d5c4a1] dark:bg-[#282828] hover:bg-[#fabd2f] hover:text-[#1d2021] text-[#3c3836] dark:text-[#ebdbb2] border border-[#bdae93] dark:border-[#504945] flex items-center gap-1 font-bold text-[11px] transition-colors"
          title="Active Dynamic Tool Modules"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Tools ({dynamicFeatureCount})</span>
        </button>

        {/* IDE Modal Trigger */}
        <button
          id="btn-nav-ide"
          onClick={() => {
            soundFx.playClick();
            onOpenIde();
          }}
          className="px-2 py-1 rounded bg-[#83a598]/20 hover:bg-[#83a598]/30 text-[#076678] dark:text-[#83a598] border border-[#83a598]/40 flex items-center gap-1 font-bold text-[11px]"
          title="Open Live Code IDE"
        >
          <Code className="w-3.5 h-3.5" />
          <span>{'IDE'}</span>
        </button>

        {/* User Account / Profile Badge */}
        <button
          id="btn-user-auth"
          onClick={() => {
            soundFx.playClick();
            onOpenAuth();
          }}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#fbf1c7] dark:bg-[#282828] border border-[#d5c4a1] dark:border-[#504945] hover:border-[#fabd2f] transition-colors"
          title="User Authentication & Profile"
        >
          <div className="w-5 h-5 rounded-full bg-[#fabd2f] text-[#1d2021] flex items-center justify-center font-bold text-[10px]">
            {userProfile.avatar || '👤'}
          </div>
          <span className="font-bold text-[11px] text-[#3c3836] dark:text-[#ebdbb2] max-w-[90px] truncate">
            {userProfile.displayName || userProfile.username}
          </span>
        </button>

        {/* Preferences Drawer Trigger */}
        <button
          id="btn-preferences"
          onClick={() => {
            soundFx.playClick();
            onOpenPreferences();
          }}
          className="p-1 rounded bg-[#d5c4a1] dark:bg-[#282828] hover:bg-[#c6b690] dark:hover:bg-[#3c3836] text-[#3c3836] dark:text-[#ebdbb2] border border-[#bdae93] dark:border-[#504945]"
          title="Personalization & Agent Preferences"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {/* Dark / Light Toggle */}
        <button
          id="btn-theme-toggle"
          onClick={() => {
            soundFx.playClick();
            onToggleTheme();
          }}
          className="p-1 rounded bg-[#d5c4a1] dark:bg-[#282828] hover:bg-[#c6b690] dark:hover:bg-[#3c3836] text-[#3c3836] dark:text-[#ebdbb2] border border-[#bdae93] dark:border-[#504945]"
          title="Toggle Color Theme"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Fullscreen Toggle */}
        <button
          id="btn-fullscreen-toggle"
          onClick={() => {
            soundFx.playClick();
            onToggleFullscreen();
          }}
          className="p-1 rounded bg-[#d5c4a1] dark:bg-[#282828] hover:bg-[#c6b690] dark:hover:bg-[#3c3836] text-[#3c3836] dark:text-[#ebdbb2] border border-[#bdae93] dark:border-[#504945]"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
