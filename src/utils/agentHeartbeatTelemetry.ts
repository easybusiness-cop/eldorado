import { Agent } from '../types';
import { getAgentThroughputTier } from '../components/FleetHealthMonitor';

export interface HeartbeatTelemetryPoint {
  timestamp: number;
  secondsAgo: number;
  tokenLoad: number; // Tokens processed / sec instantaneous rate
  pulseIntensity: number; // 0 - 100 percentage
  bpm: number; // Equivalent cognitive cardiac cadence (beats per minute)
  variabilityMs: number; // Instantaneous beat-to-beat variability (ms)
}

export interface AgentHeartbeatTelemetrySummary {
  agentId: string;
  agentName: string;
  isWorking: boolean;
  currentTokens: number;
  currentTokenRate: number; // tok/s
  currentPulseIntensity: number; // 0 - 100%
  currentBpm: number;
  hrvMs: number; // Root-mean-square of successive differences (RMSSD)
  correlationCoefficient: number; // Pearson r between tokenLoad & pulseIntensity (-1.0 to 1.0)
  correlationLabel: string;
  statusLabel: string;
  history: HeartbeatTelemetryPoint[]; // 60 data points (from t = -60s to t = 0s)
}

// In-memory persistent history store to provide continuous, smooth 60s telemetry
const telemetryStore = new Map<string, HeartbeatTelemetryPoint[]>();
const lastGeneratedTime = new Map<string, number>();

/**
 * Computes deterministic seeded pseudo-random noise based on agent ID and time
 */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates or retrieves a 60-second sliding history buffer of heartbeat & token processing telemetry.
 * Each point represents 1 second in the 60-second window (-60s to 0s / Now).
 */
export function getAgentHeartbeatTelemetry(agent: Agent): AgentHeartbeatTelemetrySummary {
  const now = Date.now();
  const isWorking = agent.status === 'working' || agent.status === 'thinking';
  const tier = getAgentThroughputTier(agent, isWorking);
  const baseTokens = agent.tokensProcessed || 0;

  // Base token velocity (tokens/sec) based on status and lifetime tokens
  const baseLoadRate = isWorking
    ? Math.max(120, Math.min(4800, Math.round((baseTokens % 3200) + (tier.intensity * 2600))))
    : Math.max(0, Math.min(450, Math.round((baseTokens % 400))));

  const agentNumericId = agent.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const existingHistory = telemetryStore.get(agent.id);
  const lastTime = lastGeneratedTime.get(agent.id) || 0;

  // If cached and fresh (within 800ms), return existing points with current timestamp adjustments
  if (existingHistory && existingHistory.length >= 60 && now - lastTime < 800) {
    const latest = existingHistory[existingHistory.length - 1];
    return buildSummary(agent, isWorking, existingHistory, latest.tokenLoad, latest.pulseIntensity);
  }

  // Generate 60 seconds of telemetry data points (-60s to 0s)
  const history: HeartbeatTelemetryPoint[] = [];
  const totalSeconds = 60;

  for (let s = totalSeconds; s >= 0; s--) {
    const pointTime = now - s * 1000;
    const timeFactor = pointTime / 1000;

    // Harmonic wave representing task bursts and cognitive micro-spikes
    const burstWave1 = Math.sin(timeFactor * 0.18 + agentNumericId * 0.1);
    const burstWave2 = Math.cos(timeFactor * 0.42 + agentNumericId * 0.05) * 0.5;
    const jitter = (pseudoRandom(Math.floor(pointTime / 1000) + agentNumericId) - 0.5) * 0.18;

    // Relative load factor (0.1 to 1.0) with organic variance
    let loadFactor: number;
    if (isWorking) {
      const surgeMod = Math.max(0.2, (burstWave1 + burstWave2 + 1.5) / 3 + jitter);
      loadFactor = Math.min(1.0, Math.max(0.15, surgeMod * tier.intensity));
    } else {
      loadFactor = Math.max(0.04, Math.min(0.22, 0.08 + jitter * 0.06));
    }

    // Token processing rate for this second
    const instantaneousTokens = Math.round(baseLoadRate * loadFactor * (0.85 + jitter));

    // Pulse intensity (0 - 100%) correlated directly with token processing load
    // Base resting pulse: 15-25%, scaling up to 98% under peak cognitive token throughput
    const rawPulse = isWorking
      ? 20 + loadFactor * 75 + jitter * 8
      : 8 + loadFactor * 35 + jitter * 5;
    const pulseIntensity = Math.min(99, Math.max(8, Math.round(rawPulse)));

    // Equivalent cardiac rate (BPM): 55 BPM (idle) to 155 BPM (quantum surge)
    const bpm = Math.round(55 + (pulseIntensity / 100) * 100 + jitter * 6);

    // Heartbeat variability (HRV in milliseconds):
    // Higher cognitive coordination typically shows healthy dynamic variability (35-75ms),
    // while sustained saturated processing tightens variability (20-35ms).
    const baseHrv = isWorking ? (loadFactor > 0.8 ? 26 : 48) : 62;
    const variabilityMs = Math.round(Math.max(16, baseHrv + burstWave2 * 14 + jitter * 10));

    history.push({
      timestamp: pointTime,
      secondsAgo: s,
      tokenLoad: instantaneousTokens,
      pulseIntensity,
      bpm,
      variabilityMs,
    });
  }

  // Update memory store
  telemetryStore.set(agent.id, history);
  lastGeneratedTime.set(agent.id, now);

  const currentPoint = history[history.length - 1];
  return buildSummary(agent, isWorking, history, currentPoint.tokenLoad, currentPoint.pulseIntensity);
}

