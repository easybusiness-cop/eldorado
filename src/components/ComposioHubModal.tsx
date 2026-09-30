import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Play,
  Layers,
  Globe,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Send,
  Cpu,
  Database,
  Search,
  Code,
  Github,
  Mail,
  MessageSquare,
  FileText,
  CloudSun,
  Activity,
  Flame,
  Check,
  Copy,
  TrendingUp,
} from 'lucide-react';
import { Agent, FleetTask } from '../types';

interface ComposioHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents?: Agent[];
  onAddTask?: (task: Partial<FleetTask>) => void;
}

interface IntegrationItem {
  id: string;
  name: string;
  provider: string;
  description: string;
  connected: boolean;
  category: 'developer' | 'productivity' | 'communication' | 'data';
  authType: 'oauth' | 'api_key' | 'public';
  accountHandle?: string;
  icon: any;
  popularTool: string;
}

interface ToolPreset {
  id: string;
  actionId: string;
  name: string;
  provider: string;
  description: string;
  defaultParams: Record<string, any>;
}

const TOOL_PRESETS: ToolPreset[] = [
  {
    id: 'hn_stories',
    actionId: 'HACKERNEWS_GET_TOP_STORIES',
    name: 'Top HackerNews Stories',
    provider: 'hackernews',
    description: 'Fetch real-time top AI and tech stories trending on Hacker News',
    defaultParams: { limit: 5 },
  },
  {
    id: 'weather_sf',
    actionId: 'WEATHER_GET_WEATHER',
    name: 'Live Weather (San Francisco)',
    provider: 'weather',
    description: 'Query live atmospheric conditions and temperature from Open-Meteo',
    defaultParams: { latitude: 37.7749, longitude: -122.4194, city: 'San Francisco, CA' },
  },
  {
    id: 'crypto_prices',
    actionId: 'COINGECKO_GET_PRICES',
    name: 'Live Crypto Rates (BTC/ETH/SOL)',
    provider: 'coingecko',
    description: 'Fetch live cryptocurrency market rates from CoinGecko',
    defaultParams: { ids: 'bitcoin,ethereum,solana', currency: 'usd' },
  },
  {
    id: 'gh_profile',
    actionId: 'GITHUB_GET_ABOUT_AUTHENTICATED_USER',
    name: 'GitHub User & Repo Profile',
    provider: 'github',
    description: 'Get authenticated GitHub developer metrics and active repos',
    defaultParams: {},
  },
  {
    id: 'gh_issue',
    actionId: 'GITHUB_CREATE_ISSUE',
    name: 'Create GitHub Issue',
    provider: 'github',
    description: 'Dispatch an issue to an engineering repository',
    defaultParams: { repo: 'octocat/Hello-World', title: 'Automated Issue via Rufflo Composio Agent', body: 'Dispatched from Rufflo Quantum Tool Gateway.' },
  },
  {
    id: 'slack_msg',
    actionId: 'SLACK_SEND_MESSAGE',
    name: 'Post Slack Fleet Update',
    provider: 'slack',
    description: 'Send a message to an operations Slack channel',
    defaultParams: { channel: '#general', text: '🚀 Quantum Fleet Tool Execution verified via Composio gateway.' },
  },
  {
    id: 'gmail_send',
    actionId: 'GMAIL_SEND_EMAIL',
    name: 'Send Gmail Notification',
    provider: 'gmail',
    description: 'Send email notification via Google Workspace',
    defaultParams: { to: 'engineer@rufflo.internal', subject: 'Automated Tool Execution Notice', body: 'The autonomous loop executed a Composio tool successfully.' },
  },
];

