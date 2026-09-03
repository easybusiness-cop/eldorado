export interface MemoryItem {
  id: string;
  scope: 'working' | 'episodic' | 'semantic' | 'procedural' | 'project' | 'company';
  content: string;
  timestamp: string;
  tags: string[];
}

export class MemoryRanking {
  public static rankMemories(items: MemoryItem[], query: string): MemoryItem[] {
    const term = query.toLowerCase();
    
    return items
      .map(item => {
        let score = 0;
        const text = item.content.toLowerCase();
        
        // Exact match weights
        if (text.includes(term)) score += 10;
        
        // Tag match weights
        item.tags.forEach(tag => {
          if (term.includes(tag.toLowerCase())) score += 5;
        });

        // Recency decay weights
        const ageHours = (Date.now() - new Date(item.timestamp).getTime()) / (1000 * 60 * 60);
        score += Math.max(0, 5 - ageHours / 24);

        return { item, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.item);
  }
}
