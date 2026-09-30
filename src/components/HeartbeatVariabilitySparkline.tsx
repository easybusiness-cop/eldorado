import React, { useState, useMemo } from 'react';
import { Activity, Zap, Heart, GitCommit } from 'lucide-react';
import { Agent } from '../types';
import {
  getAgentHeartbeatTelemetry,
  HeartbeatTelemetryPoint,
} from '../utils/agentHeartbeatTelemetry';

interface HeartbeatVariabilitySparklineProps {
  agent: Agent;
  className?: string;
}

export const HeartbeatVariabilitySparkline: React.FC<HeartbeatVariabilitySparklineProps> = ({
  agent,
  className = '',
}) => {
  const telemetry = useMemo(() => getAgentHeartbeatTelemetry(agent), [agent]);
  const [hoveredPoint, setHoveredPoint] = useState<HeartbeatTelemetryPoint | null>(null);

  const { history, currentTokenRate, currentPulseIntensity, currentBpm, hrvMs, correlationCoefficient } = telemetry;

  // Chart Dimensions
  const width = 300;
  const height = 62;
  const paddingX = 6;
  const paddingY = 8;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  // Find min/max for tokenLoad to normalize relative to 0 - max
  const maxTokenLoad = useMemo(() => {
    const max = Math.max(...history.map((p) => p.tokenLoad), 100);
    return Math.max(max, 500);
  }, [history]);

  // Generate SVG coordinates for Pulse Intensity (0 - 100%)
  const pulsePoints = useMemo(() => {
    return history.map((pt, index) => {
      const x = paddingX + (index / (history.length - 1)) * graphWidth;
      const normalizedPulse = Math.min(100, Math.max(0, pt.pulseIntensity));
      const y = paddingY + graphHeight - (normalizedPulse / 100) * graphHeight;
      return { x, y, pt };
    });
  }, [history, graphWidth, graphHeight]);

  // Generate SVG coordinates for Token Load (0 - maxTokenLoad)
  const tokenPoints = useMemo(() => {
    return history.map((pt, index) => {
      const x = paddingX + (index / (history.length - 1)) * graphWidth;
      const normalizedLoad = Math.min(maxTokenLoad, Math.max(0, pt.tokenLoad));
      const y = paddingY + graphHeight - (normalizedLoad / maxTokenLoad) * graphHeight;
      return { x, y, pt };
    });
  }, [history, graphWidth, graphHeight, maxTokenLoad]);

  // Build SVG path strings
  const pulsePathD = useMemo(() => {
    if (pulsePoints.length === 0) return '';
    return pulsePoints.reduce((acc, curr, i) => {
      return i === 0 ? `M ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}` : `${acc} L ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
    }, '');
  }, [pulsePoints]);

  const pulseAreaD = useMemo(() => {
    if (pulsePoints.length === 0) return '';
    const firstX = pulsePoints[0].x.toFixed(1);
    const lastX = pulsePoints[pulsePoints.length - 1].x.toFixed(1);
    const baseY = (paddingY + graphHeight).toFixed(1);
    return `${pulsePathD} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  }, [pulsePathD, pulsePoints, graphHeight]);

  const tokenPathD = useMemo(() => {
    if (tokenPoints.length === 0) return '';
    return tokenPoints.reduce((acc, curr, i) => {
      return i === 0 ? `M ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}` : `${acc} L ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
    }, '');
  }, [tokenPoints]);

  // Interactive mouse move scrub handler
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (clientX - paddingX) / graphWidth));
    const index = Math.round(ratio * (history.length - 1));
    if (history[index]) {
      setHoveredPoint(history[index]);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const activePoint = hoveredPoint || history[history.length - 1];
  const activeX = activePoint
    ? paddingX + ((60 - activePoint.secondsAgo) / 60) * graphWidth
    : paddingX + graphWidth;
  const activePulseY = activePoint
    ? paddingY + graphHeight - (activePoint.pulseIntensity / 100) * graphHeight
    : paddingY + graphHeight * 0.5;

  // Pulse theme color based on status and intensity
  const pulseColor = telemetry.isWorking
    ? currentPulseIntensity > 75
      ? '#ff4da6' // Quantum surge
      : '#00d9ff' // Active high velocity
    : '#34d399'; // Resting steady state

  return (
    <div
      className={`rounded-lg bg-black/50 border border-white/10 p-2.5 space-y-2 select-none font-sans ${className}`}
      data-testid="agent-heartbeat-sparkline"
    >
      {/* Top Header: Title & Heartbeat Variability Stats */}
      <div className="flex items-center justify-between gap-1.5 border-b border-white/10 pb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="relative flex items-center justify-center">
            <Heart
              className="w-3.5 h-3.5 transition-colors duration-300"
              style={{
                color: pulseColor,
                fill: telemetry.isWorking ? `${pulseColor}33` : 'transparent',
              }}
            />
            <span
              className="absolute w-2 h-2 rounded-full animate-ping pointer-events-none opacity-40"
              style={{ backgroundColor: pulseColor }}
            />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-200">
            Heartbeat & Load Telemetry
          </span>
        </div>

        {/* Real-time HRV Metric */}
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-400">
          <span className="text-zinc-500">HRV:</span>
          <span className="text-cyan-300 font-bold">{hrvMs}ms</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-500">Cadence:</span>
          <span className="text-emerald-300 font-bold">{activePoint?.bpm || currentBpm} BPM</span>
        </div>
      </div>

      {/* Micro-Sparkline Graph Canvas */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-[62px] overflow-visible cursor-crosshair block"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Soft vertical gradient for Pulse Intensity area */}
            <linearGradient id={`pulse-grad-${agent.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={pulseColor} stopOpacity={0.35} />
              <stop offset="70%" stopColor={pulseColor} stopOpacity={0.08} />
              <stop offset="100%" stopColor={pulseColor} stopOpacity={0.0} />
            </linearGradient>

            {/* Subtle glow filter */}
            <filter id={`glow-${agent.id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Reference Background Gridlines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="rgba(255, 255, 255, 0.07)"
            strokeDasharray="2 3"
          />
          <line
            x1={paddingX}
            y1={paddingY + graphHeight * 0.5}
            x2={width - paddingX}
            y2={paddingY + graphHeight * 0.5}
            stroke="rgba(255, 255, 255, 0.06)"
            strokeDasharray="2 3"
          />
          <line
            x1={paddingX}
            y1={paddingY + graphHeight}
            x2={width - paddingX}
            y2={paddingY + graphHeight}
            stroke="rgba(255, 255, 255, 0.12)"
          />

          {/* Series 1: Pulse Intensity Filled Area */}
          <path d={pulseAreaD} fill={`url(#pulse-grad-${agent.id})`} />

          {/* Series 2: Token Processing Load (Dashed Amber Curve) */}
          <path
            d={tokenPathD}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.2"
            strokeDasharray="3 2"
            strokeOpacity="0.85"
          />

          {/* Series 1: Pulse Intensity Primary Line (Glowing Cyan/Magenta Line) */}
          <path
            d={pulsePathD}
            fill="none"
            stroke={pulseColor}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#glow-${agent.id})`}
          />

          {/* Scrubbing Cursor Crosshair Hairline */}
          {hoveredPoint && (
            <line
              x1={activeX}
              y1={paddingY}
              x2={activeX}
              y2={paddingY + graphHeight}
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="1"
              strokeDasharray="1 2"
            />
          )}

          {/* Active / Current Point Marker */}
          <circle
            cx={activeX}
            cy={activePulseY}
            r="3.5"
            fill={pulseColor}
            stroke="#12151e"
            strokeWidth="1.5"
            filter={`url(#glow-${agent.id})`}
          />
        </svg>

        {/* Time Domain Labels */}
        <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500 mt-1 px-0.5">
          <span>-60s</span>
          <span className="text-zinc-600">Heartbeat Variability Window</span>
          <span>-30s</span>
          <span className="text-cyan-400 font-bold">Now</span>
        </div>
      </div>

      {/* Correlation & Comparative Load Legend */}
      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-white/5 text-[9px] font-mono">
        {/* Token Processing Load Readout */}
        <div className="flex items-center gap-1 bg-white/[0.03] px-2 py-1 rounded border border-white/5">
          <Zap className="w-3 h-3 text-amber-400 shrink-0" />
          <div className="flex flex-col truncate">
            <span className="text-[7.5px] uppercase text-zinc-500 font-sans font-semibold">
              Token Processing
            </span>
            <span className="text-amber-300 font-bold truncate">
              {(hoveredPoint ? hoveredPoint.tokenLoad : currentTokenRate).toLocaleString()} tok/s
            </span>
          </div>
        </div>

        {/* Pulse Intensity Readout */}
        <div className="flex items-center gap-1 bg-white/[0.03] px-2 py-1 rounded border border-white/5">
          <Activity className="w-3 h-3 text-cyan-400 shrink-0" />
          <div className="flex flex-col truncate">
            <span className="text-[7.5px] uppercase text-zinc-500 font-sans font-semibold">
              Pulse Intensity
            </span>
            <span className="text-cyan-300 font-bold truncate">
              {hoveredPoint ? hoveredPoint.pulseIntensity : currentPulseIntensity}%
              <span className="text-zinc-500 text-[8px] ml-1 font-normal">
                ({activePoint?.bpm || currentBpm} bpm)
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Correlation Metric Footer */}
      <div className="flex items-center justify-between text-[8.5px] font-mono bg-cyan-950/20 border border-cyan-500/20 rounded px-2 py-1 text-zinc-300">
        <div className="flex items-center gap-1">
          <GitCommit className="w-3 h-3 text-cyan-400" />
          <span>
            Correlation: <strong className="text-cyan-300 font-bold">r = +{correlationCoefficient}</strong>
          </span>
        </div>
        <span className="text-zinc-400 text-[8px] italic truncate max-w-[150px]">
          {telemetry.correlationLabel}
        </span>
      </div>
    </div>
  );
};
