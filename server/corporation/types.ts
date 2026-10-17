export type SeniorityLevel =
  | 'associate'
  | 'specialist'
  | 'team_lead'
  | 'manager'
  | 'director'
  | 'executive'
  | 'founder';

export type EmployeeWorkStatus =
  | 'idle'
  | 'working'
  | 'thinking'
  | 'reviewing'
  | 'meeting'
  | 'offline'
  | 'incident_response';

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CompanyProfile {
  id: string;
  name: string;
  legalEntity: string;
  foundedYear: number;
  mission: string;
  vision: string;
  coreValues: string[];
  capitalBalanceUSD: number;
  annualOperatingBudgetUSD: number;
  valuationUSD: number;
  headcountTotal: number;
  activeProjectsTotal: number;
  complianceRating: number; // 0 - 100
  fiscalQuarter: string;
  boardChair: string;
  executiveOfficers: {
    ceo: string;
    coo: string;
    cto: string;
    ciso: string;
    cfo: string;
    chro: string;
  };
}

export interface Division {
  id: string;
  name: string;
  code: string;
  description: string;
  leaderId: string;
  leaderName: string;
  departmentIds: string[];
  annualBudgetUSD: number;
}

export interface Department {
  id: string;
  divisionId: string;
  name: string;
  code: string;
  description: string;
  headOfDepartmentId: string;
  headName: string;
  headRole: string;
  budgetUSD: number;
  annualSpendUSD: number;
  headcount: number;
  activeProjectsCount: number;
  workloadPercent: number;
  teamIds: string[];
  clearanceRequired: number; // 1 - 100
  keyCapabilities: string[];
}

export interface Team {
  id: string;
  departmentId: string;
  name: string;
  code: string;
  description: string;
  teamLeadId: string;
  teamLeadName: string;
  memberEmployeeIds: string[];
  activeWorkstream: string;
  focusArea: string;
}

export interface EmployeeCapability {
  id: string;
  name: string;
  category: string;
  proficiencyScore: number; // 0 - 100
  verifiedEvidence: string;
  certifiedTools: string[];
}

export interface ComputerEnvironment {
  workspaceId: string;
  sandboxPath: string;
  terminalSessionId: string;
  browserProfileId: string;
  approvedTools: string[];
  accounts: string[];
  environmentVariables: Record<string, string>;
  activeProcessesCount: number;
}

export interface EmployeeLearningRecord {
  id: string;
  topic: string;
  acquiredAt: string;
  source: string;
  impactSummary: string;
  proficiencyDelta: number;
}

