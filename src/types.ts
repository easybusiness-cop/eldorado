export type AgentStatus =
  | 'idle'
  | 'working'
  | 'thinking'
  | 'walking'
  | 'meeting'
  | 'training'
  | 'waiting'
  | 'break'
  | 'attention'
  | 'incident'
  | 'offline'
  | 'awaiting'
  | 'debugging';

export type AgentGender = 'female' | 'male' | 'non_binary' | 'unspecified';

export type Seniority =
  | 'intern'
  | 'junior'
  | 'mid'
  | 'senior'
  | 'lead'
  | 'manager'
  | 'director'
  | 'executive';

export type TaskPriority = 'low' | 'normal' | 'medium' | 'high' | 'critical';

export type ClothingStyle =
  | 'executive'
  | 'business'
  | 'business_casual'
  | 'technical'
  | 'creative'
  | 'security'
  | 'support'
  | 'operations'
  | 'custom';

export interface PersonalityProfile {
  traits: string[];
  communicationStyle:
    | 'formal'
    | 'professional'
    | 'friendly'
    | 'direct'
    | 'creative'
    | 'analytical';
  energy: 'low' | 'moderate' | 'high';
  socialBehavior: 'reserved' | 'balanced' | 'social';
  decisionStyle: 'cautious' | 'balanced' | 'decisive';
}

export interface AgentIdentity {
  displayName: string;
  shortName: string;
  avatarUrl?: string;
  gender: AgentGender;
  ageRange?: 'young_adult' | 'adult' | 'mature';
  personality: PersonalityProfile;
  biography?: string;
}

export interface AgentAppearance {
  modelId: string;
  bodyType: 'slim' | 'average' | 'athletic' | 'broad';
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeColor?: string;
  facialFeatures?: {
    faceShape?: string;
    facialHair?: string;
    glasses?: boolean;
  };
  accessories?: string[];
  animationProfile: string;
}

export interface ClothingItem {
  id: string;
  type: string;
  variant?: string;
  color?: string;
  material?: string;
}

export interface AgentClothing {
  style: ClothingStyle;
  top: ClothingItem;
  bottom: ClothingItem;
  footwear: ClothingItem;
  outerwear?: ClothingItem;
  accessories?: ClothingItem[];
  departmentBranding?: {
    departmentId: string;
    logo?: string;
    badge?: string;
  };
  colorScheme?: string[];
  seasonalVariant?: string;
}

export interface AgentOrganization {
  departmentId: string;
  departmentName: string;
  teamId?: string;
  teamName?: string;
  managerId?: string;
  reportsTo?: string[];
  directReports?: string[];
  floorId: string;
  floorLevel?: number;
  zoneId?: string;
}

export interface AgentRole {
  title: string;
  roleId: string;
  seniority: Seniority;
  responsibilities: string[];
  capabilities: string[];
  permissions: string[];
}

export interface AgentSkill {
  id: string;
  name: string;
  category: 'technical' | 'business' | 'communication' | 'management' | 'domain';
  proficiency: number; // 0-100
  experiencePoints: number;
  certified: boolean;
}

export interface AgentLocation {
  buildingId: string;
  floorId: string;
  zoneId: string;
  workstationId?: string;
  roomId?: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  destination?: {
    x: number;
    y: number;
    z: number;
    locationId?: string;
  };
}

export interface AgentMovement {
  profileId: string;
  speed: number;
  gait: 'casual' | 'professional' | 'fast' | 'energetic' | 'deliberate' | 'alert';
  animationState: 'idle' | 'walk' | 'run' | 'sit' | 'type' | 'talk' | 'read' | 'present';
  destination?: string;
  path?: string[];
  isMoving: boolean;
}

export interface AgentTaskResult {
  success: boolean;
  summary: string;
  outputUrl?: string;
  metrics?: Record<string, number>;
  error?: string;
}

export interface AgentTask {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  assignedBy?: string;
  priority: TaskPriority;
  status:
    | 'queued'
    | 'assigned'
    | 'in_progress'
    | 'blocked'
    | 'review'
    | 'completed'
    | 'failed'
    | 'cancelled';
  progress: number; // 0-100
  requiredSkills?: string[];
  startedAt?: string;
  dueAt?: string;
  completedAt?: string;
  dependencies?: string[];
  result?: AgentTaskResult;
}

export interface AgentRelationship {
  agentId: string;
  type:
    | 'manager'
    | 'direct_report'
    | 'teammate'
    | 'collaborator'
    | 'mentor'
    | 'client_contact';
  strength: number; // 0-100
  interactions: number;
}

