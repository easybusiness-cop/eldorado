import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createIncidentResponseSimulation,
  decideIncidentApproval,
  IncidentWorkflowError,
  recordIncidentStepEvidence,
} from '../server/incidents/incident-response.ts';

const requiredDepartmentIds = [
  'dept-corp-intel',
  'dept-sec',
  'dept-eng',
  'dept-ai',
  'dept-cloud',
  'dept-fin',
  'dept-hr',
  'dept-mkt',
  'dept-sales',
  'dept-exec',
];

function createWorkflow() {
  const departments = requiredDepartmentIds.map((id) => ({
    id,
    headName: `Lead for ${id}`,
    headRole: `Director of ${id}`,
    headOfDepartmentId: `employee-${id}`,
  }));
  return createIncidentResponseSimulation(departments, {
    id: 'sim-incident-test',
    now: '2026-10-18T00:00:00.000Z',
  });
}

test('creates a local incident work packet for every required department', () => {
  const workflow = createWorkflow();
  assert.equal(workflow.steps.length, 10);
  assert.deepEqual(workflow.steps.map((step) => step.departmentId), requiredDepartmentIds);
  assert.equal(workflow.steps.filter((step) => step.status === 'running').length, 1);
  assert.equal(workflow.steps.at(-1)?.requiresHumanApproval, true);
  assert.match(workflow.description, /No real credential/);
  assert.equal(workflow.steps[2].artifactPaths?.includes('server/incidents/incident-response.ts'), true);
});

test('requires evidence for the current work packet and prevents skipping steps', () => {
  const workflow = createWorkflow();
  assert.throws(
    () => recordIncidentStepEvidence(workflow, workflow.steps[0].stepId, 'no'),
    (error: unknown) => error instanceof IncidentWorkflowError && error.code === 'INCIDENT_EVIDENCE_INVALID',
  );
  assert.throws(
    () => recordIncidentStepEvidence(workflow, workflow.steps[1].stepId, 'Reviewed the source evidence.'),
    (error: unknown) => error instanceof IncidentWorkflowError && error.code === 'INCIDENT_STEP_OUT_OF_ORDER',
  );
  assert.equal(workflow.currentStepIndex, 0);
  assert.equal(workflow.steps[0].status, 'running');
});

test('redacts evidence, hashes the safe record, and gates incident closure on human approval', () => {
  let workflow = createWorkflow();
  const token = `ghp_${'A'.repeat(36)}`;

  for (let index = 0; index < workflow.steps.length - 1; index += 1) {
    const step = workflow.steps[workflow.currentStepIndex];
    workflow = recordIncidentStepEvidence(
      workflow,
      step.stepId,
      index === 0
        ? `Reviewed synthetic alert ${token}; no external system accessed.`
        : `Reviewed the assigned local work packet for ${step.departmentId}.`,
      `2026-10-18T00:0${index}:00.000Z`,
    );
  }

  const currentStep = workflow.steps[workflow.currentStepIndex];
  assert.equal(workflow.status, 'waiting_approval');
  assert.equal(currentStep.status, 'waiting_approval');
  assert.throws(
    () => recordIncidentStepEvidence(workflow, currentStep.stepId, 'Trying to bypass approval.'),
    (error: unknown) => error instanceof IncidentWorkflowError && error.code === 'INCIDENT_APPROVAL_REQUIRED',
  );
  assert.equal(workflow.steps[0].outputResult.evidenceSummary.includes(token), false);
  assert.equal(workflow.steps[0].outputResult.evidenceSummary.includes('[REDACTED_SECURITY_GATEWAY]'), true);
  assert.match(workflow.steps[0].outputResult.evidenceSha256, /^[a-f0-9]{64}$/);
  assert.equal(workflow.steps[0].outputResult.recordedBy, 'Local Operator');
  assert.equal(workflow.auditTrail.at(-1)?.actor, 'local-operator');

  const approved = decideIncidentApproval(
    workflow,
    'approved',
    'Approved closure of the local tabletop simulation only.',
    '2026-10-18T00:10:00.000Z',
  );
  assert.equal(approved.status, 'completed');
  assert.equal(approved.currentStepIndex, 10);
  assert.equal(approved.steps.at(-1)?.outputResult.decision, 'approved');
  assert.equal(workflow.status, 'waiting_approval');
});

test('rejected approval stops the simulation and rejects non-simulation workflows', () => {
  let workflow = createWorkflow();
  for (let index = 0; index < workflow.steps.length - 1; index += 1) {
    const step = workflow.steps[workflow.currentStepIndex];
    workflow = recordIncidentStepEvidence(workflow, step.stepId, `Reviewed local evidence for ${step.departmentId}.`);
  }

  const rejected = decideIncidentApproval(workflow, 'rejected', 'Evidence is insufficient to approve closure.');
  assert.equal(rejected.status, 'failed');
  assert.equal(rejected.steps.at(-1)?.status, 'failed');
  assert.throws(
    () => recordIncidentStepEvidence({ ...workflow, id: 'wf-mkt-campaign-01' }, workflow.steps[9].stepId, 'Attempt another workflow.'),
    (error: unknown) => error instanceof IncidentWorkflowError && error.code === 'INCIDENT_SIMULATION_ONLY',
  );
});

test('fails closed if a required department is absent', () => {
  const departments = createWorkflow().steps.slice(0, 1).map((step) => ({
    id: step.departmentId,
    headName: step.assigneeName!,
    headRole: step.assigneeRole,
    headOfDepartmentId: step.assigneeEmployeeId!,
  }));
  assert.throws(
    () => createIncidentResponseSimulation(departments, { id: 'sim-incident-missing-departments' }),
    (error: unknown) => error instanceof IncidentWorkflowError && error.code === 'INCIDENT_DEPARTMENT_UNAVAILABLE',
  );
});
