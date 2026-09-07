import { WebSocket } from 'ws';

export interface TaskRingItem {
  id: string;
  desc: string;
  priority: number; // 1 (Critical), 2 (High), 3 (Normal)
  agentId: string | null;
  started: number;
  completedAt?: number;
  signature: string;
  status: 'queued' | 'active' | 'rerouted' | 'completed' | 'failed';
  subtasks?: string[];
  collaboratorId?: string | null;
}

export interface TaskRingAgent {
  id: string; // e.g. "A1", "A2", "michael", "dwight", "jim", etc.
  name: string;
  role: string;
  department?: string;
  category: 'engineering' | 'workforce' | 'custom';
  status: 'idle' | 'busy' | 're-routing' | 'dropped';
  task: TaskRingItem | null;
  lastHeartbeat: number;
  tasksCompleted: number;
  signature: string;
  angle: number; // polar angle in degrees
  radius: number; // concentric ring radius
  cx: number;
  cy: number;
  color: string;
  avatar?: string;
  specialties: string[];
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

export class TaskRingEngine {
  private static instance: TaskRingEngine;

  public queue: TaskRingItem[] = [];
  public agents: TaskRingAgent[] = [];
  public departmentAgents: DepartmentAgentState[] = [];
  public networkStrength: number = 98.4;
  public lastHardenMs: number = 47;
  public totalCompleted: number = 142;
  public commandRingStatus: 'ACTIVE' | 'PULSING' | 'OVERRIDE' | 'STANDBY' = 'ACTIVE';

  private subscribers: Set<WebSocket> = new Set();
  private telemetryLogs: string[] = [
    `[${new Date().toLocaleTimeString()}] 🕸️ Universal Agent Mesh online: all workforce & engineering agents connected`,
    `[${new Date().toLocaleTimeString()}] 🔒 Network hardening loop active (every 47ms)`,
    `[${new Date().toLocaleTimeString()}] ⚡ Command Ring status: ACTIVE (green pulse)`,
    `[${new Date().toLocaleTimeString()}] 🚀 Intelligent multi-agent auto-routing & collaborative swarm ready`,
  ];

  private hardeningTimer: NodeJS.Timeout | null = null;
  private autoWorkTimer: NodeJS.Timeout | null = null;
  private monitoringTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initAgents();
    this.initDepartmentAgents();
    this.startHardeningLoop();
    this.startAutonomousPulse();
    this.start47msMonitoringLoop();
  }

  public static getInstance(): TaskRingEngine {
    if (!TaskRingEngine.instance) {
      TaskRingEngine.instance = new TaskRingEngine();
    }
    return TaskRingEngine.instance;
  }

