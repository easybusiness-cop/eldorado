import React, { useState, useEffect } from 'react';
import {
  Zap,
  Clock,
  BarChart3,
  Sliders,
  Cpu,
  Shield,
  Brain,
  CheckCircle2,
  AlertCircle,
  Activity,
  Flame,
  TrendingUp,
  UserCheck,
  RefreshCw,
  X,
  Search,
  Sparkles,
  Layers,
  Bot,
  Play
} from 'lucide-react';
import { Agent } from '../types';

export interface PredictiveLoadBalancerModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  onAddTask?: (task: any) => void;
}

interface TimeWindowProfile {
  hour: number;
  label: string;
  efficiencyScore: number;
  historicalTasksCompleted: number;
  avgLatencyMs: number;
  successRate: number;
}

interface AgentEfficiencyProfile {
  agentId: string;
  agentName: string;
  department: string;
  role: string;
  overallEfficiencyScore: number;
  peakHours: number[];
  peakWindowLabel: string;
  averageTaskDurationMs: number;
  historicalSuccessRate: number;
  currentActiveWorkload: number;
  capabilityStrengths: string[];
  hourlyEfficiencyMap: TimeWindowProfile[];
}

interface PredictiveRoutingResult {
  recommendedAgentId: string;
  recommendedAgentName: string;
  department: string;
  role: string;
  compositeEfficiencyScore: number;
  scorePercentage: number;
  temporalMatchScore: number;
  capabilityMatchScore: number;
  predictedLatencyMs: number;
  workloadFrictionScore: number;
  windowLabel: string;
  isCurrentWindowPeak: boolean;
  confidenceRating: string;
  rationale: string;
}

interface PredictiveLogEntry {
  id: string;
  timestamp: string;
  taskId: string;
  taskTitle: string;
  assignedAgentId: string;
  assignedAgentName: string;
  predictedScore: number;
  windowLabel: string;
  confidenceRating: string;
  rationale: string;
  status: string;
}

