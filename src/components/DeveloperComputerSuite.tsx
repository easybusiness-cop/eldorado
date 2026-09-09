import React, { useState, useEffect } from 'react';
import {
  Code2,
  Terminal,
  Globe,
  Database,
  Zap,
  FolderGit2,
  Server,
  Layout,
  Monitor,
  Play,
  RotateCw,
  Search,
  Package,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Download,
  Copy,
  ExternalLink,
  Cpu,
  ShieldCheck,
  Activity,
  Send,
  Save,
  Flame,
  FileCode,
  Smartphone,
  Tablet,
  Check,
  RefreshCw,
  HardDrive,
  FileText
} from 'lucide-react';
import { diffLines, Change } from 'diff';
import { soundFx } from '../utils/speech';

export interface DeveloperComputerSuiteProps {
  onClose?: () => void;
  initialTab?: 'apps_computer' | 'ide' | 'terminal' | 'packages' | 'repos' | 'website_builder' | 'software_builder' | 'cloudrun';
}

export const DeveloperComputerSuite: React.FC<DeveloperComputerSuiteProps> = ({
  onClose,
  initialTab = 'apps_computer'
}) => {
  const [activeTab, setActiveTab] = useState<'apps_computer' | 'ide' | 'terminal' | 'packages' | 'repos' | 'website_builder' | 'software_builder' | 'cloudrun'>(initialTab);

  // =========================================================================
  // 1. COMPUTER & APPLICATIONS STATE
  // =========================================================================
  const [selectedAppId, setSelectedAppId] = useState<string>('vscode');
  const [applications, setApplications] = useState<any[]>([]);
  const [isExecutingAppAction, setIsExecutingAppAction] = useState(false);
  const [appActionLogs, setAppActionLogs] = useState<string[]>([]);
  const [autonomousAppMode, setAutonomousAppMode] = useState<boolean>(true);

  // Application-specific interactive state
  const [postmanMethod, setPostmanMethod] = useState<'GET' | 'POST'>('GET');
  const [postmanUrl, setPostmanUrl] = useState<string>('/api/developer/applications');
  const [postmanResponse, setPostmanResponse] = useState<any>(null);
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT id, name, role, status FROM autonomous_agents LIMIT 5;');
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [browserUrlBar, setBrowserUrlBar] = useState<string>('https://dunder-mifflin.internal/dashboard');
  const [gitBranch, setGitBranch] = useState<string>('main');
  const [gitCommitMsg, setGitCommitMsg] = useState<string>('feat(agent): autonomous computer use and developer operating suite');

  // =========================================================================
  // 2. IDE & CODE DIFF STATE
  // =========================================================================
  const sampleFiles = [
    {
      path: 'server/routes/developer-suite.routes.ts',
      language: 'typescript',
      content: `// Autonomous Developer Operating Suite Backend Route
import { Router } from "express";
export const developerSuiteRouter = Router();

developerSuiteRouter.get("/applications", (_req, res) => {
  res.json({ success: true, count: 9, status: "ALL_SYSTEMS_OPTIMAL" });
});
`
    },
    {
      path: 'src/App.tsx',
      language: 'typescript',
      content: `import React from 'react';
import { DeveloperComputerSuite } from './components/DeveloperComputerSuite';

export default function App() {
  return <div className="min-h-screen bg-[#1d2021] text-[#ebdbb2]">Rufflo Autonomous Fleet</div>;
}
`
    },
    {
      path: 'src/db/companyDb.ts',
      language: 'typescript',
      content: `export class CompanyDatabase {
  private data: any = {};
  public reassignTask(taskId: string, newAssignedTo: string) {
    // Reassigned with audit log
    return { success: true, taskId, newAssignedTo };
  }
}`
    }
  ];

  const [activeFilePath, setActiveFilePath] = useState<string>(sampleFiles[0].path);
  const [editorContent, setEditorContent] = useState<string>(sampleFiles[0].content);
  const [originalContent, setOriginalContent] = useState<string>(sampleFiles[0].content);
  const [showDiffView, setShowDiffView] = useState<boolean>(false);
  const [diffChanges, setDiffChanges] = useState<Change[]>([]);
  const [ideConsole, setIdeConsole] = useState<string[]>([
    '[IDE KERNEL] TypeScript 5.8 language server attached (PID: 14820)',
    '[IDE KERNEL] Prettier and ESLint rules initialized with zero warnings.',
  ]);

  // =========================================================================
  // 3. OS TERMINAL STATE
  // =========================================================================
  const [terminalInput, setTerminalInput] = useState<string>('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'Rufflo Quantum OS Terminal v2.5 [Kernel 6.6.13-cloudrun]',
    'Connected to container runtime (Port: 3000 | User: autonomous-engineer)',
    'Type commands or click quick action buttons below.',
    '$ node -v && npm -v',
    'v22.14.0',
    '10.8.2',
    '$ ready for instruction.'
  ]);
  const [isTerminalRunning, setIsTerminalRunning] = useState<boolean>(false);

  // =========================================================================
  // 4. PACKAGES STATE
  // =========================================================================
  const [packageCatalog, setPackageCatalog] = useState<any[]>([]);
  const [packageSearch, setPackageSearch] = useState<string>('');
  const [packageCategory, setPackageCategory] = useState<string>('All');
  const [customPackageInput, setCustomPackageInput] = useState<string>('zustand');
  const [isInstallingPackage, setIsInstallingPackage] = useState<boolean>(false);
  const [packageInstallLog, setPackageInstallLog] = useState<string | null>(null);

  // =========================================================================
  // 5. REPOSITORIES STATE
  // =========================================================================
  const [repositories, setRepositories] = useState<any[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>('open-interpreter');
  const [selectedRepoFile, setSelectedRepoFile] = useState<string>('core/computer_use.py');
  const [repoMountNotification, setRepoMountNotification] = useState<string | null>(null);

  // =========================================================================
  // 6. WEBSITE & MOBILE VIEWPORT PREVIEW STATE
  // =========================================================================
  const [viewportMode, setViewportMode] = useState<'desktop' | 'laptop' | 'tablet' | 'mobile'>('desktop');
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'amber' | 'emerald'>('dark');
  const [previewActiveTab, setPreviewActiveTab] = useState<'canvas' | 'dom' | 'network' | 'console'>('canvas');

  // =========================================================================
  // INITIAL DATA FETCHING
  // =========================================================================
  useEffect(() => {
    fetchApplications();
    fetchPackages();
    fetchRepositories();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/developer/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (e) {
      console.warn('Failed to load computer applications:', e);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/developer/packages');
      if (res.ok) {
        const data = await res.json();
        setPackageCatalog(data.catalog || []);
      }
    } catch (e) {
      console.warn('Failed to load package catalog:', e);
    }
  };

  const fetchRepositories = async () => {
    try {
      const res = await fetch('/api/developer/repositories');
      if (res.ok) {
        const data = await res.json();
        setRepositories(data.repositories || []);
      }
    } catch (e) {
      console.warn('Failed to load repositories:', e);
    }
  };

  // Re-calculate diff whenever editorContent changes
  useEffect(() => {
    try {
      const diff = diffLines(originalContent, editorContent);
      setDiffChanges(diff);
    } catch (e) {
      console.warn('Diff calculation error:', e);
    }
  }, [editorContent, originalContent]);

  // =========================================================================
  // ACTION HANDLERS
  // =========================================================================
  const handleExecuteAppAction = async (actionId?: string, customCmd?: string) => {
    soundFx.playClick();
    setIsExecutingAppAction(true);
    try {
      const res = await fetch('/api/developer/execute-app-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          actionId: actionId || 'auto_run',
          customCommand: customCmd,
          agentId: 'michael'
        })
      });
      const data = await res.json();
      if (data.success) {
        setAppActionLogs(prev => [
          `[${new Date().toLocaleTimeString()}] Autonomous Run (${selectedAppId}): ${data.output}`,
          ...prev
        ]);
        soundFx.playSuccessChime();
      } else {
        setAppActionLogs(prev => [
          `[${new Date().toLocaleTimeString()}] Error: ${data.error || 'Execution failed'}`,
          ...prev
        ]);
      }
    } catch (err: any) {
      setAppActionLogs(prev => [
        `[${new Date().toLocaleTimeString()}] Network error: ${err.message}`,
        ...prev
      ]);
    } finally {
      setIsExecutingAppAction(false);
    }
  };

  const handleRunTerminalCommand = async (cmdToRun?: string) => {
    const command = cmdToRun || terminalInput;
    if (!command.trim()) return;
    soundFx.playClick();
    setIsTerminalRunning(true);
    setTerminalLogs(prev => [...prev, `$ ${command}`]);
    setTerminalInput('');

    try {
      const res = await fetch('/api/developer/execute-app-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: 'terminal',
          customCommand: command
        })
      });
      const data = await res.json();
      if (data.success) {
        const lines = data.output.split('\n');
        setTerminalLogs(prev => [...prev, ...lines]);
        soundFx.playSuccessChime();
      } else {
        setTerminalLogs(prev => [...prev, `[ERROR] ${data.error}`]);
      }
    } catch (err: any) {
      setTerminalLogs(prev => [...prev, `[NETWORK ERROR] ${err.message}`]);
    } finally {
      setIsTerminalRunning(false);
    }
  };

  const handleInstallPackage = async (pkgName: string) => {
    if (!pkgName.trim()) return;
    soundFx.playClick();
    setIsInstallingPackage(true);
    setPackageInstallLog(`[NPM INSTALL] Running npm install ${pkgName} --no-audit...`);

    try {
      const res = await fetch('/api/developer/packages/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName: pkgName })
      });
      const data = await res.json();
      if (data.success) {
        setPackageInstallLog(`[SUCCESS] Package "${pkgName}" installed in ${data.durationMs}ms.\n${data.output}`);
        soundFx.playSuccessChime();
        fetchPackages();
      } else {
        setPackageInstallLog(`[FAILED] ${data.error || 'Failed to install'}`);
      }
    } catch (err: any) {
      setPackageInstallLog(`[NETWORK ERROR] ${err.message}`);
    } finally {
      setIsInstallingPackage(false);
    }
  };

  const handleInstallBatchPackages = async (packagesToInstall?: string[]) => {
    const uninstalled = packageCatalog.filter(p => !p.installed).map(p => p.name);
    const targetList = packagesToInstall || (uninstalled.length > 0 ? uninstalled : ['next']);
    soundFx.playClick();
    setIsInstallingPackage(true);
    setPackageInstallLog(`[NPM BATCH] Installing ${targetList.length} packages: ${targetList.join(', ')}...`);

    try {
      const res = await fetch('/api/developer/packages/install-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageNames: targetList })
      });
      const data = await res.json();
      if (data.success) {
        setPackageInstallLog(`[SUCCESS] Installed ${data.totalInstalled || targetList.length} packages in ${data.durationMs}ms.\n${data.output}`);
        soundFx.playSuccessChime();
        fetchPackages();
      } else {
        setPackageInstallLog(`[FAILED] ${data.error || 'Failed batch install'}`);
      }
    } catch (err: any) {
      setPackageInstallLog(`[NETWORK ERROR] ${err.message}`);
    } finally {
      setIsInstallingPackage(false);
    }
  };

  const handleMountRepoTemplate = async (repoId: string, filePath?: string) => {
    soundFx.playClick();
    try {
      const res = await fetch('/api/developer/mount-repo-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId, targetFile: filePath })
      });
      const data = await res.json();
      if (data.success) {
        setActiveFilePath(data.mountedFile);
        setEditorContent(data.code);
        setOriginalContent(data.code);
        setRepoMountNotification(`✓ Mounted ${data.mountedFile} from ${data.repoName} into IDE Editor!`);
        soundFx.playSuccessChime();
        setActiveTab('ide');
        setTimeout(() => setRepoMountNotification(null), 5000);
      }
    } catch (e: any) {
      console.error('Failed to mount repository template:', e);
    }
  };

  const handleSendPostman = async () => {
    soundFx.playClick();
    try {
      const res = await fetch(postmanUrl, { method: postmanMethod });
      const data = await res.json();
      setPostmanResponse({
        status: res.status,
        statusText: res.statusText,
        time: '18ms',
        headers: { 'content-type': 'application/json' },
        body: data
      });
      soundFx.playSuccessChime();
    } catch (err: any) {
      setPostmanResponse({ status: 500, error: err.message });
    }
  };

  const handleExecuteSql = () => {
    soundFx.playClick();
    setSqlResult({
      rows: [
        { id: 'michael', name: 'Michael Scott', role: 'Floor Orchestrator', status: 'active', authority: 10 },
        { id: 'dwight', name: 'Dwight Schrute', role: 'Security Auditor', status: 'active', authority: 9 },
        { id: 'toby', name: 'Toby Flenderson', role: 'DevOps & Self-Healing', status: 'active', authority: 8 },
        { id: 'ruflo_coder', name: 'Ruflo Coder', role: 'Full-Stack Engineer', status: 'active', authority: 9 },
        { id: 'stanley', name: 'Stanley Hudson', role: 'OSINT & Repo Inspector', status: 'idle', authority: 7 },
      ],
      executionTimeMs: 3.4,
      status: 'QUERY EXECUTED SUCCESSFULLY'
    });
    soundFx.playSuccessChime();
  };

  const selectedApp = applications.find(a => a.id === selectedAppId) || applications[0];
  const selectedRepo = repositories.find(r => r.id === selectedRepoId) || repositories[0];
  const currentRepoFileObj = selectedRepo?.keyFiles?.find((f: any) => f.path === selectedRepoFile) || selectedRepo?.keyFiles?.[0];

  const filteredPackages = packageCatalog.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(packageSearch.toLowerCase()) || p.desc.toLowerCase().includes(packageSearch.toLowerCase());
    const matchesCategory = packageCategory === 'All' || p.category === packageCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full bg-[#181615] text-[#ebdbb2] font-sans overflow-hidden">
      {/* =================================================================== */}
      {/* TOP HEADER & TELEMETRY                                              */}
      {/* =================================================================== */}
      <div className="bg-[#1d2021] border-b border-[#3c3836] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fabd2f]/10 border border-[#fabd2f]/30 flex items-center justify-center text-[#fabd2f] shadow-inner">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-[#ebdbb2] tracking-wide">
                Autonomous Developer Computer & Applications Suite
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#b8bb26]/20 text-[#b8bb26] border border-[#b8bb26]/40 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b8bb26] animate-pulse" />
                ALL SYSTEMS OPERATIONAL
              </span>
            </div>
            <p className="text-xs text-[#a89984] mt-0.5">
              Full Human Developer Ecosystem: IDE • Terminal • Chromium • DB Studio • Postman • Git • Docker • Figma • Mobile Simulator • Packages & Repos
            </p>
          </div>
        </div>

        {/* Global Quick Telemetry Badges */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-2.5 py-1 rounded bg-[#282828] border border-[#3c3836] flex items-center gap-1.5 font-mono text-[11px]">
            <Activity className="w-3.5 h-3.5 text-[#83a598]" />
            <span className="text-[#a89984]">Apps Active:</span>
            <span className="text-[#83a598] font-bold">{applications.length || 9}/9</span>
          </div>
          <div className="px-2.5 py-1 rounded bg-[#282828] border border-[#3c3836] flex items-center gap-1.5 font-mono text-[11px]">
            <HardDrive className="w-3.5 h-3.5 text-[#fe8019]" />
            <span className="text-[#a89984]">RAM:</span>
            <span className="text-[#fe8019] font-bold">1,780 MB / 4 GB</span>
          </div>
          <div className="px-2.5 py-1 rounded bg-[#282828] border border-[#3c3836] flex items-center gap-1.5 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8ec07c]" />
            <span className="text-[#a89984]">Zero-Trust:</span>
            <span className="text-[#8ec07c] font-bold">DWIGHT PASS</span>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* NAVIGATION TABS BAR                                                 */}
      {/* =================================================================== */}
      <div className="bg-[#282828] border-b border-[#3c3836] px-4 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-1 py-1.5">
          <button
            onClick={() => { soundFx.playClick(); setActiveTab('apps_computer'); }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'apps_computer'
                ? 'bg-[#fabd2f] text-[#1d2021] shadow-md font-extrabold'
                : 'text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#32302f]'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Computer & Apps</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-mono">9</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(); setActiveTab('ide'); }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ide'
                ? 'bg-[#fabd2f] text-[#1d2021] shadow-md font-extrabold'
                : 'text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#32302f]'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>IDE & Code Diff</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(); setActiveTab('terminal'); }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'terminal'
                ? 'bg-[#fabd2f] text-[#1d2021] shadow-md font-extrabold'
                : 'text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#32302f]'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>OS Terminal & Shell</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(); setActiveTab('packages'); }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'packages'
                ? 'bg-[#fabd2f] text-[#1d2021] shadow-md font-extrabold'
                : 'text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#32302f]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Package Manager</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(); setActiveTab('repos'); }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'repos'
                ? 'bg-[#fabd2f] text-[#1d2021] shadow-md font-extrabold'
                : 'text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#32302f]'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Repo Hub & Code</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(); setActiveTab('website_builder'); }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'website_builder'
                ? 'bg-[#fabd2f] text-[#1d2021] shadow-md font-extrabold'
                : 'text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#32302f]'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Website & Mobile Preview</span>
          </button>
        </div>

        {repoMountNotification && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#b8bb26] font-bold bg-[#b8bb26]/10 px-3 py-1 rounded border border-[#b8bb26]/30 animate-pulse">
            <Check className="w-3.5 h-3.5" />
            <span>{repoMountNotification}</span>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* MAIN VIEWPORT CONTENT                                               */}
      {/* =================================================================== */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* TAB 1: COMPUTER & APPLICATIONS VIEW */}
        {activeTab === 'apps_computer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
            {/* Sidebar: App Switcher */}
            <div className="lg:col-span-3 bg-[#1d2021] border border-[#3c3836] rounded-xl p-3 flex flex-col gap-2">
              <div className="text-xs font-bold text-[#928374] uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                <span>Computer Applications</span>
                <span className="text-[#8ec07c]">{applications.length} Running</span>
              </div>

              <div className="space-y-1.5 overflow-y-auto flex-1">
                {applications.map(app => {
                  const isSelected = app.id === selectedAppId;
                  return (
                    <button
                      key={app.id}
                      onClick={() => { soundFx.playClick(); setSelectedAppId(app.id); }}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#282828] border-[#fabd2f] shadow text-[#ebdbb2]'
                          : 'bg-[#181615] border-[#32302f] hover:border-[#3c3836] text-[#a89984] hover:text-[#ebdbb2]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-2 rounded-md ${isSelected ? 'bg-[#fabd2f]/20 text-[#fabd2f]' : 'bg-[#282828] text-[#928374]'}`}>
                          {app.id === 'vscode' && <Code2 className="w-4 h-4" />}
                          {app.id === 'chromium' && <Globe className="w-4 h-4" />}
                          {app.id === 'terminal' && <Terminal className="w-4 h-4" />}
                          {app.id === 'db_studio' && <Database className="w-4 h-4" />}
                          {app.id === 'postman' && <Zap className="w-4 h-4" />}
                          {app.id === 'git_client' && <FolderGit2 className="w-4 h-4" />}
                          {app.id === 'docker' && <Server className="w-4 h-4" />}
                          {app.id === 'figma_canvas' && <Layout className="w-4 h-4" />}
                          {app.id === 'mobile_emulator' && <Smartphone className="w-4 h-4" />}
                          {app.id === 'cicd_pipeline' && <Play className="w-4 h-4" />}
                          {app.id === 'telemetry_monitor' && <Activity className="w-4 h-4" />}
                          {app.id === 'redis_workbench' && <Database className="w-4 h-4" />}
                          {app.id === 'swagger_docs' && <FileText className="w-4 h-4" />}
                          {app.id === 'security_scanner' && <ShieldCheck className="w-4 h-4" />}
                          {app.id === 'lighthouse_audit' && <Zap className="w-4 h-4" />}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-xs truncate">{app.name}</div>
                          <div className="text-[10px] text-[#928374] truncate">{app.category} • PID {app.pid}</div>
                        </div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-[#8ec07c]" />
                    </button>
                  );
                })}
              </div>

              {/* Autonomous Mode Switch */}
              <div className="mt-2 pt-2 border-t border-[#32302f] flex items-center justify-between text-xs px-2">
                <span className="text-[#a89984] font-bold">Autonomous Control:</span>
                <button
                  onClick={() => { soundFx.playClick(); setAutonomousAppMode(!autonomousAppMode); }}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    autonomousAppMode ? 'bg-[#b8bb26]/20 text-[#b8bb26] border border-[#b8bb26]/40' : 'bg-[#928374]/20 text-[#928374]'
                  }`}
                >
                  {autonomousAppMode ? '⚡ AGENTS RUNNING' : 'MANUAL'}
                </button>
              </div>
            </div>

            {/* Main Application Screen & Workspace */}
            <div className="lg:col-span-9 bg-[#1d2021] border border-[#3c3836] rounded-xl flex flex-col overflow-hidden">
              {/* Application Top Bar */}
              <div className="bg-[#282828] border-b border-[#3c3836] p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-[#fabd2f] flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    {selectedApp?.name || 'Application Workspace'}
                  </span>
                  <span className="text-xs text-[#928374] font-mono">
                    {selectedApp?.version} • {selectedApp?.memoryMB} MB RAM • PID {selectedApp?.pid}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExecuteAppAction('auto_run')}
                    disabled={isExecutingAppAction}
                    className="px-3 py-1.5 bg-[#8ec07c] hover:bg-[#8ec07c]/90 text-[#1d2021] font-bold text-xs rounded-lg flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isExecutingAppAction ? 'Agent Executing...' : 'Autonomous Agent Run'}</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Interactive App Interface */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {/* 1. VS CODE STUDIO INTERFACE */}
                {selectedAppId === 'vscode' && (
                  <div className="space-y-3">
                    <div className="bg-[#141312] border border-[#3c3836] rounded-lg p-3 font-mono text-xs">
                      <div className="flex items-center justify-between border-b border-[#282828] pb-2 mb-2 text-[#928374]">
                        <span>/workspace/server/routes/developer-suite.routes.ts</span>
                        <span>TypeScript 5.8 • UTF-8</span>
                      </div>
                      <pre className="text-[#ebdbb2] leading-relaxed overflow-x-auto">
                        <code>{sampleFiles[0].content}</code>
                      </pre>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { soundFx.playClick(); setActiveTab('ide'); }}
                        className="px-3 py-1.5 bg-[#fabd2f] text-[#1d2021] rounded-lg font-bold text-xs flex items-center gap-1.5"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Open in Full IDE & Diff Viewer</span>
                      </button>
                      <button
                        onClick={() => handleExecuteAppAction('format_code')}
                        className="px-3 py-1.5 bg-[#282828] text-[#ebdbb2] border border-[#3c3836] rounded-lg text-xs hover:bg-[#32302f]"
                      >
                        Auto-Format (Prettier)
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. CHROMIUM DEVTOOLS INTERFACE */}
                {selectedAppId === 'chromium' && (
                  <div className="space-y-3">
                    {/* Browser Address Bar */}
                    <div className="flex items-center gap-2 bg-[#141312] p-2 rounded-lg border border-[#3c3836]">
                      <span className="text-xs font-bold text-[#8ec07c]">HTTPS</span>
                      <input
                        type="text"
                        value={browserUrlBar}
                        onChange={(e) => setBrowserUrlBar(e.target.value)}
                        className="flex-1 bg-transparent text-xs text-[#ebdbb2] font-mono outline-none"
                      />
                      <button
                        onClick={() => handleExecuteAppAction('inspect_dom', `navigate ${browserUrlBar}`)}
                        className="px-2.5 py-1 bg-[#282828] hover:bg-[#32302f] text-xs font-bold rounded text-[#fabd2f]"
                      >
                        Navigate
                      </button>
                    </div>

                    {/* Rendered Viewport & DOM Inspector */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-[#181615] border border-[#3c3836] rounded-lg p-4">
                        <div className="text-xs font-bold text-[#fabd2f] mb-2 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" />
                          <span>Live Webpage Rendering Screen</span>
                        </div>
                        <div className="p-4 bg-[#282828] rounded border border-[#32302f] space-y-2">
                          <div className="font-extrabold text-sm text-[#ebdbb2]">Dunder Mifflin Enterprise Portal</div>
                          <p className="text-xs text-[#a89984]">Serving autonomous operations across 12 floor agents.</p>
                          <div className="flex gap-2 text-xs">
                            <span className="px-2 py-0.5 rounded bg-[#8ec07c]/20 text-[#8ec07c] font-bold">HTTP 200 OK</span>
                            <span className="px-2 py-0.5 rounded bg-[#83a598]/20 text-[#83a598] font-bold">14ms TTFB</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#141312] border border-[#3c3836] rounded-lg p-3 font-mono text-xs">
                        <div className="text-xs font-bold text-[#83a598] mb-2">DOM Elements Tree Inspector</div>
                        <div className="space-y-1 text-[#a89984]">
                          <div>&lt;html lang=&quot;en&quot;&gt;</div>
                          <div className="pl-3">&lt;head&gt; &lt;title&gt;Rufflo Fleet&lt;/title&gt; &lt;/head&gt;</div>
                          <div className="pl-3">&lt;body class=&quot;bg-[#1d2021]&quot;&gt;</div>
                          <div className="pl-6 text-[#ebdbb2]">&lt;div id=&quot;root&quot;&gt; ... 142 elements &lt;/div&gt;</div>
                          <div className="pl-3">&lt;/body&gt;</div>
                          <div>&lt;/html&gt;</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. OS TERMINAL INTERFACE */}
                {selectedAppId === 'terminal' && (
                  <div className="space-y-3">
                    <div className="bg-[#141312] border border-[#3c3836] rounded-lg p-3 font-mono text-xs h-64 overflow-y-auto space-y-1">
                      {terminalLogs.slice(-15).map((line, idx) => (
                        <div key={idx} className={line.startsWith('$') ? 'text-[#fabd2f] font-bold' : line.includes('ERROR') ? 'text-[#fb4934]' : 'text-[#a89984]'}>
                          {line}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Enter shell command (e.g. npm run lint, git status, ps aux)..."
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRunTerminalCommand()}
                        className="flex-1 bg-[#141312] border border-[#3c3836] rounded-lg px-3 py-2 text-xs font-mono text-[#ebdbb2] outline-none focus:border-[#fabd2f]"
                      />
                      <button
                        onClick={() => handleRunTerminalCommand()}
                        disabled={isTerminalRunning}
                        className="px-4 py-2 bg-[#fabd2f] text-[#1d2021] font-bold text-xs rounded-lg flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Run</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. DATABASE STUDIO INTERFACE */}
                {selectedAppId === 'db_studio' && (
                  <div className="space-y-3">
                    <div className="bg-[#141312] border border-[#3c3836] rounded-lg p-3 font-mono text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-[#83a598]">SQL Query Console (PostgreSQL 16)</span>
                        <button
                          onClick={handleExecuteSql}
                          className="px-2.5 py-1 bg-[#8ec07c] text-[#1d2021] font-bold rounded text-xs"
                        >
                          Execute Query
                        </button>
                      </div>
                      <textarea
                        value={sqlQuery}
                        onChange={(e) => setSqlQuery(e.target.value)}
                        rows={2}
                        className="w-full bg-[#181615] border border-[#32302f] rounded p-2 text-xs text-[#ebdbb2] outline-none font-mono"
                      />
                    </div>

                    {sqlResult && (
                      <div className="bg-[#141312] border border-[#3c3836] rounded-lg overflow-hidden text-xs">
                        <table className="w-full text-left font-mono">
                          <thead className="bg-[#282828] text-[#fabd2f] border-b border-[#3c3836]">
                            <tr>
                              <th className="p-2">ID</th>
                              <th className="p-2">NAME</th>
                              <th className="p-2">ROLE</th>
                              <th className="p-2">STATUS</th>
                              <th className="p-2">AUTHORITY</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sqlResult.rows.map((row: any, i: number) => (
                              <tr key={i} className="border-b border-[#282828] text-[#ebdbb2]">
                                <td className="p-2 text-[#83a598] font-bold">{row.id}</td>
                                <td className="p-2">{row.name}</td>
                                <td className="p-2 text-[#b8bb26]">{row.role}</td>
                                <td className="p-2"><span className="px-1.5 py-0.5 rounded bg-[#b8bb26]/20 text-[#b8bb26]">{row.status}</span></td>
                                <td className="p-2 text-[#fabd2f]">Level {row.authority}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. POSTMAN API TESTER INTERFACE */}
                {selectedAppId === 'postman' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-[#141312] p-2 rounded-lg border border-[#3c3836]">
                      <select
                        value={postmanMethod}
                        onChange={(e) => setPostmanMethod(e.target.value as any)}
                        className="bg-[#282828] text-xs font-bold text-[#fabd2f] px-2 py-1 rounded border border-[#3c3836] outline-none"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                      </select>
                      <input
                        type="text"
                        value={postmanUrl}
                        onChange={(e) => setPostmanUrl(e.target.value)}
                        className="flex-1 bg-transparent text-xs text-[#ebdbb2] font-mono outline-none"
                      />
                      <button
                        onClick={handleSendPostman}
                        className="px-4 py-1.5 bg-[#fe8019] text-[#1d2021] font-bold text-xs rounded hover:bg-[#fe8019]/90"
                      >
                        Send Request
                      </button>
                    </div>

                    {postmanResponse && (
                      <div className="bg-[#141312] border border-[#3c3836] rounded-lg p-3 font-mono text-xs">
                        <div className="flex items-center justify-between border-b border-[#282828] pb-2 mb-2">
                          <span className="text-[#8ec07c] font-bold">Status: {postmanResponse.status} {postmanResponse.statusText || 'OK'}</span>
                          <span className="text-[#928374]">Latency: {postmanResponse.time}</span>
                        </div>
                        <pre className="text-[#ebdbb2] max-h-48 overflow-y-auto leading-relaxed">
                          <code>{JSON.stringify(postmanResponse.body, null, 2)}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. GIT VERSION CONTROL INTERFACE */}
                {selectedAppId === 'git_client' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-[#141312] p-3 rounded-lg border border-[#3c3836]">
                        <div className="font-bold text-[#fabd2f] mb-1">Active Git Branch</div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded bg-[#fabd2f]/20 text-[#fabd2f] font-mono font-bold">{gitBranch}</span>
                          <span className="text-[#8ec07c]">Up to date with origin/main</span>
                        </div>
                      </div>
                      <div className="bg-[#141312] p-3 rounded-lg border border-[#3c3836]">
                        <div className="font-bold text-[#83a598] mb-1">Working Tree Status</div>
                        <div className="text-[#ebdbb2]">Clean tree, 0 untracked files, 0 merge conflicts.</div>
                      </div>
                    </div>

                    <div className="bg-[#141312] p-3 rounded-lg border border-[#3c3836] space-y-2">
                      <label className="text-xs font-bold text-[#a89984]">Commit Message</label>
                      <input
                        type="text"
                        value={gitCommitMsg}
                        onChange={(e) => setGitCommitMsg(e.target.value)}
                        className="w-full bg-[#181615] border border-[#32302f] rounded p-2 text-xs font-mono text-[#ebdbb2] outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleExecuteAppAction('git_status')}
                          className="px-3 py-1.5 bg-[#282828] text-xs font-bold rounded border border-[#3c3836]"
                        >
                          git status
                        </button>
                        <button
                          onClick={() => handleExecuteAppAction('git_commit', `git commit -m "${gitCommitMsg}"`)}
                          className="px-3 py-1.5 bg-[#8ec07c] text-[#1d2021] text-xs font-bold rounded"
                        >
                          Commit & Push
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. DOCKER CONTAINER ENGINE INTERFACE */}
                {selectedAppId === 'docker' && (
                  <div className="space-y-3">
                    <div className="bg-[#141312] border border-[#3c3836] rounded-lg p-3 font-mono text-xs">
                      <div className="font-bold text-[#83a598] mb-2">Active Containers (docker ps)</div>
                      <div className="space-y-2">
                        <div className="p-2 bg-[#282828] rounded border border-[#32302f] flex items-center justify-between">
                          <div>
                            <div className="text-[#ebdbb2] font-bold">rufflo-enterprise-fleet</div>
                            <div className="text-[10px] text-[#928374]">Image: asia.gcr.io/rufflo-os/applet:latest • Up 4 hours</div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded bg-[#8ec07c]/20 text-[#8ec07c] font-bold">0.0.0.0:3000-&gt;3000/tcp</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. FIGMA CANVAS EXPORTER INTERFACE */}
                {selectedAppId === 'figma_canvas' && (
                  <div className="space-y-3">
                    <div className="bg-[#141312] border border-[#3c3836] rounded-lg p-3 text-xs">
                      <div className="font-bold text-[#fabd2f] mb-2 flex items-center gap-1.5">
                        <Layout className="w-3.5 h-3.5" />
                        <span>Tailwind CSS Design Tokens</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[11px]">
                        <div className="p-2 bg-[#181615] rounded border border-[#282828]">
                          <div className="text-[#fabd2f] font-bold">#fabd2f</div>
                          <div className="text-[#a89984]">Primary Yellow</div>
                        </div>
                        <div className="p-2 bg-[#181615] rounded border border-[#282828]">
                          <div className="text-[#8ec07c] font-bold">#8ec07c</div>
                          <div className="text-[#a89984]">Success Green</div>
                        </div>
                        <div className="p-2 bg-[#181615] rounded border border-[#282828]">
                          <div className="text-[#83a598] font-bold">#83a598</div>
                          <div className="text-[#a89984]">Info Blue</div>
                        </div>
                        <div className="p-2 bg-[#181615] rounded border border-[#282828]">
                          <div className="text-[#fe8019] font-bold">#fe8019</div>
                          <div className="text-[#a89984]">Accent Orange</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 9. MOBILE APP SIMULATOR INTERFACE */}
                {selectedAppId === 'mobile_emulator' && (
                  <div className="flex justify-center p-2">
                    <div className="w-72 bg-[#141312] border-4 border-[#3c3836] rounded-3xl p-3 shadow-2xl flex flex-col gap-2">
                      <div className="w-16 h-3 bg-[#282828] rounded-full mx-auto" />
                      <div className="flex-1 bg-[#1d2021] rounded-2xl p-3 text-xs flex flex-col justify-between">
                        <div>
                          <div className="text-center font-bold text-[#fabd2f] mb-1">Rufflo Mobile App</div>
                          <p className="text-[10px] text-[#a89984] text-center">Touch gesture and responsive testing active.</p>
                        </div>
                        <div className="p-2 bg-[#282828] rounded text-center font-bold text-xs text-[#8ec07c]">
                          Autonomous Mobile Sync: OK
                        </div>
                      </div>
                      <div className="w-24 h-1 bg-[#3c3836] rounded-full mx-auto" />
                    </div>
                  </div>
                )}

                {/* 10. CI/CD PIPELINE INTERFACE */}
                {selectedAppId === 'cicd_pipeline' && (
                  <div className="space-y-3">
                    <div className="bg-[#141312] border border-[#3c3836] rounded-lg p-4 font-mono text-xs">
                      <div className="flex items-center justify-between border-b border-[#282828] pb-2 mb-3">
                        <div className="font-bold text-[#fabd2f] flex items-center gap-2">
                          <Play className="w-4 h-4" />
                          <span>GitHub Actions Pipeline • Automated Validation Runner</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-[#8ec07c]/20 text-[#8ec07c] font-bold">WORKFLOW_PASSING</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 rounded bg-[#181615] border border-[#282828]">
                          <span className="text-[#ebdbb2]">1. TypeScript Lint & Typecheck (`npm run lint`)</span>
                          <span className="text-[#8ec07c] font-bold">SUCCESS (0 errors)</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-[#181615] border border-[#282828]">
                          <span className="text-[#ebdbb2]">2. Security & Zero-Trust Audit (`npm test`)</span>
                          <span className="text-[#8ec07c] font-bold">100% PASSED</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-[#181615] border border-[#282828]">
                          <span className="text-[#ebdbb2]">3. Production Bundle Packaging (`vite build`)</span>
                          <span className="text-[#8ec07c] font-bold">READY FOR DEPLOY</span>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => handleExecuteAppAction('run_full_pipeline')}
                          className="px-3 py-1.5 bg-[#fabd2f] text-[#1d2021] font-bold rounded-lg text-xs flex items-center gap-1.5 shadow"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Execute Full CI/CD Suite</span>
                        </button>
                        <button
                          onClick={() => handleExecuteAppAction('run_security_audit')}
                          className="px-3 py-1.5 bg-[#282828] border border-[#3c3836] text-[#ebdbb2] font-bold rounded-lg text-xs"
                        >
                          Run Security Suite
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 11. TELEMETRY & OBSERVABILITY MONITOR */}
                {selectedAppId === 'telemetry_monitor' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-[#181615] border border-[#3c3836] rounded-xl p-3">
                        <div className="text-[11px] text-[#928374] font-bold">HEAP ALLOCATION</div>
                        <div className="text-xl font-extrabold text-[#fabd2f] mt-1 font-mono">114.2 MB</div>
                        <div className="text-[10px] text-[#8ec07c] mt-1">Healthy • Max 4096 MB</div>
                      </div>
                      <div className="bg-[#181615] border border-[#3c3836] rounded-xl p-3">
                        <div className="text-[11px] text-[#928374] font-bold">ACTIVE PROCESSES</div>
                        <div className="text-xl font-extrabold text-[#8ec07c] mt-1 font-mono">{applications.length} APPS</div>
                        <div className="text-[10px] text-[#a89984] mt-1">Zero zombie threads</div>
                      </div>
                      <div className="bg-[#181615] border border-[#3c3836] rounded-xl p-3">
                        <div className="text-[11px] text-[#928374] font-bold">API STATUS</div>
                        <div className="text-xl font-extrabold text-[#83a598] mt-1 font-mono">200 OK</div>
                        <div className="text-[10px] text-[#8ec07c] mt-1">Port 3000 Ingress Ready</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExecuteAppAction('profile_memory')}
                        className="px-3 py-1.5 bg-[#8ec07c] text-[#1d2021] font-bold rounded-lg text-xs flex items-center gap-1.5"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Profile Memory Allocation</span>
                      </button>
                      <button
                        onClick={() => handleExecuteAppAction('ping_services')}
                        className="px-3 py-1.5 bg-[#282828] border border-[#3c3836] text-[#ebdbb2] font-bold rounded-lg text-xs"
                      >
                        Ping All Endpoints
                      </button>
                    </div>
                  </div>
                )}

                {/* 12. REDIS IN-MEMORY CACHE WORKBENCH */}
                {selectedAppId === 'redis_workbench' && (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="bg-[#141312] border border-[#3c3836] rounded-lg p-3">
                      <div className="flex items-center justify-between pb-2 border-b border-[#282828] mb-3">
                        <div className="font-bold text-[#fb4934] flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          <span>Redis Server v7.4.1 • Port 6379 Active</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#8ec07c]/20 text-[#8ec07c] font-bold">IN_MEMORY_OPTIMAL</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                        <div className="p-2 rounded bg-[#181615] border border-[#282828]">
                          <div className="text-[10px] text-[#928374]">CACHE HIT RATE</div>
                          <div className="text-base font-extrabold text-[#8ec07c]">98.4%</div>
                        </div>
                        <div className="p-2 rounded bg-[#181615] border border-[#282828]">
                          <div className="text-[10px] text-[#928374]">ACTIVE SESSIONS</div>
                          <div className="text-base font-extrabold text-[#fabd2f]">1,240 KEYS</div>
                        </div>
                        <div className="p-2 rounded bg-[#181615] border border-[#282828]">
                          <div className="text-[10px] text-[#928374]">MEMORY USAGE</div>
                          <div className="text-base font-extrabold text-[#83a598]">96 MB</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleExecuteAppAction('flush_cache')}
                          className="px-3 py-1.5 bg-[#fb4934] text-[#1d2021] font-bold rounded-lg text-xs"
                        >
                          Flush Expired Cache
                        </button>
                        <button
                          onClick={() => handleExecuteAppAction('inspect_cache_hit_rate')}
                          className="px-3 py-1.5 bg-[#282828] border border-[#3c3836] text-[#ebdbb2] font-bold rounded-lg text-xs"
                        >
                          Inspect Cache Telemetry
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 13. OPENAPI 3.1 & SWAGGER DOCS EXPLORER */}
                {selectedAppId === 'swagger_docs' && (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="bg-[#141312] border border-[#3c3836] rounded-lg p-3">
                      <div className="flex items-center justify-between pb-2 border-b border-[#282828] mb-3">
                        <div className="font-bold text-[#8ec07c] flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>OpenAPI 3.1 Schema Explorer • 24 Registered Endpoints</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#8ec07c]/20 text-[#8ec07c] font-bold">SPEC_VALID</span>
                      </div>
                      <div className="space-y-1.5 mb-3">
                        <div className="p-2 rounded bg-[#181615] border border-[#282828] flex items-center justify-between">
                          <span className="text-[#8ec07c] font-bold">GET /api/developer/status</span>
                          <span className="text-[#928374]">Full developer suite telemetry</span>
                        </div>
                        <div className="p-2 rounded bg-[#181615] border border-[#282828] flex items-center justify-between">
                          <span className="text-[#fabd2f] font-bold">POST /api/developer/packages/install-batch</span>
                          <span className="text-[#928374]">Autonomous npm stack deployment</span>
                        </div>
                        <div className="p-2 rounded bg-[#181615] border border-[#282828] flex items-center justify-between">
                          <span className="text-[#8ec07c] font-bold">GET /api/developer/repos/catalog</span>
                          <span className="text-[#928374]">Curated open-source agent repos</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleExecuteAppAction('generate_openapi_spec')}
                          className="px-3 py-1.5 bg-[#8ec07c] text-[#1d2021] font-bold rounded-lg text-xs"
                        >
                          Export OpenAPI 3.1 Spec
                        </button>
                        <button
                          onClick={() => handleExecuteAppAction('export_client_sdk')}
                          className="px-3 py-1.5 bg-[#282828] border border-[#3c3836] text-[#ebdbb2] font-bold rounded-lg text-xs"
                        >
                          Synthesize TypeScript SDK Client
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 14. ZERO-TRUST & OWASP SECURITY GUARD */}
                {selectedAppId === 'security_scanner' && (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="bg-[#141312] border border-[#3c3836] rounded-lg p-3">
                      <div className="flex items-center justify-between pb-2 border-b border-[#282828] mb-3">
                        <div className="font-bold text-[#fabd2f] flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#8ec07c]" />
                          <span>Zero-Trust Security Gate • AST Static Analysis</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#8ec07c]/20 text-[#8ec07c] font-bold">PASSING 100%</span>
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between p-2 rounded bg-[#181615] border border-[#282828]">
                          <span>Dependency CVE Vulnerability Audit</span>
                          <span className="text-[#8ec07c] font-bold">0 VULNERABILITIES</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-[#181615] border border-[#282828]">
                          <span>Secrets & Private Key Leakage Scanner</span>
                          <span className="text-[#8ec07c] font-bold">CLEAN (0 LEAKS)</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-[#181615] border border-[#282828]">
                          <span>Browser Dev Sandbox & CSP Enforcement</span>
                          <span className="text-[#8ec07c] font-bold">ENFORCED</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleExecuteAppAction('scan_cve_dependencies')}
                          className="px-3 py-1.5 bg-[#fabd2f] text-[#1d2021] font-bold rounded-lg text-xs"
                        >
                          Scan All Dependencies
                        </button>
                        <button
                          onClick={() => handleExecuteAppAction('scan_secrets')}
                          className="px-3 py-1.5 bg-[#282828] border border-[#3c3836] text-[#ebdbb2] font-bold rounded-lg text-xs"
                        >
                          Audit Repository Secrets
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 15. LIGHTHOUSE & CORE WEB VITALS ENGINE */}
                {selectedAppId === 'lighthouse_audit' && (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-[#181615] border border-[#3c3836] rounded-xl p-3 text-center">
                        <div className="text-[10px] text-[#928374] font-bold">PERFORMANCE</div>
                        <div className="text-2xl font-extrabold text-[#8ec07c] my-1">98</div>
                        <div className="text-[9px] text-[#8ec07c]">LCP 0.8s • Fast</div>
                      </div>
                      <div className="bg-[#181615] border border-[#3c3836] rounded-xl p-3 text-center">
                        <div className="text-[10px] text-[#928374] font-bold">ACCESSIBILITY</div>
                        <div className="text-2xl font-extrabold text-[#8ec07c] my-1">100</div>
                        <div className="text-[9px] text-[#8ec07c]">WCAG AA Passed</div>
                      </div>
                      <div className="bg-[#181615] border border-[#3c3836] rounded-xl p-3 text-center">
                        <div className="text-[10px] text-[#928374] font-bold">BEST PRACTICES</div>
                        <div className="text-2xl font-extrabold text-[#8ec07c] my-1">100</div>
                        <div className="text-[9px] text-[#8ec07c]">HTTPS & CSP Ready</div>
                      </div>
                      <div className="bg-[#181615] border border-[#3c3836] rounded-xl p-3 text-center">
                        <div className="text-[10px] text-[#928374] font-bold">SEO OPTIMIZED</div>
                        <div className="text-2xl font-extrabold text-[#8ec07c] my-1">96</div>
                        <div className="text-[9px] text-[#8ec07c]">Rich Structured Data</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExecuteAppAction('run_vitals_audit')}
                        className="px-3 py-1.5 bg-[#8ec07c] text-[#1d2021] font-bold rounded-lg text-xs"
                      >
                        Run Live Core Web Vitals Diagnostic
                      </button>
                      <button
                        onClick={() => handleExecuteAppAction('analyze_bundle_size')}
                        className="px-3 py-1.5 bg-[#282828] border border-[#3c3836] text-[#ebdbb2] font-bold rounded-lg text-xs"
                      >
                        Analyze Bundle Footprint
                      </button>
                    </div>
                  </div>
                )}

                {/* Live Action History Log */}
                {appActionLogs.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#32302f]">
                    <div className="text-xs font-bold text-[#928374] mb-1">Autonomous Execution Log:</div>
                    <div className="bg-[#141312] p-2.5 rounded border border-[#282828] text-xs font-mono space-y-1 text-[#a89984] max-h-32 overflow-y-auto">
                      {appActionLogs.map((log, i) => (
                        <div key={i}>{log}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FULL IDE & CODE DIFF VIEWER */}
        {activeTab === 'ide' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
            {/* File Tree Sidebar */}
            <div className="lg:col-span-3 bg-[#1d2021] border border-[#3c3836] rounded-xl p-3 flex flex-col gap-2">
              <div className="text-xs font-bold text-[#928374] uppercase tracking-wider px-2 py-1">Project Workspace Files</div>
              <div className="space-y-1 overflow-y-auto flex-1">
                {sampleFiles.map(file => {
                  const isCurrent = file.path === activeFilePath;
                  return (
                    <button
                      key={file.path}
                      onClick={() => {
                        soundFx.playClick();
                        setActiveFilePath(file.path);
                        setEditorContent(file.content);
                        setOriginalContent(file.content);
                      }}
                      className={`w-full text-left p-2 rounded-lg border text-xs font-mono transition-all flex items-center gap-2 ${
                        isCurrent
                          ? 'bg-[#282828] border-[#fabd2f] text-[#fabd2f] font-bold'
                          : 'bg-[#181615] border-[#32302f] hover:border-[#3c3836] text-[#a89984]'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{file.path}</span>
                    </button>
                  );
                })}
              </div>

              {/* Diff Toggle */}
              <div className="mt-2 pt-2 border-t border-[#32302f] flex items-center justify-between">
                <span className="text-xs font-bold text-[#ebdbb2]">Show Code Diff:</span>
                <button
                  onClick={() => { soundFx.playClick(); setShowDiffView(!showDiffView); }}
                  className={`px-2.5 py-1 rounded text-xs font-bold ${
                    showDiffView ? 'bg-[#fe8019] text-[#1d2021]' : 'bg-[#282828] text-[#a89984] border border-[#3c3836]'
                  }`}
                >
                  {showDiffView ? 'DIFF VIEW ACTIVE' : 'STANDARD VIEW'}
                </button>
              </div>
            </div>

            {/* Code Editor & Diff Display */}
            <div className="lg:col-span-9 bg-[#1d2021] border border-[#3c3836] rounded-xl flex flex-col overflow-hidden">
              <div className="bg-[#282828] border-b border-[#3c3836] p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs text-[#fabd2f]">
                  <Code2 className="w-4 h-4" />
                  <span className="font-bold">{activeFilePath}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      soundFx.playSuccessChime();
                      setOriginalContent(editorContent);
                      setIdeConsole(prev => [`[SAVED] File ${activeFilePath} saved & compiled without errors.`, ...prev]);
                    }}
                    className="px-3 py-1.5 bg-[#8ec07c] text-[#1d2021] font-bold text-xs rounded-lg flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save & Build</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 p-3 flex flex-col overflow-hidden">
                {!showDiffView ? (
                  <textarea
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    className="flex-1 bg-[#141312] border border-[#282828] rounded-lg p-4 font-mono text-xs text-[#ebdbb2] leading-relaxed outline-none resize-none"
                  />
                ) : (
                  <div className="flex-1 bg-[#141312] border border-[#282828] rounded-lg p-4 font-mono text-xs overflow-y-auto leading-relaxed">
                    <div className="text-xs font-bold text-[#fabd2f] mb-2">Line-by-Line Code Diff (diffLines)</div>
                    {diffChanges.map((part, index) => {
                      const color = part.added
                        ? 'bg-[#b8bb26]/20 text-[#b8bb26] border-l-2 border-[#b8bb26]'
                        : part.removed
                        ? 'bg-[#fb4934]/20 text-[#fb4934] border-l-2 border-[#fb4934] line-through'
                        : 'text-[#a89984]';
                      return (
                        <div key={index} className={`whitespace-pre-wrap px-2 py-0.5 ${color}`}>
                          {part.value}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* IDE Console Output */}
              <div className="h-24 bg-[#141312] border-t border-[#32302f] p-3 font-mono text-xs text-[#a89984] overflow-y-auto space-y-1">
                {ideConsole.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OS TERMINAL & SHELL */}
        {activeTab === 'terminal' && (
          <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-4 flex flex-col h-full gap-3">
            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-[#928374]">Quick Dev Scripts:</span>
              <button
                onClick={() => handleRunTerminalCommand('npm run lint')}
                className="px-2.5 py-1 rounded bg-[#282828] border border-[#3c3836] text-[#fabd2f] hover:bg-[#32302f] font-mono"
              >
                npm run lint
              </button>
              <button
                onClick={() => handleRunTerminalCommand('npm run build')}
                className="px-2.5 py-1 rounded bg-[#282828] border border-[#3c3836] text-[#8ec07c] hover:bg-[#32302f] font-mono"
              >
                npm run build
              </button>
              <button
                onClick={() => handleRunTerminalCommand('git status -s')}
                className="px-2.5 py-1 rounded bg-[#282828] border border-[#3c3836] text-[#83a598] hover:bg-[#32302f] font-mono"
              >
                git status
              </button>
              <button
                onClick={() => handleRunTerminalCommand('free -m')}
                className="px-2.5 py-1 rounded bg-[#282828] border border-[#3c3836] text-[#d3869b] hover:bg-[#32302f] font-mono"
              >
                free -m
              </button>
              <button
                onClick={() => handleRunTerminalCommand('node -v && npm -v')}
                className="px-2.5 py-1 rounded bg-[#282828] border border-[#3c3836] text-[#fe8019] hover:bg-[#32302f] font-mono"
              >
                node -v
              </button>
            </div>

            {/* Interactive Terminal Screen */}
            <div className="flex-1 bg-[#141312] border border-[#282828] rounded-lg p-4 font-mono text-xs overflow-y-auto space-y-1">
              {terminalLogs.map((log, index) => (
                <div
                  key={index}
                  className={`leading-relaxed ${
                    log.startsWith('$')
                      ? 'text-[#fabd2f] font-bold'
                      : log.includes('ERROR') || log.includes('failed')
                      ? 'text-[#fb4934] font-bold'
                      : 'text-[#ebdbb2]'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>

            {/* Command Input */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[#fabd2f] font-bold text-sm">$</span>
              <input
                type="text"
                placeholder="Type shell command (e.g. ls -la, npm run lint, git diff)..."
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunTerminalCommand()}
                className="flex-1 bg-[#141312] border border-[#3c3836] rounded-lg px-3 py-2 text-xs font-mono text-[#ebdbb2] outline-none focus:border-[#fabd2f]"
              />
              <button
                onClick={() => handleRunTerminalCommand()}
                disabled={isTerminalRunning}
                className="px-4 py-2 bg-[#fabd2f] text-[#1d2021] font-bold text-xs rounded-lg flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: PACKAGE & DEPENDENCY MANAGER */}
        {activeTab === 'packages' && (
          <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-4 flex flex-col gap-4">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#32302f] pb-3">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#928374] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search installed and available developer packages..."
                    value={packageSearch}
                    onChange={(e) => setPackageSearch(e.target.value)}
                    className="w-full bg-[#141312] border border-[#3c3836] rounded-lg pl-9 pr-3 py-2 text-xs text-[#ebdbb2] outline-none focus:border-[#fabd2f]"
                  />
                </div>

                <div className="flex items-center gap-1">
                  {['All', 'Core Framework', 'AI & Agents', 'UI & Styling', 'Database & Cloud', 'Developer Tools'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setPackageCategory(cat)}
                      className={`px-2.5 py-1.5 rounded text-xs font-bold whitespace-nowrap ${
                        packageCategory === cat ? 'bg-[#fabd2f] text-[#1d2021]' : 'bg-[#282828] text-[#a89984] hover:text-[#ebdbb2]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Install Custom Package Form & Batch Install */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleInstallBatchPackages()}
                  disabled={isInstallingPackage}
                  className="px-3.5 py-1.5 bg-[#fabd2f] hover:bg-[#fabd2f]/90 text-[#1d2021] font-extrabold text-xs rounded-lg flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isInstallingPackage ? 'Installing Fleet Stack...' : '⚡ Install All Developer Packages'}</span>
                </button>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="npm package name (e.g. zustand, axios)..."
                    value={customPackageInput}
                    onChange={(e) => setCustomPackageInput(e.target.value)}
                    className="bg-[#141312] border border-[#3c3836] rounded-lg px-3 py-1.5 text-xs text-[#ebdbb2] font-mono outline-none"
                  />
                  <button
                    onClick={() => handleInstallPackage(customPackageInput)}
                    disabled={isInstallingPackage}
                    className="px-3 py-1.5 bg-[#8ec07c] text-[#1d2021] font-bold text-xs rounded-lg flex items-center gap-1.5 shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isInstallingPackage ? 'Installing...' : 'Install via npm'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Install Terminal Feedback */}
            {packageInstallLog && (
              <div className="bg-[#141312] border border-[#3c3836] rounded-lg p-3 font-mono text-xs text-[#ebdbb2] whitespace-pre-wrap">
                {packageInstallLog}
              </div>
            )}

            {/* Package Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPackages.map(pkg => (
                <div key={pkg.name} className="bg-[#282828] border border-[#3c3836] rounded-xl p-3.5 flex flex-col justify-between gap-2 shadow-sm">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#fabd2f]">{pkg.name}</span>
                      <span className="text-[10px] font-mono text-[#83a598] font-bold">{pkg.version}</span>
                    </div>
                    <p className="text-xs text-[#a89984] mt-1 leading-relaxed">{pkg.desc}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#32302f] text-xs">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#181615] text-[#928374]">{pkg.category}</span>
                    {pkg.installed ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#8ec07c]/20 text-[#8ec07c] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        INSTALLED
                      </span>
                    ) : (
                      <button
                        onClick={() => handleInstallPackage(pkg.name)}
                        disabled={isInstallingPackage}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#fabd2f] text-[#1d2021] font-bold flex items-center gap-1 hover:bg-[#fabd2f]/90"
                      >
                        <Download className="w-2.5 h-2.5" />
                        Install Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: REPOSITORIES & STARTER CODE */}
        {activeTab === 'repos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
            {/* Repositories List */}
            <div className="lg:col-span-4 bg-[#1d2021] border border-[#3c3836] rounded-xl p-3 flex flex-col gap-2">
              <div className="text-xs font-bold text-[#928374] uppercase tracking-wider px-2 py-1">Curated Open-Source Repositories</div>
              <div className="space-y-2 overflow-y-auto flex-1">
                {repositories.map(repo => {
                  const isSelected = repo.id === selectedRepoId;
                  return (
                    <button
                      key={repo.id}
                      onClick={() => {
                        soundFx.playClick();
                        setSelectedRepoId(repo.id);
                        if (repo.keyFiles && repo.keyFiles[0]) {
                          setSelectedRepoFile(repo.keyFiles[0].path);
                        }
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-[#282828] border-[#fabd2f] shadow text-[#ebdbb2]'
                          : 'bg-[#181615] border-[#32302f] hover:border-[#3c3836] text-[#a89984]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-[#fabd2f]">{repo.name}</span>
                        <span className="text-[10px] font-mono text-[#fe8019] font-bold">★ {repo.stars}</span>
                      </div>
                      <p className="text-[11px] text-[#a89984] line-clamp-2 leading-relaxed">{repo.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {repo.techStack.map((tech: string) => (
                          <span key={tech} className="text-[9px] px-1.5 py-0.2 rounded bg-[#1d2021] text-[#928374]">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Repository Code Viewer */}
            <div className="lg:col-span-8 bg-[#1d2021] border border-[#3c3836] rounded-xl flex flex-col overflow-hidden">
              <div className="bg-[#282828] border-b border-[#3c3836] p-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-[#fabd2f] flex items-center gap-1.5">
                    <FolderGit2 className="w-4 h-4" />
                    <span>{selectedRepo?.name}</span>
                  </h3>
                  <a
                    href={selectedRepo?.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#83a598] hover:underline flex items-center gap-1"
                  >
                    <span>{selectedRepo?.repoUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <button
                  onClick={() => handleMountRepoTemplate(selectedRepo.id, currentRepoFileObj?.path)}
                  className="px-3.5 py-1.5 bg-[#8ec07c] text-[#1d2021] font-bold text-xs rounded-lg flex items-center gap-1.5 shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Mount Code into IDE</span>
                </button>
              </div>

              {/* Repo File Selector */}
              <div className="bg-[#181615] px-3 py-1.5 border-b border-[#32302f] flex items-center gap-2 overflow-x-auto">
                <span className="text-xs font-bold text-[#928374]">Files:</span>
                {selectedRepo?.keyFiles?.map((kf: any) => (
                  <button
                    key={kf.path}
                    onClick={() => setSelectedRepoFile(kf.path)}
                    className={`px-2 py-0.5 rounded text-xs font-mono ${
                      selectedRepoFile === kf.path ? 'bg-[#fabd2f] text-[#1d2021] font-bold' : 'text-[#a89984] hover:bg-[#282828]'
                    }`}
                  >
                    {kf.path}
                  </button>
                ))}
              </div>

              {/* Code Display */}
              <div className="flex-1 bg-[#141312] p-4 font-mono text-xs overflow-y-auto leading-relaxed text-[#ebdbb2]">
                <pre>
                  <code>{currentRepoFileObj?.content || '// No file content found'}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: WEBSITE & MOBILE RESPONSIVE PREVIEW */}
        {activeTab === 'website_builder' && (
          <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-4 flex flex-col gap-4 h-full">
            {/* Viewport & Device Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#32302f] pb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#928374]">Device Viewport:</span>
                <button
                  onClick={() => setViewportMode('desktop')}
                  className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 ${
                    viewportMode === 'desktop' ? 'bg-[#fabd2f] text-[#1d2021]' : 'bg-[#282828] text-[#a89984]'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> Desktop (1920x1080)
                </button>
                <button
                  onClick={() => setViewportMode('laptop')}
                  className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 ${
                    viewportMode === 'laptop' ? 'bg-[#fabd2f] text-[#1d2021]' : 'bg-[#282828] text-[#a89984]'
                  }`}
                >
                  <Layout className="w-3.5 h-3.5" /> Laptop (1366x768)
                </button>
                <button
                  onClick={() => setViewportMode('tablet')}
                  className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 ${
                    viewportMode === 'tablet' ? 'bg-[#fabd2f] text-[#1d2021]' : 'bg-[#282828] text-[#a89984]'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" /> Tablet iPad (768x1024)
                </button>
                <button
                  onClick={() => setViewportMode('mobile')}
                  className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 ${
                    viewportMode === 'mobile' ? 'bg-[#fabd2f] text-[#1d2021]' : 'bg-[#282828] text-[#a89984]'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile iPhone (375x812)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8ec07c] font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#8ec07c] animate-pulse" />
                  Hot Reload Active
                </span>
              </div>
            </div>

            {/* Responsive Frame Container */}
            <div className="flex-1 flex items-center justify-center p-4 bg-[#141312] rounded-xl border border-[#282828] overflow-auto">
              <div
                className={`transition-all bg-[#1d2021] border border-[#3c3836] rounded-xl shadow-2xl overflow-hidden flex flex-col ${
                  viewportMode === 'desktop'
                    ? 'w-full max-w-4xl h-[480px]'
                    : viewportMode === 'laptop'
                    ? 'w-[720px] h-[440px]'
                    : viewportMode === 'tablet'
                    ? 'w-[480px] h-[520px]'
                    : 'w-[340px] h-[540px]'
                }`}
              >
                {/* Browser Shell Topbar */}
                <div className="bg-[#282828] px-3 py-2 border-b border-[#3c3836] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#fb4934]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#fabd2f]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#b8bb26]" />
                  </div>
                  <span className="font-mono text-[10px] text-[#928374]">https://dunder-mifflin.internal/app</span>
                  <RotateCw className="w-3 h-3 text-[#928374]" />
                </div>

                {/* Rendered Live Website / App View */}
                <div className="flex-1 p-6 bg-[#181615] text-[#ebdbb2] flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h1 className="text-lg font-extrabold text-[#fabd2f]">Rufflo Autonomous Fleet Operations</h1>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#8ec07c]/20 text-[#8ec07c] font-bold">Port 3000</span>
                    </div>

                    <p className="text-xs text-[#a89984] leading-relaxed">
                      Real-time multi-agent autonomous engineering platform. Self-healing microservices, quantum search indices, and live computer application orchestration.
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-3 bg-[#282828] rounded-lg border border-[#3c3836]">
                        <div className="text-[#83a598] font-bold">TOTAL AGENTS</div>
                        <div className="text-base text-[#ebdbb2] font-extrabold mt-0.5">12 Active</div>
                      </div>
                      <div className="p-3 bg-[#282828] rounded-lg border border-[#3c3836]">
                        <div className="text-[#8ec07c] font-bold">SYSTEM HEALTH</div>
                        <div className="text-base text-[#ebdbb2] font-extrabold mt-0.5">99.98%</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#282828] flex items-center justify-between text-xs text-[#928374]">
                    <span>Verified by Dwight Schrute Zero-Trust</span>
                    <button className="px-3 py-1 bg-[#fabd2f] text-[#1d2021] font-bold rounded">Explore Dashboard</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
