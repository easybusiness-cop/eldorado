import { randomUUID } from "node:crypto";

export interface KnowledgeArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  sourceUrl?: string;
  tags: string[];
  departmentScope: string[];
  discoveredAt: string;
  verified: boolean;
  learningImpact: 'high' | 'medium' | 'low';
}

export class KnowledgeManager {
  private static instance: KnowledgeManager;
  private articles: Map<string, KnowledgeArticle> = new Map();

  private constructor() {
    this.seedInitialKnowledge();
  }

  public static getInstance(): KnowledgeManager {
    if (!KnowledgeManager.instance) {
      KnowledgeManager.instance = new KnowledgeManager();
    }
    return KnowledgeManager.instance;
  }

  private seedInitialKnowledge() {
    const seedArticles: KnowledgeArticle[] = [
      {
        id: "know-mastra-v2",
        title: "Optimized Mastra Runtime Routing with Dynamic Lazy Loading",
        summary: "An optimized design pattern to isolate Mastra instances and prevent circular dependencies in Node.js architectures.",
        content: "To prevent circular dependencies on startup, any modules importing dynamic runtime engines should utilize inline dynamic imports (e.g. await import()) during the lifecycle invocation rather than top-level static declarations.",
        tags: ["mastra", "architecture", "nodejs"],
        departmentScope: ["engineering", "research"],
        discoveredAt: new Date().toISOString(),
        verified: true,
        learningImpact: "high"
      },
      {
        id: "know-gemini-sdk",
        title: "Enterprise Code Authoring Guidelines using @google/genai SDK",
        summary: "Official code-generation guidelines for integrating with Gemini models using Google's modern Node SDK.",
        content: "The modern @google/genai SDK replaces the legacy google-generative-ai library. Key classes like GoogleGenAI should be lazily instantiated server-side using the process.env.GEMINI_API_KEY.",
        tags: ["gemini", "ai", "sdk"],
        departmentScope: ["engineering", "research"],
        discoveredAt: new Date().toISOString(),
        verified: true,
        learningImpact: "high"
      }
    ];

    for (const art of seedArticles) {
      this.articles.set(art.id, art);
    }
  }

  public addArticle(article: Omit<KnowledgeArticle, "id" | "discoveredAt">): KnowledgeArticle {
    const id = `know-${randomUUID().slice(0, 8)}`;
    const newArt: KnowledgeArticle = {
      ...article,
      id,
      discoveredAt: new Date().toISOString()
    };
    this.articles.set(id, newArt);
    console.log(`[KnowledgeManager] Added new knowledge: "${newArt.title}" [ID: ${id}]`);
    return newArt;
  }

  public getArticle(id: string): KnowledgeArticle | undefined {
    return this.articles.get(id);
  }

  public getAllArticles(): KnowledgeArticle[] {
    return Array.from(this.articles.values());
  }

  public getArticlesByTag(tag: string): KnowledgeArticle[] {
    return this.getAllArticles().filter((art) => art.tags.includes(tag.toLowerCase()));
  }

  public getArticlesByDepartment(department: string): KnowledgeArticle[] {
    return this.getAllArticles().filter((art) =>
      art.departmentScope.some((d) => d.toLowerCase() === department.toLowerCase())
    );
  }
}

export const knowledgeManager = KnowledgeManager.getInstance();
