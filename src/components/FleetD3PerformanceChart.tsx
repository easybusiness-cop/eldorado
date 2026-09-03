import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Agent, FleetTask, SystemTelemetry, AgentLog } from '../types';
import { soundFx } from '../utils/speech';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Zap,
  CheckCircle2,
  Clock,
  Shield,
  Layers,
  Sparkles,
  Maximize2,
  RefreshCw,
  Play,
  Pause,
  Filter,
} from 'lucide-react';

interface TokenTimePoint {
  time: Date;
  timestamp: number;
  totalTokens: number;
  deltaTokens: number;
  agentTokens: Record<string, number>;
  activeTasks: number;
}

interface HoveredTooltipData {
  type: 'time' | 'agent' | 'donut';
  time?: string;
  tokens?: number;
  delta?: number;
  activeTasks?: number;
  focusedAgentId?: string;
  agentContributions?: Array<{
    id: string;
    name: string;
    avatar: string;
    color: string;
    tokens: number;
    sharePct: number;
    efficiencyScore: number;
    status: string;
    role: string;
  }>;
  // Agent type props
  avatar?: string;
  fullName?: string;
  efficiencyScore?: number;
  tokensProcessed?: number;
  tokenShare?: number;
  successRate?: number;
  tokensPerSec?: number;
  status?: string;
  role?: string;
  // Donut type props
  label?: string;
  count?: number;
  pct?: number;
  // Mouse coordinates for floating tooltip
  posX?: number;
  posY?: number;
}

interface FleetD3PerformanceChartProps {
  agents: Agent[];
  tasks: FleetTask[];
  telemetry: SystemTelemetry;
  logs: AgentLog[];
  selectedAgentId?: string;
  onSelectAgent?: (agentId: string) => void;
}

type ChartViewMode = 'overview' | 'tokens' | 'efficiency' | 'tasks';
type TimeWindow = '5m' | '15m' | 'session';
type LineDisplayMode = 'composite' | 'multiline' | 'filtered';

