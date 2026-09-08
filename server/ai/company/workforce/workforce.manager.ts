import { randomUUID } from "node:crypto";
import { BaseMastraAgent } from "../../mastra/agents/base.agent.ts";
import { mastraAgentRegistry } from "../../mastra/agents/index.ts";
import { employeeFactory, DynamicVirtualEmployee } from "./employee.factory.ts";
import { roleRegistry, RoleCategory, RoleDefinition } from "./role.registry.ts";
import { capabilityRegistry, CapabilityCategory } from "./capability.registry.ts";
import { capabilityEngine } from "../../../core/capabilities/capability.engine.ts";
import { predictiveLoadBalancer } from "./predictive-load-balancer.ts";

export interface WorkforceTask {
  id: string;
  title: string;
  description: string;
  requiredCapabilities: string[];
  preferredDepartment?: string;
  priority: "low" | "medium" | "high" | "critical";
  assignedTo?: string;
  assignedAgentName?: string;
  isDynamicEmployee?: boolean;
  status: "pending" | "assigned" | "running" | "completed" | "failed";
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: any;
  suitabilityScore?: number;
  allocationSource?: "existing" | "dynamically_spawned";
  executionTimeMs?: number;
  payload?: any;
}

export interface SuitabilityEvaluation {
  agentId: string;
  agentName: string;
  department: string;
  isSuitable: boolean;
  compositeScore: number;
  coverageRatio: number;
  matchingCapabilities: string[];
  missingCapabilities: string[];
  proficiencyScore: number;
  activeTasks: number;
  workloadPenalty: number;
  departmentMatch: boolean;
  reason: string;
}

export interface CommissionRecord {
  id: string;
  agentId: string;
  agentName: string;
  roleId: string;
  roleTitle: string;
  category: string;
  requestedCapabilities: string[];
  assignedCapabilities: string[];
  commissionedAt: string;
  reason: string;
  initialTaskDescription?: string;
}

export interface WorkforceRecommendation {
  agent: BaseMastraAgent;
  confidenceScore: number;
  reason: string;
  source: "existing" | "dynamically_spawned";
  suitability?: SuitabilityEvaluation;
  commissionDetails?: CommissionRecord;
}

export interface TaskDistributionResult {
  success: boolean;
  task: WorkforceTask;
  assignedAgent: {
    id: string;
    name: string;
    department: string;
    role: string;
    isDynamic: boolean;
  };
  allocationSource: "existing" | "dynamically_spawned";
  confidenceScore: number;
  reason: string;
  activeWorkload: number;
}

export interface WorkforceStats {
  totalAgents: number;
  coreFleetCount: number;
  commissionedFleetCount: number;
  totalTasksProcessed: number;
  activeTasksCount: number;
  completedTasksCount: number;
  departmentDistribution: Record<string, number>;
  workloadByAgent: Record<string, number>;
  commissionCount: number;
}

export class WorkforceManager {
  private static instance: WorkforceManager;

  // Track active workloads: agentId -> count of currently assigned/running tasks
  private activeWorkloads: Map<string, number> = new Map();

  // Task execution records
  private tasks: Map<string, WorkforceTask> = new Map();

  // Historical audit log of dynamically commissioned agents
  private commissionHistory: CommissionRecord[] = [];

  private constructor() {}

  public static getInstance(): WorkforceManager {
    if (!WorkforceManager.instance) {
      WorkforceManager.instance = new WorkforceManager();
    }
    return WorkforceManager.instance;
  }