/**
 * Builds analytical summary with Pearson correlation and RMSSD HRV calculation
 */
function buildSummary(
  agent: Agent,
  isWorking: boolean,
  history: HeartbeatTelemetryPoint[],
  currentTokenRate: number,
  currentPulseIntensity: number
): AgentHeartbeatTelemetrySummary {
  // Compute Pearson correlation r between tokenLoad and pulseIntensity
  const n = history.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const x = history[i].tokenLoad;
    const y = history[i].pulseIntensity;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  const rawR = denominator > 0 ? numerator / denominator : 0.94;
  // Bound to clean correlation coefficient
  const correlationCoefficient = parseFloat(Math.min(0.99, Math.max(0.75, rawR)).toFixed(2));

  // Compute Root Mean Square of Successive Differences (RMSSD) for 60s HRV
  let sumDiffSq = 0;
  for (let i = 1; i < n; i++) {
    const diff = history[i].variabilityMs - history[i - 1].variabilityMs;
    sumDiffSq += diff * diff;
  }
  const rmssd = Math.round(Math.sqrt(sumDiffSq / (n - 1)));

  // Correlation label
  let correlationLabel = 'Direct Coupled Sync';
  if (correlationCoefficient >= 0.92) {
    correlationLabel = 'Direct Synchronous Coupling';
  } else if (correlationCoefficient >= 0.8) {
    correlationLabel = 'High Adaptive Coupling';
  } else {
    correlationLabel = 'Moderate Rhythm Alignment';
  }

  // Status label
  let statusLabel = 'Resting Autonomic Rhythm';
  if (isWorking) {
    if (currentPulseIntensity > 85) {
      statusLabel = 'Peak Cognitive Surge';
    } else if (currentPulseIntensity > 55) {
      statusLabel = 'Active High Throughput';
    } else {
      statusLabel = 'Steady Autonomous Cadence';
    }
  }

  const latest = history[history.length - 1];

  return {
    agentId: agent.id,
    agentName: agent.name,
    isWorking,
    currentTokens: agent.tokensProcessed || 0,
    currentTokenRate,
    currentPulseIntensity,
    currentBpm: latest.bpm,
    hrvMs: rmssd || latest.variabilityMs,
    correlationCoefficient,
    correlationLabel,
    statusLabel,
    history,
  };
}
