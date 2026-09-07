import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Command,
  Users,
  Building2,
  CheckSquare,
  Sparkles,
  Terminal,
  Activity,
  Code2,
  Shield,
  BookOpen,
  Sliders,
  ArrowRight,
  Zap,
  Flame,
  Globe,
  Database,
  BarChart3,
  Brain,
  Share2,
} from 'lucide-react';
import { Agent, FleetTask } from '../types';

export interface SearchActionItem {
  id: string;
  category: 'agents' | 'departments' | 'tasks' | 'tools' | 'navigation';
  title: string;
  subtitle: string;
  badge?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  tasks: FleetTask[];
  departments: any[];
  onSelectAgent: (agentId: string) => void;
  onOpenIde: () => void;
  onOpenDebugger: () => void;
  onOpenAdminOrchestrator: () => void;
  onOpenRepos: () => void;
  onOpenAcademy: () => void;
  onOpenSystemModules: () => void;
  onOpenPreferences: () => void;
  onOpenCall: (agentId: string) => void;
  onOpenWorkspace?: () => void;
  onOpenKnowledgeBase?: () => void;
  onOpenAnalytics?: () => void;
  onOpenCompanyDb?: () => void;
  onOpenPublicApi?: () => void;
  onOpenWebExplorer?: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  agents,
  tasks,
  departments,
  onSelectAgent,
  onOpenIde,
  onOpenDebugger,
  onOpenAdminOrchestrator,
  onOpenRepos,
  onOpenAcademy,
  onOpenSystemModules,
  onOpenPreferences,
  onOpenCall,
  onOpenWorkspace,
  onOpenKnowledgeBase,
  onOpenAnalytics,
  onOpenCompanyDb,
  onOpenPublicApi,
  onOpenWebExplorer,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build searchable items
  const allItems = useMemo<SearchActionItem[]>(() => {
    const items: SearchActionItem[] = [];

    // 1. System Navigation & Core Tools
    items.push(
      {
        id: 'tool-admin',
        category: 'tools',
        title: 'Administrator & Fleet Orchestrator',
        subtitle: 'Dispatch multi-agent tasks, workflows & approvals',
        badge: 'Executive',
        icon: <Terminal className="w-4 h-4 text-[#fabd2f]" />,
        action: () => {
          onClose();
          onOpenAdminOrchestrator();
        },
      },
      {
        id: 'tool-debugger',
        category: 'tools',
        title: '24/7 Continuous Self-Healing Cockpit',
        subtitle: 'Live telemetry diagnostics and auto-patch engine',
        badge: 'Auto-Fix',
        icon: <Activity className="w-4 h-4 text-emerald-400" />,
        action: () => {
          onClose();
          onOpenDebugger();
        },
      },
      {
        id: 'tool-ide',
        category: 'tools',
        title: 'Sandboxed Node VM & IDE Editor',
        subtitle: 'Inspect runtime code, dynamic features & scripts',
        badge: 'Coder',
        icon: <Code2 className="w-4 h-4 text-sky-400" />,
        action: () => {
          onClose();
          onOpenIde();
        },
      },
      {
        id: 'tool-repos',
        category: 'tools',
        title: 'Open-Source Fleet Hub (Mastra, Composio, LangGraph)',
        subtitle: 'Explore agent integrations, MCP tools & providers',
        badge: 'Ecosystem',
        icon: <Sparkles className="w-4 h-4 text-purple-400" />,
        action: () => {
          onClose();
          onOpenRepos();
        },
      },
      {
        id: 'tool-academy',
        category: 'tools',
        title: 'CSE Agent Training Academy',
        subtitle: 'Certify workforce skills & compliance records',
        badge: 'HR / Learn',
        icon: <BookOpen className="w-4 h-4 text-amber-400" />,
        action: () => {
          onClose();
          onOpenAcademy();
        },
      },
      {
        id: 'tool-modules',
        category: 'tools',
        title: 'Active Hot-Patches & System Modules',
        subtitle: 'Review runtime patched scripts and AST transforms',
        badge: 'Live',
        icon: <Zap className="w-4 h-4 text-emerald-400" />,
        action: () => {
          onClose();
          onOpenSystemModules();
        },
      },

      {
        id: 'tool-workspace',
        category: 'tools',
        title: 'Google Workspace Enterprise Hub (Chat, Sheets, Classroom, Gmail, Forms)',
        subtitle: 'Real-time Google Workspace applications with dual Supabase/Firebase engine',
        badge: 'Workspace',
        icon: <Globe className="w-4 h-4 text-blue-400" />,
        action: () => {
          onClose();
          onOpenWorkspace?.();
        },
      },
      {
        id: 'tool-knowledge-base',
        category: 'tools',
        title: 'Dynamic Knowledge Base & Corporate Cascade',
        subtitle: 'Autonomous Learning Radar, multi-tier workforce, and organizational hierarchy',
        badge: 'Workforce',
        icon: <Brain className="w-4 h-4 text-pink-400" />,
        action: () => {
          onClose();
          onOpenKnowledgeBase?.();
        },
      },
      {
        id: 'tool-company-db',
        category: 'tools',
        title: 'Company Canonical Database & Ledger',
        subtitle: 'Inspect persistent SQLite, JSON, and Postgres company records',
        badge: 'Database',
        icon: <Database className="w-4 h-4 text-emerald-400" />,
        action: () => {
          onClose();
          onOpenCompanyDb?.();
        },
      },
      {
        id: 'tool-analytics',
        category: 'tools',
        title: 'Executive Analytics & Telemetry Dashboard',
        subtitle: 'Real-time agent productivity, token metrics, and budget tracking',
        badge: 'Analytics',
        icon: <BarChart3 className="w-4 h-4 text-teal-400" />,
        action: () => {
          onClose();
          onOpenAnalytics?.();
        },
      },
      {
        id: 'tool-web-explorer',
        category: 'tools',
        title: 'OSINT Web Access & Live DOM Explorer',
        subtitle: 'Scrape URLs, extract architectural graphs, and mount to IDE',
        badge: 'OSINT',
        icon: <Globe className="w-4 h-4 text-cyan-400" />,
        action: () => {
          onClose();
          onOpenWebExplorer?.();
        },
      },
      {
        id: 'tool-public-api',
        category: 'tools',
        title: 'Public API Hub & Composio Connectors',
        subtitle: 'Manage GitHub, Slack, Linear, and third-party API keys',
        badge: 'Integrations',
        icon: <Share2 className="w-4 h-4 text-orange-400" />,
        action: () => {
          onClose();
          onOpenPublicApi?.();
        },
      },
      {
        id: 'tool-prefs',
        category: 'tools',
        title: 'Preferences & Persona Tone Settings',
        subtitle: 'Customize prompt tone, speech rates & credentials',
        badge: 'Config',
        icon: <Sliders className="w-4 h-4 text-[#a89984]" />,
        action: () => {
          onClose();
          onOpenPreferences();
        },
      }
    );

    // 2. Agents
    for (const agent of agents) {
      items.push({
        id: `agent-${agent.id}`,
        category: 'agents',
        title: `${agent.name} (${agent.nickname})`,
        subtitle: `${agent.role} • Status: ${agent.status.toUpperCase()}`,
        badge: agent.role.includes('Security') ? 'Security' : 'Agent',
        icon: (
          <span className="w-5 h-5 flex items-center justify-center text-sm">
            {agent.avatar}
          </span>
        ),
        action: () => {
          onClose();
          onSelectAgent(agent.id);
        },
      });
    }

    // 3. Departments
    const deptList = departments.length > 0 ? departments : [
      { id: 'executive', name: 'Executive Leadership' },
      { id: 'engineering', name: 'Software Engineering' },
      { id: 'sales', name: 'Sales & Outreach' },
      { id: 'finance', name: 'Accounting & Ledger' },
      { id: 'security', name: 'Cyber Defense' },
      { id: 'marketing', name: 'Marketing & Brand' },
      { id: 'hr', name: 'Human Resources' },
    ];

    for (const dept of deptList) {
      items.push({
        id: `dept-${dept.id}`,
        category: 'departments',
        title: dept.name,
        subtitle: `Department Code: ${dept.id}`,
        badge: 'Dept',
        icon: <Building2 className="w-4 h-4 text-amber-300" />,
        action: () => {
          onClose();
        },
      });
    }

    // 4. Tasks
    for (const t of tasks) {
      items.push({
        id: `task-${t.id}`,
        category: 'tasks',
        title: t.title,
        subtitle: `Assigned: ${t.assignedTo} • Priority: ${t.priority.toUpperCase()}`,
        badge: t.status === 'completed' ? 'Done' : 'Active',
        icon: <CheckSquare className="w-4 h-4 text-sky-400" />,
        action: () => {
          onClose();
          onSelectAgent(t.assignedTo);
        },
      });
    }

    return items;
  }, [
    agents,
    tasks,
    departments,
    onClose,
    onOpenAdminOrchestrator,
    onOpenDebugger,
    onOpenIde,
    onOpenRepos,
    onOpenAcademy,
    onOpenSystemModules,
    onOpenPreferences,
    onSelectAgent,
  ]);

