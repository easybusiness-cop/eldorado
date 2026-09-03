import { companyDb, AgentContract, DBTask, AuditEvent } from '../db/companyDb';
import {
  HQFloorInfo,
  HQDepartmentDetails,
  HQMeeting,
  HQMemoryEntry,
  CrossDeptWorkflow,
  OrgChartNode,
  HQBuildingSummary
} from '../types';

class HQService {
  public getHQSummary(): HQBuildingSummary {
    const building = companyDb.getBuilding();
    const floors = companyDb.getFloors();
    const departments = companyDb.getDepartments();
    const agents = companyDb.getAgentsList();
    const tasks = companyDb.getTasks();
    const projects = companyDb.getProjects();
    const audits = companyDb.getAudits();
    const company = companyDb.getCompany();

    const totalSpent = departments.reduce((sum, d) => sum + (d.budget?.totalSpent || 0), 0);
    const totalBudget = departments.reduce((sum, d) => sum + (d.budget?.monthly || 0), 0);

    const liveActivity = audits.slice(0, 10).map((a, idx) => ({
      id: a.id || `act-${idx}`,
      timestamp: a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : '12:00',
      departmentId: a.agentId.includes('eng') ? 'engineering' : 'rooftop_cmd',
      departmentName: a.agentId.includes('eng') ? 'Software Engineering' : 'HQ Command Center',
      agentName: a.agentId,
      action: a.action || 'Executed system action',
      status: a.riskLevel === 'high' ? 'ATTENTION' : 'SUCCESS'
    }));

    return {
      companyName: company.name || 'Munderdiffl.in AI Corp.',
      buildingName: building.name || 'AI Company Headquarters',
      totalFloors: floors.length,
      operationalStatus: building.operationalStatus || 'HEALTHY',
      totalAgents: agents.length > 0 ? agents.length : 32,
      totalActiveTasks: tasks.filter(t => t.status === 'running' || t.status === 'queued').length || 14,
      totalProjects: projects.length || 6,
      totalBudget,
      totalSpent,
      totalIncidents: 0,
      pendingApprovals: 2,
      floors,
      liveActivity
    };
  }

  public getFloors(): HQFloorInfo[] {
    return companyDb.getFloors();
  }

  public getFloorById(floorId: string): HQFloorInfo | undefined {
    return companyDb.getFloorById(floorId);
  }

  public getDepartments(): HQDepartmentDetails[] {
    return companyDb.getDepartments();
  }

  public getDepartmentById(deptId: string): HQDepartmentDetails | undefined {
    return companyDb.getDepartmentById(deptId);
  }

  public getDepartmentByFloorId(floorId: string): HQDepartmentDetails | undefined {
    return companyDb.getDepartmentByFloorId(floorId);
  }

  public validateDepartmentIdentity(
    floorId?: string,
    deptId?: string
  ): {
    valid: boolean;
    code?: string;
    reason?: string;
    department?: HQDepartmentDetails;
    floor?: HQFloorInfo;
    agents?: AgentContract[];
  } {
    if (!deptId) {
      return {
        valid: false,
        code: 'ACCESS_DENIED',
        reason: 'Missing department identity parameter.'
      };
    }

    const dept = companyDb.getDepartmentById(deptId);
    if (!dept) {
      return {
        valid: false,
        code: 'ACCESS_DENIED',
        reason: `Department identity '${deptId}' is not registered in Company OS.`
      };
    }

    let floor: HQFloorInfo | undefined;
    if (floorId) {
      floor = companyDb.getFloorById(floorId);
      if (!floor) {
        return {
          valid: false,
          code: 'ACCESS_DENIED',
          reason: `Floor '${floorId}' is not registered in Headquarters building schema.`
        };
      }

      // Verify floor-department binding
      if (floor.departmentId.toLowerCase() !== deptId.toLowerCase()) {
        return {
          valid: false,
          code: 'ACCESS_DENIED',
          reason: `Security Policy Violation: Floor ${floor.code} (Level ${floor.level}) is bound to department '${floor.departmentId}', but access request specified department '${deptId}'. Cross-floor department mapping spoofing denied.`
        };
      }
    }

    const agents = companyDb.getAgentsListByDepartment(dept.id);
    if (!agents || agents.length === 0) {
      return {
        valid: false,
        code: 'ACCESS_DENIED',
        reason: `Department identity '${dept.name}' [${dept.id}] has no validated active personnel assigned in Company OS. Fallback access is disabled.`
      };
    }

    return {
      valid: true,
      department: dept,
      floor,
      agents
    };
  }

