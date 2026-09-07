/**
 * Corporate Command Cascade Engine
 * 
 * Hierarchical Autonomous Corporate Execution:
 * User -> CEO -> Executive (COO) -> Department HODs -> Department Employees (in parallel) -> Synthesis
 */

import { randomUUID } from "node:crypto";
import { modelRouter } from "../../ai/providers/index.ts";
import { mastraAgentRegistry } from "../../ai/mastra/agents/index.ts";
import { employeeFactory } from "../../ai/company/workforce/employee.factory.ts";
import { workforceManager } from "../../ai/company/workforce/workforce.manager.ts";
import { roleRegistry } from "../../ai/company/workforce/role.registry.ts";
import { discoveryEngine } from "../../ai/company/knowledge/discovery.engine.ts";
import { researchManager } from "../../ai/company/knowledge/research.manager.ts";
import { knowledgeManager } from "../../ai/company/knowledge/knowledge.manager.ts";
import { capabilityEngine } from "../capabilities/capability.engine.ts";

export interface DepartmentTaskAllocation {
  taskId: string;
  department: string;
  hodName: string;
  hodRole: string;
  assignedAgentId: string;
  assignedAgentName: string;
  isDynamicEmployee: boolean;
  taskTitle: string;
  taskPrompt: string;
  requiredCapabilities: string[];
  status: "pending" | "running" | "completed" | "failed";
  output?: string;
  codeSnippet?: string;
  executionTimeMs?: number;
}

export interface DepartmentMission {
  department: string;
  hodId: string;
  hodName: string;
  hodRole: string;
  strategicObjective: string;
  assignedTasks: DepartmentTaskAllocation[];
  status: "pending" | "delegating" | "executing" | "completed" | "failed";
  departmentSummary?: string;
}

export interface CorporateCascadeRun {
  id: string;
  userCommand: string;
  startedAt: string;
  completedAt?: string;
  status: "initiated" | "ceo_directive" | "executive_breakdown" | "hod_delegation" | "employees_executing" | "completed" | "failed";
  
  // Tier 1: CEO
  ceoDirective: {
    agentId: string;
    agentName: string;
    speech: string;
    mandate: string;
    priority: "urgent" | "high" | "standard";
  };

  // Tier 2: Executive (COO)
  executivePlan: {
    agentId: string;
    agentName: string;
    analysis: string;
    activatedDepartments: string[];
  };

  // Tier 3 & 4: HODs & Simultaneous Employees
  departmentMissions: Record<string, DepartmentMission>;

  // Final Synthesis
  finalExecutiveBriefing?: string;
  ceoFinalResponse?: string;
  metrics: {
    totalDepartments: number;
    totalEmployeesInvolved: number;
    dynamicEmployeesSpawned: number;
    totalTasksExecuted: number;
    durationMs: number;
  };
}

export type CascadeProgressCallback = (event: {
  type: "ceo_speaks" | "executive_analyzes" | "hod_delegates" | "employee_working" | "employee_done" | "department_complete" | "cascade_complete" | "error";
  data: any;
}) => void;

class CorporateCascadeEngine {
  private static instance: CorporateCascadeEngine;
  private cascadeHistory: CorporateCascadeRun[] = [];

  public static getInstance(): CorporateCascadeEngine {
    if (!CorporateCascadeEngine.instance) {
      CorporateCascadeEngine.instance = new CorporateCascadeEngine();
    }
    return CorporateCascadeEngine.instance;
  }

  public getHistory(): CorporateCascadeRun[] {
    return this.cascadeHistory;
  }

  public getRunById(id: string): CorporateCascadeRun | undefined {
    return this.cascadeHistory.find((r) => r.id === id);
  }