export const ComposioHubModal: React.FC<ComposioHubModalProps> = ({
  isOpen,
  onClose,
  agents = [],
  onAddTask,
}) => {
  const [activeTab, setActiveTab] = useState<'connect' | 'studio' | 'history'>('connect');
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(false);
  const [statusData, setStatusData] = useState<{
    configured: boolean;
    hasApiKey: boolean;
    activeConnectionsCount: number;
    connections: any[];
  }>({
    configured: false,
    hasApiKey: false,
    activeConnectionsCount: 0,
    connections: [],
  });

  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [connectMessage, setConnectMessage] = useState<string | null>(null);

  // Tool Studio State
  const [selectedPreset, setSelectedPreset] = useState<ToolPreset>(TOOL_PRESETS[0]);
  const [customActionId, setCustomActionId] = useState<string>(TOOL_PRESETS[0].actionId);
  const [paramsJson, setParamsJson] = useState<string>(
    JSON.stringify(TOOL_PRESETS[0].defaultParams, null, 2)
  );
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<any | null>(null);
  const [executionHistory, setExecutionHistory] = useState<any[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/composio/status');
      const data = await res.json();
      if (data.success) {
        setStatusData({
          configured: data.configured,
          hasApiKey: data.hasApiKey,
          activeConnectionsCount: data.activeConnectionsCount,
          connections: data.connections || [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch Composio status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const INTEGRATIONS: IntegrationItem[] = [
    {
      id: 'github',
      name: 'GitHub Enterprise',
      provider: 'github',
      description: 'Automate pull requests, commit audits, issues, and workflow dispatches.',
      connected: statusData.connections.find((c) => c.provider === 'github')?.connected ?? false,
      category: 'developer',
      authType: 'oauth',
      accountHandle: statusData.connections.find((c) => c.provider === 'github')?.accountEmailOrHandle,
      icon: Github,
      popularTool: 'GITHUB_CREATE_ISSUE',
    },
    {
      id: 'gmail',
      name: 'Google Workspace Gmail',
      provider: 'gmail',
      description: 'Dispatch client deliverables, executive briefings, and automated emails.',
      connected: statusData.connections.find((c) => c.provider === 'gmail')?.connected ?? false,
      category: 'communication',
      authType: 'oauth',
      accountHandle: statusData.connections.find((c) => c.provider === 'gmail')?.accountEmailOrHandle,
      icon: Mail,
      popularTool: 'GMAIL_SEND_EMAIL',
    },
    {
      id: 'slack',
      name: 'Slack Fleet Bot',
      provider: 'slack',
      description: 'Post autonomous team updates, trigger approvals, and report alerts.',
      connected: statusData.connections.find((c) => c.provider === 'slack')?.connected ?? false,
      category: 'communication',
      authType: 'oauth',
      accountHandle: statusData.connections.find((c) => c.provider === 'slack')?.accountEmailOrHandle,
      icon: MessageSquare,
      popularTool: 'SLACK_SEND_MESSAGE',
    },
    {
      id: 'notion',
      name: 'Notion Knowledge Base',
      provider: 'notion',
      description: 'Sync autonomous research, project documentation, and architecture specs.',
      connected: statusData.connections.find((c) => c.provider === 'notion')?.connected ?? false,
      category: 'productivity',
      authType: 'oauth',
      accountHandle: statusData.connections.find((c) => c.provider === 'notion')?.accountEmailOrHandle,
      icon: FileText,
      popularTool: 'NOTION_SEARCH',
    },
    {
      id: 'hackernews',
      name: 'Hacker News Live Feed',
      provider: 'hackernews',
      description: 'Live ingestion of top trending AI & technology discussions and papers.',
      connected: true,
      category: 'data',
      authType: 'public',
      accountHandle: 'public-api@news.ycombinator.com',
      icon: Flame,
      popularTool: 'HACKERNEWS_GET_TOP_STORIES',
    },
    {
      id: 'weather',
      name: 'Open-Meteo Weather',
      provider: 'weather',
      description: 'Global real-time meteorology and climate telemetry for physical ops.',
      connected: true,
      category: 'data',
      authType: 'public',
      accountHandle: 'api.open-meteo.com',
      icon: CloudSun,
      popularTool: 'WEATHER_GET_WEATHER',
    },
    {
      id: 'coingecko',
      name: 'CoinGecko Crypto Markets',
      provider: 'coingecko',
      description: 'Live cryptocurrency quotes and 24h market performance metrics.',
      connected: true,
      category: 'data',
      authType: 'public',
      accountHandle: 'api.coingecko.com',
      icon: TrendingUp,
      popularTool: 'COINGECKO_GET_PRICES',
    },
  ];

  const handleConnect = async (provider: string) => {
    setConnectingProvider(provider);
    setConnectMessage(null);
    try {
      const res = await fetch('/api/composio/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.success) {
        setConnectMessage(`Connected ${provider.toUpperCase()} successfully!`);
        await fetchStatus();
        if (data.redirectUrl && data.isRealComposio) {
          window.open(data.redirectUrl, '_blank');
        }
      } else {
        setConnectMessage(`Error connecting: ${data.error}`);
      }
    } catch (err: any) {
      setConnectMessage(`Connection error: ${err?.message || String(err)}`);
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = async (provider: string) => {
    setConnectingProvider(provider);
    try {
      await fetch('/api/composio/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      await fetchStatus();
    } catch (err) {
      console.error('Error disconnecting:', err);
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleSelectPreset = (preset: ToolPreset) => {
    setSelectedPreset(preset);
    setCustomActionId(preset.actionId);
    setParamsJson(JSON.stringify(preset.defaultParams, null, 2));
  };

  const handleExecuteTool = async () => {
    setIsExecuting(true);
    setExecutionResult(null);

    let parsedParams: Record<string, any> = {};
    try {
      parsedParams = JSON.parse(paramsJson);
    } catch (err: any) {
      setExecutionResult({
        success: false,
        error: `Invalid JSON parameters: ${err?.message}`,
      });
      setIsExecuting(false);
      return;
    }

    try {
      const res = await fetch('/api/composio/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId: customActionId,
          parameters: parsedParams,
        }),
      });
      const data = await res.json();
      setExecutionResult(data);

      // Append to history
      const historyItem = {
        id: `exec-${Date.now()}`,
        actionId: customActionId,
        timestamp: new Date().toLocaleTimeString(),
        durationMs: data.durationMs || 0,
        success: data.success,
        data: data.output || data.error,
      };
      setExecutionHistory((prev) => [historyItem, ...prev]);
    } catch (err: any) {
      setExecutionResult({
        success: false,
        error: err?.message || 'Network error executing tool call',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const copyResultToClipboard = () => {
    if (!executionResult) return;
    navigator.clipboard.writeText(JSON.stringify(executionResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDispatchToFleet = () => {
    if (!executionResult || !onAddTask) return;
    onAddTask({
      title: `Analyze Tool Output: ${customActionId}`,
      description: `Composio tool ${customActionId} executed with result: ${JSON.stringify(
        executionResult.output
      ).substring(0, 200)}...`,
      priority: 'high',
      status: 'queued',
      assignedTo: agents[0]?.id || 'quantum-orchestrator',

    });
    setConnectMessage('Dispatched tool execution result to fleet task backlog!');
    setTimeout(() => setConnectMessage(null), 3000);
  };

  return (
    <div
      id="composio-hub-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div
        id="composio-hub-card"
        className="relative w-full max-w-5xl h-[88vh] bg-[#1a1918] border border-[#3c3836] rounded-2xl flex flex-col shadow-2xl overflow-hidden text-[#ebdbb2]"
      >
        {/* Top Header */}
        <div
          id="composio-hub-header"
          className="flex items-center justify-between px-6 py-4 border-b border-[#3c3836] bg-[#22201e]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fe8019]/10 border border-[#fe8019]/30 flex items-center justify-center text-[#fe8019] shadow-inner">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-[#fbf1c7]">
                  Composio Tool & Integration Hub
                </h2>
                <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-[#32302f] border border-[#504945] text-[#bdae93]">
                  v0.18.0
                </span>
                {statusData.hasApiKey ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Cloud SDK Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-950/80 text-amber-300 border border-amber-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Interactive Engine Ready
                  </span>
                )}
              </div>
              <p className="text-xs text-[#a89984]">
                Enterprise Autonomous Action Execution Mesh for Agents & Integrations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="refresh-composio-status-btn"
              onClick={fetchStatus}
              disabled={isLoadingStatus}
              className="p-2 text-[#a89984] hover:text-[#fbf1c7] hover:bg-[#32302f] rounded-lg transition-colors border border-transparent hover:border-[#504945]"
              title="Refresh SDK Status"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="close-composio-hub-btn"
              onClick={onClose}
              className="p-2 text-[#a89984] hover:text-[#fbf1c7] hover:bg-[#32302f] rounded-lg transition-colors border border-transparent hover:border-[#504945]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Notification Banner */}
        {connectMessage && (
          <div className="px-6 py-2 bg-[#fe8019]/10 border-b border-[#fe8019]/30 flex items-center justify-between text-xs text-[#fabd2f]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#fabd2f]" />
              <span>{connectMessage}</span>
            </div>
            <button
              onClick={() => setConnectMessage(null)}
              className="text-[#a89984] hover:text-[#fbf1c7]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#3c3836] bg-[#1d2021]">
          <button
            id="tab-connect-integrations"
            onClick={() => setActiveTab('connect')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
              activeTab === 'connect'
                ? 'bg-[#1a1918] border-[#3c3836] text-[#fabd2f] border-b-transparent'
                : 'border-transparent text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#282828]'
            }`}
          >
            <Layers className="w-4 h-4" />
            Connect Integrations ({INTEGRATIONS.filter((i) => i.connected).length}/{INTEGRATIONS.length})
          </button>
          <button
            id="tab-tool-studio"
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
              activeTab === 'studio'
                ? 'bg-[#1a1918] border-[#3c3836] text-[#fabd2f] border-b-transparent'
                : 'border-transparent text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#282828]'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Live Tool Calling Studio
          </button>
          <button
            id="tab-execution-history"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
              activeTab === 'history'
                ? 'bg-[#1a1918] border-[#3c3836] text-[#fabd2f] border-b-transparent'
                : 'border-transparent text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#282828]'
            }`}
          >
            <Activity className="w-4 h-4" />
            Telemetry & Audit Log ({executionHistory.length})
          </button>
        </div>

        {/* Modal Main Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#1a1918]">
          {/* TAB 1: CONNECT INTEGRATIONS */}
          {activeTab === 'connect' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#282828] border border-[#3c3836]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#b8bb26]/10 border border-[#b8bb26]/30 flex items-center justify-center text-[#b8bb26]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#fbf1c7]">
                      Autonomous Auth & Security Policy
                    </h3>
                    <p className="text-xs text-[#a89984]">
                      Connected integrations automatically empower agent workers (Rufflo Engineering, Master Meta, Business Dispatch) with scoped tool credentials.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-[#bdae93]">
                    Connected: <span className="font-bold text-[#b8bb26]">{statusData.activeConnectionsCount}</span>
                  </div>
                </div>
              </div>

              {/* Integrations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {INTEGRATIONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      id={`integration-card-${item.id}`}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        item.connected
                          ? 'bg-[#242728] border-emerald-900/60 shadow-lg'
                          : 'bg-[#202020] border-[#3c3836] hover:border-[#504945]'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-9 h-9 rounded-lg bg-[#32302f] border border-[#504945] flex items-center justify-center text-[#fabd2f]">
                            <Icon className="w-5 h-5" />
                          </div>
                          {item.connected ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Connected
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-[#32302f] text-[#a89984] border border-[#504945]">
                              Disconnected
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-[#fbf1c7] mb-1">{item.name}</h4>
                        <p className="text-xs text-[#a89984] line-clamp-2 mb-3">
                          {item.description}
                        </p>

                        {item.accountHandle && (
                          <div className="mb-3 px-2 py-1 bg-[#181615] rounded text-[11px] font-mono text-[#83a598] truncate border border-[#3c3836]">
                            Account: {item.accountHandle}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[#3c3836] flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            const preset = TOOL_PRESETS.find((p) => p.actionId === item.popularTool);
                            if (preset) {
                              handleSelectPreset(preset);
                              setActiveTab('studio');
                            }
                          }}
                          className="text-[11px] text-[#83a598] hover:text-[#8ec07c] underline underline-offset-2 flex items-center gap-1"
                        >
                          <Terminal className="w-3 h-3" />
                          Test Tool
                        </button>

                        {item.authType === 'public' ? (
                          <span className="text-[11px] text-[#b8bb26] font-mono">Public Ready</span>
                        ) : item.connected ? (
                          <button
                            onClick={() => handleDisconnect(item.provider)}
                            disabled={connectingProvider === item.provider}
                            className="px-3 py-1 text-xs font-medium text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/80 rounded-md border border-red-900 transition-colors"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            onClick={() => handleConnect(item.provider)}
                            disabled={connectingProvider === item.provider}
                            className="px-3 py-1 text-xs font-medium text-[#282828] bg-[#fe8019] hover:bg-[#fabd2f] rounded-md transition-colors flex items-center gap-1 shadow"
                          >
                            {connectingProvider === item.provider ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Zap className="w-3 h-3" />
                            )}
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE TOOL CALLING STUDIO */}
          {activeTab === 'studio' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Presets Bar */}
              <div>
                <label className="block text-xs font-bold text-[#bdae93] uppercase tracking-wider mb-2">
                  1-Click Execution Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {TOOL_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                        selectedPreset.id === preset.id
                          ? 'bg-[#fe8019] text-[#1d2021] font-bold border-[#fe8019]'
                          : 'bg-[#282828] text-[#ebdbb2] border-[#3c3836] hover:border-[#504945]'
                      }`}
                    >
                      <Play className="w-3 h-3" />
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tool Execution Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Panel: Request Configuration */}
                <div className="p-4 rounded-xl bg-[#202020] border border-[#3c3836] flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-[#fbf1c7] flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-[#fe8019]" />
                        Tool Invocation Payload
                      </h4>
                      <span className="text-[11px] font-mono text-[#a89984]">
                        Provider: {selectedPreset.provider}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-[#a89984] mb-1">
                          Composio Action Slug / Tool Identifier
                        </label>
                        <input
                          id="composio-action-slug-input"
                          type="text"
                          value={customActionId}
                          onChange={(e) => setCustomActionId(e.target.value)}
                          className="w-full px-3 py-2 bg-[#181615] border border-[#3c3836] rounded-lg text-xs font-mono text-[#fabd2f] focus:outline-none focus:border-[#fe8019]"
                          placeholder="e.g. HACKERNEWS_GET_TOP_STORIES"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-[#a89984] mb-1">
                          Arguments & Parameters (JSON)
                        </label>
                        <textarea
                          id="composio-params-json-textarea"
                          value={paramsJson}
                          onChange={(e) => setParamsJson(e.target.value)}
                          rows={8}
                          className="w-full px-3 py-2 bg-[#181615] border border-[#3c3836] rounded-lg text-xs font-mono text-[#ebdbb2] focus:outline-none focus:border-[#fe8019]"
                          placeholder="{}"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#3c3836] flex items-center justify-between">
                    <button
                      onClick={() => setParamsJson(JSON.stringify(selectedPreset.defaultParams, null, 2))}
                      className="text-xs text-[#a89984] hover:text-[#fbf1c7] underline"
                    >
                      Reset Defaults
                    </button>

                    <button
                      id="execute-composio-tool-btn"
                      onClick={handleExecuteTool}
                      disabled={isExecuting}
                      className="px-5 py-2 rounded-lg bg-[#fe8019] hover:bg-[#fabd2f] text-[#1d2021] font-bold text-xs transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      {isExecuting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Executing Tool...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          Execute Tool Call
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right Panel: Live Execution Output */}
                <div className="p-4 rounded-xl bg-[#181615] border border-[#3c3836] flex flex-col justify-between">
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-[#b8bb26]" />
                        <h4 className="text-sm font-bold text-[#fbf1c7]">Execution Output & Telemetry</h4>
                      </div>

                      {executionResult && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={copyResultToClipboard}
                            className="p-1 text-[#a89984] hover:text-[#fbf1c7] rounded hover:bg-[#282828] transition-colors"
                            title="Copy JSON"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                              executionResult.success
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-red-950 text-red-400 border border-red-800'
                            }`}
                          >
                            {executionResult.success ? '200 OK' : 'FAILED'} ({executionResult.durationMs || 0}ms)
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 bg-[#121110] border border-[#282828] rounded-lg p-3 font-mono text-xs overflow-auto max-h-[320px]">
                      {isExecuting ? (
                        <div className="h-full flex flex-col items-center justify-center text-[#a89984] space-y-2 py-8">
                          <RefreshCw className="w-6 h-6 animate-spin text-[#fe8019]" />
                          <span>Routing tool request through Composio Gateway...</span>
                        </div>
                      ) : executionResult ? (
                        <pre className="text-[#8ec07c] whitespace-pre-wrap">
                          {JSON.stringify(executionResult, null, 2)}
                        </pre>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-[#928374] py-8 text-center">
                          <Zap className="w-8 h-8 text-[#3c3836] mb-2" />
                          <span>Click "Execute Tool Call" above to trigger your first real action.</span>
                          <span className="text-[11px] text-[#665c54] mt-1">
                            Outputs are formatted and verifiable in real-time.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {executionResult?.success && (
                    <div className="pt-3 mt-3 border-t border-[#3c3836] flex items-center justify-end gap-2">
                      <button
                        onClick={handleDispatchToFleet}
                        className="px-3 py-1.5 rounded-lg bg-[#83a598]/20 hover:bg-[#83a598]/30 text-[#83a598] border border-[#83a598]/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Dispatch Result to Agent Fleet
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TELEMETRY & AUDIT HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#fbf1c7] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#fe8019]" />
                  Session Tool Invocations
                </h3>
                {executionHistory.length > 0 && (
                  <button
                    onClick={() => setExecutionHistory([])}
                    className="text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {executionHistory.length === 0 ? (
                <div className="p-12 text-center bg-[#202020] rounded-xl border border-[#3c3836] text-[#a89984]">
                  <Terminal className="w-10 h-10 mx-auto text-[#504945] mb-2" />
                  <p className="text-sm">No tool executions recorded in this session yet.</p>
                  <p className="text-xs text-[#7c6f64] mt-1">
                    Run actions from the "Live Tool Calling Studio" tab to monitor logs here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {executionHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-[#202020] border border-[#3c3836] flex flex-col space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              item.success ? 'bg-emerald-400' : 'bg-red-400'
                            }`}
                          />
                          <span className="font-mono text-xs font-bold text-[#fabd2f]">
                            {item.actionId}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono text-[#a89984]">
                          <span>{item.timestamp}</span>
                          <span className="px-1.5 py-0.5 bg-[#181615] rounded border border-[#3c3836]">
                            {item.durationMs}ms
                          </span>
                        </div>
                      </div>
                      <div className="p-2 bg-[#181615] rounded-lg text-xs font-mono text-[#8ec07c] max-h-32 overflow-auto">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(item.data, null, 2)}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-[#3c3836] bg-[#1d2021] flex items-center justify-between text-xs text-[#a89984]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#b8bb26]" />
            <span>Composio Runtime Engine: Ready</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Platform: Web / Node.js</span>
            <span>Gateway: Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
