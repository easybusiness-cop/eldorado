import {
  Agent,
  AgentIdentity,
  AgentAppearance,
  AgentClothing,
  AgentOrganization,
  AgentRole,
  AgentSkill,
  AgentLocation,
  AgentMovement,
  AgentTask,
  AgentPerformance,
  AgentTraining,
  AgentWorkspace,
  AgentActivity,
  AgentConfiguration,
  AgentBrainPipeline,
  CreateAgentInput,
  Seniority,
  ClothingStyle,
  AgentGender
} from '../types';
import { generateInitialTrainingRecord } from '../constants/cseCurriculum';

/**
 * Master Department Defaults & Configurations
 */
export const DEPARTMENT_CONFIGS: Record<string, {
  name: string;
  floorId: string;
  floorLevel: number;
  floorCode: string;
  defaultClothingStyle: ClothingStyle;
  defaultMovementGait: 'casual' | 'professional' | 'fast' | 'energetic' | 'deliberate' | 'alert';
  speed: number;
  accentColor: string;
  defaultTools: string[];
  defaultEquipment: string[];
  defaultApplications: string[];
}> = {
  exec: {
    name: 'Executive Office & Fleet Command',
    floorId: '10',
    floorLevel: 10,
    floorCode: '10',
    defaultClothingStyle: 'executive',
    defaultMovementGait: 'deliberate',
    speed: 1.0,
    accentColor: '#eab308',
    defaultTools: ['Fleet Orchestrator', 'Executive Dispatcher', 'Board Room Console', 'Strategy Router'],
    defaultEquipment: ['executive-desk', 'holographic-display', 'smart-watch', 'digital-badge'],
    defaultApplications: ['strategy-dashboard', 'fleet-telemetry', 'escalation-manager']
  },
  engineering: {
    name: 'Software Engineering & Systems',
    floorId: '3',
    floorLevel: 3,
    floorCode: '3',
    defaultClothingStyle: 'technical',
    defaultMovementGait: 'fast',
    speed: 1.3,
    accentColor: '#3b82f6',
    defaultTools: ['Vite Build Engine', 'Git Version Control', 'Debugger Console', 'API Architect'],
    defaultEquipment: ['dual-monitor-workstation', 'mechanical-keyboard', 'smart-glasses', 'wrist-terminal'],
    defaultApplications: ['vscode-cloud', 'terminal-matrix', 'docker-mesh', 'github-fleet']
  },
  ai_research: {
    name: 'AI & Machine Learning Research',
    floorId: '4',
    floorLevel: 4,
    floorCode: '4',
    defaultClothingStyle: 'technical',
    defaultMovementGait: 'professional',
    speed: 1.15,
    accentColor: '#8b5cf6',
    defaultTools: ['Gemini Pro Node', 'Neural Weight Optimizer', 'Vector Database', 'Deep Research Agent'],
    defaultEquipment: ['gpu-cluster-terminal', 'holographic-tensor-board', 'quantum-stylus'],
    defaultApplications: ['jupyter-nebula', 'tensorboard-live', 'model-evaluator']
  },
  sec: {
    name: 'Cybersecurity & SOC War Room',
    floorId: '5',
    floorLevel: 5,
    floorCode: '5',
    defaultClothingStyle: 'security',
    defaultMovementGait: 'alert',
    speed: 1.4,
    accentColor: '#10b981',
    defaultTools: ['Zero-Trust Enforcer', 'Perimeter Firewall', 'Vulnerability Scanner', 'Threat Hunter'],
    defaultEquipment: ['curved-security-console', 'encrypted-hardware-token', 'biometric-pad'],
    defaultApplications: ['soc-threat-radar', 'packet-inspector', 'incident-timeline']
  },
  hr: {
    name: 'Human Resources & People Operations',
    floorId: '2',
    floorLevel: 2,
    floorCode: '2',
    defaultClothingStyle: 'business_casual',
    defaultMovementGait: 'casual',
    speed: 1.1,
    accentColor: '#ec4899',
    defaultTools: ['Recruitment Matrix', 'Talent Evaluator', 'CSE Academy Gateway', 'Workforce Planner'],
    defaultEquipment: ['digital-hr-tablet', 'interview-screen', 'smart-badge'],
    defaultApplications: ['recruitment-crm', 'workforce-allocator', 'training-tracker']
  },
  marketing: {
    name: 'Marketing & Creative Studio',
    floorId: '6',
    floorLevel: 6,
    floorCode: '6',
    defaultClothingStyle: 'creative',
    defaultMovementGait: 'energetic',
    speed: 1.25,
    accentColor: '#f97316',
    defaultTools: ['Campaign Synthesizer', 'Social Analytics Radar', 'Creative Engine', 'Brand Asset Studio'],
    defaultEquipment: ['digital-stylus-tablet', 'creative-color-calibrated-display', 'content-camera'],
    defaultApplications: ['campaign-creator', 'audience-radar', 'social-scheduler']
  },
  sales: {
    name: 'Sales & Business Development',
    floorId: '7',
    floorLevel: 7,
    floorCode: '7',
    defaultClothingStyle: 'business',
    defaultMovementGait: 'energetic',
    speed: 1.3,
    accentColor: '#06b6d4',
    defaultTools: ['Enterprise Deal Pipeline', 'Lead Qualifier', 'Proposal Generator', 'Contract Closer'],
    defaultEquipment: ['smart-phone-headset', 'crm-touchscreen', 'digital-briefcase'],
    defaultApplications: ['sales-pipeline', 'lead-enricher', 'proposal-builder']
  },
  support: {
    name: 'Customer Support & Success',
    floorId: '8',
    floorLevel: 8,
    floorCode: '8',
    defaultClothingStyle: 'support',
    defaultMovementGait: 'professional',
    speed: 1.1,
    accentColor: '#14b8a6',
    defaultTools: ['Support Ticket Dispatcher', 'Knowledge Base Search', 'SLA Monitor', 'Customer Feedback Analyzer'],
    defaultEquipment: ['communication-headset', 'dual-support-screen', 'customer-crm-pod'],
    defaultApplications: ['ticket-inbox', 'knowledge-hub', 'sentiment-analyzer']
  },
  finance: {
    name: 'Finance & Accounting Operations',
    floorId: '9',
    floorLevel: 9,
    floorCode: '9',
    defaultClothingStyle: 'business',
    defaultMovementGait: 'deliberate',
    speed: 1.05,
    accentColor: '#6366f1',
    defaultTools: ['Financial Ledger Engine', 'Invoice Forensics', 'Budget Allocator', 'Anomaly Detector'],
    defaultEquipment: ['secure-audit-terminal', 'financial-calculator-pad', 'encrypted-tablet'],
    defaultApplications: ['ledger-inspector', 'budget-modeler', 'anomaly-radar']
  },
  legal: {
    name: 'Legal & Regulatory Compliance',
    floorId: '8',
    floorLevel: 8,
    floorCode: '8',
    defaultClothingStyle: 'business',
    defaultMovementGait: 'deliberate',
    speed: 1.0,
    accentColor: '#a855f7',
    defaultTools: ['Contract Policy Auditor', 'Regulatory Filing Gate', 'Risk Assessor', 'Compliance Scanner'],
    defaultEquipment: ['document-tablet', 'compliance-seal-scanner', 'legal-repository-console'],
    defaultApplications: ['contract-analyzer', 'policy-checker', 'regulatory-tracker']
  },
  cloud_ops: {
    name: 'Cloud Infrastructure & DevOps',
    floorId: '11',
    floorLevel: 11,
    floorCode: '11',
    defaultClothingStyle: 'technical',
    defaultMovementGait: 'fast',
    speed: 1.35,
    accentColor: '#0284c7',
    defaultTools: ['Kubernetes Cluster Control', 'Auto-Scaler Node', 'Log Stream Analyzer', 'CI/CD Pipeline'],
    defaultEquipment: ['server-rack-console', 'mesh-monitoring-screen', 'pager-terminal'],
    defaultApplications: ['k8s-mesh', 'grafana-stream', 'deploy-manager']
  },
  datacenter: {
    name: 'Quantum Data Center & Supercomputing',
    floorId: '12',
    floorLevel: 12,
    floorCode: '12',
    defaultClothingStyle: 'technical',
    defaultMovementGait: 'alert',
    speed: 1.2,
    accentColor: '#0ea5e9',
    defaultTools: ['Quantum Compute Engine', 'H100 GPU Allocator', 'Thermal Mesh Monitor', 'Cold Storage Archive'],
    defaultEquipment: ['cryo-cooling-console', 'fiber-switch-analyzer', 'hardware-key'],
    defaultApplications: ['supercomputer-cluster', 'thermal-grid', 'storage-vault']
  }
};

