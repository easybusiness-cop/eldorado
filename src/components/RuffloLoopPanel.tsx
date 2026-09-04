import React, { useEffect, useMemo, useState } from 'react';
import { Play, RefreshCw, Square, CheckCircle2, AlertTriangle, Circle, Loader2 } from 'lucide-react';

export type LoopStepStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'SKIPPED';

export interface LoopStep {
  id: string;
  name: string;
  type?: string;
  status: LoopStepStatus;
  stdout?: string;
  stderr?: string;
  durationMs?: number;
}

export interface LoopObjective {
  id: string;
  goal: string;
  constraints?: string[];
  successCriteria?: string[];
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'needs_human';
  steps?: LoopStep[];
  recoveryAttempts?: number;
  maxRecoveryAttempts?: number;
  evidenceSummary?: string;
  updatedAt?: number;
}

interface RuffloLoopPanelProps {
  /** Optional: inject live objective from parent; if omitted, panel uses local API calls */
  objective?: LoopObjective | null;
  onCreated?: (id: string) => void;
}

const statusColor: Record<string, string> = {
  pending: 'var(--status-idle)',
  running: 'var(--status-running)',
  succeeded: 'var(--status-ok)',
  failed: 'var(--status-fail)',
  needs_human: 'var(--status-warn)',
  PENDING: 'var(--status-idle)',
  RUNNING: 'var(--status-running)',
  SUCCEEDED: 'var(--status-ok)',
  FAILED: 'var(--status-fail)',
  SKIPPED: 'var(--status-idle)',
};

function StepIcon({ status }: { status: LoopStepStatus }) {
  if (status === 'RUNNING') return <Loader2 className="w-3.5 h-3.5 animate-spin-slow" style={{ color: 'var(--status-running)' }} />;
  if (status === 'SUCCEEDED') return <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--status-ok)' }} />;
  if (status === 'FAILED') return <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--status-fail)' }} />;
  return <Circle className="w-3.5 h-3.5" style={{ color: 'var(--status-idle)' }} />;
}

