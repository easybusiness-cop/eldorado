import { QueryPlanner } from './query-planner.ts';
import { SourceDiscovery } from './source-discovery.ts';
import { SourceReader } from './source-reader.ts';
import { EvidenceExtractor } from './evidence-extractor.ts';
import { ContradictionChecker } from './contradiction-checker.ts';
import { CitationBuilder } from './citation-builder.ts';
import { ResearchMemory } from './research-memory.ts';

export class ResearchAgent {
  private reader = new SourceReader();

  public async conductResearch(topic: string): Promise<any> {
    const trace: string[] = [];
    trace.push(`START: Research initiated for topic: ${topic}`);

    // 1. Break into subquestions
    const queries = QueryPlanner.planQueries(topic);
    trace.push(`PLAN: Generated queries: ${queries.join(', ')}`);

    // 2. Discover sources
    const sources = await SourceDiscovery.discoverSources(queries);
    trace.push(`DISCOVER: Found ${sources.length} sources.`);

    // 3. Read sources and extract evidence
    const findings: string[] = [];
    const citations: string[] = [];

    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      const text = await this.reader.readSource(src.url);
      const evidence = EvidenceExtractor.extractEvidence(text, topic);
      findings.push(...evidence);
      citations.push(CitationBuilder.buildCitation(i + 1, src.url, src.title));
    }
    trace.push('EXTRACT: Collected evidence and findings from documents.');

    // 4. Cross-check
    const contradictions = ContradictionChecker.detectContradictions(findings);
    if (contradictions.hasContradictions) {
      trace.push('WARN: Detected logical contradictions across sources.');
    } else {
      trace.push('VERIFY: Logical cross-checking completed with no violations.');
    }

    // 5. Save session
    const session = {
      topic,
      findings,
      citations,
      timestamp: new Date().toISOString(),
    };
    ResearchMemory.saveSession(session);
    trace.push('SAVE: Findings cataloged into long-term ResearchMemory.');

    return {
      success: true,
      topic,
      trace,
      findings,
      citations,
    };
  }
}
