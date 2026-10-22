import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BrowserService } from '../server/tools/browser/browser.service.ts';
import { digitalIdentityTools } from '../server/identity/digital-identity.tools.ts';

test('browser status summary excludes cookies, storage paths, screenshots, and user agent', () => {
  const service = new BrowserService();
  const rawCookie = 'session_auth_secret_value';
  (service as any).agentSessions.set('org-one:agent-one', {
    agentId: 'agent-one',
    organizationId: 'org-one',
    context: {},
    page: {},
    currentUrl: 'https://example.com/callback?access_token=private-value&state=private-state&view=home',
    history: [{ url: 'https://example.com', title: 'Example', timestamp: Date.now() }],
    screenshot: 'private screenshot bytes',
    cookiesCount: 1,
    cookieDomains: ['private.example.com'],
    localStorageKeysCount: 1,
    workspaceDir: 'C:/private/workspace',
    storageStatePath: 'C:/private/workspace/storage_state.enc.json',
    isPersistent: true,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    userAgent: rawCookie,
  });

  const status = service.getAgentSession('agent-one', 'org-one');
  const serialized = JSON.stringify(status);
  assert.equal(status?.currentUrl.includes('private-value'), false);
  assert.equal(status?.currentUrl.includes('private-state'), false);
  assert.equal(serialized.includes(rawCookie), false);
  assert.equal(serialized.includes('private.example.com'), false);
  assert.equal(serialized.includes('storageStatePath'), false);
  assert.equal(serialized.includes('screenshot'), false);
  assert.equal(serialized.includes('userAgent'), false);
  assert.equal(status?.cookiesCount, 1);
});

test('browser input actions never echo values back to the caller', async () => {
  const service = new BrowserService();
  const secretInput = 'private-login-value';
  (service as any).getAgentPage = async () => ({ fill: async () => undefined });

  const result = await service.typeAsAgent('agent-one', '#password', secretInput, 'org-one');

  assert.equal(result.success, true);
  assert.equal(JSON.stringify(result).includes(secretInput), false);
});

test('browser session listing returns sessions for the requested organization only', () => {
  const service = new BrowserService();
  const makeSession = (organizationId: string, agentId: string) => ({
    agentId,
    organizationId,
    context: {},
    page: {},
    currentUrl: 'about:blank',
    history: [],
    cookiesCount: 0,
    cookieDomains: [],
    localStorageKeysCount: 0,
    workspaceDir: '/private',
    storageStatePath: '/private/state.enc.json',
    isPersistent: true,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    userAgent: 'private-agent-user-agent',
  });
  (service as any).agentSessions.set('org-one:agent-one', makeSession('org-one', 'agent-one'));
  (service as any).agentSessions.set('org-two:agent-two', makeSession('org-two', 'agent-two'));

  const sessions = service.listAllAgentSessions('org-one');
  assert.deepEqual(sessions.map((session) => session.agentId), ['agent-one']);
  assert.equal(JSON.stringify(sessions).includes('private-agent-user-agent'), false);
});

test('RDIWI exposes scoped identity, Gmail, account, and browser tool definitions', () => {
  const names = new Set(digitalIdentityTools.map((tool) => tool.name));
  for (const name of [
    'identity.get_profile',
    'identity.request_capability',
    'accounts.request_access',
    'gmail.list_inbox',
    'gmail.send',
    'browser.navigate',
    'browser.click',
    'browser.type',
  ]) {
    assert.equal(names.has(name), true, `Expected registered agent tool: ${name}`);
  }
});
