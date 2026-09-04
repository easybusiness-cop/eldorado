import { Router } from 'express';
import { MasterProposalService } from '../agents/capabilities/master-self-improvement/master-proposal.service.ts';
import { RepoLearningEngine } from '../knowledge/repositories/repo-learning-engine.ts';
import { FailureSchoolService } from '../training/failures/failure-school.service.ts';
import { LabRunner } from '../training/labs/lab-runner.ts';
import { SoftwareBuilder } from '../core/builder/software-builder.ts';

export const engineeringAdvancedRouter = Router();

// ==========================================
// MASTER ENGINEER SELF-DEVELOPMENT ROUTES
// ==========================================

// GET /api/v2/master/proposals - List all versioned self-improvement proposals
engineeringAdvancedRouter.get('/master/proposals', (req, res) => {
  res.json({ success: true, proposals: MasterProposalService.getProposals() });
});

// POST /api/v2/master/proposals - Submit a new Master Agent self-improvement proposal
engineeringAdvancedRouter.post('/master/proposals', async (req, res) => {
  try {
    const {
      agentId = 'ruflo-coder',
      currentVersion = 'v1.0.0',
      detectedLimitation,
      proposedSolution,
      targetCapabilities = ['system_architecture', 'performance_tuning'],
    } = req.body;

    if (!detectedLimitation || !proposedSolution) {
      return res.status(400).json({ error: 'detectedLimitation and proposedSolution are required' });
    }

    const proposal = await MasterProposalService.createProposal(
      agentId,
      currentVersion,
      detectedLimitation,
      proposedSolution,
      targetCapabilities
    );

    res.json({ success: true, proposal });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v2/master/proposals/:proposalId/approve - Release a self-improvement proposal
engineeringAdvancedRouter.post('/master/proposals/:proposalId/approve', (req, res) => {
  const updated = MasterProposalService.approveProposal(req.params.proposalId);
  if (!updated) return res.status(404).json({ error: 'Proposal not found' });
  res.json({ success: true, proposal: updated });
});

// POST /api/v2/master/proposals/:proposalId/rollback - Rollback a self-improvement release
engineeringAdvancedRouter.post('/master/proposals/:proposalId/rollback', (req, res) => {
  const updated = MasterProposalService.rollbackProposal(req.params.proposalId);
  if (!updated) return res.status(404).json({ error: 'Proposal not found' });
  res.json({ success: true, proposal: updated });
});

// ==========================================
// REPOSITORY INTELLIGENCE LEARNING ROUTES
// ==========================================

// GET /api/v2/repositories - List all ingested engineering learning repositories
engineeringAdvancedRouter.get('/repositories', (req, res) => {
  res.json({ success: true, repositories: RepoLearningEngine.getRepositories() });
});

// POST /api/v2/repositories/ingest - Ingest a new repository URL into knowledge graph
engineeringAdvancedRouter.post('/repositories/ingest', async (req, res) => {
  try {
    const { repoUrl, name } = req.body;
    if (!repoUrl || !name) return res.status(400).json({ error: 'repoUrl and name are required' });

    const repo = await RepoLearningEngine.processRepository(repoUrl, name);
    res.json({ success: true, repository: repo });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// FAILURE SCHOOL & REGRESSION MEMORY ROUTES
// ==========================================

// GET /api/v2/training/failures - Get all failure logs and generated lessons
engineeringAdvancedRouter.get('/training/failures', (req, res) => {
  res.json({ success: true, failures: FailureSchoolService.getFailures() });
});

// POST /api/v2/training/failures - Log a new failure record and generate lesson
engineeringAdvancedRouter.post('/training/failures', (req, res) => {
  try {
    const {
      agentId = 'ruflo-coder',
      taskTitle,
      category = 'LOGIC_BUG',
      attemptedSolution,
      failureLog,
      rootCause,
      correctiveFix,
      generatedLesson,
      affectedCapabilities = ['general_engineering'],
    } = req.body;

    const record = FailureSchoolService.recordFailure(
      agentId,
      taskTitle,
      category,
      attemptedSolution,
      failureLog,
      rootCause,
      correctiveFix,
      generatedLesson,
      affectedCapabilities
    );

    res.json({ success: true, failureRecord: record });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// TRAINING LABS & CHALLENGES ROUTES
// ==========================================

// GET /api/v2/training/labs - List all practical training labs
engineeringAdvancedRouter.get('/training/labs', (req, res) => {
  res.json({ success: true, labs: LabRunner.getLabs() });
});

// POST /api/v2/training/labs/:labId/run - Run a lab challenge for an agent
engineeringAdvancedRouter.post('/training/labs/:labId/run', (req, res) => {
  const { agentId = 'ruflo-coder' } = req.body;
  const result = LabRunner.executeLab(req.params.labId, agentId);
  res.json({ success: true, labResult: result });
});

// ==========================================
// AUTONOMOUS SOFTWARE BUILDER SERVICE
// ==========================================

// POST /api/engineering/builder/build
engineeringAdvancedRouter.post('/builder/build', async (req, res) => {
  try {
    const { objective, language = 'typescript', targetDir = 'modules' } = req.body;
    if (!objective) {
      return res.status(400).json({ error: 'objective parameter is required' });
    }

    const result = await SoftwareBuilder.build({
      objective,
      language,
      targetDir,
      agentId: 'ruflo',
    });

    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

