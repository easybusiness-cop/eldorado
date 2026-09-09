import React, { useState } from 'react';
import { Agent, FleetTask } from '../types';
import { Shield, Target, Briefcase, Zap, ChevronDown, ChevronUp, MessageSquare, Terminal, UserCheck, Activity, Sparkles } from 'lucide-react';
import { getAgentThroughputTier, formatTokenThroughput } from './FleetHealthMonitor';

interface DepartmentHubViewProps {
  departmentName: string;
  departmentKey: string;
  departmentColor: string;
  departmentSymbol: string;
  agents: Agent[];
  tasks: FleetTask[];
  onSelectAgent: (id: string) => void;
  onOpenAgentDetail: (id: string) => void;
  onExecutePrompt: (prompt: string) => void;
  onBackToOverview: () => void;
  onTaskCompleted?: (task: FleetTask) => void;
  onLogMessage?: (msg: string, level?: 'info' | 'success' | 'warn') => void;
}

const DEPARTMENT_METADATA: Record<string, {
  tagline: string;
  leadRole: string;
  defaultLeadName: string;
  securityClearance: string;
  priorities: { title: string; desc: string; metric: string }[];
}> = {
  executive: {
    tagline: 'Strategic vision, fleet resource coordination, and cross-functional governance.',
    leadRole: 'Chief Executive Officer',
    defaultLeadName: 'Michael G. Scott',
    securityClearance: 'TOP SECRET / LEVEL 5',
    priorities: [
      { title: 'Fleet Autonomous Scaling', desc: 'Maintain 99.8% fleet uptime and eliminate operational bottlenecks.', metric: '99.8% Uptime' },
      { title: 'Enterprise ROI & Output', desc: 'Optimize token utilization per completed operational mission.', metric: '1.4M Tokens/Day' },
      { title: 'Zero-Trust Protocol', desc: 'Enforce dual-key executive authorization on production writes.', metric: 'Enforced' },
    ],
  },
  engineering: {
    tagline: 'High-performance agent runtime, full-stack microservices, and system patches.',
    leadRole: 'Chief Technology Officer',
    defaultLeadName: 'Ruflo',
    securityClearance: 'RESTRICTED / LEVEL 4',
    priorities: [
      { title: 'Dynamic Sandbox VM', desc: 'Sandboxed code execution and hot-patch deployment.', metric: '0 Stalls' },
      { title: 'Mastra Multi-Agent Mesh', desc: 'Low-latency agent-to-agent intercommunication bus.', metric: '14ms Avg' },
      { title: 'Continuous Telemetry', desc: 'Real-time heartbeat monitoring and self-healing memory sweeps.', metric: 'Active' },
    ],
  },
  security: {
    tagline: 'Zero-trust perimeter defense, SIEM intrusion prevention, and credential vaults.',
    leadRole: 'Chief Information Security Officer',
    defaultLeadName: 'Dwight Schrute',
    securityClearance: 'TOP SECRET / LEVEL 5',
    priorities: [
      { title: 'Perimeter Integrity', desc: 'Continuous threat scans across network sockets and endpoints.', metric: '0 Breaches' },
      { title: 'Role-Based Access Control', desc: 'Strict verification of agent permissions prior to task execution.', metric: '100% Audited' },
      { title: 'Automated Quarantine', desc: 'Instant isolation of any anomalous subprocess or token spikes.', metric: 'Automated' },
    ],
  },
  marketing: {
    tagline: 'Growth funnels, partner integrations, social plugins, and outreach campaigns.',
    leadRole: 'Head of Growth & Outreach',
    defaultLeadName: 'Jim Halpert',
    securityClearance: 'CONFIDENTIAL / LEVEL 3',
    priorities: [
      { title: 'Multi-Channel Distribution', desc: 'Automated syndication via Instagram & LinkedIn plugins.', metric: 'Live Connected' },
      { title: 'Conversion Attribution', desc: 'Precision tracking of user acquisition and inbound hooks.', metric: '+24.7% MoM' },
      { title: 'Brand Alignment', desc: 'Tone governance and sentiment analysis on public messaging.', metric: 'Optimal' },
    ],
  },
  operations: {
    tagline: 'Logistics orchestration, memo backlogs, task dispatch, and office automation.',
    leadRole: 'Chief Operating Officer',
    defaultLeadName: 'Pam Beesly',
    securityClearance: 'CONFIDENTIAL / LEVEL 3',
    priorities: [
      { title: 'Queue Decongestion', desc: 'Real-time task dispatching based on agent idle capacity.', metric: '94% Assigned' },
      { title: 'Inter-Department Sync', desc: 'Automated hourly standups and synchronized knowledge notes.', metric: 'Hourly' },
      { title: 'Document Digitization', desc: 'Google Workspace sync for docs, sheets, and calendars.', metric: 'Synced' },
    ],
  },
  finance: {
    tagline: 'Budget enforcement, compute expense auditing, and P&L ledger accounting.',
    leadRole: 'Chief Financial Officer',
    defaultLeadName: 'Kevin Malone',
    securityClearance: 'CONFIDENTIAL / LEVEL 4',
    priorities: [
      { title: 'API Spend Auditing', desc: 'Enforce hard caps on third-party model inference costs.', metric: '<$0.002/req' },
      { title: 'Runway Projection', desc: 'Predictive modeling of operating cash flow and fleet overhead.', metric: '18 Months' },
      { title: 'Ledger Reconciliation', desc: 'Automated reconciliation of token usage against business value.', metric: 'Balanced' },
    ],
  },
  research: {
    tagline: 'Deep research queries, open-source repository ingestion, and paper synthesis.',
    leadRole: 'Principal Research Scientist',
    defaultLeadName: 'Stanley Hudson',
    securityClearance: 'RESTRICTED / LEVEL 4',
    priorities: [
      { title: 'Paper Analysis Pipeline', desc: 'Autonomous scraping and summarization of new AI architectures.', metric: '12 Digested' },
      { title: 'Benchmark Novelty Index', desc: 'Benchmarking fleet reasoning against frontier models.', metric: 'Benchmarked' },
      { title: 'Knowledge Vectorization', desc: 'Embedding synthesis into company-wide semantic memory.', metric: 'Indexed' },
    ],
  },
};

