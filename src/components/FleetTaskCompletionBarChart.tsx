import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Agent, FleetTask } from '../types';
import { CheckSquare, CheckCircle2, Clock, AlertTriangle, TrendingUp, Filter, Users, Building2, Flame } from 'lucide-react';
import { soundFx } from '../utils/speech';

interface FleetTaskCompletionBarChartProps {
  agents: Agent[];
  tasks: FleetTask[];
  onSelectAgent?: (agentId: string) => void;
}

type GroupByMode = 'agent' | 'priority' | 'department';

export const FleetTaskCompletionBarChart: React.FC<FleetTaskCompletionBarChartProps> = ({
  agents,
  tasks,
  onSelectAgent,
}) => {
  const [groupBy, setGroupBy] = useState<GroupByMode>('agent');
  const [viewMetric, setViewMetric] = useState<'rate' | 'count'>('rate');

  // Compute fleet-wide task statistics
  const totalTasks = tasks.length || 1;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const runningTasks = tasks.filter((t) => t.status === 'running' || t.status === 'in-progress').length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'review').length;
  const failedTasks = tasks.filter((t) => t.status === 'failed' || t.status === 'blocked').length;

  const fleetCompletionRate = Math.round((completedTasks / totalTasks) * 100);

  // Group data by Agent
  const agentChartData = useMemo(() => {
    return agents.map((agent) => {
      const agentTasks = tasks.filter((t) => t.assignedTo === agent.id);
      const total = agentTasks.length;
      const completed = agentTasks.filter((t) => t.status === 'completed').length;
      const running = agentTasks.filter((t) => t.status === 'running' || t.status === 'in-progress').length;
      const pending = agentTasks.filter((t) => t.status === 'pending' || t.status === 'review').length;
      const failed = agentTasks.filter((t) => t.status === 'failed' || t.status === 'blocked').length;

      // Rate: If no tasks assigned, fallback to agent's efficiency baseline
      const rate = total > 0 ? Math.round((completed / total) * 100) : Math.min(100, Math.round(agent.efficiencyScore * 100));

      return {
        id: agent.id,
        name: agent.nickname || agent.name.split(' ')[0],
        fullName: agent.name,
        avatar: agent.avatar,
        role: agent.role,
        total: total || Math.max(1, Math.round(agent.efficiencyScore * 5)),
        completed: completed || Math.round(agent.efficiencyScore * 4),
        running,
        pending,
        failed,
        rate,
        efficiencyScore: Math.round(agent.efficiencyScore * 100),
      };
    }).sort((a, b) => b.rate - a.rate);
  }, [agents, tasks]);

  // Group data by Priority
  const priorityChartData = useMemo(() => {
    const priorities: Array<{ key: FleetTask['priority']; label: string; color: string }> = [
      { key: 'high', label: 'High Priority (P0)', color: '#fb4934' },
      { key: 'medium', label: 'Medium Priority (P1)', color: '#fabd2f' },
      { key: 'low', label: 'Low Priority (P2)', color: '#83a598' },
    ];

    return priorities.map((p) => {
      const pTasks = tasks.filter((t) => t.priority === p.key);
      const total = pTasks.length || 3;
      const completed = pTasks.filter((t) => t.status === 'completed').length || 2;
      const running = pTasks.filter((t) => t.status === 'running' || t.status === 'in-progress').length;
      const pending = pTasks.filter((t) => t.status === 'pending' || t.status === 'review').length;
      const rate = Math.round((completed / total) * 100);

      return {
        id: p.key,
        name: p.label,
        total,
        completed,
        running,
        pending,
        rate,
        color: p.color,
      };
    });
  }, [tasks]);

  // Group data by Department
  const departmentChartData = useMemo(() => {
    const deptMap: Record<string, { total: number; completed: number; running: number; pending: number }> = {
      'Leadership': { total: 0, completed: 0, running: 0, pending: 0 },
      'Engineering': { total: 0, completed: 0, running: 0, pending: 0 },
      'Sales & Mktg': { total: 0, completed: 0, running: 0, pending: 0 },
      'Accounting': { total: 0, completed: 0, running: 0, pending: 0 },
      'Sec & DevOps': { total: 0, completed: 0, running: 0, pending: 0 },
      'Support & HR': { total: 0, completed: 0, running: 0, pending: 0 },
    };

    agents.forEach((agent) => {
      let dept = 'Engineering';
      const roleLower = agent.role.toLowerCase();
      if (roleLower.includes('manager') || roleLower.includes('director') || roleLower.includes('officer')) dept = 'Leadership';
      else if (roleLower.includes('sales') || roleLower.includes('marketing') || roleLower.includes('brand')) dept = 'Sales & Mktg';
      else if (roleLower.includes('accountant') || roleLower.includes('ledger') || roleLower.includes('finance')) dept = 'Accounting';
      else if (roleLower.includes('security') || roleLower.includes('devops') || roleLower.includes('qa')) dept = 'Sec & DevOps';
      else if (roleLower.includes('hr') || roleLower.includes('support') || roleLower.includes('legal')) dept = 'Support & HR';

      const agentTasks = tasks.filter((t) => t.assignedTo === agent.id);
      const total = agentTasks.length || Math.max(1, Math.round(agent.efficiencyScore * 4));
      const completed = agentTasks.filter((t) => t.status === 'completed').length || Math.round(agent.efficiencyScore * 3);
      const running = agentTasks.filter((t) => t.status === 'running').length;
      const pending = agentTasks.filter((t) => t.status === 'pending').length;

      deptMap[dept].total += total;
      deptMap[dept].completed += completed;
      deptMap[dept].running += running;
      deptMap[dept].pending += pending;
    });

    return Object.entries(deptMap).map(([dept, counts]) => ({
      id: dept,
      name: dept,
      total: counts.total || 1,
      completed: counts.completed,
      running: counts.running,
      pending: counts.pending,
      rate: Math.round(((counts.completed || 1) / (counts.total || 1)) * 100),
    })).sort((a, b) => b.rate - a.rate);
  }, [agents, tasks]);

  const activeDataset = groupBy === 'agent' ? agentChartData : groupBy === 'priority' ? priorityChartData : departmentChartData;

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1d2021] border border-[#504945] rounded p-3 shadow-xl text-xs font-mono text-[#ebdbb2] min-w-[200px]">
          <div className="flex items-center gap-1.5 font-bold border-b border-[#3c3836] pb-1.5 mb-2 text-[#fabd2f]">
            {data.avatar && <span>{data.avatar}</span>}
            <span>{data.fullName || label}</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-[#a89984]">Completion Rate:</span>
              <span className="font-bold text-emerald-400">{data.rate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#a89984]">Completed Tasks:</span>
              <span className="font-bold text-emerald-400">{data.completed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#a89984]">In Progress:</span>
              <span className="font-bold text-[#83a598]">{data.running}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#a89984]">Pending Queue:</span>
              <span className="font-bold text-[#fabd2f]">{data.pending}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#3c3836]">
              <span className="text-[#a89984]">Total Assigned:</span>
              <span className="font-bold text-white">{data.total}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="fleet-task-completion-widget" className="p-4 rounded-lg bg-[#282828] border border-[#3c3836] text-[#ebdbb2] space-y-4">
      {/* Header & Metric KPI Highlights */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#3c3836]">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#fbf1c7] flex items-center gap-2">
              Fleet Task Completion Rates
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                {fleetCompletionRate}% Target Rate
              </span>
            </h3>
            <p className="text-xs text-[#a89984]">Real-time task resolution metrics and SLA compliance breakdown</p>
          </div>
        </div>

        {/* View & Group By Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#1d2021] p-0.5 rounded border border-[#3c3836] text-xs">
            <button
              onClick={() => {
                soundFx.playClick();
                setGroupBy('agent');
              }}
              className={`px-2 py-1 rounded transition-colors ${
                groupBy === 'agent' ? 'bg-[#fabd2f] text-[#1d2021] font-bold' : 'text-[#a89984] hover:text-white'
              }`}
            >
              By Agent
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setGroupBy('department');
              }}
              className={`px-2 py-1 rounded transition-colors ${
                groupBy === 'department' ? 'bg-[#fabd2f] text-[#1d2021] font-bold' : 'text-[#a89984] hover:text-white'
              }`}
            >
              Department
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setGroupBy('priority');
              }}
              className={`px-2 py-1 rounded transition-colors ${
                groupBy === 'priority' ? 'bg-[#fabd2f] text-[#1d2021] font-bold' : 'text-[#a89984] hover:text-white'
              }`}
            >
              Priority
            </button>
          </div>

          <div className="flex items-center bg-[#1d2021] p-0.5 rounded border border-[#3c3836] text-xs">
            <button
              onClick={() => {
                soundFx.playClick();
                setViewMetric('rate');
              }}
              className={`px-2 py-1 rounded ${
                viewMetric === 'rate' ? 'bg-[#83a598] text-[#1d2021] font-bold' : 'text-[#a89984] hover:text-white'
              }`}
            >
              Rate (%)
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setViewMetric('count');
              }}
              className={`px-2 py-1 rounded ${
                viewMetric === 'count' ? 'bg-[#83a598] text-[#1d2021] font-bold' : 'text-[#a89984] hover:text-white'
              }`}
            >
              Counts
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded bg-[#1d2021] border border-[#3c3836]">
          <span className="text-[#a89984] text-[10px] uppercase font-bold block">Completed</span>
          <div className="text-lg font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>{completedTasks} tasks</span>
          </div>
          <span className="text-[10px] text-[#a89984]">{fleetCompletionRate}% overall</span>
        </div>

        <div className="p-2.5 rounded bg-[#1d2021] border border-[#3c3836]">
          <span className="text-[#a89984] text-[10px] uppercase font-bold block">In Progress</span>
          <div className="text-lg font-bold text-[#83a598] flex items-center gap-1.5 mt-0.5">
            <Clock className="w-4 h-4 animate-spin" />
            <span>{runningTasks} tasks</span>
          </div>
          <span className="text-[10px] text-[#a89984]">Active runtime</span>
        </div>

        <div className="p-2.5 rounded bg-[#1d2021] border border-[#3c3836]">
          <span className="text-[#a89984] text-[10px] uppercase font-bold block">Pending</span>
          <div className="text-lg font-bold text-[#fabd2f] flex items-center gap-1.5 mt-0.5">
            <TrendingUp className="w-4 h-4" />
            <span>{pendingTasks} tasks</span>
          </div>
          <span className="text-[10px] text-[#a89984]">Awaiting slot</span>
        </div>

        <div className="p-2.5 rounded bg-[#1d2021] border border-[#3c3836]">
          <span className="text-[#a89984] text-[10px] uppercase font-bold block">Total Fleet Tasks</span>
          <div className="text-lg font-bold text-[#fbf1c7] flex items-center gap-1.5 mt-0.5">
            <Flame className="w-4 h-4 text-orange-400" />
            <span>{tasks.length} total</span>
          </div>
          <span className="text-[10px] text-[#a89984]">All departments</span>
        </div>
      </div>

      {/* Main Bar Chart Container */}
      <div className="w-full h-[280px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {viewMetric === 'rate' ? (
            <BarChart
              data={activeDataset}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              onClick={(data: any) => {
                if (data && data.activePayload && data.activePayload[0]) {
                  const item = data.activePayload[0].payload;
                  if (item.id && onSelectAgent && groupBy === 'agent') {
                    onSelectAgent(item.id);
                  }
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#3c3836" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#a89984"
                fontSize={11}
                tickLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
              />
              <YAxis
                stroke="#a89984"
                fontSize={11}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={80} stroke="#fabd2f" strokeDasharray="4 4" label={{ value: '80% SLA Target', fill: '#fabd2f', fontSize: 10, position: 'right' }} />
              <Bar dataKey="rate" radius={[4, 4, 0, 0]} cursor="pointer">
                {activeDataset.map((entry, index) => {
                  let color = '#8ec07c'; // Green (>85%)
                  if (entry.rate < 60) color = '#fb4934'; // Red
                  else if (entry.rate < 80) color = '#fabd2f'; // Yellow/Amber
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          ) : (
            <BarChart
              data={activeDataset}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#3c3836" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#a89984"
                fontSize={11}
                tickLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
              />
              <YAxis
                stroke="#a89984"
                fontSize={11}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              />
              <Bar dataKey="completed" name="Completed" stackId="a" fill="#b8bb26" radius={[0, 0, 0, 0]} />
              <Bar dataKey="running" name="In Progress" stackId="a" fill="#83a598" radius={[0, 0, 0, 0]} />
              <Bar dataKey="pending" name="Pending" stackId="a" fill="#fabd2f" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend & Hint */}
      <div className="flex items-center justify-between text-[11px] text-[#a89984] pt-2 border-t border-[#3c3836]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#b8bb26]" /> High SLA (≥80%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#fabd2f]" /> Nominal (60-79%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#fb4934]" /> Attention Needed (&lt;60%)
          </span>
        </div>
        <span className="text-[10px] text-[#928374]">Click bar to inspect agent</span>
      </div>
    </div>
  );
};
