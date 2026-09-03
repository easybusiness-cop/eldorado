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

// Initialize Client System Runtime Object
export function initializeSystemRuntime() {
  if (typeof window === 'undefined') return;

  if (!window.__MUNDERDIFFL_SYSTEM__) {
    window.__MUNDERDIFFL_SYSTEM__ = {
      version: '0.4.0-auto-patch',
      activeModules: [],
      systemState: {
        fleetSize: 9,
        zeroTrust: true,
        autoDeployEnabled: true,
        mountedFeatures: 0,
        lastPatchTime: Date.now(),
      },
      applyClientPatch: (code: string, meta: any = {}) => {
        try {
          // Safe evaluation in browser context with exposed runtime
          const runtimeFn = new Function(
            'system',
            'state',
            'meta',
            `"use strict";
            try {
              ${code}
            } catch (err) {
              console.error("[System Code Runtime Error]:", err);
              return { error: err.message };
            }`
          );

          const result = runtimeFn(
            window.__MUNDERDIFFL_SYSTEM__,
            window.__MUNDERDIFFL_SYSTEM__?.systemState,
            meta
          );

          window.dispatchEvent(
            new CustomEvent('munderdiffl-system-code-applied', {
              detail: { code, meta, result, timestamp: Date.now() },
            })
          );

          return result;
        } catch (err: any) {
          console.error('[System Patch Execution Failed]:', err);
          return { error: err.message };
        }
      },
      executeModule: (nameOrId: string, ...args: any[]) => {
        const found = window.__MUNDERDIFFL_SYSTEM__?.activeModules.find(
          (m) => m.id === nameOrId || m.name.toLowerCase().includes(nameOrId.toLowerCase())
        );
        if (!found) {
          console.warn(`[System Runtime] Module "${nameOrId}" not found in active registry.`);
          return null;
        }
        return window.__MUNDERDIFFL_SYSTEM__?.applyClientPatch(found.code, { args });
      },
      dispatchFleetEvent: (eventName: string, payload: any = {}) => {
        window.dispatchEvent(new CustomEvent(`munderdiffl-${eventName}`, { detail: payload }));
      },
    };
  }
}

// Send Code to Backend and Apply to Both System Runtime and Website
export async function sendAndApplySystemCode(
  code: string,
  name?: string,
  source = 'ruflo_coder',
  target: 'system_runtime' | 'fleet_engine' | 'website_dom' = 'system_runtime',
  context: any = {}
): Promise<{ success: boolean; module?: AppliedSystemModule; error?: string; output?: any }> {
  try {
    // 1. Send to Express Backend to execute, validate and register in backend runtime
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
      // 2. Also mount and apply to client website runtime
      initializeSystemRuntime();
      if (window.__MUNDERDIFFL_SYSTEM__) {
        // Register in window state
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

        // Run client-side patch execution
        const clientResult = window.__MUNDERDIFFL_SYSTEM__.applyClientPatch(code, {
          source,
          name: data.module.name,
        });

        data.module.output = data.module.output || clientResult;
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
    // Fallback: apply client-side if offline/error
    initializeSystemRuntime();
    const clientResult = window.__MUNDERDIFFL_SYSTEM__?.applyClientPatch(code, { source, name });
    return {
      success: true,
      error: err.message,
      output: clientResult,
    };
  }
}
