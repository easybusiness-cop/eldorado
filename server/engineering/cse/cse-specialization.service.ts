import { CSE_SPECIALIZATION_SPECS, CseSpecializationSpec } from '../../../src/constants/cseCurriculum.ts';

export class CseSpecializationService {
  public static getSpecialization(specId: string): CseSpecializationSpec | undefined {
    return CSE_SPECIALIZATION_SPECS.find(s => s.id === specId);
  }

  public static getAllSpecializations(): CseSpecializationSpec[] {
    return CSE_SPECIALIZATION_SPECS;
  }

  public static validateAgentPermissions(specId: string, agentPermissions: string[]): { valid: boolean; missingPermissions: string[] } {
    const spec = this.getSpecialization(specId);
    if (!spec) return { valid: false, missingPermissions: ['INVALID_SPECIALIZATION'] };

    const missing = spec.requiredPermissions.filter(p => !agentPermissions.includes(p) && !agentPermissions.includes('*'));
    return {
      valid: missing.length === 0,
      missingPermissions: missing,
    };
  }
}
