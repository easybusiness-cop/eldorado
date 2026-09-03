import { agentFleetRegistry } from './registry.ts';

export class AgentPermissions {
  public static canExecuteAction(agentId: string, permission: string): boolean {
    const agent = agentFleetRegistry.getAgent(agentId);
    if (!agent) return false;
    if (agent.permissions.includes('*')) return true;
    return agent.permissions.some(p => {
      if (p.endsWith(':*')) {
        const prefix = p.slice(0, -2);
        return permission.startsWith(prefix);
      }
      return p === permission;
    });
  }
}

export class AgentLifecycle {
  public static heartbeat(agentId: string) {
    const agent = agentFleetRegistry.getAgent(agentId);
    if (agent && agent.status === 'offline') {
      agentFleetRegistry.updateStatus(agentId, 'idle');
    }
  }
}
