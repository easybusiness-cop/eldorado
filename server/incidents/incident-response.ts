import { createHash } from 'node:crypto';
import { SecuritySecretService } from '../security/secrets.ts';
import type { Department, WorkflowInstance, WorkflowStep } from '../corporation/types.ts';

type IncidentDepartment = Pick<Department, 'id' | 'headName' | 'headRole' | 'headOfDepartmentId'>;

const INCIDENT_STEPS: Array<Pick<
  WorkflowStep,
  | 'title'
  | 'departmentId'
  | 'requiredCapability'
  | 'taskDescription'
  | 'acceptanceCriteria'
  | 'artifactPaths'
  | 'requiresHumanApproval'
>> = [
  {
    title: 'Correlate local threat intelligence',
    departmentId: 'dept-corp-intel',
    requiredCapability: 'threat_intelligence',
    taskDescription: 'Review only the synthetic alert and locally available evidence; identify confirmed facts, unknowns, and scope.',
    acceptanceCriteria: ['Separate observed facts from assumptions', 'Do not browse external sources or contact third parties'],
    requiresHumanApproval: false,
  },
  {
    title: 'Assess severity and recommend containment',
    departmentId: 'dept-sec',
    requiredCapability: 'incident_triage',
    taskDescription: 'Classify the synthetic credential-exposure alert and document a reversible containment recommendation.',
    acceptanceCriteria: ['Record severity and rationale', 'Do not revoke credentials or change network access'],
    requiresHumanApproval: false,
  },
  {
    title: 'Implement and test local incident tooling',
    departmentId: 'dept-eng',
    requiredCapability: 'software_development',
    taskDescription: 'Implement deterministic incident-response task assignment, evidence recording, secret redaction, and approval gates.',
    acceptanceCriteria: ['Type-check the implementation', 'Test sequential task transitions and the executive approval gate'],
    artifactPaths: ['server/incidents/incident-response.ts', 'tests/incident-response.test.ts'],
    requiresHumanApproval: false,
  },
  {
    title: 'Review AI and model-routing telemetry',
    departmentId: 'dept-ai',
    requiredCapability: 'model_observability',
    taskDescription: 'Assess the supplied local model/provider status and list relevant gaps without inferring a compromise.',
    acceptanceCriteria: ['Use only collected local status evidence', 'Do not invoke unavailable providers or external APIs'],
    requiresHumanApproval: false,
  },
  {
    title: 'Prepare service-recovery runbook',
    departmentId: 'dept-cloud',
    requiredCapability: 'site_reliability',
    taskDescription: 'Prepare a local-only containment and recovery checklist; distinguish recommendations from executed operations.',
    acceptanceCriteria: ['Document rollback and verification checks', 'Do not access cloud accounts or deploy changes'],
    requiresHumanApproval: false,
  },
  {
    title: 'Assess financial impact',
    departmentId: 'dept-fin',
    requiredCapability: 'financial_analysis',
    taskDescription: 'Identify which financial facts are needed to assess exposure; report unknown values as unknown.',
    acceptanceCriteria: ['Do not fabricate loss estimates or modify ledgers', 'List required evidence for any estimate'],
    requiresHumanApproval: false,
  },
  {
    title: 'Review privacy and personnel impact',
    departmentId: 'dept-hr',
    requiredCapability: 'privacy_compliance',
    taskDescription: 'Determine what minimum personnel or privacy review would be appropriate for the synthetic event.',
    acceptanceCriteria: ['Do not include real personal data', 'Do not notify or contact employees'],
    requiresHumanApproval: false,
  },
  {
    title: 'Draft internal incident update',
    departmentId: 'dept-mkt',
    requiredCapability: 'incident_communications',
    taskDescription: 'Prepare an internal-only status draft that clearly marks unknowns and is not sent.',
    acceptanceCriteria: ['Label the message as a draft', 'Do not publish or send communications'],
    requiresHumanApproval: false,
  },
  {
    title: 'Identify customer-impact checks',
    departmentId: 'dept-sales',
    requiredCapability: 'customer_impact_analysis',
    taskDescription: 'Specify a customer-impact review checklist without querying accounts or contacting customers.',
    acceptanceCriteria: ['Use no customer records', 'Do not send customer communications'],
    requiresHumanApproval: false,
  },
  {
    title: 'Approve incident disposition',
    departmentId: 'dept-exec',
    requiredCapability: 'incident_approval',
    taskDescription: 'Review the recorded work packets and explicitly approve or reject the proposed local incident disposition.',
    acceptanceCriteria: ['Record an explicit human decision', 'Approval does not authorize external action or deployment'],
    requiresHumanApproval: true,
  },
];

export class IncidentWorkflowError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'IncidentWorkflowError';
  }
}

