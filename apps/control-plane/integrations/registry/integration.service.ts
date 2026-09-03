import { Integration } from "./integration.types";
import { IntegrationRegistry } from "./integration.registry";
import { IntegrationSchema } from "./integration.schema";

export class IntegrationService {
  public static listIntegrations(orgId: string): Integration[] {
    return IntegrationRegistry.getAll(orgId);
  }

  public static getIntegration(id: string): Integration | undefined {
    return IntegrationRegistry.get(id);
  }

  public static registerIntegration(orgId: string, payload: any): { success: boolean; data?: Integration; errors?: string[] } {
    const fullPayload = {
      ...payload,
      organizationId: orgId,
      id: payload.id || `int-${payload.provider}-${Date.now()}`,
      enabled: payload.enabled ?? true,
      healthStatus: payload.healthStatus || "HEALTHY"
    };

    const validation = IntegrationSchema.validate(fullPayload);
    if (!validation.success) {
      return { success: false, errors: validation.errors };
    }

    if (validation.data) {
      IntegrationRegistry.register(validation.data);
      return { success: true, data: validation.data };
    }

    return { success: false, errors: ["Unexpected validation mismatch error."] };
  }

  public static async testIntegration(id: string): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    const integration = IntegrationRegistry.get(id);
    if (!integration) {
      return { success: false, latencyMs: 0, error: `Integration not found in workspace registry: ${id}` };
    }

    const start = Date.now();
    try {
      // Perform simulated network or protocol ping depending on provider
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (integration.enabled && integration.healthStatus !== "UNHEALTHY") {
            resolve(true);
          } else {
            reject(new Error("Integration offline or globally disabled."));
          }
        }, 120);
      });

      return { success: true, latencyMs: Date.now() - start };
    } catch (e: any) {
      return { success: false, latencyMs: Date.now() - start, error: e.message };
    }
  }
}