export const PredictiveLoadBalancerModal: React.FC<PredictiveLoadBalancerModalProps> = ({
  isOpen,
  onClose,
  agents,
  onAddTask,
}) => {
  const [activeTab, setActiveTab] = useState<'heatmap' | 'profiles' | 'simulator' | 'telemetry' | 'tuning'>('heatmap');
  const [loading, setLoading] = useState(false);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [currentWindowLabel, setCurrentWindowLabel] = useState('Morning Prime (08:00 - 12:00)');
  const [fleetBalancingScore, setFleetBalancingScore] = useState(88);
  const [agentProfiles, setAgentProfiles] = useState<AgentEfficiencyProfile[]>([]);
  const [recentLogs, setRecentLogs] = useState<PredictiveLogEntry[]>([]);
  
  // Tuning config
  const [config, setConfig] = useState({
    mode: 'predictive_peak',
    temporalWeight: 0.35,
    capabilityWeight: 0.35,
    latencyWeight: 0.15,
    workloadWeight: 0.15,
    autoAssignEnabled: true,
  });

  // Simulator state
  const [simTitle, setSimTitle] = useState('Refactor API Gateway for Zero-Trust Security');
  const [simDescription, setSimDescription] = useState('Optimize network payload validation, run OWASP security checks, and deploy low-latency cache.');
  const [selectedCaps, setSelectedCaps] = useState<string[]>(['code', 'security']);
  const [simResult, setSimResult] = useState<PredictiveRoutingResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ agentName: string; hour: number; profile: TimeWindowProfile } | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/load-balancer/stats');
      if (res.ok) {
        const data = await res.json();
        setCurrentHour(data.currentHour);
        setCurrentWindowLabel(data.currentWindowLabel);
        setFleetBalancingScore(data.fleetBalancingScore);
        setAgentProfiles(data.agentProfiles || []);
        setRecentLogs(data.recentLogs || []);
        if (data.config) setConfig(data.config);
      }
    } catch (e) {
      console.error('Failed to fetch load balancer stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/load-balancer/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: simTitle,
          description: simDescription,
          requiredCapabilities: selectedCaps,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSimResult(data.prediction);
        if (data.logEntry) {
          setRecentLogs((prev) => [data.logEntry, ...prev]);
        }
      }
    } catch (e) {
      console.error('Simulation failed:', e);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleUpdateConfig = async (newConfig: typeof config) => {
    setConfig(newConfig);
    try {
      await fetch('/api/load-balancer/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
    } catch (e) {
      console.error('Failed to update config:', e);
    }
  };

  const toggleCap = (cap: string) => {
    setSelectedCaps((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#181615] border border-[#3c3836] w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#ebdbb2] font-sans">
        
        {/* Header */}
        <div className="bg-[#282828] border-b border-[#3c3836] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fabd2f] to-[#fe8019] flex items-center justify-center text-[#1d2021] font-black shadow-lg">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-wide text-[#fbf1c7]">
                  Predictive Load Balancer
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#fabd2f]/10 text-[#fabd2f] border border-[#fabd2f]/30">
                  Peak Efficiency AI Engine
                </span>
              </div>
              <p className="text-xs text-[#a89984] mt-0.5">
                Auto-assigns tasks based on 24-hour historical efficiency windows &amp; peak performance curves.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-[#1d2021] border border-[#3c3836] px-3 py-1.5 rounded-lg text-xs">
              <Clock className="w-3.5 h-3.5 text-[#fe8019]" />
              <span className="text-[#a89984]">Current Window:</span>
              <span className="font-mono text-[#fabd2f] font-semibold">{currentWindowLabel}</span>
            </div>

            <div className="flex items-center gap-2 bg-[#1d2021] border border-[#3c3836] px-3 py-1.5 rounded-lg text-xs">
              <Activity className="w-3.5 h-3.5 text-[#b8bb26]" />
              <span className="text-[#a89984]">Fleet Balance:</span>
              <span className="font-mono text-[#b8bb26] font-bold">{fleetBalancingScore}%</span>
            </div>

            <button
              onClick={fetchStats}
              title="Refresh Telemetry"
              className="p-2 rounded-lg bg-[#3c3836] hover:bg-[#504945] text-[#ebdbb2] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#3c3836] hover:bg-[#504945] text-[#a89984] hover:text-[#fbf1c7] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-[#1d2021] border-b border-[#3c3836] px-6 py-2 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('heatmap')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'heatmap'
                  ? 'bg-[#fabd2f] text-[#1d2021] font-bold shadow'
                  : 'text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#282828]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              24h Efficiency Heatmap
            </button>

            <button
              onClick={() => setActiveTab('profiles')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'profiles'
                  ? 'bg-[#fabd2f] text-[#1d2021] font-bold shadow'
                  : 'text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#282828]'
              }`}
            >
              <Flame className="w-4 h-4" />
              Agent Peak Profiles
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'simulator'
                  ? 'bg-[#fabd2f] text-[#1d2021] font-bold shadow'
                  : 'text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#282828]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Auto-Assign Simulator
            </button>

            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'telemetry'
                  ? 'bg-[#fabd2f] text-[#1d2021] font-bold shadow'
                  : 'text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#282828]'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Assignment Telemetry Log
            </button>

            <button
              onClick={() => setActiveTab('tuning')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'tuning'
                  ? 'bg-[#fabd2f] text-[#1d2021] font-bold shadow'
                  : 'text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#282828]'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Engine Tuning
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#a89984] bg-[#282828] px-3 py-1 rounded-full border border-[#3c3836]">
            <span className="w-2 h-2 rounded-full bg-[#b8bb26] animate-pulse"></span>
            Mode: <span className="text-[#83a598] font-mono font-semibold uppercase">{config.mode.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#181615]">
          
          {/* TAB 1: HEATMAP MATRIX */}
          {activeTab === 'heatmap' && (
            <div className="space-y-6">
              <div className="bg-[#282828] border border-[#3c3836] p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#fbf1c7] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#fabd2f]" />
                    24-Hour Fleet Efficiency Heatmap
                  </h3>
                  <p className="text-xs text-[#a89984] mt-0.5">
                    Map of agent peak productivity windows across 24 hours. Darker cells represent idle/baseline windows; bright amber/green indicates peak throughput hours.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-[#3c3836]"></div>
                    <span className="text-[#a89984]">Baseline (&lt;70%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-[#83a598]"></div>
                    <span className="text-[#a89984]">Steady (70-85%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-[#fabd2f]"></div>
                    <span className="text-[#a89984]">Peak Window (85-100%)</span>
                  </div>
                </div>
              </div>

              {/* Heatmap Grid Table */}
              <div className="bg-[#282828] border border-[#3c3836] rounded-xl overflow-x-auto shadow-inner">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#1d2021] border-b border-[#3c3836]">
                      <th className="p-3 text-[#a89984] font-mono w-44 sticky left-0 bg-[#1d2021] z-10 border-r border-[#3c3836]">
                        Agent Roster
                      </th>
                      {Array.from({ length: 24 }, (_, i) => (
                        <th
                          key={i}
                          className={`p-2 text-center font-mono text-[10px] min-w-[32px] border-r border-[#3c3836]/40 ${
                            i === currentHour ? 'bg-[#fabd2f]/20 text-[#fabd2f] font-bold' : 'text-[#a89984]'
                          }`}
                        >
                          {i.toString().padStart(2, '0')}h
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {agentProfiles.map((profile) => (
                      <tr key={profile.agentId} className="border-b border-[#3c3836]/50 hover:bg-[#32302f]">
                        <td className="p-3 sticky left-0 bg-[#282828] z-10 border-r border-[#3c3836]">
                          <div className="font-bold text-[#fbf1c7] text-xs truncate max-w-[150px]">
                            {profile.agentName}
                          </div>
                          <div className="text-[10px] text-[#a89984] truncate">{profile.role}</div>
                        </td>
                        {profile.hourlyEfficiencyMap.map((hourData) => {
                          const isCurrent = hourData.hour === currentHour;
                          const score = hourData.efficiencyScore;
                          let bgColor = 'bg-[#3c3836] text-[#a89984]';
                          if (score >= 0.85) bgColor = 'bg-[#fabd2f] text-[#1d2021] font-bold';
                          else if (score >= 0.70) bgColor = 'bg-[#83a598] text-[#1d2021] font-medium';

                          return (
                            <td
                              key={hourData.hour}
                              onMouseEnter={() => setHoveredCell({ agentName: profile.agentName, hour: hourData.hour, profile: hourData })}
                              onMouseLeave={() => setHoveredCell(null)}
                              className={`p-1.5 text-center font-mono text-[10px] cursor-pointer transition-transform hover:scale-110 hover:z-20 border-r border-[#3c3836]/30 ${bgColor} ${
                                isCurrent ? 'ring-2 ring-[#fe8019]' : ''
                              }`}
                            >
                              {Math.round(score * 100)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Hovered cell tooltip drawer */}
              {hoveredCell && (
                <div className="bg-[#1d2021] border border-[#fabd2f]/40 p-3.5 rounded-xl flex items-center justify-between text-xs animate-fade-in shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#fabd2f]/20 border border-[#fabd2f]/40 flex items-center justify-center text-[#fabd2f] font-bold">
                      {hoveredCell.hour}h
                    </div>
                    <div>
                      <span className="font-bold text-[#fbf1c7]">{hoveredCell.agentName}</span>
                      <span className="text-[#a89984] ml-2 font-mono">({hoveredCell.profile.label})</span>
                      <div className="text-[11px] text-[#83a598] mt-0.5">
                        Efficiency: <span className="font-bold">{Math.round(hoveredCell.profile.efficiencyScore * 100)}%</span> | Avg Latency: <span className="font-bold">{hoveredCell.profile.avgLatencyMs}ms</span> | Historical Runs: {hoveredCell.profile.historicalTasksCompleted}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-[#282828] text-[#a89984] px-2 py-1 rounded border border-[#3c3836]">
                    Success Rate: {(hoveredCell.profile.successRate * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AGENT PEAK PROFILES */}
          {activeTab === 'profiles' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agentProfiles.map((profile) => (
                  <div
                    key={profile.agentId}
                    className="bg-[#282828] border border-[#3c3836] hover:border-[#fabd2f]/50 p-5 rounded-xl flex flex-col justify-between space-y-4 transition-all shadow hover:shadow-xl"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-[#fbf1c7]">{profile.agentName}</h4>
                          <span className="text-xs text-[#a89984]">{profile.department} &bull; {profile.role}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black font-mono text-[#fabd2f]">{profile.overallEfficiencyScore}%</div>
                          <span className="text-[9px] uppercase font-mono text-[#a89984]">Peak Rating</span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-[#3c3836]/60">
                          <span className="text-[#a89984]">Peak Duty Hours:</span>
                          <span className="font-mono text-[#83a598] font-semibold">
                            {profile.peakHours.slice(0, 4).map((h) => `${h.toString().padStart(2, '0')}:00`).join(', ')}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#3c3836]/60">
                          <span className="text-[#a89984]">Avg Execution Speed:</span>
                          <span className="font-mono text-[#b8bb26] font-semibold">{profile.averageTaskDurationMs} ms</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#3c3836]/60">
                          <span className="text-[#a89984]">Historical Reliability:</span>
                          <span className="font-mono text-[#83a598] font-semibold">{(profile.historicalSuccessRate * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-[#a89984]">Active Workload Friction:</span>
                          <span className={`font-mono font-semibold ${profile.currentActiveWorkload > 0 ? 'text-[#fe8019]' : 'text-[#b8bb26]'}`}>
                            {profile.currentActiveWorkload} task(s) active
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-mono text-[#a89984] mb-1.5">CAPABILITY STRENGTHS</div>
                      <div className="flex flex-wrap gap-1">
                        {profile.capabilityStrengths.map((cap, i) => (
                          <span key={i} className="text-[10px] font-mono px-2 py-0.5 bg-[#1d2021] text-[#83a598] rounded border border-[#3c3836]">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: AUTO-ASSIGN SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Simulator Form */}
              <div className="lg:col-span-5 bg-[#282828] border border-[#3c3836] p-5 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#fbf1c7] border-b border-[#3c3836] pb-3">
                  <Sparkles className="w-4 h-4 text-[#fabd2f]" />
                  Predictive Task Router Simulator
                </div>

                <div>
                  <label className="block text-xs text-[#a89984] mb-1">Task Title</label>
                  <input
                    type="text"
                    value={simTitle}
                    onChange={(e) => setSimTitle(e.target.value)}
                    className="w-full bg-[#1d2021] border border-[#3c3836] focus:border-[#fabd2f] text-xs rounded-lg p-2.5 text-[#ebdbb2] outline-none font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#a89984] mb-1">Task Requirements &amp; Description</label>
                  <textarea
                    rows={3}
                    value={simDescription}
                    onChange={(e) => setSimDescription(e.target.value)}
                    className="w-full bg-[#1d2021] border border-[#3c3836] focus:border-[#fabd2f] text-xs rounded-lg p-2.5 text-[#ebdbb2] outline-none font-sans resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#a89984] mb-2">Required Capabilities</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['code', 'security', 'research', 'marketing', 'finance', 'devops', 'strategy', 'architecture'].map((cap) => {
                      const isSel = selectedCaps.includes(cap);
                      return (
                        <button
                          key={cap}
                          type="button"
                          onClick={() => toggleCap(cap)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                            isSel
                              ? 'bg-[#fabd2f] text-[#1d2021] font-bold shadow'
                              : 'bg-[#1d2021] text-[#a89984] border border-[#3c3836] hover:text-[#ebdbb2]'
                          }`}
                        >
                          +{cap}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  className="w-full py-3 bg-[#fabd2f] hover:bg-[#fe8019] text-[#1d2021] font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Play className={`w-4 h-4 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
                  {isSimulating ? 'Predicting Peak Routing...' : 'Predict Optimal Agent Assignment'}
                </button>
              </div>

              {/* Simulator Output */}
              <div className="lg:col-span-7 space-y-4">
                {simResult ? (
                  <div className="bg-[#282828] border border-[#fabd2f]/50 p-6 rounded-xl space-y-5 animate-fade-in">
                    <div className="flex items-start justify-between border-b border-[#3c3836] pb-4">
                      <div>
                        <span className="text-[10px] font-mono text-[#fabd2f] uppercase tracking-wider font-bold">
                          Predictive Recommendation
                        </span>
                        <h3 className="text-xl font-black text-[#fbf1c7] mt-0.5">
                          {simResult.recommendedAgentName}
                        </h3>
                        <p className="text-xs text-[#a89984]">{simResult.department} &bull; {simResult.role}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-3xl font-black font-mono text-[#b8bb26]">{simResult.scorePercentage}%</div>
                        <span className="text-[10px] font-mono text-[#83a598] font-bold px-2 py-0.5 bg-[#83a598]/10 rounded border border-[#83a598]/30 inline-block mt-1">
                          {simResult.confidenceRating}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Progress Meters */}
                    <div className="space-y-3 bg-[#1d2021] p-4 rounded-xl border border-[#3c3836]">
                      <div>
                        <div className="flex justify-between text-xs font-mono mb-1">
                          <span className="text-[#a89984]">Temporal Duty Window Match ({simResult.windowLabel})</span>
                          <span className="text-[#fabd2f] font-bold">{simResult.temporalMatchScore}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#3c3836] rounded-full overflow-hidden">
                          <div className="h-full bg-[#fabd2f] transition-all" style={{ width: `${simResult.temporalMatchScore}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-mono mb-1">
                          <span className="text-[#a89984]">Capability Match &amp; Expertise Mastery</span>
                          <span className="text-[#83a598] font-bold">{simResult.capabilityMatchScore}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#3c3836] rounded-full overflow-hidden">
                          <div className="h-full bg-[#83a598] transition-all" style={{ width: `${simResult.capabilityMatchScore}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-mono mb-1">
                          <span className="text-[#a89984]">Workload Concurrency Availability</span>
                          <span className="text-[#b8bb26] font-bold">{simResult.workloadFrictionScore}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#3c3836] rounded-full overflow-hidden">
                          <div className="h-full bg-[#b8bb26] transition-all" style={{ width: `${simResult.workloadFrictionScore}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs bg-[#181615] p-3.5 rounded-xl border border-[#3c3836] text-[#ebdbb2] leading-relaxed">
                      <strong className="text-[#fabd2f]">Predictive Rationale:</strong> {simResult.rationale}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-[#a89984]">
                        Projected Execution Speed: <strong className="text-[#b8bb26] font-mono">{simResult.predictedLatencyMs} ms</strong>
                      </span>
                      {onAddTask && (
                        <button
                          onClick={() => {
                            onAddTask({
                              title: simTitle,
                              description: simDescription,
                              assignedTo: simResult.recommendedAgentId,
                              priority: 'high',
                            });
                            onClose();
                          }}
                          className="px-4 py-2 bg-[#b8bb26] hover:bg-[#b8bb26]/80 text-[#1d2021] font-bold text-xs rounded-lg shadow flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4" />
                          Auto-Assign &amp; Execute Task
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#282828] border border-[#3c3836] p-12 rounded-xl text-center flex flex-col items-center justify-center space-y-3 h-full min-h-[300px]">
                    <Bot className="w-12 h-12 text-[#a89984]/40" />
                    <h4 className="text-sm font-bold text-[#fbf1c7]">Ready to Predict Assignment</h4>
                    <p className="text-xs text-[#a89984] max-w-sm">
                      Input your task parameters on the left and click &quot;Predict Optimal Agent Assignment&quot; to evaluate temporal peak windows and agent efficiency profiles.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TELEMETRY LOG */}
          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              <div className="bg-[#282828] border border-[#3c3836] p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#fbf1c7] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#b8bb26]" />
                    Predictive Auto-Assignment Telemetry Ledger
                  </h3>
                  <p className="text-xs text-[#a89984] mt-0.5">
                    Real-time audit record of task predictions, window alignment ratings, and score metrics.
                  </p>
                </div>
              </div>

              <div className="bg-[#282828] border border-[#3c3836] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#1d2021] border-b border-[#3c3836] text-[#a89984] font-mono">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Task Title</th>
                      <th className="p-3">Assigned Agent</th>
                      <th className="p-3 text-center">Prediction Score</th>
                      <th className="p-3">Duty Window</th>
                      <th className="p-3">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map((log) => (
                      <tr key={log.id} className="border-b border-[#3c3836]/40 hover:bg-[#32302f]">
                        <td className="p-3 font-mono text-[11px] text-[#a89984]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="p-3 font-bold text-[#fbf1c7] max-w-xs truncate">
                          {log.taskTitle}
                        </td>
                        <td className="p-3 text-[#83a598] font-medium">
                          {log.assignedAgentName}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-[#fabd2f]">
                          {log.predictedScore}%
                        </td>
                        <td className="p-3 text-[#a89984] font-mono text-[11px]">
                          {log.windowLabel}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#b8bb26]/10 text-[#b8bb26] border border-[#b8bb26]/30">
                            {log.confidenceRating}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ENGINE TUNING */}
          {activeTab === 'tuning' && (
            <div className="max-w-3xl mx-auto bg-[#282828] border border-[#3c3836] p-6 rounded-xl space-y-6">
              <div className="border-b border-[#3c3836] pb-4">
                <h3 className="text-base font-bold text-[#fbf1c7] flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#fabd2f]" />
                  Predictive Load Balancer Weights &amp; Tuning
                </h3>
                <p className="text-xs text-[#a89984] mt-1">
                  Adjust the relative weight factors used by the predictive routing formula when ranking agents for auto-assignment.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-[#fbf1c7] mb-1">
                    <span>Temporal Window Weight (Peak Duty Hours):</span>
                    <span className="font-mono text-[#fabd2f]">{Math.round(config.temporalWeight * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.temporalWeight}
                    onChange={(e) => handleUpdateConfig({ ...config, temporalWeight: parseFloat(e.target.value) })}
                    className="w-full accent-[#fabd2f]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-[#fbf1c7] mb-1">
                    <span>Capability Match &amp; Mastery Weight:</span>
                    <span className="font-mono text-[#83a598]">{Math.round(config.capabilityWeight * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.capabilityWeight}
                    onChange={(e) => handleUpdateConfig({ ...config, capabilityWeight: parseFloat(e.target.value) })}
                    className="w-full accent-[#83a598]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-[#fbf1c7] mb-1">
                    <span>Historical Latency / Execution Speed Weight:</span>
                    <span className="font-mono text-[#b8bb26]">{Math.round(config.latencyWeight * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.latencyWeight}
                    onChange={(e) => handleUpdateConfig({ ...config, latencyWeight: parseFloat(e.target.value) })}
                    className="w-full accent-[#b8bb26]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-[#fbf1c7] mb-1">
                    <span>Workload Concurrency Friction Weight:</span>
                    <span className="font-mono text-[#fe8019]">{Math.round(config.workloadWeight * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.workloadWeight}
                    onChange={(e) => handleUpdateConfig({ ...config, workloadWeight: parseFloat(e.target.value) })}
                    className="w-full accent-[#fe8019]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#3c3836] flex items-center justify-between">
                <span className="text-xs text-[#a89984]">Predictive Auto-Assignment State:</span>
                <button
                  type="button"
                  onClick={() => handleUpdateConfig({ ...config, autoAssignEnabled: !config.autoAssignEnabled })}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    config.autoAssignEnabled ? 'bg-[#b8bb26] text-[#1d2021]' : 'bg-[#3c3836] text-[#a89984]'
                  }`}
                >
                  {config.autoAssignEnabled ? 'Predictive Auto-Assign ACTIVE' : 'Auto-Assign DISABLED'}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
