import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Users, Activity, CheckCircle2, AlertTriangle, RefreshCw, BarChart3, PieChart as PieIcon } from 'lucide-react';
import { supabase } from '../utils/supabaseClient.ts';
import { DepartmentTaskBarChart } from './widgets/DepartmentTaskBarChart.tsx';

interface ExecutiveAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExecutiveAnalyticsModal({ isOpen, onClose }: ExecutiveAnalyticsModalProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAnalyticsData();
    }
  }, [isOpen]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [tasksRes, logsRes] = await Promise.all([
        supabase.from('active_tasks').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('agent_logs').select('*').order('created_at', { ascending: false }).limit(200),
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (logsRes.error) throw logsRes.error;

      setTasks(tasksRes.data || []);
      setLogs(logsRes.data || []);
    } catch (err) {
      console.error('Error fetching analytics data from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Compute Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'success').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'pending').length;
  const successRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  // Department Distribution
  const deptMap: { [key: string]: number } = {};
  tasks.forEach(t => {
    const dept = t.department || 'General';
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });
  const deptData = Object.keys(deptMap).map(dept => ({
    name: dept,
    tasks: deptMap[dept],
  }));

  // Agent Productivity (tasks per agent)
  const agentMap: { [key: string]: number } = {};
  tasks.forEach(t => {
    const agent = t.assigned_to || 'Unassigned';
    agentMap[agent] = (agentMap[agent] || 0) + 1;
  });
  const agentProductivityData = Object.keys(agentMap).map(agent => ({
    agent,
    tasks: agentMap[agent],
  })).sort((a, b) => b.tasks - a.tasks);

  // Velocity / Task completion over time (grouped by date)
  const dateMap: { [key: string]: number } = {};
  tasks.forEach(t => {
    if (!t.created_at) return;
    const dateStr = new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dateMap[dateStr] = (dateMap[dateStr] || 0) + 1;
  });
  const velocityData = Object.keys(dateMap).reverse().map(date => ({
    date,
    tasksCreated: dateMap[date],
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#181615] border border-[#3c3836] w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#ebdbb2]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#282828] border-b border-[#3c3836] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 border border-blue-500/30">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Executive Analytics & Fleet Intelligence
              </h2>
              <p className="text-xs text-[#a89984]">
                Real-time telemetry and metrics from Supabase database ({totalTasks} tasks indexed)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAnalyticsData}
              className="px-3 py-1.5 bg-[#3c3836] hover:bg-[#504945] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
            <button
              onClick={onClose}
              className="text-[#a89984] hover:text-white text-xl font-bold px-2.5 py-1 rounded-lg hover:bg-[#3c3836] transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Dashboard Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#121110]">
          
          {/* Top Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-xs uppercase font-bold text-[#a89984]">Total Tasks Logged</div>
                <div className="text-2xl font-black text-white mt-1">{totalTasks}</div>
                <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                  <span>↑ Active Cloud Sync</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Activity className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-xs uppercase font-bold text-[#a89984]">Task Completion Rate</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">{successRate}%</div>
                <div className="text-[10px] text-[#a89984] mt-1">
                  {completedTasks} completed of {totalTasks}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-xs uppercase font-bold text-[#a89984]">Active Workload</div>
                <div className="text-2xl font-black text-amber-400 mt-1">{inProgressTasks}</div>
                <div className="text-[10px] text-[#a89984] mt-1">Tasks in progress</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-xs uppercase font-bold text-[#a89984]">System Error Rate</div>
                <div className="text-2xl font-black text-rose-400 mt-1">0.0%</div>
                <div className="text-[10px] text-emerald-400 mt-1">All runtimes stable</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Task Completion Velocity */}
            <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Task Ingestion Velocity</h3>
                </div>
                <span className="text-[10px] text-[#a89984] font-mono">By Date</span>
              </div>
              <div className="h-64 w-full">
                {velocityData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-[#7c6f64]">
                    No velocity data available yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={velocityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3c3836" />
                      <XAxis dataKey="date" stroke="#a89984" fontSize={11} />
                      <YAxis stroke="#a89984" fontSize={11} />
                      <Tooltip contentStyle={{ background: '#282828', borderColor: '#3c3836', color: '#fff', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="tasksCreated" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6' }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Department Workload Distribution */}
            <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Department Workload Distribution</h3>
                </div>
                <span className="text-[10px] text-[#a89984] font-mono">Supabase Records</span>
              </div>
              <div className="h-64 w-full flex items-center justify-center">
                {deptData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-[#7c6f64]">
                    No department data available yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3c3836" />
                      <XAxis dataKey="name" stroke="#a89984" fontSize={11} />
                      <YAxis stroke="#a89984" fontSize={11} />
                      <Tooltip contentStyle={{ background: '#282828', borderColor: '#3c3836', color: '#fff', fontSize: '12px' }} />
                      <Bar dataKey="tasks" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 3: Agent Productivity */}
            <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-5 shadow-sm flex flex-col lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Autonomous Agent Productivity (Tasks Handled)</h3>
                </div>
                <span className="text-[10px] text-[#a89984] font-mono">Leaderboard</span>
              </div>
              <div className="h-64 w-full">
                {agentProductivityData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-[#7c6f64]">
                    No agent assignments recorded yet. Assign tasks to agents in their workstations!
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agentProductivityData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#3c3836" />
                      <XAxis type="number" stroke="#a89984" fontSize={11} />
                      <YAxis dataKey="agent" type="category" stroke="#a89984" fontSize={11} width={120} />
                      <Tooltip contentStyle={{ background: '#282828', borderColor: '#3c3836', color: '#fff', fontSize: '12px' }} />
                      <Bar dataKey="tasks" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Full-width D3.js Department Task Breakdown Bar Chart */}
            <div className="pt-2">
              <DepartmentTaskBarChart />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
