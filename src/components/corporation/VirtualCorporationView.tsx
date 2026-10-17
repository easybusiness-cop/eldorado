import React, { useState, useEffect } from 'react';
import {
  Building2,
  BrainCircuit,
  Users,
  FolderGit2,
  Compass,
  GitMerge,
  Scale,
  AlertOctagon,
  ShieldCheck,
  Search,
  Sparkles,
  ArrowRight,
  Send,
  Terminal,
  Cpu,
  Layers,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileText,
  DollarSign,
  ShieldAlert,
  Zap,
  RotateCcw,
  TrendingDown,
  Wrench,
  CheckCircle,
  Sliders,
  Activity,
  Repeat,
  RefreshCw,
} from 'lucide-react';
import {
  CompanyProfile,
  Department,
  PersistentVirtualEmployee,
  Project,
  WorldDiscovery,
  WorkflowInstance,
  DecisionRecord,
  FailureRecord,
  GovernanceAuditEntry,
  CompanyBrainAnswer,
  CompanyOptimizationAudit,
  IdentifiedInefficiency,
  InefficiencyCategory,
  RemediationResult,
} from '../../../server/corporation/types.ts';

type ActiveTab =
  | 'optimizer'
  | 'brain'
  | 'workforce'
  | 'org'
  | 'collaboration'
  | 'projects'
  | 'discoveries'
  | 'workflows'
  | 'incidents'
  | 'decisions'
  | 'failures'
  | 'governance';

