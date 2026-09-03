export class CitationBuilder {
  public static buildCitation(index: number, url: string, title: string): string {
    return `[${index}] "${title}" (Retrieved from: ${url})`;
  }
}