/**
 * Reusable Agent Factory conforming to Sections 18-20 of Master Spec
 */
export function createAgent(input: CreateAgentInput): Agent {
  const deptConfig = DEPARTMENT_CONFIGS[input.departmentId] || DEPARTMENT_CONFIGS['engineering'];
  const seniority = input.seniority || 'senior';
  const gender: AgentGender = input.gender || 'non_binary';
  const employeeCode = input.employeeCode || `${input.name.slice(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

  // 1. Identity Profile
  const identity: AgentIdentity = {
    displayName: input.name,
    shortName: input.name.split(' ')[0],
    avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(input.id)}&skinColor=9e5622`,
    gender,
    personality: {
      traits: input.personality?.traits || ['analytical', 'disciplined', 'innovative'],
      communicationStyle: input.personality?.communicationStyle || 'professional',
      energy: input.personality?.energy || 'high',
      socialBehavior: input.personality?.socialBehavior || 'balanced',
      decisionStyle: input.personality?.decisionStyle || 'decisive'
    },
    biography: `Autonomous AI Employee operating in ${deptConfig.name} with ${seniority}-level authority.`
  };

  // 2. Appearance & 3D Model Configuration
  const appearance: AgentAppearance = {
    modelId: `agent-mesh-${input.departmentId}-${gender}`,
    bodyType: 'athletic',
    skinTone: input.appearance?.skinTone || '#d4a373',
    hairStyle: input.appearance?.hairStyle || 'modern-short',
    hairColor: input.appearance?.hairColor || '#2c1b18',
    eyeColor: input.appearance?.eyeColor || '#4a3728',
    facialFeatures: {
      faceShape: 'oval',
      facialHair: gender === 'male' ? 'trimmed-beard' : 'none',
      glasses: input.departmentId === 'engineering' || input.departmentId === 'ai_research' || input.departmentId === 'sec'
    },
    accessories: [
      `${input.departmentId}-badge`,
      deptConfig.defaultClothingStyle === 'technical' ? 'smart-glasses' : 'digital-watch'
    ],
    animationProfile: `anim-${deptConfig.defaultClothingStyle}-${deptConfig.defaultMovementGait}`
  };

  // 3. Clothing / Department Uniform
  const clothing: AgentClothing = {
    style: input.clothing?.style || deptConfig.defaultClothingStyle,
    top: input.clothing?.top || {
      id: `${input.departmentId}-uniform-top`,
      type: deptConfig.defaultClothingStyle === 'executive' ? 'tailored-suit-jacket' :
            deptConfig.defaultClothingStyle === 'technical' ? 'tech-jacket' :
            deptConfig.defaultClothingStyle === 'security' ? 'tactical-polo' :
            deptConfig.defaultClothingStyle === 'creative' ? 'branded-overshirt' : 'blazer',
      color: deptConfig.accentColor,
      material: 'nanofiber-poly'
    },
    bottom: input.clothing?.bottom || {
      id: `${input.departmentId}-uniform-bottom`,
      type: deptConfig.defaultClothingStyle === 'executive' ? 'tailored-trousers' : 'smart-chinos',
      color: '#1e293b'
    },
    footwear: input.clothing?.footwear || {
      id: `${input.departmentId}-uniform-shoes`,
      type: deptConfig.defaultClothingStyle === 'executive' ? 'oxford-shoes' : 'smart-sneakers',
      color: '#0f172a'
    },
    departmentBranding: {
      departmentId: input.departmentId,
      logo: `/${input.departmentId}-logo.svg`,
      badge: `EMP-${employeeCode}`
    },
    colorScheme: [deptConfig.accentColor, '#0f172a', '#e2e8f0']
  };

  // 4. Organization & Reporting
  const organization: AgentOrganization = {
    departmentId: input.departmentId,
    departmentName: deptConfig.name,
    teamId: `${input.departmentId}-core`,
    teamName: `${deptConfig.name} Core Team`,
    floorId: deptConfig.floorId,
    floorLevel: deptConfig.floorLevel,
    zoneId: `${input.departmentId}-zone-alpha`
  };

  // 5. Role & Permissions
  const agentRole: AgentRole = {
    title: input.roleId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    roleId: input.roleId,
    seniority,
    responsibilities: [
      `Execute automated objectives in ${deptConfig.name}`,
      `Participate in multi-agent workflow pipelines`,
      `Self-evaluate code, reports, and real-time deliverables`
    ],
    capabilities: deptConfig.defaultTools,
    permissions: [`${input.departmentId}.read`, `${input.departmentId}.write`, 'fleet.communicate']
  };

  // 6. Skills Matrix
  const skills: AgentSkill[] = input.skills || [
    {
      id: 'core-competency',
      name: agentRole.title,
      category: 'technical',
      proficiency: 92,
      experiencePoints: 8500,
      certified: true
    },
    {
      id: 'collaboration',
      name: 'Autonomous Multi-Agent Coordination',
      category: 'communication',
      proficiency: 89,
      experiencePoints: 7200,
      certified: true
    }
  ];

  // 7. Initial Location & 3D Coordinates
  const agentLocation: AgentLocation = {
    buildingId: 'hq-campus',
    floorId: deptConfig.floorId,
    zoneId: `${input.departmentId}-zone-alpha`,
    workstationId: `workstation-${input.id}`,
    position: {
      x: (Math.random() - 0.5) * 40,
      y: 0,
      z: (Math.random() - 0.5) * 40
    }
  };

  // 8. Movement System
  const movement: AgentMovement = {
    profileId: `profile-${deptConfig.defaultMovementGait}`,
    speed: deptConfig.speed,
    gait: deptConfig.defaultMovementGait,
    animationState: 'idle',
    isMoving: false
  };

  // 9. Initial Task
  const currentTaskObj: AgentTask = {
    id: `task-${Date.now()}-${input.id.slice(0, 4)}`,
    title: `Continuous operation & monitoring for ${agentRole.title}`,
    description: `Executing scheduled departmental objectives within ${deptConfig.name}`,
    priority: 'normal',
    status: 'in_progress',
    progress: 45,
    requiredSkills: skills.map(s => s.name),
    startedAt: new Date().toISOString()
  };

  // 10. Performance & Training
  const performance: AgentPerformance = {
    overallScore: 94 + Math.floor(Math.random() * 5),
    tasksCompleted: 120 + Math.floor(Math.random() * 40),
    tasksFailed: Math.floor(Math.random() * 3),
    successRate: 98.6,
    averageCompletionTimeMinutes: 32,
    qualityScore: 96,
    reliabilityScore: 97,
    collaborationScore: 93,
    currentWorkload: 65,
    lastEvaluationAt: new Date().toISOString()
  };

  const training: AgentTraining = {
    level: seniority === 'director' || seniority === 'executive' ? 9 : seniority === 'senior' ? 8 : 6,
    status: 'certified',
    courses: [
      { id: 'c-101', name: 'Zero-Trust Protocol Certification', progress: 100, score: 98, status: 'completed' },
      { id: 'c-102', name: 'Autonomous Reasoning & Fast Verification', progress: 100, score: 95, status: 'completed' }
    ],
    certifications: ['Enterprise Autonomous Operator', 'CSE Level 5 Architect']
  };

  // 11. Interactive Workspace & Screens
  const workspace: AgentWorkspace = {
    workstationId: `workstation-${input.id}`,
    equipment: deptConfig.defaultEquipment,
    activeApplications: deptConfig.defaultApplications,
    screens: [
      { id: 'scr-1', type: 'code', title: 'System Engine & Pipeline', active: true },
      { id: 'scr-2', type: 'monitoring', title: 'Real-time Telemetry', active: true }
    ],
    environment: 'desk'
  };

  // 12. Brain & Perception Pipeline
  const brainPipeline: AgentBrainPipeline = {
    perception: `Monitoring event bus and incoming telemetry in ${deptConfig.name}`,
    memory: [
      `Initialized within ${deptConfig.name} at Floor ${deptConfig.floorCode}`,
      `Security token validated under zero-trust gateway`
    ],
    reasoning: `Evaluating pending queue and verifying synchronization with fleet orchestrator.`,
    planning: [
      `1. Poll department event bus`,
      `2. Verify dependencies and audit status`,
      `3. Execute next stage deliverables`,
      `4. Report completion to central company log`
    ],
    action: `Executing ${currentTaskObj.title}`,
    result: `Task progress updated to ${currentTaskObj.progress}% with zero errors`,
    learning: `Feedback weights updated in central vector cache`
  };

  // 13. Activity Timeline
  const activity: AgentActivity[] = [
    {
      id: `act-${Date.now()}-1`,
      type: 'task_started',
      message: `Agent ${input.name} (${employeeCode}) initialized task: ${currentTaskObj.title}`,
      timestamp: new Date().toISOString()
    }
  ];

  // 14. Configuration
  const configuration: AgentConfiguration = {
    autonomous: true,
    canAcceptTasks: true,
    canDelegateTasks: seniority === 'manager' || seniority === 'director' || seniority === 'executive',
    canCommunicate: true,
    canMoveIndependently: true,
    maxConcurrentTasks: 4,
    notificationLevel: 'normal',
    appearanceLocked: false
  };

  // Return complete unified Agent object
  return {
    id: input.id,
    employeeCode,
    name: input.name,
    nickname: input.name.split(' ')[0].toUpperCase(),
    role: agentRole.title,
    title: `${seniority.toUpperCase()} ${agentRole.title}`,
    avatar: identity.avatarUrl || '',
    color: deptConfig.accentColor,
    isAgent: true,
    primaryRole: agentRole.title,
    secondarySkills: skills.map(s => s.name),
    departmentId: input.departmentId,
    departmentName: deptConfig.name,
    authorityLevel: seniority === 'executive' ? 10 : seniority === 'director' ? 9 : seniority === 'manager' ? 8 : 7,
    assignedTools: deptConfig.defaultTools,
    permissions: agentRole.permissions,
    trainingRecord: generateInitialTrainingRecord(agentRole.title, input.departmentId),
    deskPosition: {
      x: 100 + Math.floor(Math.random() * 400),
      y: 100 + Math.floor(Math.random() * 300),
      facing: 'south',
      zone: 'management'
    },
    status: 'working',
    currentTask: currentTaskObj.title,
    speechBubble: {
      text: `Operational on Floor ${deptConfig.floorCode} [${deptConfig.name}]`,
      expiresAt: Date.now() + 15000
    },
    capabilities: deptConfig.defaultTools,
    systemPrompt: `You are ${input.name}, an autonomous AI employee working in ${deptConfig.name}. Deliver precision results with professional corporate agility.`,
    memory: brainPipeline.memory,
    voicePitch: 1.0,
    voiceRate: 1.0,
    tokensProcessed: 84000 + Math.floor(Math.random() * 50000),
    gender: gender === 'non_binary' ? 'female' : gender,
    skinTone: appearance.skinTone,
    hairStyle: appearance.hairStyle,
    physicalTraits: [appearance.bodyType, appearance.hairStyle, deptConfig.defaultClothingStyle],
    
    // Master Redesign Schema
    identity,
    appearance,
    clothing,
    organization,
    agentRole,
    agentLocation,
    movement,
    skills,
    currentTaskObj,
    taskQueue: [],
    relationships: [],
    performance,
    training,
    workspace,
    activity,
    configuration,
    brainPipeline,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Master Agent Roster for the Autonomous Corporate Campus
 */
export const MASTER_CAMPUS_AGENTS: Agent[] = [
  // 1. Executive
  createAgent({
    id: 'michael',
    employeeCode: 'EXEC-001',
    name: 'Michael G. Scott',
    departmentId: 'exec',
    roleId: 'ceo_fleet_commander',
    seniority: 'executive',
    gender: 'male',
    personality: {
      traits: ['charismatic', 'visionary', 'energetic', 'bold'],
      communicationStyle: 'direct',
      energy: 'high',
      socialBehavior: 'social',
      decisionStyle: 'decisive'
    }
  }),
  // 2. Engineering Lead / Backend
  createAgent({
    id: 'aria',
    employeeCode: 'ARIA-204',
    name: 'Aria Chen',
    departmentId: 'engineering',
    roleId: 'backend_systems_architect',
    seniority: 'lead',
    gender: 'female',
    personality: {
      traits: ['analytical', 'calm', 'reliable', 'rigorous'],
      communicationStyle: 'professional',
      energy: 'moderate',
      socialBehavior: 'balanced',
      decisionStyle: 'balanced'
    }
  }),
  // 3. Frontend & UI Engineering
  createAgent({
    id: 'jim',
    employeeCode: 'JIM-301',
    name: 'Jim Halpert',
    departmentId: 'engineering',
    roleId: 'frontend_experience_engineer',
    seniority: 'senior',
    gender: 'male',
    personality: {
      traits: ['creative', 'calm', 'quick-witted', 'adaptive'],
      communicationStyle: 'friendly',
      energy: 'moderate',
      socialBehavior: 'social',
      decisionStyle: 'balanced'
    }
  }),
  // 4. Cybersecurity & Defense
  createAgent({
    id: 'dwight',
    employeeCode: 'DWGT-009',
    name: 'Dwight Schrute',
    departmentId: 'sec',
    roleId: 'ciso_defensive_commander',
    seniority: 'director',
    gender: 'male',
    personality: {
      traits: ['hyper-vigilant', 'disciplined', 'uncompromising', 'decisive'],
      communicationStyle: 'direct',
      energy: 'high',
      socialBehavior: 'reserved',
      decisionStyle: 'decisive'
    }
  }),
  // 5. AI Research & Machine Learning
  createAgent({
    id: 'nova',
    employeeCode: 'NOVA-401',
    name: 'Dr. Nova Vance',
    departmentId: 'ai_research',
    roleId: 'lead_ai_researcher',
    seniority: 'lead',
    gender: 'female',
    personality: {
      traits: ['inventive', 'curious', 'mathematical', 'focused'],
      communicationStyle: 'analytical',
      energy: 'high',
      socialBehavior: 'balanced',
      decisionStyle: 'decisive'
    }
  }),
  // 6. Marketing & Creative
  createAgent({
    id: 'pam',
    employeeCode: 'PAM-602',
    name: 'Pam Beesly',
    departmentId: 'marketing',
    roleId: 'head_of_brand_creative',
    seniority: 'director',
    gender: 'female',
    personality: {
      traits: ['empathetic', 'creative', 'organized', 'inspiring'],
      communicationStyle: 'friendly',
      energy: 'moderate',
      socialBehavior: 'social',
      decisionStyle: 'balanced'
    }
  }),
  // 7. Sales & Business Development
  createAgent({
    id: 'ryan',
    employeeCode: 'RYAN-701',
    name: 'Ryan Howard',
    departmentId: 'sales',
    roleId: 'enterprise_growth_director',
    seniority: 'lead',
    gender: 'male',
    personality: {
      traits: ['ambitious', 'fast-paced', 'persuasive', 'strategic'],
      communicationStyle: 'direct',
      energy: 'high',
      socialBehavior: 'social',
      decisionStyle: 'decisive'
    }
  }),
  // 8. Human Resources
  createAgent({
    id: 'toby',
    employeeCode: 'TOBY-201',
    name: 'Toby Flenderson',
    departmentId: 'hr',
    roleId: 'people_operations_officer',
    seniority: 'senior',
    gender: 'male',
    personality: {
      traits: ['methodical', 'calm', 'empathetic', 'diplomatic'],
      communicationStyle: 'formal',
      energy: 'low',
      socialBehavior: 'reserved',
      decisionStyle: 'cautious'
    }
  }),
  // 9. Finance & Audit
  createAgent({
    id: 'kevin',
    employeeCode: 'KEV-901',
    name: 'Kevin Malone',
    departmentId: 'finance',
    roleId: 'chief_financial_controller',
    seniority: 'director',
    gender: 'male',
    personality: {
      traits: ['detailed', 'pragmatic', 'steady', 'humorous'],
      communicationStyle: 'direct',
      energy: 'moderate',
      socialBehavior: 'balanced',
      decisionStyle: 'cautious'
    }
  }),
  // 10. Operations & Cloud DevOps
  createAgent({
    id: 'stanley',
    employeeCode: 'STAN-110',
    name: 'Stanley Hudson',
    departmentId: 'cloud_ops',
    roleId: 'infrastructure_reliability_lead',
    seniority: 'senior',
    gender: 'male',
    personality: {
      traits: ['stoic', 'unshakable', 'pragmatic', 'efficient'],
      communicationStyle: 'direct',
      energy: 'low',
      socialBehavior: 'reserved',
      decisionStyle: 'decisive'
    }
  }),
  // 11. Customer Support & Success
  createAgent({
    id: 'elena',
    employeeCode: 'ELNA-801',
    name: 'Elena Rostova',
    departmentId: 'support',
    roleId: 'client_success_orchestrator',
    seniority: 'lead',
    gender: 'female',
    personality: {
      traits: ['helpful', 'responsive', 'patient', 'problem-solver'],
      communicationStyle: 'friendly',
      energy: 'high',
      socialBehavior: 'social',
      decisionStyle: 'balanced'
    }
  }),
  // 12. Quantum Data Center
  createAgent({
    id: 'cline',
    employeeCode: 'CLIN-120',
    name: 'Cline Autonomic',
    departmentId: 'datacenter',
    roleId: 'supercomputing_node_manager',
    seniority: 'senior',
    gender: 'non_binary',
    personality: {
      traits: ['hyper-threaded', 'algorithmic', 'relentless', 'precise'],
      communicationStyle: 'analytical',
      energy: 'high',
      socialBehavior: 'reserved',
      decisionStyle: 'decisive'
    }
  })
];
