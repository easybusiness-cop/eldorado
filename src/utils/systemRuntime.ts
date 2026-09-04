import { AppliedSystemModule } from '../types';

declare global {
  interface Window {
    __MUNDERDIFFL_SYSTEM__?: {
      version: string;
      activeModules: AppliedSystemModule[];
      applyClientPatch: (code: string, meta?: any) => any;
      executeModule: (nameOrId: string, ...args: any[]) => any;
      systemState: Record<string, any>;
      dispatchFleetEvent: (eventName: string, payload?: any) => void;
    };
  }
}

// Initialize Client System Runtime Object (Without arbitrary browser code execution)
export function initializeSystemRuntime() {
  if (typeof window === 'undefined') return;
  if (!window.__MUNDERDIFFL_SYSTEM__) {
    window.__MUNDERDIFFL_SYSTEM__ = {
      version: '0.4.0-hardened',
      activeModules: [],
      systemState: {
        fleetSize: 9,
        zeroTrust: true,
        autoDeployEnabled: true,
        mountedFeatures: 0,
        lastPatchTime: Date.now(),
      },
      applyClientPatch: (_code: string, _meta: any = {}) => {
        console.warn(
          "[SECURITY REJECTED] Rufflo does not execute agent-generated JavaScript in the browser. Agent code must execute through the server-side harness and approved execution sandbox."
        );
        return {
          error: "CLIENT_CODE_EXECUTION_DISABLED: Agent code must execute through the server-side harness.",
        };
      },
      executeModule: (nameOrId: string, ..._args: any[]) => {
        console.warn(
          `[SECURITY REJECTED] Client dynamic module execution is disabled for "${nameOrId}".`
        );
        return null;
      },
      dispatchFleetEvent: (eventName: string, payload: any = {}) => {
        window.dispatchEvent(new CustomEvent(`munderdiffl-${eventName}`, { detail: payload }));
      },
    };
  }
}

export async function executeSystemCode(
  _code: string,
  _context?: unknown,
) {
  return {
    success: false,
    error: {
      code: "CLIENT_CODE_EXECUTION_DISABLED",
      message:
        "Rufflo does not execute agent-generated JavaScript in the browser. Agent code must execute through the server-side harness and approved execution sandbox.",
    },
  };
}

// Send Code to Backend to execute, validate and register in backend runtime
export async function sendAndApplySystemCode(
  code: string,
  name?: string,
  source = 'ruflo_coder',
  target: 'system_runtime' | 'fleet_engine' | 'website_dom' = 'system_runtime',
  context: any = {}
): Promise<{ success: boolean; module?: AppliedSystemModule; error?: string; output?: any }> {
  try {
    const response = await fetch('/api/system/apply-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        name,
        source,
        target,
        context,
      }),
    });

    const data = await response.json();

    if (data.success && data.module) {
      initializeSystemRuntime();
      if (window.__MUNDERDIFFL_SYSTEM__) {
        const existingIdx = window.__MUNDERDIFFL_SYSTEM__.activeModules.findIndex(
          (m) => m.id === data.module.id
        );
        if (existingIdx >= 0) {
          window.__MUNDERDIFFL_SYSTEM__.activeModules[existingIdx] = data.module;
        } else {
          window.__MUNDERDIFFL_SYSTEM__.activeModules.unshift(data.module);
        }
        window.__MUNDERDIFFL_SYSTEM__.systemState.mountedFeatures =
          window.__MUNDERDIFFL_SYSTEM__.activeModules.length;
        window.__MUNDERDIFFL_SYSTEM__.systemState.lastPatchTime = Date.now();
      }
      return {
        success: true,
        module: data.module,
        output: data.module.output,
      };
    }

    return {
      success: false,
      error: data.error || 'Failed to apply code to backend system',
      module: data.module,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Server-side execution unavailable. Client code execution is disabled.',
    };
  }
}