  public getDepartmentAgents(deptId: string): AgentContract[] {
    return companyDb.getAgentsListByDepartment(deptId);
  }

  public getDepartmentTasks(deptId: string): DBTask[] {
    return companyDb.getTasksByDepartment(deptId);
  }

  public getDepartmentProjects(deptId: string) {
    return companyDb.getProjectsByDepartment(deptId);
  }

  public getDepartmentActivity(deptId: string): AuditEvent[] {
    return companyDb.getAuditsByDepartment(deptId);
  }

  public getDepartmentMemory(
    deptId: string,
    userRole: string = 'admin',
    userDepartment: string = 'executive'
  ): { allowed: boolean; reason?: string; memories: HQMemoryEntry[] } {
    const dept = companyDb.getDepartmentById(deptId);
    if (!dept) {
      return { allowed: false, reason: 'Department not found', memories: [] };
    }

    // Security ACL Check
    if (dept.securityClassification === 'CONFIDENTIAL' || dept.securityClassification === 'RESTRICTED') {
      const isOwnerDept = userDepartment.toLowerCase() === deptId.toLowerCase();
      const isExec = userDepartment.toLowerCase() === 'executive' || userRole === 'admin';
      
      // Restricted HR check
      if (deptId === 'hr' && !isOwnerDept && userRole !== 'admin') {
        return {
          allowed: false,
          reason: 'Security Boundary Violation: Human Resources confidential memory namespace is restricted to HR personnel and Admin.',
          memories: []
        };
      }

      // Restricted Finance check
      if (deptId === 'finance' && !isOwnerDept && !isExec) {
        return {
          allowed: false,
          reason: 'Security Boundary Violation: Finance restricted records are restricted to Finance and Executive Officers.',
          memories: []
        };
      }
    }

    const memories = companyDb.getMemoriesByDepartment(deptId);
    return { allowed: true, memories };
  }

  public getAgentProfile(agentId: string) {
    const emp = companyDb.getAgentById(agentId);
    if (emp) return emp;
    
    // Fallback search in department heads
    for (const dept of companyDb.getDepartments()) {
      if (dept.headId === agentId) {
        return {
          id: dept.headId,
          name: dept.headName,
          role: dept.headRole,
          department: dept.id,
          reportsTo: 'Michael G. Scott',
          jobDescription: `Leads ${dept.name} department operations and alignment.`,
          skills: ['Leadership', 'Strategy', 'Department Management'],
          tools: ['intercom', 'terminal', 'project-editor'],
          permissions: { filesystem: 'project', network: 'allowlisted', production: true, secrets: 'scoped' },
          authorityLevel: 5,
          status: 'active',
          memorySummary: `Active leadership of ${dept.name} on Floor ${dept.floorCode}.`,
          trainingState: 'PRODUCTION',
          kpis: { tasksCompleted: 42, accuracyScore: 98.5, uptimeBonusPercent: 12, tokensProcessed: 210000, totalCost: 10.50 }
        };
      }
    }
    return null;
  }