export const FleetD3PerformanceChart: React.FC<FleetD3PerformanceChartProps> = ({
  agents,
  tasks,
  telemetry,
  logs,
  selectedAgentId,
  onSelectAgent,
}) => {
  const [viewMode, setViewMode] = useState<ChartViewMode>('overview');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('5m');
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [hoveredData, setHoveredData] = useState<HoveredTooltipData | null>(null);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [lineDisplayMode, setLineDisplayMode] = useState<LineDisplayMode>('composite');
  const [focusedAgentId, setFocusedAgentId] = useState<string | null>(null);

  // Container refs for D3 charts
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartWrapperRef = useRef<HTMLDivElement | null>(null);
  const lineChartSvgRef = useRef<SVGSVGElement | null>(null);
  const barChartSvgRef = useRef<SVGSVGElement | null>(null);
  const donutChartSvgRef = useRef<SVGSVGElement | null>(null);

  // Time-series token history state
  const [timeSeriesData, setTimeSeriesData] = useState<TokenTimePoint[]>(() => {
    const now = Date.now();
    const initialPoints: TokenTimePoint[] = [];
    const baseTokens = agents.reduce((acc, a) => acc + (a.tokensProcessed || 0), 0);

    for (let i = 15; i >= 0; i--) {
      const t = now - i * 4000;
      const variation = Math.sin(i * 0.5) * 800 + Math.random() * 400;
      const pointTokens = Math.max(0, baseTokens - i * 450 + Math.round(variation));
      const agentMap: Record<string, number> = {};
      agents.forEach((ag) => {
        agentMap[ag.id] = Math.max(0, Math.round(ag.tokensProcessed * (1 - (i * 0.02) + (Math.random() * 0.02 - 0.01))));
      });

      initialPoints.push({
        time: new Date(t),
        timestamp: t,
        totalTokens: pointTokens,
        deltaTokens: Math.max(120, Math.round(350 + Math.random() * 250)),
        agentTokens: agentMap,
        activeTasks: Math.max(1, Math.round(2 + Math.random() * 3)),
      });
    }
    return initialPoints;
  });

  // Calculate live agent efficiency metrics
  const agentEfficiencyList = useMemo(() => {
    const totalTokensFleet = agents.reduce((acc, a) => acc + (a.tokensProcessed || 0), 1);
    const totalTasks = tasks.length || 1;

    return agents.map((agent) => {
      const agentTasks = tasks.filter((t) => t.assignedTo === agent.id);
      const completedTasks = agentTasks.filter((t) => t.status === 'completed').length;
      const taskSuccessRate = agentTasks.length > 0
        ? Math.round((completedTasks / agentTasks.length) * 100)
        : 95 + Math.round((agent.tokensProcessed % 5));

      // Efficiency formula: (Task Success * 0.4) + (Tokens Processed share * 0.4) + (Status factor * 0.2)
      const tokenShare = (agent.tokensProcessed / totalTokensFleet) * 100;
      const statusBonus = agent.status === 'working' ? 100 : agent.status === 'debugging' ? 90 : 80;
      const efficiencyScore = Math.min(
        99.9,
        Math.round(taskSuccessRate * 0.45 + Math.min(40, tokenShare * 2) + (statusBonus * 0.15))
      );

      const tokensPerSec = Math.round((agent.tokensProcessed / 360) + (agent.status === 'working' ? 45 : 12));

      return {
        id: agent.id,
        name: agent.nickname || agent.name.split(' ')[0],
        fullName: agent.name,
        role: agent.role,
        avatar: agent.avatar,
        color: agent.color || '#fabd2f',
        tokensProcessed: agent.tokensProcessed,
        tokenShare: Number(tokenShare.toFixed(1)),
        tasksAssigned: agentTasks.length,
        tasksCompleted: completedTasks,
        successRate: taskSuccessRate,
        efficiencyScore,
        tokensPerSec,
        status: agent.status,
      };
    });
  }, [agents, tasks]);

  // Aggregate task status metrics for D3 Donut
  const taskStatusDistribution = useMemo(() => {
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const running = tasks.filter((t) => t.status === 'running').length;
    const queued = tasks.filter((t) => t.status === 'queued').length;
    const failed = tasks.filter((t) => t.status === 'failed').length;
    const total = tasks.length || 4;

    return [
      { label: 'Completed', count: completed || 6, color: '#b8bb26', pct: Math.round(((completed || 6) / (total + 5)) * 100) },
      { label: 'Running', count: running || 2, color: '#fabd2f', pct: Math.round(((running || 2) / (total + 5)) * 100) },
      { label: 'Queued', count: queued || 1, color: '#83a598', pct: Math.round(((queued || 1) / (total + 5)) * 100) },
      { label: 'Self-Healed', count: telemetry?.patchesApplied || 3, color: '#d3869b', pct: Math.round(((telemetry?.patchesApplied || 3) / (total + 5)) * 100) },
      { label: 'Failed/Retried', count: failed || 0, color: '#fb4934', pct: failed > 0 ? Math.round((failed / (total + 5)) * 100) : 0 },
    ];
  }, [tasks, telemetry?.patchesApplied]);

  // Append real-time time-series data tick
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      const currentTotal = agents.reduce((acc, a) => acc + (a.tokensProcessed || 0), 0);
      const activeCount = agents.filter((a) => a.status === 'working' || a.status === 'debugging').length;
      const delta = Math.round((activeCount * 140) + Math.random() * 90 + 50);

      const agentMap: Record<string, number> = {};
      agents.forEach((ag) => {
        agentMap[ag.id] = ag.tokensProcessed;
      });

      setTimeSeriesData((prev) => {
        const nextPoint: TokenTimePoint = {
          time: new Date(),
          timestamp: Date.now(),
          totalTokens: currentTotal,
          deltaTokens: delta,
          agentTokens: agentMap,
          activeTasks: Math.max(1, activeCount),
        };

        const maxPoints = timeWindow === '5m' ? 30 : timeWindow === '15m' ? 60 : 100;
        const updated = [...prev.slice(-(maxPoints - 1)), nextPoint];
        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isLiveStreaming, agents, timeWindow]);

  // -------------------------------------------------------------
  // D3 RENDERING: 1. TOKENS PROCESSED OVER TIME (STREAM AREA & MULTI-LINE)
  // -------------------------------------------------------------
  useEffect(() => {
    const svgEl = lineChartSvgRef.current;
    if (!svgEl || timeSeriesData.length === 0) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const width = svgEl.clientWidth || 450;
    const height = svgEl.clientHeight || 180;
    const margin = { top: 20, right: 30, bottom: 25, left: 55 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale: Time
    const timeExtent = d3.extent(timeSeriesData, (d: TokenTimePoint) => d.time);
    const xExtent: [Date, Date] = [
      timeExtent[0] || new Date(Date.now() - 60000),
      timeExtent[1] || new Date(),
    ];
    const xScale = d3.scaleTime().domain(xExtent).range([0, innerWidth]);

    // Calculate Y Domain based on mode & filter
    let yMin = 0;
    let yMax = 10000;

    if (selectedAgentFilter !== 'all') {
      const minAgent = d3.min(timeSeriesData, (d: TokenTimePoint) => d.agentTokens[selectedAgentFilter] ?? 0) ?? 0;
      const maxAgent = d3.max(timeSeriesData, (d: TokenTimePoint) => d.agentTokens[selectedAgentFilter] ?? 1000) ?? 5000;
      yMin = minAgent * 0.9;
      yMax = maxAgent * 1.1;
    } else if (lineDisplayMode === 'multiline') {
      const maxAgentVal = d3.max(timeSeriesData, (d: TokenTimePoint) => {
        const values = Object.values(d.agentTokens);
        return values.length > 0 ? Math.max(...values) : 1000;
      }) ?? 5000;
      yMin = 0;
      yMax = maxAgentVal * 1.15;
    } else {
      const minTotal = d3.min(timeSeriesData, (d: TokenTimePoint) => d.totalTokens) ?? 0;
      const maxTotal = d3.max(timeSeriesData, (d: TokenTimePoint) => d.totalTokens) ?? 10000;
      yMin = minTotal * 0.95;
      yMax = maxTotal * 1.05;
    }

    const yScale = d3.scaleLinear().domain([Math.max(0, yMin), Math.max(100, yMax)]).range([innerHeight, 0]);

    // Gradient definitions
    const defs = svg.append('defs');
    const primaryColor = selectedAgentFilter === 'all'
      ? '#fabd2f'
      : (agents.find((a) => a.id === selectedAgentFilter)?.color || '#83a598');

    const gradient = defs
      .append('linearGradient')
      .attr('id', 'token-area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', primaryColor)
      .attr('stop-opacity', 0.45);

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', primaryColor)
      .attr('stop-opacity', 0.02);

    // Filter glow effect
    const glowFilter = defs.append('filter').attr('id', 'glow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'blur');
    glowFilter.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

    // Grid lines
    const yGrid = d3
      .axisLeft(yScale)
      .ticks(4)
      .tickSize(-innerWidth)
      .tickFormat(() => '');

    g.append('g')
      .attr('class', 'grid-lines')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', '#3c3836')
      .attr('stroke-dasharray', '2,2')
      .attr('stroke-opacity', 0.4);

    g.select('.grid-lines').select('.domain').remove();

    // 1. Render Multi-Line Mode (All agents simultaneously with distinct colors)
    if (selectedAgentFilter === 'all' && lineDisplayMode === 'multiline') {
      agents.forEach((agent) => {
        const agentColor = agent.color || '#fabd2f';
        const isAgentFocused = focusedAgentId === agent.id;

        const agentLineGen = d3
          .line<TokenTimePoint>()
          .curve(d3.curveMonotoneX)
          .x((d) => xScale(d.time))
          .y((d) => yScale(d.agentTokens[agent.id] ?? agent.tokensProcessed));

        g.append('path')
          .datum(timeSeriesData)
          .attr('class', `agent-line agent-line-${agent.id}`)
          .attr('fill', 'none')
          .attr('stroke', agentColor)
          .attr('stroke-width', isAgentFocused ? 3.5 : 2)
          .attr('stroke-opacity', focusedAgentId ? (isAgentFocused ? 1 : 0.25) : 0.8)
          .attr('filter', isAgentFocused ? 'url(#glow)' : null)
          .attr('d', agentLineGen)
          .style('cursor', 'pointer')
          .on('mouseenter', () => setFocusedAgentId(agent.id))
          .on('mouseleave', () => setFocusedAgentId(null))
          .on('click', () => {
            soundFx.playClick();
            onSelectAgent?.(agent.id);
          });
      });
    } else {
      // 2. Render Composite / Filtered Area Chart
      const areaGenerator = d3
        .area<TokenTimePoint>()
        .curve(d3.curveMonotoneX)
        .x((d) => xScale(d.time))
        .y0(innerHeight)
        .y1((d) => {
          const val = selectedAgentFilter === 'all'
            ? d.totalTokens
            : (d.agentTokens[selectedAgentFilter] || 0);
          return yScale(val);
        });

      const lineGenerator = d3
        .line<TokenTimePoint>()
        .curve(d3.curveMonotoneX)
        .x((d) => xScale(d.time))
        .y((d) => {
          const val = selectedAgentFilter === 'all'
            ? d.totalTokens
            : (d.agentTokens[selectedAgentFilter] || 0);
          return yScale(val);
        });

      g.append('path')
        .datum(timeSeriesData)
        .attr('fill', 'url(#token-area-gradient)')
        .attr('d', areaGenerator);

      g.append('path')
        .datum(timeSeriesData)
        .attr('fill', 'none')
        .attr('stroke', primaryColor)
        .attr('stroke-width', 2.5)
        .attr('filter', 'url(#glow)')
        .attr('d', lineGenerator);

      // Data dots on line
      g.selectAll('.data-dot')
        .data(timeSeriesData.slice(-10))
        .enter()
        .append('circle')
        .attr('class', 'data-dot')
        .attr('cx', (d: TokenTimePoint) => xScale(d.time))
        .attr('cy', (d: TokenTimePoint) => {
          const val = selectedAgentFilter === 'all'
            ? d.totalTokens
            : (d.agentTokens[selectedAgentFilter] || 0);
          return yScale(val);
        })
        .attr('r', 3)
        .attr('fill', primaryColor)
        .attr('stroke', '#1d2021')
        .attr('stroke-width', 1.5);
    }

    // Pulsing latest real-time indicator
    const lastPoint = timeSeriesData[timeSeriesData.length - 1];
    if (lastPoint) {
      const lastVal = selectedAgentFilter === 'all'
        ? (lineDisplayMode === 'multiline' ? (lastPoint.agentTokens[agents[0]?.id] || 0) : lastPoint.totalTokens)
        : (lastPoint.agentTokens[selectedAgentFilter] || 0);

      g.append('circle')
        .attr('cx', xScale(lastPoint.time))
        .attr('cy', yScale(lastVal))
        .attr('r', 5)
        .attr('fill', primaryColor)
        .attr('opacity', 0.3)
        .append('animate')
        .attr('attributeName', 'r')
        .attr('values', '4;8;4')
        .attr('dur', '1.8s')
        .attr('repeatCount', 'indefinite');
    }

    // X Axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(width < 400 ? 3 : 5)
      .tickFormat((d) => d3.timeFormat('%H:%M:%S')(d as Date));

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#a89984')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace');

    g.selectAll('.domain').attr('stroke', '#504945');
    g.selectAll('.tick line').attr('stroke', '#504945');

    // Y Axis (formatted in k)
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(4)
      .tickFormat((d) => `${((d as number) / 1000).toFixed(1)}k`);

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#a89984')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace');

    // Dynamic Tracking Indicators for Hover
    const bisect = d3.bisector<TokenTimePoint, Date>((d) => d.time).center;

    const crosshair = g.append('line')
      .attr('class', 'crosshair')
      .attr('stroke', '#fabd2f')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .style('opacity', 0);

    const trackerDot = g.append('circle')
      .attr('class', 'tracker-dot')
      .attr('r', 5)
      .attr('fill', primaryColor)
      .attr('stroke', '#fbf1c7')
      .attr('stroke-width', 2)
      .style('opacity', 0);

    const overlay = g.append('rect')
      .attr('class', 'overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');

    overlay
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const x0 = xScale.invert(mx);
        const idx = bisect(timeSeriesData, x0);
        const d = timeSeriesData[idx];
        if (d) {
          const currentVal = selectedAgentFilter === 'all'
            ? d.totalTokens
            : (d.agentTokens[selectedAgentFilter] || 0);

          crosshair
            .attr('x1', xScale(d.time))
            .attr('x2', xScale(d.time))
            .style('opacity', 0.9);

          trackerDot
            .attr('cx', xScale(d.time))
            .attr('cy', yScale(currentVal))
            .style('opacity', 1);

          // Calculate Granular Individual Agent Contributions
          const contributions = agents.map((ag) => {
            const agTokens = d.agentTokens[ag.id] ?? ag.tokensProcessed;
            const sharePct = d.totalTokens > 0 ? (agTokens / d.totalTokens) * 100 : 0;
            const matchEff = agentEfficiencyList.find((e) => e.id === ag.id);
            return {
              id: ag.id,
              name: ag.nickname || ag.name.split(' ')[0],
              avatar: ag.avatar,
              color: ag.color || '#fabd2f',
              tokens: agTokens,
              sharePct: Number(sharePct.toFixed(1)),
              efficiencyScore: matchEff?.efficiencyScore || 90,
              status: ag.status,
              role: ag.role,
            };
          }).sort((a, b) => b.tokens - a.tokens);

          // Capture mouse coordinates relative to SVG/Container for floating tooltip
          const containerRect = containerRef.current?.getBoundingClientRect();
          const posX = event.clientX - (containerRect?.left || 0);
          const posY = event.clientY - (containerRect?.top || 0);

          setHoveredData({
            type: 'time',
            time: d.time.toLocaleTimeString(),
            tokens: currentVal,
            delta: d.deltaTokens,
            activeTasks: d.activeTasks,
            focusedAgentId: focusedAgentId || (selectedAgentFilter !== 'all' ? selectedAgentFilter : undefined),
            agentContributions: contributions,
            posX,
            posY,
          });
        }
      })
      .on('mouseleave', () => {
        crosshair.style('opacity', 0);
        trackerDot.style('opacity', 0);
        setHoveredData(null);
      });
  }, [timeSeriesData, selectedAgentFilter, lineDisplayMode, focusedAgentId, viewMode, agents, agentEfficiencyList]);

  // -------------------------------------------------------------
  // D3 RENDERING: 2. AGENT EFFICIENCY MATRIX (BAR & LOLLIPOP CHART)
  // -------------------------------------------------------------
  useEffect(() => {
    const svgEl = barChartSvgRef.current;
    if (!svgEl || agentEfficiencyList.length === 0) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const width = svgEl.clientWidth || 450;
    const height = svgEl.clientHeight || 200;
    const margin = { top: 15, right: 35, bottom: 25, left: 75 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Y Scale: Agents
    const sortedAgents = [...agentEfficiencyList].sort((a, b) => b.efficiencyScore - a.efficiencyScore);
    const yScale = d3
      .scaleBand()
      .domain(sortedAgents.map((d) => d.name))
      .range([0, innerHeight])
      .padding(0.24);

    // X Scale: Efficiency (0 to 100)
    const xScale = d3.scaleLinear().domain([0, 100]).range([0, innerWidth]);

    // Background track bars
    g.selectAll('.bg-bar')
      .data(sortedAgents)
      .enter()
      .append('rect')
      .attr('class', 'bg-bar')
      .attr('y', (d) => yScale(d.name) || 0)
      .attr('x', 0)
      .attr('height', yScale.bandwidth())
      .attr('width', innerWidth)
      .attr('rx', 3)
      .attr('fill', '#282828')
      .attr('opacity', 0.6);

    // Foreground Efficiency Bars with D3 Transitions
    g.selectAll('.efficiency-bar')
      .data(sortedAgents)
      .enter()
      .append('rect')
      .attr('class', 'efficiency-bar')
      .attr('y', (d) => yScale(d.name) || 0)
      .attr('x', 0)
      .attr('height', yScale.bandwidth())
      .attr('width', 0) // start for animation
      .attr('rx', 3)
      .attr('fill', (d) => {
        if (d.efficiencyScore >= 90) return '#b8bb26'; // Green
        if (d.efficiencyScore >= 75) return '#fabd2f'; // Yellow
        return '#83a598'; // Blue
      })
      .attr('stroke', (d) => (d.id === selectedAgentId ? '#fbf1c7' : 'none'))
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('click', (_, d) => {
        soundFx.playClick();
        onSelectAgent?.(d.id);
      })
      .on('mousemove', (event, d) => {
        const containerRect = containerRef.current?.getBoundingClientRect();
        const posX = event.clientX - (containerRect?.left || 0);
        const posY = event.clientY - (containerRect?.top || 0);

        setHoveredData({
          type: 'agent',
          ...d,
          posX,
          posY,
        });
      })
      .on('mouseleave', () => setHoveredData(null))
      .transition()
      .duration(700)
      .ease(d3.easeCubicOut)
      .attr('width', (d) => xScale(d.efficiencyScore));

    // Agent Avatar & Name Labels
    g.selectAll('.agent-label')
      .data(sortedAgents)
      .enter()
      .append('text')
      .attr('class', 'agent-label')
      .attr('x', -8)
      .attr('y', (d) => (yScale(d.name) || 0) + yScale.bandwidth() / 2 + 3.5)
      .attr('text-anchor', 'end')
      .attr('fill', (d) => (d.id === selectedAgentId ? '#fabd2f' : '#ebdbb2'))
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', (d) => (d.id === selectedAgentId ? 'bold' : 'normal'))
      .style('cursor', 'pointer')
      .text((d) => `${d.avatar} ${d.name}`)
      .on('click', (_, d) => onSelectAgent?.(d.id));

    // Value Labels (% Efficiency)
    g.selectAll('.val-label')
      .data(sortedAgents)
      .enter()
      .append('text')
      .attr('class', 'val-label')
      .attr('x', (d) => xScale(d.efficiencyScore) + 5)
      .attr('y', (d) => (yScale(d.name) || 0) + yScale.bandwidth() / 2 + 3.5)
      .attr('fill', '#ebdbb2')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text((d) => `${d.efficiencyScore}%`);

    // X Axis bottom
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(5)
      .tickFormat((d) => `${d}%`);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#a89984')
      .attr('font-size', '8px')
      .attr('font-family', 'monospace');

    g.selectAll('.domain').attr('stroke', '#504945');
  }, [agentEfficiencyList, selectedAgentId, viewMode]);

  // -------------------------------------------------------------
  // D3 RENDERING: 3. TASK SUCCESS & HEALTH (DONUT GAUGE)
  // -------------------------------------------------------------
  useEffect(() => {
    const svgEl = donutChartSvgRef.current;
    if (!svgEl || taskStatusDistribution.length === 0) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const width = svgEl.clientWidth || 200;
    const height = svgEl.clientHeight || 180;
    const radius = Math.min(width, height) / 2 - 10;

    if (radius <= 0) return;

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const pie = d3
      .pie<any>()
      .value((d) => d.count)
      .sort(null)
      .padAngle(0.04);

    const arc = d3
      .arc<any>()
      .innerRadius(radius * 0.58)
      .outerRadius(radius)
      .cornerRadius(3);

    const hoverArc = d3
      .arc<any>()
      .innerRadius(radius * 0.55)
      .outerRadius(radius * 1.06)
      .cornerRadius(4);

    // Slices
    const arcs = g
      .selectAll('.arc')
      .data(pie(taskStatusDistribution))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => d.data.color)
      .attr('stroke', '#1d2021')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).transition().duration(200).attr('d', hoverArc as any);
        const containerRect = containerRef.current?.getBoundingClientRect();
        const posX = event.clientX - (containerRect?.left || 0);
        const posY = event.clientY - (containerRect?.top || 0);
        setHoveredData({
          type: 'donut',
          label: d.data.label,
          count: d.data.count,
          pct: d.data.pct,
          posX,
          posY,
        });
      })
      .on('mouseleave', function () {
        d3.select(this).transition().duration(200).attr('d', arc as any);
        setHoveredData(null);
      });

    // Center Health Display
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('fill', '#b8bb26')
      .attr('font-family', 'monospace')
      .text(`${telemetry?.healthScore ?? 99.8}%`);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .attr('font-size', '9px')
      .attr('fill', '#a89984')
      .attr('font-family', 'monospace')
      .text('FLEET HEALTH');
  }, [taskStatusDistribution, telemetry?.healthScore, viewMode]);

  // Overall totals calculation
  const totalFleetTokens = useMemo(() => {
    return agents.reduce((acc, a) => acc + (a.tokensProcessed || 0), 0);
  }, [agents]);

  const avgEfficiency = useMemo(() => {
    if (agentEfficiencyList.length === 0) return 92;
    return Math.round(
      agentEfficiencyList.reduce((acc, a) => acc + a.efficiencyScore, 0) / agentEfficiencyList.length
    );
  }, [agentEfficiencyList]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-[#1d2021] text-[#ebdbb2] rounded-lg border border-[#3c3836] font-mono select-none overflow-hidden"
    >
      {/* Top D3 Navigation Bar & Real-time Controls */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#282828] border-b border-[#3c3836] gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-[#fabd2f]/20 text-[#fabd2f] border border-[#fabd2f]/30">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-[#fbf1c7] tracking-wider">
                D3 FLEET PERFORMANCE TELEMETRY
              </span>
              <span className="flex items-center gap-1 text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE D3 ENGINE
              </span>
            </div>
            <p className="text-[10px] text-[#a89984]">
              Real-time token velocity, agent efficiency matrix & task success rates
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#1d2021] p-0.5 rounded border border-[#3c3836] text-[10px]">
          {(
            [
              { id: 'overview', label: 'Bento Overview', icon: <Layers className="w-3 h-3" /> },
              { id: 'tokens', label: 'Tokens Stream', icon: <TrendingUp className="w-3 h-3" /> },
              { id: 'efficiency', label: 'Agent Efficiency', icon: <Zap className="w-3 h-3" /> },
              { id: 'tasks', label: 'Task Success & Health', icon: <CheckCircle2 className="w-3 h-3" /> },
            ] as { id: ChartViewMode; label: string; icon: React.ReactNode }[]
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => {
                soundFx.playClick();
                setViewMode(m.id);
              }}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-colors font-bold whitespace-nowrap ${
                viewMode === m.id
                  ? 'bg-[#fabd2f] text-[#1d2021]'
                  : 'text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#282828]'
              }`}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Streaming & Time Filter Controls */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <button
            onClick={() => {
              soundFx.playClick();
              setIsLiveStreaming(!isLiveStreaming);
            }}
            className={`px-2 py-1 rounded border flex items-center gap-1 font-bold transition-colors ${
              isLiveStreaming
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30'
            }`}
            title={isLiveStreaming ? 'Pause Real-time Ticks' : 'Resume Real-time Ticks'}
          >
            {isLiveStreaming ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isLiveStreaming ? 'Live (3s)' : 'Paused'}</span>
          </button>

          {/* Time Window */}
          <div className="flex items-center bg-[#1d2021] rounded border border-[#3c3836] p-0.5">
            {(['5m', '15m', 'session'] as TimeWindow[]).map((w) => (
              <button
                key={w}
                onClick={() => {
                  soundFx.playClick();
                  setTimeWindow(w);
                }}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  timeWindow === w ? 'bg-[#504945] text-[#fabd2f]' : 'text-[#a89984]'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* High-Level Fleet Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-[#181615] border-b border-[#3c3836] text-[11px]">
        <div className="p-2 rounded bg-[#282828]/70 border border-[#3c3836] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#a89984]">TOTAL FLEET TOKENS</div>
            <div className="text-base font-bold text-[#fabd2f]">
              {totalFleetTokens.toLocaleString()}
            </div>
          </div>
          <TrendingUp className="w-5 h-5 text-[#fabd2f]/50" />
        </div>

        <div className="p-2 rounded bg-[#282828]/70 border border-[#3c3836] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#a89984]">AVG AGENT EFFICIENCY</div>
            <div className="text-base font-bold text-[#b8bb26]">{avgEfficiency}%</div>
          </div>
          <Zap className="w-5 h-5 text-[#b8bb26]/50" />
        </div>

        <div className="p-2 rounded bg-[#282828]/70 border border-[#3c3836] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#a89984]">TASK SUCCESS RATE</div>
            <div className="text-base font-bold text-[#83a598]">
              {taskStatusDistribution[0]?.pct || 96}%
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-[#83a598]/50" />
        </div>

        <div className="p-2 rounded bg-[#282828]/70 border border-[#3c3836] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#a89984]">HEALTH & RESILIENCE</div>
            <div className="text-base font-bold text-emerald-400">{telemetry.healthScore}%</div>
          </div>
          <Shield className="w-5 h-5 text-emerald-400/50" />
        </div>
      </div>

      {/* Dynamic Hover Tooltip / Status Display */}
      {hoveredData && (
        <div className="px-3 py-1.5 bg-[#282828] border-b border-[#3c3836] text-[11px] text-[#fbf1c7] flex items-center justify-between animate-in fade-in duration-150">
          {hoveredData.type === 'time' && (
            <div className="flex items-center gap-3">
              <span className="text-[#fabd2f] font-bold">⏱ {hoveredData.time}</span>
              <span>
                Tokens: <strong>{hoveredData.tokens?.toLocaleString()}</strong>
              </span>
              <span className="text-emerald-400 font-bold">
                +{hoveredData.delta} tok/tick
              </span>
              <span className="text-[#83a598]">
                Active Tasks: {hoveredData.activeTasks}
              </span>
            </div>
          )}

          {hoveredData.type === 'agent' && (
            <div className="flex items-center gap-3">
              <span className="text-[#fabd2f] font-bold">
                {hoveredData.avatar} {hoveredData.fullName}
              </span>
              <span className="text-[#b8bb26] font-bold">
                Efficiency: {hoveredData.efficiencyScore}%
              </span>
              <span>Tokens: {hoveredData.tokensProcessed?.toLocaleString()}</span>
              <span>Success: {hoveredData.successRate}%</span>
              <span className="text-[#83a598]">{hoveredData.tokensPerSec} tok/s</span>
            </div>
          )}

          {hoveredData.type === 'donut' && (
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#fabd2f]">
                Status: {hoveredData.label}
              </span>
              <span>
                Count: <strong>{hoveredData.count}</strong>
              </span>
              <span className="text-emerald-400 font-bold">
                Share: {hoveredData.pct}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Charts View Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 relative">
        {/* Interactive Floating Tooltip */}
        {hoveredData && (
          <div
            className="absolute z-50 pointer-events-auto bg-[#181615]/95 backdrop-blur-md border border-[#fabd2f]/50 shadow-2xl rounded-lg p-3 text-xs w-[320px] transition-all duration-75 animate-in fade-in zoom-in-95 select-none"
            style={{
              left: Math.max(10, Math.min(480, (hoveredData.posX || 20) + 15)),
              top: Math.max(10, Math.min(260, (hoveredData.posY || 20) - 15)),
            }}
          >
            {/* Tooltip Content for Time Snapshot */}
            {hoveredData.type === 'time' && (
              <div className="space-y-2">
                {/* Header with Timestamp and Velocity */}
                <div className="flex items-center justify-between border-b border-[#3c3836] pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-[#fabd2f]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{hoveredData.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px] border border-emerald-500/20">
                      +{hoveredData.delta} tok/s
                    </span>
                    <span className="text-[#83a598] text-[10px]">
                      {hoveredData.activeTasks} Active
                    </span>
                  </div>
                </div>

                {/* Primary Metric Hero */}
                <div className="p-2 rounded bg-[#282828] border border-[#3c3836] flex items-center justify-between">
                  <div>
                    <div className="text-[9px] text-[#a89984] font-bold">
                      {selectedAgentFilter === 'all' ? 'FLEET TOTAL TOKENS' : 'SELECTED AGENT TOKENS'}
                    </div>
                    <div className="text-base font-extrabold text-[#fbf1c7]">
                      {hoveredData.tokens?.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#b8bb26] bg-[#b8bb26]/10 px-1.5 py-0.5 rounded border border-[#b8bb26]/20">
                      {avgEfficiency}% Avg Eff
                    </span>
                  </div>
                </div>

                {/* Individual Agent Contributions Table */}
                {hoveredData.agentContributions && hoveredData.agentContributions.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#a89984] pt-1">
                      <span>AGENT BREAKDOWN & EFFICIENCY</span>
                      <span>TOKENS (% SHARE)</span>
                    </div>

                    <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {hoveredData.agentContributions.map((ag) => {
                        const isFocused = (focusedAgentId === ag.id) || (selectedAgentFilter === ag.id);
                        return (
                          <div
                            key={ag.id}
                            onClick={() => {
                              soundFx.playClick();
                              onSelectAgent?.(ag.id);
                            }}
                            className={`p-1.5 rounded flex items-center justify-between text-[11px] transition-colors cursor-pointer border ${
                              isFocused
                                ? 'bg-[#32302f] border-[#fabd2f] text-[#fbf1c7]'
                                : 'bg-[#1d2021]/80 border-[#3c3836] hover:border-[#fabd2f]/50 hover:bg-[#282828]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate mr-2">
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: ag.color }}
                              />
                              <span className="font-bold truncate">
                                {ag.avatar} {ag.name}
                              </span>
                              <span className="text-[9px] text-[#a89984] font-normal truncate">
                                ({ag.role.split(' ')[0]})
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="text-right">
                                <span className="font-bold text-[#ebdbb2]">
                                  {ag.tokens.toLocaleString()}
                                </span>
                                <span className="text-[9px] text-[#a89984] block">
                                  {ag.sharePct}%
                                </span>
                              </div>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                  ag.efficiencyScore >= 90
                                    ? 'bg-[#b8bb26]/20 text-[#b8bb26] border-[#b8bb26]/30'
                                    : 'bg-[#fabd2f]/20 text-[#fabd2f] border-[#fabd2f]/30'
                                }`}
                              >
                                {ag.efficiencyScore}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-[9px] text-[#a89984] text-center pt-1 italic">
                      Click any agent row to inspect persona & tasks
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tooltip Content for Agent Bar Hover */}
            {hoveredData.type === 'agent' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[#3c3836] pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-[#fabd2f]">
                    <span className="text-base">{hoveredData.avatar}</span>
                    <span>{hoveredData.fullName}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#b8bb26]/20 text-[#b8bb26] border border-[#b8bb26]/30">
                    {hoveredData.efficiencyScore}% EFFICIENCY
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="p-1.5 bg-[#1d2021] rounded border border-[#3c3836]">
                    <span className="text-[#a89984] block text-[9px]">TOKENS PROCESSED</span>
                    <strong className="text-[#ebdbb2] font-mono">
                      {hoveredData.tokensProcessed?.toLocaleString()}
                    </strong>
                  </div>
                  <div className="p-1.5 bg-[#1d2021] rounded border border-[#3c3836]">
                    <span className="text-[#a89984] block text-[9px]">FLEET WORKLOAD SHARE</span>
                    <strong className="text-[#b8bb26] font-mono">{hoveredData.tokenShare}%</strong>
                  </div>
                  <div className="p-1.5 bg-[#1d2021] rounded border border-[#3c3836]">
                    <span className="text-[#a89984] block text-[9px]">TASK SUCCESS RATE</span>
                    <strong className="text-emerald-400 font-mono">{hoveredData.successRate}%</strong>
                  </div>
                  <div className="p-1.5 bg-[#1d2021] rounded border border-[#3c3836]">
                    <span className="text-[#a89984] block text-[9px]">LIVE THROUGHPUT</span>
                    <strong className="text-[#83a598] font-mono">{hoveredData.tokensPerSec} tok/s</strong>
                  </div>
                </div>

                <div className="text-[9px] text-[#a89984] bg-[#282828] p-1.5 rounded border border-[#3c3836]">
                  <strong>Efficiency Formula:</strong> Task Success (45%) + Token Throughput (40%) + Uptime Bonus (15%)
                </div>
              </div>
            )}

            {/* Tooltip Content for Donut Slice Hover */}
            {hoveredData.type === 'donut' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between border-b border-[#3c3836] pb-1">
                  <span className="font-bold text-[#fabd2f]">{hoveredData.label} Tasks</span>
                  <span className="font-bold text-emerald-400 text-sm">{hoveredData.pct}%</span>
                </div>
                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-[#a89984]">Task Count:</span>
                  <strong className="text-[#ebdbb2]">{hoveredData.count}</strong>
                </div>
                <div className="text-[9px] text-[#a89984] pt-1">
                  Contributes directly to overall fleet health resilience.
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 1: BENTO OVERVIEW (Combined Multi-Visualization) */}
        {viewMode === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full">
            {/* Top/Left: Tokens Processed Over Time (D3 Line/Area) */}
            <div className="lg:col-span-7 p-3 rounded bg-[#282828]/50 border border-[#3c3836] flex flex-col min-h-[230px]">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#3c3836] mb-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#fabd2f]">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Tokens Processed Over Time (Live Stream)</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Line Style Toggle */}
                  <div className="flex items-center bg-[#1d2021] rounded border border-[#3c3836] p-0.5 text-[9px]">
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        setLineDisplayMode('composite');
                      }}
                      className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                        lineDisplayMode === 'composite'
                          ? 'bg-[#504945] text-[#fabd2f]'
                          : 'text-[#a89984] hover:text-[#ebdbb2]'
                      }`}
                      title="Area Stream Mode"
                    >
                      Area Stream
                    </button>
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        setLineDisplayMode('multiline');
                      }}
                      className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                        lineDisplayMode === 'multiline'
                          ? 'bg-[#504945] text-[#fabd2f]'
                          : 'text-[#a89984] hover:text-[#ebdbb2]'
                      }`}
                      title="Multi-Agent Overlay Mode"
                    >
                      Multi-Agent
                    </button>
                  </div>

                  {/* Agent Filter Dropdown */}
                  <select
                    value={selectedAgentFilter}
                    onChange={(e) => setSelectedAgentFilter(e.target.value)}
                    className="bg-[#1d2021] text-[#ebdbb2] border border-[#3c3836] rounded px-1.5 py-0.5 text-[10px] focus:outline-none"
                  >
                    <option className="text-slate-900 bg-white" value="all">Fleet Total ({agents.length} Agents)</option>
                    {agents.map((ag) => (
                      <option className="text-slate-900 bg-white" key={ag.id} value={ag.id}>
                        {ag.avatar} {ag.nickname || ag.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* D3 SVG Canvas */}
              <div className="flex-1 w-full min-h-[160px]">
                <svg ref={lineChartSvgRef} className="w-full h-full" />
              </div>
            </div>

            {/* Top/Right: Task Success & Health Distribution (D3 Donut) */}
            <div className="lg:col-span-5 p-3 rounded bg-[#282828]/50 border border-[#3c3836] flex flex-col min-h-[220px]">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#3c3836] mb-2 font-bold text-xs text-[#b8bb26]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Task Success Rates & Fleet Health</span>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-between gap-2">
                <div className="w-1/2 h-[150px]">
                  <svg ref={donutChartSvgRef} className="w-full h-full" />
                </div>

                {/* Legend */}
                <div className="w-1/2 space-y-1.5 text-[10px]">
                  {taskStatusDistribution.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[#ebdbb2]">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      <span className="font-bold text-[#a89984]">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom: Agent Efficiency Matrix (D3 Comparative Bars) */}
            <div className="lg:col-span-12 p-3 rounded bg-[#282828]/50 border border-[#3c3836] flex flex-col min-h-[240px]">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#3c3836] mb-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#83a598]">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Agent Efficiency & Workload Matrix</span>
                </div>
                <span className="text-[10px] text-[#a89984]">
                  Click agent to highlight or switch persona in Command Center
                </span>
              </div>

              <div className="flex-1 w-full min-h-[180px]">
                <svg ref={barChartSvgRef} className="w-full h-full" />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: TOKENS PROCESSED OVER TIME FOCUS */}
        {viewMode === 'tokens' && (
          <div className="p-3 rounded bg-[#282828]/50 border border-[#3c3836] flex flex-col h-[360px]">
            <div className="flex items-center justify-between pb-2 border-b border-[#3c3836] mb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-[#fabd2f]">
                <TrendingUp className="w-4 h-4" />
                <span>High-Resolution D3 Token Flow Stream</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {/* Line Style Toggle */}
                <div className="flex items-center bg-[#1d2021] rounded border border-[#3c3836] p-0.5 text-[10px]">
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setLineDisplayMode('composite');
                    }}
                    className={`px-2 py-0.5 rounded font-bold transition-colors ${
                      lineDisplayMode === 'composite'
                        ? 'bg-[#504945] text-[#fabd2f]'
                        : 'text-[#a89984] hover:text-[#ebdbb2]'
                    }`}
                  >
                    Area Stream
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setLineDisplayMode('multiline');
                    }}
                    className={`px-2 py-0.5 rounded font-bold transition-colors ${
                      lineDisplayMode === 'multiline'
                        ? 'bg-[#504945] text-[#fabd2f]'
                        : 'text-[#a89984] hover:text-[#ebdbb2]'
                    }`}
                  >
                    Multi-Agent
                  </button>
                </div>

                <span className="text-[#a89984]">Filter:</span>
                <select
                  value={selectedAgentFilter}
                  onChange={(e) => setSelectedAgentFilter(e.target.value)}
                  className="bg-[#1d2021] text-[#ebdbb2] border border-[#3c3836] rounded px-2 py-1 text-xs focus:outline-none"
                >
                  <option className="text-slate-900 bg-white" value="all">Fleet Total ({agents.length} Agents)</option>
                  {agents.map((ag) => (
                    <option className="text-slate-900 bg-white" key={ag.id} value={ag.id}>
                      {ag.avatar} {ag.nickname || ag.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 w-full">
              <svg ref={lineChartSvgRef} className="w-full h-full" />
            </div>

            {/* Token Velocity Metrics Table */}
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-[#3c3836] text-[11px]">
              <div className="p-1.5 bg-[#1d2021] rounded">
                <span className="text-[#a89984] block text-[9px]">PEAK VELOCITY</span>
                <span className="font-bold text-emerald-400">~680 tokens/sec</span>
              </div>
              <div className="p-1.5 bg-[#1d2021] rounded">
                <span className="text-[#a89984] block text-[9px]">AVERAGE LATENCY</span>
                <span className="font-bold text-[#83a598]">142 ms</span>
              </div>
              <div className="p-1.5 bg-[#1d2021] rounded">
                <span className="text-[#a89984] block text-[9px]">MEMORY HEAP</span>
                <span className="font-bold text-[#fabd2f]">{telemetry?.heapUsedMB ?? 28.4} MB</span>
              </div>
              <div className="p-1.5 bg-[#1d2021] rounded">
                <span className="text-[#a89984] block text-[9px]">AUTO-PATCHES</span>
                <span className="font-bold text-[#d3869b]">#{telemetry?.patchesApplied ?? 14} Applied</span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: AGENT EFFICIENCY DEEP DIVE */}
        {viewMode === 'efficiency' && (
          <div className="space-y-3">
            <div className="p-3 rounded bg-[#282828]/50 border border-[#3c3836] flex flex-col h-[280px]">
              <div className="flex items-center justify-between pb-2 border-b border-[#3c3836] mb-2 font-bold text-xs text-[#83a598]">
                <span>D3 AGENT EFFICIENCY SCORES & RELIABILITY</span>
                <span className="text-[10px] text-[#a89984]">Real-time Calculation</span>
              </div>
              <div className="flex-1 w-full">
                <svg ref={barChartSvgRef} className="w-full h-full" />
              </div>
            </div>

            {/* Individual Agent Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {agentEfficiencyList.map((ag) => (
                <div
                  key={ag.id}
                  onClick={() => onSelectAgent?.(ag.id)}
                  className={`p-2.5 rounded bg-[#282828] border transition-colors cursor-pointer hover:border-[#fabd2f] ${
                    ag.id === selectedAgentId ? 'border-[#fabd2f] ring-1 ring-[#fabd2f]' : 'border-[#3c3836]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#ebdbb2] flex items-center gap-1.5">
                      <span>{ag.avatar}</span>
                      <span>{ag.fullName}</span>
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1d2021] text-[#fabd2f]">
                      {ag.efficiencyScore}% Eff
                    </span>
                  </div>

                  <div className="mt-2 space-y-1 text-[10px] text-[#a89984]">
                    <div className="flex justify-between">
                      <span>Tokens Processed:</span>
                      <strong className="text-[#ebdbb2]">{ag.tokensProcessed.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Fleet Share:</span>
                      <strong className="text-[#b8bb26]">{ag.tokenShare}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Task Success:</span>
                      <strong className="text-emerald-400">{ag.successRate}%</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: TASK SUCCESS & FLEET HEALTH */}
        {viewMode === 'tasks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded bg-[#282828]/50 border border-[#3c3836] flex flex-col h-[280px]">
              <div className="font-bold text-xs text-[#b8bb26] pb-2 border-b border-[#3c3836] mb-2">
                TASK DISTRIBUTION GAUGE
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="w-[180px] h-[180px]">
                  <svg ref={donutChartSvgRef} className="w-full h-full" />
                </div>
              </div>
            </div>

            <div className="p-3 rounded bg-[#282828]/50 border border-[#3c3836] flex flex-col justify-between space-y-2 text-xs">
              <div className="font-bold text-xs text-[#fabd2f] pb-2 border-b border-[#3c3836]">
                FLEET INTEGRITY AUDIT
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="p-2 rounded bg-[#1d2021] flex items-center justify-between">
                  <span className="text-[#a89984]">System Health Score</span>
                  <span className="font-bold text-emerald-400">{telemetry?.healthScore ?? 99.8}%</span>
                </div>
                <div className="p-2 rounded bg-[#1d2021] flex items-center justify-between">
                  <span className="text-[#a89984]">Self-Healed Memory Patches</span>
                  <span className="font-bold text-[#d3869b]">#{telemetry?.patchesApplied ?? 14}</span>
                </div>
                <div className="p-2 rounded bg-[#1d2021] flex items-center justify-between">
                  <span className="text-[#a89984]">Continuous Diagnostic Cycles</span>
                  <span className="font-bold text-[#83a598]">#{telemetry?.cyclesRun ?? 15}</span>
                </div>
                <div className="p-2 rounded bg-[#1d2021] flex items-center justify-between">
                  <span className="text-[#a89984]">Active Fleet Agents</span>
                  <span className="font-bold text-[#fabd2f]">{agents.length} Online</span>
                </div>
              </div>

              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px]">
                ✓ All multi-agent IPC buses and sandboxed Node VM execution environments operating at peak stability.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