export const VirtualCorporationView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('optimizer');
  const [loading, setLoading] = useState<boolean>(true);
  const [overview, setOverview] = useState<any>(null);

  // Optimizer & Continuous Remediation state
  const [audit, setAudit] = useState<CompanyOptimizationAudit | null>(null);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);
  const [remediating, setRemediating] = useState<boolean>(false);
  const [remediatingTargetId, setRemediatingTargetId] = useState<string | null>(null);
  const [remediationSuccessMsg, setRemediationSuccessMsg] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | InefficiencyCategory>('all');

  // Company Brain state
  const [brainQuestion, setBrainQuestion] = useState<string>('What is the company trying to accomplish?');
  const [brainAnswer, setBrainAnswer] = useState<CompanyBrainAnswer | null>(null);
  const [brainLoading, setBrainLoading] = useState<boolean>(false);

  // Workforce Dispatcher state
  const [dispatchTitle, setDispatchTitle] = useState<string>('Execute Zero-Trust SOC 2 Type II Security Readiness Audit');
  const [dispatchObjective, setDispatchObjective] = useState<string>('Scan all microservices, verify audit log immutability, check tool gateway permissions, and generate compliance report.');
  const [dispatchPriority, setDispatchPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [dispatchResult, setDispatchResult] = useState<any>(null);
  const [dispatchLoading, setDispatchLoading] = useState<boolean>(false);

  // Collaboration Fabric state
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedChannelScope, setSelectedChannelScope] = useState<string>('all');
  const [newMsgSubject, setNewMsgSubject] = useState<string>('');
  const [newMsgBody, setNewMsgBody] = useState<string>('');
  const [newMsgType, setNewMsgType] = useState<string>('status_report');
  const [sendingMsg, setSendingMsg] = useState<boolean>(false);

  // Terminal state for selected employee
  const [terminalCmd, setTerminalCmd] = useState<string>('git status');
  const [terminalLogs, setTerminalLogs] = useState<Array<{ cmd: string; out: string; time: string }>>([
    { cmd: 'whoami', out: 'hank.tate (Clearance: Level 85)', time: '10:00:00 AM' },
    { cmd: 'ls', out: 'README.md  workspace.config.json  src  audit_receipts', time: '10:05:00 AM' },
  ]);
  const [terminalExecuting, setTerminalExecuting] = useState<boolean>(false);

  // Org & Employee state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<PersistentVirtualEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<PersistentVirtualEmployee | null>(null);
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState<string>('');

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);

  // Discoveries state
  const [discoveries, setDiscoveries] = useState<WorldDiscovery[]>([]);
  const [scanningDiscoveries, setScanningDiscoveries] = useState<boolean>(false);

  // Workflows state
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>([]);
  const [creatingIncidentSimulation, setCreatingIncidentSimulation] = useState<boolean>(false);
  const [incidentActionId, setIncidentActionId] = useState<string | null>(null);
  const [incidentEvidence, setIncidentEvidence] = useState<Record<string, string>>({});
  const [incidentApprovalNotes, setIncidentApprovalNotes] = useState<Record<string, string>>({});
  const [incidentError, setIncidentError] = useState<string | null>(null);
  const [workflowApprovalNotes, setWorkflowApprovalNotes] = useState<Record<string, string>>({});
  const [workflowApprovalError, setWorkflowApprovalError] = useState<string | null>(null);

  // Decisions state
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);

  // Failures state
  const [failures, setFailures] = useState<FailureRecord[]>([]);

  // Audit state
  const [auditLog, setAuditLog] = useState<GovernanceAuditEntry[]>([]);

  // Fetch initial corporate data
  useEffect(() => {
    fetchCorporationOverview();
    fetchMessages();
  }, []);

  const dispatchCorporateTask = async () => {
    try {
      setDispatchLoading(true);
      const res = await fetch('/api/corporation/workforce/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: dispatchTitle,
          objective: dispatchObjective,
          priority: dispatchPriority,
          initiatorId: 'Executive Office',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDispatchResult(data.result);
        fetchCorporationOverview();
      }
    } catch (err) {
      console.error('Workforce dispatch error:', err);
    } finally {
      setDispatchLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/corporation/collaboration/messages');
      const data = await res.json();
      if (data.success) setMessages(data.messages);
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  };

  const sendStructuredMessage = async () => {
    if (!newMsgSubject.trim() || !newMsgBody.trim()) return;
    try {
      setSendingMsg(true);
      const res = await fetch('/api/corporation/collaboration/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newMsgSubject,
          body: newMsgBody,
          messageType: newMsgType,
          senderName: 'Michael G. Scott',
          senderRole: 'CEO & Fleet Commander',
          channelScope: selectedChannelScope === 'all' ? 'executive_council' : selectedChannelScope,
          recipientName: 'All Personnel',
          priority: 'high',
          requiresAction: newMsgType.includes('request'),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [data.message, ...prev]);
        setNewMsgSubject('');
        setNewMsgBody('');
      }
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setSendingMsg(false);
    }
  };

  const executeTerminalCommand = async () => {
    if (!selectedEmployee || !terminalCmd.trim()) return;
    try {
      setTerminalExecuting(true);
      const res = await fetch(`/api/corporation/environment/${selectedEmployee.id}/exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: terminalCmd }),
      });
      const data = await res.json();
      if (data.success) {
        setTerminalLogs((prev) => [
          ...prev,
          {
            cmd: terminalCmd,
            out: data.result.stdout || data.result.stderr,
            time: new Date().toLocaleTimeString(),
          },
        ]);
        setTerminalCmd('');
      }
    } catch (err) {
      console.error('Terminal execution error:', err);
    } finally {
      setTerminalExecuting(false);
    }
  };

  const fetchCorporationOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/corporation/overview');
      const data = await res.json();
      if (data.success) {
        setOverview(data);
        if (data.recentDiscoveries) setDiscoveries(data.recentDiscoveries);
        if (data.recentDecisions) setDecisions(data.recentDecisions);
        if (data.recentAuditEntries) setAuditLog(data.recentAuditEntries);
      }

      // Fetch full departments & employees
      const [deptRes, empRes, projRes, wfRes, failRes] = await Promise.all([
        fetch('/api/corporation/departments').then((r) => r.json()),
        fetch('/api/corporation/employees').then((r) => r.json()),
        fetch('/api/corporation/projects').then((r) => r.json()),
        fetch('/api/corporation/workflows').then((r) => r.json()),
        fetch('/api/corporation/failures').then((r) => r.json()),
      ]);

      if (deptRes.success) setDepartments(deptRes.departments);
      if (empRes.success) {
        setEmployees(empRes.employees);
        if (empRes.employees.length > 0 && !selectedEmployee) {
          setSelectedEmployee(empRes.employees[0]);
        }
      }
      if (projRes.success) setProjects(projRes.projects);
      if (wfRes.success) setWorkflows(wfRes.workflows);
      if (failRes.success) setFailures(failRes.failures);

      // Load corporate optimization audit
      await fetchOptimizerAudit();

      // Initial consultation to Company Brain
      consultBrainQuestion('What is the company trying to accomplish?');
    } catch (err) {
      console.error('[VirtualCorporationView] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptimizerAudit = async () => {
    try {
      setAuditLoading(true);
      const res = await fetch('/api/corporation/optimizer/audit');
      const data = await res.json();
      if (data.success && data.audit) {
        setAudit(data.audit);
      }
    } catch (err) {
      console.error('[VirtualCorporationView] Failed to fetch optimizer audit:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleRunRemediation = async (targetId?: string) => {
    try {
      setRemediating(true);
      setRemediatingTargetId(targetId || 'all');
      setRemediationSuccessMsg(null);

      const res = await fetch('/api/corporation/optimizer/remediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId }),
      });
      const data = await res.json();
      if (data.success) {
        setRemediationSuccessMsg(data.summary || 'Remediation completed successfully!');
        // Refresh audit and overview
        await fetchOptimizerAudit();
        const overRes = await fetch('/api/corporation/overview').then(r => r.json());
        if (overRes.success) setOverview(overRes);
        const wfRes = await fetch('/api/corporation/workflows').then(r => r.json());
        if (wfRes.success) setWorkflows(wfRes.workflows);
        const failRes = await fetch('/api/corporation/failures').then(r => r.json());
        if (failRes.success) setFailures(failRes.failures);
        const empRes = await fetch('/api/corporation/employees').then(r => r.json());
        if (empRes.success) setEmployees(empRes.employees);
      }
    } catch (err) {
      console.error('[VirtualCorporationView] Remediation failed:', err);
    } finally {
      setRemediating(false);
      setRemediatingTargetId(null);
    }
  };

  const consultBrainQuestion = async (q: string) => {
    try {
      setBrainLoading(true);
      setBrainQuestion(q);
      const res = await fetch('/api/corporation/brain/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (data.success) {
        setBrainAnswer(data.answer);
      }
    } catch (err) {
      console.error('[CompanyBrain] Query error:', err);
    } finally {
      setBrainLoading(false);
    }
  };

  const triggerDiscoverySweep = async () => {
    try {
      setScanningDiscoveries(true);
      const res = await fetch('/api/corporation/discoveries/scan', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDiscoveries((prev) => [...data.discoveries, ...prev]);
      }
    } catch (err) {
      console.error('Discovery scan error:', err);
    } finally {
      setScanningDiscoveries(false);
    }
  };

  const advanceWorkflow = async (workflowId: string) => {
    try {
      setWorkflowApprovalError(null);
      const res = await fetch(`/api/corporation/workflows/${workflowId}/advance`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not advance the workflow.');
      }
      setWorkflows((prev) => prev.map((w) => (w.id === workflowId ? data.workflow : w)));
    } catch (err) {
      setWorkflowApprovalError(err instanceof Error ? err.message : 'Could not advance the workflow.');
    }
  };

  const decideWorkflowApproval = async (workflowId: string, decision: 'approved' | 'rejected') => {
    const notes = workflowApprovalNotes[workflowId] || '';
    try {
      setWorkflowApprovalError(null);
      const res = await fetch(`/api/corporation/workflows/${workflowId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, notes }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not record the workflow approval decision.');
      }
      setWorkflows((previous) => previous.map((workflow) => workflow.id === workflowId ? data.workflow : workflow));
    } catch (err) {
      setWorkflowApprovalError(err instanceof Error ? err.message : 'Could not record the workflow approval decision.');
    }
  };

  const createIncidentSimulation = async () => {
    try {
      setCreatingIncidentSimulation(true);
      setIncidentError(null);
      const res = await fetch('/api/corporation/incidents/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmedSimulation: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not create the local incident simulation.');
      }
      setWorkflows((previous) => [data.incident, ...previous.filter((workflow) => workflow.id !== data.incident.id)]);
    } catch (err) {
      setIncidentError(err instanceof Error ? err.message : 'Could not create the local incident simulation.');
    } finally {
      setCreatingIncidentSimulation(false);
    }
  };

  const completeIncidentWorkPacket = async (workflowId: string, stepId: string) => {
    const evidence = incidentEvidence[workflowId] || '';
    try {
      setIncidentActionId(workflowId);
      setIncidentError(null);
      const res = await fetch(`/api/corporation/incidents/${workflowId}/steps/${stepId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evidence }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not record incident work evidence.');
      }
      setWorkflows((previous) => previous.map((workflow) => workflow.id === workflowId ? data.incident : workflow));
      setIncidentEvidence((previous) => ({ ...previous, [workflowId]: '' }));
    } catch (err) {
      setIncidentError(err instanceof Error ? err.message : 'Could not record incident work evidence.');
    } finally {
      setIncidentActionId(null);
    }
  };

  const decideIncidentApproval = async (workflowId: string, decision: 'approved' | 'rejected') => {
    const notes = incidentApprovalNotes[workflowId] || '';
    try {
      setIncidentActionId(workflowId);
      setIncidentError(null);
      const res = await fetch(`/api/corporation/incidents/${workflowId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, notes }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not record the incident approval decision.');
      }
      setWorkflows((previous) => previous.map((workflow) => workflow.id === workflowId ? data.incident : workflow));
    } catch (err) {
      setIncidentError(err instanceof Error ? err.message : 'Could not record the incident approval decision.');
    } finally {
      setIncidentActionId(null);
    }
  };

  const canonicalQuestions = [
    'What is the company trying to accomplish?',
    'What work is required?',
    'Who should perform it?',
    'What resources are required?',
    'What information is missing?',
    'What risks exist?',
    'What has already been attempted?',
    'What should happen next?',
  ];

  const filteredEmployees = employees.filter((e) => {
    if (!searchEmployeeQuery) return true;
    const q = searchEmployeeQuery.toLowerCase();
    return (
      e.displayName.toLowerCase().includes(q) ||
      e.roleTitle.toLowerCase().includes(q) ||
      e.departmentName.toLowerCase().includes(q) ||
      e.capabilities.some((c) => c.name.toLowerCase().includes(q))
    );
  });

  const company: CompanyProfile = overview?.company || {
    name: 'Rufflo Autonomous Corporation',
    mission: 'Operating a fully autonomous virtual enterprise with persistent AI employees.',
    capitalBalanceUSD: 42_500_000,
    annualOperatingBudgetUSD: 18_200_000,
    valuationUSD: 240_000_000,
    headcountTotal: employees.length || 48,
    complianceRating: 99.4,
    fiscalQuarter: 'Q3-2026',
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0d0f17] text-[#ebdbb2] font-sans overflow-hidden select-none">
      {/* Master Top Bar */}
      <header className="border-b border-white/10 bg-[#121520] px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/30">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight leading-none">{company.name}</h1>
                <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                  SOVEREIGN ACOS v3
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                {company.mission}
              </p>
            </div>
          </div>
        </div>

        {/* Corporate High-Level Metric Gauges */}
        <div className="flex items-center gap-5 text-xs font-mono">
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-sans">Valuation</span>
            <span className="text-cyan-300 font-bold">${(company.valuationUSD / 1_000_000).toFixed(0)}M USD</span>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-sans">Treasury Reserve</span>
            <span className="text-emerald-400 font-bold">${(company.capitalBalanceUSD / 1_000_000).toFixed(1)}M USD</span>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-sans">Workforce</span>
            <span className="text-white font-bold">{company.headcountTotal} Persistent AI Employees</span>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-sans">Compliance Gate</span>
            <span className="text-amber-300 font-bold">{company.complianceRating}% Zero-Trust</span>
          </div>
        </div>
      </header>

      {/* Corporate Subsystem Navigation Tabs */}
      <nav className="flex items-center gap-1 px-5 py-2 border-b border-white/5 bg-[#10121c] overflow-x-auto shrink-0 scrollbar-none">
        <button
          onClick={() => setActiveTab('optimizer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'optimizer'
              ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-500/20'
              : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Continuous Optimization & Auto-Remediation</span>
          {audit && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-500/20 rounded-full border border-amber-500/30 text-amber-300 ml-0.5">
              {audit.resolvedCount}/{audit.totalIdentified}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('brain')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'brain'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>Company Brain & Strategy</span>
        </button>

        <button
          onClick={() => setActiveTab('workforce')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'workforce'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Workforce Intelligence & Dispatch</span>
        </button>

        <button
          onClick={() => setActiveTab('org')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'org'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Organization & Employees ({employees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('collaboration')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'collaboration'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Collaboration Fabric ({messages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'projects'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>Projects & Programs ({projects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('discoveries')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'discoveries'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>World Intelligence ({discoveries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('workflows')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'workflows'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <GitMerge className="w-3.5 h-3.5" />
          <span>Persistent Workflows</span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 ${
            activeTab === 'incidents'
              ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Incident Response</span>
        </button>

        <button
          onClick={() => setActiveTab('decisions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'decisions'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Explicit Decisions ({decisions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('failures')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'failures'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Failure Knowledge Base ({failures.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('governance')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'governance'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Governance & Audit Trail</span>
        </button>
      </nav>

      {/* Main Tab Viewport */}
      <main className="flex-1 overflow-y-auto p-5">
        {/* ============================================================== */}
        {/* TAB 0: CONTINUOUS OPTIMIZATION & AUTONOMOUS REMEDIATION */}
        {/* ============================================================== */}
        {activeTab === 'optimizer' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Top Operational Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-[#121520] border border-white/10 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span>Tracked Inefficiencies</span>
                  <Sliders className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-white">
                    {audit ? audit.totalIdentified : 12}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-sans">across 6 pillars</span>
                </div>
              </div>

              <div className="bg-[#121520] border border-emerald-500/20 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span>Auto-Remediated</span>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    {audit ? audit.resolvedCount : 0}
                  </span>
                  <span className="text-[10px] text-emerald-400/80 font-mono">
                    {audit && audit.totalIdentified > 0
                      ? `${Math.round((audit.resolvedCount / audit.totalIdentified) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>

              <div className="bg-[#121520] border border-amber-500/20 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span>Hours Saved / Wk</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-amber-300">
                    {audit ? audit.estimatedHoursSavedPerWeek : 0}h
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-sans">manual labor</span>
                </div>
              </div>

              <div className="bg-[#121520] border border-cyan-500/20 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span>Monthly Cost Saved</span>
                  <DollarSign className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-cyan-300">
                    ${audit ? (audit.estimatedCostSavingsMonthlyUSD || 0).toLocaleString() : '0'}
                  </span>
                  <span className="text-[10px] text-cyan-400/80 font-sans">USD/mo</span>
                </div>
              </div>

              <div className="bg-[#121520] border border-purple-500/20 rounded-xl p-3.5 flex flex-col justify-between shadow-sm col-span-2 md:col-span-1">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span>Efficiency Boost</span>
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-purple-300">
                    +{audit ? audit.overallEfficiencyBoostPercent : 0}%
                  </span>
                  <span className="text-[10px] text-purple-400/80 font-sans">operational</span>
                </div>
              </div>
            </div>

            {/* "START WORKING ON IT" Autonomous Action Banner */}
            <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-[#161a29] to-emerald-950/30 p-5 shadow-xl shadow-amber-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Zap className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Autonomous Remediation Pipeline: "Start Working On It"
                  </h3>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Actively scans the enterprise for <span className="text-cyan-300 font-semibold">repetitive work</span>,{' '}
                  <span className="text-amber-300 font-semibold">bottlenecks</span>,{' '}
                  <span className="text-purple-300 font-semibold">expensive processes</span>,{' '}
                  <span className="text-indigo-300 font-semibold">slow workflows</span>,{' '}
                  <span className="text-rose-300 font-semibold">failures</span>, and{' '}
                  <span className="text-emerald-300 font-semibold">unnecessary manual steps</span>. Automatically decomposes queues, parallelizes pipelines, and generates zero-touch daemons.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
                <button
                  onClick={() => fetchOptimizerAudit()}
                  disabled={auditLoading || remediating}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold rounded-lg border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Re-run Diagnostic Scan"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin' : ''}`} />
                  <span>Rescan</span>
                </button>

                <button
                  onClick={() => handleRunRemediation()}
                  disabled={remediating || (audit && audit.resolvedCount === audit.totalIdentified)}
                  className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                    remediating
                      ? 'bg-amber-600/50 text-white cursor-wait animate-pulse'
                      : audit && audit.resolvedCount === audit.totalIdentified
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-amber-500/25 active:scale-95'
                  }`}
                >
                  <Zap className={`w-4 h-4 ${remediating ? 'animate-spin' : ''}`} />
                  <span>
                    {remediating
                      ? 'Autonomous Workforce Remediating In Real-Time...'
                      : audit && audit.resolvedCount === audit.totalIdentified
                      ? 'All Operational Inefficiencies Remediated'
                      : '⚡ Start Working On All Inefficiencies Now'}
                  </span>
                </button>
              </div>
            </div>

            {/* Success Toast */}
            {remediationSuccessMsg && (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-3 flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{remediationSuccessMsg}</span>
                </div>
                <button
                  onClick={() => setRemediationSuccessMsg(null)}
                  className="text-emerald-400/60 hover:text-emerald-300 text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Six-Pillar Filter Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setActiveCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                  activeCategoryFilter === 'all'
                    ? 'bg-white/15 text-white font-bold'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                All Issues ({audit?.totalIdentified || 0})
              </button>

              <button
                onClick={() => setActiveCategoryFilter('repetitive_work')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                  activeCategoryFilter === 'repetitive_work'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <Repeat className="w-3.5 h-3.5 text-cyan-400" />
                <span>Repetitive Work ({audit?.breakdown?.repetitive_work || 0})</span>
              </button>

              <button
                onClick={() => setActiveCategoryFilter('bottleneck')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                  activeCategoryFilter === 'bottleneck'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Bottlenecks ({audit?.breakdown?.bottleneck || 0})</span>
              </button>

              <button
                onClick={() => setActiveCategoryFilter('expensive_process')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                  activeCategoryFilter === 'expensive_process'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                <span>Expensive Processes ({audit?.breakdown?.expensive_process || 0})</span>
              </button>

              <button
                onClick={() => setActiveCategoryFilter('slow_workflow')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                  activeCategoryFilter === 'slow_workflow'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Slow Workflows ({audit?.breakdown?.slow_workflow || 0})</span>
              </button>

              <button
                onClick={() => setActiveCategoryFilter('failure')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                  activeCategoryFilter === 'failure'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                <span>Failures ({audit?.breakdown?.failure || 0})</span>
              </button>

              <button
                onClick={() => setActiveCategoryFilter('unnecessary_manual_step')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                  activeCategoryFilter === 'unnecessary_manual_step'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                <span>Manual Steps ({audit?.breakdown?.unnecessary_manual_step || 0})</span>
              </button>
            </div>

            {/* Inefficiencies & Remediation Cards List */}
            <div className="space-y-4">
              {audit &&
                audit.items
                  .filter((item) => activeCategoryFilter === 'all' || item.category === activeCategoryFilter)
                  .map((item) => {
                    const isResolving = remediating && (remediatingTargetId === 'all' || remediatingTargetId === item.id);
                    const isResolved = item.status === 'resolved' || item.status === 'verified';

                    const categoryBadgeColors: Record<InefficiencyCategory, { border: string; bg: string; text: string }> = {
                      repetitive_work: { border: 'border-cyan-500/30', bg: 'bg-cyan-950/40', text: 'text-cyan-300' },
                      bottleneck: { border: 'border-amber-500/30', bg: 'bg-amber-950/40', text: 'text-amber-300' },
                      expensive_process: { border: 'border-purple-500/30', bg: 'bg-purple-950/40', text: 'text-purple-300' },
                      slow_workflow: { border: 'border-indigo-500/30', bg: 'bg-indigo-950/40', text: 'text-indigo-300' },
                      failure: { border: 'border-rose-500/30', bg: 'bg-rose-950/40', text: 'text-rose-300' },
                      unnecessary_manual_step: { border: 'border-emerald-500/30', bg: 'bg-emerald-950/40', text: 'text-emerald-300' },
                    };

                    const style = categoryBadgeColors[item.category] || {
                      border: 'border-white/10',
                      bg: 'bg-white/5',
                      text: 'text-zinc-300',
                    };

                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border transition-all p-4.5 bg-[#121520] shadow-md ${
                          isResolved
                            ? 'border-emerald-500/30 shadow-emerald-950/20'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${style.border} ${style.bg} ${style.text}`}
                            >
                              {item.category.replace(/_/g, ' ')}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                                item.severity === 'CRITICAL'
                                  ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                                  : item.severity === 'HIGH'
                                  ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                                  : 'bg-blue-950/60 text-blue-300 border border-blue-500/40'
                              }`}
                            >
                              {item.severity} SEVERITY
                            </span>
                            <span className="text-xs text-zinc-400 font-medium">📍 {item.location}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isResolved ? (
                              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>REMEDIATED</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleRunRemediation(item.id)}
                                disabled={remediating}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isResolving
                                    ? 'bg-amber-600/40 text-amber-300 cursor-wait animate-pulse'
                                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                                }`}
                              >
                                <Zap className={`w-3.5 h-3.5 ${isResolving ? 'animate-spin' : ''}`} />
                                <span>{isResolving ? 'Remediating...' : 'Remediate Now'}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title & Core Impact */}
                        <h4 className="text-sm font-bold text-white mb-1.5">{item.title}</h4>
                        <p className="text-xs text-zinc-300 mb-3 leading-relaxed">{item.impactDescription}</p>

                        {/* Root Cause & Proposed Remediation Box */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-lg bg-black/40 border border-white/5 text-xs mb-3">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-rose-400 block mb-1">
                              🔍 Root Cause Analysis
                            </span>
                            <p className="text-zinc-400 text-[11px] leading-relaxed">{item.rootCauseAnalysis}</p>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">
                              🛠 Proposed Autonomous Solution
                            </span>
                            <p className="text-zinc-300 text-[11px] leading-relaxed">{item.proposedRemediation}</p>
                          </div>
                        </div>

                        {/* Metrics Pills & Assigned Employee */}
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-white/5">
                          <div className="flex items-center gap-3 font-mono text-[11px]">
                            {item.metrics.repetitiveFrequencyPerDay && (
                              <span className="text-cyan-300">
                                🔁 {item.metrics.repetitiveFrequencyPerDay} runs/day
                              </span>
                            )}
                            {item.metrics.manualHoursSpentPerWeek && (
                              <span className="text-amber-300">
                                ⏳ {item.metrics.manualHoursSpentPerWeek}h wasted/wk
                              </span>
                            )}
                            {item.metrics.currentTokensPerRun && (
                              <span className="text-purple-300">
                                ⚡ {item.metrics.currentTokensPerRun.toLocaleString()} tokens/run
                              </span>
                            )}
                            {item.metrics.currentLatencyMs && (
                              <span className="text-indigo-300">
                                ⏱ {(item.metrics.currentLatencyMs / 60000).toFixed(0)} min latency
                              </span>
                            )}
                            {item.metrics.failureRatePercent && (
                              <span className="text-rose-400">
                                ⚠ {item.metrics.failureRatePercent}% failure rate
                              </span>
                            )}
                            {item.metrics.costImpactUSDMonth && (
                              <span className="text-emerald-400">
                                💰 ${item.metrics.costImpactUSDMonth.toLocaleString()}/mo
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-zinc-400">
                            <span>Remediation Specialist: </span>
                            <span className="font-semibold text-white">{item.assignedRemediationAgentName}</span>
                          </div>
                        </div>

                        {/* Resolved State Output Details */}
                        {isResolved && item.remediationResult && (
                          <div className="mt-3.5 p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Remediation Verified & Deployed to Corporate Memory</span>
                              </span>
                              <span className="font-mono text-[10px] text-emerald-400/80">
                                {new Date(item.remediationResult.remediatedAt).toLocaleTimeString()}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono pt-1">
                              <div className="text-rose-300/80 line-through">
                                Before: {item.remediationResult.beforeMetric}
                              </div>
                              <div className="text-emerald-300 font-bold">
                                After: {item.remediationResult.afterMetric} (+{item.remediationResult.improvementPercent}%)
                              </div>
                            </div>

                            <div className="text-[11px] text-zinc-300 space-y-0.5 pt-1 border-t border-emerald-500/20">
                              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Actions Deployed:</span>
                              {item.remediationResult.actionsTaken.map((act, actIdx) => (
                                <div key={actIdx} className="flex items-center gap-1.5 text-zinc-300">
                                  <span className="text-emerald-400 text-xs">✓</span>
                                  <span>{act}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: COMPANY BRAIN & STRATEGIC WAR ROOM */}
        {/* ============================================================== */}
        {activeTab === 'brain' && (
          <div className="space-y-5 max-w-6xl mx-auto">
            {/* Top Prompt Console */}
            <div className="rounded-xl border border-cyan-500/30 bg-[#121624] p-4 shadow-xl shadow-cyan-950/30">
              <div className="flex items-center gap-2 mb-3">
                <BrainCircuit className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Company Brain Strategic Consultation
                </h3>
                <span className="text-[10px] font-mono text-cyan-300 ml-auto bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/20">
                  Autonomous Executive Synthesis Engine
                </span>
              </div>

              {/* 8 Canonical Questions Selector Bar */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {canonicalQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => consultBrainQuestion(q)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded transition-colors text-left ${
                      brainQuestion === q
                        ? 'bg-cyan-500 text-white font-semibold'
                        : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {idx + 1}. {q}
                  </button>
                ))}
              </div>

              {/* Input Box for Custom Query */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={brainQuestion}
                  onChange={(e) => setBrainQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && consultBrainQuestion(brainQuestion)}
                  placeholder="Ask the Company Brain any strategic, workforce, or resource inquiry..."
                  className="flex-1 bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
                <button
                  onClick={() => consultBrainQuestion(brainQuestion)}
                  disabled={brainLoading}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow cursor-pointer transition-all active:scale-98"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{brainLoading ? 'Synthesizing...' : 'Consult Brain'}</span>
                </button>
              </div>
            </div>

            {/* Synthesized Answer Report Card */}
            {brainAnswer && (
              <div className="rounded-xl border border-white/10 bg-[#121520] p-5 space-y-4 shadow-xl">
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                      Direct Executive Synthesis
                    </span>
                    <h2 className="text-base font-bold text-white mt-0.5 leading-snug">
                      &ldquo;{brainAnswer.question}&rdquo;
                    </h2>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-zinc-400">Confidence</span>
                    <div className="text-sm font-bold font-mono text-emerald-400">{brainAnswer.confidenceScore}%</div>
                  </div>
                </div>

                {/* Core Summary Callout */}
                <p className="text-xs leading-relaxed text-zinc-200 bg-cyan-950/20 border-l-2 border-cyan-400 p-3 rounded-r-md italic">
                  {brainAnswer.summary}
                </p>

                {/* 3-Column Strategic Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  {/* Column 1: Key Directives & Context */}
                  <div className="rounded-lg bg-black/40 border border-white/5 p-3 space-y-2">
                    <h4 className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Key Directives
                    </h4>
                    <ul className="space-y-1.5 text-xs text-zinc-300">
                      {brainAnswer.keyDirectives.map((d, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-cyan-400 text-xs font-bold mt-0.5">•</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 2: Assigned Workforce & Departments */}
                  <div className="rounded-lg bg-black/40 border border-white/5 p-3 space-y-2">
                    <h4 className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      Assigned Workforce
                    </h4>
                    <div className="space-y-2 text-xs">
                      {brainAnswer.assignedWorkforce.map((w, i) => (
                        <div key={i} className="p-2 rounded bg-white/[0.03] border border-white/5">
                          <div className="font-semibold text-white flex items-center justify-between">
                            <span>{w.name}</span>
                            <span className="text-[10px] font-mono text-emerald-400">{w.role}</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-1 leading-tight">{w.contribution}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 3: Risks, Precedents & Next Actions */}
                  <div className="rounded-lg bg-black/40 border border-white/5 p-3 space-y-2">
                    <h4 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                      Identified Risks & Precedents
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-rose-400">Critical Risks:</span>
                        <ul className="mt-1 space-y-1 text-zinc-300 text-[11px]">
                          {brainAnswer.identifiedRisks.map((r, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-rose-400">⚠</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-1 border-t border-white/5">
                        <span className="text-[10px] uppercase font-bold text-cyan-400">Immediate Next Actions:</span>
                        <ul className="mt-1 space-y-1 text-zinc-300 text-[11px]">
                          {brainAnswer.immediateNextActions.map((a, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-emerald-400">→</span>
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: WORKFORCE INTELLIGENCE & TASK DISPATCH */}
        {/* ============================================================== */}
        {activeTab === 'workforce' && (
          <div className="space-y-5 max-w-6xl mx-auto">
            <div className="rounded-xl border border-cyan-500/30 bg-[#121624] p-5 shadow-xl shadow-cyan-950/30 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    Workforce Intelligence & Autonomous Task Dispatcher
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Decompose objectives into required capabilities, search existing workforce, check workloads, and assign or commission persistent employees.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-1 rounded">
                  Non-Disposable Workforce Policy Active
                </span>
              </div>

              {/* 1-Click Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500 mr-1">Presets:</span>
                <button
                  onClick={() => {
                    setDispatchTitle('SOC 2 Type II Security Readiness Audit');
                    setDispatchObjective('Audit all microservice gateways, inspect tamper-proof audit trails, verify secret redaction gates, and generate formal compliance memo.');
                    setDispatchPriority('critical');
                  }}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] text-zinc-300 font-medium transition-colors"
                >
                  🛡️ SOC 2 Security Audit
                </button>
                <button
                  onClick={() => {
                    setDispatchTitle('Multi-Model Token Latency & Throughput Benchmark');
                    setDispatchObjective('Benchmark Gemini 3.8 Flash vs Pro reasoning routes across 1,000 synthetic software construction prompts and calculate cost-efficiency.');
                    setDispatchPriority('high');
                  }}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] text-zinc-300 font-medium transition-colors"
                >
                  ⚡ Multi-Model Benchmarking
                </button>
                <button
                  onClick={() => {
                    setDispatchTitle('Global Pre-print arXiv Research Sweep');
                    setDispatchObjective('Mine all publications on sub-quadratic attention, extract practical implementations, and distribute insights to AI & Engineering teams.');
                    setDispatchPriority('medium');
                  }}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] text-zinc-300 font-medium transition-colors"
                >
                  🔬 arXiv Literature Ingestion
                </button>
              </div>

              {/* Input Form */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-3">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">
                      Objective Title
                    </label>
                    <input
                      type="text"
                      value={dispatchTitle}
                      onChange={(e) => setDispatchTitle(e.target.value)}
                      placeholder="e.g. Construct Autonomous Microservice Payment Gateway"
                      className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">
                      Priority Level
                    </label>
                    <select
                      value={dispatchPriority}
                      onChange={(e: any) => setDispatchPriority(e.target.value)}
                      className="w-full bg-[#161a29] border border-white/15 rounded-lg px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="critical">Critical (Tier 1)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">
                    Detailed Corporate Objective & Success Criteria
                  </label>
                  <textarea
                    rows={2}
                    value={dispatchObjective}
                    onChange={(e) => setDispatchObjective(e.target.value)}
                    placeholder="Describe the operational goals, required deliverables, and technical boundaries..."
                    className="w-full bg-black/40 border border-white/15 rounded-lg p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 font-sans leading-relaxed"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={dispatchCorporateTask}
                    disabled={dispatchLoading}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Cpu className={`w-4 h-4 ${dispatchLoading ? 'animate-spin' : ''}`} />
                    <span>{dispatchLoading ? 'Decomposing & Matching Workforce...' : 'Decompose & Dispatch Objective'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dispatch Results Breakdown */}
            {dispatchResult && (
              <div className="rounded-xl border border-white/10 bg-[#121520] p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                      Workforce Dispatch Plan Active • {dispatchResult.taskId}
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">{dispatchResult.taskTitle}</h3>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 uppercase font-bold">
                    {dispatchResult.executionStatus}
                  </span>
                </div>

                {/* Decomposed Steps & Assignment */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Decomposed Sequential Execution Steps ({dispatchResult.decomposedSteps.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {dispatchResult.decomposedSteps.map((step: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-lg bg-black/40 border border-white/10 space-y-2 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1">
                            <span>Step {step.stepIndex}</span>
                            <span className="text-cyan-400 font-semibold">{step.suitabilityScore}% Match</span>
                          </div>
                          <h5 className="text-xs font-bold text-white leading-tight">{step.title}</h5>
                          <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{step.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {step.requiredCapabilities.map((rc: string, i: number) => (
                              <span key={i} className="text-[9px] font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-cyan-300">
                                {rc}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/5 mt-2 flex items-center justify-between text-[11px]">
                          <div>
                            <span className="text-[9px] uppercase text-zinc-500 block">Assigned Employee:</span>
                            <strong className="text-emerald-400">{step.assignedEmployeeName}</strong>
                          </div>
                          <span className="text-[9px] font-mono text-zinc-500">{step.estimatedHours}h est.</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Workload Impact */}
                <div className="pt-3 border-t border-white/5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                    Workforce Rebalancing & Workload Adjustments
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {dispatchResult.assignedEmployees.map((ae: any) => (
                      <div key={ae.id} className="p-2.5 rounded bg-white/[0.02] border border-white/5 text-xs font-mono flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white">{ae.name}</div>
                          <div className="text-[10px] text-zinc-400">{ae.role}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-zinc-500 text-[10px]">{ae.workloadBefore}% →</span>{' '}
                          <strong className="text-cyan-300">{ae.workloadAfter}%</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: ORGANIZATIONAL GRAPH & EMPLOYEE DOSSIER */}
        {/* ============================================================== */}
        {activeTab === 'org' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
            {/* Left: Department & Employee Roster (5 cols) */}
            <div className="lg:col-span-5 space-y-3 flex flex-col h-[750px]">
              {/* Search Box */}
              <div className="relative shrink-0">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchEmployeeQuery}
                  onChange={(e) => setSearchEmployeeQuery(e.target.value)}
                  placeholder="Search virtual employees by name, role, skill..."
                  className="w-full bg-[#121520] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 font-sans"
                />
              </div>

              {/* Scrollable Employee List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredEmployees.map((emp) => {
                  const isSelected = selectedEmployee?.id === emp.id;
                  return (
                    <div
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'bg-cyan-950/30 border-cyan-500/50 shadow-md shadow-cyan-950/40'
                          : 'bg-[#121520] border-white/5 hover:border-white/20'
                      }`}
                    >
                      <img
                        src={emp.avatarUrl}
                        alt={emp.displayName}
                        className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white truncate">{emp.displayName}</h4>
                          <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                            Lvl {emp.clearanceLevel}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-300 truncate">{emp.roleTitle}</p>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 mt-1">
                          <span>{emp.departmentName}</span>
                          <span>·</span>
                          <span className="text-emerald-400">{emp.metrics.tasksCompleted} tasks</span>
                          <span>·</span>
                          <span>{emp.workloadPercent}% load</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Detailed Persistent Employee Dossier (7 cols) */}
            <div className="lg:col-span-7 bg-[#121520] border border-white/10 rounded-xl p-5 overflow-y-auto h-[750px] space-y-5">
              {selectedEmployee ? (
                <>
                  {/* Top Dossier Header */}
                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedEmployee.avatarUrl}
                        alt={selectedEmployee.displayName}
                        className="w-16 h-16 rounded-xl object-cover border border-cyan-500/40 shadow-lg shadow-cyan-950/50"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-white">{selectedEmployee.displayName}</h2>
                          <span className="text-[10px] font-mono uppercase bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded">
                            {selectedEmployee.seniority}
                          </span>
                        </div>
                        <p className="text-xs text-cyan-300 font-mono mt-0.5">{selectedEmployee.roleTitle}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {selectedEmployee.departmentName} • Reports to {selectedEmployee.managerName || 'Founder'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-[10px] uppercase text-zinc-500">Security Clearance</span>
                      <div className="text-base font-bold text-amber-300">Level {selectedEmployee.clearanceLevel}/100</div>
                      <span className="text-[10px] text-emerald-400 font-semibold">{selectedEmployee.status.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Bio & Current Mission */}
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-300 leading-relaxed italic bg-black/30 border border-white/5 p-3 rounded-lg">
                      &ldquo;{selectedEmployee.bio}&rdquo;
                    </p>
                    <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                          Current Live Mission
                        </span>
                        <p className="text-xs font-semibold text-white mt-0.5">
                          {selectedEmployee.currentTask || 'Awaiting autonomous task dispatch.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Certified Capabilities & Tools */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                      <span>Proven Capabilities & Proficiency</span>
                      <span className="text-[10px] font-mono text-zinc-400">Evidence Verified</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedEmployee.capabilities.map((cap) => (
                        <div key={cap.id} className="p-2.5 rounded bg-black/40 border border-white/5 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-zinc-200">{cap.name}</span>
                            <span className="font-mono text-cyan-300 font-bold">{cap.proficiencyScore}%</span>
                          </div>
                          {/* Proficiency Bar */}
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full"
                              style={{ width: `${cap.proficiencyScore}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-zinc-400 truncate">{cap.verifiedEvidence}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Computer Environment & Workspace Sandbox */}
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      Isolated Computer Environment & Tool Gateway
                    </h4>
                    <div className="p-3 rounded-lg bg-black/50 border border-white/10 font-mono text-xs space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-zinc-500">Sandbox Path:</span>{' '}
                          <span className="text-zinc-300">{selectedEmployee.computerEnvironment.sandboxPath}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Terminal Session:</span>{' '}
                          <span className="text-zinc-300">{selectedEmployee.computerEnvironment.terminalSessionId}</span>
                        </div>
                      </div>
                      <div className="pt-1 border-t border-white/5">
                        <span className="text-zinc-500 text-[10px] uppercase">Approved Tool Mesh:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedEmployee.computerEnvironment.approvedTools.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-cyan-300 font-mono"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Interactive Virtual Terminal Console */}
                      <div className="pt-2 border-t border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                          <span>Interactive Sandbox Terminal ({selectedEmployee.displayName})</span>
                          <span className="text-emerald-400 font-semibold">● SANDBOX READY</span>
                        </div>
                        <div className="bg-black/80 rounded border border-white/10 p-2 font-mono text-[11px] max-h-32 overflow-y-auto space-y-1">
                          {terminalLogs.map((log, idx) => (
                            <div key={idx} className="space-y-0.5">
                              <div className="text-cyan-400 flex items-center gap-1">
                                <span className="text-zinc-600 font-normal">[{log.time}]</span>
                                <span className="text-emerald-400">$</span> {log.cmd}
                              </div>
                              <pre className="text-zinc-300 text-[10px] whitespace-pre-wrap pl-3 leading-relaxed font-mono">
                                {log.out}
                              </pre>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-400 font-mono text-xs">
                              $
                            </span>
                            <input
                              type="text"
                              value={terminalCmd}
                              onChange={(e) => setTerminalCmd(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && executeTerminalCommand()}
                              placeholder="ls, git status, whoami, env, ps..."
                              className="w-full bg-black/60 border border-white/15 rounded px-2.5 pl-6 py-1.5 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                          <button
                            onClick={executeTerminalCommand}
                            disabled={terminalExecuting}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
                          >
                            {terminalExecuting ? '...' : 'Run'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Empirical Performance Metrics */}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10 text-center font-mono">
                    <div className="p-2 rounded bg-black/40 border border-white/5">
                      <span className="text-[9px] uppercase text-zinc-500">Tasks Completed</span>
                      <div className="text-sm font-bold text-white">{selectedEmployee.metrics.tasksCompleted}</div>
                    </div>
                    <div className="p-2 rounded bg-black/40 border border-white/5">
                      <span className="text-[9px] uppercase text-zinc-500">Accuracy Rate</span>
                      <div className="text-sm font-bold text-emerald-400">{selectedEmployee.metrics.accuracyScore}%</div>
                    </div>
                    <div className="p-2 rounded bg-black/40 border border-white/5">
                      <span className="text-[9px] uppercase text-zinc-500">Cost Efficiency</span>
                      <div className="text-sm font-bold text-cyan-300">{selectedEmployee.metrics.costEfficiency}%</div>
                    </div>
                    <div className="p-2 rounded bg-black/40 border border-white/5">
                      <span className="text-[9px] uppercase text-zinc-500">Tokens Processed</span>
                      <div className="text-sm font-bold text-amber-300">
                        {(selectedEmployee.metrics.tokensProcessed / 1000).toFixed(0)}k
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-500 text-xs">
                  Select an employee from the roster to view their persistent corporate dossier.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: STRUCTURED COLLABORATION FABRIC */}
        {/* ============================================================== */}
        {activeTab === 'collaboration' && (
          <div className="space-y-4 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Structured Collaboration Fabric
                </h3>
                <p className="text-xs text-zinc-400">
                  Typed multi-agent communication matrix: task handoffs, review requests, escalations, and status reports.
                </p>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg p-1 text-xs">
                {['all', 'executive_council', 'team_channel', 'cross_department', 'manager_report'].map((scope) => (
                  <button
                    key={scope}
                    onClick={() => setSelectedChannelScope(scope)}
                    className={`px-2.5 py-1 rounded capitalize text-[11px] font-medium transition-colors ${
                      selectedChannelScope === scope
                        ? 'bg-cyan-500 text-white font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {scope.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Compose Structured Message Bar */}
            <div className="rounded-xl border border-white/10 bg-[#121520] p-4 space-y-3 shadow-md">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-cyan-400" />
                Dispatch Structured Message
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                <div>
                  <select
                    value={newMsgType}
                    onChange={(e) => setNewMsgType(e.target.value)}
                    className="w-full bg-[#161a29] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
                  >
                    <option value="status_report">Status Report</option>
                    <option value="task_request">Task Request</option>
                    <option value="review_request">Review Request</option>
                    <option value="approval_request">Approval Request</option>
                    <option value="research_finding">Research Finding</option>
                    <option value="work_handoff">Work Handoff</option>
                    <option value="escalation">Escalation</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <input
                    type="text"
                    value={newMsgSubject}
                    onChange={(e) => setNewMsgSubject(e.target.value)}
                    placeholder="Message Subject / Directive..."
                    className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 font-sans focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
              <div>
                <textarea
                  rows={2}
                  value={newMsgBody}
                  onChange={(e) => setNewMsgBody(e.target.value)}
                  placeholder="Structured payload, directive details, or review context..."
                  className="w-full bg-black/40 border border-white/15 rounded-lg p-2.5 text-xs text-white placeholder-zinc-500 font-sans focus:outline-none focus:border-cyan-400 leading-relaxed"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={sendStructuredMessage}
                  disabled={sendingMsg || !newMsgSubject || !newMsgBody}
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow"
                >
                  <Send className="w-3 h-3" />
                  <span>{sendingMsg ? 'Dispatching...' : 'Dispatch Message'}</span>
                </button>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="space-y-3">
              {messages
                .filter((m) => selectedChannelScope === 'all' || m.channelScope === selectedChannelScope)
                .map((msg) => (
                  <div key={msg.id} className="rounded-xl bg-[#121520] border border-white/10 p-4 space-y-2 shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono uppercase bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-bold">
                          {msg.messageType.replace(/_/g, ' ')}
                        </span>
                        <h4 className="text-xs font-bold text-white">{msg.subject}</h4>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed bg-black/30 p-2.5 rounded border border-white/5 font-sans">
                      {msg.body}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1 border-t border-white/5">
                      <div>
                        From: <strong className="text-white">{msg.senderName}</strong> ({msg.senderRole}) → To:{' '}
                        <strong className="text-cyan-400">{msg.recipientName}</strong>
                      </div>
                      <span className="text-emerald-400 font-semibold uppercase">{msg.actionStatus}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: PROJECTS & PROGRAMS MATRIX */}
        {/* ============================================================== */}
        {activeTab === 'projects' && (
          <div className="space-y-4 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Cross-Departmental Project Matrix
                </h3>
                <p className="text-xs text-zinc-400">
                  Projects staff virtual employees from multiple departments with dedicated budgets and milestones.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <div key={proj.id} className="rounded-xl bg-[#121520] border border-white/10 p-4 space-y-3 shadow-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-500/20">
                          {proj.code}
                        </span>
                        <h4 className="text-sm font-bold text-white">{proj.name}</h4>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{proj.description}</p>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
                      {proj.status}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-400">Execution Progress</span>
                      <span className="text-cyan-300 font-bold">{proj.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all"
                        style={{ width: `${proj.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Project Budget & Staffing */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-white/5">
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase">Budget / Spend</span>
                      <div className="text-white font-semibold">
                        ${(proj.spendUSD / 1000).toFixed(0)}k / ${(proj.budgetUSD / 1000).toFixed(0)}k USD
                      </div>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase">Cross-Dept Staffing</span>
                      <div className="text-cyan-300 font-semibold">{proj.staffedEmployeeIds.length} Staffed Employees</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: WORLD INTELLIGENCE & CONTINUOUS DISCOVERY */}
        {/* ============================================================== */}
        {activeTab === 'discoveries' && (
          <div className="space-y-4 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  Continuous World Intelligence Stream
                </h3>
                <p className="text-xs text-zinc-400">
                  Unsupervised background radar sweeps arXiv papers, GitHub repos, and frontier AI developments.
                </p>
              </div>
              <button
                onClick={triggerDiscoverySweep}
                disabled={scanningDiscoveries}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <Compass className={`w-3.5 h-3.5 ${scanningDiscoveries ? 'animate-spin' : ''}`} />
                <span>{scanningDiscoveries ? 'Scanning Web & ArXiv...' : 'Run Discovery Sweep'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {discoveries.map((d) => (
                <div key={d.id} className="rounded-xl bg-[#121520] border border-white/10 p-4 space-y-2 shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase bg-white/5 border border-white/10 px-2 py-0.5 rounded text-cyan-300">
                          {d.category}
                        </span>
                        <h4 className="text-sm font-bold text-white">{d.title}</h4>
                      </div>
                      <p className="text-xs text-zinc-300 mt-1">{d.summary}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-zinc-400">Relevance</span>
                      <div className="text-sm font-bold font-mono text-emerald-400">{d.relevanceScore}%</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-black/40 border border-white/5 text-xs text-zinc-300 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">Impact Analysis:</span>
                    <p className="text-[11px] leading-relaxed">{d.impactAnalysis}</p>
                    {d.adoptedModulePath && (
                      <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 pt-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Adopted into: {d.adoptedModulePath}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: PERSISTENT WORKFLOWS */}
        {/* ============================================================== */}
        {activeTab === 'workflows' && (
          <div className="space-y-4 max-w-6xl mx-auto">
            {workflowApprovalError && (
              <div role="alert" className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">
                {workflowApprovalError}
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <GitMerge className="w-4 h-4 text-cyan-400" />
                Persistent Business Process Workflows
              </h3>
              <p className="text-xs text-zinc-400">
                End-to-end multi-agent execution pipelines with dependency checking, human approvals, and audit trails.
              </p>
            </div>

            <div className="space-y-4">
              {workflows.map((wf) => (
                <div key={wf.id} className="rounded-xl bg-[#121520] border border-white/10 p-5 space-y-4 shadow-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white">{wf.definitionName}</h4>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950/50 text-cyan-300 border border-cyan-500/30">
                          {wf.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{wf.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-emerald-400 font-bold uppercase">{wf.status}</span>
                      {wf.status === 'running' && (
                        <button
                          onClick={() => advanceWorkflow(wf.id)}
                          className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-all active:scale-98"
                        >
                          <span>Advance Step</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {wf.status === 'waiting_approval' && wf.steps[wf.currentStepIndex] && (
                    <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3">
                      <p className="text-xs font-semibold text-amber-200">
                        Human approval required: {wf.steps[wf.currentStepIndex].title}
                      </p>
                      <textarea
                        value={workflowApprovalNotes[wf.id] || ''}
                        onChange={(event) => setWorkflowApprovalNotes((previous) => ({ ...previous, [wf.id]: event.target.value }))}
                        maxLength={2000}
                        rows={2}
                        placeholder="Enter at least 5 characters of approval rationale."
                        className="w-full rounded-md border border-white/15 bg-black/30 p-2 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => decideWorkflowApproval(wf.id, 'approved')}
                          disabled={(workflowApprovalNotes[wf.id] || '').trim().length < 5}
                          className="rounded bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          Approve step
                        </button>
                        <button
                          type="button"
                          onClick={() => decideWorkflowApproval(wf.id, 'rejected')}
                          disabled={(workflowApprovalNotes[wf.id] || '').trim().length < 5}
                          className="rounded bg-red-800 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          Reject step
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step-by-Step Flow */}
                  <div className="space-y-2">
                    {wf.steps.map((st, i) => (
                      <div
                        key={st.stepId}
                        className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-xs ${
                          st.status === 'completed'
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                            : st.status === 'running'
                            ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-200 shadow-md'
                            : 'bg-black/30 border-white/5 text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold">{i + 1}.</span>
                          <span className="font-semibold">{st.title}</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span>Assigned: {st.assigneeRole}</span>
                          <span className="uppercase font-bold text-[10px]">{st.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="space-y-5 max-w-6xl mx-auto">
            <section className="rounded-xl border border-red-500/30 bg-gradient-to-r from-red-950/40 via-[#161a29] to-amber-950/20 p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    Cross-Department Incident Response
                  </h3>
                  <p className="text-xs leading-relaxed text-zinc-200">
                    Assigns evidence-based work packets to all 10 department leads and gates incident closure on an explicit human decision.
                  </p>
                  <p className="text-xs font-semibold text-amber-200">
                    Local tabletop simulation only. No credentials are used, no external systems are contacted, and no containment or deployment action is executed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={createIncidentSimulation}
                  disabled={creatingIncidentSimulation}
                  className="shrink-0 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {creatingIncidentSimulation ? 'Assigning local work packets…' : 'Create synthetic incident drill'}
                </button>
              </div>
            </section>

            {incidentError && (
              <div role="alert" className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">
                {incidentError}
              </div>
            )}

            {workflows.filter((workflow) => workflow.id.startsWith('sim-incident-')).length === 0 && (
              <div className="rounded-xl border border-white/10 bg-[#121520] p-6 text-sm text-zinc-300">
                No incident simulations have been created. Create a synthetic drill to assign scoped tasks across the departments.
              </div>
            )}

            <div className="space-y-5">
              {workflows
                .filter((workflow) => workflow.id.startsWith('sim-incident-'))
                .map((workflow) => {
                  const currentStep = workflow.steps[workflow.currentStepIndex];
                  const isBusy = incidentActionId === workflow.id;
                  return (
                    <article key={workflow.id} className="rounded-xl border border-white/10 bg-[#121520] p-5 shadow-lg space-y-4">
                      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h4 className="text-base font-bold text-white">{workflow.definitionName}</h4>
                          <p className="mt-1 text-xs text-zinc-400">{workflow.description}</p>
                          <p className="mt-2 text-[11px] font-mono text-zinc-500">ID: {workflow.id}</p>
                        </div>
                        <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-bold uppercase ${
                          workflow.status === 'completed'
                            ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                            : workflow.status === 'waiting_approval'
                              ? 'border-amber-500/40 bg-amber-950/30 text-amber-200'
                              : workflow.status === 'failed'
                                ? 'border-red-500/40 bg-red-950/30 text-red-300'
                                : 'border-cyan-500/40 bg-cyan-950/30 text-cyan-200'
                        }`}>
                          {workflow.status.replace('_', ' ')}
                        </span>
                      </header>

                      {currentStep && workflow.status === 'running' && !currentStep.requiresHumanApproval && (
                        <section className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-4 space-y-3">
                          <div className="text-xs font-bold uppercase tracking-wide text-cyan-200">
                            Current assignment: {currentStep.assigneeName} · {currentStep.assigneeRole}
                          </div>
                          <p className="text-sm text-zinc-200">{currentStep.taskDescription}</p>
                          <label className="block space-y-1.5">
                            <span className="text-xs font-medium text-zinc-300">Work evidence (required to advance)</span>
                            <textarea
                              value={incidentEvidence[workflow.id] || ''}
                              onChange={(event) => setIncidentEvidence((previous) => ({ ...previous, [workflow.id]: event.target.value }))}
                              maxLength={2000}
                              rows={3}
                              placeholder="Record what was checked, the evidence source, and any unknowns. Do not paste real secrets or personal data."
                              className="w-full rounded-md border border-white/15 bg-black/30 p-3 text-sm text-white placeholder:text-zinc-500 focus:border-cyan-400 focus:outline-none"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => completeIncidentWorkPacket(workflow.id, currentStep.stepId)}
                            disabled={isBusy || (incidentEvidence[workflow.id] || '').trim().length < 5}
                            className="rounded-md bg-cyan-700 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-600 disabled:opacity-50"
                          >
                            {isBusy ? 'Recording evidence…' : 'Record work evidence & assign next department'}
                          </button>
                        </section>
                      )}

                      {currentStep && workflow.status === 'waiting_approval' && (
                        <section className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-4 space-y-3">
                          <div className="text-xs font-bold uppercase tracking-wide text-amber-200">
                            Human approval required · {currentStep.assigneeName} · {currentStep.assigneeRole}
                          </div>
                          <p className="text-sm text-zinc-200">{currentStep.taskDescription}</p>
                          <label className="block space-y-1.5">
                            <span className="text-xs font-medium text-zinc-300">Decision rationale (required)</span>
                            <textarea
                              value={incidentApprovalNotes[workflow.id] || ''}
                              onChange={(event) => setIncidentApprovalNotes((previous) => ({ ...previous, [workflow.id]: event.target.value }))}
                              maxLength={2000}
                              rows={2}
                              placeholder="Explain the decision. Approval closes only the local tabletop simulation."
                              className="w-full rounded-md border border-white/15 bg-black/30 p-3 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
                            />
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => decideIncidentApproval(workflow.id, 'approved')}
                              disabled={isBusy || (incidentApprovalNotes[workflow.id] || '').trim().length < 5}
                              className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                            >
                              Approve simulation disposition
                            </button>
                            <button
                              type="button"
                              onClick={() => decideIncidentApproval(workflow.id, 'rejected')}
                              disabled={isBusy || (incidentApprovalNotes[workflow.id] || '').trim().length < 5}
                              className="rounded-md bg-red-800 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              Reject simulation disposition
                            </button>
                          </div>
                        </section>
                      )}

                      <div className="space-y-2">
                        {workflow.steps.map((step, index) => (
                          <div key={step.stepId} className={`rounded-lg border p-3 ${
                            step.status === 'completed'
                              ? 'border-emerald-500/30 bg-emerald-950/15'
                              : step.status === 'running' || step.status === 'waiting_approval'
                                ? 'border-cyan-500/40 bg-cyan-950/15'
                                : 'border-white/10 bg-black/20'
                          }`}>
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                              <div className="text-sm font-semibold text-white">{index + 1}. {step.title}</div>
                              <span className="text-[10px] font-mono uppercase text-zinc-300">
                                {step.status.replace('_', ' ')} · Assigned: {step.assigneeName} · {departments.find((department) => department.id === step.departmentId)?.name || step.departmentId}
                              </span>
                            </div>
                            {step.acceptanceCriteria && (
                              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-300">
                                {step.acceptanceCriteria.map((criterion) => <li key={criterion}>{criterion}</li>)}
                              </ul>
                            )}
                            {step.artifactPaths?.map((artifactPath) => (
                              <div key={artifactPath} className="mt-2 text-[11px] font-mono text-cyan-300">Code artifact: {artifactPath}</div>
                            ))}
                            {step.outputResult?.evidenceSummary && (
                              <p className="mt-2 break-words text-xs text-emerald-200">
                                Recorded by {step.outputResult.recordedBy || 'unattributed'}: {step.outputResult.evidenceSummary} · SHA-256 {step.outputResult.evidenceSha256}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </article>
                  );
                })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: EXPLICIT DECISIONS */}
        {/* ============================================================== */}
        {activeTab === 'decisions' && (
          <div className="space-y-4 max-w-6xl mx-auto">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Scale className="w-4 h-4 text-cyan-400" />
                Explicit Corporate Decision Ledger
              </h3>
              <p className="text-xs text-zinc-400">
                Consequential decisions documented with evaluated alternatives, evidence, risks, and actual measured outcomes.
              </p>
            </div>

            <div className="space-y-3">
              {decisions.map((dec) => (
                <div key={dec.id} className="rounded-xl bg-[#121520] border border-white/10 p-5 space-y-3 shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white">{dec.title}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{dec.objective}</p>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
                      {dec.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded bg-black/40 border border-white/5 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">Chosen Alternative:</span>
                      <p className="text-zinc-200 font-semibold">
                        {dec.alternatives.find((a) => a.id === dec.chosenAlternativeId)?.title || 'Alternative 1'}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Evidence: {dec.evidence[0] || 'Empirical benchmark confirmation.'}
                      </p>
                    </div>

                    <div className="p-3 rounded bg-black/40 border border-white/5 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Actual Outcome:</span>
                      <p className="text-zinc-200">{dec.actualOutcome || 'Pending 30-day review period.'}</p>
                      <p className="text-[10px] font-mono text-zinc-500">Decision Maker: {dec.decisionMakerTitle}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 7: FAILURES AS FIRST-CLASS KNOWLEDGE */}
        {/* ============================================================== */}
        {activeTab === 'failures' && (
          <div className="space-y-4 max-w-6xl mx-auto">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                Failures as First-Class Corporate Assets
              </h3>
              <p className="text-xs text-zinc-400">
                Every breakdown is preserved with exact environmental conditions, root cause analysis, and permanent prevention strategies.
              </p>
            </div>

            <div className="space-y-3">
              {failures.map((fail) => (
                <div key={fail.id} className="rounded-xl bg-[#121520] border border-white/10 p-5 space-y-3 shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase bg-rose-950/50 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded">
                          {fail.failureType}
                        </span>
                        <h4 className="text-sm font-bold text-white">{fail.title}</h4>
                      </div>
                      <p className="text-[11px] font-mono text-zinc-400 mt-1">Environment: {fail.environmentSummary}</p>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
                      RESOLVED
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded bg-black/40 border border-white/5 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-rose-400 font-bold">Root Cause:</span>
                      <p className="text-zinc-300 text-[11px] leading-relaxed">{fail.rootCause}</p>
                    </div>

                    <div className="p-3 rounded bg-black/40 border border-white/5 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                        Final Prevention Strategy:
                      </span>
                      <p className="text-zinc-300 text-[11px] leading-relaxed">{fail.preventionStrategy}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 8: GOVERNANCE & AUDIT TRAIL */}
        {/* ============================================================== */}
        {activeTab === 'governance' && (
          <div className="space-y-4 max-w-6xl mx-auto">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Zero-Trust Governance & Audit Trail
              </h3>
              <p className="text-xs text-zinc-400">
                Traceable ledger recording WHO, WHAT, WHEN, WHY, TOOL, AUTH, INPUT, and RESULT for all consequential operations.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#121520] overflow-hidden shadow">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-black/50 text-[10px] uppercase text-zinc-400 border-b border-white/10">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Actor (WHO)</th>
                    <th className="py-2.5 px-3">Operation (WHAT)</th>
                    <th className="py-2.5 px-3">Tool</th>
                    <th className="py-2.5 px-3">Risk</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditLog.map((entry) => (
                    <tr key={entry.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 text-zinc-500 text-[10px] whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3 text-cyan-300 font-semibold">{entry.who}</td>
                      <td className="py-2.5 px-3 text-zinc-200">
                        <div>{entry.what}</div>
                        <div className="text-[10px] text-zinc-500 font-sans italic">{entry.why}</div>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">{entry.withWhichTool}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            entry.riskClassification === 'CRITICAL'
                              ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                              : entry.riskClassification === 'HIGH'
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {entry.riskClassification}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold uppercase">{entry.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
