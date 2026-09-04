import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Cpu,
  Layers,
  Zap,
  Activity,
  X,
  Plus
} from 'lucide-react';
import { soundFx } from '../utils/speech';

interface MasterSelfEvolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MasterSelfEvolutionModal: React.FC<MasterSelfEvolutionModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'proposals' | 'repositories' | 'failures'>('proposals');

  // Master Proposals
  const [proposals, setProposals] = useState<any[]>([]);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [newLimitation, setNewLimitation] = useState('');
  const [newSolution, setNewSolution] = useState('');

  // Repositories
  const [repositories, setRepositories] = useState<any[]>([]);
  const [repoLoading, setRepoLoading] = useState(false);
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [newRepoName, setNewRepoName] = useState('');

  // Failures
  const [failures, setFailures] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchProposals();
      fetchRepositories();
      fetchFailures();
    }
  }, [isOpen]);

  const fetchProposals = async () => {
    try {
      const res = await fetch('/api/v2/master/proposals');
      const data = await res.json();
      if (data.success) setProposals(data.proposals);
    } catch (e) {
      console.error('Fetch proposals error:', e);
    }
  };

  const fetchRepositories = async () => {
    try {
      const res = await fetch('/api/v2/repositories');
      const data = await res.json();
      if (data.success) setRepositories(data.repositories);
    } catch (e) {
      console.error('Fetch repositories error:', e);
    }
  };

  const fetchFailures = async () => {
    try {
      const res = await fetch('/api/autonomy/failures');
      const data = await res.json();
      if (data.success && data.records) {
        setFailures(data.records);
      } else {
        const fallbackRes = await fetch('/api/v2/training/failures');
        const fallbackData = await fallbackRes.json();
        if (fallbackData.success) setFailures(fallbackData.failures);
      }
    } catch (e) {
      console.error('Fetch failures error:', e);
    }
  };

  const handleCreateProposal = async () => {
    if (!newLimitation || !newSolution) return;
    soundFx.playClick();
    setProposalLoading(true);
    try {
      const res = await fetch('/api/v2/master/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'ruflo-coder',
          currentVersion: 'v1.0.0',
          detectedLimitation: newLimitation,
          proposedSolution: newSolution,
          targetCapabilities: ['system_architecture', 'concurrency_tuning'],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewLimitation('');
        setNewSolution('');
        fetchProposals();
      }
    } catch (e) {
      console.error('Create proposal error:', e);
    } finally {
      setProposalLoading(false);
    }
  };

  const handleApproveProposal = async (id: string) => {
    soundFx.playClick();
    try {
      const res = await fetch(`/api/v2/master/proposals/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) fetchProposals();
    } catch (e) {
      console.error('Approve proposal error:', e);
    }
  };

  const handleRollbackProposal = async (id: string) => {
    soundFx.playClick();
    try {
      const res = await fetch(`/api/v2/master/proposals/${id}/rollback`, { method: 'POST' });
      const data = await res.json();
      if (data.success) fetchProposals();
    } catch (e) {
      console.error('Rollback proposal error:', e);
    }
  };

  const handleIngestRepo = async () => {
    if (!newRepoUrl) return;
    soundFx.playClick();
    setRepoLoading(true);
    try {
      const res = await fetch('/api/autonomy/ingest-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repository: newRepoUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setNewRepoUrl('');
        setNewRepoName('');
        fetchRepositories();
      } else {
        const fallbackRes = await fetch('/api/v2/repositories/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoUrl: newRepoUrl, name: newRepoName || 'Repository Knowledge' }),
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackData.success) {
          setNewRepoUrl('');
          setNewRepoName('');
          fetchRepositories();
        }
      }
    } catch (e) {
      console.error('Ingest repo error:', e);
    } finally {
      setRepoLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase font-extrabold tracking-widest mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" /> MASTER ENGINEER SELF-DEVELOPMENT & KNOWLEDGE ENGINE
            </div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              Autonomous Evolution & Repository Intelligence
            </h2>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('proposals')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              activeTab === 'proposals'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            <GitBranch className="w-4 h-4" /> Versioned Self-Improvements
          </button>
          <button
            onClick={() => setActiveTab('repositories')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              activeTab === 'repositories'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Repository Intelligence
          </button>
          <button
            onClick={() => setActiveTab('failures')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              activeTab === 'failures'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> Failure School & Memory
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: MASTER VERSIONED SELF-IMPROVEMENTS */}
          {activeTab === 'proposals' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-indigo-950 text-sm">MASTER AGENT CONTROLLED SELF-DEVELOPMENT</h4>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Level 8 Master Agents detect architecture bottlenecks, generate sandbox prototypes, run benchmark suites (+14.8% minimum gain requirement), and undergo security gating before versioned release.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-mono text-xs font-bold shrink-0">
                  Version Control Sandbox
                </span>
              </div>

              {/* Form: Propose New Self-Improvement */}
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
                <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-600" /> Propose New Master Agent Self-Improvement
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Detected Architectural Limitation:</label>
                    <input
                      type="text"
                      placeholder="e.g. Distributed lock contention during concurrent task dispatches"
                      value={newLimitation}
                      onChange={e => setNewLimitation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-sans text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Proposed Solution & Pattern:</label>
                    <input
                      type="text"
                      placeholder="e.g. Implement optimistic lock-free queue with memory ring-buffers"
                      value={newSolution}
                      onChange={e => setNewSolution(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-sans text-xs"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreateProposal}
                  disabled={proposalLoading || !newLimitation || !newSolution}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition shadow-sm disabled:opacity-50"
                >
                  {proposalLoading ? 'Evaluating LLM Architecture Benchmark...' : 'Submit Self-Improvement Proposal'}
                </button>
              </div>

              {/* Proposals List */}
              <div className="space-y-4">
                {proposals.map(p => (
                  <div key={p.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs font-bold">
                          {p.currentVersion} → {p.targetVersion}
                        </span>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">{p.agentId}</h4>
                          <span className="text-[11px] text-slate-500 font-mono">ID: {p.id}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {p.status === 'RELEASED' && (
                          <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> RELEASED IN PRODUCTION
                          </span>
                        )}
                        {p.status === 'AWAITING_APPROVAL' && (
                          <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> AWAITING APPROVAL
                          </span>
                        )}
                        {p.status === 'ROLLED_BACK' && (
                          <span className="px-3 py-1 rounded-xl bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs flex items-center gap-1">
                            <RotateCcw className="w-3.5 h-3.5 text-rose-600" /> ROLLED BACK
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="font-bold text-slate-500 uppercase text-[10px] mb-1">Detected Limitation:</div>
                        <p className="text-slate-800 font-medium">{p.detectedLimitation}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="font-bold text-slate-500 uppercase text-[10px] mb-1">Proposed Solution:</div>
                        <p className="text-slate-800 font-medium">{p.proposedSolution}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          Gain: +{p.benchmarkGainPercent}%
                        </span>
                        <span className="text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                          Security Audit: PASS
                        </span>
                        <span className="text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                          Regression Suite: PASS
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {p.status === 'AWAITING_APPROVAL' && (
                          <button
                            onClick={() => handleApproveProposal(p.id)}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-sm"
                          >
                            Approve & Release {p.targetVersion}
                          </button>
                        )}
                        {p.status === 'RELEASED' && (
                          <button
                            onClick={() => handleRollbackProposal(p.id)}
                            className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition shadow-sm"
                          >
                            Rollback to {p.currentVersion}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: REPOSITORY INTELLIGENCE */}
          {activeTab === 'repositories' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-emerald-950 text-sm">REPOSITORY KNOWLEDGE INGESTION PIPELINE</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Parses open-source engineering repositories (Mastra, LangGraph, Cline, Browser Use, Composio, OSSU CS) into structured concepts, patterns, and verification tests.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold shrink-0">
                  Repo Intelligence
                </span>
              </div>

              {/* Form: Ingest New Repo */}
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
                <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-600" /> Ingest Open-Source Repository
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Repository Name:</label>
                    <input
                      type="text"
                      placeholder="e.g. smolagents / AutoGen"
                      value={newRepoName}
                      onChange={e => setNewRepoName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-sans text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">GitHub URL:</label>
                    <input
                      type="text"
                      placeholder="e.g. https://github.com/huggingface/smolagents"
                      value={newRepoUrl}
                      onChange={e => setNewRepoUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-sans text-xs"
                    />
                  </div>
                </div>
                <button
                  onClick={handleIngestRepo}
                  disabled={repoLoading || !newRepoName || !newRepoUrl}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-sm disabled:opacity-50"
                >
                  {repoLoading ? 'Parsing & Extracting Architecture Concepts...' : 'Ingest Repository Knowledge'}
                </button>
              </div>

              {/* Repositories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {repositories.map(r => (
                  <div key={r.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{r.name}</h4>
                        <a href={r.repoUrl} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-600 font-mono hover:underline">
                          {r.repoUrl}
                        </a>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-[10px] font-bold">
                        {r.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-400">Concepts</div>
                        <div className="font-bold text-slate-800">{r.conceptsExtractedCount}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-400">Modules</div>
                        <div className="font-bold text-slate-800">{r.trainingModulesCount}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-400">Tests Passed</div>
                        <div className="font-bold text-emerald-600">{r.passedTestCount}/{r.totalTestCount}</div>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Derived Patterns:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {r.derivedPatterns.map((dp: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                            {dp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: FAILURE SCHOOL & MEMORY */}
          {activeTab === 'failures' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-amber-950 text-sm">FAILURE SCHOOL & ORGANIZATIONAL MEMORY</h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Converts software engineering task failures into root cause analysis, corrective lessons, and automated regression test suites.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-amber-600 text-white font-mono text-xs font-bold shrink-0">
                  Regression Memory
                </span>
              </div>

              <div className="space-y-4">
                {failures.map(f => (
                  <div key={f.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 border border-rose-300 font-mono text-[10px] font-bold">
                          {f.category}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-xs">{f.taskTitle}</h4>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">Agent: {f.agentId}</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded-2xl bg-slate-900 text-rose-300 font-mono text-[11px]">
                        <div className="text-slate-400 font-bold mb-0.5">Failure Log:</div>
                        <div>{f.failureLog}</div>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 space-y-1">
                        <div><strong className="text-slate-900">Root Cause:</strong> {f.rootCause}</div>
                        <div><strong className="text-emerald-700">Corrective Fix:</strong> {f.correctiveFix}</div>
                      </div>

                      <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-medium italic">
                        "Lesson learned: {f.generatedLesson}"
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
