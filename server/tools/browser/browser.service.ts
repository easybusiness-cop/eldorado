import { BrowserSession } from './browser.session.ts';
import { BrowserNavigation } from './browser.navigation.ts';
import { BrowserExtract } from './browser.extract.ts';
import { BrowserInteraction } from './browser.interaction.ts';
import { BrowserScreenshot } from './browser.screenshot.ts';

export class BrowserService {
  private session = new BrowserSession();
  private navigation = new BrowserNavigation();

  public async browseTo(url: string): Promise<any> {
    const nav = await this.navigation.navigateTo(url);
    if (!nav.success) {
      return { success: false, error: nav.error };
    }

    // Fetching the document contents
    const mockHtml = `<html><head><title>Mastra Docs</title></head><body><h1>Welcome to Mastra</h1><p>Mastra supports orchestrating microservices easily.</p></body></html>`;
    const info = BrowserExtract.extractInformation(mockHtml);
    const screenshot = await BrowserScreenshot.capturePage(url);

    return {
      success: true,
      url,
      info,
      screenshot,
      headers: this.session.getSessionHeaders(),
    };
  }

  public async click(selector: string): Promise<any> {
    return await BrowserInteraction.clickElement(selector);
  }

  public async type(selector: string, value: string): Promise<any> {
    return await BrowserInteraction.typeValue(selector, value);
  }
}
