import { departmentRegistry } from '../registry.ts';
import { DepartmentId } from '../../../shared/types/index.ts';

export class DepartmentManagerService {
  public static getManagerForDepartment(deptId: DepartmentId): string | undefined {
    return departmentRegistry.getDepartment(deptId)?.managerId;
  }

  public static getManagedAgents(deptId: DepartmentId): string[] {
    return departmentRegistry.getDepartment(deptId)?.agentIds || [];
  }
}

export class DepartmentPolicyService {
  public static evaluatePolicy(deptId: DepartmentId, action: string): { allowed: boolean; reason?: string } {
    const dept = departmentRegistry.getDepartment(deptId);
    if (!dept) return { allowed: false, reason: 'Department not found' };

    if (deptId === 'engineering' && action === 'direct_prod_push') {
      return { allowed: false, reason: 'Direct push to production branch is strictly blocked by policy.' };
    }

    if (deptId === 'finance' && action === 'unverified_ledger_write') {
      return { allowed: false, reason: 'Unverified transaction writes are blocked by zero-trust ledger policy.' };
    }

    return { allowed: true };
  }
}
