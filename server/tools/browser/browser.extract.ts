import * as cheerio from 'cheerio';

export interface ExtractedPageInfo {
  title: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  links: { text: string; href: string }[];
  codeSnippets?: string[];
  meta: Record<string, string>;
  wordCount: number;
}

export class BrowserExtract {
  public static extractInformation(html: string): ExtractedPageInfo {
    try {
      const $ = cheerio.load(html || '');

      $('script, style, noscript, svg, iframe').remove();

      const title =
        $('title').text().trim() ||
        $('meta[property="og:title"]').attr('content')?.trim() ||
        $('h1').first().text().trim() ||
        'Web Page Document';

      const description =
        $('meta[name="description"]').attr('content')?.trim() ||
        $('meta[property="og:description"]').attr('content')?.trim() ||
        '';

      const headings: string[] = [];
      $('h1, h2, h3').each((_, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        if (text && text.length > 2 && text.length < 150) {
          headings.push(text);
        }
      });

      const paragraphs: string[] = [];
      $('p, article, section, li').each((_, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        if (text && text.length > 25 && !paragraphs.includes(text)) {
          paragraphs.push(text);
        }
      });

      const links: { text: string; href: string }[] = [];
      const seenUrls = new Set<string>();
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href')?.trim();
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        if (href && (href.startsWith('http') || href.startsWith('/')) && !seenUrls.has(href)) {
          seenUrls.add(href);
          links.push({
            text: text || href,
            href,
          });
        }
      });

      const codeSnippets: string[] = [];
      $('pre code, pre').each((_, el) => {
        const code = $(el).text().trim();
        if (code && code.length > 10 && code.length < 2000) {
          codeSnippets.push(code);
        }
      });

      const meta: Record<string, string> = {};
      $('meta').each((_, el) => {
        const name = $(el).attr('name') || $(el).attr('property');
        const content = $(el).attr('content');
        if (name && content) {
          meta[name] = content;
        }
      });

      const allText = $('body').text().replace(/\s+/g, ' ').trim();
      const wordCount = allText ? allText.split(' ').length : 0;

      return {
        title,
        description,
        headings: headings.slice(0, 15),
        paragraphs: paragraphs.slice(0, 30),
        links: links.slice(0, 20),
        codeSnippets: codeSnippets.slice(0, 5),
        meta,
        wordCount,
      };
    } catch {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'Web Page Document';
      return {
        title,
        description: '',
        headings: [],
        paragraphs: [html.slice(0, 500)],
        links: [],
        meta: {},
        wordCount: html.split(/\s+/).length,
      };
    }
  }
}
