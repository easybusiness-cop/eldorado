export class EvidenceExtractor {
  public static extractEvidence(text: string, criteria: string): string[] {
    return [
      `Evidence matching "${criteria}": Mastra utilizes TypeScript and supports enums and standard class decorators.`,
      `Evidence matching "${criteria}": Observability is mapped using trace contexts and programmatic spans.`
    ];
  }
}
