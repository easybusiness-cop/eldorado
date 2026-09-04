import { Router } from "express";
import fs from "fs";
import path from "path";
import { hqService } from "../../src/services/hqService.ts";
import { companyDb } from "../../src/db/companyDb.ts";
import { eventBus } from "../events/eventBus.ts";
import { callGeminiResilient, getGeminiClient } from "../ai/geminiService.ts";
import { SecurityAuditLedger } from "../security/auditLedger.ts";

export const hqRouter = Router();

// ==========================================
// HQ MULTI-FLOOR ARCHITECTURE ENDPOINTS
// ==========================================

// GET /api/hq — Virtual Headquarters Building Summary
hqRouter.get("/hq", (req, res) => {
  try {
    const summary = hqService.getHQSummary();
    res.json({ success: true, ...summary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/floors — List of all floors
hqRouter.get("/floors", (req, res) => {
  try {
    const floors = hqService.getFloors();
    res.json({ success: true, floors });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/floors/:floorId — Specific floor details with server-side identity validation
hqRouter.get("/floors/:floorId", (req, res) => {
  try {
    const floor = hqService.getFloorById(req.params.floorId);
    if (!floor) return res.status(404).json({ error: "Floor not found" });
    const validation = hqService.validateDepartmentIdentity(req.params.floorId, floor.departmentId);
    if (!validation.valid) {
      return res.status(403).json({
        success: false,
        error: validation.code || "ACCESS_DENIED",
        reason: validation.reason,
        floor,
      });
    }
    res.json({ success: true, floor, department: validation.department, agents: validation.agents });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/departments — All departments
hqRouter.get("/departments", (req, res) => {
  try {
    const departments = hqService.getDepartments();
    res.json({ success: true, departments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/departments/:departmentId — Department detail workspace
hqRouter.get("/departments/:departmentId", (req, res) => {
  try {
    const floorId = req.query.floorId as string | undefined;
    const validation = hqService.validateDepartmentIdentity(floorId, req.params.departmentId);
    if (!validation.valid) {
      return res.status(403).json({
        success: false,
        error: validation.code || "ACCESS_DENIED",
        reason: validation.reason,
        departmentId: req.params.departmentId,
      });
    }

    const dept = validation.department!;
    const agents = validation.agents || [];
    const tasks = hqService.getDepartmentTasks(req.params.departmentId);
    const projects = hqService.getDepartmentProjects(req.params.departmentId);
    const activity = hqService.getDepartmentActivity(req.params.departmentId);

    res.json({
      success: true,
      department: dept,
      agents,
      tasks,
      projects,
      activity,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/departments/:departmentId/validate-identity
hqRouter.get("/departments/:departmentId/validate-identity", (req, res) => {
  try {
    const floorId = req.query.floorId as string | undefined;
    const validation = hqService.validateDepartmentIdentity(floorId, req.params.departmentId);
    if (!validation.valid) {
      return res.status(403).json({
        success: false,
        error: validation.code || "ACCESS_DENIED",
        reason: validation.reason,
      });
    }
    res.json({
      success: true,
      valid: true,
      department: validation.department,
      agents: validation.agents,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/departments/:departmentId/managers
hqRouter.get("/departments/:departmentId/managers", (req, res) => {
  try {
    const dept = hqService.getDepartmentById(req.params.departmentId);
    if (!dept) return res.status(404).json({ error: "Department not found" });
    const managers = dept.managerIds.map((id) => hqService.getAgentProfile(id)).filter(Boolean);
    res.json({ success: true, managers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/departments/:departmentId/tasks
hqRouter.get("/departments/:departmentId/tasks", (req, res) => {
  try {
    const tasks = hqService.getDepartmentTasks(req.params.departmentId);
    res.json({ success: true, tasks });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/departments/:departmentId/projects
hqRouter.get("/departments/:departmentId/projects", (req, res) => {
  try {
    const projects = hqService.getDepartmentProjects(req.params.departmentId);
    res.json({ success: true, projects });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/departments/:departmentId/kpis
hqRouter.get("/departments/:departmentId/kpis", (req, res) => {
  try {
    const dept = hqService.getDepartmentById(req.params.departmentId);
    if (!dept) return res.status(404).json({ error: "Department not found" });
    res.json({ success: true, kpis: dept.kpis, budget: dept.budget });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/departments/:departmentId/activity
hqRouter.get("/departments/:departmentId/activity", (req, res) => {
  try {
    const activity = hqService.getDepartmentActivity(req.params.departmentId);
    res.json({ success: true, activity });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/departments/:departmentId/memory
hqRouter.get("/departments/:departmentId/memory", (req, res) => {
  try {
    const userRole = (req.headers["x-user-role"] as string) || "specialist";
    const userDepartment = (req.headers["x-user-department"] as string) || "guest";

    const result = hqService.getDepartmentMemory(req.params.departmentId, userRole, userDepartment);

    if (!result.allowed) {
      return res.status(403).json({
        error: "Access Denied",
        reason: result.reason,
        securityViolation: true,
      });
    }

    res.json({ success: true, memories: result.memories });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Memory Backups
hqRouter.post("/hq/memory/backup", (req, res) => {
  try {
    const result = hqService.reserveAndBackupAllMemory();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ status: "ERROR", error: err.message });
  }
});

hqRouter.get("/hq/memory/backups", (req, res) => {
  try {
    const backups = hqService.getMemoryBackups();
    res.json({ success: true, backups });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

hqRouter.post("/hq/memory/reserve", (req, res) => {
  try {
    const result = hqService.reserveAndBackupAllMemory();
    res.json({ success: true, reserved: true, details: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Agent profile
hqRouter.get("/agents/:agentId", (req, res) => {
  try {
    const profile = hqService.getAgentProfile(req.params.agentId);
    if (!profile) return res.status(404).json({ error: "Agent profile not found" });
    res.json({ success: true, agent: profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Company Directory & Org-Chart
hqRouter.get("/company/org-chart", (req, res) => {
  try {
    const orgChart = hqService.getOrgChart();
    res.json({ success: true, orgChart });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

hqRouter.get("/company/directory", (req, res) => {
  try {
    const q = req.query.q as string;
    const directory = hqService.getCompanyDirectory(q);
    res.json({ success: true, ...directory });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

hqRouter.get("/company/activity", (req, res) => {
  try {
    const summary = hqService.getHQSummary();
    res.json({ success: true, activity: summary.liveActivity });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

hqRouter.get("/hq/meetings", (req, res) => {
  try {
    const meetings = hqService.getMeetings();
    res.json({ success: true, meetings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

hqRouter.post("/departments/:departmentId/tasks", (req, res) => {
  try {
    const task = hqService.createTaskInDepartment(req.params.departmentId, req.body);
    res.json({ success: true, task });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

hqRouter.post("/departments/:departmentId/meetings", (req, res) => {
  try {
    const meeting = hqService.scheduleMeeting(req.params.departmentId, req.body);
    res.json({ success: true, meeting });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

hqRouter.post("/hq/cross-department-workflow", (req, res) => {
  try {
    const { type = "customer_escalation", title, initiatorDepartment, initiatorAgent } = req.body;
    const workflow = hqService.triggerCrossDepartmentWorkflow(type, { title, initiatorDepartment, initiatorAgent });
    res.json({ success: true, workflow });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

hqRouter.get("/hq/cross-workflows", (req, res) => {
  try {
    const workflows = hqService.getCrossWorkflows();
    res.json({ success: true, workflows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Entire Company OS details
hqRouter.get("/company/details", (req, res) => {
  try {
    const dbAudits = companyDb.getAudits() || [];
    const secureLogs = SecurityAuditLedger.getLedger().map(log => ({
      id: log.eventId,
      agentId: log.actor || "sec-ops",
      tool: "execution-broker",
      action: `${log.action} on [${log.resource}] - Sandbox: ${log.isolationLevel}`,
      inputHash: "sha256",
      result: `${log.policyDecision.toUpperCase()} (Score: ${log.riskScore}, Stripped: ${log.credentialsStripped})`,
      timestamp: log.timestamp,
      riskLevel: log.riskLevel.toLowerCase(),
      approvalRequired: log.riskLevel === "HIGH" || log.riskLevel === "CRITICAL",
      approvedBy: log.policyDecision === "allow" ? "system-policy" : undefined,
      executionId: log.eventId,
    }));

    res.json({
      success: true,
      company: companyDb.getCompany(),
      departments: companyDb.getDepartments(),
      employees: companyDb.getAgentsList(),
      projects: companyDb.getProjects(),
      missions: companyDb.getMissions(),
      tasks: companyDb.getTasks(),
      audits: [...secureLogs, ...dbAudits],
      accounts: companyDb.getAccounts(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

hqRouter.post("/company/update", (req, res) => {
  try {
    const { updates, agentId = "michael" } = req.body;
    const updated = companyDb.updateCompany(updates);

    companyDb.logAudit({
      id: `aud-comp-${Date.now()}`,
      agentId,
      tool: "company.update",
      action: "Updated company profile details",
      inputHash: Buffer.from(JSON.stringify(updates)).toString("base64").slice(0, 20),
      result: `SUCCESS: Updated P&L, MRR, or Company parameters.`,
      timestamp: new Date().toISOString(),
      riskLevel: "medium",
      approvalRequired: true,
      approvedBy: "michael",
      executionId: `ex-comp-${Date.now()}`,
    });

    res.json({ success: true, company: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

hqRouter.post("/company/accounts/add", (req, res) => {
  try {
    const { provider, account, scopes = [], owner = "michael", status = "CONNECTED" } = req.body;
    if (!provider || !account) {
      return res.status(400).json({ error: "provider and account are required" });
    }
    const newAccount = {
      provider,
      account,
      scopes,
      status,
      owner,
      lastUsed: new Date().toISOString(),
    };
    companyDb.addAccount(newAccount);

    companyDb.logAudit({
      id: `aud-acc-${Date.now()}`,
      agentId: owner,
      tool: "social_media_dept.add_account",
      action: `Connected new ${provider} account: ${account}`,
      inputHash: Buffer.from(JSON.stringify(newAccount)).toString("base64").slice(0, 20),
      result: `SUCCESS: Account successfully registered.`,
      timestamp: new Date().toISOString(),
      riskLevel: "low",
      approvalRequired: false,
      executionId: `ex-acc-${Date.now()}`,
    });

    res.json({ success: true, account: newAccount, accounts: companyDb.getAccounts() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Projects & Pipelines
hqRouter.post("/projects/create", (req, res) => {
  try {
    const { project, agentId = "michael" } = req.body;
    if (!project || !project.name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    const projectId = `prj-${project.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString().slice(-4)}`;
    const newProj = {
      id: projectId,
      name: project.name,
      description: project.description || "Autonomous workspace project",
      repository: project.repository || "https://github.com/munderdiffl/placeholder.git",
      workspace: project.workspace || `./workspace/${projectId}`,
      owner: agentId,
      departments: project.departments || ["engineering"],
      employees: project.employees || [agentId],
      status: "planned",
      priority: project.priority || "medium",
      budget: Number(project.budget) || 10000,
      spent: 0,
      milestones: project.milestones || [],
      secrets: project.secrets || ["GEMINI_API_KEY"],
      environment: "development",
      deployments: [],
    };

    companyDb.addProject(newProj as any);

    companyDb.logAudit({
      id: `aud-proj-${Date.now()}`,
      agentId,
      projectId,
      tool: "project.create",
      action: `Created new project portfolio "${project.name}"`,
      inputHash: Buffer.from(project.name).toString("base64").slice(0, 20),
      result: `SUCCESS: Portfolio created at workspace ${newProj.workspace}`,
      timestamp: new Date().toISOString(),
      riskLevel: "medium",
      approvalRequired: false,
      executionId: `ex-proj-${Date.now()}`,
    });

    res.json({ success: true, project: newProj });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Missions
hqRouter.post("/missions/create", (req, res) => {
  try {
    const { mission, agentId = "michael" } = req.body;
    if (!mission || !mission.title) {
      return res.status(400).json({ error: "Mission title is required" });
    }

    const missionId = `mis-${Date.now()}`;
    const newMis = {
      id: missionId,
      projectId: mission.projectId || "prj-alpha",
      title: mission.title,
      objective: mission.objective || "Fulfill high-level objective",
      coordinatedBy: agentId,
      status: "active" as any,
      stages: mission.stages || [],
      createdAt: Date.now(),
    };

    companyDb.addMission(newMis);

    companyDb.logAudit({
      id: `aud-mis-${Date.now()}`,
      agentId,
      projectId: mission.projectId,
      tool: "mission.create",
      action: `Coordinated mission stage layout: "${mission.title}"`,
      inputHash: Buffer.from(mission.title).toString("base64").slice(0, 20),
      result: `SUCCESS: Integrated stage transitions for ${newMis.stages.length} workers.`,
      timestamp: new Date().toISOString(),
      riskLevel: "medium",
      approvalRequired: false,
      executionId: `ex-mis-${Date.now()}`,
    });

    res.json({ success: true, mission: newMis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Tasks
hqRouter.post("/tasks/create", (req, res) => {
  try {
    const { task, agentId = "michael" } = req.body;
    if (!task || !task.title) {
      return res.status(400).json({ error: "Task title is required" });
    }

    const taskId = `tsk-${Date.now()}`;
    const newTask = {
      id: taskId,
      projectId: task.projectId,
      missionId: task.missionId,
      title: task.title,
      description: task.description || "",
      assignedTo: task.assignedTo || "michael",
      status: "queued",
      progress: 0,
      priority: task.priority || "medium",
      subtasks: task.subtasks || [],
      createdAt: Date.now(),
    };

    companyDb.addTask(newTask as any);

    companyDb.logAudit({
      id: `aud-tsk-${Date.now()}`,
      agentId,
      projectId: task.projectId,
      taskId,
      tool: "task.create",
      action: `Assigned task "${task.title}" to ${task.assignedTo}`,
      inputHash: Buffer.from(task.title).toString("base64").slice(0, 20),
      result: `SUCCESS: Pushed to assignment queue for employee ${task.assignedTo}`,
      timestamp: new Date().toISOString(),
      riskLevel: "low",
      approvalRequired: false,
      executionId: `ex-tsk-${Date.now()}`,
    });

    res.json({ success: true, task: newTask });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

hqRouter.post("/tasks/update-status", (req, res) => {
  try {
    const { taskId, status, progress, output, codeSnippet, agentId = "michael" } = req.body;
    if (!taskId || !status) {
      return res.status(400).json({ error: "taskId and status are required" });
    }

    const updated = companyDb.updateTaskStatus(taskId, status, progress, output, codeSnippet);
    if (!updated) {
      return res.status(404).json({ error: "Task not found" });
    }

    companyDb.logAudit({
      id: `aud-tsku-${Date.now()}`,
      agentId,
      projectId: updated.projectId,
      taskId,
      tool: "task.update_status",
      action: `Transitioned task "${updated.title}" status to ${status} (${progress}%)`,
      inputHash: Buffer.from(status).toString("base64").slice(0, 20),
      result: `SUCCESS: Telemetry updated. Verification checks triggered.`,
      timestamp: new Date().toISOString(),
      riskLevel: status === "completed" ? "medium" : "low",
      approvalRequired: false,
      executionId: `ex-tsku-${Date.now()}`,
    });

    res.json({ success: true, task: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
