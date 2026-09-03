import { CodingPlanner } from './planner.ts';
import { RepositoryInspector } from './repository-inspector.ts';
import { CodeEditor } from './code-editor.ts';
import { TestRunner } from './test-runner.ts';
import { DiffReviewer } from './diff-reviewer.ts';
import { CommitService } from '../../../engineering/github/commit.service.ts';

export class CodingAgent {
  public static async executeCodingTask(params: {
    task: string;
    filePath: string;
    targetContent: string;
    replacementContent: string;
    commitMessage: string;
    repo: string;
    branch: string;
  }): Promise<{
    success: boolean;
    pipelineTrace: string[];
    details: any;
  }> {
    const trace: string[] = [];
    trace.push('START: Initiating coding pipeline');

    // 1. Plan
    const plan = await CodingPlanner.generatePlan(params.task, [params.filePath]);
    trace.push(`PLAN: Generated autonomous plan with ${plan.steps.length} steps`);

    // 2. Inspect
    const inspection = await RepositoryInspector.inspectFileStructure();
    trace.push(`INSPECT: Located ${inspection.files.length} project files`);

    // 3. Review Diff
    const review = await DiffReviewer.inspectChanges(params.filePath, params.targetContent, params.replacementContent);
    trace.push(`REVIEW: Security evaluation concluded. Risk level: ${review.riskLevel}`);

    if (!review.approved) {
      trace.push('CANCELLED: Execution suspended. Code changes require human approval.');
      return {
        success: false,
        pipelineTrace: trace,
        details: { reason: 'Security risk policy block', violations: review.violations },
      };
    }

    // 4. Edit
    const editRes = await CodeEditor.applyEdits(params.filePath, params.targetContent, params.replacementContent);
    if (!editRes.success) {
      trace.push('FAILED: Target content modification mismatch.');
      return { success: false, pipelineTrace: trace, details: null };
    }
    trace.push('EDIT: Code updates successfully modified in file');

    // 5. Test
    const buildRes = await TestRunner.verifyBuild();
    if (!buildRes.success) {
      trace.push('FAILED: Verification build failed. Code contains compiler diagnostics.');
      return { success: false, pipelineTrace: trace, details: { logs: buildRes.logs } };
    }
    trace.push('TEST: Application successfully compiled');

    // 6. Commit
    const commitRes = await CommitService.createCommit(
      params.repo,
      params.branch,
      params.commitMessage,
      [{ path: params.filePath, content: params.replacementContent }]
    );
    trace.push(`COMMIT: Changes persisted to branch with hash: ${commitRes.commitSha}`);

    return {
      success: true,
      pipelineTrace: trace,
      details: commitRes,
    };
  }
}
