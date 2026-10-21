import { modelRouter } from '../../ai/models/model-router.ts';
import { getSupabaseAdmin } from '../../../src/utils/supabaseAdmin.ts';

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 768;
const MAX_CHUNK_CHARACTERS = 9_000;
const CHUNK_OVERLAP_CHARACTERS = 500;
const EMBEDDING_CONCURRENCY = 4;
const UPSERT_BATCH_SIZE = 50;

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  text: string;
  metadata: Record<string, unknown>;
}

export interface VectorSearchResult {
  chunk: DocumentChunk;
  similarityScore: number;
}

type EmbeddingTask = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY';

function requireOrganizationId(organizationId: string): string {
  const normalized = organizationId?.trim();
  if (!normalized || normalized.length > 100) {
    throw new Error('A valid authenticated organization ID is required for vector storage.');
  }
  return normalized;
}

function validateMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error('Vector metadata must be a JSON object.');
  }

  const serialized = JSON.stringify(metadata);
  if (serialized.length > 16_000) {
    throw new Error('Vector metadata exceeds the 16 KB limit.');
  }
  return JSON.parse(serialized) as Record<string, unknown>;
}

export class VectorDatabaseService {
  /**
   * Generate production embeddings only. If Gemini is unavailable or returns
   * a vector with the wrong dimensions, fail rather than storing fake vectors.
   */
  public static async generateEmbedding(text: string, task: EmbeddingTask): Promise<number[]> {
    const normalizedText = text?.trim();
    if (!normalizedText) throw new Error('Embedding input cannot be empty.');

    const client = modelRouter.getClient();
    if (!client) {
      throw new Error('Gemini embeddings are unavailable. Configure GEMINI_API_KEY before using vector search.');
    }

    const response = await client.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: normalizedText,
      config: {
        taskType: task,
        outputDimensionality: EMBEDDING_DIMENSIONS,
      },
    });

    const responseData = response as unknown as {
      embedding?: { values?: number[] };
      embeddings?: Array<{ values?: number[] }>;
    };
    const values = responseData.embeddings?.[0]?.values ?? responseData.embedding?.values;
    if (
      !Array.isArray(values) ||
      values.length !== EMBEDDING_DIMENSIONS ||
      values.some((value) => typeof value !== 'number' || !Number.isFinite(value))
    ) {
      throw new Error(`Gemini returned an invalid embedding; expected ${EMBEDDING_DIMENSIONS} finite values.`);
    }

    return values;
  }

  private static splitIntoChunks(content: string): string[] {
    const normalized = content.replace(/\s+/g, ' ').trim();
    const chunks: string[] = [];
    let start = 0;

    while (start < normalized.length) {
      let end = Math.min(start + MAX_CHUNK_CHARACTERS, normalized.length);
      if (end < normalized.length) {
        const boundary = normalized.lastIndexOf(' ', end);
        if (boundary > start + 1_000) end = boundary;
      }

      const chunk = normalized.slice(start, end).trim();
      if (chunk) chunks.push(chunk);
      if (end >= normalized.length) break;
      start = Math.max(start + 1, end - CHUNK_OVERLAP_CHARACTERS);
    }
    return chunks;
  }

  public static async ingestDocument(
    organizationId: string,
    documentId: string,
    content: string,
    metadata: Record<string, unknown> = {},
  ): Promise<DocumentChunk[]> {
    const orgId = requireOrganizationId(organizationId);
    const normalizedDocumentId = documentId?.trim();
    if (!normalizedDocumentId || normalizedDocumentId.length > 500) {
      throw new Error('A document ID between 1 and 500 characters is required.');
    }
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('Document content cannot be empty.');
    }
    if (content.length > 2_000_000) {
      throw new Error('Document content exceeds the 2 MB ingestion limit.');
    }

    const safeMetadata = validateMetadata(metadata);
    const chunkTexts = this.splitIntoChunks(content);
    if (chunkTexts.length === 0) return [];
    const supabase = getSupabaseAdmin();

    const rows: Array<{
      id: string;
      organization_id: string;
      document_id: string;
      chunk_index: number;
      content: string;
      embedding: number[];
      metadata: Record<string, unknown>;
    }> = [];

    for (let offset = 0; offset < chunkTexts.length; offset += EMBEDDING_CONCURRENCY) {
      const batch = await Promise.all(
        chunkTexts.slice(offset, offset + EMBEDDING_CONCURRENCY).map(async (chunkText, batchIndex) => {
          const chunkIndex = offset + batchIndex;
          return {
            id: `${normalizedDocumentId}:${chunkIndex}`,
            organization_id: orgId,
            document_id: normalizedDocumentId,
            chunk_index: chunkIndex,
            content: chunkText,
            embedding: await this.generateEmbedding(chunkText, 'RETRIEVAL_DOCUMENT'),
            metadata: safeMetadata,
          };
        }),
      );
      rows.push(...batch);
    }

    for (let offset = 0; offset < rows.length; offset += UPSERT_BATCH_SIZE) {
      const { error } = await supabase
        .from('knowledge_chunks')
        .upsert(rows.slice(offset, offset + UPSERT_BATCH_SIZE), {
          onConflict: 'organization_id,document_id,chunk_index',
        });
      if (error) {
        throw new Error(`Supabase vector ingestion failed: ${error.message}`);
      }
    }

    const { error: cleanupError } = await supabase
      .from('knowledge_chunks')
      .delete()
      .eq('organization_id', orgId)
      .eq('document_id', normalizedDocumentId)
      .gte('chunk_index', rows.length);
    if (cleanupError) {
      throw new Error(`Supabase stale vector cleanup failed: ${cleanupError.message}`);
    }

    return rows.map((row) => ({
      id: row.id,
      documentId: row.document_id,
      chunkIndex: row.chunk_index,
      text: row.content,
      metadata: row.metadata,
    }));
  }

  public static async searchSimilar(
    organizationId: string,
    query: string,
    topK = 3,
    metadataFilter: Record<string, unknown> = {},
  ): Promise<VectorSearchResult[]> {
    const orgId = requireOrganizationId(organizationId);
    const normalizedQuery = query?.trim();
    if (!normalizedQuery) throw new Error('Vector search query cannot be empty.');
    const limit = Number.isInteger(topK) ? Math.max(1, Math.min(topK, 20)) : 3;
    const safeMetadataFilter = validateMetadata(metadataFilter);
    const embedding = await this.generateEmbedding(normalizedQuery, 'RETRIEVAL_QUERY');

    const { data, error } = await getSupabaseAdmin().rpc('match_knowledge_chunks', {
      query_embedding: embedding,
      match_count: limit,
      filter_organization_id: orgId,
      filter_metadata: safeMetadataFilter,
    });

    if (error) {
      throw new Error(`Supabase vector search failed: ${error.message}`);
    }

    return (data ?? []).map((row: any) => ({
      chunk: {
        id: row.id,
        documentId: row.document_id,
        chunkIndex: row.chunk_index,
        text: row.content,
        metadata: row.metadata ?? {},
      },
      similarityScore: Number(Number(row.similarity).toFixed(4)),
    }));
  }
}
