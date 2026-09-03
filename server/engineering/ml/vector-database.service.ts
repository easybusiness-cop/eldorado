import { modelRouter } from '../../ai/models/model-router.ts';

export interface DocumentChunk {
  id: string;
  documentId: string;
  text: string;
  vector: number[];
  metadata: Record<string, any>;
}

export interface VectorSearchResult {
  chunk: DocumentChunk;
  similarityScore: number;
}

export class VectorDatabaseService {
  private static vectorStore: DocumentChunk[] = [];

  // Create high-dimensional embedding vector (using Gemini SDK or deterministic hashing representation)
  public static async generateEmbedding(text: string): Promise<number[]> {
    const isReal = !!process.env.GEMINI_API_KEY;
    if (isReal) {
      try {
        const client = modelRouter.getClient();
        if (client) {
          const res: any = await client.models.embedContent({
            model: 'text-embedding-004',
            contents: text,
          });
          const embedValues = res?.embedding?.values || res?.embeddings?.[0]?.values;
          if (embedValues) {
            return embedValues;
          }
        }
      } catch (e) {
        console.warn('Gemini vector embedding API fallback to local vector representation:', e);
      }
    }

    // High-dimensional vector projection fallback
    const dims = 64;
    const vector: number[] = new Array(dims).fill(0);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const idx = (charCode + i) % dims;
      vector[idx] += (charCode / 255.0) - 0.5;
    }
    // L2 Normalize
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vector.map(v => Number((v / norm).toFixed(6)));
  }

  // Ingest document into vector store
  public static async ingestDocument(documentId: string, content: string, metadata: Record<string, any> = {}): Promise<DocumentChunk[]> {
    const words = content.split(/\s+/);
    const chunkSize = 50;
    const overlap = 10;
    const chunks: DocumentChunk[] = [];

    for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
      const chunkText = words.slice(i, i + chunkSize).join(' ');
      if (!chunkText.trim()) continue;

      const vector = await this.generateEmbedding(chunkText);
      const chunk: DocumentChunk = {
        id: `vec-${documentId}-${chunks.length + 1}-${Date.now()}`,
        documentId,
        text: chunkText,
        vector,
        metadata,
      };

      chunks.push(chunk);
      this.vectorStore.push(chunk);
    }

    return chunks;
  }

  // Cosine similarity search
  public static async searchSimilar(query: string, topK = 3): Promise<VectorSearchResult[]> {
    const queryVector = await this.generateEmbedding(query);

    const scored = this.vectorStore.map(chunk => {
      const dotProduct = chunk.vector.reduce((sum, val, idx) => sum + val * (queryVector[idx] || 0), 0);
      return {
        chunk,
        similarityScore: Number(Math.max(0, Math.min(1, (dotProduct + 1) / 2)).toFixed(4)),
      };
    });

    return scored
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, topK);
  }

  public static getStoreCount(): number {
    return this.vectorStore.length;
  }
}