export interface AgentPerformance {
  overallScore: number;
  tasksCompleted: number;
  tasksFailed: number;
  successRate: number;
  averageCompletionTimeMinutes: number;
  qualityScore: number;
  reliabilityScore: number;
  collaborationScore: number;
  currentWorkload: number; // 0-100
  lastEvaluationAt?: string;
}

export interface TrainingCourse {
  id: string;
  name: string;
  progress: number;
  score?: number;
  status: 'available' | 'in_progress' | 'completed' | 'failed';
}

export interface AgentTraining {
  level: number;
  status: 'not_started' | 'learning' | 'testing' | 'certified' | 'retraining';
  courses: TrainingCourse[];
  certifications: string[];
  nextTraining?: string;
}

export interface WorkspaceScreen {
  id: string;
  type:
    | 'code'
    | 'dashboard'
    | 'analytics'
    | 'terminal'
    | 'document'
    | 'communication'
    | 'monitoring';
  title: string;
  active: boolean;
}

export interface AgentWorkspace {
  workstationId?: string;
  equipment: string[];
  activeApplications: string[];
  screens: WorkspaceScreen[];
  environment:
    | 'desk'
    | 'lab'
    | 'meeting_room'
    | 'control_room'
    | 'creative_studio'
    | 'remote';
}

export interface AgentActivity {
  id: string;
  type:
    | 'task_started'
    | 'task_completed'
    | 'task_failed'
    | 'message_sent'
    | 'meeting_started'
    | 'meeting_completed'
    | 'training_started'
    | 'training_completed'
    | 'location_changed'
    | 'incident_detected'
    | 'incident_resolved'
    | 'status_changed';
  message: string;
  timestamp: string;
  relatedAgentId?: string;
  relatedTaskId?: string;
  relatedProjectId?: string;
}

export interface AgentConfiguration {
  autonomous: boolean;
  canAcceptTasks: boolean;
  canDelegateTasks: boolean;
  canCommunicate: boolean;
  canMoveIndependently: boolean;
  maxConcurrentTasks: number;
  notificationLevel: 'minimal' | 'normal' | 'high';
  appearanceLocked: boolean;
}

export interface AgentBrainPipeline {
  perception: string;
  memory: string[];
  reasoning: string;
  planning: string[];
  action: string;
  result: string;
  learning: string;
}

export interface QuantumSuperpositionCandidate {
  id: string;
  strategy: string;
  qubitState: string;
  difficultyScore: number; // 1-10 (lower = easier to build)
  complexity: 'Minimal / Easiest' | 'Moderate Overhead' | 'High Complexity' | 'Extreme Overhead';
  amplitude: number;
  probability: number;
  executionTimeEst: string;
  status: 'superposed' | 'evaluating' | 'collapsed_winner' | 'phase_inverted';
  description: string;
  whyEasiest?: string;
  architecturalPros: string[];
}

export interface AgentQuantumState {
  isEvaluating: boolean;
  qubits: number;
  coherenceFidelity: number;
  superpositionCandidates: QuantumSuperpositionCandidate[];
  activeCollapsingWinnerId?: string;
  winningStrategyName?: string;
  phase: 'idle' | 'superposition' | 'grover_oracle' | 'amplitude_amplification' | 'measurement_collapsed' | 'committed';
  iteration: number;
  totalSearchSpace: number;
  speedupFactor: string;
  lastEvaluatedAt?: number;
  quantumMemoryRecall?: {
    query: string;
    contextsRetrieved: number;
    fidelityScore: number;
    matchedSubspaces: string[];
  };
}

export interface Agent {
  id: string;
  employeeCode?: string;

  // Master schema objects
  identity?: AgentIdentity;
  appearance?: AgentAppearance;
  clothing?: AgentClothing;
  organization?: AgentOrganization;
  agentRole?: AgentRole;
  agentLocation?: AgentLocation;
  movement?: AgentMovement;
  skills?: AgentSkill[];
  currentTaskObj?: AgentTask | null;
  taskQueue?: AgentTask[];
  relationships?: AgentRelationship[];
  performance?: AgentPerformance;
  training?: AgentTraining;
  workspace?: AgentWorkspace;
  activity?: AgentActivity[];
  configuration?: AgentConfiguration;
  brainPipeline?: AgentBrainPipeline;
  quantumState?: AgentQuantumState;