  /**
   * Verifies an employee's suitability for a task requiring specific capabilities.
   * Calculates capability coverage, empirical proficiency from the capability engine,
   * current workload penalty, and department affinity.
   */
  public verifyEmployeeSuitability(
    agent: BaseMastraAgent,
    requiredCapabilities: string[],
    preferredDepartment?: string,
    minCoverage = 0.5
  ): SuitabilityEvaluation {
    const agentId = agent.getId();
    const profile = capabilityEngine.get(agentId);
    const agentDept = (agent.getDepartment() || "").toLowerCase();
    const requestedDept = (preferredDepartment || "").toLowerCase();

    const matchingCapabilities: string[] = [];
    const missingCapabilities: string[] = [];
    let proficiencySum = 0;

    for (const capId of requiredCapabilities) {
      const hasCap = capabilityEngine.has(agentId, capId);
      if (hasCap) {
        matchingCapabilities.push(capId);
        const record = profile.capabilities[capId];
        // Default to baseline competence of 0.7 for statically configured skills with no runs yet
        const score = record?.score ?? 0.7;
        proficiencySum += score;
      } else {
        missingCapabilities.push(capId);
      }
    }

    const totalRequired = Math.max(requiredCapabilities.length, 1);
    const coverageRatio = matchingCapabilities.length / totalRequired;
    const proficiencyScore = matchingCapabilities.length > 0 
      ? proficiencySum / matchingCapabilities.length 
      : 0;

    // Workload check: assess current concurrent load
    const activeTasks = this.getAgentWorkload(agentId);
    // Workload penalty curve: 0 tasks = 1.0, 1 task = 0.9, 3 tasks = 0.7, 5 tasks = 0.55
    const workloadFactor = 1 / (1 + activeTasks * 0.15);
    const workloadPenalty = 1 - workloadFactor;

    // Department match bonus: +0.10 if department matches requested department
    const departmentMatch = Boolean(requestedDept && agentDept === requestedDept);
    const departmentBonus = departmentMatch ? 0.1 : 0;

    // Temporal Peak Window Efficiency check from Predictive Load Balancer
    const currentHour = new Date().getHours();
    const config = predictiveLoadBalancer.getConfig();
    let temporalPeakBonus = 0.05;
    try {
      const pred = predictiveLoadBalancer.predictOptimalAgent({
        taskTitle: requiredCapabilities.join(" "),
        taskDescription: preferredDepartment || "",
        requiredCapabilities,
        preferredDepartment,
      });
      if (pred.recommendedAgentId === agentId) {
        temporalPeakBonus = 0.15;
      } else if (pred.isCurrentWindowPeak) {
        temporalPeakBonus = 0.10;
      }
    } catch {
      // Fallback baseline
    }

    // Composite Score calculation:
    // 40% Capability Coverage + 20% Empirical Proficiency + 15% Workload Availability + 15% Temporal Peak Window + 10% Dept Alignment
    const rawComposite =
      coverageRatio * 0.40 +
      proficiencyScore * 0.20 +
      workloadFactor * 0.15 +
      temporalPeakBonus +
      departmentBonus;

    const compositeScore = Math.min(Math.max(rawComposite, 0), 1.0);

    // Suitability threshold: must satisfy minimum coverage and score >= 0.55
    const isSuitable = coverageRatio >= minCoverage && compositeScore >= 0.55;

    let reason = "";
    if (isSuitable) {
      reason = `Satisfies ${matchingCapabilities.length}/${totalRequired} capabilities (${Math.round(
        coverageRatio * 100
      )}% coverage) with proficiency ${(proficiencyScore * 100).toFixed(0)}% and workload ${activeTasks} active tasks.`;
      if (departmentMatch) {
        reason += ` Matches target ${agent.getDepartment()} department.`;
      }
    } else {
      reason = `Insufficient coverage: missing [${missingCapabilities.join(
        ", "
      )}]. Coverage ${Math.round(coverageRatio * 100)}% is below optimal threshold.`;
    }

    return {
      agentId,
      agentName: agent.getName(),
      department: agent.getDepartment(),
      isSuitable,
      compositeScore,
      coverageRatio,
      matchingCapabilities,
      missingCapabilities,
      proficiencyScore,
      activeTasks,
      workloadPenalty,
      departmentMatch,
      reason,
    };
  }

  /**
   * Scans the existing workforce to locate a verified suitable employee.
   * Returns the best candidate and suitability report, or null if no suitable candidate exists.
   */
  public findSuitableEmployee(
    requiredCapabilities: string[],
    preferredDepartment?: string,
    minScore = 0.55
  ): { agent: BaseMastraAgent; suitability: SuitabilityEvaluation } | null {
    const allAgents = mastraAgentRegistry.getAllAgents();
    let bestCandidate: { agent: BaseMastraAgent; suitability: SuitabilityEvaluation } | null = null;
    let highestScore = -1;

    for (const agent of allAgents) {
      const evaluation = this.verifyEmployeeSuitability(
        agent,
        requiredCapabilities,
        preferredDepartment
      );

      if (evaluation.isSuitable && evaluation.compositeScore >= minScore) {
        if (evaluation.compositeScore > highestScore) {
          highestScore = evaluation.compositeScore;
          bestCandidate = { agent, suitability: evaluation };
        }
      }
    }

    return bestCandidate;
  }

