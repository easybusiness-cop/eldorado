import { DepartmentDefinition, DepartmentId } from '../../shared/types/index.ts';
import { RUFFLO_DEPARTMENTS } from '../../shared/constants/index.ts';

export class DepartmentRegistry {
  private static instance: DepartmentRegistry;
  private departments: Map<DepartmentId, DepartmentDefinition> = new Map();

  private constructor() {
    for (const [key, val] of Object.entries(RUFFLO_DEPARTMENTS)) {
      this.departments.set(key as DepartmentId, val);
    }
  }

  public static getInstance(): DepartmentRegistry {
    if (!DepartmentRegistry.instance) {
      DepartmentRegistry.instance = new DepartmentRegistry();
    }
    return DepartmentRegistry.instance;
  }

  public getDepartment(id: DepartmentId): DepartmentDefinition | undefined {
    return this.departments.get(id);
  }

  public getAllDepartments(): DepartmentDefinition[] {
    return Array.from(this.departments.values());
  }

  public updateBudget(id: DepartmentId, delta: number) {
    const dept = this.departments.get(id);
    if (dept) {
      dept.budget += delta;
    }
  }
}

export const departmentRegistry = DepartmentRegistry.getInstance();