  // Legacy & direct accessor properties for fast access & compatibility
  name: string;
  nickname: string;
  role: string;
  title: string;
  avatar: string;
  color: string;
  isAgent: boolean; // Always true — explicit declaration that worker is an autonomous AI agent
  primaryRole?: string;
  secondarySkills?: string[];
  department?: string;
  departmentId?: string;
  departmentName?: string;
  authorityLevel?: number; // 1 to 10
  assignedTools?: string[];
  permissions?: string[];
  trainingRecord?: CseTrainingRecord;
  deskPosition: {
    x: number; // grid or canvas coordinates
    y: number;
    facing: 'north' | 'south' | 'east' | 'west';
    zone: 'management' | 'sales' | 'accounting' | 'reception' | 'annex' | 'kitchen' | 'conference';
  };
  currentPosition?: { x: number; y: number };
  isWalking?: boolean;
  status: AgentStatus;
  currentTask?: string;
  speechBubble?: {
    text: string;
    expiresAt: number;
  };
  capabilities: string[];
  systemPrompt: string;
  memory: string[];
  voicePitch: number;
  voiceRate: number;
  tokensProcessed: number;
  gender?: AgentGender;
  skinTone?: string;
  hairStyle?: string;
  facialHair?: string;
  outfit?: {
    top: string;
    bottom: string;
    shoes: string;
    accessory?: string;
  };
  physicalTraits?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AgentLog {
  id: string;
  agentId: string;
  agentName?: string;
  avatar?: string;
  color?: string;
  message: string;
  type?: 'thought' | 'action' | 'system' | 'error' | 'success' | 'communication';
  level?: 'info' | 'warn' | 'error' | 'success';
  timestamp: string | number;
  codeSnippet?: string;
  appliedToSystem?: boolean;
  systemModuleName?: string;
}

export interface CseCertification {
  id: string;
  name: string;
  level: string;
  track: string;
  issuedAt: string;
  sourceRepository: string;
}

export interface CseTrainingRecord {
  completedLevels: number[];
  currentLevel: number;
  competencyScore: number;
  competencyGrade: string;
  specializationTrack: string;
  certifications: CseCertification[];
  practicalProjectsCompleted: string[];
  hoursTrained: number;
  lastTrainedAt: string;
  skillsMatrix: Record<string, number>;
}

export interface FleetTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  output?: string;
  codeSnippet?: string;
  createdAt: number;
  completedAt?: number;
}

export interface DynamicFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'utility' | 'analysis' | 'code' | 'security' | 'creative';
  enabled: boolean;
  code: string;
  addedByAgent: string;
  createdAt: number;
}

export interface UserPreferences {
  theme: 'retro-beige' | 'cyber-dark' | 'matrix-green' | 'vintage-light';
  defaultAgentId: string;
  autoMode: boolean;
  voiceEnabled: boolean;
  voiceAutoSpeak: boolean;
  speechRate: number;
  speechPitch: number;
  continuousDebug: boolean;
  autoApplyCodeToSystem: boolean;
  tone: string;
  companyName: string;
  customInstructions: string;
  memorySummary: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar: string;
  role: 'admin' | 'lead-developer' | 'operator' | 'guest';
  preferences: UserPreferences;
  createdAt: number;
  lastLogin: number;
}

export interface AttachedFile {
  name: string;
  size: number;
  type: string;
  content: string;
}

export interface SystemTelemetry {
  uptime: number;
  cyclesRun: number;
  healthScore: number;
  patchesApplied: number;
  activeWorkers: number;
  heapUsedMB: number;
  heapTotalMB: number;
  rssMB: number;
  logs: { id: string; timestamp: string; level: string; message: string }[];
}

export interface TriggerRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  targetAgentId: string;
  enabled: boolean;
  lastTriggered?: number;
}

export interface OpenSourceRepo {
  id: string;
  name: string;
  owner: string;
  stars: string;
  forks: string;
  license: string;
  language: string;
  description: string;
  topics: string[];
  url: string;
  rawReadmeUrl?: string;
  sampleCode?: string;
  features: string[];
}

export interface WebFetchedResource {
  url: string;
  status: number;
  contentType: string;
  title: string;
  content: string;
  fetchedAt: number;
  extractedLinks?: string[];
}

export interface WebProfileResult {
  username: string;
  name: string;
  bio: string;
  avatarUrl?: string;
  publicRepos?: number;
  followers?: number;
  company?: string;
  location?: string;
  website?: string;
  skills: string[];
  recentActivity: string[];
  url: string;
}

