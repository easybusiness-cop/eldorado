import { Router } from "express";

export const knowledgeRouter = Router();

// In-memory server-side knowledge cache synced with standard domains
interface ServerKnowledgeItem {
  id: string;
  title: string;
  category: "hacking" | "marketing" | "finance" | "coding" | "social_media";
  summary: string;
  content: string;
  authorAgentId: string;
  authorAgentName: string;
  confidenceScore: number;
  tags: string[];
  createdAt: number;
}

let serverKnowledgeStore: ServerKnowledgeItem[] = [
  {
    id: "srv-kb-hack-1",
    title: "Perimeter Shield: Real-time Injection & Port Sweep Prevention",
    category: "hacking",
    summary: "Dwight Schrute zero-trust verification rules preventing port sweep anomalies and unauthorized packet floods.",
    content: "Automated packet sniffers verify payload signatures against OWASP standards. Block unauthorized subnet traversal instantly.",
    authorAgentId: "dwight",
    authorAgentName: "Dwight Schrute",
    confidenceScore: 0.99,
    tags: ["hacking", "zero-trust", "perimeter"],
    createdAt: Date.now() - 3600000 * 24,
  },
  {
    id: "srv-kb-mkt-1",
    title: "Enterprise Client Nurture & Conversion Acceleration",
    category: "marketing",
    summary: "Jim Halpert tactical value proposition cadence for B2B procurement officers.",
    content: "Lead with hard cost savings on regional supplies. Frame autonomous workflows as zero-risk operational enhancements.",
    authorAgentId: "jim",
    authorAgentName: "Jim Halpert",
    confidenceScore: 0.94,
    tags: ["marketing", "b2b", "conversion"],
    createdAt: Date.now() - 3600000 * 18,
  },
  {
    id: "srv-kb-fin-1",
    title: "Algorithmic Invoicing & Unit Cost Control Ledger",
    category: "finance",
    summary: "Kevin Malone automated reconciliation logic preventing invoice leakage.",
    content: "Cross-examine vendor invoice line items against purchase orders. Enforce strict net-30 terms and capture 2% early payment discounts.",
    authorAgentId: "kevin",
    authorAgentName: "Kevin Malone",
    confidenceScore: 0.96,
    tags: ["finance", "invoicing", "cost-control"],
    createdAt: Date.now() - 3600000 * 12,
  },
  {
    id: "srv-kb-code-1",
    title: "TypeScript Strict Mode & Memory Leak Defense in Node.js",
    category: "coding",
    summary: "Ruflo Coder guidelines for asynchronous promise cleanup and V8 heap stability.",
    content: "Clean up event listeners on unmount. Avoid detached DOM nodes and unbounded in-memory maps in long-running container services.",
    authorAgentId: "ruflo-coder",
    authorAgentName: "Ruflo Coder",
    confidenceScore: 0.98,
    tags: ["coding", "typescript", "memory"],
    createdAt: Date.now() - 3600000 * 8,
  },
  {
    id: "srv-kb-soc-1",
    title: "Cross-Platform Viral Hook Architecture & Retention Curves",
    category: "social_media",
    summary: "Ryan Howard multi-channel social distribution rules for engagement acceleration.",
    content: "Design 3-second visual contrast triggers. Pair thought leadership commentary with actionable bulleted takeaways.",
    authorAgentId: "ryan",
    authorAgentName: "Ryan Howard",
    confidenceScore: 0.95,
    tags: ["social_media", "viral", "growth"],
    createdAt: Date.now() - 3600000 * 4,
  },
];

// Query knowledge entries
knowledgeRouter.get("/", (req, res) => {
  const { query, category, tag } = req.query;
  let results = [...serverKnowledgeStore];

  if (category && category !== "all") {
    results = results.filter((k) => k.category === category);
  }

  if (tag) {
    results = results.filter((k) => k.tags.includes(String(tag)));
  }

  if (query) {
    const q = String(query).toLowerCase();
    results = results.filter(
      (k) =>
        k.title.toLowerCase().includes(q) ||
        k.summary.toLowerCase().includes(q) ||
        k.content.toLowerCase().includes(q) ||
        k.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  res.json({
    success: true,
    count: results.length,
    entries: results,
  });
});

// Learn from completed agent task
knowledgeRouter.post("/learn", (req, res) => {
  try {
    const { agentId, agentName, taskTitle, taskOutput, category = "coding" } = req.body;
    if (!taskTitle || !taskOutput) {
      return res.status(400).json({ success: false, error: "Missing taskTitle or taskOutput" });
    }

    const cleanOutput = String(taskOutput).replace(/```[\s\S]*?```/g, "").trim();
    const firstSentence = cleanOutput.split(".")[0] || taskTitle;
    const summary = firstSentence.length > 150 ? firstSentence.slice(0, 150) + "..." : firstSentence;

    const newKnowledge: ServerKnowledgeItem = {
      id: `srv-learned-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: `${agentName || "Agent"}: ${taskTitle.slice(0, 45)}`,
      category: category as any,
      summary: `Continuous agent synthesis: ${summary}`,
      content: cleanOutput.slice(0, 800),
      authorAgentId: agentId || "agent-core",
      authorAgentName: agentName || "Autonomous Worker",
      confidenceScore: 0.94,
      tags: [category, "agent-learned", "live-mission"],
      createdAt: Date.now(),
    };

    serverKnowledgeStore.unshift(newKnowledge);

    res.json({
      success: true,
      entry: newKnowledge,
      totalEntries: serverKnowledgeStore.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
