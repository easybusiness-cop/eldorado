/**
 * Persistent Memory + Lightweight Knowledge Graph
 * Open-source composition: pure TypeScript + filesystem persistence.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";

export interface MemoryNode {
  id: string;
  type: "concept" | "entity" | "event" | "document" | "agent_note";
  label: string;
  content: string;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  importance: number; // 0–1
}

export interface MemoryEdge {
  id: string;
  from: string;
  to: string;
  relation: string; // e.g. "related_to", "caused", "mentions", "derived_from"
  weight: number;
  createdAt: string;
}

export interface EpisodicMemory {
  id: string;
  agentId: string;
  objective: string;
  summary: string;
  outcome: "success" | "failure" | "partial";
  planId?: string;
  createdAt: string;
  tags: string[];
}

export class KnowledgeGraph {
  private nodes: Map<string, MemoryNode> = new Map();
  private edges: Map<string, MemoryEdge> = new Map();
  private episodes: Map<string, EpisodicMemory> = new Map();
  private dataDir: string;

  constructor(dataDir = path.join(process.cwd(), ".rufflo-memory")) {
    this.dataDir = dataDir;
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    this.load();
  }

  // ------------------------------------------------------------------
  // Nodes
  // ------------------------------------------------------------------
  addNode(input: {
    type: MemoryNode["type"];
    label: string;
    content: string;
    tags?: string[];
    metadata?: Record<string, any>;
    importance?: number;
  }): MemoryNode {
    const now = new Date().toISOString();
    const node: MemoryNode = {
      id: `node-${randomUUID().slice(0, 10)}`,
      type: input.type,
      label: input.label,
      content: input.content,
      tags: input.tags || [],
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now,
      importance: input.importance ?? 0.5,
    };
    this.nodes.set(node.id, node);
    this.save();
    return node;
  }

  getNode(id: string): MemoryNode | undefined {
    return this.nodes.get(id);
  }

  searchNodes(query: string, limit = 10): MemoryNode[] {
    const q = query.toLowerCase();
    return Array.from(this.nodes.values())
      .filter(
        (n) =>
          n.label.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      )
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }

  // ------------------------------------------------------------------
  // Edges (Knowledge Graph relations)
  // ------------------------------------------------------------------
  addEdge(from: string, to: string, relation: string, weight = 1): MemoryEdge {
    const edge: MemoryEdge = {
      id: `edge-${randomUUID().slice(0, 10)}`,
      from,
      to,
      relation,
      weight,
      createdAt: new Date().toISOString(),
    };
    this.edges.set(edge.id, edge);
    this.save();
    return edge;
  }

  getRelated(nodeId: string, relation?: string): { edge: MemoryEdge; node: MemoryNode }[] {
    const results: { edge: MemoryEdge; node: MemoryNode }[] = [];
    for (const edge of this.edges.values()) {
      if (edge.from === nodeId || edge.to === nodeId) {
        if (relation && edge.relation !== relation) continue;
        const otherId = edge.from === nodeId ? edge.to : edge.from;
        const node = this.nodes.get(otherId);
        if (node) results.push({ edge, node });
      }
    }
    return results;
  }

  // ------------------------------------------------------------------
  // Episodic Memory (what the agents did)
  // ------------------------------------------------------------------
  addEpisode(input: {
    agentId: string;
    objective: string;
    summary: string;
    outcome: EpisodicMemory["outcome"];
    planId?: string;
    tags?: string[];
  }): EpisodicMemory {
    const episode: EpisodicMemory = {
      id: `ep-${randomUUID().slice(0, 10)}`,
      agentId: input.agentId,
      objective: input.objective,
      summary: input.summary,
      outcome: input.outcome,
      planId: input.planId,
      createdAt: new Date().toISOString(),
      tags: input.tags || [],
    };
    this.episodes.set(episode.id, episode);
    this.save();
    return episode;
  }

  getRecentEpisodes(agentId?: string, limit = 20): EpisodicMemory[] {
    let list = Array.from(this.episodes.values());
    if (agentId) list = list.filter((e) => e.agentId === agentId);
    return list
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  // ------------------------------------------------------------------
  // Persistence
  // ------------------------------------------------------------------
  getGraphData() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      episodes: Array.from(this.episodes.values()),
    };
  }

  private save() {
    const payload = {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      episodes: Array.from(this.episodes.values()),
    };
    fs.writeFileSync(
      path.join(this.dataDir, "knowledge-graph.json"),
      JSON.stringify(payload, null, 2),
      "utf8"
    );
  }

  private load() {
    const file = path.join(this.dataDir, "knowledge-graph.json");
    if (!fs.existsSync(file)) return;
    try {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      for (const n of data.nodes || []) this.nodes.set(n.id, n);
      for (const e of data.edges || []) this.edges.set(e.id, e);
      for (const ep of data.episodes || []) this.episodes.set(ep.id, ep);
    } catch {
      // ignore corrupt file
    }
  }
}

// Singleton for the whole OS
export const knowledgeGraph = new KnowledgeGraph();
