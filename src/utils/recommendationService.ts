/**
 * Recommendation System Client SDK
 * Provides user behavior telemetry tracking, collaborative filtering queries,
 * trending items, and Quantum Intelligence AI contextual recommendations.
 */

export interface RecommendedItem {
  id: string;
  title: string;
  description: string;
  itemType: "agent" | "task" | "workflow" | "tool" | "prompt" | "model" | "feature";
  category: string;
  tags?: string[];
  score: number;
  trendingScore: number;
  collaborativeScore: number;
  reason: string;
  badge?: string;
  icon?: string;
  actionPayload?: Record<string, any>;
}

export interface IntelligenceRecommendationContext {
  prompt: string;
  recommendedAgents: RecommendedItem[];
  recommendedTools: RecommendedItem[];
  recommendedActions: RecommendedItem[];
  trendingTopics: string[];
  userAffinities: Record<string, number>;
}

export interface UserBehaviorEvent {
  id: string;
  userId: string;
  eventType: "view" | "click" | "dispatch" | "execute" | "chat" | "search" | "complete";
  itemId: string;
  itemType: string;
  itemTitle: string;
  category: string;
  tags: string[];
  weight: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class RecommendationService {
  public async trackEvent(event: {
    userId?: string;
    eventType: "view" | "click" | "dispatch" | "execute" | "chat" | "search" | "complete";
    itemId: string;
    itemType: "agent" | "task" | "workflow" | "tool" | "prompt" | "model" | "feature";
    itemTitle?: string;
    category?: string;
    tags?: string[];
    weight?: number;
    metadata?: Record<string, any>;
  }): Promise<boolean> {
    try {
      const res = await fetch("/api/recommendations/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: event.userId || "dev-admin-user",
          ...event,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async getPersonalized(
    userId = "dev-admin-user",
    limit = 8,
    itemType?: string
  ): Promise<RecommendedItem[]> {
    try {
      const params = new URLSearchParams({ userId, limit: limit.toString() });
      if (itemType) params.append("itemType", itemType);
      const res = await fetch(`/api/recommendations/personalized?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        return data.recommendations || [];
      }
    } catch (e) {
      console.warn("Failed to fetch personalized recommendations:", e);
    }
    return [];
  }

  public async getTrending(limit = 6, itemType?: string): Promise<RecommendedItem[]> {
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (itemType) params.append("itemType", itemType);
      const res = await fetch(`/api/recommendations/trending?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        return data.trending || [];
      }
    } catch (e) {
      console.warn("Failed to fetch trending recommendations:", e);
    }
    return [];
  }

  public async getIntelligenceContext(prompt: string, userId = "dev-admin-user"): Promise<IntelligenceRecommendationContext | null> {
    try {
      const res = await fetch("/api/recommendations/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, userId }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.context || null;
      }
    } catch (e) {
      console.warn("Failed to fetch recommendation context:", e);
    }
    return null;
  }

  public async getEvents(limit = 50): Promise<{ events: UserBehaviorEvent[]; stats: any }> {
    try {
      const res = await fetch(`/api/recommendations/events?limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        return { events: data.events || [], stats: data.stats || {} };
      }
    } catch {}
    return { events: [], stats: {} };
  }
}

export const recommendationService = new RecommendationService();