  private initAgents() {
    const CX = 410;
    const CY = 310;

    const calcPos = (angleDeg: number, r: number) => {
      const rad = (angleDeg * Math.PI) / 180;
      return {
        cx: Math.round(CX + r * Math.cos(rad)),
        cy: Math.round(CY + r * Math.sin(rad)),
      };
    };

    // CONNECT EVERY SINGLE AGENT: Engineering Department (10 agents) + Workforce Fleet (9 core agents)
    this.agents = [
      // ==========================================
      // INNER RING: Orchestration & Meta Command (R=130)
      // ==========================================
      {
        id: 'michael',
        name: 'Michael Scott',
        role: 'GOD / Floor Orchestrator',
        department: 'Executive Suite',
        category: 'workforce',
        status: 'busy',
        task: {
          id: 'T-890',
          desc: 'Floor-wide autonomous standup & multi-agent delegation',
          priority: 1,
          agentId: 'michael',
          started: Date.now() - 5000,
          signature: 'sig_ms_890exec',
          status: 'active',
        },
        lastHeartbeat: Date.now(),
        tasksCompleted: 35,
        signature: 'sec-key-ms-exec',
        angle: 270,
        radius: 130,
        ...calcPos(270, 130),
        color: '#fabd2f',
        specialties: ['orchestration', 'leadership', 'strategy', 'standup', 'delegation', 'escalation', 'management'],
      },
      {
        id: 'ENG-10',
        name: 'EngineeringDeptEngineer',
        role: 'Master Orchestration',
        department: 'Autonomous Engineering',
        category: 'engineering',
        status: 'busy',
        task: {
          id: 'T-891',
          desc: 'Full autonomous engineering lifecycle orchestration',
          priority: 1,
          agentId: 'ENG-10',
          started: Date.now() - 3200,
          signature: 'sig_eng10_891arch',
          status: 'active',
        },
        lastHeartbeat: Date.now(),
        tasksCompleted: 28,
        signature: 'sec-key-eng10-arch',
        angle: 330,
        radius: 130,
        ...calcPos(330, 130),
        color: '#83a598',
        specialties: ['lifecycle', 'department', 'autonomous', 'master', 'workflow', 'orchestration', 'engineering'],
      },
      {
        id: 'dwight',
        name: 'Dwight Schrute',
        role: 'Asst. Regional Manager & Enforcer',
        department: 'Operations & Enforcement',
        category: 'workforce',
        status: 'idle',
        task: null,
        lastHeartbeat: Date.now(),
        tasksCompleted: 31,
        signature: 'sec-key-ds-enforce',
        angle: 30,
        radius: 130,
        ...calcPos(30, 130),
        color: '#b8bb26',
        specialties: ['enforcement', 'safety', 'audit', 'operations', 'investigation', 'rules', 'security'],
      },
      {
        id: 'ENG-9',
        name: 'MasterMetaAgent',
        role: 'Autonomous Meta-Learning',
        department: 'Autonomous Engineering',
        category: 'engineering',
        status: 'idle',
        task: null,
        lastHeartbeat: Date.now(),
        tasksCompleted: 22,
        signature: 'sec-key-eng9-meta',
        angle: 90,
        radius: 130,
        ...calcPos(90, 130),
        color: '#d3869b',
        specialties: ['meta', 'evolution', 'self-improvement', 'optimization', 'recursive', 'learning'],
      },
      {
        id: 'ENG-7',
        name: 'NegotiationEngineer',
        role: 'Team Coordination & Consensus',
        department: 'Autonomous Engineering',
        category: 'engineering',
        status: 'idle',
        task: null,
        lastHeartbeat: Date.now(),
        tasksCompleted: 20,
        signature: 'sec-key-eng7-coord',
        angle: 150,
        radius: 130,
        ...calcPos(150, 130),
        color: '#64ffda',
        specialties: ['coordination', 'consensus', 'dispatch', 'delegation', 'negotiation', 'team'],
      },
      {
        id: 'pam',
        name: 'Pam Beesly',
        role: 'Operations & Workflow Dispatcher',
        department: 'Operations',
        category: 'workforce',
        status: 'idle',
        task: null,
        lastHeartbeat: Date.now(),
        tasksCompleted: 26,
        signature: 'sec-key-pb-ops',
        angle: 210,
        radius: 130,
        ...calcPos(210, 130),
        color: '#f472b6',
        specialties: ['operations', 'intake', 'admin', 'dispatch', 'customer', 'support', 'workflow'],
      },

      // ==========================================
      // MID RING: Engineering Technical Specialists (R=210)
      // ==========================================
      {
        id: 'A1',
        name: 'CoreCoder (ENG-1)',
        role: 'MIT-Level Coder',
        department: 'Autonomous Engineering',
        category: 'engineering',
        status: 'busy',
        task: {
          id: 'T-892',
          desc: 'Crimson protocol override & AST code generation',
          priority: 1,
          agentId: 'A1',
          started: Date.now() - 4200,
          signature: 'sig_a1_892fc',
          status: 'active',
        },
        lastHeartbeat: Date.now(),
        tasksCompleted: 24,
        signature: 'sec-key-a1-mit',
        angle: 225,
        radius: 210,
        ...calcPos(225, 210),
        color: '#22ff88',
        specialties: ['code', 'typescript', 'react', 'python', 'refactor', 'algorithm', 'bug', 'implement'],
        collaboratorId: 'A3',
      },
      {
        id: 'A2',
        name: 'RepoArch (ENG-2)',
        role: 'Architecture & Git Engine',
        department: 'Autonomous Engineering',
        category: 'engineering',
        status: 'idle',
        task: null,
        lastHeartbeat: Date.now(),
        tasksCompleted: 19,
        signature: 'sec-key-a2-git',
        angle: 270,
        radius: 210,
        ...calcPos(270, 210),
        color: '#00e5ff',
        specialties: ['git', 'repo', 'branch', 'ast', 'merge', 'pr', 'architecture', 'graph'],
      },
      {
        id: 'A3',
        name: 'SecurityQA (ENG-3)',
        role: 'Testing & QA Validation',
        department: 'Autonomous Engineering',
        category: 'engineering',
        status: 'busy',
        task: {
          id: 'T-893',
          desc: 'Automated test suite & regression validation',
          priority: 1,
          agentId: 'A3',
          started: Date.now() - 2100,
          signature: 'sig_a3_893ad',
          status: 'active',
        },
        lastHeartbeat: Date.now(),
        tasksCompleted: 21,
        signature: 'sec-key-a3-qa',
        angle: 315,
        radius: 210,
        ...calcPos(315, 210),
        color: '#ffdd00',
        specialties: ['test', 'qa', 'assert', 'coverage', 'unit', 'e2e', 'validation', 'bug'],
        collaboratorId: 'A1',
      },
      {
        id: 'A4',
        name: 'SafetyGuard (ENG-4)',
        role: 'Security & Guardrails',
        department: 'Autonomous Engineering',
        category: 'engineering',
        status: 'idle',
        task: null,
        lastHeartbeat: Date.now(),
        tasksCompleted: 16,
        signature: 'sec-key-a4-sec',
        angle: 0,
        radius: 210,
        ...calcPos(0, 210),
        color: '#ff7700',
        specialties: ['security', 'safety', 'guardrails', 'zero-day', 'harden', 'vulnerability', 'firewall'],
      },
      {
        id: 'A5',
        name: 'InfraStaging (ENG-5)',
        role: 'Deployment & Public API',
        department: 'Autonomous Engineering',
        category: 'engineering',
        status: 'idle',
        task: null,
        lastHeartbeat: Date.now(),
        tasksCompleted: 15,
        signature: 'sec-key-a5-inf',
        angle: 45,
        radius: 210,
        ...calcPos(45, 210),
        color: '#b388ff',
        specialties: ['deploy', 'cloud', 'docker', 'api', 'infra', 'kubernetes', 'server', 'staging'],
      },
      {
        id: 'A6',
        name: 'OutcomeEval (ENG-6)',
        role: 'Outcome Metrics & Scoring',
        department: 'Autonomous Engineering',
        category: 'engineering',
        status: 'idle',
        task: null,
        lastHeartbeat: Date.now(),
        tasksCompleted: 18,
        signature: 'sec-key-a6-eval',
        angle: 90,
        radius: 210,
        ...calcPos(90, 210),
        color: '#ff4081',
        specialties: ['evaluation', 'metric', 'benchmark', 'score', 'audit', 'performance', 'accuracy'],
      },
      {
        id: 'A7',
        name: 'ConsensusNode (ENG-7)',
        role: 'Distributed Consensus & Ring Mesh',
        department: 'Autonomous Engineering',
        category: 'engineering',
        status: 'busy',
        task: {
          id: 'T-894',
          desc: 'Distributed consensus sync & packet ring balancing',
          priority: 2,
          agentId: 'A7',
          started: Date.now() - 6000,
          signature: 'sig_a7_8949b',
          status: 'active',
        },
        lastHeartbeat: Date.now(),
        tasksCompleted: 17,
        signature: 'sec-key-a7-coord',
        angle: 135,
        radius: 210,
        ...calcPos(135, 210),
        color: '#64ffda',
        specialties: ['distributed', 'consensus', 'sync', 'coordination', 'ring'],
      },
      {
        id: 'A8',
        name: 'CurriculumMgr (ENG-8)',
        role: 'CSE Syllabus & Skill Growth',
        department: 'Autonomous Engineering',
        category: 'engineering',
        status: 'idle',
        task: null,
        lastHeartbeat: Date.now(),
        tasksCompleted: 12,
        signature: 'sec-key-a8-edu',
        angle: 180,
        radius: 210,
        ...calcPos(180, 210),
        color: '#76ff03',
        specialties: ['curriculum', 'training', 'syllabus', 'skill', 'learning', 'education', 'cse'],
      },

      // ==========================================
      // OUTER RING: Workforce Domain Specialists (R=280)
      // ==========================================
      {
        id: 'jim',
        name: 'Jim Halpert',
        role: 'Senior Sales & Strategic Negotiation',
        department: 'Sales',
        category: 'workforce',
        status: 'idle',
        task: null,
        lastHeartbeat: Date.now(),
        tasksCompleted: 29,
        signature: 'sec-key-jh-sales',
        angle: 290,
        radius: 280,
        ...calcPos(290, 280),
        color: '#38bdf8',
        specialties: ['sales', 'negotiation', 'client', 'deal', 'pitch', 'relationship', 'lead', 'strategy'],
      },
      {
        id: 'stanley',
        name: 'Stanley Hudson',
        role: 'Enterprise Accounts & Pipeline Contracts',
        department: 'Sales',
        category: 'workforce',
        status: 'idle',
        task: null,
        lastHeartbeat: Date.now(),
        tasksCompleted: 23,
        signature: 'sec-key-sh-ent',
        angle: 340,
        radius: 280,
        ...calcPos(340, 280),
        color: '#fb923c',
        specialties: ['enterprise', 'contracts', 'pipeline', 'sales', 'revenue', 'order', 'client'],
      },
      {
        id: 'angela',
        name: 'Angela Martin',
        role: 'Accounting & Financial Audits',
        department: 'Accounting',
        category: 'workforce',
        status: 'idle',
        task: null,
        lastHeartbeat: Date.now(),
        tasksCompleted: 34,
        signature: 'sec-key-am-acct',
        angle: 30,
        radius: 280,
        ...calcPos(30, 280),
        color: '#a78bfa',
        specialties: ['accounting', 'audit', 'finance', 'ledger', 'budget', 'tax', 'compliance', 'numbers'],
      },
      {
        id: 'kevin',
        name: 'Kevin Malone',
        role: 'Data Analytics & Numerical Verification',
        department: 'Accounting',
        category: 'workforce',
        status: 'idle',
        task: null,
        lastHeartbeat: Date.now(),
        tasksCompleted: 19,
        signature: 'sec-key-km-math',
        angle: 80,
        radius: 280,
        ...calcPos(80, 280),
        color: '#fbbf24',
        specialties: ['math', 'numbers', 'payroll', 'data', 'calculation', 'analytics', 'crunch'],
      },
      {
        id: 'toby',
        name: 'Toby Flenderson',
        role: 'HR, Ethics & Regulatory Compliance',
        department: 'Human Resources',
        category: 'workforce',
        status: 'idle',
        task: null,
        lastHeartbeat: Date.now(),
        tasksCompleted: 17,
        signature: 'sec-key-tf-hr',
        angle: 130,
        radius: 280,
        ...calcPos(130, 280),
        color: '#94a3b8',
        specialties: ['hr', 'policy', 'ethics', 'compliance', 'conflict', 'legal', 'guidelines'],
      },
      {
        id: 'kelly',
        name: 'Kelly Kapoor',
        role: 'Customer Relations & Social Outreach',
        department: 'Customer Relations',
        category: 'workforce',
        status: 'idle',
        task: null,
        lastHeartbeat: Date.now(),
        tasksCompleted: 25,
        signature: 'sec-key-kk-cust',
        angle: 180,
        radius: 280,
        ...calcPos(180, 280),
        color: '#f43f5e',
        specialties: ['customer', 'social', 'marketing', 'outreach', 'feedback', 'communications', 'brand'],
      },
    ];

    // Pre-seed FIFO queue with diversified tasks
    this.queue = [
      {
        id: 'T-895',
        desc: 'MIT heap priority queue balancer & latency analyzer',
        priority: 1,
        agentId: null,
        started: 0,
        signature: 'sig_q_895fa',
        status: 'queued',
      },
      {
        id: 'T-896',
        desc: 'Zero-day payload mitigation & network firewall hardening',
        priority: 2,
        agentId: null,
        started: 0,
        signature: 'sig_q_89601',
        status: 'queued',
      },
      {
        id: 'T-897',
        desc: 'Enterprise account contract validation & SLA renegotiation',
        priority: 3,
        agentId: null,
        started: 0,
        signature: 'sig_q_897ee',
        status: 'queued',
      },
      {
        id: 'T-898',
        desc: 'Financial ledger quarterly tax reconciliation & ledger audit',
        priority: 2,
        agentId: null,
        started: 0,
        signature: 'sig_q_898acct',
        status: 'queued',
      },
    ];
  }

