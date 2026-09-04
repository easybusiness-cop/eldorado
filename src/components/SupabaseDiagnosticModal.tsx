import React, { useState, useEffect } from 'react';
import {
  runSupabaseDiagnostic,
  SupabaseDiagnosticResult,
  getSupabaseClient,
} from '../services/supabaseDiagnosticService';
import { soundFx } from '../utils/speech';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  UserCheck,
  Building2,
  Shield,
  Terminal,
  Activity,
  Copy,
  Check,
  Key,
  ExternalLink,
  Cpu,
  Server,
  Zap,
} from 'lucide-react';

interface SupabaseDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseDiagnosticModal: React.FC<SupabaseDiagnosticModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [diagnosticResult, setDiagnosticResult] = useState<SupabaseDiagnosticResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [serverResult, setServerResult] = useState<any | null>(null);
  const [isTestingServer, setIsTestingServer] = useState<boolean>(false);
  const [copiedLogs, setCopiedLogs] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'organization' | 'logs' | 'env'>('overview');

  const executeDiagnostic = async () => {
    setIsRunning(true);
    soundFx.playClick();
    try {
      const res = await runSupabaseDiagnostic();
      setDiagnosticResult(res);
      if (res.status === 'ok') {
        soundFx.playSuccessChime();
      } else {
        soundFx.playNotification();
      }
    } catch (err: any) {
      console.error('[Supabase Diagnostic Error]:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const executeServerDiagnostic = async () => {
    setIsTestingServer(true);
    soundFx.playClick();
    try {
      const res = await fetch('/api/supabase/diagnostic');
      const data = await res.json();
      setServerResult(data);
      console.log('[Server Supabase Diagnostic Result]:', data);
    } catch (err) {
      console.error('[Server Diagnostic Fetch Exception]:', err);
    } finally {
      setIsTestingServer(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      executeDiagnostic();
      executeServerDiagnostic();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLogs = () => {
    if (!diagnosticResult) return;
    const textLogs = diagnosticResult.logs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(textLogs);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const status = diagnosticResult?.status || 'unconfigured';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs font-mono p-4 select-none">
      <div className="w-full max-w-4xl bg-[#181615] border-2 border-[#3c3836] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 text-[#ebdbb2]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#282828] border-b border-[#3c3836] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1d2021] border border-[#504945] rounded-lg">
              <Database className="w-5 h-5 text-[#fabd2f] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#ebdbb2] tracking-wide uppercase">
                  Supabase Connection & Diagnostic Sweep
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#3c3836] text-[#fe8019] border border-[#504945] font-semibold">
                  v2.112 SDK
                </span>
              </div>
              <p className="text-xs text-[#a89984]">
                Authenticates session, queries profile metadata, and validates organization memberships.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1.5 hover:bg-[#3c3836] rounded-lg text-[#a89984] hover:text-[#ebdbb2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Status Banner */}
        <div className="p-5 bg-[#1d2021] border-b border-[#3c3836]">
          {isRunning ? (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#282828] border border-[#458588]/50 animate-pulse">
              <RefreshCw className="w-6 h-6 text-[#83a598] animate-spin" />
              <div>
                <h3 className="text-sm font-bold text-[#83a598]">Running Supabase Verification...</h3>
                <p className="text-xs text-[#a89984]">Checking connection ping, profiles table, and user permissions.</p>
              </div>
            </div>
          ) : status === 'ok' ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-950/40 border-2 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <div className="flex items-center gap-3.5">
                <div className="p-2 bg-emerald-900/60 border border-emerald-500 rounded-full">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-emerald-400 tracking-wide uppercase">
                      Supabase Sync OK
                    </h3>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-600">
                      ⚡ {diagnosticResult?.latencyMs || 0}ms Latency
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/80 mt-0.5">
                    {diagnosticResult?.message}
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={executeDiagnostic}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 border border-emerald-500"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Re-test
                </button>
              </div>
            </div>
          ) : status === 'error' ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-red-950/40 border-2 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
              <div className="flex items-center gap-3.5">
                <div className="p-2 bg-red-900/60 border border-red-500 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-red-400 tracking-wide uppercase">
                      Supabase Sync Error
                    </h3>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-900/80 text-red-300 border border-red-600">
                      Code: {diagnosticResult?.errorDetails?.code || 'FETCH_FAIL'}
                    </span>
                  </div>
                  <p className="text-xs text-red-200/90 mt-0.5">
                    {diagnosticResult?.message}
                  </p>
                </div>
              </div>
              <button
                onClick={executeDiagnostic}
                className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-red-100 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 border border-red-500"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-xl bg-amber-950/40 border-2 border-amber-500/60">
              <div className="flex items-center gap-3.5">
                <div className="p-2 bg-amber-900/60 border border-amber-500 rounded-full">
                  <Key className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-amber-400 tracking-wide uppercase">
                      Supabase Unconfigured / Fallback Mode
                    </h3>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-900/80 text-amber-300 border border-amber-600">
                      Demo Mode Active
                    </span>
                  </div>
                  <p className="text-xs text-amber-200/90 mt-0.5">
                    Environment variables VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY are not configured yet.
                  </p>
                </div>
              </div>
              <button
                onClick={executeDiagnostic}
                className="px-3 py-1.5 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 border border-amber-500"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Verify Again
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2 bg-[#282828] border-b border-[#3c3836] flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'overview'
                ? 'bg-[#fabd2f] text-[#282828]'
                : 'text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#3c3836]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Diagnostic Summary
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'profile'
                ? 'bg-[#fabd2f] text-[#282828]'
                : 'text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#3c3836]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> User Profile
          </button>
          <button
            onClick={() => setActiveTab('organization')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'organization'
                ? 'bg-[#fabd2f] text-[#282828]'
                : 'text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#3c3836]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Organization Membership
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'logs'
                ? 'bg-[#fabd2f] text-[#282828]'
                : 'text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#3c3836]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" /> Console Logs ({diagnosticResult?.logs.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'env'
                ? 'bg-[#fabd2f] text-[#282828]'
                : 'text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#3c3836]'
            }`}
          >
            <Key className="w-3.5 h-3.5" /> Environment Keys
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Card 1: Auth Status */}
                <div className="p-4 bg-[#282828] border border-[#3c3836] rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#a89984] mb-2">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Shield className="w-3.5 h-3.5 text-[#83a598]" /> Auth Session
                      </span>
                      {diagnosticResult?.authUser.authenticated ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3c3836] text-[#a89984]">
                          Unauthenticated
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-[#ebdbb2] truncate">
                      {diagnosticResult?.authUser.email || 'Anonymous / Guest Operator'}
                    </div>
                    <div className="text-[11px] text-[#928374] mt-1 font-mono truncate">
                      ID: {diagnosticResult?.authUser.id || 'N/A'}
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-[#83a598]">
                    supabase.auth.getUser() Verified
                  </div>
                </div>

                {/* Card 2: Profile Metadata */}
                <div className="p-4 bg-[#282828] border border-[#3c3836] rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#a89984] mb-2">
                      <span className="flex items-center gap-1.5 font-bold">
                        <UserCheck className="w-3.5 h-3.5 text-[#b8bb26]" /> Profile Record
                      </span>
                      {diagnosticResult?.profile ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          Found
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                          Fallback
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-[#ebdbb2] truncate">
                      {diagnosticResult?.profile?.fullName || 'Rufflo Executive Operator'}
                    </div>
                    <div className="text-[11px] text-[#fabd2f] mt-1">
                      {diagnosticResult?.profile?.role || 'Enterprise Architect'} • {diagnosticResult?.profile?.department || 'Executive'}
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-[#b8bb26]">
                    Table: profiles
                  </div>
                </div>

                {/* Card 3: Organization Membership */}
                <div className="p-4 bg-[#282828] border border-[#3c3836] rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#a89984] mb-2">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Building2 className="w-3.5 h-3.5 text-[#d3869b]" /> Org Membership
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                        {diagnosticResult?.organizationMemberships.length || 0} Orgs
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[#ebdbb2] truncate">
                      {diagnosticResult?.organizationMemberships[0]?.organizationName || 'Dunder Mifflin Scranton Branch'}
                    </div>
                    <div className="text-[11px] text-[#d3869b] mt-1">
                      Role: {diagnosticResult?.organizationMemberships[0]?.role || 'Fleet Executive'}
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-[#d3869b]">
                    Table: organization_members
                  </div>
                </div>

              </div>

              {/* Server-Side vs Client-Side Diagnostic Breakdown */}
              <div className="p-5 bg-[#282828] border border-[#3c3836] rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#83a598]" />
                    <h3 className="text-sm font-bold text-[#ebdbb2] uppercase tracking-wide">
                      Server-Side Express Verification Endpoint (/api/supabase/diagnostic)
                    </h3>
                  </div>
                  <button
                    onClick={executeServerDiagnostic}
                    disabled={isTestingServer}
                    className="px-3 py-1 bg-[#3c3836] hover:bg-[#504945] text-xs font-semibold rounded text-[#ebdbb2] transition-colors flex items-center gap-1"
                  >
                    {isTestingServer ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-[#fabd2f]" />}
                    Ping Server Endpoint
                  </button>
                </div>

                {serverResult ? (
                  <div className="p-3 bg-[#1d2021] border border-[#3c3836] rounded-lg text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#b8bb26]">
                        Status: {serverResult.status?.toUpperCase()} ({serverResult.latencyMs}ms)
                      </span>
                      <span className="text-[11px] text-[#a89984]">
                        URL Preview: {serverResult.environment?.urlPreview || 'N/A'}
                      </span>
                    </div>
                    <p className="text-[#ebdbb2]">{serverResult.message}</p>
                    {serverResult.data && (
                      <div className="flex items-center gap-4 text-[11px] text-[#83a598] pt-1">
                        <span>Profiles Sample Count: {serverResult.data.profilesCount}</span>
                        <span>Organizations Sample Count: {serverResult.data.orgsCount}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#a89984] italic">
                    Click 'Ping Server Endpoint' to verify server-side SUPABASE_SERVICE_ROLE_KEY connectivity.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="p-5 bg-[#282828] border border-[#3c3836] rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#fabd2f] uppercase tracking-wide flex items-center gap-2">
                  <UserCheck className="w-4 h-4" /> Authenticated User Profile Data
                </h3>
                <span className="text-xs text-[#a89984]">Fetched via `profiles` table</span>
              </div>

              {diagnosticResult?.profile ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-[#1d2021] border border-[#3c3836] rounded-lg">
                    <span className="text-[#a89984] block mb-1">User ID</span>
                    <span className="text-[#ebdbb2] font-mono select-all">{diagnosticResult.profile.id}</span>
                  </div>
                  <div className="p-3 bg-[#1d2021] border border-[#3c3836] rounded-lg">
                    <span className="text-[#a89984] block mb-1">Email Address</span>
                    <span className="text-[#ebdbb2] font-mono">{diagnosticResult.profile.email || 'N/A'}</span>
                  </div>
                  <div className="p-3 bg-[#1d2021] border border-[#3c3836] rounded-lg">
                    <span className="text-[#a89984] block mb-1">Full Name</span>
                    <span className="text-[#ebdbb2] font-bold">{diagnosticResult.profile.fullName}</span>
                  </div>
                  <div className="p-3 bg-[#1d2021] border border-[#3c3836] rounded-lg">
                    <span className="text-[#a89984] block mb-1">Role & Department</span>
                    <span className="text-[#b8bb26] font-semibold">
                      {diagnosticResult.profile.role} ({diagnosticResult.profile.department})
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#1d2021] border border-[#3c3836] rounded-lg text-xs text-[#a89984]">
                  No direct profile row found for current user session in Supabase.
                </div>
              )}

              {diagnosticResult?.profile?.rawProfile && (
                <div>
                  <h4 className="text-xs font-bold text-[#a89984] uppercase mb-2">Raw JSON Payload from Supabase</h4>
                  <pre className="p-3 bg-[#1d2021] border border-[#3c3836] rounded-lg text-[11px] text-[#b8bb26] overflow-x-auto">
                    {JSON.stringify(diagnosticResult.profile.rawProfile, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'organization' && (
            <div className="p-5 bg-[#282828] border border-[#3c3836] rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#fabd2f] uppercase tracking-wide flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Organization Membership Data
                </h3>
                <span className="text-xs text-[#a89984]">Fetched via `organization_members` table</span>
              </div>

              {diagnosticResult?.organizationMemberships.map((org, index) => (
                <div key={org.id || index} className="p-4 bg-[#1d2021] border border-[#3c3836] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#ebdbb2]">{org.organizationName}</h4>
                      <p className="text-xs text-[#a89984]">Org ID: {org.organizationId}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded bg-[#3c3836] text-[#fabd2f] font-bold border border-[#504945]">
                      Role: {org.role}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#3c3836]">
                    <span className="text-[11px] text-[#a89984]">Permissions:</span>
                    {org.permissions?.map((perm) => (
                      <span key={perm} className="text-[10px] px-2 py-0.5 bg-[#282828] border border-[#504945] rounded text-[#83a598]">
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#a89984] uppercase tracking-wide flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#83a598]" /> Diagnostic Verification Trace Log
                </h3>
                <button
                  onClick={handleCopyLogs}
                  className="px-3 py-1 bg-[#282828] hover:bg-[#3c3836] border border-[#3c3836] text-xs rounded text-[#ebdbb2] transition-colors flex items-center gap-1.5"
                >
                  {copiedLogs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLogs ? 'Copied to Clipboard' : 'Copy Logs'}
                </button>
              </div>

              <div className="p-4 bg-[#1d2021] border border-[#3c3836] rounded-xl font-mono text-xs space-y-2 max-h-[320px] overflow-y-auto">
                {diagnosticResult?.logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-[11px] leading-relaxed">
                    <span className="text-[#928374] shrink-0">[{log.timestamp}]</span>
                    <span
                      className={`font-bold shrink-0 uppercase ${
                        log.level === 'success'
                          ? 'text-emerald-400'
                          : log.level === 'error'
                          ? 'text-red-400'
                          : log.level === 'warn'
                          ? 'text-amber-400'
                          : 'text-[#83a598]'
                      }`}
                    >
                      [{log.level}]
                    </span>
                    <span className="text-[#ebdbb2] break-all">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'env' && (
            <div className="p-5 bg-[#282828] border border-[#3c3836] rounded-xl space-y-4 text-xs">
              <h3 className="text-sm font-bold text-[#fabd2f] uppercase tracking-wide flex items-center gap-2">
                <Key className="w-4 h-4" /> Supabase Environment Variable Configuration
              </h3>

              <p className="text-[#a89984] leading-relaxed">
                To connect Rufflo OS to a real hosted Supabase project, define the following variables in your local <code className="text-[#fabd2f] bg-[#1d2021] px-1.5 py-0.5 rounded">.env</code> file:
              </p>

              <div className="p-4 bg-[#1d2021] border border-[#3c3836] rounded-lg font-mono text-[11px] text-[#b8bb26] space-y-2 select-all">
                <div>VITE_SUPABASE_URL="https://your-project.supabase.co"</div>
                <div>VITE_SUPABASE_PUBLISHABLE_KEY="sb_pub_key_here..."</div>
                <div>SUPABASE_URL="https://your-project.supabase.co"</div>
                <div>SUPABASE_SERVICE_ROLE_KEY="sb_secret_key_here..."</div>
              </div>

              <div className="p-3 bg-[#1d2021] border border-[#3c3836] rounded-lg text-[#ebdbb2] space-y-1">
                <span className="font-bold text-[#83a598] block">Database Schema Requirement</span>
                <p className="text-[#a89984] text-[11px]">
                  Ensure your Supabase project contains the <code className="text-[#fabd2f]">profiles</code> table (keyed on <code className="text-[#fabd2f]">id</code>) and <code className="text-[#fabd2f]">organization_members</code> table (keyed on <code className="text-[#fabd2f]">user_id</code>).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#282828] border-t border-[#3c3836] flex items-center justify-between text-xs text-[#a89984]">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#fabd2f]" />
            <span>Rufflo Enterprise Supabase Diagnostic Module</span>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-4 py-1.5 bg-[#3c3836] hover:bg-[#504945] text-[#ebdbb2] font-bold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
