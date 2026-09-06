import React, { useEffect, useState } from 'react';
import { Cpu, Zap, AlertTriangle, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { RuffloLoopPanel } from './RuffloLoopPanel';

interface MasterMetaPanelProps {
  objective?: any;
}

export function MasterMetaPanel({ objective }: MasterMetaPanelProps) {
  const [metaState, setMetaState] = useState({
    healthScore: 87,
    recentObjectives: 47,
    successRate: 92,
    weakAgents: 2,
    lastImprovement: null as any,
    isRunningCycle: false,
  });
  const [loading, setLoading] = useState(false);
  const [weakDetails, setWeakDetails] = useState<any[]>([]);

  const pollMeta = async () => {
    try {
      const res = await fetch('/api/meta/observe');
      if (res.ok) {
        const data = await res.json();
        setMetaState(data);
        setWeakDetails(data.weakAgents || []);
      }
    } catch {}
  };

  useEffect(() => {
    pollMeta();
    const interval = setInterval(pollMeta, 4000);
    return () => clearInterval(interval);
  }, []);

  const runImprovementCycle = async () => {
    setLoading(true);
    try {
      await fetch('/api/meta/improve', { method: 'POST' });
      await new Promise((r) => setTimeout(r, 1200));
      await pollMeta(); // refresh
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rufflo-grid-2 animate-in" style={{ alignItems: 'start' }}>
      {/* LEFT: Master Overview */}
      <div className="rufflo-panel">
        <div className="rufflo-panel-header">
          <div className="rufflo-panel-title">Master Meta-Agent</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ color: 'var(--status-ok)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>ONLINE</div>
            <Zap className="w-3.5 h-3.5 text-[#fabd2f]" />
          </div>
        </div>

        <div className="rufflo-panel-body" style={{ display: 'grid', gap: 14 }}>
          {/* Health Score */}
          <div className="rufflo-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{metaState.healthScore}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>DEPARTMENT HEALTH</div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'var(--bg-3)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>RECENT OBJECTIVES</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{metaState.recentObjectives}</div>
            </div>
            <div style={{ background: 'var(--bg-3)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>SUCCESS RATE</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{metaState.successRate}%</div>
            </div>
          </div>

          {/* Weak Agents */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Weak Agents & Bottlenecks</div>
              <div style={{ fontSize: 11, color: 'var(--status-warn)' }}>{weakDetails.length}</div>
            </div>
            {weakDetails.map((w, i) => (
              <div key={i} className="rufflo-card" style={{ padding: 10, marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{w.objectiveId?.slice(0, 20)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
                  {w.failureCount} failure signals · {w.rootCause || 'Needs better failure memory'}
                </div>
              </div>
            ))}
          </div>

          {/* Improvement Proposal */}
          {metaState.lastImprovement && (
            <div style={{ border: '1px solid var(--border-accent)', padding: 12, borderRadius: 8, background: 'var(--accent-dim)' }}>
              <div style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>PROPOSED IMPROVEMENT</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>{metaState.lastImprovement.proposal}</div>
            </div>
          )}

          <button
            className="rufflo-btn rufflo-btn-primary"
            disabled={loading}
            onClick={runImprovementCycle}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Run Weekly Improvement Cycle
          </button>
        </div>
      </div>

      {/* RIGHT: Active Loop (if running or standby) */}
      <div className="rufflo-panel">
        <div className="rufflo-panel-header">
          <div className="rufflo-panel-title">Current Engineering Loop</div>
        </div>
        <div className="rufflo-panel-body">
          <RuffloLoopPanel />
        </div>
      </div>
    </div>
  );
}
