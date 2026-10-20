import { applyCorporateEngineeringCompetencies, corporationStore } from './corporation.store.ts';
import {
  PersistentVirtualEmployee,
  CorporateTask,
  GovernanceAuditEntry,
} from './types.ts';
import { callGeminiResilient } from '../ai/geminiService.ts';
import {
  ENGINEERING_AGENT_COMPETENCIES,
  ENGINEERING_AGENT_PLAYBOOK,
  isEngineeringRelatedAgent,
} from '../../src/constants/engineeringCompetencies.ts';

export interface TaskDecompositionStep {
  stepIndex: number;
  title: string;
  description: string;
  requiredCapabilities: string[];
  suggestedDepartment: string;
  estimatedHours: number;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  allocationSource: 'existing_employee' | 'cross_department_delegation' | 'commissioned_specialist';
  suitabilityScore: number;
}

export interface WorkforceDispatchResult {
  taskId: string;
  taskTitle: string;
  objective: string;
  decomposedSteps: TaskDecompositionStep[];
  assignedEmployees: Array<{
    id: string;
    name: string;
    role: string;
    department: string;
    workloadBefore: number;
    workloadAfter: number;
  }>;
  commissionedEmployees: PersistentVirtualEmployee[];
  capabilityGapsFound: string[];
  executionStatus: 'ready_for_execution' | 'in_progress' | 'completed';
  timestamp: string;
}

export class WorkforceIntelligenceEngine {
  private static instance: WorkforceIntelligenceEngine;

  private constructor() {}

  public static getInstance(): WorkforceIntelligenceEngine {
    if (!WorkforceIntelligenceEngine.instance) {
      WorkforceIntelligenceEngine.instance = new WorkforceIntelligenceEngine();
    }
    return WorkforceIntelligenceEngine.instance;
  }

