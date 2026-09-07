import { randomUUID } from "node:crypto";
import { BaseMastraAgent, MastraAgentConfig } from "../../mastra/agents/base.agent.ts";
import { mastraAgentRegistry } from "../../mastra/agents/index.ts";
import { roleRegistry, RoleDefinition } from "./role.registry.ts";
import { capabilityRegistry } from "./capability.registry.ts";
import { capabilityEngine } from "../../../core/capabilities/capability.engine.ts";
import type { DepartmentId } from "../../../../shared/types/index.ts";

/**
 * Concrete dynamic class representing a dynamically spawned virtual employee.
 */
export class DynamicVirtualEmployee extends BaseMastraAgent {
  private roleId: string;
  private assignedCapabilities: string[];

  constructor(config: MastraAgentConfig, roleId: string, assignedCapabilities: string[]) {
    super(config);
    this.roleId = roleId;
    this.assignedCapabilities = assignedCapabilities;
  }

  public getRoleId(): string {
    return this.roleId;
  }

  public getAssignedCapabilities(): string[] {
    return this.assignedCapabilities;
  }
}

export class EmployeeFactory {
  private static instance: EmployeeFactory;

  private constructor() {}

  public static getInstance(): EmployeeFactory {
    if (!EmployeeFactory.instance) {
      EmployeeFactory.instance = new EmployeeFactory();
    }
    return EmployeeFactory.instance;
  }

  /**
   * Generates a fully configured dynamic virtual employee based on a role profile.
   */
  public createEmployee(
    roleId: string,
    customName?: string,
    extraCapabilities: string[] = []
  ): DynamicVirtualEmployee {
    const roleDef = roleRegistry.getRole(roleId);
    if (!roleDef) {
      throw new Error(`Role "${roleId}" not found in RoleRegistry.`);
    }

    const employeeId = `emp-${roleId}-${randomUUID().slice(0, 8)}`;
    const employeeName = customName || `${roleDef.title} (${employeeId.toUpperCase()})`;

    // Combine base role capabilities with any dynamically requested skills
    const combinedCapabilities = Array.from(
      new Set([...roleDef.baseCapabilities, ...extraCapabilities])
    );

    // Map departments to DepartmentId typing
    let department: DepartmentId = "operations";
    const mappedDept = roleDef.category.toLowerCase();
    if (
      [
        "executive",
        "engineering",
        "product",
        "design",
        "marketing",
        "sales",
        "finance",
        "hr",
        "legal",
        "operations",
        "customer_success",
        "infrastructure",
        "security",
        "research",
      ].includes(mappedDept)
    ) {
      department = mappedDept as DepartmentId;
    }

    // Map capabilities into robust system instructions
    const capabilityDetails = combinedCapabilities
      .map((capId) => {
        const cap = capabilityRegistry.getCapability(capId);
        return cap ? `- **${cap.name}**: ${cap.description}` : `- **${capId}**`;
      })
      .join("\n");

    const systemInstructions = `
You are ${employeeName}, operating as a virtual employee in the ${roleDef.category.toUpperCase()} department.
Role Title: ${roleDef.title}
Employee ID: ${employeeId}

### Core Persona & Mission
${roleDef.description}

### Specific Role Directives
${roleDef.instructions.map((inst) => `* ${inst}`).join("\n")}

### Assigned Capabilities
${capabilityDetails}

### Operational Guidelines
1. Always align your research and solutions with corporate OKRs and strategies.
2. Maintain high precision and defensive verification for any technical outputs.
3. Coordinate with other departments through event-driven message channels.
`.trim();

    // Determine tool capabilities. Grant dynamic employees standard tooling.
    const tools = ["*"]; // Dynamic virtual employees are empowered with the full suite of tools

    const config: MastraAgentConfig = {
      id: employeeId,
      name: employeeName,
      role: roleDef.title,
      department,
      instructions: systemInstructions,
      tools,
      permissions: roleDef.systemPermissions,
      delegationRules: ["delegate:any"],
      approvalRequirements: ["budget_allocation"],
    };

    const employee = new DynamicVirtualEmployee(config, roleId, combinedCapabilities);

    // Register inside the MastraAgentRegistry so it is execution-ready
    mastraAgentRegistry.registerAgent(employee);

    // Register profile inside the central CapabilityEngine
    capabilityEngine.assignMany(employeeId, combinedCapabilities);

    return employee;
  }
}

export const employeeFactory = EmployeeFactory.getInstance();