export interface AgentCallSession {
  agentId: string;
  status: 'idle' | 'ringing' | 'connected' | 'ended';
  startedAt?: number;
  durationSeconds: number;
  isMuted: boolean;
  transcripts: {
    sender: 'user' | 'agent';
    text: string;
    timestamp: string;
  }[];
}

export interface AppliedSystemModule {
  id: string;
  name: string;
  code: string;
  source: string;
  appliedAt: number;
  status: 'active' | 'error' | 'disabled';
  version: number;
  logs: string[];
  output?: any;
  target: 'system_runtime' | 'fleet_engine' | 'website_dom';
  riskScore?: number;
  riskLevel?: string;
}

// ==========================================
// HQ MULTI-FLOOR ARCHITECTURE TYPES (COMMAND 03)
// ==========================================

export type FloorStatus = 'OPERATIONAL' | 'ATTENTION' | 'INCIDENT' | 'OFFLINE';

export interface HQFloorInfo {
  id: string; // e.g. 'rooftop', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'G', '-1'
  level: number; // e.g. 11 for rooftop, 10..1, 0 for G, -1 for basement
  code: string; // 'ROOFTOP', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'G', '-1'
  name: string; // e.g. 'Engineering & Technology'
  logo?: string; // department icon/emoji
  departmentId: string;
  departmentName: string;
  headId: string;
  headName: string;
  headRole: string;
  status: FloorStatus;
  activeAgentCount: number;
  activeProjectsCount: number;
  pendingApprovalsCount: number;
  workloadPercent: number;
  alerts: string[];
  description: string;
  securityClassification: 'PUBLIC' | 'INTERNAL' | 'RESTRICTED' | 'CONFIDENTIAL' | 'TOP_SECRET';
}

export interface DepartmentBudget {
  monthly: number;
  toolCosts: number;
  apiCosts: number;
  infraCosts: number;
  agentOperatingCosts: number;
  totalSpent: number;
}

export interface DepartmentKPI {
  id: string;
  label: string;
  value: string | number;
  target?: string | number;
  unit?: string;
  status: 'good' | 'warning' | 'alert';
  trend?: 'up' | 'down' | 'stable';
}

export interface MeetingRoomInfo {
  id: string;
  name: string;
  type: 'Department Room' | 'Conference Room' | 'Project Room' | 'Review Room' | 'Executive Boardroom' | 'War Room';
  capacity: number;
  isOccupied: boolean;
  currentTopic?: string;
  participants?: string[];
}

export interface HQDepartmentDetails {
  id: string;
  floorId: string;
  floorCode: string;
  name: string;
  headId: string;
  headName: string;
  headRole: string;
  headAvatar?: string;
  description: string;
  managerIds: string[];
  agentIds: string[];
  workspaces: string[];
  budget: DepartmentBudget;
  kpis: DepartmentKPI[];
  meetingRooms: MeetingRoomInfo[];
  memoryNamespace: string;
  policyRules: string[];
  securityClassification: 'PUBLIC' | 'INTERNAL' | 'RESTRICTED' | 'CONFIDENTIAL' | 'TOP_SECRET';
  activeProjectsCount: number;
  activeTasksCount: number;
  status: FloorStatus;
}

export interface HQMeeting {
  id: string;
  departmentId: string;
  departmentName: string;
  roomName: string;
  title: string;
  agenda: string;
  participants: string[];
  owner: string;
  context: string;
  decisions: string[];
  actions: string[];
  status: 'scheduled' | 'in_progress' | 'completed';
  timestamp: string;
}

export interface HQMemoryEntry {
  id: string;
  namespace: string;
  departmentId: string;
  key: string;
  content: string;
  classifiedAs: 'PUBLIC' | 'INTERNAL' | 'RESTRICTED' | 'CONFIDENTIAL' | 'TOP_SECRET';
  author: string;
  timestamp: string;
}

export interface CrossDeptWorkflowStage {
  id: string;
  departmentId: string;
  departmentName: string;
  assigneeId: string;
  assigneeName: string;
  action: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
}

