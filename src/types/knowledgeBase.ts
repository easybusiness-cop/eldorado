export type KnowledgeCategory = 'hacking' | 'marketing' | 'finance' | 'coding' | 'social_media';

export interface KnowledgeEntry {
  id: string;
  title: string;
  category: KnowledgeCategory;
  summary: string;
  content: string;
  actionableInsight: string;
  tags: string[];
  authorAgentId: string;
  authorAgentName: string;
  authorAgentAvatar?: string;
  confidenceScore: number; // 0.0 - 1.0 (e.g. 0.95 = 95%)
  createdAt: number;
  updatedAt: number;
  usageCount: number;
  verified: boolean;
  sourceTaskId?: string;
  codeOrPayload?: string;
}

export interface KnowledgeSearchFilter {
  query?: string;
  category?: KnowledgeCategory | 'all';
  tag?: string;
  authorAgentId?: string;
}

export interface KnowledgeBaseStats {
  totalEntries: number;
  categoryCounts: Record<KnowledgeCategory, number>;
  totalLearnedByAgents: number;
  latestUpdate: number;
}