export interface PersistentVirtualEmployee {
  id: string;
  displayName: string;
  handle: string;
  roleTitle: string;
  departmentId: string;
  departmentName: string;
  teamId?: string;
  teamName?: string;
  managerId: string | null;
  managerName?: string;
  subordinateIds: string[];
  clearanceLevel: number; // 1 - 100
  seniority: SeniorityLevel;
  status: EmployeeWorkStatus;
  avatarUrl: string;
  email: string;
  bio: string;
  capabilities: EmployeeCapability[];
  responsibilities: string[];
  currentTask: string | null;
  activeProjectIds: string[];
  workloadPercent: number;
  computerEnvironment: ComputerEnvironment;
  metrics: {
    tasksCompleted: number;
    accuracyScore: number; // 0 - 100%
    costEfficiency: number; // 0 - 100%
    uptimePercent: number;
    tokensProcessed: number;
  };
  decisionHistoryIds: string[];
  failureHistoryIds: string[];
  learningHistory: EmployeeLearningRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface Portfolio {
  id: string;
  name: string;
  strategicObjective: string;
  ownerId: string;
  programIds: string[];
  budgetUSD: number;
  status: 'active' | 'planning' | 'completed' | 'on_hold';
}

export interface Program {
  id: string;
  portfolioId: string;
  name: string;
  objective: string;
  directorId: string;
  projectIds: string[];
  targetCompletionQuarter: string;
  status: 'active' | 'planning' | 'completed';
}

export interface Project {
  id: string;
  programId?: string;
  name: string;
  code: string;
  description: string;
  leadDepartmentId: string;
  participatingDepartmentIds: string[];
  projectManagerId: string;
  staffedEmployeeIds: string[];
  budgetUSD: number;
  spendUSD: number;
  progressPercent: number;
  status: 'planning' | 'in_progress' | 'review' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  milestoneIds: string[];
  taskIds: string[];
  startDate: string;
  targetEndDate: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'achieved' | 'missed';
  completionPercent: number;
  deliverables: string[];
}

export interface CorporateTask {
  id: string;
  projectId?: string;
  title: string;
  description: string;
  departmentId: string;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  requiredCapabilities: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'backlog' | 'in_progress' | 'in_review' | 'completed' | 'failed';
  estimatedHours: number;
  actualHours: number;
  dueDate?: string;
  dependencies: string[];
  outputArtifacts: string[];
  createdAt: string;
  completedAt?: string;
}

export type KnowledgeLayer =
  | 'corporate'
  | 'department'
  | 'team'
  | 'employee'
  | 'project'
  | 'customer'
  | 'technical'
  | 'market'
  | 'research'
  | 'operational'
  | 'historical';

export interface LayeredKnowledgeItem {
  id: string;
  layer: KnowledgeLayer;
  title: string;
  summary: string;
  content: string;
  departmentId?: string;
  authorEmployeeId?: string;
  tags: string[];
  confidenceScore: number; // 0 - 100
  isVerified: boolean;
  version: number;
  provenanceSource: string;
  hasContradictions: boolean;
  contradictionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorldDiscovery {
  id: string;
  category: 'technology' | 'paper' | 'market' | 'open_source' | 'regulation' | 'ai_model';
  title: string;
  summary: string;
  sourceUrl: string;
  relevanceScore: number; // 0 - 100
  impactAnalysis: string;
  targetDepartmentIds: string[];
  status: 'discovered' | 'researched' | 'evaluated' | 'adopted' | 'archived';
  experimentPlan?: string;
  adoptedModulePath?: string;
  discoveredAt: string;
}

export interface WorkflowStep {
  stepId: string;
  title: string;
  assigneeRole: string;
  assigneeName?: string;
  assigneeEmployeeId?: string;
  requiredCapability: string;
  departmentId: string;
  timeoutMs: number;
  requiresHumanApproval: boolean;
  dependencies: string[];
  compensationAction?: string;
  taskDescription?: string;
  acceptanceCriteria?: string[];
  artifactPaths?: string[];
  status: 'pending' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'compensated';
  outputResult?: any;
}

export interface WorkflowInstance {
  id: string;
  definitionName: string;
  category: 'engineering' | 'marketing' | 'security' | 'finance' | 'hr' | 'operations';
  description: string;
  initiatorEmployeeId: string;
  currentStepIndex: number;
  status: 'pending' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'rolled_back';
  steps: WorkflowStep[];
  startedAt: string;
  completedAt?: string;
  auditTrail: Array<{ timestamp: string; event: string; actor: string }>;
}

export interface DecisionAlternative {
  id: string;
  title: string;
  pros: string[];
  cons: string[];
  estimatedCostUSD: number;
  riskRating: RiskSeverity;
}

export interface DecisionRecord {
  id: string;
  title: string;
  objective: string;
  alternatives: DecisionAlternative[];
  chosenAlternativeId: string;
  evidence: string[];
  assumptions: string[];
  risks: string[];
  constraints: string[];
  decisionMakerId: string;
  decisionMakerTitle: string;
  timestamp: string;
  expectedOutcome: string;
  actualOutcome?: string;
  reviewDate?: string;
  status: 'proposed' | 'approved' | 'executed' | 'reviewed';
}

export interface FailureRecord {
  id: string;
  title: string;
  failureType:
    | 'execution_error'
    | 'timeout'
    | 'logic_flaw'
    | 'security_block'
    | 'resource_exhaustion'
    | 'integration_failure'
    | 'human_error';
  taskId?: string;
  employeeId?: string;
  employeeName?: string;
  workflowId?: string;
  toolId?: string;
  environmentSummary: string;
  rootCause: string;
  attemptedSolutions: string[];
  finalSolution: string;
  preventionStrategy: string;
  severity: RiskSeverity;
  timestamp: string;
  isResolved: boolean;
}

export interface GovernanceAuditEntry {
  id: string;
  timestamp: string;
  who: string; // Employee ID or system actor
  what: string; // Operation performed
  why: string; // Business reason or task objective
  withWhichTool: string; // Tool / API / Sandbox utilized
  usingWhichAuthorization: string; // Permission / Clearance / Token used
  withWhichInput: any; // Parameters provided
  whatResulted: any; // Output or status
  riskClassification: RiskSeverity;
  status: 'allowed' | 'blocked' | 'flagged';
}

export interface CompanyBrainAnswer {
  question: string;
  summary: string;
  strategicContext: string;
  keyDirectives: string[];
  relevantDepartments: string[];
  assignedWorkforce: Array<{ employeeId: string; name: string; role: string; contribution: string }>;
  requiredResources: string[];
  identifiedRisks: string[];
  pastPrecedents: string[];
  immediateNextActions: string[];
  confidenceScore: number;
}

export type InefficiencyCategory =
  | 'repetitive_work'
  | 'bottleneck'
  | 'expensive_process'
  | 'slow_workflow'
  | 'failure'
  | 'unnecessary_manual_step';

export interface RemediationResult {
  remediatedAt: string;
  actionsTaken: string[];
  beforeMetric: string;
  afterMetric: string;
  improvementPercent: number;
  automatedWorkflowId?: string;
  learningArtifactId?: string;
  persistedKnowledgeUpdate?: string;
}

export interface IdentifiedInefficiency {
  id: string;
  category: InefficiencyCategory;
  title: string;
  location: string; // Department, Employee, Workflow, or Microservice
  detectedAt: string;
  severity: RiskSeverity;
  impactDescription: string;
  metrics: {
    currentLatencyMs?: number;
    currentTokensPerRun?: number;
    repetitiveFrequencyPerDay?: number;
    manualHoursSpentPerWeek?: number;
    failureRatePercent?: number;
    costImpactUSDMonth?: number;
  };
  rootCauseAnalysis: string;
  proposedRemediation: string;
  remediationActionType:
    | 'eliminate_manual_step'
    | 'parallelize_workflow'
    | 'cache_and_deduplicate'
    | 'rebalance_workload'
    | 'root_cause_fix'
    | 'zero_touch_automation';
  assignedRemediationAgentId: string;
  assignedRemediationAgentName: string;
  status: 'detected' | 'remediating' | 'resolved' | 'verified';
  remediationResult?: RemediationResult;
}

export interface CompanyOptimizationAudit {
  timestamp: string;
  totalIdentified: number;
  resolvedCount: number;
  breakdown: Record<InefficiencyCategory, number>;
  estimatedHoursSavedPerWeek: number;
  estimatedCostSavingsMonthlyUSD: number;
  overallEfficiencyBoostPercent: number;
  items: IdentifiedInefficiency[];
}
