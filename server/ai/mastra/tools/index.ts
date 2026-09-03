export interface MastraToolDefinition {
  name: string;
  description: string;
  category: 'system' | 'engineering' | 'external' | 'security' | 'database';
  requiresAuth: boolean;
  requiredPermission: string;
  execute: (params: any, context: { agentId: string; orgId: string }) => Promise<any>;
}

export class MastraToolRegistry {
  private static instance: MastraToolRegistry;
  private tools: Map<string, MastraToolDefinition> = new Map();

  private constructor() {
    this.registerBuiltins();
  }

  public static getInstance(): MastraToolRegistry {
    if (!MastraToolRegistry.instance) {
      MastraToolRegistry.instance = new MastraToolRegistry();
    }
    return MastraToolRegistry.instance;
  }

  private registerBuiltins() {
    this.register({
      name: 'ping',
      description: 'Check connectivity and health of agent runtime',
      category: 'system',
      requiresAuth: false,
      requiredPermission: 'system:ping',
      execute: async () => ({ status: 'pong', timestamp: Date.now() }),
    });

    this.register({
      name: 'secret_redaction_engine',
      description: 'Scan and redact sensitive credentials from string payloads',
      category: 'security',
      requiresAuth: false,
      requiredPermission: 'security:redact',
      execute: async (params) => {
        const text = String(params.text || '');
        return {
          originalLength: text.length,
          redactedText: text.replace(/ghp_[a-zA-Z0-9]{30,40}/gi, '[REDACTED_SECURITY_GATEWAY]'),
        };
      },
    });
  }

  public register(tool: MastraToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  public getTool(name: string): MastraToolDefinition | undefined {
    return this.tools.get(name);
  }

  public getAllTools(): MastraToolDefinition[] {
    return Array.from(this.tools.values());
  }
}

export const mastraToolRegistry = MastraToolRegistry.getInstance();
