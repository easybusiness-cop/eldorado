import { ObjectiveManager } from '../../objectives/index.ts';
import { ExecutionKernel } from '../../core/execution/index.ts';
import { RepositoryEngineer } from './repository-engineer.ts';
import { CoreEngineer } from './core-engineer.ts';
import { TesterEngineer } from './tester-engineer.ts';
import { NegotiationEngineer } from './negotiation-engineer.ts';
import { InfrastructureEngineer } from './infrastructure-engineer.ts';
import { SafetyEngineer } from './safety-engineer.ts';
import { EvaluationEngineer } from './evaluation-engineer.ts';
import { MasterMetaAgent } from '../../orchestration/master-meta-agent.ts';

export class MastraAgent {
  name: string;
  description?: string;
  model?: string;
  tools?: any[];
  memory: {
    log: (msg: string) => Promise<void>;
    getLogs: () => string[];
  };

  constructor(config: {
    name: string;
    description?: string;
    model?: string;
    tools?: any[];
    memory?: boolean;
  }) {
    this.name = config.name;
    this.description = config.description;
    this.model = config.model;
    this.tools = config.tools;
    const logs: string[] = [];
    this.memory = {
      log: async (msg: string) => {
        logs.push(`[${new Date().toISOString()}] ${msg}`);
        console.log(`[${config.name}] ${msg}`);
      },
      getLogs: () => [...logs],
    };
  }
}

export class EngineeringDepartmentEngineer extends MastraAgent {
  private objectiveManager: ObjectiveManager;
  private executionKernel: ExecutionKernel;
  private repoEngineer: RepositoryEngineer;
  private coreEngineer: CoreEngineer;
  private testerEngineer: TesterEngineer;
  private negotiationEngineer: NegotiationEngineer;
  private infraEngineer: InfrastructureEngineer;
  private safetyEngineer: SafetyEngineer;
  private evalEngineer: EvaluationEngineer;
  private metaAgent: MasterMetaAgent;

  constructor() {
    super({
      name: 'Engineering Department',
      description: 'Full autonomous engineering organization — MIT-level intelligence',
      model: process.env.GEMINI_API_KEY ? 'gemini-2.0-flash' : 'gemini-1.5-pro',
      tools: ['objective.create', 'objective.run', 'github.createDraftPR', 'execution.runInWorkspace'],
      memory: true,
    });

    this.objectiveManager = ObjectiveManager.getInstance();
    this.executionKernel = new ExecutionKernel();
    this.repoEngineer = new RepositoryEngineer();
    this.coreEngineer = new CoreEngineer(this.executionKernel);
    this.testerEngineer = new TesterEngineer();
    this.negotiationEngineer = new NegotiationEngineer();
    this.infraEngineer = new InfrastructureEngineer();
    this.safetyEngineer = new SafetyEngineer();
    this.evalEngineer = new EvaluationEngineer();
    this.metaAgent = new MasterMetaAgent();
  }

  async handleObjective(objective: any) {
    const goal = objective?.goal || objective?.prompt || 'Autonomous Engineering Task';
    const objectiveId = objective?.id || `obj-${Date.now()}`;

    await this.memory.log(`🚀 Starting full engineering department for: ${goal}`);
    await this.metaAgent.observe('EngineeringDepartment', 'OBJECTIVE_STARTED', { objectiveId, goal });

    // 1. Decompose into high-level tasks
    const tasks = await this.decomposeObjective({ ...objective, goal, id: objectiveId });

    // 2. Assign teams and negotiate ownership
    const teamAssignments = await this.negotiationEngineer.assignTeams(tasks);

    // 3. Run parallel teams
    const results = await this.runParallelTeams(teamAssignments, objectiveId, goal);

    // 4. Evaluate and self-improve
    const finalResult = await this.evalEngineer.evaluateResult(results);

    // 5. Create evidence + draft PR
    let prResult = null;
    if (finalResult.status === 'succeeded') {
      prResult = await this.repoEngineer.createDraftPR({
        title: `Engineering Department: ${goal.slice(0, 60)}...`,
        body: this.buildEvidenceMarkdown({ ...finalResult, goal }),
        labels: ['engineering-department', 'autonomous', 'production-ready'],
      });
    }

    const payload = {
      ...finalResult,
      goal,
      objectiveId,
      pullRequest: prResult,
      logs: this.memory.getLogs(),
    };

    await this.metaAgent.observe('EngineeringDepartment', 'OBJECTIVE_COMPLETED', payload);
    return payload;
  }

  private async decomposeObjective(objective: any) {
    return [
      { id: 'research', name: 'Repository Intelligence & Architecture', owner: 'RepoEngineer', objectiveId: objective.id },
      { id: 'code', name: 'Core Implementation & Coding', owner: 'CoreEngineer', objectiveId: objective.id },
      { id: 'test', name: 'Testing & Verification', owner: 'TesterEngineer', objectiveId: objective.id },
      { id: 'security', name: 'Safety & Guardrails', owner: 'SafetyEngineer', objectiveId: objective.id },
      { id: 'deploy', name: 'Infrastructure & Deployment', owner: 'InfraEngineer', objectiveId: objective.id },
    ];
  }

  private async runParallelTeams(assignments: any[], objectiveId: string, goal: string) {
    const promises = assignments.map(async (task) => {
      let result: any = { passed: true, success: true };

      if (task.owner === 'RepoEngineer') {
        result = await this.repoEngineer.inspectRepository();
      } else if (task.owner === 'CoreEngineer') {
        result = await this.coreEngineer.implementCode({ ...task, goal, objectiveId });
      } else if (task.owner === 'TesterEngineer') {
        result = await this.testerEngineer.runTests(task);
      } else if (task.owner === 'SafetyEngineer') {
        result = await this.safetyEngineer.evaluateSafety();
      } else if (task.owner === 'InfraEngineer') {
        result = await this.infraEngineer.deployToStaging();
      }

      await this.memory.log(`✓ Team [${task.team || task.owner}] completed task: ${task.name}`);
      return { ...task, result };
    });
    return Promise.all(promises);
  }

  private buildEvidenceMarkdown(result: any) {
    const evidenceList = (result.evidencePack || [])
      .map((e: any) => `- **${e.name || e.step || e.id}** (${e.owner}): ${e.result?.passed !== false && e.result?.success !== false ? '✅ Passed' : '❌ Failed'}`)
      .join('\n');

    return `# Engineering Department Result\n\n**Goal:** ${result.goal}\n**Status:** ${result.status}\n\n## Summary\n${result.summary}\n\n## Evidence Pack\n${evidenceList}`;
  }
}