  private initDepartmentAgents() {
    this.departmentAgents = [
      { id: 1, name: 'CoreEngineer', role: 'MIT-Level Coder', status: 'running', lastAction: 'implementCode', taskId: 'T-892' },
      { id: 2, name: 'RepositoryEngineer', role: 'Architecture & Git', status: 'idle', lastAction: 'inspectRepository' },
      { id: 3, name: 'TesterEngineer', role: 'Testing & QA', status: 'running', lastAction: 'runTests', taskId: 'T-893' },
      { id: 4, name: 'SafetyEngineer', role: 'Security & Guardrails', status: 'idle', lastAction: 'evaluateSafety' },
      { id: 5, name: 'InfrastructureEngineer', role: 'Deployment & Public API', status: 'idle', lastAction: 'deployToStaging' },
      { id: 6, name: 'EvaluationEngineer', role: 'Outcome Evaluation', status: 'completed', lastAction: 'evaluateResult' },
      { id: 7, name: 'NegotiationEngineer', role: 'Team Coordination', status: 'running', lastAction: 'assignTeams', taskId: 'T-894' },
      { id: 8, name: 'TrainingManager', role: 'CSE Syllabus & Curriculum', status: 'idle', lastAction: 'syncCurriculum' },
      { id: 9, name: 'MasterMetaAgent', role: 'Self-Improvement', status: 'idle', lastAction: 'observeDepartment' },
      { id: 10, name: 'EngineeringDepartmentEngineer', role: 'Master Orchestration', status: 'running', lastAction: 'runFullAutonomousLifecycle', taskId: 'T-891' },
    ];
  }

