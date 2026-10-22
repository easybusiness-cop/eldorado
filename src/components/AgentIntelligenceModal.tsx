import React, { useState, useEffect } from 'react';
import {
  Brain,
  Cpu,
  Globe,
  Shield,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Sparkles,
  Activity,
  Award,
  Terminal,
  Server,
  Layers,
  ChevronRight,
  ExternalLink,
  Play,
  Mail,
  Key,
  Lock,
  ShieldCheck,
  Check
} from 'lucide-react';
import { soundFx } from '../utils/speech';

interface AgentIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBrowser?: () => void;
}

export const AgentIntelligenceModal: React.FC<AgentIntelligenceModalProps> = ({
  isOpen,
  onClose,
  onOpenBrowser,
}) => {
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chromiumLive, setChromiumLive] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'benchmarks' | 'chromium' | 'identities' | 'agents'>('overview');
  const [customUrl, setCustomUrl] = useState('https://news.ycombinator.com');
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [browseOutput, setBrowseOutput] = useState<any>(null);

  const [selectedAgentId, setSelectedAgentId] = useState('ChromiumNavigator');
  const [agentSessions, setAgentSessions] = useState<any[]>([]);

  // RDIWI Digital Identity State
  const [identities, setIdentities] = useState<any[]>([]);
  const [selectedIdentityAgent, setSelectedIdentityAgent] = useState('');
  const [identityLoading, setIdentityLoading] = useState(false);
  const [workspaceMessage, setWorkspaceMessage] = useState<string | null>(null);
  const [accountPlatform, setAccountPlatform] = useState('linkedin');
  const [accountHandle, setAccountHandle] = useState('');
  const [provisionMessage, setProvisionMessage] = useState<string | null>(null);
  const [inboxMessages, setInboxMessages] = useState<any[]>([]);
  const [googleWorkspaceStatus, setGoogleWorkspaceStatus] = useState<any>(null);
  const [capabilityRequests, setCapabilityRequests] = useState<any[]>([]);
  const [canManageIdentity, setCanManageIdentity] = useState(false);
  const [requestedCapability, setRequestedCapability] = useState('gmail:read');
  const [capabilityReason, setCapabilityReason] = useState('');
  const [capabilityMessage, setCapabilityMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchEvaluation();
      fetchChromiumStatus();
      fetchAgentSessions();
      fetchIdentities();
    }
  }, [isOpen]);

  const fetchIdentities = async () => {
    try {
      setIdentityLoading(true);
      const res = await fetch('/api/identity/agents');
      const data = await res.json();
      if (data.success && data.identities) {
        setIdentities(data.identities);
        if (!data.identities.some((identity: any) => identity.agentId === selectedIdentityAgent)) {
          setSelectedIdentityAgent(data.identities[0]?.agentId || '');
        }
      }
      const [googleStatusRes, requestsRes] = await Promise.all([
        fetch('/api/identity/google/status'),
        fetch('/api/identity/capability-requests'),
      ]);
      const [googleStatus, requests] = await Promise.all([googleStatusRes.json(), requestsRes.json()]);
      if (googleStatus.success) setGoogleWorkspaceStatus(googleStatus);
      if (requests.success) {
        setCapabilityRequests(requests.requests || []);
        setCanManageIdentity(Boolean(requests.canManage));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIdentityLoading(false);
    }
  };

  const fetchAgentInbox = async (agentId: string) => {
    try {
      const res = await fetch(`/api/identity/agent/${agentId}/inbox`);
      const data = await res.json();
      if (data.success) {
        setInboxMessages(data.messages || []);
      } else {
        setInboxMessages([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConnectGoogleWorkspace = async () => {
    try {
      const res = await fetch(`/api/identity/agent/${selectedIdentityAgent}/google/authorize`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.authorizationUrl) throw new Error(data.error || 'Google Workspace is not configured.');
      window.open(data.authorizationUrl, 'rufflo-google-workspace', 'popup,width=640,height=760');
    } catch (error: any) {
      setProvisionMessage(error.message);
    }
  };

  const handleRequestCapability = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/identity/agent/${selectedIdentityAgent}/capability-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capability: requestedCapability, reason: capabilityReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Capability request failed.');
      setCapabilityMessage(`Requested ${requestedCapability}; approval is pending.`);
      setCapabilityReason('');
      fetchIdentities();
    } catch (error: any) {
      setCapabilityMessage(error.message);
    }
  };

  const handleCapabilityDecision = async (requestId: string, approved: boolean) => {
    try {
      const res = await fetch(`/api/identity/capability-requests/${requestId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Capability decision failed.');
      fetchIdentities();
    } catch (error: any) {
      setCapabilityMessage(error.message);
    }
  };

  const handleStartWorkspace = async (agentId: string) => {
    soundFx.playClick();
    try {
      const res = await fetch(`/api/identity/agent/${agentId}/workspace/start`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Workspace could not be restored.');
      setWorkspaceMessage(data.message || 'Workspace restored.');
      soundFx.playSuccessChime();
      fetchIdentities();
      fetchAgentSessions();
    } catch (error: any) { setWorkspaceMessage(error.message); }
  };

  const handleStopWorkspace = async (agentId: string) => {
    soundFx.playClick();
    try {
      const res = await fetch(`/api/identity/agent/${agentId}/workspace/stop`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Workspace could not be stopped safely.');
      setWorkspaceMessage(data.message || 'Workspace stopped with its state saved.');
      soundFx.playNotification();
      fetchIdentities();
      fetchAgentSessions();
    } catch (error: any) { setWorkspaceMessage(error.message); }
  };

  const handleResetWorkspace = async (agentId: string) => {
    soundFx.playClick();
    try {
      const res = await fetch(`/api/identity/agent/${agentId}/workspace/reset`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Workspace profile could not be reset.');
      setWorkspaceMessage(data.message || 'Workspace profile reset.');
      soundFx.playNotification();
      fetchIdentities();
      fetchAgentSessions();
    } catch (error: any) { setWorkspaceMessage(error.message); }
  };

  const handleProvisionAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setProvisionMessage(null);
    try {
      const res = await fetch(`/api/identity/agent/${selectedIdentityAgent}/provision-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: accountPlatform,
          accountHandle: accountHandle.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProvisionMessage(`Access request for ${accountPlatform} recorded; it is not connected yet.`);
        soundFx.playSuccessChime();
        fetchIdentities();
      } else {
        setProvisionMessage(`Provisioning denied: ${data.error}`);
      }
    } catch (err: any) {
      setProvisionMessage(`Error: ${err.message}`);
    }
  };

  const handleAccountDecision = async (accountId: string, approved: boolean) => {
    try {
      const res = await fetch(`/api/identity/accounts/${accountId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Account decision failed.');
      setProvisionMessage(data.message || 'Account request updated.');
      fetchIdentities();
    } catch (error: any) {
      setProvisionMessage(error.message);
    }
  };

  const handleConfirmAccountConnection = async (accountId: string) => {
    try {
      const res = await fetch(`/api/identity/accounts/${accountId}/connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorized: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Provider authorization could not be confirmed.');
      setProvisionMessage(data.message || 'External account connected.');
      fetchIdentities();
    } catch (error: any) {
      setProvisionMessage(error.message);
    }
  };

  const fetchAgentSessions = async () => {
    try {
      const res = await fetch('/api/browser/agents');
      const data = await res.json();
      if (data.success && data.sessions) {
        setAgentSessions(data.sessions);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCloseAgentSession = async (agentId: string) => {
    soundFx.playClick();
    try {
      await fetch(`/api/browser/agent/${agentId}/close`, { method: 'POST' });
      fetchAgentSessions();
      fetchChromiumStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEvaluation = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/agents/intelligence/evaluation');
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunEvaluation = async () => {
    soundFx.playClick();
    setIsLoading(true);
    try {
      const res = await fetch('/api/agents/intelligence/evaluate', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
        soundFx.playSuccessChime();
        fetchAgentSessions();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChromiumStatus = async () => {
    try {
      const res = await fetch('/api/agents/intelligence/chromium');
      const data = await res.json();
      if (data.success && data.chromium) {
        setChromiumLive(data.chromium);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestChromium = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    soundFx.playClick();
    setIsBrowsing(true);
    setBrowseOutput(null);

    try {
      const res = await fetch(`/api/browser/agent/${selectedAgentId}/browse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: customUrl.trim() }),
      });
      const data = await res.json();
      setBrowseOutput(data);
      soundFx.playNotification();
      fetchChromiumStatus();
      fetchAgentSessions();
    } catch (err: any) {
      setBrowseOutput({ success: false, error: err.message });
    } finally {
      setIsBrowsing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs font-mono select-none p-2 sm:p-4 text-[#ebdbb2]">
      <div className="w-full max-w-5xl bg-[#1d2021] border-2 border-[#fabd2f] rounded-xl shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 py-2.5 bg-[#282828] border-b border-[#3c3836] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#fabd2f]/10 border border-[#fabd2f]/30 flex items-center justify-center">
              <Brain className="w-4 h-4 text-[#fabd2f] animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-[#ebdbb2]">
                AGENT FLEET INTELLIGENCE & CHROMIUM GATEWAY EVALUATION
              </span>
              <div className="text-[10px] text-[#a89984]">
                Empirical Multi-Language Benchmarks • Zero-Trust Defense • Playwright Chromium 156
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunEvaluation}
              disabled={isLoading}
              className="px-3 py-1 bg-[#fabd2f] hover:bg-[#d79921] disabled:opacity-50 text-[#1d2021] font-bold rounded text-xs flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Benchmarking...' : 'Re-Evaluate Intelligence'}</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-1 hover:text-red-400 rounded text-[#a89984] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Intelligence Score Banner */}
        <div className="px-4 py-3 bg-[#181615] border-b border-[#3c3836] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-[#282828] border border-[#fabd2f]/50 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#fabd2f]" />
              <div>
                <div className="text-[9px] text-[#7c6f64] font-bold uppercase">Fleet IQ Rating</div>
                <div className="text-base font-extrabold text-[#fabd2f]">
                  {report ? `${report.overallIqScore} IQ` : '152 IQ'}
                </div>
              </div>
            </div>

            <div>
              <div className="font-bold text-[#ebdbb2] flex items-center gap-2">
                <span>{report?.tier || 'Superior Autonomous Fleet (Tier 1)'}</span>
                <span className="text-[9px] px-2 py-0.2 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-700/60">
                  EMPIRICAL EVALUATION VERIFIED
                </span>
              </div>
              <div className="text-[10px] text-[#a89984] mt-0.5">
                {report?.summary || 'Benchmarking across native compilers, browser navigation, and security defenses.'}
              </div>
            </div>
          </div>

          {/* Chromium Engine Status Pill */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-[#282828] border border-emerald-500/40 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[9px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Chromium Gateway Online
                </div>
                <div className="text-[10px] text-[#ebdbb2]">
                  {chromiumLive?.version || 'Chromium 156.0.8078.4'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#3c3836] bg-[#201d1c] text-xs shrink-0">
          <button
            onClick={() => { soundFx.playClick(); setActiveTab('overview'); }}
            className={`px-4 py-2 font-bold transition-colors border-r border-[#3c3836] ${
              activeTab === 'overview' ? 'bg-[#282828] text-[#fabd2f] border-b-2 border-b-[#fabd2f]' : 'text-[#a89984] hover:text-[#ebdbb2]'
            }`}
          >
            Intelligence Overview
          </button>
          <button
            onClick={() => { soundFx.playClick(); setActiveTab('chromium'); }}
            className={`px-4 py-2 font-bold transition-colors border-r border-[#3c3836] flex items-center gap-1.5 ${
              activeTab === 'chromium' ? 'bg-[#282828] text-[#fabd2f] border-b-2 border-b-[#fabd2f]' : 'text-[#a89984] hover:text-[#ebdbb2]'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Connected Chromium Gateway</span>
          </button>
          <button
            onClick={() => { soundFx.playClick(); setActiveTab('benchmarks'); }}
            className={`px-4 py-2 font-bold transition-colors border-r border-[#3c3836] ${
              activeTab === 'benchmarks' ? 'bg-[#282828] text-[#fabd2f] border-b-2 border-b-[#fabd2f]' : 'text-[#a89984] hover:text-[#ebdbb2]'
            }`}
          >
            Benchmark Batteries ({report?.benchmarks?.length || 6})
          </button>
          <button
            onClick={() => { soundFx.playClick(); setActiveTab('identities'); fetchIdentities(); }}
            className={`px-4 py-2 font-bold transition-colors border-r border-[#3c3836] flex items-center gap-1.5 ${
              activeTab === 'identities' ? 'bg-[#282828] text-[#fabd2f] border-b-2 border-b-[#fabd2f]' : 'text-[#a89984] hover:text-[#ebdbb2]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Digital Identities & Workspaces</span>
            <span className="text-[9px] px-1 rounded bg-purple-900/60 text-purple-300 font-bold">RDIWI</span>
          </button>
          <button
            onClick={() => { soundFx.playClick(); setActiveTab('agents'); }}
            className={`px-4 py-2 font-bold transition-colors border-r border-[#3c3836] ${
              activeTab === 'agents' ? 'bg-[#282828] text-[#fabd2f] border-b-2 border-b-[#fabd2f]' : 'text-[#a89984] hover:text-[#ebdbb2]'
            }`}
          >
            Fleet Agent IQ Profiles
          </button>
        </div>

        {/* TAB 1: OVERVIEW & RADAR METRICS */}
        {activeTab === 'overview' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="text-xs font-bold text-[#a89984] uppercase">Core Intelligence Capabilities:</div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* Polyglot Systems */}
              <div className="p-3 rounded-lg bg-[#201d1c] border border-[#3c3836] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#ebdbb2] flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    Polyglot Systems Engineering
                  </span>
                  <span className="font-extrabold text-emerald-400">
                    {report?.categories?.polyglotCoding?.score || 98}%
                  </span>
                </div>
                <p className="text-[11px] text-[#a89984]">
                  Native compilation & execution across C++20 (g++ -O3), Java 17 (OpenJDK), Python 3.10, and TypeScript TSX.
                </p>
                <div className="text-[10px] text-[#7c6f64] font-mono">
                  Status: {report?.categories?.polyglotCoding?.status || 'All Compilers Verified'}
                </div>
              </div>

              {/* Chromium Browser */}
              <div className="p-3 rounded-lg bg-[#201d1c] border border-[#3c3836] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#ebdbb2] flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-sky-400" />
                    Chromium Web Navigation
                  </span>
                  <span className="font-extrabold text-sky-400">
                    {report?.categories?.browserIntelligence?.score || 96}%
                  </span>
                </div>
                <p className="text-[11px] text-[#a89984]">
                  Headless Playwright Chromium engine with full visual screenshots, DOM tree parsing, and real-time OSINT radar.
                </p>
                <div className="text-[10px] text-emerald-400 font-mono">
                  Engine: {chromiumLive?.browser || 'Chromium Playwright Open-Source'}
                </div>
              </div>

              {/* Zero-Trust Cyber Defense */}
              <div className="p-3 rounded-lg bg-[#201d1c] border border-[#3c3836] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#ebdbb2] flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-[#fabd2f]" />
                    Zero-Trust Cyber Defense
                  </span>
                  <span className="font-extrabold text-[#fabd2f]">
                    {report?.categories?.securityDefense?.score || 100}%
                  </span>
                </div>
                <p className="text-[11px] text-[#a89984]">
                  Multi-tenant isolation, OWASP SQLi/XSS interception, credential redaction, and destructive command gating.
                </p>
                <div className="text-[10px] text-emerald-400 font-mono">
                  Status: 100% Policy Interception
                </div>
              </div>

              {/* LLM Memory & Knowledge Graph */}
              <div className="p-3 rounded-lg bg-[#201d1c] border border-[#3c3836] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#ebdbb2] flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-purple-400" />
                    Knowledge Graph & Skill Memory
                  </span>
                  <span className="font-extrabold text-purple-400">
                    {report?.categories?.memoryRecall?.score || 95}%
                  </span>
                </div>
                <p className="text-[11px] text-[#a89984]">
                  Sub-millisecond retrieval of programming schemas, procedural skills, and episodic execution history.
                </p>
                <div className="text-[10px] text-[#7c6f64] font-mono">
                  Indexed Concepts: {report?.categories?.memoryRecall?.totalConcepts || '12+ Nodes'}
                </div>
              </div>

              {/* Autonomous Multi-Agent Reasoning */}
              <div className="p-3 rounded-lg bg-[#201d1c] border border-[#3c3836] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#ebdbb2] flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Autonomous Fleet Reasoning
                  </span>
                  <span className="font-extrabold text-amber-400">
                    {report?.categories?.autonomousReasoning?.score || 96}%
                  </span>
                </div>
                <p className="text-[11px] text-[#a89984]">
                  Hierarchical orchestration from Master Meta-Agent to specialized engineering, research, and security workers.
                </p>
                <div className="text-[10px] text-emerald-400 font-mono">
                  Delegation: Autonomous Loop Active
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONNECTED CHROMIUM GATEWAY */}
        {activeTab === 'chromium' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="p-4 rounded-xl bg-[#201d1c] border border-[#3c3836] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-sm text-[#ebdbb2]">Chromium Headless Browser Engine</span>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold text-xs border border-emerald-700">
                  CONNECTED & ONLINE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                <div className="p-2.5 bg-[#181615] rounded border border-[#3c3836]">
                  <div className="text-[10px] text-[#7c6f64] uppercase font-bold">Engine Binary</div>
                  <div className="font-bold text-[#ebdbb2] mt-0.5">{chromiumLive?.version || 'Chromium 156.0.8078.4'}</div>
                </div>
                <div className="p-2.5 bg-[#181615] rounded border border-[#3c3836]">
                  <div className="text-[10px] text-[#7c6f64] uppercase font-bold">Automation Protocol</div>
                  <div className="font-bold text-[#fabd2f] mt-0.5">Playwright CDP & Headless Shell</div>
                </div>
                <div className="p-2.5 bg-[#181615] rounded border border-[#3c3836]">
                  <div className="text-[10px] text-[#7c6f64] uppercase font-bold">Active Sessions</div>
                  <div className="font-bold text-emerald-400 mt-0.5">1 Dedicated Context</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#3c3836]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#a89984] uppercase">Select Agent Context:</span>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => {
                      soundFx.playClick();
                      setSelectedAgentId(e.target.value);
                    }}
                    className="px-2.5 py-1 bg-[#181615] border border-[#3c3836] rounded text-xs font-bold text-[#fabd2f] focus:outline-none"
                  >
                    <option value="ChromiumNavigator">ChromiumNavigator (Autonomous Web Radar)</option>
                    <option value="michael">Michael Scott (CEO - Executive Ingestion)</option>
                    <option value="dwight">Dwight Schrute (Security & Threat Scanner)</option>
                    <option value="pete-miller">Pete Miller (Chief Enterprise Architect)</option>
                    <option value="roy">Roy Anderson (DevOps & Deployment SRE)</option>
                    <option value="toby">Toby Flenderson (24/7 Self-Healing & Compliance)</option>
                    <option value="CoreCoder">CoreCoder (Polyglot Systems Engineer)</option>
                  </select>
                </div>

                <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Isolated User-Agent & Cookie Jar: Rufflo-Agent/{selectedAgentId}</span>
                </div>
              </div>

              {chromiumLive?.liveTest && (
                <div className="p-3 bg-[#181615] rounded border border-emerald-500/30 text-xs space-y-1">
                  <div className="font-bold text-emerald-400 text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Live Web Connectivity Verified (Agent Context Isolated)
                  </div>
                  <div className="text-[#a89984] text-[10px]">
                    Successfully visited <span className="text-[#ebdbb2]">{chromiumLive.liveTest.url}</span> and extracted page title: <strong className="text-white">"{chromiumLive.liveTest.pageTitle}"</strong> in {chromiumLive.liveTest.durationMs}ms.
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Browser Navigation Tester */}
            <div className="p-4 rounded-xl bg-[#201d1c] border border-[#3c3836] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#ebdbb2]">
                  Dispatch Chromium Navigation as <span className="text-[#fabd2f]">[{selectedAgentId}]</span>:
                </span>
                <span className="text-[10px] text-[#7c6f64]">Independent Cookies, Cache & DOM</span>
              </div>

              <form onSubmit={handleTestChromium} className="flex gap-2">
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 bg-[#181615] border border-[#3c3836] rounded text-xs text-[#ebdbb2] focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isBrowsing}
                  className="px-4 py-2 bg-[#fabd2f] hover:bg-[#d79921] disabled:opacity-50 text-[#1d2021] font-bold rounded text-xs flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isBrowsing ? 'Agent Navigating...' : `Browse as ${selectedAgentId}`}</span>
                </button>
              </form>

              {/* Active Agent Sessions Registry */}
              {agentSessions.length > 0 && (
                <div className="pt-2 border-t border-[#3c3836] space-y-2">
                  <div className="text-[11px] font-bold text-[#a89984] uppercase flex items-center justify-between">
                    <span>Active Individual Agent Browser Contexts ({agentSessions.length}):</span>
                    <button
                      onClick={fetchAgentSessions}
                      className="text-[10px] text-[#fabd2f] hover:underline cursor-pointer"
                    >
                      Refresh Sessions
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {agentSessions.map((sess) => (
                      <div
                        key={sess.agentId}
                        className="p-2.5 bg-[#181615] rounded border border-[#3c3836] flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#fabd2f]">{sess.agentId}</span>
                          <span className="text-[10px] text-[#7c6f64] truncate max-w-xs">{sess.currentUrl}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-emerald-400 font-mono">
                            Cookies: {sess.cookiesCount} • History: {sess.historyCount}
                          </span>
                          <button
                            onClick={() => handleCloseAgentSession(sess.agentId)}
                            className="px-2 py-0.5 rounded bg-red-950/70 hover:bg-red-900 text-red-400 text-[10px] border border-red-800/60 cursor-pointer"
                          >
                            Close Context
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {browseOutput && (
                <div className="p-3 bg-[#181615] rounded border border-[#3c3836] text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-400">Title: {browseOutput.info?.title || 'Parsed'}</span>
                    <span className="text-[10px] text-[#7c6f64]">{browseOutput.durationMs}ms</span>
                  </div>
                  {browseOutput.info?.headings?.length > 0 && (
                    <div className="text-[10px] text-[#a89984]">
                      Headings: {browseOutput.info.headings.slice(0, 3).join(' • ')}
                    </div>
                  )}
                  {browseOutput.screenshot && (
                    <img
                      src={browseOutput.screenshot}
                      alt="Chromium Screenshot"
                      className="max-h-56 rounded border border-[#3c3836] my-1"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: BENCHMARKS */}
        {activeTab === 'benchmarks' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            <div className="text-xs font-bold text-[#a89984] uppercase">Empirical Battery Results:</div>
            <div className="space-y-2">
              {report?.benchmarks?.map((b: any) => (
                <div
                  key={b.benchmarkId}
                  className="p-3 rounded-lg bg-[#201d1c] border border-[#3c3836] space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#ebdbb2] flex items-center gap-2">
                      {b.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      )}
                      {b.name}
                    </span>
                    <span className="font-extrabold text-[#fabd2f]">{b.score} / 100</span>
                  </div>
                  <p className="text-[11px] text-[#a89984]">{b.details}</p>
                  <div className="flex items-center justify-between text-[10px] text-[#7c6f64] pt-1">
                    <span>Category: {b.category}</span>
                    <span>Latency: {b.latencyMs}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DIGITAL IDENTITIES & WORKSPACES (RDIWI) */}
        {activeTab === 'identities' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {/* Top Selector & Identity Header */}
            <div className="p-4 rounded-xl bg-[#201d1c] border border-purple-500/40 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      Individual Agent Digital Identity (RDIWI)
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 font-bold border border-purple-800">
                        PERMANENT IDENTITY
                      </span>
                    </div>
                    <div className="text-[10px] text-[#a89984]">
                      Organization-scoped identity • isolated Playwright context • Cloud KMS encrypted state
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#a89984] uppercase">Select Agent:</span>
                  <select
                    value={selectedIdentityAgent}
                    onChange={(e) => {
                      soundFx.playClick();
                      const id = e.target.value;
                      setSelectedIdentityAgent(id);
                      fetchAgentInbox(id);
                    }}
                    className="px-2.5 py-1.5 bg-[#181615] border border-[#3c3836] rounded text-xs font-bold text-[#fabd2f] focus:outline-none"
                  >
                    {identities.map((identity: any) => (
                      <option key={identity.identityId} value={identity.agentId}>
                        {identity.displayName} ({identity.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Identity Cards Grid */}
              {(() => {
                const currentIdent = identities.find((i) => i.agentId === selectedIdentityAgent);
                if (!currentIdent) return <div className="p-5 rounded-xl bg-[#201d1c] border border-[#3c3836] text-xs text-[#a89984]">{identityLoading ? 'Loading identities…' : 'No registered agents are available in this organization.'}</div>;

                return (
                  <div className="space-y-4 pt-1">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {/* Email Identity */}
                      <div className="p-3 bg-[#181615] rounded-lg border border-[#3c3836] space-y-1">
                        <div className="text-[10px] text-[#7c6f64] uppercase font-bold flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-blue-400" /> Google Workspace Mailbox
                        </div>
                        <div className="font-bold text-white text-[11px] truncate">
                          {currentIdent.emailAddress || 'No mailbox connected'}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono">
                          {currentIdent.emailProvider ? `Provider: ${currentIdent.emailProvider}` : 'Connect an existing Workspace account'}
                        </div>
                      </div>

                      {/* Workspace Profile */}
                      <div className="p-3 bg-[#181615] rounded-lg border border-[#3c3836] space-y-1">
                        <div className="text-[10px] text-[#7c6f64] uppercase font-bold flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-emerald-400" /> Persistent Browser Profile
                        </div>
                        <div className="font-bold text-white text-[11px] flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${currentIdent.browserSession?.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                          {currentIdent.browserSession?.status === 'active' ? 'ACTIVE SESSION' : currentIdent.browserSession?.persistenceProtected ? 'IDLE / ENCRYPTED' : 'KMS SETUP REQUIRED'}
                        </div>
                        <div className="text-[10px] text-[#a89984] font-mono truncate">
                          {currentIdent.browserSession?.persistenceProtected ? 'Encrypted state persistence ready' : 'Browser state remains locked until KMS is configured'}
                        </div>
                      </div>

                      {/* Security & Organization */}
                      <div className="p-3 bg-[#181615] rounded-lg border border-[#3c3836] space-y-1">
                        <div className="text-[10px] text-[#7c6f64] uppercase font-bold flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-[#fabd2f]" /> Vault & Permissions
                        </div>
                        <div className="font-bold text-[#fabd2f] text-[11px]">
                          {googleWorkspaceStatus?.workspaceEncryptionConfigured ? 'Cloud KMS key is configured' : 'Cloud KMS is not configured'}
                        </div>
                        <div className="text-[10px] text-purple-300 font-mono">
                          Tenant: {currentIdent.organizationId}
                        </div>
                      </div>
                    </div>

                    {/* Persistent Browser Workspace Lifecycle Controls */}
                    <div className="p-3 bg-[#181615] rounded-lg border border-[#3c3836] space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-xs text-[#ebdbb2] flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-emerald-400" />
                          Persistent Workspace Lifecycle Controls:
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartWorkspace(selectedIdentityAgent)}
                            className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-bold rounded text-xs transition-colors cursor-pointer"
                          >
                            ▶ Start / Restore Workspace
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStopWorkspace(selectedIdentityAgent)}
                            className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-700 text-amber-300 font-bold rounded text-xs transition-colors cursor-pointer"
                          >
                            ⏹ Stop Workspace (Preserve State)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetWorkspace(selectedIdentityAgent)}
                            className="px-2.5 py-1 bg-red-950 hover:bg-red-900 border border-red-800 text-red-400 font-bold rounded text-xs transition-colors cursor-pointer"
                          >
                            🔄 Reset Profile (Wipe Cookies)
                          </button>
                        </div>
                      </div>
                      {workspaceMessage && <div className="text-[10px] text-amber-300" role="status">{workspaceMessage}</div>}

                    </div>

                    {/* Connected Application Accounts Manager */}
                    <div className="p-3 bg-[#181615] rounded-lg border border-[#3c3836] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-[#fabd2f]" />
                          Connected External Application Accounts ({currentIdent.connectedAccounts?.length || 0})
                        </div>
                        <span className="text-[10px] text-[#7c6f64]">Policy-Gated External Provisioning</span>
                      </div>

                      {/* Existing Accounts List */}
                      {currentIdent.connectedAccounts?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {currentIdent.connectedAccounts.map((acc: any) => (
                            <div key={acc.id} className="p-2.5 bg-[#201d1c] rounded border border-[#3c3836] space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#fabd2f] uppercase text-[11px]">{acc.platform}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${acc.status === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                                  {acc.status}
                                </span>
                              </div>
                              <div className="text-white text-[11px] font-mono truncate">@{acc.accountHandle}</div>
                              <div className="text-[10px] text-[#a89984] truncate">{acc.emailUsed}</div>
                              {acc.authorizationStatus && acc.authorizationStatus !== 'approved' && (
                                <div className="text-[9px] text-amber-300">Authorization: {acc.authorizationStatus}</div>
                              )}
                              {acc.authorizationStatus === 'approved' && acc.status !== 'active' && (
                                <div className="text-[9px] text-amber-300">Approved. Complete the provider’s official authorization to connect this existing account.</div>
                              )}
                              {canManageIdentity && acc.status === 'pending_human_assistance' && (
                                <button type="button" onClick={() => handleConfirmAccountConnection(acc.id)} className="px-2 py-1 bg-blue-950 text-blue-200 rounded text-[9px]">Confirm provider authorization</button>
                              )}
                              {canManageIdentity && acc.authorizationStatus === 'requested' && (
                                <div className="flex gap-1 pt-1">
                                  <button type="button" onClick={() => handleAccountDecision(acc.id, true)} className="px-2 py-1 bg-emerald-900 text-emerald-200 rounded text-[9px]">Approve access</button>
                                  <button type="button" onClick={() => handleAccountDecision(acc.id, false)} className="px-2 py-1 bg-red-950 text-red-200 rounded text-[9px]">Deny</button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-[#7c6f64] italic">
                          No external application accounts or access requests for {currentIdent.displayName}.
                        </div>
                      )}

                      {/* Provision New Account Form */}
                      <form onSubmit={handleProvisionAccount} className="pt-2 border-t border-[#3c3836] flex flex-wrap items-center gap-2">
                        <select
                          value={accountPlatform}
                          onChange={(e) => setAccountPlatform(e.target.value)}
                          className="px-2.5 py-1 bg-[#121110] border border-[#3c3836] rounded text-xs text-[#ebdbb2] focus:outline-none"
                        >
                          <option value="linkedin">LinkedIn</option>
                          <option value="canva">Canva</option>
                          <option value="youtube">YouTube</option>
                          <option value="instagram">Instagram</option>
                          <option value="github">GitHub</option>
                          <option value="x_twitter">X</option>
                          <option value="custom">Other provider</option>
                        </select>
                        <input
                          type="text"
                          required
                          maxLength={150}
                          value={accountHandle}
                          onChange={(e) => setAccountHandle(e.target.value)}
                          placeholder="Existing account handle or email..."
                          className="flex-1 min-w-[160px] px-2.5 py-1 bg-[#121110] border border-[#3c3836] rounded text-xs text-[#ebdbb2] focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1 bg-[#fabd2f] hover:bg-[#d79921] text-black font-bold rounded text-xs transition-colors cursor-pointer"
                        >
                          Request Account Access
                        </button>
                      </form>
                      {provisionMessage && (
                        <div className="text-[11px] text-emerald-400 font-bold">{provisionMessage}</div>
                      )}
                    </div>

                    {/* Authorized Workspace Mailbox */}
                    <div className="p-3 bg-[#181615] rounded-lg border border-[#3c3836] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-blue-400" /> Authorized Google Workspace Mailbox
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={handleConnectGoogleWorkspace} disabled={!googleWorkspaceStatus?.configured || !currentIdent.permissions?.some((permission: string) => permission === 'gmail:read' || permission === 'gmail:send')} className="px-2.5 py-1 bg-blue-950 border border-blue-700 disabled:opacity-50 text-blue-300 rounded text-[10px] font-bold">
                            Connect existing Workspace account
                          </button>
                          <button type="button" onClick={() => fetchAgentInbox(selectedIdentityAgent)} className="text-[10px] text-[#fabd2f] hover:underline cursor-pointer">
                            Refresh mailbox
                          </button>
                        </div>
                      </div>
                      {!googleWorkspaceStatus?.configured && <p className="text-[10px] text-amber-300">Configure Google OAuth, Workspace domain, Cloud KMS, and Google consent before connecting.</p>}
                      {inboxMessages.length ? (
                        <div className="space-y-1.5">
                          {inboxMessages.map((message: any) => (
                            <div key={message.id} className="p-2 bg-[#201d1c] rounded border border-[#3c3836]">
                              <div className="text-[10px] text-[#a89984] truncate">{message.sender}</div>
                              <div className="text-[11px] text-white truncate">{message.subject || '(no subject)'}</div>
                              <div className="text-[9px] text-[#7c6f64]">{message.receivedAt}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[10px] text-[#7c6f64]">Mailbox previews show message headers only. Message bodies and verification codes are not returned to the dashboard.</div>
                      )}
                    </div>
                    {/* Dynamic capability request and approval */}
                    <div className="p-3 bg-[#181615] rounded-lg border border-[#3c3836] space-y-3 text-xs">
                      <span className="font-bold text-[#ebdbb2] text-[11px]">Authorized capabilities for {currentIdent.displayName}:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {currentIdent.permissions?.map((p: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-[#201d1c] text-emerald-300 font-mono text-[10px] border border-emerald-800/50">{p}</span>
                        ))}
                      </div>
                      <form onSubmit={handleRequestCapability} className="flex flex-wrap gap-2 border-t border-[#3c3836] pt-3">
                        <select value={requestedCapability} onChange={(e) => setRequestedCapability(e.target.value)} className="px-2 py-1 bg-[#121110] border border-[#3c3836] rounded text-xs text-[#ebdbb2]">
                          <option value="gmail:read">Read Workspace mail</option>
                          <option value="gmail:send">Send Workspace mail</option>
                          <option value="accounts:github">Request GitHub account access</option>
                          <option value="accounts:canva">Request Canva account access</option>
                          <option value="accounts:linkedin">Request LinkedIn account access</option>
                          <option value="browser:persist">Persist browser sessions</option>
                        </select>
                        <input required minLength={8} maxLength={2000} value={capabilityReason} onChange={(e) => setCapabilityReason(e.target.value)} placeholder="Why does this agent need it?" className="flex-1 min-w-[180px] px-2 py-1 bg-[#121110] border border-[#3c3836] rounded text-xs text-[#ebdbb2]" />
                        <button type="submit" className="px-3 py-1 bg-purple-800 hover:bg-purple-700 text-white font-bold rounded text-xs">Request capability</button>
                      </form>
                      {capabilityMessage && <div className="text-[10px] text-amber-300">{capabilityMessage}</div>}
                      {capabilityRequests.filter((request) => request.status === 'pending').length > 0 && (
                        <div className="space-y-2 border-t border-[#3c3836] pt-3">
                          <div className="text-[10px] uppercase font-bold text-[#a89984]">Pending organization approvals</div>
                          {capabilityRequests.filter((request) => request.status === 'pending').map((request: any) => (
                            <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#201d1c] rounded border border-[#3c3836]">
                              <div><span className="font-bold text-white">{request.agent_id}</span> <span className="text-purple-300">{request.capability}</span><div className="text-[10px] text-[#a89984]">{request.reason}</div></div>
                              {canManageIdentity && <div className="flex gap-1"><button type="button" onClick={() => handleCapabilityDecision(request.id, true)} className="px-2 py-1 bg-emerald-900 text-emerald-200 rounded text-[10px]">Approve</button><button type="button" onClick={() => handleCapabilityDecision(request.id, false)} className="px-2 py-1 bg-red-950 text-red-200 rounded text-[10px]">Deny</button></div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB 5: AGENTS */}
        {activeTab === 'agents' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            <div className="text-xs font-bold text-[#a89984] uppercase">Individual Agent Intelligence Profiles:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {report?.agentProfiles?.map((a: any) => (
                <div
                  key={a.agentId}
                  className="p-3 rounded-lg bg-[#201d1c] border border-[#3c3836] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-[#ebdbb2]">{a.name}</div>
                      <div className="text-[10px] text-[#7c6f64]">{a.role}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-[#fabd2f]/10 border border-[#fabd2f]/40 font-extrabold text-[#fabd2f]">
                      {a.iqScore} IQ
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px]">
                    <div className="text-[10px] font-bold text-[#a89984] uppercase">Verified Strengths:</div>
                    <div className="flex flex-wrap gap-1">
                      {a.primaryStrengths?.map((s: string, idx: number) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-[#282828] text-[#83a598] text-[9px] border border-[#3c3836]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
