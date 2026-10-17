import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

test('local memory persists, ranks relevant records, isolates organizations, and redacts secrets', async () => {
  const previousEnvironment = {
    nodeEnv: process.env.NODE_ENV,
    supabaseUrl: process.env.SUPABASE_URL,
    viteSupabaseUrl: process.env.VITE_SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    memoryFile: process.env.RUFFLO_MEMORY_FILE,
  };
  const directory = await mkdtemp(path.join(os.tmpdir(), 'rufflo-memory-test-'));
  const memoryFile = path.join(directory, 'memories.json');

  try {
    process.env.NODE_ENV = 'test';
    process.env.SUPABASE_URL = '';
    process.env.VITE_SUPABASE_URL = '';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';
    process.env.RUFFLO_MEMORY_FILE = memoryFile;

    const { mastraMemoryStore } = await import('../server/ai/mastra/memory/index.ts');
    const privateMemory = await mastraMemoryStore.saveMemory(
      'dwight',
      'Incident response checklist; password=temporary-test-value',
      'agent',
      ['security', 'security'],
      'org-alpha',
    );
    await mastraMemoryStore.saveMemory(
      'dwight',
      'Quarterly office party preferences',
      'agent',
      [],
      'org-alpha',
    );
    await mastraMemoryStore.saveMemory(
      'dwight',
      'Incident response checklist',
      'agent',
      [],
      'org-beta',
    );

    const matches = await mastraMemoryStore.searchMemories('incident response', {
      agentId: 'dwight',
      scope: 'agent',
      organizationId: 'org-alpha',
    });
    assert.equal(matches.length, 1);
    assert.equal(matches[0].memory.id, privateMemory.id);
    assert.ok(matches[0].score > 0);
    assert.equal(privateMemory.content.includes('temporary-test-value'), false);
    assert.equal(privateMemory.content.includes('password=[REDACTED]'), true);
    assert.equal((await mastraMemoryStore.searchMemories('incident response', {
      agentId: 'dwight',
      scope: 'agent',
      organizationId: 'org-gamma',
    })).length, 0);

    const persistedFile = await readFile(memoryFile, 'utf8');
    assert.ok(persistedFile.includes(privateMemory.id));
    assert.equal(persistedFile.includes('temporary-test-value'), false);
  } finally {
    const restoreEnvironment = (key: string, value: string | undefined) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    };
    restoreEnvironment('NODE_ENV', previousEnvironment.nodeEnv);
    restoreEnvironment('SUPABASE_URL', previousEnvironment.supabaseUrl);
    restoreEnvironment('VITE_SUPABASE_URL', previousEnvironment.viteSupabaseUrl);
    restoreEnvironment('SUPABASE_SERVICE_ROLE_KEY', previousEnvironment.serviceKey);
    restoreEnvironment('RUFFLO_MEMORY_FILE', previousEnvironment.memoryFile);
    await rm(directory, { recursive: true, force: true });
  }
});
