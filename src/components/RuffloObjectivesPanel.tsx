import React, { useState, useEffect } from "react";
import {
  Target,
  Play,
  CheckCircle2,
  AlertCircle,
  Activity,
  Plus,
  RefreshCw,
  List,
  Flame,
  Database,
} from "lucide-react";

interface ObjectiveStep {
  id: string;
  name: string;
  type: "CODE" | "BUILD" | "TEST" | "SECURITY";
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  command?: string;
  expected?: string;
  artifacts?: string[];
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  durationMs?: number;
  error?: string;
  evaluationScores?: {
    correctness: number;
    reliability: number;
    security: number;
    performance: number;
  };
}

interface Objective {
  id: string;
  goal: string;
  constraints: string[];
  successCriteria: string[];
  status: "PLANNING" | "RUNNING" | "COMPLETED" | "FAILED" | "NEEDS_HUMAN";
  steps: ObjectiveStep[];
  currentStepIndex: number;
  failures: string[];
  recoveryAttempts: number;
  maxRecoveryAttempts: number;
  maxWallTimeMs: number;
  budgetExhausted: boolean;
  evidence: string[];
  createdAt: string;
  updatedAt: string;
}

interface PersistenceInfo {
  status: string;
  warning: string;
  fallbackPath?: string;
}

