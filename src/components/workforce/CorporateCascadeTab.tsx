import React, { useState, useEffect } from "react";
import {
  Crown,
  Briefcase,
  Users,
  Cpu,
  ArrowDown,
  Sparkles,
  Play,
  CheckCircle2,
  Clock,
  Code2,
  FileText,
  Search,
  Radio,
  Layers,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";

interface DepartmentTaskAllocation {
  taskId: string;
  department: string;
  hodName: string;
  hodRole: string;
  assignedAgentId: string;
  assignedAgentName: string;
  isDynamicEmployee: boolean;
  taskTitle: string;
  taskPrompt: string;
  requiredCapabilities: string[];
  status: "pending" | "running" | "completed" | "failed";
  output?: string;
  codeSnippet?: string;
  executionTimeMs?: number;
}

interface DepartmentMission {
  department: string;
  hodId: string;
  hodName: string;
  hodRole: string;
  strategicObjective: string;
  assignedTasks: DepartmentTaskAllocation[];
  status: "pending" | "delegating" | "executing" | "completed" | "failed";
  departmentSummary?: string;
}

interface CorporateCascadeRun {
  id: string;
  userCommand: string;
  startedAt: string;
  completedAt?: string;
  status: "initiated" | "ceo_directive" | "executive_breakdown" | "hod_delegation" | "employees_executing" | "completed" | "failed";
  ceoDirective: {
    agentId: string;
    agentName: string;
    speech: string;
    mandate: string;
    priority: "urgent" | "high" | "standard";
  };
  executivePlan: {
    agentId: string;
    agentName: string;
    analysis: string;
    activatedDepartments: string[];
  };
  departmentMissions: Record<string, DepartmentMission>;
  finalExecutiveBriefing?: string;
  ceoFinalResponse?: string;
  metrics: {
    totalDepartments: number;
    totalEmployeesInvolved: number;
    dynamicEmployeesSpawned: number;
    totalTasksExecuted: number;
    durationMs: number;
  };
}

export const CorporateCascadeTab: React.FC = () => {
  const [command, setCommand] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [currentRun, setCurrentRun] = useState<CorporateCascadeRun | null>(null);
  const [history, setHistory] = useState<CorporateCascadeRun[]>([]);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/autonomy/cascade/history");
      const data = await res.json();
      if (data.success && data.history) {
        setHistory(data.history);
        if (!currentRun && data.history.length > 0) {
          setCurrentRun(data.history[0]);
        }
      }
    } catch (e) {
      console.warn("Failed to load cascade history", e);
    }
  };

  const handleRunCascade = async (presetCmd?: string) => {
    const cmd = (presetCmd || command).trim();
    if (!cmd || isRunning) return;

    setCommand(cmd);
    setIsRunning(true);
    setLiveLogs([`[0.0s] 👑 User issued corporate directive to CEO: "${cmd}"`]);

    try {
      // Use SSE streaming endpoint for live progressive rendering
      const response = await fetch("/api/autonomy/cascade/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const lines = part.split("\n");
          let eventType = "";
          let dataStr = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              dataStr = line.slice(6).trim();
            }
          }

          if (eventType && dataStr) {
            try {
              const data = JSON.parse(dataStr);
              handleStreamEvent(eventType, data);
            } catch (e) {
              console.warn("Failed to parse event data", e);
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Cascade stream error:", err);
      setLiveLogs((prev) => [...prev, `❌ Error: ${err.message}`]);
    } finally {
      setIsRunning(false);
      fetchHistory();
    }
  };

  const handleStreamEvent = (type: string, data: any) => {
    switch (type) {
      case "start":
        setLiveLogs((prev) => [...prev, `[0.2s] ⚡ Executive chain mobilizing...`]);
        break;
      case "ceo_speaks":
        setLiveLogs((prev) => [
          ...prev,
          `[0.8s] 👑 CEO Michael Scott: "${data.ceoDirective?.speech?.slice(0, 80)}..."`,
          `[1.0s] 📜 Mandate dispatched to COO Dwight Schrute: "${data.ceoDirective?.mandate?.slice(0, 90)}..."`,
        ]);
        break;
      case "executive_analyzes":
        setLiveLogs((prev) => [
          ...prev,
          `[1.8s] 💼 COO Dwight Schrute analyzed mandate. Mobilizing departments: ${data.executivePlan?.activatedDepartments?.join(", ")}`,
        ]);
        break;
      case "hod_delegates":
        setLiveLogs((prev) => [
          ...prev,
          `[2.4s] 🏢 Head of ${data.department?.toUpperCase()} (${data.hodName}) formulated ${data.tasksCount} operational sub-tasks`,
        ]);
        break;
      case "employee_working":
        setLiveLogs((prev) => [
          ...prev,
          `[3.0s] ⚙️ [${data.department?.toUpperCase()}] ${data.employeeName} executing "${data.taskTitle}" in parallel...`,
        ]);
        break;
      case "employee_done":
        setLiveLogs((prev) => [
          ...prev,
          `[${(data.durationMs / 1000).toFixed(1)}s] ✅ [${data.department?.toUpperCase()}] ${data.employeeName} completed deliverable!`,
        ]);
        break;
      case "department_complete":
        setLiveLogs((prev) => [
          ...prev,
          `🏁 Department [${data.department?.toUpperCase()}] achieved 100% mission fulfillment!`,
        ]);
        break;
      case "complete":
        setLiveLogs((prev) => [
          ...prev,
          `🏆 Corporate Command Cascade complete in ${(data.metrics?.durationMs / 1000).toFixed(1)}s! Total departments: ${data.metrics?.totalDepartments}, Employees: ${data.metrics?.totalEmployeesInvolved} (${data.metrics?.dynamicEmployeesSpawned} dynamic specialists).`,
        ]);
        if (data.run) {
          setCurrentRun(data.run);
        }
        break;
      default:
        break;
    }
  };

  const presets = [
    "Build an automated market intelligence scraper and generate strategic marketing campaign",
    "Modernize backend microservices with vector caching and perform automated security audit",
    "Launch new customer onboarding portal with reactive UI components and QA telemetry benchmarks",
    "Scan competitive AI tooling breakthroughs and implement an autonomous optimization loop",
  ];

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-[#22201e] border border-[#363330] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-semibold text-[#dcd7ba] tracking-wide">
                Corporate Command Cascade Loop
              </h2>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                1-Command Hierarchical Automation
              </span>
            </div>
            <p className="text-xs text-[#a09a8a] max-w-2xl">
              Issue <strong>one single prompt to the CEO</strong>. The CEO commands the Executive (COO), who deconstructs the mission and dispatches orders to Department Heads (HODs). Each HOD assigns tasks to specialized employees who <strong>all work simultaneously in parallel</strong>, feeding deliverables back up the chain.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#a09a8a]">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181615] border border-[#2d2a27]">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Cross-Departmental</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181615] border border-[#2d2a27]">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Parallel Simultaneous Loop</span>
            </div>
          </div>
        </div>

        {/* COMMAND INPUT BOX */}
        <div className="mt-5 space-y-3">
          <div className="relative">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRunCascade()}
              placeholder="Give any strategic command to the CEO (e.g. 'Build a real-time competitor intelligence engine and launch marketing campaign')..."
              className="w-full bg-[#181615] border border-[#3d3a36] rounded-xl px-4 py-3.5 pr-32 text-sm text-[#dcd7ba] placeholder-[#6b6760] focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 font-mono transition-all"
            />
            <button
              onClick={() => handleRunCascade()}
              disabled={isRunning || !command.trim()}
              className="absolute right-2 top-2 bottom-2 px-4 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 text-white font-medium text-xs flex items-center gap-2 hover:from-amber-500 hover:to-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isRunning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Cascading...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Loop</span>
                </>
              )}
            </button>
          </div>

          {/* PRESETS */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-[#7a756c] font-medium">Quick Directives:</span>
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleRunCascade(preset)}
                disabled={isRunning}
                className="text-[11px] bg-[#181615] hover:bg-[#282522] border border-[#2d2a27] hover:border-amber-500/40 text-[#a09a8a] hover:text-[#dcd7ba] px-2.5 py-1 rounded-md transition-all text-left truncate max-w-xs"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LIVE PROGRESS STREAM LOG */}
      {isRunning && (
        <div className="bg-[#181615] border border-amber-500/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-400 font-mono font-medium">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>HIERARCHY CASCADE IN PROGRESS</span>
            </div>
            <span>Simultaneous Parallel Execution</span>
          </div>
          <div className="bg-[#121110] rounded-lg p-3 max-h-40 overflow-y-auto font-mono text-xs text-[#a09a8a] space-y-1">
            {liveLogs.map((log, i) => (
              <div key={i} className="text-[#c8c3b0]">{log}</div>
            ))}
          </div>
        </div>
      )}

      {/* RUN RESULTS & VISUAL FLOW */}
      {currentRun && (
        <div className="space-y-5">
          {/* METRICS STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#22201e] border border-[#363330] rounded-xl p-3.5">
              <div className="text-[11px] text-[#7a756c] font-medium">Command Directive</div>
              <div className="text-xs font-mono text-[#dcd7ba] font-medium truncate mt-0.5">
                "{currentRun.userCommand}"
              </div>
            </div>
            <div className="bg-[#22201e] border border-[#363330] rounded-xl p-3.5">
              <div className="text-[11px] text-[#7a756c] font-medium">Mobilized Departments</div>
              <div className="text-sm font-semibold text-blue-400 mt-0.5">
                {currentRun.metrics?.totalDepartments || Object.keys(currentRun.departmentMissions).length} Departments
              </div>
            </div>
            <div className="bg-[#22201e] border border-[#363330] rounded-xl p-3.5">
              <div className="text-[11px] text-[#7a756c] font-medium">Employees in Parallel</div>
              <div className="text-sm font-semibold text-emerald-400 mt-0.5">
                {currentRun.metrics?.totalEmployeesInvolved || 0} Specialists ({currentRun.metrics?.dynamicEmployeesSpawned || 0} dynamically spawned)
              </div>
            </div>
            <div className="bg-[#22201e] border border-[#363330] rounded-xl p-3.5">
              <div className="text-[11px] text-[#7a756c] font-medium">Execution Benchmark</div>
              <div className="text-sm font-semibold text-amber-400 mt-0.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {((currentRun.metrics?.durationMs || 0) / 1000).toFixed(1)}s
              </div>
            </div>
          </div>

          {/* TIER 1: CEO SPEECH & MANDATE */}
          <div className="bg-gradient-to-r from-[#262117] to-[#22201e] border border-amber-500/30 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Tier 1: Chief Executive Officer</div>
                  <div className="text-sm font-medium text-[#dcd7ba]">{currentRun.ceoDirective.agentName}</div>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase font-semibold">
                Priority: {currentRun.ceoDirective.priority}
              </span>
            </div>
            <div className="bg-[#181615] rounded-lg p-3.5 border border-[#2d2a27] text-xs text-[#dcd7ba] leading-relaxed italic">
              "{currentRun.ceoDirective.speech}"
            </div>
            <div className="text-xs text-[#a09a8a] flex items-center gap-2">
              <span className="font-semibold text-amber-400/80">Executive Mandate Dispatched:</span>
              <span className="font-mono text-[#c8c3b0]">{currentRun.ceoDirective.mandate}</span>
            </div>
          </div>

          {/* CONNECTOR */}
          <div className="flex justify-center -my-2">
            <div className="w-6 h-6 rounded-full bg-[#2d2a27] border border-[#3d3a36] flex items-center justify-center text-amber-400 shadow-sm">
              <ArrowDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* TIER 2: EXECUTIVE (COO) STRATEGIC BREAKDOWN */}
          <div className="bg-[#22201e] border border-blue-500/30 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Tier 2: Executive Office & COO</div>
                  <div className="text-sm font-medium text-[#dcd7ba]">{currentRun.executivePlan.agentName}</div>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {currentRun.executivePlan.activatedDepartments?.length || 0} Departments Mobilized
              </span>
            </div>
            <div className="bg-[#181615] rounded-lg p-3.5 border border-[#2d2a27] text-xs text-[#a09a8a] leading-relaxed">
              <strong className="text-blue-300">Strategic Deconstruction: </strong>
              {currentRun.executivePlan.analysis}
            </div>
          </div>

          {/* CONNECTOR */}
          <div className="flex justify-center -my-2">
            <div className="w-6 h-6 rounded-full bg-[#2d2a27] border border-[#3d3a36] flex items-center justify-center text-blue-400 shadow-sm">
              <ArrowDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* TIER 3 & 4: DEPARTMENT MISSIONS & SIMULTANEOUS EMPLOYEES */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#a09a8a] flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Tier 3 & 4: Department HODs & Simultaneous Parallel Employees</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Concurrently Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.values(currentRun.departmentMissions) as DepartmentMission[]).map((mission, idx) => (
                <div
                  key={idx}
                  className="bg-[#22201e] border border-[#363330] rounded-xl p-4 space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {/* HOD HEADER */}
                    <div className="flex items-center justify-between pb-2 border-b border-[#2d2a27]">
                      <div>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#181615] text-[#a09a8a] border border-[#2d2a27]">
                          {mission.department}
                        </span>
                        <h3 className="text-xs font-semibold text-[#dcd7ba] mt-1">
                          {mission.hodName} <span className="text-[#7a756c] font-normal">({mission.hodRole})</span>
                        </h3>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    </div>

                    <div className="text-xs text-[#a09a8a] leading-relaxed">
                      <span className="text-[#7a756c]">Objective: </span>
                      {mission.strategicObjective}
                    </div>

                    {/* ASSIGNED EMPLOYEES IN THIS DEPARTMENT */}
                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-medium text-[#7a756c]">Sub-Tasks & Assigned Specialists:</div>
                      {mission.assignedTasks.map((task) => (
                        <div
                          key={task.taskId}
                          className="bg-[#181615] border border-[#2d2a27] rounded-lg p-3 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-[#dcd7ba] flex items-center gap-2">
                              <span>{task.taskTitle}</span>
                              {task.isDynamicEmployee && (
                                <span className="text-[9px] font-mono bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                                  Dynamic Specialist
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#7a756c] font-mono">
                              {task.executionTimeMs ? `${(task.executionTimeMs / 1000).toFixed(1)}s` : "done"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-[#a09a8a]">
                            <span>Assigned to: <strong className="text-[#c8c3b0]">{task.assignedAgentName}</strong></span>
                            <button
                              onClick={() => setExpandedTask(expandedTask === task.taskId ? null : task.taskId)}
                              className="text-amber-400 hover:text-amber-300 underline text-[11px]"
                            >
                              {expandedTask === task.taskId ? "Hide Output" : "View Output"}
                            </button>
                          </div>

                          {/* EXPANDED DELIVERABLE */}
                          {expandedTask === task.taskId && (
                            <div className="mt-2 pt-2 border-t border-[#262422] space-y-2">
                              <div className="text-[11px] text-[#c8c3b0] whitespace-pre-line bg-[#121110] p-2.5 rounded font-mono max-h-48 overflow-y-auto leading-relaxed">
                                {task.output}
                              </div>
                              {task.codeSnippet && (
                                <div className="space-y-1">
                                  <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                                    <Code2 className="w-3 h-3" />
                                    <span>Generated System Code Snippet</span>
                                  </div>
                                  <pre className="bg-[#121110] border border-emerald-500/20 rounded p-2 text-[10px] text-emerald-300 font-mono overflow-x-auto">
                                    {task.codeSnippet}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-[11px] text-[#7a756c] italic pt-2 border-t border-[#2d2a27]">
                    {mission.departmentSummary}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FINAL CEO DEBRIEF */}
          {currentRun.ceoFinalResponse && (
            <div className="bg-[#1c1a18] border border-amber-500/40 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                <Crown className="w-4 h-4" />
                <span>Executive Delivery & Response to User</span>
              </div>
              <div className="text-xs text-[#dcd7ba] leading-relaxed whitespace-pre-line font-mono bg-[#141312] p-4 rounded-lg border border-[#2d2a27]">
                {currentRun.ceoFinalResponse}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PAST RUNS HISTORY */}
      {history.length > 1 && (
        <div className="space-y-3 pt-4 border-t border-[#2d2a27]">
          <div className="text-xs font-semibold text-[#a09a8a] uppercase tracking-wider">
            Previous Cascade Executions ({history.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {history.slice(1, 5).map((run) => (
              <button
                key={run.id}
                onClick={() => setCurrentRun(run)}
                className={`text-left p-3 rounded-lg border transition-all text-xs ${
                  currentRun?.id === run.id
                    ? "bg-[#22201e] border-amber-500/50 text-[#dcd7ba]"
                    : "bg-[#181615] border-[#2d2a27] text-[#a09a8a] hover:border-[#3d3a36]"
                }`}
              >
                <div className="font-medium text-[#dcd7ba] truncate">"{run.userCommand}"</div>
                <div className="text-[11px] text-[#7a756c] mt-1 flex items-center justify-between font-mono">
                  <span>{run.metrics?.totalDepartments || 0} Depts · {run.metrics?.totalTasksExecuted || 0} Tasks</span>
                  <span>{((run.metrics?.durationMs || 0) / 1000).toFixed(1)}s</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