export function RuffloLoopPanel({ objective: controlled, onCreated }: RuffloLoopPanelProps) {
  const [goal, setGoal] = useState('Add GET /api/health returning { status: "ok" } with a unit test');
  const [constraints, setConstraints] = useState('no production writes\ndraft PR only');
  const [criteria, setCriteria] = useState('tests pass\nendpoint exists');
  const [localObjective, setLocalObjective] = useState<LoopObjective | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const objective = controlled ?? localObjective;

  const selectedStep = useMemo(() => {
    if (!objective?.steps?.length) return null;
    return objective.steps.find((s) => s.id === selectedStepId) ?? objective.steps[objective.steps.length - 1];
  }, [objective, selectedStepId]);

  // Poll while running
  useEffect(() => {
    if (!objective?.id || objective.status !== 'running') return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/objectives/${objective.id}`);
        if (!res.ok) return;
        const data = await res.json();
        setLocalObjective(data.objective ?? data);
      } catch {
        /* ignore transient poll errors */
      }
    }, 1500);
    return () => clearInterval(t);
  }, [objective?.id, objective?.status]);

  async function createAndRun() {
    setBusy(true);
    setError(null);
    try {
      const body = {
        goal: goal.trim(),
        constraints: constraints
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        successCriteria: criteria
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        maxRecoveryAttempts: 3,
      };

      const createRes = await fetch('/api/objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(created.error || 'Failed to create objective');

      const id = created.objective?.id ?? created.id;
      onCreated?.(id);

      const runRes = await fetch(`/api/objectives/${id}/run`, { method: 'POST' });
      const runData = await runRes.json();
      if (!runRes.ok) throw new Error(runData.error || 'Failed to run objective');

      setLocalObjective(runData.objective ?? { id, goal: body.goal, status: 'running', steps: [] });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function refreshEvidence() {
    if (!objective?.id) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/objectives/${objective.id}/evidence`);
      const data = await res.json();
      if (res.ok) {
        setLocalObjective((prev) => ({
          ...(prev as LoopObjective),
          ...(data.objective ?? {}),
          evidenceSummary: data.summary ?? data.evidenceSummary,
          steps: data.steps ?? data.objective?.steps ?? prev?.steps,
        }));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rufflo-grid-2 animate-in" style={{ alignItems: 'start' }}>
      {/* LEFT: create + status */}
      <div className="rufflo-panel">
        <div className="rufflo-panel-header">
          <div className="rufflo-panel-title">Objective</div>
          <div className="flex items-center gap-2">
            <span
              className="status-dot"
              style={{ background: statusColor[objective?.status || 'pending'] }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
              {(objective?.status || 'idle').toUpperCase()}
            </span>
          </div>
        </div>
        <div className="rufflo-panel-body" style={{ display: 'grid', gap: 12 }}>
          <div>
            <label className="rufflo-label">Goal</label>
            <textarea
              className="rufflo-textarea"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="High-level engineering objective…"
            />
          </div>
          <div className="rufflo-grid-2">
            <div>
              <label className="rufflo-label">Constraints</label>
              <textarea
                className="rufflo-textarea"
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                style={{ minHeight: 72 }}
              />
            </div>
            <div>
              <label className="rufflo-label">Success criteria</label>
              <textarea
                className="rufflo-textarea"
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                style={{ minHeight: 72 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="rufflo-btn rufflo-btn-primary" disabled={busy || !goal.trim()} onClick={createAndRun}>
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin-slow" /> : <Play className="w-3.5 h-3.5" />}
              Run loop
            </button>
            <button className="rufflo-btn" disabled={busy || !objective?.id} onClick={refreshEvidence}>
              <RefreshCw className="w-3.5 h-3.5" />
              Evidence
            </button>
            <button
              className="rufflo-btn rufflo-btn-ghost"
              disabled={!objective || objective.status !== 'running'}
              onClick={() => setLocalObjective((o) => (o ? { ...o, status: 'needs_human' } : o))}
              title="Mark needs human (local UI stop signal)"
            >
              <Square className="w-3.5 h-3.5" />
              Pause UI
            </button>
          </div>

          {error && (
            <div style={{ color: 'var(--status-fail)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              {error}
            </div>
          )}

          {objective && (
            <div className="rufflo-card" style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
              <div>ID: {objective.id}</div>
              <div>
                Recovery: {objective.recoveryAttempts ?? 0}/{objective.maxRecoveryAttempts ?? 3}
              </div>
              {objective.evidenceSummary && <div style={{ marginTop: 6 }}>{objective.evidenceSummary}</div>}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: timeline + terminal */}
      <div style={{ display: 'grid', gap: 12 }}>
        <div className="rufflo-panel">
          <div className="rufflo-panel-header">
            <div className="rufflo-panel-title">Execution sequence</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
              {objective?.steps?.length ?? 0} steps
            </div>
          </div>
          <div className="rufflo-panel-body stagger" style={{ display: 'grid', gap: 8 }}>
            {!objective?.steps?.length && (
              <div style={{ color: 'var(--text-3)', fontSize: 12 }}>No steps yet. Run an objective.</div>
            )}
            {objective?.steps?.map((step, idx) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setSelectedStepId(step.id)}
                className="rufflo-card"
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderColor: selectedStep?.id === step.id ? 'var(--border-accent)' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <StepIcon status={step.status} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-0)' }}>
                      {idx + 1}. {step.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
                      {(step.type || 'STEP').toUpperCase()} · {step.status}
                      {typeof step.durationMs === 'number' ? ` · ${step.durationMs}ms` : ''}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rufflo-panel">
          <div className="rufflo-panel-header">
            <div className="rufflo-panel-title">Artifacts / terminal</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
              {selectedStep?.name || '—'}
            </div>
          </div>
          <div className="rufflo-panel-body">
            <div className="rufflo-terminal">
              {selectedStep?.stdout || selectedStep?.stderr
                ? `${selectedStep.stdout || ''}${selectedStep.stderr ? `\n[stderr]\n${selectedStep.stderr}` : ''}`
                : '// stdout/stderr from the selected step will appear here'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RuffloLoopPanel;