export const DepartmentHubView: React.FC<DepartmentHubViewProps> = ({
  departmentName,
  departmentKey,
  departmentColor,
  departmentSymbol,
  agents,
  tasks,
  onSelectAgent,
  onOpenAgentDetail,
  onExecutePrompt,
  onBackToOverview,
  onTaskCompleted,
  onLogMessage,
}) => {
  const [showRoster, setShowRoster] = useState<boolean>(false);
  const meta = DEPARTMENT_METADATA[departmentKey] || {
    tagline: 'Autonomous operations and mission fulfillment for this business unit.',
    leadRole: 'Department Lead',
    defaultLeadName: 'Assigned Lead',
    securityClearance: 'INTERNAL / LEVEL 2',
    priorities: [
      { title: 'Mission Execution', desc: 'Complete prioritized tasks with verified output.', metric: 'Active' },
      { title: 'Resource Efficiency', desc: 'Maximize autonomous throughput within allocated limits.', metric: 'Optimal' },
    ],
  };

  const departmentAgents = agents.filter((a) => a.department === departmentKey);
  const leadAgent = departmentAgents[0] || agents[0];
  const departmentTasks = tasks.filter((t) =>
    departmentAgents.some((a) => a.id === t.assignedTo) || t.assignedTo === departmentKey
  );

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Department Banner */}
      <div
        className="rounded-2xl p-5 border relative overflow-hidden shadow-lg"
        style={{
          backgroundColor: '#161618',
          borderColor: `${departmentColor}33`,
        }}
      >
        <div
          className="absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ backgroundColor: departmentColor }}
        />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold border"
              style={{
                backgroundColor: `${departmentColor}15`,
                color: departmentColor,
                borderColor: `${departmentColor}44`,
              }}
            >
              {departmentSymbol}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  Business Unit
                </span>
                <span className="text-neutral-600">/</span>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded border"
                  style={{
                    backgroundColor: `${departmentColor}10`,
                    borderColor: `${departmentColor}30`,
                    color: departmentColor,
                  }}
                >
                  {meta.securityClearance}
                </span>
              </div>
              <h1 className="text-xl font-bold text-white mt-0.5">{departmentName} Department</h1>
              <p className="text-xs text-neutral-400 mt-0.5 max-w-xl">{meta.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToOverview}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700 transition"
            >
              ← All Departments
            </button>
            <button
              onClick={() => onExecutePrompt(`Generate strategic sprint plan for ${departmentName} department.`)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-900 shadow transition flex items-center gap-1.5"
              style={{ backgroundColor: departmentColor }}
            >
              <Zap className="w-3.5 h-3.5" />
              Dispatch Objective
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Department Lead & Department Key Initiatives */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Department Lead Card */}
        <div className="rounded-xl p-4 border bg-neutral-900/60 border-neutral-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-3">
              <span className="flex items-center gap-1.5 font-mono">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                DEPARTMENT LEAD
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </div>

            {leadAgent && (
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center text-lg font-bold text-white shadow-inner"
                  style={{ backgroundColor: departmentColor }}
                >
                  {leadAgent.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white truncate">{leadAgent.name}</div>
                  <div className="text-xs text-neutral-400 truncate">{leadAgent.role}</div>
                </div>
              </div>
            )}

            <div className="mt-3.5 p-2.5 rounded-lg bg-black/40 border border-neutral-800/80 text-[11px] text-neutral-300">
              <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wide">Current Focus</div>
              <div className="mt-0.5 truncate">{leadAgent?.currentTask || 'Leading department sprint directives'}</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center gap-2">
            <button
              onClick={() => {
                if (leadAgent) {
                  onSelectAgent(leadAgent.id);
                  onOpenAgentDetail(leadAgent.id);
                }
              }}
              className="flex-1 py-1.5 px-2.5 rounded text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/60 transition text-center"
            >
              Lead Profile
            </button>
            <button
              onClick={() => {
                onExecutePrompt(`Brief ${leadAgent ? leadAgent.name : departmentName + ' Lead'} on active priority.`);
              }}
              className="py-1.5 px-3 rounded text-xs font-medium text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-700/40 transition flex items-center gap-1"
            >
              <MessageSquare className="w-3 h-3" />
              Direct Ping
            </button>
          </div>
        </div>

        {/* Strategic Priorities */}
        <div className="md:col-span-2 rounded-xl p-4 border bg-neutral-900/60 border-neutral-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-3">
              <span className="flex items-center gap-1.5 font-mono">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                DEPARTMENT STRATEGIC PRIORITIES
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">Q3 SPRINT</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {meta.priorities.map((pri, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-black/30 border border-neutral-800/80 flex flex-col justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-neutral-200 mb-1">{pri.title}</div>
                    <div className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">{pri.desc}</div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-neutral-800/60 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-500">Benchmark</span>
                    <span
                      className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${departmentColor}15`,
                        color: departmentColor,
                      }}
                    >
                      {pri.metric}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 text-[11px] text-neutral-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Autonomous execution mesh running continuously.
            </span>
            <span className="font-mono text-neutral-500">
              {departmentAgents.length} {departmentAgents.length === 1 ? 'specialist' : 'specialists'} in fleet
            </span>
          </div>
        </div>
      </div>



      {/* Active Department Projects & Missions */}
      <div className="rounded-xl p-4 border bg-neutral-900/60 border-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Active Missions & Directives</h3>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            {departmentTasks.length} {departmentTasks.length === 1 ? 'active task' : 'active tasks'}
          </span>
        </div>

        {departmentTasks.length === 0 ? (
          <div className="py-6 px-4 text-center rounded-lg bg-black/20 border border-neutral-800/60">
            <p className="text-xs text-neutral-400">
              No pending missions assigned directly to {departmentName}.
            </p>
            <button
              onClick={() => onExecutePrompt(`Assign new operational task to ${departmentName} team.`)}
              className="mt-2 text-xs text-cyan-400 hover:underline"
            >
              + Create Department Task
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {departmentTasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-lg bg-black/30 border border-neutral-800/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-neutral-200 truncate">{task.title}</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase ${
                        task.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : (task.status as string) === 'in_progress' || (task.status as string) === 'running'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                          : 'bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 line-clamp-1">{task.description}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                  <span>Priority: {task.priority}</span>
                  <span>Assigned: {agents.find((a) => a.id === task.assignedTo)?.name || 'Team'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Roster Section: Hidden by default! Only revealed if user explicitly clicks to toggle! */}
      <div className="rounded-xl border bg-neutral-900/40 border-neutral-800/80 overflow-hidden">
        <button
          onClick={() => setShowRoster(!showRoster)}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-neutral-800/40 transition"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium text-neutral-300">
              Department Assigned Personnel
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
              {departmentAgents.length} Agents
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-neutral-400">
            <span>{showRoster ? 'Hide Personnel List' : 'View Personnel List'}</span>
            {showRoster ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showRoster && (
          <div className="p-4 pt-0 border-t border-neutral-800/60 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3">
              {departmentAgents.map((agent) => {
                const isWorking = agent.status === 'working' || agent.status === 'thinking';
                const tier = getAgentThroughputTier(agent, isWorking);
                const formattedTokens = formatTokenThroughput(agent.tokensProcessed || 0);

                return (
                  <div
                    key={agent.id}
                    onClick={() => {
                      onSelectAgent(agent.id);
                      onOpenAgentDetail(agent.id);
                    }}
                    className="p-2.5 rounded-lg bg-black/40 border border-neutral-800 hover:border-neutral-700 transition cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: departmentColor }}
                      >
                        {agent.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-white truncate">{agent.name}</div>
                        <div className="text-[10px] text-neutral-400 truncate">{agent.role}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-mono text-neutral-400">{formattedTokens}/s</div>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isWorking ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                          }`}
                        />
                        <span className="text-[9px] font-mono text-neutral-500 uppercase">{agent.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