  /**
   * Evaluates a complex objective, decomposes it into required capabilities,
   * searches existing workforce, evaluates availability & workloads, and assigns or commissions employees.
   */
  public async processAndDispatchTask(
    title: string,
    objective: string,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'high',
    initiatorId = 'founder'
  ): Promise<WorkforceDispatchResult> {
    const store = corporationStore;
    const allEmployees = Array.from(store.employees.values());
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const isEngineeringObjective = /software|code|program|algorithm|data structure|developer|engineering|debug|repository|database|api|system design/i.test(`${title} ${objective}`);
    const engineeringGuidance = isEngineeringObjective
      ? `\n\n${ENGINEERING_AGENT_PLAYBOOK}\n\nCore engineering competencies:\n${ENGINEERING_AGENT_COMPETENCIES.join('\n')}`
      : '';
    const engineeringWorkforce = allEmployees
      .filter((employee) => isEngineeringRelatedAgent({
        departmentId: employee.departmentId,
        departmentName: employee.departmentName,
        role: employee.roleTitle,
      }))
      .map((employee) => `${employee.roleTitle}: ${employee.capabilities.map((capability) => capability.name).join(', ')}`)
      .join('\n');

    // 1. Task Decomposition & Capability Extraction
    let decomposedSteps: TaskDecompositionStep[] = [];
    try {
      if (process.env.GEMINI_API_KEY) {
        const systemPrompt = `You are the Workforce Intelligence Engine of Rufflo Autonomous Corporation.
Decompose the corporate objective into 2 to 4 concrete, actionable sequential steps.
For each step, specify the required capabilities and suggested department.
Return ONLY valid JSON matching this array structure:
[
  {
    "stepIndex": 1,
    "title": "string",
    "description": "string",
    "requiredCapabilities": ["capability_name"],
    "suggestedDepartment": "dept-id",
    "estimatedHours": number
  }
]${engineeringGuidance}`;

        const prompt = `Objective: "${title}"\nDetails: "${objective}"\nAvailable Departments: ${Array.from(store.departments.values()).map(d => `${d.id}: ${d.name}`).join(', ')}${isEngineeringObjective ? `\nEngineering workforce capabilities:\n${engineeringWorkforce}` : ''}`;
        const responseText = await callGeminiResilient({
          contents: prompt,
          systemInstruction: systemPrompt,
          preferredModel: 'gemini-3.8-flash',
          responseMimeType: 'application/json',
        });
        const clean = responseText.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(clean);
        if (Array.isArray(parsed) && parsed.length > 0) {
          decomposedSteps = parsed.map((p, idx) => ({
            stepIndex: idx + 1,
            title: p.title || `Phase ${idx + 1}`,
            description: p.description || '',
            requiredCapabilities: Array.isArray(p.requiredCapabilities) ? p.requiredCapabilities : ['general_operations'],
            suggestedDepartment: p.suggestedDepartment || 'dept-eng',
            estimatedHours: p.estimatedHours || 8,
            allocationSource: 'existing_employee',
            suitabilityScore: 90,
          }));
        }
      }
    } catch (err) {
      console.warn('[WorkforceEngine] Gemini decomposition failed, using deterministic decomposition:', err);
    }

    // Fallback deterministic decomposition if AI was unavailable
    if (decomposedSteps.length === 0) {
      decomposedSteps = [
        {
          stepIndex: 1,
          title: `Architecture, Research & Specification for ${title}`,
          description: `Analyze requirements, review existing technical knowledge, and design system specifications.`,
          requiredCapabilities: ['software_architecture', 'strategic_planning'],
          suggestedDepartment: 'dept-eng',
          estimatedHours: 12,
          allocationSource: 'existing_employee',
          suitabilityScore: 95,
        },
        {
          stepIndex: 2,
          title: `Technical Execution & Sandbox Verification`,
          description: `Implement modular code, verify unit tests, and execute within sandboxed environment.`,
          requiredCapabilities: ['software_development', 'testing'],
          suggestedDepartment: 'dept-eng',
          estimatedHours: 20,
          allocationSource: 'existing_employee',
          suitabilityScore: 92,
        },
        {
          stepIndex: 3,
          title: `Zero-Trust Security, Risk & Audit Sign-Off`,
          description: `Perform perimeter vulnerability scan, audit log verification, and executive review.`,
          requiredCapabilities: ['security_analysis', 'policy_enforcement'],
          suggestedDepartment: 'dept-sec',
          estimatedHours: 8,
          allocationSource: 'existing_employee',
          suitabilityScore: 98,
        },
      ];
    }

    // 2. Search Workforce & Match Capabilities
    const assignedEmployeesSummary: Array<{
      id: string;
      name: string;
      role: string;
      department: string;
      workloadBefore: number;
      workloadAfter: number;
    }> = [];
    const capabilityGapsFound: string[] = [];
    const newlyCommissioned: PersistentVirtualEmployee[] = [];

    for (const step of decomposedSteps) {
      // Find candidate employee
      let bestCandidate: PersistentVirtualEmployee | null = null;
      let highestScore = -1;

      for (const emp of allEmployees) {
        let score = 0;

        // Capability match
        const matchingCaps = emp.capabilities.filter(c =>
          step.requiredCapabilities.some(rc =>
            c.name.toLowerCase().includes(rc.toLowerCase()) ||
            c.id.toLowerCase().includes(rc.toLowerCase()) ||
            rc.toLowerCase().includes(c.category.toLowerCase())
          )
        );

        if (matchingCaps.length > 0) {
          const avgProficiency = matchingCaps.reduce((acc, c) => acc + c.proficiencyScore, 0) / matchingCaps.length;
          score += avgProficiency * 0.6;
        } else {
          score += 15; // baseline transferable cognitive ability
        }

        // Department match
        if (emp.departmentId === step.suggestedDepartment) {
          score += 25;
        }

        // Workload penalty (0 to 20 pts deducted)
        const workloadPenalty = (emp.workloadPercent / 100) * 20;
        score -= workloadPenalty;

        if (score > highestScore) {
          highestScore = score;
          bestCandidate = emp;
        }
      }

      // If highest score is too low (< 35), identify capability gap and deliberately commission specialist
      if (highestScore < 35 || !bestCandidate) {
        const gap = step.requiredCapabilities.join(', ');
        capabilityGapsFound.push(gap);

        // Commission persistent specialist
        const specialistRole = `${step.title.split(' ')[0]} Specialist`;
        const specialistName = `Agent ${step.requiredCapabilities[0].replace(/_/g, ' ').toUpperCase()}`;
        const handle = `specialist.${Date.now().toString(36)}`;
        const newEmpId = `emp-${handle}`;

        const commissionedEmp = applyCorporateEngineeringCompetencies({
          id: newEmpId,
          displayName: specialistName,
          handle,
          roleTitle: specialistRole,
          departmentId: step.suggestedDepartment || 'dept-eng',
          departmentName: store.departments.get(step.suggestedDepartment)?.name || 'Software Engineering',
          managerId: 'emp-hank',
          managerName: 'Hank Tate',
          subordinateIds: [],
          clearanceLevel: 75,
          seniority: 'specialist',
          status: 'working',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          email: `${handle}@rufflo.corp`,
          bio: `Deliberately commissioned specialist created to resolve verified capability gap: ${gap}.`,
          capabilities: step.requiredCapabilities.map((rc, idx) => ({
            id: `cap-${idx}-${Date.now()}`,
            name: rc.replace(/_/g, ' ').toUpperCase(),
            category: 'specialized',
            proficiencyScore: 92,
            verifiedEvidence: `Commissioned for ${title}`,
            certifiedTools: ['software-builder', 'terminal'],
          })),
          responsibilities: [`Execute specialized tasks in ${gap}`, 'Contribute to permanent company knowledge'],
          currentTask: step.title,
          activeProjectIds: [],
          workloadPercent: 50,
          computerEnvironment: {
            workspaceId: `ws-${handle}`,
            sandboxPath: `/workspaces/specialists/${handle}`,
            terminalSessionId: `term-${newEmpId}`,
            browserProfileId: `browser-${newEmpId}`,
            approvedTools: ['software-builder', 'terminal', 'code-sandbox'],
            accounts: [],
            environmentVariables: { SPECIALIST_ACTIVE: 'true' },
            activeProcessesCount: 1,
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
        });

        store.employees.set(newEmpId, commissionedEmp);
        newlyCommissioned.push(commissionedEmp);
        allEmployees.push(commissionedEmp);

        bestCandidate = commissionedEmp;
        step.allocationSource = 'commissioned_specialist';
      }

      // Assign step to candidate
      step.assignedEmployeeId = bestCandidate.id;
      step.assignedEmployeeName = bestCandidate.displayName;
      step.suitabilityScore = Math.round(Math.min(99, Math.max(50, highestScore)));

      const workloadBefore = bestCandidate.workloadPercent;
      bestCandidate.workloadPercent = Math.min(100, bestCandidate.workloadPercent + 12);
      bestCandidate.currentTask = step.title;
      bestCandidate.status = 'working';

      assignedEmployeesSummary.push({
        id: bestCandidate.id,
        name: bestCandidate.displayName,
        role: bestCandidate.roleTitle,
        department: bestCandidate.departmentName,
        workloadBefore,
        workloadAfter: bestCandidate.workloadPercent,
      });
    }

    // 3. Register Corporate Task in Store
    const corporateTask: CorporateTask = {
      id: taskId,
      title,
      description: objective,
      departmentId: decomposedSteps[0].suggestedDepartment || 'dept-eng',
      assignedEmployeeId: decomposedSteps[0].assignedEmployeeId,
      assignedEmployeeName: decomposedSteps[0].assignedEmployeeName,
      requiredCapabilities: Array.from(new Set(decomposedSteps.flatMap(s => s.requiredCapabilities))),
      priority,
      status: 'in_progress',
      estimatedHours: decomposedSteps.reduce((acc, s) => acc + s.estimatedHours, 0),
      actualHours: 0,
      dependencies: [],
      outputArtifacts: [],
      createdAt: new Date().toISOString(),
    };
    store.tasks.set(taskId, corporateTask);

    // 4. Governance Audit Entry
    store.recordAudit({
      who: initiatorId,
      what: `Dispatched Corporate Mission: "${title}" across ${decomposedSteps.length} steps`,
      why: objective,
      withWhichTool: 'workforce-intelligence-engine',
      usingWhichAuthorization: 'system:orchestrate',
      withWhichInput: { title, objective, priority },
      whatResulted: {
        taskId,
        assignedEmployeesCount: assignedEmployeesSummary.length,
        commissionedSpecialistsCount: newlyCommissioned.length,
      },
      riskClassification: priority === 'critical' ? 'HIGH' : 'MEDIUM',
      status: 'allowed',
    });

    store.saveToDisk();

    return {
      taskId,
      taskTitle: title,
      objective,
      decomposedSteps,
      assignedEmployees: assignedEmployeesSummary,
      commissionedEmployees: newlyCommissioned,
      capabilityGapsFound,
      executionStatus: 'in_progress',
      timestamp: new Date().toISOString(),
    };
  }
}

export const workforceEngine = WorkforceIntelligenceEngine.getInstance();
