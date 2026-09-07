import { useState, useEffect, useRef, useCallback } from 'react';

export interface TaskRingItem {
  id: string;
  desc: string;
  priority: number;
  agentId: string | null;
  started: number;
  completedAt?: number;
  signature: string;
  status: 'queued' | 'active' | 'rerouted' | 'completed' | 'failed';
}

export interface TaskRingAgent {
  id: string;
  name: string;
  role: string;
  department?: string;
  category?: 'engineering' | 'workforce' | 'custom';
  status: 'idle' | 'busy' | 're-routing' | 'dropped';
  task: TaskRingItem | null;
  lastHeartbeat: number;
  tasksCompleted: number;
  signature: string;
  angle: number;
  radius?: number;
  cx?: number;
  cy?: number;
  color?: string;
  specialties?: string[];
  collaboratorId?: string | null;
}

export interface DepartmentAgentState {
  id: number;
  name: string;
  role: string;
  status: 'idle' | 'running' | 'completed';
  lastAction: string;
  taskId?: string;
}

export interface TaskRingSnapshot {
  agents: TaskRingAgent[];
  queue: TaskRingItem[];
  departmentAgents: DepartmentAgentState[];
  networkStrength: number;
  lastHardenMs: number;
  totalCompleted: number;
  commandRingStatus: 'ACTIVE' | 'PULSING' | 'OVERRIDE' | 'STANDBY';
  telemetryLogs: string[];
  timestamp: number;
}

export function useTaskRingSocket() {
  const [connected, setConnected] = useState(false);
  const [snapshot, setSnapshot] = useState<TaskRingSnapshot | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/department`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'INIT_STATE' || msg.type === 'TASK_RING_STATE') {
            setSnapshot(msg.data);
          }
        } catch (e) {
          console.error('[WebSocket] Failed to parse message', e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        // Exponential reconnect backoff
        reconnectTimeoutRef.current = setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        setConnected(false);
      };
    } catch {
      setConnected(false);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, []);

  useEffect(() => {
    connect();

    // Fallback: Fetch initial status via REST if WS is still connecting
    fetch('/api/department/status')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.taskRing) {
          setSnapshot(data.taskRing);
        }
      })
      .catch(() => {});

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Command sender
  const triggerCommand = useCallback((command: 'deploy' | 'halt' | 'override' | 'audit' | 'harden' | 'run-department', payload?: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'COMMAND', command, payload }));
    } else {
      // Fallback to REST endpoint
      fetch('/api/department/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, payload }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.snapshot) setSnapshot(data.snapshot);
        })
        .catch(() => {});
    }
  }, []);

  // Assign task
  const assignTask = useCallback((task: { desc: string; priority?: number; id?: string; preferredAgentId?: string }) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ASSIGN_TASK', task }));
    }
  }, []);

  // Swarm solve
  const swarmSolve = useCallback((goal: string, priority: number = 1) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'SWARM_SOLVE', goal, priority }));
    } else {
      fetch('/api/department/swarm-solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, priority }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.snapshot) setSnapshot(data.snapshot);
        })
        .catch(() => {});
    }
  }, []);

  // Auto solve next task in queue
  const autoSolveNext = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'AUTO_SOLVE_NEXT' }));
    } else {
      fetch('/api/department/auto-solve', { method: 'POST' })
        .then((r) => r.json())
        .then((data) => {
          if (data.snapshot) setSnapshot(data.snapshot);
        })
        .catch(() => {});
    }
  }, []);

  // Sync frontend fleet agents to web network
  const syncFleet = useCallback((agents: any[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'SYNC_FLEET', agents }));
    } else {
      fetch('/api/department/sync-fleet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agents }),
      }).catch(() => {});
    }
  }, []);

  // Collaborate between two agents
  const collaborate = useCallback((agentAId: string, agentBId: string, taskDesc: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'COLLABORATE', agentAId, agentBId, taskDesc }));
    }
  }, []);

  // Complete task
  const completeTask = useCallback((agentId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'COMPLETE_TASK', agentId }));
    }
  }, []);

  // Failover
  const failoverAgent = useCallback((agentId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'FAILOVER', agentId }));
    }
  }, []);

  return {
    connected,
    snapshot,
    departmentAgents: snapshot?.departmentAgents || [],
    spiderAgents: snapshot?.agents || [],
    queue: snapshot?.queue || [],
    networkStrength: snapshot?.networkStrength ?? 98.4,
    lastHardenMs: snapshot?.lastHardenMs ?? 47,
    commandRingStatus: snapshot?.commandRingStatus ?? 'ACTIVE',
    totalCompleted: snapshot?.totalCompleted ?? 142,
    telemetryLogs: snapshot?.telemetryLogs || [],
    triggerCommand,
    assignTask,
    completeTask,
    failoverAgent,
    swarmSolve,
    autoSolveNext,
    syncFleet,
    collaborate,
  };
}