export const RuffloObjectivesPanel: React.FC = () => {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [pollingActive, setPollingActive] = useState<boolean>(false);
  const [persistence, setPersistence] = useState<PersistenceInfo | null>(null);

  // New Objective form state
  const [goal, setGoal] = useState<string>("");
  const [rawConstraints, setRawConstraints] = useState<string>("");
  const [rawSuccessCriteria, setRawSuccessCriteria] = useState<string>("");
  const [maxRecoveryAttemptsInput, setMaxRecoveryAttemptsInput] = useState<number>(3);
  const [maxWallTimeMsInput, setMaxWallTimeMsInput] = useState<number>(300000); // 5 mins

  const fetchObjectives = async (selectId?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/objectives");
      if (res.ok) {
        const data = await res.json();
        if (data.persistence) {
          setPersistence(data.persistence);
        }
        if (data.success && Array.isArray(data.objectives)) {
          setObjectives(data.objectives);
          if (selectId) {
            const found = data.objectives.find((o: Objective) => o.id === selectId);
            if (found) setSelectedObjective(found);
          } else if (selectedObjective) {
            const found = data.objectives.find((o: Objective) => o.id === selectedObjective.id);
            if (found) setSelectedObjective(found);
          } else if (data.objectives.length > 0 && !selectedObjective) {
            setSelectedObjective(data.objectives[0]);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching objectives:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchObjectives();
  }, []);

  // Poll active running objectives
  useEffect(() => {
    if (!selectedObjective || !["RUNNING", "PLANNING"].includes(selectedObjective.status)) {
      setPollingActive(false);
      return;
    }

    setPollingActive(true);
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/objectives/${selectedObjective.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.objective) {
            setSelectedObjective(data.objective);
            if (data.persistence) {
              setPersistence(data.persistence);
            }
            // Also update in objectives list
            setObjectives((prev) =>
              prev.map((o) => (o.id === data.objective.id ? data.objective : o))
            );
            if (!["RUNNING", "PLANNING"].includes(data.objective.status)) {
              clearInterval(interval);
              setPollingActive(false);
            }
          }
        }
      } catch (err) {
        console.error("Polling objective error:", err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [selectedObjective?.id, selectedObjective?.status]);

  const handleCreateObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/objectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          constraints: rawConstraints
            .split("\n")
            .map((c) => c.trim())
            .filter((c) => c.length > 0),
          successCriteria: rawSuccessCriteria
            .split("\n")
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
          maxRecoveryAttempts: Number(maxRecoveryAttemptsInput),
          maxWallTimeMs: Number(maxWallTimeMsInput),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.objective) {
          setGoal("");
          setRawConstraints("");
          setRawSuccessCriteria("");
          setMaxRecoveryAttemptsInput(3);
          setMaxWallTimeMsInput(300000);
          await fetchObjectives(data.objective.id);
        }
      }
    } catch (err) {
      console.error("Error creating objective:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRunObjective = async (id: string) => {
    try {
      // Optimistic update of status to RUNNING
      setObjectives((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "RUNNING" } : o))
      );
      if (selectedObjective?.id === id) {
        setSelectedObjective((prev) => (prev ? { ...prev, status: "RUNNING" } : null));
      }

      const res = await fetch(`/api/objectives/${id}/run`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.objective) {
          setSelectedObjective(data.objective);
          setObjectives((prev) =>
            prev.map((o) => (o.id === data.objective.id ? data.objective : o))
          );
        }
      }
    } catch (err) {
      console.error("Error executing objective loop:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PLANNING":
        return "bg-sky-500/20 text-sky-700 dark:text-sky-400 border-sky-500/40";
      case "RUNNING":
        return "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40 animate-pulse";
      case "COMPLETED":
        return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40";
      case "FAILED":
        return "bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/40";
      case "NEEDS_HUMAN":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/40 font-bold";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/40";
    }
  };

  const getStepTypeBadge = (type: string) => {
    switch (type) {
      case "CODE":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/25";
      case "BUILD":
        return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/25";
      case "TEST":
        return "bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/25";
      case "SECURITY":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/25 font-bold";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border border-gray-500/25";
    }
  };

  // Check if current steps have failed to offer Resume action
  const isResumable = selectedObjective?.steps.some(s => s.status === "FAILED") || false;

  return (
    <div className="flex flex-col gap-3 h-full p-1 overflow-y-auto">
      {/* Fallback Warning Banner */}
      {persistence && persistence.status === "fallback_local" && (
        <div className="p-2.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300 flex items-start gap-2 text-xs">
          <Database className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase mr-1">[Persistence Warning]:</span>
            Supabase/Postgres is unavailable or unconfigured. All loop objectives, step results, failure records, and evidence are safely persisted locally to 
            <code className="mx-1 px-1 py-0.5 rounded bg-[#fbf1c7] dark:bg-[#1d2021] border border-amber-500/30">.rufflo-store.json</code>.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Sidebar - Objective List & Creation Form */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Create Objective Form */}
          <div className="p-4 rounded-lg bg-[#ebdbb2]/50 dark:bg-[#282828] border border-[#d5c4a1] dark:border-[#3c3836]">
            <div className="flex items-center gap-1.5 mb-3">
              <Plus className="w-4 h-4 text-[#b57614] dark:text-[#fabd2f]" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#b57614] dark:text-[#fabd2f]">
                Initialize Objective
              </h3>
            </div>
            <form onSubmit={handleCreateObjective} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1 text-[#7c6f64] dark:text-[#a89984]">
                  Goal Definition
                </label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  required
                  rows={2}
                  placeholder="Describe what Rufflo needs to execute (e.g. Verify safe routing logic)"
                  className="w-full text-xs p-2 rounded bg-[#fbf1c7] dark:bg-[#1d2021] border border-[#d5c4a1] dark:border-[#3c3836] focus:outline-none focus:border-[#b57614] dark:focus:border-[#fabd2f] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold uppercase mb-1 text-[#7c6f64] dark:text-[#a89984]">
                    Max Recovery (Attempts)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={maxRecoveryAttemptsInput}
                    onChange={(e) => setMaxRecoveryAttemptsInput(Number(e.target.value))}
                    className="w-full text-xs p-1.5 rounded bg-[#fbf1c7] dark:bg-[#1d2021] border border-[#d5c4a1] dark:border-[#3c3836] focus:outline-none focus:border-[#b57614] dark:focus:border-[#fabd2f]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase mb-1 text-[#7c6f64] dark:text-[#a89984]">
                    Max Time (Wall ms)
                  </label>
                  <input
                    type="number"
                    step={10000}
                    min={10000}
                    value={maxWallTimeMsInput}
                    onChange={(e) => setMaxWallTimeMsInput(Number(e.target.value))}
                    className="w-full text-xs p-1.5 rounded bg-[#fbf1c7] dark:bg-[#1d2021] border border-[#d5c4a1] dark:border-[#3c3836] focus:outline-none focus:border-[#b57614] dark:focus:border-[#fabd2f]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1 text-[#7c6f64] dark:text-[#a89984]">
                  Constraints (One per line)
                </label>
                <textarea
                  value={rawConstraints}
                  onChange={(e) => setRawConstraints(e.target.value)}
                  rows={2}
                  placeholder="No external third-party SDK calls&#10;Timeout 30 seconds"
                  className="w-full text-xs p-2 rounded bg-[#fbf1c7] dark:bg-[#1d2021] border border-[#d5c4a1] dark:border-[#3c3836] focus:outline-none focus:border-[#b57614] dark:focus:border-[#fabd2f] resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1 text-[#7c6f64] dark:text-[#a89984]">
                  Success Criteria (One per line)
                </label>
                <textarea
                  value={rawSuccessCriteria}
                  onChange={(e) => setRawSuccessCriteria(e.target.value)}
                  rows={2}
                  placeholder="Audit logs created successfully&#10;Correct build output verified"
                  className="w-full text-xs p-2 rounded bg-[#fbf1c7] dark:bg-[#1d2021] border border-[#d5c4a1] dark:border-[#3c3836] focus:outline-none focus:border-[#b57614] dark:focus:border-[#fabd2f] resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isCreating || !goal.trim()}
                className="w-full py-1.5 px-3 bg-[#b57614] hover:bg-[#9d630c] dark:bg-[#fabd2f] dark:hover:bg-[#fabd2f]/80 text-[#fbf1c7] dark:text-[#1d2021] font-bold rounded text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Planning Loop...</span>
                  </>
                ) : (
                  <>
                    <Target className="w-3.5 h-3.5" />
                    <span>Launch Autonomous Agent</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Objectives List */}
          <div className="flex-1 p-3 rounded-lg bg-[#ebdbb2]/50 dark:bg-[#282828] border border-[#d5c4a1] dark:border-[#3c3836] flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#d5c4a1] dark:border-[#3c3836]">
              <div className="flex items-center gap-1.5">
                <List className="w-3.5 h-3.5 text-[#b57614] dark:text-[#fabd2f]" />
                <span className="font-bold text-[10px] uppercase tracking-wider">Active Objectives</span>
              </div>
              <button
                onClick={() => fetchObjectives()}
                className="p-1 hover:bg-[#d5c4a1] dark:hover:bg-[#3c3836] rounded transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-[300px] flex-1 pr-1">
              {objectives.length === 0 ? (
                <div className="text-center text-[#7c6f64] dark:text-[#928374] text-[11px] py-8">
                  No active objectives. Initialize one above.
                </div>
              ) : (
                objectives.map((obj) => (
                  <button
                    key={obj.id}
                    onClick={() => setSelectedObjective(obj)}
                    className={`w-full p-2 rounded text-left border transition-colors flex flex-col gap-1 ${
                      selectedObjective?.id === obj.id
                        ? "bg-[#d5c4a1]/40 dark:bg-[#3c3836]/60 border-[#b57614] dark:border-[#fabd2f]"
                        : "bg-[#fbf1c7]/40 dark:bg-[#1d2021]/30 hover:bg-[#ebdbb2]/30 dark:hover:bg-[#282828]/50 border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-bold text-[#b57614] dark:text-[#fabd2f]">
                        {obj.id}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${getStatusBadge(
                          obj.status
                        )}`}
                      >
                        {obj.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#3c3836] dark:text-[#ebdbb2] line-clamp-2 leading-relaxed">
                      {obj.goal}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Panel - Objective Steps & Real-time Logs */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {selectedObjective ? (
            <div className="flex-1 flex flex-col gap-4">
              {/* Header Summary */}
              <div className="p-4 rounded-lg bg-[#ebdbb2]/30 dark:bg-[#282828]/40 border border-[#d5c4a1] dark:border-[#3c3836] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded border bg-[#ebdbb2] dark:bg-[#3c3836] border-[#d5c4a1] dark:border-[#504945]">
                      {selectedObjective.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(
                        selectedObjective.status
                      )}`}
                    >
                      {selectedObjective.status}
                    </span>
                    <span className="text-[10px] font-medium text-[#7c6f64] dark:text-[#a89984] border border-[#d5c4a1] dark:border-[#3c3836] rounded px-1.5 py-0.5 bg-black/5 dark:bg-white/5">
                      Max Recovery: {selectedObjective.maxRecoveryAttempts}
                    </span>
                    <span className="text-[10px] font-medium text-[#7c6f64] dark:text-[#a89984] border border-[#d5c4a1] dark:border-[#3c3836] rounded px-1.5 py-0.5 bg-black/5 dark:bg-white/5">
                      Time Budget: {selectedObjective.maxWallTimeMs}ms
                    </span>
                    {pollingActive && (
                      <span className="flex items-center gap-1 text-[10px] text-[#b57614] dark:text-[#fabd2f] font-bold animate-pulse">
                        <Activity className="w-3.5 h-3.5 animate-spin" />
                        Polling Loop...
                      </span>
                    )}
                  </div>
                  <h2 className="font-bold text-sm text-[#3c3836] dark:text-[#fbf1c7] leading-relaxed">
                    {selectedObjective.goal}
                  </h2>
                </div>

                {/* Action Button */}
                {["PLANNING", "FAILED", "NEEDS_HUMAN"].includes(selectedObjective.status) && (
                  <button
                    onClick={() => handleRunObjective(selectedObjective.id)}
                    className={`px-4 py-2 text-[#fbf1c7] font-bold rounded text-xs transition-colors flex items-center justify-center gap-2 border shadow ${
                      isResumable 
                        ? "bg-amber-600 hover:bg-amber-700 border-amber-500/40" 
                        : "bg-emerald-600 hover:bg-emerald-700 border-emerald-500/40"
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{isResumable ? "Resume Loop" : "Execute Loop"}</span>
                  </button>
                )}
              </div>

              {/* Constraints & Success Criteria Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Constraints */}
                <div className="p-3 rounded-lg bg-[#ebdbb2]/20 dark:bg-[#282828]/20 border border-[#d5c4a1] dark:border-[#3c3836]">
                  <div className="font-bold text-[10px] uppercase text-[#7c6f64] dark:text-[#a89984] mb-1.5 tracking-wider">
                    Operational Constraints
                  </div>
                  <ul className="text-[11px] space-y-1">
                    {selectedObjective.constraints.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[#504945] dark:text-[#ebdbb2]">
                        <span className="text-amber-500 shrink-0 mt-0.5">⚠️</span>
                        <span>{c}</span>
                      </li>
                    ))}
                    {selectedObjective.constraints.length === 0 && (
                      <li className="text-[#928374] italic">No custom security constraints defined</li>
                    )}
                  </ul>
                </div>

                {/* Success Criteria */}
                <div className="p-3 rounded-lg bg-[#ebdbb2]/20 dark:bg-[#282828]/20 border border-[#d5c4a1] dark:border-[#3c3836]">
                  <div className="font-bold text-[10px] uppercase text-[#7c6f64] dark:text-[#a89984] mb-1.5 tracking-wider">
                    Success Criteria
                  </div>
                  <ul className="text-[11px] space-y-1">
                    {selectedObjective.successCriteria.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[#504945] dark:text-[#ebdbb2]">
                        <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                    {selectedObjective.successCriteria.length === 0 && (
                      <li className="text-[#928374] italic">Standard test suite compliance required</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Execution Steps */}
              <div className="p-4 rounded-lg bg-[#ebdbb2]/40 dark:bg-[#282828]/40 border border-[#d5c4a1] dark:border-[#3c3836] flex-1 flex flex-col min-h-[300px]">
                <div className="font-bold text-[10px] uppercase text-[#b57614] dark:text-[#fabd2f] tracking-wider pb-2 border-b border-[#d5c4a1] dark:border-[#3c3836] mb-3 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Linear Execution Sequence</span>
                </div>

                <div className="space-y-3 overflow-y-auto flex-1 pr-1 max-h-[400px]">
                  {selectedObjective.steps.map((step, idx) => (
                    <div
                      key={step.id}
                      className={`p-3 rounded border flex flex-col gap-2 transition-all ${
                        step.status === "RUNNING"
                          ? "bg-amber-500/5 border-amber-500/40 ring-1 ring-amber-500/20"
                          : step.status === "COMPLETED"
                          ? "bg-emerald-500/5 border-emerald-500/30"
                          : step.status === "FAILED"
                          ? "bg-rose-500/5 border-rose-500/35"
                          : "bg-[#fbf1c7]/10 dark:bg-[#1d2021]/10 border-[#d5c4a1] dark:border-[#3c3836] opacity-75"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#7c6f64] dark:text-[#928374]">
                            #{idx + 1}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${getStepTypeBadge(step.type)}`}>
                            {step.type}
                          </span>
                          <h4 className="font-bold text-xs text-[#3c3836] dark:text-[#ebdbb2]">
                            {step.name}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2">
                          {step.durationMs && (
                            <span className="text-[9px] text-[#7c6f64] dark:text-[#928374]">
                              {step.durationMs}ms
                            </span>
                          )}
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded border font-bold ${
                              step.status === "RUNNING"
                                ? "bg-amber-500/20 text-amber-600 border-amber-500/40 animate-pulse"
                                : step.status === "COMPLETED"
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
                                : step.status === "FAILED"
                                ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40 font-bold"
                                : "bg-gray-500/20 text-gray-500 border-gray-500/40"
                            }`}
                          >
                            {step.status}
                          </span>
                        </div>
                      </div>

                      {/* Step Internal Command Details */}
                      {step.command && (
                        <div className="text-[10px] bg-[#fbf1c7] dark:bg-[#1d2021] p-2 rounded border border-[#d5c4a1] dark:border-[#3c3836] font-mono overflow-x-auto">
                          <div className="text-rose-400 dark:text-[#fabd2f] font-semibold mb-0.5">
                            $ {step.command}
                          </div>
                          {step.expected && (
                            <div className="text-sky-600 dark:text-sky-400">
                              [Expects: "{step.expected}"]
                            </div>
                          )}
                        </div>
                      )}

                      {/* Evaluation Scores (if they exist) */}
                      {step.evaluationScores && (
                        <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-[#ebdbb2]/20 dark:bg-black/25 rounded text-[9px] border border-[#d5c4a1]/40 dark:border-[#3c3836]/40">
                          <div>
                            <span className="text-[#7c6f64] dark:text-[#a89984] block font-semibold">Correctness</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{step.evaluationScores.correctness}/100</span>
                          </div>
                          <div>
                            <span className="text-[#7c6f64] dark:text-[#a89984] block font-semibold">Reliability</span>
                            <span className="font-bold text-sky-600 dark:text-sky-400">{step.evaluationScores.reliability}/100</span>
                          </div>
                          <div>
                            <span className="text-[#7c6f64] dark:text-[#a89984] block font-semibold">Security</span>
                            <span className="font-bold text-red-600 dark:text-rose-400">{step.evaluationScores.security}/100</span>
                          </div>
                          <div>
                            <span className="text-[#7c6f64] dark:text-[#a89984] block font-semibold">Performance</span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">{step.evaluationScores.performance}/100</span>
                          </div>
                        </div>
                      )}

                      {/* Outputs / Logs */}
                      {(step.stdout || step.stderr) && (
                        <div className="text-[10px] bg-[#1d2021] text-[#fbf1c7] p-2.5 rounded font-mono space-y-1.5 max-h-[140px] overflow-y-auto">
                          {step.stdout && (
                            <div>
                              <div className="text-emerald-400 font-bold border-b border-emerald-500/20 pb-0.5 mb-1">STDOUT</div>
                              <pre className="whitespace-pre-wrap">{step.stdout}</pre>
                            </div>
                          )}
                          {step.stderr && (
                            <div>
                              <div className="text-rose-400 font-bold border-b border-rose-500/20 pb-0.5 mb-1 mt-1">STDERR</div>
                              <pre className="whitespace-pre-wrap text-rose-300">{step.stderr}</pre>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Step Errors */}
                      {step.error && (
                        <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded text-[10px] text-rose-700 dark:text-rose-400 flex items-start gap-1.5 font-sans">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{step.error}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Loop Failures, Evidence and Self-Repair Track */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Evidence Logs */}
                <div className="p-3.5 rounded-lg bg-[#ebdbb2]/30 dark:bg-[#282828]/30 border border-[#d5c4a1] dark:border-[#3c3836] flex flex-col min-h-[150px]">
                  <div className="font-bold text-[10px] uppercase text-[#7c6f64] dark:text-[#a89984] tracking-wider pb-1.5 border-b border-[#d5c4a1] dark:border-[#3c3836] mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Evidence Logs & Timeline</span>
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-[180px] flex-1 pr-1 text-[11px] leading-relaxed">
                    {selectedObjective.evidence.map((ev, i) => (
                      <div key={i} className="p-1 rounded bg-[#ebdbb2]/20 dark:bg-[#1d2021]/30 border border-[#d5c4a1]/50 dark:border-[#3c3836]/50">
                        • {ev}
                      </div>
                    ))}
                    {selectedObjective.evidence.length === 0 && (
                      <div className="text-center text-[#928374] italic py-8">
                        No execution logs recorded yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Failures & Self-Repair Actions */}
                <div className="p-3.5 rounded-lg bg-[#ebdbb2]/30 dark:bg-[#282828]/30 border border-[#d5c4a1] dark:border-[#3c3836] flex flex-col min-h-[150px]">
                  <div className="font-bold text-[10px] uppercase text-[#7c6f64] dark:text-[#a89984] tracking-wider pb-1.5 border-b border-[#d5c4a1] dark:border-[#3c3836] mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-rose-500" />
                      <span>Self-Repair Registry</span>
                    </div>
                    {selectedObjective.recoveryAttempts > 0 && (
                      <span className="text-[10px] font-bold text-[#b57614] dark:text-[#fabd2f]">
                        Attempt {selectedObjective.recoveryAttempts}/{selectedObjective.maxRecoveryAttempts}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-[180px] flex-1 pr-1 text-[11px] leading-relaxed">
                    {selectedObjective.failures.map((fail, i) => (
                      <div key={i} className="p-1.5 rounded bg-rose-500/5 border border-rose-500/20 text-rose-700 dark:text-rose-400">
                        ⚡ {fail}
                      </div>
                    ))}
                    {selectedObjective.failures.length === 0 && (
                      <div className="text-center text-[#928374] italic py-8">
                        Zero loop failures detected. Excellent.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 rounded-lg bg-[#ebdbb2]/30 dark:bg-[#282828]/30 border border-[#d5c4a1] dark:border-[#3c3836] flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
              <Target className="w-12 h-12 text-[#d5c4a1] dark:text-[#3c3836] mb-3 animate-pulse" />
              <h3 className="font-bold text-sm mb-1 text-[#3c3836] dark:text-[#ebdbb2]">
                Select an Objective
              </h3>
              <p className="text-[11px] text-[#7c6f64] dark:text-[#a89984] max-w-sm leading-relaxed">
                Choose an active objective from the left panel to inspect its execution steps, real-time sandboxed logs, security scan evidence, and self-healing logs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