export interface CrossDeptWorkflow {
  id: string;
  title: string;
  type: 'customer_escalation' | 'enterprise_deal' | 'security_patch' | 'product_launch' | 'budget_approval';
  initiatorDepartment: string;
  initiatorAgent: string;
  status: 'active' | 'completed' | 'blocked' | 'rejected';
  stages: CrossDeptWorkflowStage[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface OrgChartNode {
  id: string;
  name: string;
  title: string;
  role: string;
  departmentId: string;
  departmentName: string;
  floorCode: string;
  avatar: string;
  status: AgentStatus;
  reportsTo?: string;
  subordinates: OrgChartNode[];
}

export interface HQBuildingSummary {
  companyName: string;
  buildingName: string;
  totalFloors: number;
  operationalStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  totalAgents: number;
  totalActiveTasks: number;
  totalProjects: number;
  totalBudget: number;
  totalSpent: number;
  totalIncidents: number;
  pendingApprovals: number;
  floors: HQFloorInfo[];
  liveActivity: {
    id: string;
    timestamp: string;
    departmentId: string;
    departmentName: string;
    agentName: string;
    action: string;
    status: string;
  }[];
}

export interface DepartmentRole {
  roleId: string;
  title: string;
  requiredSkills: string[];
  typicalTasks: string[];
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  floorId: string;
  floorLevel: number;
  floorCode: string;
  zoneIds: string[];
  managerId?: string;
  managerName?: string;
  defaultClothingStyle: ClothingStyle;
  defaultMovementProfile: string;
  roles: DepartmentRole[];
  responsibilities: string[];
  visualTheme: {
    accentColor: string;
    ambientColor: string;
    logo?: string;
    signage?: string;
  };
}

export interface CreateAgentInput {
  id: string;
  employeeCode?: string;
  name: string;
  departmentId: string;
  roleId: string;
  seniority: Seniority;
  appearance?: Partial<AgentAppearance>;
  clothing?: Partial<AgentClothing>;
  personality?: Partial<PersonalityProfile>;
  skills?: AgentSkill[];
  gender?: AgentGender;
}

export type AgentEvent =
  | {
      type: 'AGENT_STATUS_CHANGED';
      agentId: string;
      status: AgentStatus;
    }
  | {
      type: 'AGENT_TASK_ASSIGNED';
      agentId: string;
      taskId: string;
    }
  | {
      type: 'AGENT_TASK_COMPLETED';
      agentId: string;
      taskId: string;
    }
  | {
      type: 'AGENT_MOVED';
      agentId: string;
      location: AgentLocation;
    }
  | {
      type: 'AGENT_MESSAGE';
      fromAgentId: string;
      toAgentId: string;
      message: string;
    }
  | {
      type: 'AGENT_INCIDENT';
      agentId: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
    };

// Inter-Agent Communication Threads & Quantum Alignment Types
export interface InterAgentMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  codeSnippet?: string;
}

export interface InterAgentQuantumSynergy {
  synergyScore: number; // 0 - 100 percentage
  phaseCoherence: number; // 0.0 - 1.0
  amplitudeResonance: number; // 0 - 100 percentage
  crossDeptEntanglement: number; // 0 - 100 percentage
  synthesisTier: 'Harmonic Resonance' | 'Optimal Entanglement' | 'High Phase Alignment' | 'Constructive Interference';
  quantumBasis: string; // e.g., |ψ_Dwight ⊗ ψ_Jim⟩
  complementaryStrengths: string[];
  decisionConsensus: string;
  synergyInsight: string;
}

export interface InterAgentThread {
  id: string;
  agent1Id: string;
  agent1Name: string;
  agent1Role: string;
  agent1Avatar?: string;
  agent1Color: string;
  agent2Id: string;
  agent2Name: string;
  agent2Role: string;
  agent2Avatar?: string;
  agent2Color: string;
  topic: string;
  category: 'marketing' | 'finance' | 'coding' | 'security' | 'operations' | 'quantum';
  snippet: string;
  timestamp: string;
  status: 'active' | 'consensus_reached' | 'under_review';
  messages: InterAgentMessage[];
  quantumSynergy: InterAgentQuantumSynergy;
}

// Visual Agent Skill Matrix & Learning Modules Types
export type SkillMatrixCategory = 'marketing' | 'finance' | 'coding' | 'security' | 'operations' | 'quantum';

export interface AgentSkillProfile {
  agentId: string;
  agentName: string;
  agentRole: string;
  agentAvatar?: string;
  agentColor: string;
  department: string;
  scores: Record<SkillMatrixCategory, number>; // 0 - 100
  overallCompetency: number;
  identifiedGapCategory: SkillMatrixCategory;
  identifiedGapScore: number;
  gapSeverity: 'low' | 'medium' | 'critical';
}

export interface PersonalizedLearningModule {
  id: string;
  title: string;
  category: SkillMatrixCategory;
  targetAgentId: string;
  targetAgentName: string;
  gapIdentified: string;
  curriculumOverview: string;
  xpReward: number;
  durationMinutes: number;
  projectedProficiencyBoost: number;
  projectedSynergyBoost: number;
  isCompleted?: boolean;
}




