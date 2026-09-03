import { BrowserPolicy } from './browser.policy.ts';

export class BrowserNavigation {
  private history: string[] = [];
  private index = -1;

  public async navigateTo(url: string): Promise<{ success: boolean; url: string; error?: string }> {
    const check = BrowserPolicy.validateURL(url);
    if (!check.allowed) {
      return { success: false, url, error: check.reason };
    }

    this.history.push(url);
    this.index = this.history.length - 1;
    return { success: true, url };
  }

  public getHistory(): string[] {
    return this.history;
  }
}
