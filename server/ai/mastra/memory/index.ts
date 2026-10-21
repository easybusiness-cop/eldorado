import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getSupabaseAdmin } from '../../../../src/utils/supabaseAdmin.ts';
import { MemoryPolicy } from '../../../memory/memory-policy.ts';

export type MemoryScope =
  | 'short_term'
  | 'working'
  | 'agent'
  | 'department'
  | 'company'
  | 'project';

export interface MemoryRecord {
  id: string;
  organizationId: string;
  agentId: string;
  scope: MemoryScope;
  content: string;
  timestamp: number;
  tags: string[];
}

export interface MemorySearchMatch {
  memory: MemoryRecord;
  score: number;
}

export interface MemorySearchOptions {
  limit?: number;
  agentId?: string;
  scope?: MemoryScope;
  tag?: string;
  organizationId?: string;
  excludeTags?: readonly string[];
}

interface SupabaseMemoryRow {
  id: string;
  organization_id: string;
  agent_id: string;
  scope: MemoryScope;
  content: string;
  created_at: string;
  tags: string[] | null;
}

const MAX_MEMORIES_PER_AGENT = 50;
const MAX_MEMORY_CONTENT_LENGTH = 10_000;
const MAX_SEARCH_CANDIDATES = 500;
const MEMORY_SCOPES = new Set<MemoryScope>([
  'short_term', 'working', 'agent', 'department', 'company', 'project',
]);
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'from',
  'how', 'in', 'into', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'this',
  'to', 'was', 'what', 'when', 'where', 'which', 'who', 'why', 'with',
]);

function tokenize(value: string): string[] {
  return value.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

function normalizeLimit(limit: number | undefined, fallback: number): number {
  if (limit === undefined) return fallback;
  if (!Number.isFinite(limit)) throw new Error('Memory limit must be a finite number.');
  return Math.min(Math.max(Math.floor(limit), 1), MAX_SEARCH_CANDIDATES);
}

function validateOrganizationId(organizationId: string): string {
  const value = organizationId.trim();
  if (!value || value.length > 100) {
    throw new Error('A valid organization ID is required for memory operations.');
  }
  return value;
}

function fromSupabaseRow(row: SupabaseMemoryRow): MemoryRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    agentId: row.agent_id,
    scope: row.scope,
    content: row.content,
    timestamp: new Date(row.created_at).getTime(),
    tags: Array.isArray(row.tags) ? row.tags : [],
  };
}

