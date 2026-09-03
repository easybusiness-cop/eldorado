import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
} from 'recharts';
import { Agent, AgentLog } from '../types';
import {
  Zap,
  TrendingUp,
  Activity,
  Flame,
  Play,
  Pause,
  Filter,
  Sparkles,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { soundFx } from '../utils/speech';

interface TokenDataPoint {
  timestamp: string;
  timeLabel: string;
  totalTokens: number;
  deltaTokens: number;
  velocityTokensPerSec: number;
  isSpike: boolean;
  spikeAgent?: string;
  spikeMagnitude?: number;
  [agentKey: string]: any;
}

interface ActivitySpikeEvent {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  avatar: string;
  tokenBurst: number;
  reason: string;
}

interface FleetTokenTrendsLineChartProps {
  agents: Agent[];
  logs?: AgentLog[];
  selectedAgentId?: string;
  onSelectAgent?: (agentId: string) => void;
}

const AGENT_COLORS: Record<string, string> = {
  michael: '#fabd2f', // Gold / Amber
  dwight: '#fe8019',  // Orange
  jim: '#83a598',     // Sky Blue
  pam: '#d3869b',     // Pink / Rose
  kevin: '#b8bb26',   // Lime Green
  ryan: '#8ec07c',    // Aqua
  toby: '#a89984',    // Warm Gray
  stanley: '#bdae93', // Stone
  ruflo_coder: '#d65d0e', // Amber Red
  kelly: '#e06c75',   // Coral
  angela: '#d3869b',  // Light Purple
  oscar: '#458588',   // Deep Blue
  creed: '#98971a',   // Olive
};

export const FleetTokenTrendsLineChart: React.FC<FleetTokenTrendsLineChartProps> = ({
  agents,
  logs = [],
  selectedAgentId,
  onSelectAgent,
}) => {
  const [isLive, setIsLive] = useState(true);
  const [chartMode, setChartMode] = useState<'multiline' | 'area' | 'spikes'>('multiline');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [spikeThreshold, setSpikeThreshold] = useState<number>(350);
  const [spikeEvents, setSpikeEvents] = useState<ActivitySpikeEvent[]>([]);

  // Agent color map fallback
  const getAgentColor = (id: string, index: number) => {
    if (AGENT_COLORS[id]) return AGENT_COLORS[id];
    const palette = ['#fabd2f', '#83a598', '#b8bb26', '#fe8019', '#d3869b', '#8ec07c', '#fb4934'];
    return palette[index % palette.length];
  };

  // Generate initial sliding window time-series history
  const [dataPoints, setDataPoints] = useState<TokenDataPoint[]>(() => {
    const points: TokenDataPoint[] = [];
    const now = Date.now();
    const windowSize = 20;

    for (let i = windowSize; i >= 0; i--) {
      const t = new Date(now - i * 3000);
      const timeLabel = t.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      let pointTotal = 0;
      const agentData: Record<string, number> = {};

      agents.forEach((ag) => {
        const base = Math.max(100, Math.round(ag.tokensProcessed * (0.8 + Math.random() * 0.4)));
        const delta = Math.round(Math.random() * 180 + 20);
        agentData[ag.id] = base + delta;
        pointTotal += agentData[ag.id];
      });

      const deltaTokens = Math.round(Math.random() * 400 + 150);
      const isSpike = deltaTokens > 450;

      points.push({
        timestamp: t.toISOString(),
        timeLabel,
        totalTokens: pointTotal,
        deltaTokens,
        velocityTokensPerSec: Math.round(deltaTokens / 3),
        isSpike,
        spikeAgent: isSpike ? agents[Math.floor(Math.random() * agents.length)]?.id : undefined,
        ...agentData,
      });
    }
    return points;
  });

  // Streaming data generator effect
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeLabel = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Determine if a burst/spike occurs in this cycle
      const isSpikeTriggered = Math.random() > 0.65;
      const spikeAgent = agents.length > 0 ? agents[Math.floor(Math.random() * agents.length)] : null;
      const burstTokens = isSpikeTriggered ? Math.round(Math.random() * 600 + spikeThreshold) : Math.round(Math.random() * 180 + 30);

      const agentData: Record<string, number> = {};
      let pointTotal = 0;

      agents.forEach((ag) => {
        let agentDelta = Math.round(Math.random() * 60 + 10);
        if (isSpikeTriggered && spikeAgent && ag.id === spikeAgent.id) {
          agentDelta += burstTokens;
        }
        const prevAgentVal = dataPoints[dataPoints.length - 1]?.[ag.id] || (ag.tokensProcessed || 2000);
        agentData[ag.id] = prevAgentVal + agentDelta;
        pointTotal += agentData[ag.id];
      });

      // Record spike event
      if (isSpikeTriggered && spikeAgent) {
        const spikeEvent: ActivitySpikeEvent = {
          id: `spk-${Date.now()}`,
          timestamp: timeLabel,
          agentId: spikeAgent.id,
          agentName: spikeAgent.name,
          avatar: spikeAgent.avatar,
          tokenBurst: burstTokens,
          reason: `High concurrency prompt execution (${burstTokens} tok/s surge)`,
        };
        setSpikeEvents((prev) => [spikeEvent, ...prev.slice(0, 7)]);
      }

      setDataPoints((prev) => {
        const newPoint: TokenDataPoint = {
          timestamp: now.toISOString(),
          timeLabel,
          totalTokens: pointTotal,
          deltaTokens: isSpikeTriggered ? burstTokens : Math.round(Math.random() * 120 + 80),
          velocityTokensPerSec: Math.round((isSpikeTriggered ? burstTokens : 100) / 3),
          isSpike: isSpikeTriggered,
          spikeAgent: isSpikeTriggered && spikeAgent ? spikeAgent.id : undefined,
          spikeMagnitude: burstTokens,
          ...agentData,
        };

        const updated = [...prev.slice(1), newPoint];
        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive, agents, spikeThreshold, dataPoints]);

  // Filter top agents to display in multi-line mode to avoid visual clutter
  const activeAgentsToDisplay = useMemo(() => {
    if (selectedAgentFilter !== 'all') {
      return agents.filter((a) => a.id === selectedAgentFilter);
    }
    // Return top 6 active agents sorted by tokens processed
    return [...agents].sort((a, b) => (b.tokensProcessed || 0) - (a.tokensProcessed || 0)).slice(0, 6);
  }, [agents, selectedAgentFilter]);

  // Current live metrics
  const latestPoint = dataPoints[dataPoints.length - 1] || { totalTokens: 0, deltaTokens: 0, velocityTokensPerSec: 0 };
  const maxTokenSpike = useMemo(() => {
    return Math.max(...dataPoints.map((d) => d.deltaTokens), 500);
  }, [dataPoints]);

  const totalFleetTokens = useMemo(() => {
    return agents.reduce((acc, a) => acc + (a.tokensProcessed || 0), 0);
  }, [agents]);

  // Custom Tooltip
  const CustomTrendsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point: TokenDataPoint = payload[0].payload;
      return (
        <div className="bg-[#1d2021] border border-[#504945] rounded-lg p-3 shadow-2xl text-xs font-mono text-[#ebdbb2] min-w-[220px]">
          <div className="flex items-center justify-between border-b border-[#3c3836] pb-1.5 mb-2">
            <span className="font-bold text-[#fabd2f] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {label}
            </span>
            {point.isSpike && (
              <span className="text-[10px] font-bold text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded border border-red-500/40 flex items-center gap-1">
                <Flame className="w-3 h-3" /> SPIKE
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-[#a89984]">Fleet Total Tokens:</span>
              <span className="font-bold text-[#fbf1c7]">{point.totalTokens?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#a89984]">Instant Velocity:</span>
              <span className="font-bold text-emerald-400">{point.velocityTokensPerSec} tok/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#a89984]">Delta Surge:</span>
              <span className={`font-bold ${point.isSpike ? 'text-orange-400' : 'text-[#83a598]'}`}>
                +{point.deltaTokens} tokens
              </span>
            </div>

            {/* Individual Agent Values in Tooltip */}
            <div className="pt-2 mt-1 border-t border-[#3c3836] space-y-1">
              {activeAgentsToDisplay.map((ag) => (
                <div key={ag.id} className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px]">
                    <span>{ag.avatar}</span>
                    <span className="text-[#a89984]">{ag.nickname || ag.name.split(' ')[0]}:</span>
                  </span>
                  <span className="font-bold text-[#ebdbb2]">{point[ag.id]?.toLocaleString() || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="fleet-token-trends-widget" className="p-4 rounded-lg bg-[#282828] border border-[#3c3836] text-[#ebdbb2] space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#3c3836]">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded bg-amber-500/10 text-[#fabd2f] border border-[#fabd2f]/30">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#fbf1c7] flex items-center gap-2">
              Fleet Token Processing Trends
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 ${
                isLive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-[#3c3836] text-[#a89984]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-ping' : 'bg-[#a89984]'}`} />
                {isLive ? 'LIVE STREAMING' : 'PAUSED'}
              </span>
            </h3>
            <p className="text-xs text-[#a89984]">Real-time token velocity, multi-agent throughput & activity spike detection</p>
          </div>
        </div>

        {/* Action Buttons & Chart Mode Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Agent Filter Dropdown */}
          <div className="flex items-center gap-1 bg-[#1d2021] px-2 py-1 rounded border border-[#3c3836] text-xs">
            <Filter className="w-3.5 h-3.5 text-[#fabd2f]" />
            <select
              value={selectedAgentFilter}
              onChange={(e) => {
                setSelectedAgentFilter(e.target.value);
                if (e.target.value !== 'all' && onSelectAgent) {
                  onSelectAgent(e.target.value);
                }
              }}
              className="bg-transparent text-[#ebdbb2] outline-hidden cursor-pointer"
            >
              <option className="text-slate-900 bg-white" value="all">All Top Agents</option>
              {agents.map((ag) => (
                <option className="text-slate-900 bg-white" key={ag.id} value={ag.id}>
                  {ag.avatar} {ag.name} ({ag.nickname})
                </option>
              ))}
            </select>
          </div>

          {/* Chart Display Mode Switcher */}
          <div className="flex items-center bg-[#1d2021] p-0.5 rounded border border-[#3c3836] text-xs">
            <button
              onClick={() => {
                soundFx.playClick();
                setChartMode('multiline');
              }}
              className={`px-2 py-1 rounded transition-colors ${
                chartMode === 'multiline' ? 'bg-[#fabd2f] text-[#1d2021] font-bold' : 'text-[#a89984] hover:text-white'
              }`}
            >
              Multi-Agent Line
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setChartMode('area');
              }}
              className={`px-2 py-1 rounded transition-colors ${
                chartMode === 'area' ? 'bg-[#fabd2f] text-[#1d2021] font-bold' : 'text-[#a89984] hover:text-white'
              }`}
            >
              Fleet Area
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setChartMode('spikes');
              }}
              className={`px-2 py-1 rounded transition-colors ${
                chartMode === 'spikes' ? 'bg-[#fabd2f] text-[#1d2021] font-bold' : 'text-[#a89984] hover:text-white'
              }`}
            >
              Spike Velocity
            </button>
          </div>

          {/* Live Stream Toggle Button */}
          <button
            onClick={() => {
              soundFx.playClick();
              setIsLive(!isLive);
            }}
            className={`p-1.5 rounded border flex items-center gap-1 text-xs font-bold ${
              isLive
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-[#3c3836] text-[#a89984] border-[#504945] hover:text-white'
            }`}
            title={isLive ? 'Pause live stream' : 'Resume live stream'}
          >
            {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded bg-[#1d2021] border border-[#3c3836]">
          <span className="text-[#a89984] text-[10px] uppercase font-bold block">Total Processed</span>
          <div className="text-lg font-bold text-[#fbf1c7] flex items-center gap-1.5 mt-0.5">
            <Zap className="w-4 h-4 text-[#fabd2f]" />
            <span>{totalFleetTokens.toLocaleString()} tok</span>
          </div>
          <span className="text-[10px] text-[#a89984]">All agents combined</span>
        </div>

        <div className="p-2.5 rounded bg-[#1d2021] border border-[#3c3836]">
          <span className="text-[#a89984] text-[10px] uppercase font-bold block">Current Velocity</span>
          <div className="text-lg font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
            <Activity className="w-4 h-4" />
            <span>{latestPoint.velocityTokensPerSec || 42} tok/s</span>
          </div>
          <span className="text-[10px] text-emerald-500">Active throughput</span>
        </div>

        <div className="p-2.5 rounded bg-[#1d2021] border border-[#3c3836]">
          <span className="text-[#a89984] text-[10px] uppercase font-bold block">Peak Activity Spike</span>
          <div className="text-lg font-bold text-orange-400 flex items-center gap-1.5 mt-0.5">
            <Flame className="w-4 h-4" />
            <span>+{maxTokenSpike} tokens</span>
          </div>
          <span className="text-[10px] text-[#a89984]">Threshold &gt; {spikeThreshold}</span>
        </div>

        <div className="p-2.5 rounded bg-[#1d2021] border border-[#3c3836]">
          <span className="text-[#a89984] text-[10px] uppercase font-bold block">Spikes Logged</span>
          <div className="text-lg font-bold text-red-400 flex items-center gap-1.5 mt-0.5">
            <AlertCircle className="w-4 h-4" />
            <span>{spikeEvents.length} bursts</span>
          </div>
          <span className="text-[10px] text-[#a89984]">Recent window</span>
        </div>
      </div>

      {/* Main Recharts Line / Area Chart */}
      <div className="w-full h-[300px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'area' ? (
            <AreaChart data={dataPoints} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <defs>
                <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fabd2f" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#fabd2f" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3c3836" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                stroke="#a89984"
                fontSize={11}
                tickLine={false}
                interval={3}
              />
              <YAxis
                stroke="#a89984"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTrendsTooltip />} />
              <Area
                type="monotone"
                dataKey="totalTokens"
                name="Fleet Total Tokens"
                stroke="#fabd2f"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#tokenGradient)"
              />
            </AreaChart>
          ) : chartMode === 'spikes' ? (
            <LineChart data={dataPoints} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3c3836" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                stroke="#a89984"
                fontSize={11}
                tickLine={false}
                interval={3}
              />
              <YAxis
                stroke="#a89984"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `${val} t/s`}
              />
              <Tooltip content={<CustomTrendsTooltip />} />
              <ReferenceLine
                y={Math.round(spikeThreshold / 3)}
                stroke="#fb4934"
                strokeDasharray="4 4"
                label={{ value: 'Spike Surge Threshold', fill: '#fb4934', fontSize: 10, position: 'top' }}
              />
              <Line
                type="monotone"
                dataKey="velocityTokensPerSec"
                name="Processing Velocity (tok/s)"
                stroke="#fe8019"
                strokeWidth={2.5}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.isSpike) {
                    return (
                      <circle
                        key={`dot-${payload.timestamp}`}
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill="#fb4934"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                        className="animate-pulse"
                      />
                    );
                  }
                  return <circle key={`dot-${payload.timestamp}`} cx={cx} cy={cy} r={2} fill="#fe8019" />;
                }}
              />
            </LineChart>
          ) : (
            <LineChart data={dataPoints} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3c3836" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                stroke="#a89984"
                fontSize={11}
                tickLine={false}
                interval={3}
              />
              <YAxis
                stroke="#a89984"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTrendsTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

              {activeAgentsToDisplay.map((ag, idx) => (
                <Line
                  key={ag.id}
                  type="monotone"
                  dataKey={ag.id}
                  name={`${ag.avatar} ${ag.nickname || ag.name.split(' ')[0]}`}
                  stroke={getAgentColor(ag.id, idx)}
                  strokeWidth={ag.id === selectedAgentId ? 3.5 : 2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Activity Spike Log Feed */}
      {spikeEvents.length > 0 && (
        <div className="p-3 rounded bg-[#1d2021] border border-[#3c3836] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#a89984]">
            <span className="flex items-center gap-1.5 text-orange-400">
              <Flame className="w-3.5 h-3.5" /> Recent Activity Spikes & Bursts ({spikeEvents.length})
            </span>
            <span className="text-[10px] text-[#928374]">Auto-Detected by Recharts Trendline</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {spikeEvents.slice(0, 3).map((spk) => (
              <div
                key={spk.id}
                onClick={() => onSelectAgent && onSelectAgent(spk.agentId)}
                className="p-2 rounded bg-[#282828] border border-orange-500/30 hover:border-orange-500/60 cursor-pointer transition-colors flex items-start gap-2 text-xs"
              >
                <span className="text-base">{spk.avatar}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1 font-bold text-[#fbf1c7]">
                    <span className="truncate">{spk.agentName}</span>
                    <span className="text-[10px] font-mono text-orange-400 bg-orange-500/20 px-1 rounded">
                      +{spk.tokenBurst}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#a89984] truncate">{spk.timestamp} • {spk.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