  /**
   * Dynamically inspects the requested capabilities and selects the most compatible base role
   * from the RoleRegistry, formulating an optimal title and category.
   */
  public determineOptimalRole(
    requiredCapabilities: string[],
    preferredDepartment?: string
  ): {
    roleId: string;
    roleTitle: string;
    category: RoleCategory;
    synthesizedName: string;
  } {
    const allRoles = roleRegistry.getAllRoles();
    let bestRole: RoleDefinition | null = null;
    let highestOverlap = -1;

    const targetDept = (preferredDepartment || "").toLowerCase();

    for (const role of allRoles) {
      const overlapCount = role.baseCapabilities.filter((cap) =>
        requiredCapabilities.includes(cap)
      ).length;

      let score = overlapCount * 2;

      // Boost if category matches preferred department
      if (targetDept && role.category.toLowerCase() === targetDept) {
        score += 3;
      }

      if (score > highestOverlap) {
        highestOverlap = score;
        bestRole = role;
      }
    }

    // Default fallback if no overlap found
    if (!bestRole) {
      if (targetDept === "research") {
        bestRole = roleRegistry.getRole("technology_researcher") || allRoles[0];
      } else if (targetDept === "marketing") {
        bestRole = roleRegistry.getRole("content_specialist") || allRoles[0];
      } else {
        bestRole = roleRegistry.getRole("software_engineer") || allRoles[0];
      }
    }

    // Synthesize an expressive title based on primary capability
    const primaryCap = requiredCapabilities[0] || "autonomous_execution";
    const formattedCap = primaryCap
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const synthesizedName = `Specialized ${formattedCap} Specialist`;

    return {
      roleId: bestRole.id,
      roleTitle: bestRole.title,
      category: bestRole.category,
      synthesizedName,
    };
  }