  // Network hardening loop (every 470ms calculation)
  private startHardeningLoop() {
    this.hardeningTimer = setInterval(() => {
      const delta = (Math.random() - 0.48) * 0.12;
      this.networkStrength = parseFloat(Math.max(97.8, Math.min(99.95, this.networkStrength + delta)).toFixed(2));
      this.lastHardenMs = Math.floor(40 + Math.random() * 15);
    }, 470);
  }

  // Autonomous task completion & hand-off pulse across the full web network
  private startAutonomousPulse() {
    this.autoWorkTimer = setInterval(() => {
      const busyAgents = this.agents.filter((a) => a.status === 'busy' && a.task);
      if (busyAgents.length > 0 && Math.random() > 0.4) {
        const luckyAgent = busyAgents[Math.floor(Math.random() * busyAgents.length)];
        this.onTaskComplete(luckyAgent.id);
      }
    }, 3800);
  }

  // Real-time 47ms monitoring watchdog loop for all 10 Engineering Department agent threads
  private start47msMonitoringLoop() {
    const targetIds = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'ENG-9', 'ENG-10'];
    
    this.monitoringTimer = setInterval(() => {
      const now = Date.now();
      
      // 1. Maintain heartbeats of active healthy nodes with slight random drift simulation
      this.agents.forEach(agent => {
        if (targetIds.includes(agent.id)) {
          if (agent.status === 'dropped') {
            return;
          }
          
          // 99.8% chance every 47ms to refresh heartbeat, simulating normal smooth operation
          if (Math.random() > 0.002) {
            agent.lastHeartbeat = now;
          }
        }
      });

      // 2. Audit threads for lost pulses
      for (const agentId of targetIds) {
        const agent = this.agents.find(a => a.id === agentId);
        if (!agent) continue;

        const timeSinceHeartbeat = now - agent.lastHeartbeat;
        // If an agent is busy processing a task but its heartbeat is older than 4700ms (4.7s),
        // we detect it as a thread stall and automatically trigger failover/reroute.
        if (agent.status === 'busy' && timeSinceHeartbeat > 4700) {
          this.log(`🚨 [Mesh Watchdog] HEARTBEAT MISSED for ${agent.name} (${agentId})! Silence detected for ${timeSinceHeartbeat}ms. Initiating automatic failover reroute...`);
          this.failoverAgent(agentId);
        }
      }
    }, 47);
  }

  // Subscribe WebSocket client
  public addSubscriber(ws: WebSocket) {
    this.subscribers.add(ws);
    this.sendToSocket(ws, {
      type: 'INIT_STATE',
      data: this.getStateSnapshot(),
    });
  }

  public removeSubscriber(ws: WebSocket) {
    this.subscribers.delete(ws);
  }

  // Synchronize frontend custom agents into the web network dynamically
  public syncFleetAgents(incomingAgents: any[]) {
    if (!incomingAgents || !Array.isArray(incomingAgents)) return;
    const existingIds = new Set(this.agents.map((a) => a.id));
    let addedCount = 0;

    incomingAgents.forEach((agent, index) => {
      if (!existingIds.has(agent.id)) {
        const angle = (240 + (index * 45)) % 360;
        const rad = (angle * Math.PI) / 180;
        const r = 285;
        this.agents.push({
          id: agent.id,
          name: agent.name || `Custom Agent ${agent.id}`,
          role: agent.primaryRole || agent.role || 'Workforce Specialist',
          department: agent.departmentName || 'Custom Operations',
          category: 'custom',
          status: 'idle',
          task: null,
          lastHeartbeat: Date.now(),
          tasksCompleted: 0,
          signature: `sec-key-${agent.id}-cust`,
          angle,
          radius: r,
          cx: Math.round(410 + r * Math.cos(rad)),
          cy: Math.round(310 + r * Math.sin(rad)),
          color: agent.color || '#22ff88',
          specialties: agent.capabilities || ['general', 'support'],
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      this.log(`🌐 [Web Network] Connected ${addedCount} new custom agent(s) to the mesh! Total network nodes: ${this.agents.length}`);
      this.broadcast();
    }
  }

  // Find best specialist for a task based on keywords
  private findBestAgentForTask(desc: string): TaskRingAgent | null {
    const text = desc.toLowerCase();
    let bestAgent: TaskRingAgent | null = null;
    let highestScore = -1;

    // Filter to idle agents first
    const idleAgents = this.agents.filter((a) => a.status === 'idle');
    const pool = idleAgents.length > 0 ? idleAgents : this.agents;

    for (const agent of pool) {
      let score = 0;
      for (const keyword of agent.specialties) {
        if (text.includes(keyword.toLowerCase())) {
          score += 3;
        }
      }
      // Add slight weight for role matching
      if (text.includes(agent.role.toLowerCase().slice(0, 5))) {
        score += 2;
      }
      if (score > highestScore) {
        highestScore = score;
        bestAgent = agent;
      }
    }

    // Default to first idle agent if no specific match
    if (highestScore <= 0 && idleAgents.length > 0) {
      return idleAgents[0];
    }

    return bestAgent;
  }

  // Core taskRing method: assignTask(task) with intelligent routing
  public assignTask(task: { desc: string; priority?: number; id?: string; preferredAgentId?: string }) {
    const taskId = task.id || `T-${Math.floor(100 + Math.random() * 900)}`;
    const signature = `sig_${taskId.toLowerCase()}_${Math.random().toString(16).slice(2, 8)}`;

    const newTask: TaskRingItem = {
      id: taskId,
      desc: task.desc,
      priority: task.priority || 1,
      agentId: task.preferredAgentId || null,
      started: 0,
      signature,
      status: 'queued',
    };

    this.queue.push(newTask);
    this.log(`📥 [Command Ring] Enqueued ${taskId}: "${task.desc}" (P${newTask.priority}, Sig: ${signature})`);

    this.processRing();
    this.broadcast();
    return newTask;
  }

  // Process FIFO Queue and route to connected agents
  public processRing() {
    let assignedCount = 0;

    for (let i = 0; i < this.queue.length; i++) {
      const task = this.queue[i];
      let targetAgent: TaskRingAgent | null = null;

      if (task.agentId) {
        targetAgent = this.agents.find((a) => a.id === task.agentId && a.status === 'idle') || null;
      } else {
        targetAgent = this.findBestAgentForTask(task.desc);
        if (targetAgent && targetAgent.status !== 'idle') {
          targetAgent = this.agents.find((a) => a.status === 'idle') || null;
        }
      }

      if (targetAgent && targetAgent.status === 'idle') {
        this.queue.splice(i, 1);
        i--;

        targetAgent.status = 'busy';
        targetAgent.task = {
          ...task,
          agentId: targetAgent.id,
          started: Date.now(),
          status: 'active',
        };
        targetAgent.lastHeartbeat = Date.now();
        assignedCount++;

        this.syncDepartmentAgent(targetAgent.id, 'running', targetAgent.task.id, targetAgent.task.desc);
        this.log(`🕸️ [Web Route] Dispatched [${task.id}] -> ${targetAgent.name} (${targetAgent.role})`);
      }
    }

    if (assignedCount > 0) {
      this.broadcast();
    }
  }

  // SWARM SOLVE: Automatically decompose goal and distribute across connected web agents
  public swarmSolveTask(goal: string, priority: number = 1) {
    this.commandRingStatus = 'PULSING';
    const isTech = /code|api|bug|test|security|deploy|infra|git|ast|mit/i.test(goal);

    let plan: Array<{ role: string; desc: string; targetId: string }>;

    if (isTech) {
      plan = [
        { role: 'Implementation', desc: `Code generation & logic implementation for: ${goal}`, targetId: 'A1' },
        { role: 'Verification', desc: `Automated test suite & regression validation for: ${goal}`, targetId: 'A3' },
        { role: 'Hardening', desc: `Security analysis & zero-trust compliance for: ${goal}`, targetId: 'A4' },
        { role: 'Deployment', desc: `Staging rollout & API endpoint binding for: ${goal}`, targetId: 'A5' },
      ];
    } else {
      plan = [
        { role: 'Orchestration', desc: `Strategic alignment & delegation plan for: ${goal}`, targetId: 'michael' },
        { role: 'Account Execution', desc: `Client negotiation & value proposal for: ${goal}`, targetId: 'jim' },
        { role: 'Financial Audit', desc: `Budget verification & balance sheet review for: ${goal}`, targetId: 'angela' },
        { role: 'Workflow Operations', desc: `Resource allocation & intake dispatch for: ${goal}`, targetId: 'pam' },
      ];
    }

    this.log(`🚀 [Swarm Solve] Decomposed objective into ${plan.length} collaborative web threads!`);

    // Assign subtasks to the designated agents or available fallbacks
    const assignedAgents: string[] = [];
    plan.forEach((item, idx) => {
      let agent = this.agents.find((a) => a.id === item.targetId);
      if (!agent || agent.status === 'busy') {
        agent = this.agents.find((a) => a.status === 'idle') || agent;
      }

      if (agent) {
        const taskId = `SWARM-${Math.floor(100 + Math.random() * 900)}`;
        agent.status = 'busy';
        agent.task = {
          id: taskId,
          desc: item.desc,
          priority,
          agentId: agent.id,
          started: Date.now(),
          signature: `sig_swarm_${agent.id}_${Date.now().toString(16)}`,
          status: 'active',
        };
        assignedAgents.push(agent.id);
        this.log(`✨ [Swarm Stream] Assigned Subtask [${item.role}] -> ${agent.name}`);
      }
    });

    // Pair agents with active collaborator links to draw animated cross-agent packet threads!
    if (assignedAgents.length >= 2) {
      const a1 = this.agents.find((a) => a.id === assignedAgents[0]);
      const a2 = this.agents.find((a) => a.id === assignedAgents[1]);
      if (a1 && a2) {
        a1.collaboratorId = a2.id;
        a2.collaboratorId = a1.id;
      }
    }

    this.broadcast();

    // Auto-resolve swarm sequentially to demonstrate collaborative completion
    setTimeout(() => {
      if (assignedAgents[0]) this.onTaskComplete(assignedAgents[0]);
    }, 2400);

    setTimeout(() => {
      if (assignedAgents[1]) this.onTaskComplete(assignedAgents[1]);
    }, 4200);

    setTimeout(() => {
      assignedAgents.slice(2).forEach((id) => this.onTaskComplete(id));
      this.commandRingStatus = 'ACTIVE';
      this.broadcast();
    }, 6000);
  }

  // Auto-solve the next task in the queue immediately
  public autoSolveNextQueue() {
    if (this.queue.length === 0) {
      this.assignTask({
        desc: 'Autonomous distributed graph optimization across all connected agents',
        priority: 1,
      });
    }

    const task = this.queue[0];
    if (!task) return;

    const bestAgent = this.findBestAgentForTask(task.desc) || this.agents.find((a) => a.status === 'idle');
    if (!bestAgent) {
      this.log(`⚠️ All connected agents are currently busy. Task remained in queue.`);
      return;
    }

    this.queue.shift();
    bestAgent.status = 'busy';
    bestAgent.task = {
      ...task,
      agentId: bestAgent.id,
      started: Date.now(),
      status: 'active',
    };
    this.log(`⚡ [Auto-Solve] Instantly routed [${task.id}] -> ${bestAgent.name} for accelerated resolution.`);
    this.broadcast();

    // Complete after fast execution
    setTimeout(() => {
      this.onTaskComplete(bestAgent.id);
    }, 1800);
  }

  // Pair two agents in collaborative mesh thread
  public collaborateAgents(agentAId: string, agentBId: string, taskDesc: string) {
    const a = this.agents.find((x) => x.id === agentAId);
    const b = this.agents.find((x) => x.id === agentBId);
    if (!a || !b) return;

    a.collaboratorId = b.id;
    b.collaboratorId = a.id;
    a.status = 'busy';
    b.status = 'busy';

    const taskId = `COLLAB-${Math.floor(100 + Math.random() * 900)}`;
    a.task = {
      id: taskId,
      desc: `Collaborative Stream: ${taskDesc}`,
      priority: 1,
      agentId: a.id,
      started: Date.now(),
      signature: `sig_collab_${a.id}_${Date.now()}`,
      status: 'active',
      collaboratorId: b.id,
    };
    b.task = {
      id: taskId,
      desc: `Collaborative Stream: ${taskDesc}`,
      priority: 1,
      agentId: b.id,
      started: Date.now(),
      signature: `sig_collab_${b.id}_${Date.now()}`,
      status: 'active',
      collaboratorId: a.id,
    };

    this.log(`🤝 [Mesh Collaboration] Linked ${a.name} <---> ${b.name} on task "${taskDesc}"`);
    this.broadcast();
  }

  // Core taskRing method: onTaskComplete(agent)
  public onTaskComplete(agentId: string) {
    const agent = this.agents.find((a) => a.id === agentId);
    if (!agent || !agent.task) return;

    const completedTaskId = agent.task.id;
    const collaboratorId = agent.collaboratorId;

    agent.status = 'idle';
    agent.task = null;
    agent.tasksCompleted += 1;
    agent.lastHeartbeat = Date.now();
    agent.collaboratorId = null;
    this.totalCompleted += 1;

    // Clear mutual collaboration link if present
    if (collaboratorId) {
      const peer = this.agents.find((x) => x.id === collaboratorId);
      if (peer && peer.collaboratorId === agent.id) {
        peer.collaboratorId = null;
      }
    }

    this.syncDepartmentAgent(agentId, 'completed', completedTaskId);
    this.log(`✅ [Task Resolved] ${agent.name} finished [${completedTaskId}]. Instantly pulling next ring task.`);

    // Pull next available task
    this.processRing();
    this.broadcast();
  }

  // Any Command Handler (deploy, halt, override, audit, harden, run-department)
  public triggerCommand(type: 'deploy' | 'halt' | 'override' | 'audit' | 'harden' | 'run-department', payload?: any) {
    this.commandRingStatus = 'PULSING';

    switch (type) {
      case 'deploy':
        this.assignTask({
          desc: payload?.desc || 'Deploy new microservice shard across all connected agent clusters',
          priority: 1,
        });
        break;

      case 'halt':
        this.log(`🛑 [Command Ring] HALT command received — stabilizing all active threads across all 19 agents.`);
        this.agents.forEach((a) => {
          if (a.status === 'busy' && a.task) {
            this.queue.unshift(a.task);
            a.status = 'idle';
            a.task = null;
            a.collaboratorId = null;
          }
        });
        break;

      case 'override':
        this.assignTask({
          desc: payload?.desc || 'Crimson protocol override & elevated root clearance across web mesh',
          priority: 1,
        });
        break;

      case 'audit':
        this.assignTask({
          desc: payload?.desc || 'Run AST static analysis & zero-trust compliance audit on all agents',
          priority: 2,
        });
        break;

      case 'harden':
        this.networkStrength = 99.9;
        this.lastHardenMs = 47;
        this.log(`🛡️ [Command Ring] Hardened entire 19-agent web mesh against anomaly vectors. Strength: 99.9%`);
        this.assignTask({
          desc: 'Zero-trust cryptographic key rotation and packet filter hardening',
          priority: 1,
        });
        break;

      case 'run-department':
        this.log(`🚀 [Command Ring] Full Engineering Department & Workforce Collaboration triggered!`);
        this.departmentAgents.forEach((a) => (a.status = 'running'));
        this.swarmSolveTask('Execute autonomous MIT-Level objective with cross-functional fleet verification', 1);
        break;
    }

    setTimeout(() => {
      this.commandRingStatus = 'ACTIVE';
      this.broadcast();
    }, 1200);

    this.broadcast();
  }

  // Failover & Spider-Web Reroute to another connected agent
  public failoverAgent(agentId: string) {
    const agent = this.agents.find((a) => a.id === agentId);
    if (!agent) return;

    const orphanedTask = agent.task;
    if (orphanedTask) {
      agent.status = 'dropped';
      agent.task = null;
      agent.collaboratorId = null;

      this.log(`🚨 [Failover] Agent ${agent.name} dropped! Spider-web rerouting [${orphanedTask.id}] immediately...`);

      const rerouted: TaskRingItem = {
        ...orphanedTask,
        status: 'rerouted',
        desc: `[REROUTED] ${orphanedTask.desc}`,
        priority: 1,
      };
      this.queue.unshift(rerouted);

      // Instantly hand off to next idle agent in mesh
      this.processRing();

      // Auto-recover dropped agent
      setTimeout(() => {
        agent.status = 'idle';
        agent.lastHeartbeat = Date.now();
        this.log(`💚 [Self-Healing] ${agent.name} restored to IDLE status in the web network.`);
        this.processRing();
        this.broadcast();
      }, 4000);
    } else {
      agent.status = agent.status === 'dropped' ? 'idle' : 'dropped';
    }

    this.broadcast();
  }

  private syncDepartmentAgent(agentId: string, status: 'idle' | 'running' | 'completed', taskId?: string, desc?: string) {
    const indexMap: Record<string, number> = {
      A1: 1, // CoreCoder
      A2: 2, // RepoArch
      A3: 3, // SecurityQA
      A4: 4, // SafetyGuard
      A5: 5, // InfraStaging
      A6: 6, // OutcomeEval
      A7: 7, // NegotiationEngineer
      A8: 8, // CurriculumMgr
      'ENG-9': 9, // MasterMetaAgent
      'ENG-10': 10, // EngineeringDeptEngineer
    };

    const depId = indexMap[agentId];
    if (depId) {
      const depAgent = this.departmentAgents.find((a) => a.id === depId);
      if (depAgent) {
        depAgent.status = status;
        if (taskId) depAgent.taskId = taskId;
        if (desc) depAgent.lastAction = desc.slice(0, 30);
      }
    }
  }

  private log(message: string) {
    this.telemetryLogs.unshift(message);
    if (this.telemetryLogs.length > 60) {
      this.telemetryLogs.pop();
    }
  }

  public getStateSnapshot() {
    return {
      agents: this.agents,
      queue: this.queue,
      departmentAgents: this.departmentAgents,
      networkStrength: this.networkStrength,
      lastHardenMs: this.lastHardenMs,
      totalCompleted: this.totalCompleted,
      commandRingStatus: this.commandRingStatus,
      telemetryLogs: this.telemetryLogs,
      timestamp: Date.now(),
    };
  }

  // Broadcast state snapshot to all connected WebSocket clients
  public broadcast() {
    const payload = JSON.stringify({
      type: 'TASK_RING_STATE',
      data: this.getStateSnapshot(),
    });

    for (const ws of this.subscribers) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(payload);
        } catch {
          this.subscribers.delete(ws);
        }
      }
    }
  }

  private sendToSocket(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch {
        this.subscribers.delete(ws);
      }
    }
  }
}

export const taskRingEngine = TaskRingEngine.getInstance();
