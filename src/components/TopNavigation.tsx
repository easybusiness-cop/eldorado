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
  dynamicFeatureCount: number;
  systemModulesCount: number;
  autoMode: boolean;
  onToggleAutoMode: () => void;
  theme: string;
  onToggleTheme: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  hidden?: boolean;
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

  const primary: NavItem[] = [
    {
      id: 'search',
      label: 'Search',
      icon: <Search className="w-3.5 h-3.5" />,
      onClick: onOpenSearch,
      primary: true,
      hidden: !onOpenSearch,
    },
    {
      id: 'ide',
      label: 'IDE',
      icon: <Code className="w-3.5 h-3.5" />,
      onClick: onOpenIde,
      primary: true,
    },
    {
      id: 'repo',
      label: 'Repos',
      icon: <FolderGit2 className="w-3.5 h-3.5" />,
      onClick: onOpenRepos,
      primary: true,
    },
    {
      id: 'web',
      label: 'Web',
      icon: <Globe className="w-3.5 h-3.5" />,
      onClick: onOpenWeb,
      primary: true,
    },
    {
      id: 'debug',
      label: 'Debug',
      icon: <Activity className="w-3.5 h-3.5" />,
      onClick: onOpenDebugger,
      primary: true,
    },
    {
      id: 'features',
      label: `Features (${dynamicFeatureCount})`,
      icon: <Sparkles className="w-3.5 h-3.5" />,
      onClick: onOpenDynamicFeatures,
      primary: true,
    },
  ].filter((i) => !i.hidden);

  const overflow: NavItem[] = [
    { id: 'dashboard', label: 'Agents dashboard', icon: <Layers className="w-3.5 h-3.5" />, onClick: onOpenMunderdifflinDashboard, hidden: !onOpenMunderdifflinDashboard },
    { id: 'comms', label: 'Agent communication', icon: <Phone className="w-3.5 h-3.5" />, onClick: onOpenAgentCommunication, hidden: !onOpenAgentCommunication },
    { id: 'skills', label: 'Skill matrix', icon: <Brain className="w-3.5 h-3.5" />, onClick: onOpenAgentSkillMatrix, hidden: !onOpenAgentSkillMatrix },
    { id: 'sops', label: 'SOPs & data', icon: <Shield className="w-3.5 h-3.5" />, onClick: onOpenAgentSops, hidden: !onOpenAgentSops },
    { id: 'kb', label: 'Knowledge base', icon: <Brain className="w-3.5 h-3.5" />, onClick: onOpenDynamicKnowledgeBase, hidden: !onOpenDynamicKnowledgeBase },
    { id: 'db', label: 'Company DB', icon: <Database className="w-3.5 h-3.5" />, onClick: onOpenDb, hidden: !onOpenDb },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-3.5 h-3.5" />, onClick: onOpenAnalytics, hidden: !onOpenAnalytics },
    { id: 'workspace', label: 'Workspace', icon: <Layers className="w-3.5 h-3.5" />, onClick: onOpenWorkspace, hidden: !onOpenWorkspace },
    { id: 'apihub', label: 'API Hub', icon: <Globe className="w-3.5 h-3.5" />, onClick: onOpenPublicApiHub, hidden: !onOpenPublicApiHub },
    { id: 'academy', label: 'Academy', icon: <Sparkles className="w-3.5 h-3.5" />, onClick: onOpenAcademy, hidden: !onOpenAcademy },
    { id: 'evolution', label: 'Master evolution', icon: <Rocket className="w-3.5 h-3.5" />, onClick: onOpenMasterEvolution, hidden: !onOpenMasterEvolution },
    { id: 'modules', label: `System modules (${systemModulesCount})`, icon: <Cpu className="w-3.5 h-3.5" />, onClick: onOpenSystemModules },
    { id: 'orchestrator', label: 'Admin orchestrator', icon: <Zap className="w-3.5 h-3.5" />, onClick: onOpenAdminOrchestrator, hidden: !onOpenAdminOrchestrator },
    { id: 'supabase', label: 'Supabase diagnostic', icon: <Database className="w-3.5 h-3.5" />, onClick: onOpenSupabaseDiagnostic, hidden: !onOpenSupabaseDiagnostic },
    { id: 'call', label: 'Agent call', icon: <Phone className="w-3.5 h-3.5" />, onClick: onOpenCall },
    { id: 'prefs', label: 'Preferences', icon: <Sliders className="w-3.5 h-3.5" />, onClick: onOpenPreferences },
  ].filter((i) => !i.hidden);

  return (
    <header className="rufflo-topbar select-none">
      {/* Brand */}
      <div className="rufflo-brand">
        <div className="rufflo-brand-mark">R</div>
        <div>
          <div className="rufflo-brand-text">Rufflo</div>
          <div className="rufflo-brand-sub">Command</div>
        </div>
      </div>

      {/* Primary icon rail */}
      <nav className="flex items-center gap-1 min-w-0 overflow-x-auto no-scrollbar">
        {primary.map((item) => (
          <button
            key={item.id}
            type="button"
            className="rufflo-btn"
            title={item.label}
            onClick={() => click(item.onClick)}
          >
            {item.icon}
            <span className="hidden md:inline">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Right cluster */}
      <div className="rufflo-top-actions">
        <button
          type="button"
          className={`rufflo-btn ${autoMode ? 'rufflo-btn-primary' : ''}`}
          title="Toggle auto mode"
          onClick={() => click(onToggleAutoMode)}
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{autoMode ? 'AUTO' : 'MANUAL'}</span>
        </button>

        <button type="button" className="rufflo-btn rufflo-btn-ghost" title="Theme" onClick={() => click(onToggleTheme)}>
          {theme === 'dark' || theme?.includes('dark') ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          className="rufflo-btn rufflo-btn-ghost"
          title="Fullscreen"
          onClick={() => click(onToggleFullscreen)}
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
        </button>

        <button type="button" className="rufflo-btn" title="Account" onClick={() => click(onOpenAuth)}>
          <User className="w-3.5 h-3.5" />
          <span className="hidden lg:inline max-w-[100px] truncate">
            {userProfile?.displayName || userProfile?.username || 'User'}
          </span>
        </button>

        {/* Overflow menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="rufflo-btn"
            title="More"
            onClick={() => {
              soundFx.playClick?.();
              setMenuOpen((v) => !v);
            }}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">More</span>
          </button>

          {menuOpen && (
            <div
              className="animate-scale-in"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: 260,
                background: 'var(--bg-2)',
                border: '1px solid var(--border-1)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.45)',
                padding: 6,
                zIndex: 60,
              }}
            >
              {overflow.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => click(item.onClick)}
                  className="rufflo-btn rufflo-btn-ghost"
                  style={{ width: '100%', justifyContent: 'flex-start', height: 34 }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavigation;