  public getOrgChart(): OrgChartNode {
    const agents = companyDb.getAgentsList();
    const floors = companyDb.getFloors();
    const departments = companyDb.getDepartments();

    const deptMap = new Map<string, HQDepartmentDetails>();
    departments.forEach(d => deptMap.set(d.id.toLowerCase(), d));

    const floorDeptMap = new Map<string, HQFloorInfo>();
    floors.forEach(f => floorDeptMap.set(f.departmentId.toLowerCase(), f));

    // Root CEO
    const rootEmp = agents.find(e => e.id.toLowerCase() === 'michael') || agents[0];

    const buildSubTree = (emp: AgentContract, visited = new Set<string>()): OrgChartNode => {
      visited.add(emp.id.toLowerCase());
      const dept = deptMap.get(emp.department.toLowerCase());
      const floor = floorDeptMap.get(emp.department.toLowerCase());

      const subordinates = agents
        .filter(e => e.reportsTo && e.reportsTo.toLowerCase() === emp.id.toLowerCase() && !visited.has(e.id.toLowerCase()))
        .map(e => buildSubTree(e, new Set(visited)));

      let avatar = '👤';
      if (emp.role.toLowerCase().includes('ceo')) avatar = '👔';
      else if (emp.role.toLowerCase().includes('cto')) avatar = '⚡';
      else if (emp.role.toLowerCase().includes('cfo')) avatar = '📊';
      else if (emp.role.toLowerCase().includes('cso') || emp.role.toLowerCase().includes('ciso')) avatar = '🛡️';
      else if (emp.role.toLowerCase().includes('cmo')) avatar = '🚀';
      else if (emp.role.toLowerCase().includes('coo')) avatar = '📋';
      else if (emp.role.toLowerCase().includes('legal')) avatar = '⚖️';
      else if (emp.role.toLowerCase().includes('chro')) avatar = '📋';
      else if (emp.role.toLowerCase().includes('cro')) avatar = '📈';
      else if (emp.role.toLowerCase().includes('cpo')) avatar = '🎨';
      else if (emp.role.toLowerCase().includes('cco')) avatar = '🎧';

      return {
        id: emp.id,
        name: emp.name,
        title: emp.role,
        role: emp.role,
        departmentId: emp.department,
        departmentName: dept ? dept.name : emp.department,
        floorCode: floor ? floor.code : 'HQ',
        avatar,
        status: emp.status === 'active' ? 'working' : 'idle',
        reportsTo: emp.reportsTo,
        subordinates
      };
    };

    if (rootEmp) {
      return buildSubTree(rootEmp);
    }

    return {
      id: 'michael',
      name: 'Michael G. Scott',
      title: 'Chief Executive Officer (CEO)',
      role: 'CEO',
      departmentId: 'executive',
      departmentName: 'Executive Operations',
      floorCode: '10',
      avatar: '👔',
      status: 'working',
      subordinates: []
    };
  }

  public getCompanyDirectory(query?: string) {
    const agents = companyDb.getAgentsList();
    const depts = companyDb.getDepartments();
    const projects = companyDb.getProjects();

    const q = (query || '').toLowerCase();

    const matchedEmps = agents.filter(
      e => !q || e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q) || e.department.toLowerCase().includes(q)
    );

    const matchedDepts = depts.filter(
      d => !q || d.name.toLowerCase().includes(q) || d.headName.toLowerCase().includes(q)
    );

    const matchedProjects = projects.filter(
      p => !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );

    return {
      agents: matchedEmps,
      departments: matchedDepts,
      projects: matchedProjects
    };
  }

  public getMeetings(): HQMeeting[] {
    return companyDb.getMeetings();
  }

  public scheduleMeeting(deptId: string, meeting: Partial<HQMeeting>): HQMeeting {
    const dept = companyDb.getDepartmentById(deptId);
    const newMeeting: HQMeeting = {
      id: `mtg-${Date.now()}`,
      departmentId: deptId,
      departmentName: dept ? dept.name : 'General',
      roomName: meeting.roomName || 'Conference Room',
      title: meeting.title || 'Department Alignment Sync',
      agenda: meeting.agenda || 'Review department tasks and deliverables.',
      participants: meeting.participants || ['Department Head', 'Team Agents'],
      owner: meeting.owner || 'Department Manager',
      context: meeting.context || 'Regular Department Operation',
      decisions: meeting.decisions || [],
      actions: meeting.actions || [],
      status: 'scheduled',
      timestamp: new Date().toISOString()
    };

    return companyDb.addMeeting(newMeeting);
  }

  public createTaskInDepartment(deptId: string, taskData: Partial<DBTask>): DBTask {
    const deptAgents = companyDb.getAgentsListByDepartment(deptId);
    const defaultAssignee = deptAgents.length > 0 ? deptAgents[0].id : 'michael';

    const newTask: DBTask = {
      id: `tsk-${deptId}-${Date.now()}`,
      projectId: taskData.projectId || 'prj-alpha',
      title: taskData.title || `Task for ${deptId}`,
      description: taskData.description || 'Department automated work item.',
      assignedTo: taskData.assignedTo || defaultAssignee,
      status: 'queued',
      progress: 0,
      priority: taskData.priority || 'medium',
      subtasks: [],
      createdAt: Date.now()
    };

    companyDb.addTask(newTask);

    companyDb.logAudit({
      id: `aud-hq-${Date.now()}`,
      agentId: newTask.assignedTo,
      projectId: newTask.projectId,
      taskId: newTask.id,
      tool: 'hq_department_queue',
      action: `Created task "${newTask.title}" on floor department [${deptId}]`,
      inputHash: Buffer.from(newTask.title).toString('base64').slice(0, 15),
      result: 'SUCCESS: Task added to department work queue.',
      timestamp: new Date().toISOString(),
      riskLevel: 'low',
      approvalRequired: false,
      executionId: `ex-task-${Date.now()}`
    });

    return newTask;
  }

  public triggerCrossDepartmentWorkflow(
    type: string,
    payload: { title?: string; initiatorDepartment?: string; initiatorAgent?: string }
  ): CrossDeptWorkflow {
    const workflowId = `wf-cd-${Date.now()}`;
    const title = payload.title || `Cross-Department Workflow (${type})`;
    const initiatorDept = payload.initiatorDepartment || 'customer_success';
    const initiatorAgent = payload.initiatorAgent || 'Erin Hannon';

    let stages = [];
    if (type === 'customer_escalation') {
      stages = [
        { id: `s-1-${Date.now()}`, departmentId: 'customer_success', departmentName: 'Customer Success', assigneeId: 'erin_support', assigneeName: 'Erin Hannon', action: 'Customer ticket escalated', status: 'completed' as const, result: 'Issue verified' },
        { id: `s-2-${Date.now()}`, departmentId: 'product', departmentName: 'Product & Design', assigneeId: 'kelly_product', assigneeName: 'Kelly Kapoor', action: 'Create PRD bugfix spec', status: 'in_progress' as const },
        { id: `s-3-${Date.now()}`, departmentId: 'engineering', departmentName: 'Software Engineering', assigneeId: 'ruflo', assigneeName: 'Ruflo', action: 'Code fix & automated tests', status: 'pending' as const },
        { id: `s-4-${Date.now()}`, departmentId: 'infrastructure', departmentName: 'Infrastructure & Security', assigneeId: 'dwight', assigneeName: 'Dwight Schrute', action: 'Zero-trust security scan & deploy', status: 'pending' as const },
        { id: `s-5-${Date.now()}`, departmentId: 'customer_success', departmentName: 'Customer Success', assigneeId: 'erin_support', assigneeName: 'Erin Hannon', action: 'Notify customer of resolution', status: 'pending' as const }
      ];
    } else {
      stages = [
        { id: `s-101-${Date.now()}`, departmentId: 'sales', departmentName: 'Sales & Revenue Ops', assigneeId: 'todd_sales', assigneeName: 'Todd Packer', action: 'Enterprise deal opportunity qualified', status: 'completed' as const, result: 'Deal $150k ARR created' },
        { id: `s-102-${Date.now()}`, departmentId: 'legal', departmentName: 'Legal & Compliance', assigneeId: 'oscar_legal', assigneeName: 'Oscar Martinez', action: 'Draft & review master service agreement', status: 'in_progress' as const },
        { id: `s-103-${Date.now()}`, departmentId: 'finance', departmentName: 'Finance & P&L', assigneeId: 'kevin', assigneeName: 'Kevin Malone', action: 'Verify payment terms & discount risk', status: 'pending' as const },
        { id: `s-104-${Date.now()}`, departmentId: 'executive', departmentName: 'Executive Operations', assigneeId: 'michael', assigneeName: 'Michael G. Scott', action: 'Executive deal approval', status: 'pending' as const }
      ];
    }

    const newWf: CrossDeptWorkflow = {
      id: workflowId,
      title,
      type: type as any,
      initiatorDepartment: initiatorDept,
      initiatorAgent,
      status: 'active',
      stages,
      riskLevel: type === 'enterprise_deal' ? 'high' : 'medium',
      requiresApproval: true,
      approvalStatus: 'approved',
      createdAt: new Date().toISOString()
    };

    companyDb.addWorkflow(newWf);

    companyDb.logAudit({
      id: `aud-wf-${Date.now()}`,
      agentId: initiatorAgent,
      tool: 'cross_department_engine',
      action: `Initiated multi-department workflow "${title}" [${stages.length} stages]`,
      inputHash: Buffer.from(title).toString('base64').slice(0, 15),
      result: 'SUCCESS: Cross-department workflow started.',
      timestamp: new Date().toISOString(),
      riskLevel: newWf.riskLevel,
      approvalRequired: true,
      approvedBy: 'Michael G. Scott',
      executionId: `ex-wf-${Date.now()}`
    });

    return newWf;
  }

  public getCrossWorkflows(): CrossDeptWorkflow[] {
    return companyDb.getWorkflows();
  }

  public reserveAndBackupAllMemory() {
    const backupResult = companyDb.backupMemory();
    const departments = companyDb.getDepartments();
    const totalMemories = companyDb.getMemories();

    const reservedNamespaces = departments.map(d => ({
      departmentId: d.id,
      namespace: d.memoryNamespace,
      classification: d.securityClassification,
      status: 'RESERVED_AND_LOCKED',
      capacityAllocatedMB: 512
    }));

    companyDb.logAudit({
      id: `aud-res-mem-${Date.now()}`,
      agentId: 'system',
      tool: 'memory_vault_engine',
      action: `Reserved & backed up ${totalMemories.length} memory records across ${reservedNamespaces.length} department namespaces`,
      inputHash: Buffer.from(backupResult.backupId).toString('base64').slice(0, 15),
      result: `SUCCESS: Backup snapshot stored at ${backupResult.filePath} (${backupResult.sizeBytes} bytes).`,
      timestamp: new Date().toISOString(),
      riskLevel: 'low',
      approvalRequired: false,
      executionId: `ex-res-mem-${Date.now()}`
    });

    return {
      status: 'SUCCESS',
      message: 'All system and department memories successfully reserved and backed up.',
      backupId: backupResult.backupId,
      filePath: backupResult.filePath,
      timestamp: backupResult.timestamp,
      totalMemoriesCount: backupResult.memoriesCount,
      totalAgentSummariesCount: backupResult.agentMemoriesCount,
      sizeBytes: backupResult.sizeBytes,
      reservedNamespacesCount: reservedNamespaces.length,
      reservedNamespaces
    };
  }

  public getMemoryBackups() {
    return companyDb.getMemoryBackups();
  }
}

export const hqService = new HQService();