export function createIncidentResponseSimulation(
  departments: IncidentDepartment[],
  options: { id: string; now?: string },
): WorkflowInstance {
  const departmentById = new Map(departments.map((department) => [department.id, department]));
  const now = options.now ?? new Date().toISOString();

  const steps: WorkflowStep[] = INCIDENT_STEPS.map((definition, index) => {
    const department = departmentById.get(definition.departmentId);
    if (!department) {
      throw new IncidentWorkflowError(
        `Required incident-response department is missing: ${definition.departmentId}`,
        503,
        'INCIDENT_DEPARTMENT_UNAVAILABLE',
      );
    }

    const employeeId = department.headOfDepartmentId;
    return {
      stepId: `incident-step-${index + 1}`,
      title: definition.title,
      assigneeRole: department.headRole,
      assigneeName: department.headName,
      assigneeEmployeeId: employeeId || undefined,
      requiredCapability: definition.requiredCapability,
      departmentId: department.id,
      timeoutMs: 60 * 60 * 1000,
      requiresHumanApproval: definition.requiresHumanApproval,
      dependencies: index === 0 ? [] : [`incident-step-${index}`],
      taskDescription: definition.taskDescription,
      acceptanceCriteria: definition.acceptanceCriteria,
      artifactPaths: definition.artifactPaths,
      status: index === 0 ? 'running' : 'pending',
    };
  });

  return {
    id: options.id,
    definitionName: 'Incident Response Simulation: Synthetic Credential Exposure',
    category: 'security',
    description: 'Local tabletop exercise using a synthetic alert. No real credential, customer, vendor, cloud account, or external system is involved.',
    initiatorEmployeeId: 'emp-michael',
    currentStepIndex: 0,
    status: 'running',
    steps,
    startedAt: now,
    auditTrail: [
      {
        timestamp: now,
        event: 'Synthetic local incident simulation created; no external actions were authorized or executed.',
        actor: 'operator',
      },
    ],
  };
}

export function recordIncidentStepEvidence(
  workflow: WorkflowInstance,
  stepId: string,
  evidence: string,
  now = new Date().toISOString(),
): WorkflowInstance {
  assertIncidentWorkflow(workflow);
  const safeEvidence = typeof evidence === 'string' ? evidence.trim() : '';
  if (safeEvidence.length < 5 || safeEvidence.length > 2_000) {
    throw new IncidentWorkflowError(
      'Evidence must contain between 5 and 2,000 characters.',
      400,
      'INCIDENT_EVIDENCE_INVALID',
    );
  }
  const currentStep = workflow.steps[workflow.currentStepIndex];
  if (!currentStep || currentStep.stepId !== stepId) {
    throw new IncidentWorkflowError('Only the current assigned work packet may be completed.', 409, 'INCIDENT_STEP_OUT_OF_ORDER');
  }
  if (currentStep.requiresHumanApproval || workflow.status === 'waiting_approval') {
    throw new IncidentWorkflowError('This step requires an explicit human approval decision.', 409, 'INCIDENT_APPROVAL_REQUIRED');
  }
  if (workflow.status !== 'running') {
    throw new IncidentWorkflowError('Incident workflow is not accepting work evidence.', 409, 'INCIDENT_NOT_RUNNING');
  }

  const redactedEvidence = SecuritySecretService.redact(safeEvidence);
  const next = structuredClone(workflow);
  const completedStep = next.steps[next.currentStepIndex];
  completedStep.status = 'completed';
  completedStep.outputResult = {
    evidenceSummary: redactedEvidence,
    evidenceSha256: createHash('sha256').update(redactedEvidence).digest('hex'),
    recordedAt: now,
    recordedBy: 'Local Operator',
  };
  next.auditTrail.push({
    timestamp: now,
    event: `Work evidence recorded for "${completedStep.title}" by Local Operator`,
    actor: 'local-operator',
  });

  next.currentStepIndex += 1;
  const nextStep = next.steps[next.currentStepIndex];
  if (!nextStep) {
    next.status = 'completed';
    next.completedAt = now;
    next.auditTrail.push({
      timestamp: now,
      event: 'Incident-response simulation completed all work packets.',
      actor: 'system',
    });
  } else if (nextStep.requiresHumanApproval) {
    nextStep.status = 'waiting_approval';
    next.status = 'waiting_approval';
  } else {
    nextStep.status = 'running';
  }

  return next;
}

export function decideIncidentApproval(
  workflow: WorkflowInstance,
  decision: 'approved' | 'rejected',
  notes: string,
  now = new Date().toISOString(),
): WorkflowInstance {
  assertIncidentWorkflow(workflow);
  if (workflow.status !== 'waiting_approval') {
    throw new IncidentWorkflowError('Incident workflow is not waiting for approval.', 409, 'INCIDENT_NOT_AWAITING_APPROVAL');
  }

  const currentStep = workflow.steps[workflow.currentStepIndex];
  if (!currentStep?.requiresHumanApproval || currentStep.status !== 'waiting_approval') {
    throw new IncidentWorkflowError('No human approval is pending for this incident.', 409, 'INCIDENT_APPROVAL_NOT_PENDING');
  }

  const next = structuredClone(workflow);
  const approvalStep = next.steps[next.currentStepIndex];
  approvalStep.status = decision === 'approved' ? 'completed' : 'failed';
  approvalStep.outputResult = {
    decision,
    notes: SecuritySecretService.redact(notes.trim()).slice(0, 2_000),
    recordedAt: now,
  };
  next.auditTrail.push({
    timestamp: now,
    event: `Human ${decision} incident disposition at "${approvalStep.title}".`,
    actor: 'operator',
  });

  if (decision === 'rejected') {
    next.status = 'failed';
    next.completedAt = now;
    return next;
  }

  next.currentStepIndex += 1;
  next.status = 'completed';
  next.completedAt = now;
  next.auditTrail.push({
    timestamp: now,
    event: 'Incident-response simulation completed after explicit human approval.',
    actor: 'system',
  });
  return next;
}

function assertIncidentWorkflow(workflow: WorkflowInstance): void {
  if (!workflow.id.startsWith('sim-incident-')) {
    throw new IncidentWorkflowError('This operation is limited to local incident simulations.', 400, 'INCIDENT_SIMULATION_ONLY');
  }
}