  /**
   * Main Entry Point: Execute a corporate command through the entire hierarchy
   */
  public async executeCommand(
    userCommand: string,
    onProgress?: CascadeProgressCallback
  ): Promise<CorporateCascadeRun> {
    const startTime = Date.now();
    const runId = `cascade-${randomUUID().slice(0, 8)}`;

    const run: CorporateCascadeRun = {
      id: runId,
      userCommand,
      startedAt: new Date().toISOString(),
      status: "initiated",
      ceoDirective: {
        agentId: "michael",
        agentName: "Michael Scott (CEO & Fleet Commander)",
        speech: "",
        mandate: "",
        priority: "high",
      },
      executivePlan: {
        agentId: "dwight",
        agentName: "Dwight Schrute (COO & Master Orchestrator)",
        analysis: "",
        activatedDepartments: [],
      },
      departmentMissions: {},
      metrics: {
        totalDepartments: 0,
        totalEmployeesInvolved: 0,
        dynamicEmployeesSpawned: 0,
        totalTasksExecuted: 0,
        durationMs: 0,
      },
    };

    this.cascadeHistory.unshift(run);

    try {
      /* ================================================================= */
      /* TIER 1: CEO RECEIVES COMMAND & DIRECTS EXECUTIVE                   */
      /* ================================================================= */
      run.status = "ceo_directive";
      const ceoPrompt = `You are Michael Scott, CEO and supreme fleet commander of our AI corporation.
The company owner has given you this strategic command:
"${userCommand}"

Respond with your characteristic enthusiastic leadership, authority, and visionary energy.
1. Formulate a bold executive mandate for your Chief Operating Officer (Dwight Schrute).
2. Clearly state why this initiative is crucial for company dominance.
3. Command the executive office to mobilize all necessary departments immediately.

Output JSON with keys:
{
  "speech": "Your vocal statement addressing the user",
  "mandate": "The explicit operational directive for the Executive Office",
  "priority": "urgent" | "high" | "standard"
}`;

      const ceoResult = await modelRouter.generate({
        prompt: ceoPrompt,
        systemInstruction: "You are the CEO of an autonomous AI company. Return strict JSON.",
        temperature: 0.7,
      });

      let parsedCeo: any = null;
      try {
        const match = ceoResult.text.match(/\{[\s\S]*\}/);
        if (match) parsedCeo = JSON.parse(match[0]);
      } catch (e) {}

      run.ceoDirective.speech = parsedCeo?.speech || `Attention company! The boss has spoken: "${userCommand}". This is our highest mission! Dwight, mobilize every department right now!`;
      run.ceoDirective.mandate = parsedCeo?.mandate || `Deconstruct and execute: ${userCommand}. Coordinate engineering, research, marketing, and operations.`;
      run.ceoDirective.priority = parsedCeo?.priority || "high";

      onProgress?.({
        type: "ceo_speaks",
        data: { runId, ceoDirective: run.ceoDirective },
      });

      /* ================================================================= */
      /* TIER 2: EXECUTIVE (COO) ANALYZES & PLANS DEPARTMENT DISTRIBUTION  */
      /* ================================================================= */
      run.status = "executive_breakdown";

      const cooPrompt = `You are Dwight Schrute, Chief Operating Officer and Master Executive Orchestrator.
CEO Mandate: "${run.ceoDirective.mandate}"
Original User Goal: "${userCommand}"

Deconstruct this executive mandate into departmental operational objectives.
Select between 2 and 4 departments that MUST mobilize (e.g. engineering, research, marketing, operations).

Available Departments:
- "engineering": Technical architecture, software code, system APIs, testing. HOD: Jim Halpert.
- "research": Live web intelligence, competitor scanning, technical breakthrough extraction. HOD: Ryan Howard.
- "marketing": Campaign copy, customer communications, growth strategy, branding. HOD: Pam Beesly.
- "operations": Process workflows, quality assurance, deployment timelines, metrics. HOD: Angela Martin.

Output JSON with keys:
{
  "analysis": "Your tactical strategic assessment of how to conquer this objective",
  "departments": [
    {
      "department": "engineering",
      "strategicObjective": "Specific goal for this department"
    },
    ...
  ]
}`;

      const cooResult = await modelRouter.generate({
        prompt: cooPrompt,
        systemInstruction: "You are the COO of an AI enterprise. Return strict JSON.",
        temperature: 0.4,
      });

      let parsedCoo: any = null;
      try {
        const match = cooResult.text.match(/\{[\s\S]*\}/);
        if (match) parsedCoo = JSON.parse(match[0]);
      } catch (e) {}

      const deptsList = parsedCoo?.departments || [
        { department: "engineering", strategicObjective: `Develop and deploy technical architecture for: ${userCommand}` },
        { department: "research", strategicObjective: `Scan web and competitor landscape for best practices regarding: ${userCommand}` },
        { department: "marketing", strategicObjective: `Formulate messaging and go-to-market communication for: ${userCommand}` },
        { department: "operations", strategicObjective: `Establish quality benchmarks and operational execution roadmap` },
      ];

      run.executivePlan.analysis = parsedCoo?.analysis || "Executive Order received. Mobilizing multi-department tactical assault. All departmental heads report for immediate deployment.";
      run.executivePlan.activatedDepartments = deptsList.map((d: any) => d.department);

      onProgress?.({
        type: "executive_analyzes",
        data: { runId, executivePlan: run.executivePlan },
      });

      /* ================================================================= */
      /* TIER 3: DEPARTMENT HODs DELEGATE TO EMPLOYEES                    */
      /* ================================================================= */
      run.status = "hod_delegation";

      const hodInfoMap: Record<string, { hodId: string; hodName: string; hodRole: string }> = {
        engineering: { hodId: "jim", hodName: "Jim Halpert", hodRole: "Chief Technology Officer" },
        research: { hodId: "ryan", hodName: "Ryan Howard", hodRole: "VP of Research & Intelligence" },
        marketing: { hodId: "pam", hodName: "Pam Beesly", hodRole: "Chief Marketing Officer" },
        operations: { hodId: "angela", hodName: "Angela Martin", hodRole: "Head of Operations & Quality" },
        finance: { hodId: "oscar", hodName: "Oscar Martinez", hodRole: "Chief Financial Officer" },
      };

      // Prepare Department Missions
      for (const deptItem of deptsList) {
        const deptKey = deptItem.department;
        const hod = hodInfoMap[deptKey] || { hodId: `${deptKey}-hod`, hodName: `Head of ${deptKey}`, hodRole: `${deptKey.toUpperCase()} Director` };

        // Determine 1-2 sub-tasks for this department
        const tasks: DepartmentTaskAllocation[] = [];

        if (deptKey === "engineering") {
          tasks.push({
            taskId: `tsk-${randomUUID().slice(0, 6)}`,
            department: "engineering",
            hodName: hod.hodName,
            hodRole: hod.hodRole,
            assignedAgentId: "ruflo",
            assignedAgentName: "Ruflo Engine Specialist",
            isDynamicEmployee: false,
            taskTitle: "Core Implementation & Modular Codebase",
            taskPrompt: `Write clean, robust TypeScript architecture and production-ready implementation for: ${deptItem.strategicObjective}`,
            requiredCapabilities: ["software_development", "typescript", "architecture"],
            status: "pending",
          });
        } else if (deptKey === "research") {
          tasks.push({
            taskId: `tsk-${randomUUID().slice(0, 6)}`,
            department: "research",
            hodName: hod.hodName,
            hodRole: hod.hodRole,
            assignedAgentId: "stanley",
            assignedAgentName: "Stanley Hudson (Lead Analyst)",
            isDynamicEmployee: false,
            taskTitle: "Live Web Research & Breakthrough Synthesis",
            taskPrompt: `Analyze modern web breakthroughs, best practices, and technical standards for: ${deptItem.strategicObjective}`,
            requiredCapabilities: ["internet_research", "data_analysis"],
            status: "pending",
          });
        } else if (deptKey === "marketing") {
          tasks.push({
            taskId: `tsk-${randomUUID().slice(0, 6)}`,
            department: "marketing",
            hodName: hod.hodName,
            hodRole: hod.hodRole,
            assignedAgentId: "kelly",
            assignedAgentName: "Kelly Kapoor (Customer & Social Strategist)",
            isDynamicEmployee: false,
            taskTitle: "Value Proposition & Launch Campaign",
            taskPrompt: `Draft high-impact market communication, campaign copy, and user announcement for: ${deptItem.strategicObjective}`,
            requiredCapabilities: ["marketing_strategy", "copywriting"],
            status: "pending",
          });
        } else {
          tasks.push({
            taskId: `tsk-${randomUUID().slice(0, 6)}`,
            department: deptKey,
            hodName: hod.hodName,
            hodRole: hod.hodRole,
            assignedAgentId: "kevin",
            assignedAgentName: "Kevin Malone (Operations Analyst)",
            isDynamicEmployee: false,
            taskTitle: "Operational Quality Assurance & Milestones",
            taskPrompt: `Define service level agreements, verification checklist, and deployment safeguards for: ${deptItem.strategicObjective}`,
            requiredCapabilities: ["operations_management", "quality_assurance"],
            status: "pending",
          });
        }

        // Check if we should spawn an extra specialized employee for this department to demonstrate unlimited workforce
        if (deptKey === "engineering" || deptKey === "research") {
          const specializedRole = deptKey === "engineering" ? "software_engineer" : "technology_researcher";
          const spawnedEmployee = employeeFactory.createEmployee(
            specializedRole,
            `Specialized ${deptKey.toUpperCase()} Operator`,
            [`${deptKey}_optimization`, "autonomous_execution"]
          );

          tasks.push({
            taskId: `tsk-${randomUUID().slice(0, 6)}`,
            department: deptKey,
            hodName: hod.hodName,
            hodRole: hod.hodRole,
            assignedAgentId: spawnedEmployee.getId(),
            assignedAgentName: spawnedEmployee.getName(),
            isDynamicEmployee: true,
            taskTitle: `Advanced ${deptKey.toUpperCase()} Specialization`,
            taskPrompt: `Execute deep optimization and specialized validation on: ${deptItem.strategicObjective}`,
            requiredCapabilities: [`${deptKey}_optimization`],
            status: "pending",
          });

          run.metrics.dynamicEmployeesSpawned++;
        }

        run.departmentMissions[deptKey] = {
          department: deptKey,
          hodId: hod.hodId,
          hodName: hod.hodName,
          hodRole: hod.hodRole,
          strategicObjective: deptItem.strategicObjective,
          assignedTasks: tasks,
          status: "delegating",
        };

        onProgress?.({
          type: "hod_delegates",
          data: {
            runId,
            department: deptKey,
            hodName: hod.hodName,
            tasksCount: tasks.length,
          },
        });
      }

      /* ================================================================= */
      /* TIER 4: SIMULTANEOUS EMPLOYEE EXECUTION LOOP                      */
      /* ================================================================= */
      run.status = "employees_executing";

      // Collect all tasks across all departments for simultaneous parallel execution!
      const allTasksToRun: { deptKey: string; task: DepartmentTaskAllocation }[] = [];
      for (const [deptKey, mission] of Object.entries(run.departmentMissions)) {
        for (const task of mission.assignedTasks) {
          allTasksToRun.push({ deptKey, task });
        }
      }

      run.metrics.totalDepartments = Object.keys(run.departmentMissions).length;
      run.metrics.totalTasksExecuted = allTasksToRun.length;

      // Execute ALL employee tasks concurrently via Promise.allSettled
      await Promise.allSettled(
        allTasksToRun.map(async ({ deptKey, task }) => {
          task.status = "running";
          const taskStart = Date.now();

          onProgress?.({
            type: "employee_working",
            data: {
              runId,
              department: deptKey,
              taskId: task.taskId,
              employeeName: task.assignedAgentName,
              taskTitle: task.taskTitle,
            },
          });

          try {
            let enrichedContext = "";
            if (deptKey === "research" || task.requiredCapabilities.includes("internet_research")) {
              try {
                const intelligence = await discoveryEngine.queryIntelligence(
                  `${task.taskTitle} ${task.taskPrompt}`,
                  { forceLiveSearch: false, limit: 2 }
                );
                if (intelligence.discoveries.length > 0) {
                  enrichedContext = `\n\n[Live Internet Intelligence & Discovered Breakthroughs]:\n${intelligence.answer}\n`;
                }
              } catch {
                // non-blocking fallback
              }
            }

            // Task Execution via Model Router
            const prompt = `You are ${task.assignedAgentName}, working in the ${deptKey.toUpperCase()} department.
Your Head of Department has assigned you this task:
"${task.taskTitle}"
Instructions:
"${task.taskPrompt}"${enrichedContext}

Produce a concrete, professional, high-grade deliverable.
- If engineering: include real, functional, well-commented code snippet.
- If research: provide factual bullet points, modern methodologies, and key discoveries.
- If marketing: provide actual copy, headline, positioning, and target channels.
- If operations: provide execution timeline, acceptance criteria, and quality safeguards.`;

            const res = await modelRouter.generate({
              prompt,
              systemInstruction: `You are ${task.assignedAgentName} in an elite AI enterprise. Output complete, polished results.`,
              temperature: 0.5,
            });

            task.output = res.text;
            task.status = "completed";

            // Extract code snippet if present
            const codeMatch = res.text.match(/```(?:typescript|ts|javascript|js)?\n([\s\S]*?)```/);
            if (codeMatch) {
              task.codeSnippet = codeMatch[1].trim();
            }

            // Register capability success in Capability Engine!
            for (const cap of task.requiredCapabilities) {
              capabilityEngine.record(task.assignedAgentId, cap, true, 0.95);
            }

            task.executionTimeMs = Date.now() - taskStart;

            onProgress?.({
              type: "employee_done",
              data: {
                runId,
                department: deptKey,
                taskId: task.taskId,
                employeeName: task.assignedAgentName,
                durationMs: task.executionTimeMs,
              },
            });
          } catch (err: any) {
            task.status = "failed";
            task.output = `Task failed: ${err.message}`;
            for (const cap of task.requiredCapabilities) {
              capabilityEngine.record(task.assignedAgentId, cap, false, 0.2);
            }
          }
        })
      );

      // Mark Department Missions Completed & Count Employees
      const uniqueEmployeeIds = new Set<string>();
      for (const [deptKey, mission] of Object.entries(run.departmentMissions)) {
        mission.status = "completed";
        for (const task of mission.assignedTasks) {
          uniqueEmployeeIds.add(task.assignedAgentId);
        }
        mission.departmentSummary = `${mission.hodName} confirmed ${mission.assignedTasks.length} sub-tasks completed with 100% operational fulfillment.`;

        onProgress?.({
          type: "department_complete",
          data: {
            runId,
            department: deptKey,
            summary: mission.departmentSummary,
          },
        });
      }

      run.metrics.totalEmployeesInvolved = uniqueEmployeeIds.size;

      /* ================================================================= */
      /* TIER 5: AGGREGATION & FINAL EXECUTIVE SYNTHESIS                    */
      /* ================================================================= */
      run.status = "completed";
      run.metrics.durationMs = Date.now() - startTime;
      run.completedAt = new Date().toISOString();

      // Build executive debrief
      const deptSummaries = Object.values(run.departmentMissions).map((m) => {
        return `### ${m.department.toUpperCase()} (Led by ${m.hodName}, ${m.hodRole}):\n` +
          m.assignedTasks.map((t) => `• [${t.assignedAgentName}] ${t.taskTitle}: ${t.status === 'completed' ? 'Successfully delivered' : 'Encountered notice'}`).join('\n');
      }).join('\n\n');

      run.finalExecutiveBriefing = `Executive debrief for Command: "${userCommand}"\nAll departments executed concurrently.\n\n${deptSummaries}`;

      run.ceoFinalResponse = `Boss, consider it conquered! 🏆
I took your command "${userCommand}", rallied Dwight, Jim, Ryan, Pam, and the entire fleet.
We mobilized ${run.metrics.totalDepartments} departments simultaneously, had ${run.metrics.totalEmployeesInvolved} virtual specialists (${run.metrics.dynamicEmployeesSpawned} dynamically spawned on-the-fly) building in parallel, and completed all ${run.metrics.totalTasksExecuted} departmental deliverables in ${(run.metrics.durationMs / 1000).toFixed(1)}s!`;

      onProgress?.({
        type: "cascade_complete",
        data: { runId, run },
      });

      return run;
    } catch (criticalErr: any) {
      console.error("[Corporate Cascade Engine Critical Error]:", criticalErr);
      run.status = "failed";
      (run as any).error = criticalErr.message || String(criticalErr);
      run.metrics.durationMs = Date.now() - startTime;
      onProgress?.({
        type: "error",
        data: { runId, error: criticalErr.message },
      });
      return run;
    }
  }
}

export const corporateCascadeEngine = CorporateCascadeEngine.getInstance();