function rankMemories(
  records: MemoryRecord[],
  query: string,
  limit: number,
  fullTextMatched = false,
): MemorySearchMatch[] {
  const queryTerms = [...new Set(tokenize(query).filter((term) => term.length > 1 && !STOP_WORDS.has(term)))];
  if (queryTerms.length === 0) return [];

  const normalizedQuery = queryTerms.join(' ');
  return records
    .map((memory) => {
      const content = memory.content.toLocaleLowerCase();
      const contentTokens = tokenize(content);
      const contentCounts = new Map<string, number>();
      for (const token of contentTokens) {
        contentCounts.set(token, (contentCounts.get(token) ?? 0) + 1);
      }
      const tagTokens = new Set((memory.tags ?? []).flatMap(tokenize));

      let score = 0;
      let matchedTerms = 0;
      for (const term of queryTerms) {
        const contentFrequency = contentCounts.get(term) ?? 0;
        const tagMatch = tagTokens.has(term);
        if (contentFrequency > 0 || tagMatch) matchedTerms += 1;
        score += Math.min(contentFrequency, 3) * 2;
        if (tagMatch) score += 3;
      }

      if (matchedTerms > 0 && content.includes(normalizedQuery)) score += 4;
      if (queryTerms.length > 1 && matchedTerms === queryTerms.length) score += 2;
      if (fullTextMatched && score === 0) score = 1;

      return { memory, score };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || b.memory.timestamp - a.memory.timestamp)
    .slice(0, limit);
}

export class MastraMemoryStore {
  private static instance: MastraMemoryStore;
  private supabase: ReturnType<typeof getSupabaseAdmin> | null = null;
  private localRecords: MemoryRecord[] | null = null;
  private localLoad: Promise<MemoryRecord[]> | null = null;
  private localWriteQueue: Promise<void> = Promise.resolve();

  private constructor() {}

  public static getInstance(): MastraMemoryStore {
    if (!MastraMemoryStore.instance) {
      MastraMemoryStore.instance = new MastraMemoryStore();
    }
    return MastraMemoryStore.instance;
  }

  public async saveMemory(
    agentId: string,
    content: string,
    scope: MemoryScope = 'agent',
    tags: string[] = [],
    organizationId = 'org-default',
  ): Promise<MemoryRecord> {
    const normalizedAgentId = agentId.trim();
    if (!normalizedAgentId || normalizedAgentId.length > 200) {
      throw new Error('A valid agent ID is required to save a memory.');
    }
    if (!MEMORY_SCOPES.has(scope)) throw new Error('A valid memory scope is required.');
    if (!Array.isArray(tags) || tags.length > 50 ||
      tags.some((tag) => typeof tag !== 'string' || tag.length > 200)) {
      throw new Error('Memory tags must contain at most 50 strings of no more than 200 characters each.');
    }

    const sanitizedContent = MemoryPolicy.sanitizeContent(content).trim();
    if (!sanitizedContent || sanitizedContent.length > MAX_MEMORY_CONTENT_LENGTH) {
      throw new Error(`Memory content must be between 1 and ${MAX_MEMORY_CONTENT_LENGTH} characters.`);
    }

    const normalizedTags = [...new Set(tags
      .map((tag) => MemoryPolicy.sanitizeContent(tag).trim())
      .filter(Boolean))];
    const orgId = validateOrganizationId(organizationId);
    const createdAt = new Date();
    const record: MemoryRecord = {
      id: randomUUID(),
      organizationId: orgId,
      agentId: normalizedAgentId,
      scope,
      content: sanitizedContent,
      timestamp: createdAt.getTime(),
      tags: normalizedTags,
    };

    if (this.getStorageMode() === 'supabase') {
      const { data, error } = await this.getSupabase()
        .from('agent_memories')
        .insert({
          id: record.id,
          organization_id: record.organizationId,
          agent_id: record.agentId,
          scope: record.scope,
          content: record.content,
          tags: record.tags,
        })
        .select('id, organization_id, agent_id, scope, content, created_at, tags')
        .single();

      if (error) throw new Error(`Failed to persist memory: ${error.message}`);
      if (!data) throw new Error('Memory persistence returned no saved record.');
      return fromSupabaseRow(data as SupabaseMemoryRow);
    }

    const records = await this.getLocalRecords();
    records.unshift(record);
    const sameAgent = records.filter((item) =>
      item.organizationId === orgId && item.agentId === normalizedAgentId,
    );
    const retainedIds = new Set(sameAgent.slice(0, MAX_MEMORIES_PER_AGENT).map((item) => item.id));
    this.localRecords = records.filter((item) =>
      item.organizationId !== orgId ||
      item.agentId !== normalizedAgentId ||
      retainedIds.has(item.id),
    );
    await this.persistLocalRecords();
    return record;
  }

  public async getMemories(
    agentId: string,
    limit = 10,
    organizationId = 'org-default',
  ): Promise<MemoryRecord[]> {
    const boundedLimit = normalizeLimit(limit, 10);
    const orgId = validateOrganizationId(organizationId);

    if (this.getStorageMode() === 'supabase') {
      const { data, error } = await this.getSupabase()
        .from('agent_memories')
        .select('id, organization_id, agent_id, scope, content, created_at, tags')
        .eq('organization_id', orgId)
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(boundedLimit);

      if (error) throw new Error(`Failed to load agent memories: ${error.message}`);
      return (data ?? []).map((row: SupabaseMemoryRow) => fromSupabaseRow(row));
    }

    return (await this.getLocalRecords())
      .filter((record) => record.organizationId === orgId && record.agentId === agentId)
      .slice(0, boundedLimit);
  }

  public async getMemoriesByScope(
    scope: MemoryScope,
    organizationId = 'org-default',
    limit = MAX_SEARCH_CANDIDATES,
  ): Promise<MemoryRecord[]> {
    const boundedLimit = normalizeLimit(limit, MAX_SEARCH_CANDIDATES);
    const orgId = validateOrganizationId(organizationId);

    if (this.getStorageMode() === 'supabase') {
      const { data, error } = await this.getSupabase()
        .from('agent_memories')
        .select('id, organization_id, agent_id, scope, content, created_at, tags')
        .eq('organization_id', orgId)
        .eq('scope', scope)
        .order('created_at', { ascending: false })
        .limit(boundedLimit);

      if (error) throw new Error(`Failed to load ${scope} memories: ${error.message}`);
      return (data ?? []).map((row: SupabaseMemoryRow) => fromSupabaseRow(row));
    }

    return (await this.getLocalRecords())
      .filter((record) => record.organizationId === orgId && record.scope === scope)
      .slice(0, boundedLimit);
  }

  public async searchMemories(
    query: string,
    options: MemorySearchOptions = {},
  ): Promise<MemorySearchMatch[]> {
    if (typeof query !== 'string' || query.trim().length === 0 || query.length > 2_000) {
      throw new Error('Memory search query must be between 1 and 2,000 characters.');
    }

    const limit = normalizeLimit(options.limit, 5);
    const organizationId = validateOrganizationId(options.organizationId ?? 'org-default');
    const queryTerms = [...new Set(tokenize(query).filter((term) => term.length > 1 && !STOP_WORDS.has(term)))];
    if (queryTerms.length === 0) return [];

    let candidates: MemoryRecord[];
    if (this.getStorageMode() === 'supabase') {
      let request = this.getSupabase()
        .from('agent_memories')
        .select('id, organization_id, agent_id, scope, content, created_at, tags')
        .eq('organization_id', organizationId);

      if (options.agentId) request = request.eq('agent_id', options.agentId);
      if (options.scope) request = request.eq('scope', options.scope);
      if (options.tag) request = request.contains('tags', [options.tag]);

      const { data, error } = await request
        .textSearch('search_vector', queryTerms.join(' OR '), { config: 'english', type: 'websearch' })
        .order('created_at', { ascending: false })
        .limit(MAX_SEARCH_CANDIDATES);

      if (error) throw new Error(`Failed to search memories: ${error.message}`);
      candidates = (data ?? []).map((row: SupabaseMemoryRow) => fromSupabaseRow(row));
    } else {
      candidates = (await this.getLocalRecords()).filter((record) =>
        record.organizationId === organizationId &&
        (!options.agentId || record.agentId === options.agentId) &&
        (!options.scope || record.scope === options.scope) &&
        (!options.tag || record.tags.includes(options.tag)),
      );
    }

    const excludedTags = new Set(options.excludeTags ?? []);
    if (excludedTags.size > 0) {
      candidates = candidates.filter((record) =>
        !record.tags.some((tag) => excludedTags.has(tag)),
      );
    }

    return rankMemories(candidates, query, limit, this.getStorageMode() === 'supabase');
  }

  public getStorageMode(): 'supabase' | 'local-file' {
    const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (Boolean(url) !== Boolean(key)) {
      throw new Error('Configure both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for persistent cloud memory.');
    }
    if (url && key) return 'supabase';
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Persistent memory requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in production.');
    }
    return 'local-file';
  }

  private getSupabase(): ReturnType<typeof getSupabaseAdmin> {
    if (!this.supabase) this.supabase = getSupabaseAdmin();
    return this.supabase;
  }

  private async getLocalRecords(): Promise<MemoryRecord[]> {
    if (this.localRecords) return this.localRecords;
    if (!this.localLoad) {
      const load = (async (): Promise<MemoryRecord[]> => {
        const memoryFile = process.env.RUFFLO_MEMORY_FILE ||
          path.join(process.cwd(), '.rufflo-memory', 'agent-memories.json');
        try {
          const parsed: unknown = JSON.parse(await fs.readFile(memoryFile, 'utf8'));
          if (!Array.isArray(parsed)) {
            throw new Error(`Local memory store at "${memoryFile}" must contain a JSON array.`);
          }
          this.localRecords = parsed as MemoryRecord[];
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
          this.localRecords = [];
        }
        return this.localRecords ?? [];
      })();
      this.localLoad = load;
      return load;
    }
    return this.localLoad;
  }

  private async persistLocalRecords(): Promise<void> {
    const memoryFile = process.env.RUFFLO_MEMORY_FILE ||
      path.join(process.cwd(), '.rufflo-memory', 'agent-memories.json');
    const snapshot = JSON.stringify(this.localRecords ?? [], null, 2);
    const write = this.localWriteQueue.then(async () => {
      await fs.mkdir(path.dirname(memoryFile), { recursive: true });
      const temporaryFile = `${memoryFile}.${randomUUID()}.tmp`;
      await fs.writeFile(temporaryFile, snapshot, { encoding: 'utf8', mode: 0o600 });
      await fs.rename(temporaryFile, memoryFile);
    });
    this.localWriteQueue = write.catch((error) => {
      console.error('[MemoryStore] Queued local memory write failed:', error);
    });
    await write;
  }
}

export const mastraMemoryStore = MastraMemoryStore.getInstance();
