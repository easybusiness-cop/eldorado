import { Router } from 'express';
import { workflowEngine } from '../workflows/engine.ts';
import { mastraWorkflowEngine } from '../ai/mastra/workflows/index.ts';
import { approvalWorkflowService } from '../workflows/approval.ts';

export const workflowRouter = Router();

workflowRouter.get('/', (req, res) => {
  res.json({
    success: true,
    workflows: mastraWorkflowEngine.getAllWorkflows(),
    pendingApprovals: approvalWorkflowService.getPendingApprovals(),
  });
});

workflowRouter.post('/create', (req, res) => {
  const { type, title, spec } = req.body;
  let wf;
  if (type === 'marketing') {
    wf = workflowEngine.createMarketingCampaignWorkflow(title || 'New Campaign', spec || 'Campaign brief');
  } else {
    wf = workflowEngine.createSoftwareDevWorkflow(title || 'New Feature', spec || 'Technical spec');
  }
  res.json({ success: true, workflow: wf });
});

workflowRouter.post('/approval/:id', (req, res) => {
  const { decision, reviewer, notes } = req.body;
  const result = approvalWorkflowService.resolveApproval(
    req.params.id,
    decision || 'approved',
    reviewer || 'admin',
    notes
  );
  if (!result) {
    return res.status(404).json({ success: false, error: 'Approval request not found' });
  }
  res.json({ success: true, approval: result });
});
