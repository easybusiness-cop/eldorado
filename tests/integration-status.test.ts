import assert from "node:assert/strict";
import { test } from "node:test";
import { composioAuth } from "../server/integrations/composio/auth.ts";
import { ComposioGitHubProvider } from "../server/integrations/composio/providers/github.ts";

test("integration catalog does not label unverified providers as connected", () => {
  assert.equal(composioAuth.getAllConnections().filter((connection) => connection.connected).length, 0);
});

test("integration setup fails explicitly when no real authorization flow exists", async () => {
  await assert.rejects(
    composioAuth.initiateConnection("github"),
    /no provider authorization flow is implemented/,
  );
  assert.equal(composioAuth.getConnection("github")?.connected, false);
});

test("GitHub status does not infer an authenticated account without a configured credential", async () => {
  const previousToken = process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_TOKEN;

  try {
    assert.deepEqual(await ComposioGitHubProvider.checkConnection(), { connected: false });
  } finally {
    if (previousToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = previousToken;
  }
});

test("GitHub PR creation reports unavailable instead of inventing a pull request", async () => {
  const previousToken = process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_TOKEN;

  try {
    await assert.rejects(
      ComposioGitHubProvider.createPullRequest({
        repo: "owner/repo",
        title: "Test PR",
        head: "feature",
        base: "main",
        body: "",
      }),
      /configure Composio or GITHUB_TOKEN/,
    );
  } finally {
    if (previousToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = previousToken;
  }
});
