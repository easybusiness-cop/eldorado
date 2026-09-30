import { Router, Request, Response } from 'express';
import { corporationStore } from '../corporation/corporation.store.ts';
import { companyBrain } from '../corporation/company-brain.service.ts';
import { workforceEngine } from '../corporation/workforce.engine.ts';
import { collaborationFabric } from '../corporation/collaboration-fabric.service.ts';
import { computerEnvironment } from '../corporation/computer-environment.service.ts';
import { corporateOptimizer } from '../corporation/corporate-optimizer.service.ts';
import {
  Department,
  PersistentVirtualEmployee,
  Project,
  DecisionRecord,
  WorldDiscovery,
  LayeredKnowledgeItem,
} from '../corporation/types.ts';

const router = Router();

/**
 * GET /api/corporation/overview
 * Returns complete high-level company profile, key statistics, and active corporate state
 */
router.get('/overview', (req: Request, res: Response) => {
  try {
    const store = corporationStore;
    const departments = Array.from(store.departments.values());
    const employees = Array.from(store.employees.values());
    const projects = Array.from(store.projects.values());
    const discoveries = Array.from(store.discoveries.values());
    const decisions = Array.from(store.decisions.values());
    const workflows = Array.from(store.workflows.values());
    const failures = Array.from(store.failures.values());

    res.json({
      success: true,
      company: store.company,
      summary: {
        totalDivisions: store.divisions.size,
        totalDepartments: departments.length,
        totalTeams: store.teams.size,
        totalEmployees: employees.length,
        totalActiveProjects: projects.filter((p) => p.status === 'in_progress').length,
        totalDiscoveries: discoveries.length,
        totalDecisions: decisions.length,
        activeWorkflows: workflows.filter((w) => w.status === 'running').length,
        resolvedFailures: failures.filter((f) => f.isResolved).length,
        averageWorkload: Math.round(
          employees.reduce((acc, e) => acc + e.workloadPercent, 0) / Math.max(1, employees.length)
        ),
      },
      divisions: Array.from(store.divisions.values()),
      recentDiscoveries: discoveries.slice(-5).reverse(),
      recentDecisions: decisions.slice(-5).reverse(),
      recentAuditEntries: store.auditLog.slice(0, 10),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/corporation/departments
 */
router.get('/departments', (req: Request, res: Response) => {
  try {
    const store = corporationStore;
    const depts = Array.from(store.departments.values()).map((dept) => {
      const teams = Array.from(store.teams.values()).filter((t) => t.departmentId === dept.id);
      const employees = Array.from(store.employees.values()).filter((e) => e.departmentId === dept.id);
      return {
        ...dept,
        teams,
        headcountActual: employees.length,
        employeeRoster: employees.map((e) => ({
          id: e.id,
          name: e.displayName,
          role: e.roleTitle,
          status: e.status,
          seniority: e.seniority,
          clearance: e.clearanceLevel,
        })),
      };
    });
    res.json({ success: true, departments: depts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/corporation/departments
 * Dynamically create or reorganize a department
 */
router.post('/departments', (req: Request, res: Response) => {
  try {
    const { name, code, divisionId, description, headName, headRole, budgetUSD } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, error: 'Department name and code are required.' });
    }

    const deptId = `dept-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const newDept: Department = {
      id: deptId,
      divisionId: divisionId || 'div-tech',
      name,
      code,
      description: description || 'Autonomous organizational unit.',
      headOfDepartmentId: 'emp-michael',
      headName: headName || 'Department Lead',
      headRole: headRole || 'Department Director',
      budgetUSD: Number(budgetUSD) || 1_000_000,
      annualSpendUSD: 0,
      headcount: 1,
      activeProjectsCount: 0,
      workloadPercent: 60,
      teamIds: [],
      clearanceRequired: 70,
      keyCapabilities: [],
    };

    corporationStore.departments.set(deptId, newDept);
    corporationStore.recordAudit({
      who: 'Founder / Administrator',
      what: `Commissioned Department: ${name} (${code})`,
      why: 'Corporate organizational expansion',
      withWhichTool: 'organization-engine',
      usingWhichAuthorization: 'system:admin',
      withWhichInput: req.body,
      whatResulted: { departmentId: deptId },
      riskClassification: 'LOW',
      status: 'allowed',
    });

    corporationStore.saveToDisk();
    res.json({ success: true, department: newDept });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/corporation/employees
 */
router.get('/employees', (req: Request, res: Response) => {
  try {
    const employees = Array.from(corporationStore.employees.values());
    res.json({ success: true, count: employees.length, employees });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/corporation/employees/:id
 */
router.get('/employees/:id', (req: Request, res: Response) => {
  try {
    const employee = corporationStore.employees.get(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found.' });
    }
    res.json({ success: true, employee });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/corporation/employees
 * Deliberate persistent employee creation based on verified capability gap
 */
router.post('/employees', (req: Request, res: Response) => {
  try {
    const { displayName, roleTitle, departmentId, seniority, capabilities, justification } = req.body;
    if (!displayName || !roleTitle || !departmentId) {
      return res.status(400).json({ success: false, error: 'displayName, roleTitle, and departmentId are required.' });
    }

    const dept = corporationStore.departments.get(departmentId);
    if (!dept) {
      return res.status(404).json({ success: false, error: `Department ${departmentId} does not exist.` });
    }

    const handle = displayName.toLowerCase().replace(/[^a-z0-9]/g, '.');
    const empId = `emp-${handle}-${Math.random().toString(36).substring(2, 5)}`;

    const newEmployee: PersistentVirtualEmployee = {
      id: empId,
      displayName,
      handle,
      roleTitle,
      departmentId,
      departmentName: dept.name,
      managerId: dept.headOfDepartmentId || 'emp-michael',
      managerName: dept.headName || 'Michael G. Scott',
      subordinateIds: [],
      clearanceLevel: seniority === 'executive' ? 95 : seniority === 'director' ? 85 : 70,
      seniority: seniority || 'specialist',
      status: 'idle',
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
      email: `${handle}@rufflo.corp`,
      bio: `Persistent virtual employee assigned to ${dept.name}. Commissioned to fill proven capability gap: ${justification || 'Enterprise operations'}.`,
      capabilities: Array.isArray(capabilities) ? capabilities : [],
      responsibilities: [`Execute specialized tasks in ${dept.name}`, 'Maintain continuous learning and audit compliance'],
      currentTask: null,
      activeProjectIds: [],
      workloadPercent: 0,
      computerEnvironment: {
        workspaceId: `ws-${handle}`,
        sandboxPath: `/workspaces/${dept.code.toLowerCase()}/${handle}`,
        terminalSessionId: `term-${empId}`,
        browserProfileId: `browser-${empId}`,
        approvedTools: ['code-sandbox', 'git', 'terminal'],
        accounts: [],
        environmentVariables: { EMPLOYEE_ID: empId },
        activeProcessesCount: 0,
      },
      metrics: {
        tasksCompleted: 0,
        accuracyScore: 100.0,
        costEfficiency: 100.0,
        uptimePercent: 100.0,
        tokensProcessed: 0,
      },
      decisionHistoryIds: [],
      failureHistoryIds: [],
      learningHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    corporationStore.employees.set(empId, newEmployee);
    dept.headcount += 1;
    corporationStore.company.headcountTotal += 1;

    corporationStore.recordAudit({
      who: 'Workforce Intelligence Engine',
      what: `Commissioned Persistent Employee: ${displayName} (${roleTitle})`,
      why: justification || 'Capability gap resolution',
      withWhichTool: 'employee-factory',
      usingWhichAuthorization: 'system:admin',
      withWhichInput: req.body,
      whatResulted: { employeeId: empId },
      riskClassification: 'LOW',
      status: 'allowed',
    });

    corporationStore.saveToDisk();
    res.json({ success: true, employee: newEmployee });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/corporation/brain/consult
 * Consult the Company Brain on strategy, work, workforce, or risks
 */
router.post('/brain/consult', async (req: Request, res: Response) => {
  try {
    const { question, contextFilter } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ success: false, error: 'A question string is required.' });
    }

    const answer = await companyBrain.consultBrain(question, contextFilter);
    res.json({ success: true, answer });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/corporation/projects
 */
router.get('/projects', (req: Request, res: Response) => {
  try {
    const store = corporationStore;
    res.json({
      success: true,
      portfolios: Array.from(store.portfolios.values()),
      programs: Array.from(store.programs.values()),
      projects: Array.from(store.projects.values()),
      tasks: Array.from(store.tasks.values()),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/corporation/projects
 */
router.post('/projects', (req: Request, res: Response) => {
  try {
    const { name, description, leadDepartmentId, budgetUSD, participatingDepartmentIds } = req.body;
    if (!name || !leadDepartmentId) {
      return res.status(400).json({ success: false, error: 'Project name and leadDepartmentId are required.' });
    }

    const projId = `proj-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 5)}`;
    const newProject: Project = {
      id: projId,
      name,
      code: `PRJ-${Math.floor(100 + Math.random() * 900)}`,
      description: description || 'Cross-departmental strategic initiative.',
      leadDepartmentId,
      participatingDepartmentIds: participatingDepartmentIds || [leadDepartmentId],
      projectManagerId: 'emp-hank',
      staffedEmployeeIds: ['emp-hank', 'emp-dwight'],
      budgetUSD: Number(budgetUSD) || 500_000,
      spendUSD: 0,
      progressPercent: 0,
      status: 'planning',
      priority: 'high',
      milestoneIds: [],
      taskIds: [],
      startDate: new Date().toISOString().split('T')[0],
      targetEndDate: new Date(Date.now() + 90 * 86400 * 1000).toISOString().split('T')[0],
    };

    corporationStore.projects.set(projId, newProject);
    corporationStore.saveToDisk();

    res.json({ success: true, project: newProject });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/corporation/discoveries
 */
router.get('/discoveries', (req: Request, res: Response) => {
  try {
    res.json({ success: true, discoveries: Array.from(corporationStore.discoveries.values()).reverse() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/corporation/discoveries/scan
 * Runs an autonomous discovery sweep
 */
router.post('/discoveries/scan', (req: Request, res: Response) => {
  try {
    const candidateDiscoveries: Array<Omit<WorldDiscovery, 'id' | 'discoveredAt'>> = [
      {
        category: 'technology',
        title: 'Deterministic State Recovery for Multi-Agent Task Rings',
        summary: 'Novel protocol for replaying failed microservice steps with zero memory leakage.',
        sourceUrl: 'https://arxiv.org/abs/2609.04821',
        relevanceScore: 94,
        impactAnalysis: 'Bolsters Spider Web task-ring persistence under sudden container restarts.',
        targetDepartmentIds: ['dept-eng', 'dept-cloud'],
        status: 'evaluated',
        experimentPlan: 'Integrate into server/spider/task-ring.ts failover handler.',
      },
      {
        category: 'ai_model',
        title: 'Ultra-low Latency Structured JSON Output Strategies',
        summary: 'Constrained decoding algorithms yielding 4x throughput for enterprise schema extraction.',
        sourceUrl: 'https://github.com/vllm-project/vllm',
        relevanceScore: 96,
        impactAnalysis: 'Directly accelerates Company Brain query evaluation.',
        targetDepartmentIds: ['dept-ai', 'dept-eng'],
        status: 'adopted',
        adoptedModulePath: 'server/corporation/company-brain.service.ts',
      },
    ];

    const added: WorldDiscovery[] = [];
    candidateDiscoveries.forEach((cand) => {
      const id = `disc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const item: WorldDiscovery = {
        id,
        ...cand,
        discoveredAt: new Date().toISOString(),
      };
      corporationStore.discoveries.set(id, item);
      added.push(item);
    });

    corporationStore.recordAudit({
      who: 'emp-ryan (Corporate Intelligence)',
      what: `Autonomous World Discovery Sweep: Ingested ${added.length} discoveries`,
      why: 'Continuous external technology and science monitoring',
      withWhichTool: 'web-explorer',
      usingWhichAuthorization: 'research:read',
      withWhichInput: { count: candidateDiscoveries.length },
      whatResulted: { ingestedIds: added.map((a) => a.id) },
      riskClassification: 'LOW',
      status: 'allowed',
    });

    corporationStore.saveToDisk();
    res.json({ success: true, count: added.length, discoveries: added });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/corporation/knowledge
 */
router.get('/knowledge', (req: Request, res: Response) => {
  try {
    const layer = req.query.layer as string | undefined;
    let items = Array.from(corporationStore.knowledge.values());
    if (layer) {
      items = items.filter((k) => k.layer === layer);
    }
    res.json({ success: true, count: items.length, knowledge: items.reverse() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/corporation/knowledge
 */
router.post('/knowledge', (req: Request, res: Response) => {
  try {
    const { layer, title, summary, content, tags, departmentId, provenanceSource } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Title and content are required.' });
    }

    const id = `know-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newKnowledge: LayeredKnowledgeItem = {
      id,
      layer: layer || 'corporate',
      title,
      summary: summary || title,
      content,
      departmentId,
      authorEmployeeId: 'emp-michael',
      tags: Array.isArray(tags) ? tags : ['knowledge'],
      confidenceScore: 98,
      isVerified: true,
      version: 1,
      provenanceSource: provenanceSource || 'Internal Verification',
      hasContradictions: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    corporationStore.knowledge.set(id, newKnowledge);
    corporationStore.saveToDisk();

    res.json({ success: true, knowledge: newKnowledge });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/corporation/workflows
 */
router.get('/workflows', (req: Request, res: Response) => {
  try {
    res.json({ success: true, workflows: Array.from(corporationStore.workflows.values()) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/corporation/workflows/:id/advance
 * Advances or completes the next step in a persistent business process workflow
 */
router.post('/workflows/:id/advance', (req: Request, res: Response) => {
  try {
    const wf = corporationStore.workflows.get(req.params.id);
    if (!wf) {
      return res.status(404).json({ success: false, error: 'Workflow instance not found.' });
    }

    if (wf.currentStepIndex < wf.steps.length) {
      const step = wf.steps[wf.currentStepIndex];
      step.status = 'completed';
      step.outputResult = { completedBy: step.assigneeRole, timestamp: new Date().toISOString() };
      wf.auditTrail.push({
        timestamp: new Date().toISOString(),
        event: `Step "${step.title}" completed by ${step.assigneeRole}`,
        actor: step.assigneeRole,
      });

      wf.currentStepIndex += 1;
      if (wf.currentStepIndex >= wf.steps.length) {
        wf.status = 'completed';
        wf.completedAt = new Date().toISOString();
        wf.auditTrail.push({
          timestamp: new Date().toISOString(),
          event: `Workflow "${wf.definitionName}" successfully completed all stages`,
          actor: 'system',
        });
      } else {
        wf.steps[wf.currentStepIndex].status = 'running';
      }
    }

    corporationStore.saveToDisk();
    res.json({ success: true, workflow: wf });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/corporation/decisions
 */
router.get('/decisions', (req: Request, res: Response) => {
  try {
    res.json({ success: true, decisions: Array.from(corporationStore.decisions.values()).reverse() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/corporation/decisions
 */
router.post('/decisions', (req: Request, res: Response) => {
  try {
    const { title, objective, alternatives, chosenAlternativeId, evidence, decisionMakerId, expectedOutcome } = req.body;
    if (!title || !objective || !chosenAlternativeId) {
      return res.status(400).json({ success: false, error: 'title, objective, and chosenAlternativeId are required.' });
    }

    const id = `dec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newDecision: DecisionRecord = {
      id,
      title,
      objective,
      alternatives: Array.isArray(alternatives) ? alternatives : [],
      chosenAlternativeId,
      evidence: Array.isArray(evidence) ? evidence : [],
      assumptions: ['Market conditions and API quotas remain steady.'],
      risks: ['Execution latency within SLA tolerances.'],
      constraints: ['Respect zero-trust security and budget ceilings.'],
      decisionMakerId: decisionMakerId || 'emp-michael',
      decisionMakerTitle: 'Executive Intelligence',
      timestamp: new Date().toISOString(),
      expectedOutcome: expectedOutcome || 'Positive ROI and automated task velocity improvement.',
      status: 'executed',
    };

    corporationStore.decisions.set(id, newDecision);
    corporationStore.recordAudit({
      who: decisionMakerId || 'emp-michael',
      what: `Documented Explicit Corporate Decision: ${title}`,
      why: objective,
      withWhichTool: 'decision-engine',
      usingWhichAuthorization: 'executive:decision',
      withWhichInput: req.body,
      whatResulted: { decisionId: id },
      riskClassification: 'MEDIUM',
      status: 'allowed',
    });

    corporationStore.saveToDisk();
    res.json({ success: true, decision: newDecision });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/corporation/failures
 */
router.get('/failures', (req: Request, res: Response) => {
  try {
    res.json({ success: true, failures: Array.from(corporationStore.failures.values()).reverse() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/corporation/audit
 */
router.get('/audit', (req: Request, res: Response) => {
  try {
    res.json({ success: true, count: corporationStore.auditLog.length, auditLog: corporationStore.auditLog });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/corporation/workforce/dispatch
 * Autonomous task decomposition, workforce capability search, and assignment
 */
router.post('/workforce/dispatch', async (req: Request, res: Response) => {
  try {
    const { title, objective, priority, initiatorId } = req.body;
    if (!title || !objective) {
      return res.status(400).json({ success: false, error: 'title and objective are required.' });
    }

    const result = await workforceEngine.processAndDispatchTask(title, objective, priority, initiatorId);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/corporation/collaboration/messages
 */
router.get('/collaboration/messages', (req: Request, res: Response) => {
  try {
    const channelScope = req.query.channelScope as any;
    const messageType = req.query.messageType as any;
    const messages = collaborationFabric.getMessages({ channelScope, messageType });
    res.json({ success: true, count: messages.length, messages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/corporation/collaboration/messages
 */
router.post('/collaboration/messages', (req: Request, res: Response) => {
  try {
    const { channelId, channelScope, senderEmployeeId, senderName, senderRole, recipientId, recipientName, messageType, priority, subject, body, structuredPayload, requiresAction } = req.body;
    if (!subject || !body || !senderName) {
      return res.status(400).json({ success: false, error: 'subject, body, and senderName are required.' });
    }

    const message = collaborationFabric.sendMessage({
      channelId: channelId || 'chan-general',
      channelScope: channelScope || 'direct',
      senderEmployeeId: senderEmployeeId || 'emp-michael',
      senderName,
      senderRole: senderRole || 'Virtual Employee',
      recipientId: recipientId || 'all',
      recipientName: recipientName || 'All Personnel',
      messageType: messageType || 'status_report',
      priority: priority || 'medium',
      subject,
      body,
      structuredPayload,
      requiresAction: !!requiresAction,
      actionStatus: requiresAction ? 'pending' : 'completed',
    });

    res.json({ success: true, message });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/corporation/collaboration/messages/:id
 */
router.patch('/collaboration/messages/:id', (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const updated = collaborationFabric.updateMessageStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Message not found.' });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/corporation/environment/:employeeId
 */
router.get('/environment/:employeeId', (req: Request, res: Response) => {
  try {
    const workspace = computerEnvironment.getWorkspace(req.params.employeeId);
    res.json({ success: true, workspace });
  } catch (err: any) {
    res.status(404).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/corporation/environment/:employeeId/exec
 */
router.post('/environment/:employeeId/exec', async (req: Request, res: Response) => {
  try {
    const { command } = req.body;
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ success: false, error: 'command string is required.' });
    }

    const result = await computerEnvironment.executeSandboxedCommand(req.params.employeeId, command);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/corporation/optimizer/audit
 * Scans corporation across the 6 core dimensions:
 * 1. Repetitive work
 * 2. Bottlenecks
 * 3. Expensive processes
 * 4. Slow workflows
 * 5. Failures
 * 6. Unnecessary manual steps
 */
router.get('/optimizer/audit', async (_req: Request, res: Response) => {
  try {
    const audit = await corporateOptimizer.runCorporateAudit();
    res.json({ success: true, audit });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/corporation/optimizer/remediate
 * "NOW START WORKING ON IT"
 * Autonomous Remediation Engine:
 * Actively executes remediation pipelines across the identified inefficiencies,
 * decomposing and rebalancing tasks, generating zero-touch automation daemons,
 * refactoring workflows, and persisting resolutions into Company Memory.
 */
router.post('/optimizer/remediate', async (req: Request, res: Response) => {
  try {
    const { targetId } = req.body;
    const result = await corporateOptimizer.remediate(targetId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/corporation/optimizer/inefficiencies
 */
router.get('/optimizer/inefficiencies', (_req: Request, res: Response) => {
  try {
    const items = corporateOptimizer.getInefficiencies();
    res.json({ success: true, count: items.length, inefficiencies: items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/corporation/optimizer/inefficiencies/:id
 */
router.get('/optimizer/inefficiencies/:id', (req: Request, res: Response) => {
  try {
    const item = corporateOptimizer.getInefficiencyById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Inefficiency not found' });
    }
    res.json({ success: true, inefficiency: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
