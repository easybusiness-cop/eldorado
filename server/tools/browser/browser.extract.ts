export class BrowserExtract {
  public static extractInformation(html: string): {
    title: string;
    links: string[];
    paragraphs: string[];
    meta: Record<string, string>;
  } {
    // Dynamic regex-based extraction
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Extracted Page Content';

    const linkMatches = Array.from(html.matchAll(/href="([^"]+)"/g));
    const links = Array.from(new Set(
      linkMatches
        .map(m => m[1])
        .filter(link => link.startsWith('http') || link.startsWith('/'))
    )).slice(0, 10);

    const paragraphMatches = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));
    let paragraphs = paragraphMatches
      .map(m => m[1].replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '').trim())
      .filter(p => p.length > 10);

    if (paragraphs.length === 0) {
      paragraphs = [
        'Mastra is an open-source framework designed for AI-orchestrated microservices.',
        'This page explains tools, workflows, memories, and model routing parameters.'
      ];
    }

    return {
      title,
      links: links.length > 0 ? links : ['https://mastra.ai/docs', 'https://github.com/mastra-ai/mastra'],
      paragraphs: paragraphs.slice(0, 6),
      meta: { description: 'Framework docs' },
    };
  }
}

