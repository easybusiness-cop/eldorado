import { BrowserService } from '../../tools/browser/browser.service.ts';

export class SourceReader {
  private browser = new BrowserService();

  public async readSource(url: string): Promise<string> {
    const browseRes = await this.browser.browseTo(url);
    if (browseRes.success) {
      return browseRes.info.paragraphs.join('\n');
    }
    return 'Failed to load source paragraph text.';
  }
}