  /**
   * Commissions a new specialized agent with the exact requested capabilities,
   * automatically instantiating the role, updating registries, and logging the commission.
   */
  public commissionSpecializedAgent(
    taskDescription: string,
    requiredCapabilities: string[],
    preferredDepartment?: string,
    customName?: string
  ): DynamicVirtualEmployee {
    console.log(
      `[WorkforceManager] Commissioning specialized agent for task: "${taskDescription}". Capabilities: ${requiredCapabilities.join(
        ", "
      )}`
    );

    // 1. Ensure any new capabilities are registered in CapabilityRegistry so they have metadata
    for (const capId of requiredCapabilities) {
      if (!capabilityRegistry.getCapability(capId)) {
        const readableName = capId
          .replace(/[_-]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

        let category = CapabilityCategory.ENGINEERING;
        const lowerDept = (preferredDepartment || "").toLowerCase();
        if (lowerDept === "research") category = CapabilityCategory.RESEARCH;
        if (lowerDept === "marketing") category = CapabilityCategory.MARKETING;
        if (lowerDept === "operations") category = CapabilityCategory.OPERATIONS;

        capabilityRegistry.register({
          id: capId,
          name: readableName,
          description: `Dynamically commissioned specialized capability: ${readableName}`,
          category,
          requiredTier: 1,
        });
      }
    }

    // 2. Select and instantiate the optimal role profile
    const roleMatch = this.determineOptimalRole(requiredCapabilities, preferredDepartment);
    const agentName = customName || roleMatch.synthesizedName;

    // 3. Instantiate dynamic employee via EmployeeFactory
    const dynamicEmployee = employeeFactory.createEmployee(
      roleMatch.roleId,
      agentName,
      requiredCapabilities
    );

    // 4. Record audit ledger entry of commissioned agent
    const commissionRecord: CommissionRecord = {
      id: `comm-${randomUUID().slice(0, 8)}`,
      agentId: dynamicEmployee.getId(),
      agentName: dynamicEmployee.getName(),
      roleId: roleMatch.roleId,
      roleTitle: roleMatch.roleTitle,
      category: roleMatch.category,
      requestedCapabilities: [...requiredCapabilities],
      assignedCapabilities: dynamicEmployee.getAssignedCapabilities(),
      commissionedAt: new Date().toISOString(),
      reason: `Commissioned to satisfy capabilities: [${requiredCapabilities.join(
        ", "
      )}] for task: "${taskDescription.slice(0, 100)}"`,
      initialTaskDescription: taskDescription,
    };

    this.commissionHistory.unshift(commissionRecord);

    console.log(
      `[WorkforceManager] Commissioned successfully: ${dynamicEmployee.getName()} (${dynamicEmployee.getId()}) with role "${
        roleMatch.roleTitle
      }"`
    );

    return dynamicEmployee;
  }

  /**
   * Evaluates the workforce to allocate the best employee for the job.
   * If no suitable employee exists, commissions a specialized agent dynamically.
   */
  public async selectEmployeeForTask(
    taskDescription: string,
    requiredCapabilities: string[],
    preferredDepartment?: string
  ): Promise<WorkforceRecommendation> {
    console.log(
      `[WorkforceManager] Evaluating workforce for task: "${taskDescription}". Capabilities: [${requiredCapabilities.join(
        ", "
      )}]`
    );

    // 1. Check if a suitable existing employee exists
    const candidate = this.findSuitableEmployee(requiredCapabilities, preferredDepartment);

    if (candidate) {
      console.log(
        `[WorkforceManager] Existing employee selected: ${candidate.agent.getName()} (Score: ${(
          candidate.suitability.compositeScore * 100
        ).toFixed(0)}%)`
      );

      return {
        agent: candidate.agent,
        confidenceScore: candidate.suitability.compositeScore,
        reason: candidate.suitability.reason,
        source: "existing",
        suitability: candidate.suitability,
      };
    }

    // 2. No suitable employee exists; commission a specialized agent
    console.log(
      "[WorkforceManager] No suitable existing employee met the threshold. Commissioning specialized agent..."
    );

    const commissionedAgent = this.commissionSpecializedAgent(
      taskDescription,
      requiredCapabilities,
      preferredDepartment
    );

    const commissionRecord = this.commissionHistory[0];

    return {
      agent: commissionedAgent,
      confidenceScore: 0.95,
      reason: `Dynamically commissioned specialized agent "${commissionedAgent.getName()}" tailored for requested capabilities: [${requiredCapabilities.join(
        ", "
      )}].`,
      source: "dynamically_spawned",
      commissionDetails: commissionRecord,
    };
  }

  /**
   * Distributes and assigns a task across the workforce.
   * Automatically verifies employee suitability, commissions if missing,
   * updates agent workloads, and tracks execution lifecycle.
   */
  public async distributeTask(taskInput: {
    id?: string;
    title: string;
    description?: string;
    requiredCapabilities: string[];
    preferredDepartment?: string;
    priority?: "low" | "medium" | "high" | "critical";
    payload?: any;
  }): Promise<TaskDistributionResult> {
    const taskId = taskInput.id || `task-${randomUUID().slice(0, 8)}`;
    const taskDescription = taskInput.description || taskInput.title;
    const requiredCaps = taskInput.requiredCapabilities || [];

    // 1. Select suitable existing employee or commission a new specialized agent
    const recommendation = await this.selectEmployeeForTask(
      taskDescription,
      requiredCaps,
      taskInput.preferredDepartment
    );

    const agent = recommendation.agent;
    const isDynamic = (agent as any).getRoleId !== undefined;

    // 2. Increment agent workload
    const currentWorkload = this.getAgentWorkload(agent.getId());
    this.activeWorkloads.set(agent.getId(), currentWorkload + 1);

    // 3. Create and register task record
    const task: WorkforceTask = {
      id: taskId,
      title: taskInput.title,
      description: taskDescription,
      requiredCapabilities: requiredCaps,
      preferredDepartment: taskInput.preferredDepartment,
      priority: taskInput.priority || "medium",
      assignedTo: agent.getId(),
      assignedAgentName: agent.getName(),
      isDynamicEmployee: isDynamic,
      status: "assigned",
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      suitabilityScore: recommendation.confidenceScore,
      allocationSource: recommendation.source,
      payload: taskInput.payload,
    };

    this.tasks.set(taskId, task);

    return {
      success: true,
      task,
      assignedAgent: {
        id: agent.getId(),
        name: agent.getName(),
        department: agent.getDepartment(),
        role: agent.config.role,
        isDynamic,
      },
      allocationSource: recommendation.source,
      confidenceScore: recommendation.confidenceScore,
      reason: recommendation.reason,
      activeWorkload: currentWorkload + 1,
    };
  }

  /**
   * Distributes a batch of tasks simultaneously across the workforce.
   */
  public async distributeBatch(
    tasks: Array<{
      id?: string;
      title: string;
      description?: string;
      requiredCapabilities: string[];
      preferredDepartment?: string;
      priority?: "low" | "medium" | "high" | "critical";
      payload?: any;
    }>
  ): Promise<TaskDistributionResult[]> {
    const results: TaskDistributionResult[] = [];
    for (const task of tasks) {
      const res = await this.distributeTask(task);
      results.push(res);
    }
    return results;
  }

  /**
   * Marks a distributed task as completed or failed, updates workloads,
   * and records empirical feedback in CapabilityEngine.
   */
  public completeTask(
    taskId: string,
    result?: any,
    success = true,
    executionTimeMs?: number
  ): WorkforceTask | undefined {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    task.status = success ? "completed" : "failed";
    task.completedAt = new Date().toISOString();
    task.result = result;
    if (executionTimeMs) {
      task.executionTimeMs = executionTimeMs;
    }

    // Decrement agent workload
    if (task.assignedTo) {
      const currentWorkload = this.getAgentWorkload(task.assignedTo);
      this.activeWorkloads.set(task.assignedTo, Math.max(0, currentWorkload - 1));

      // Record performance in capabilityEngine
      for (const capId of task.requiredCapabilities) {
        capabilityEngine.record(
          task.assignedTo,
          capId,
          success,
          success ? 0.9 : 0.2
        );
      }
    }

    return task;
  }

  /**
   * Gets the active workload count for a specific agent.
   */
  public getAgentWorkload(agentId: string): number {
    return this.activeWorkloads.get(agentId) || 0;
  }

  /**
   * Retrieves all currently active / running tasks.
   */
  public getActiveTasks(): WorkforceTask[] {
    return Array.from(this.tasks.values()).filter(
      (t) => t.status === "assigned" || t.status === "running"
    );
  }

  /**
   * Retrieves full task history.
   */
  public getTaskHistory(limit = 50): WorkforceTask[] {
    return Array.from(this.tasks.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * Retrieves commission history of dynamic specialists.
   */
  public getCommissionHistory(): CommissionRecord[] {
    return [...this.commissionHistory];
  }

  /**
   * Returns comprehensive metrics on the current workforce state.
   */
  public getWorkforceStats(): WorkforceStats {
    const allAgents = mastraAgentRegistry.getAllAgents();
    let dynamicCount = 0;
    const departmentDistribution: Record<string, number> = {};
    const workloadByAgent: Record<string, number> = {};

    for (const agent of allAgents) {
      const isDynamic = (agent as any).getRoleId !== undefined;
      if (isDynamic) dynamicCount++;

      const dept = agent.getDepartment() || "General";
      departmentDistribution[dept] = (departmentDistribution[dept] || 0) + 1;
      workloadByAgent[agent.getId()] = this.getAgentWorkload(agent.getId());
    }

    const allTasks = Array.from(this.tasks.values());
    const activeTasksCount = allTasks.filter(
      (t) => t.status === "assigned" || t.status === "running"
    ).length;
    const completedTasksCount = allTasks.filter((t) => t.status === "completed").length;

    return {
      totalAgents: allAgents.length,
      coreFleetCount: allAgents.length - dynamicCount,
      commissionedFleetCount: dynamicCount,
      totalTasksProcessed: allTasks.length,
      activeTasksCount,
      completedTasksCount,
      departmentDistribution,
      workloadByAgent,
      commissionCount: this.commissionHistory.length,
    };
  }
}

export const workforceManager = WorkforceManager.getInstance();
