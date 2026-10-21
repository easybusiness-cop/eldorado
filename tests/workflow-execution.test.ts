import assert from "node:assert/strict";
import { test } from "node:test";
import { GraphRunner } from "../server/orchestration/graph/graph-runner.ts";
import { WorkflowNodes } from "../server/orchestration/graph/nodes.ts";
import type { WorkflowState } from "../server/orchestration/graph/state.ts";
import { WorkflowService } from "../server/engineering/github/workflow.service.ts";

test("workflow graph blocks instead of claiming an agent executed a step", async () => {
  const result = await GraphRunner.runWorkflow({ goal: "inspect repository" });

  assert.equal(result.status, "BLOCKED");
  assert.equal(result.steps[0]?.status, "blocked");
  assert.match(result.steps[0]?.error ?? "", /No execution adapter is configured/);
  assert.equal(result.steps.some((step) => step.status === "completed"), false);
});

test("workflow verification blocks when steps lack execution evidence", async () => {
  const state: WorkflowState = {
    workflowId: "test-workflow",
    status: "VERIFYING",
    currentStepIndex: 0,
    steps: [{
      name: "run checks",
      description: "Run repository checks",
      assignedAgent: "engineer",
      status: "pending",
    }],
    context: {},
    errors: [],
  };

  const result = await WorkflowNodes.executeVerification(state);

  assert.equal(result.status, "BLOCKED");
  assert.match(result.errors[0] ?? "", /every step has execution evidence/);
});

test("GitHub Actions monitoring does not fabricate a successful run when unconfigured", async () => {
  const previousToken = process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_TOKEN;

  try {
    await assert.rejects(
      WorkflowService.monitorWorkflow("owner/repo", 123),
      /GITHUB_TOKEN is not configured/,
    );
  } finally {
    if (previousToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = previousToken;
  }
});

test("GitHub Actions dispatch does not claim success when unconfigured", async () => {
  const previousToken = process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_TOKEN;

  try {
    await assert.rejects(
      WorkflowService.triggerWorkflow("owner/repo", "ci.yml", "main"),
      /GITHUB_TOKEN is not configured/,
    );
  } finally {
    if (previousToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = previousToken;
  }
});
