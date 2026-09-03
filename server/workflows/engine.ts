import { mastraWorkflowEngine } from '../ai/mastra/workflows/index.ts';
import { StatefulWorkflow } from '../../shared/types/index.ts';

export class WorkflowEngine {
  private static instance: WorkflowEngine;

  private constructor() {}

  public static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  public createSoftwareDevWorkflow(title: string, spec: string): StatefulWorkflow {
    return mastraWorkflowEngine.createWorkflow({
      id: `wf-dev-${Date.now()}`,
      name: `Dev Pipeline: ${title}`,
      department: 'engineering',
      description: spec,
      steps: [
        { name: 'Architecture & PRD Specification', agentId: 'product-manager' },
        { name: 'Module Design & Technical Plan', agentId: 'engineering-manager' },
        { name: 'Core Code Implementation', agentId: 'backend-engineer' },
        { name: 'Unit & Integration Verification', agentId: 'qa-agent' },
        { name: 'Zero-Trust Security Scan', agentId: 'dwight' },
        { name: 'Production Pull Request Review', agentId: 'engineering-manager', requiresApproval: true },
      ],
    });
  }

  public createMarketingCampaignWorkflow(campaignName: string, brief: string): StatefulWorkflow {
    return mastraWorkflowEngine.createWorkflow({
      id: `wf-mkt-${Date.now()}`,
      name: `Campaign: ${campaignName}`,
      department: 'marketing',
      description: brief,
      steps: [
        { name: 'Audience Strategy & Messaging Brief', agentId: 'marketing-manager' },
        { name: 'Multi-Channel Copywriting', agentId: 'social-media-agent' },
        { name: 'Executive & Brand Voice Approval', agentId: 'michael', requiresApproval: true },
        { name: 'Composio Scheduled Social Dispatch', agentId: 'social-media-agent' },
      ],
    });
  }
}

export const workflowEngine = WorkflowEngine.getInstance();