  // Filter items by query
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      return allItems;
    }
    const q = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.badge?.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [allItems, query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      id="search-palette-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="search-palette-container"
        className="w-full max-w-2xl bg-[#141822] border border-[#2b3345] rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#2b3345] bg-[#19202e]">
          <Search className="w-5 h-5 text-[#8899ac]" />
          <input
            id="search-palette-input"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search agents, tasks, departments, or commands... (Cmd/Ctrl + K)"
            className="flex-1 bg-transparent text-[#e6edf3] placeholder-[#8899ac] outline-none text-base font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-[#8899ac] hover:text-white px-1.5 py-0.5 rounded bg-[#2b3345]"
            >
              Clear
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-[#8899ac] bg-[#222b3d] px-2 py-0.5 rounded border border-[#2e3a50]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          id="search-palette-results"
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-2 space-y-1 divide-y divide-[#1e2636]/60 custom-scrollbar"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-[#8899ac]">
              <Flame className="w-8 h-8 mx-auto mb-2 text-[#fabd2f]/40" />
              <p className="text-sm font-semibold text-[#e6edf3]">No matching fleet items found</p>
              <p className="text-xs mt-1">Try searching for an agent name, department, or system tool.</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#222c40] text-white border-l-2 border-[#fabd2f]'
                      : 'hover:bg-[#1a2233] text-[#c9d1d9]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-md ${
                        isSelected ? 'bg-[#2d3952]' : 'bg-[#19202e]'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate text-[#f0f6fc]">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-[#2b3345] text-[#fabd2f] font-bold">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8899ac] truncate mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#8899ac] flex-shrink-0">
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#fabd2f]">
                        Execute <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-[#10141d] border-t border-[#2b3345] flex items-center justify-between text-[11px] text-[#8899ac] font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="bg-[#222b3d] px-1.5 py-0.5 rounded border border-[#2e3a50]">↑</kbd>
              <kbd className="bg-[#222b3d] px-1.5 py-0.5 rounded border border-[#2e3a50]">↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-[#222b3d] px-1.5 py-0.5 rounded border border-[#2e3a50]">↵</kbd> Select
            </span>
          </div>
          <div>
            <span className="text-[#fabd2f] font-semibold">{filteredItems.length}</span> items available
          </div>
        </div>
      </div>
    </div>
  );
};
