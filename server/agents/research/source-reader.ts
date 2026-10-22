import { browserService } from '../../tools/browser/browser.service.ts';
import { digitalIdentityService } from '../../identity/digital-identity.service.ts';

export class SourceReader {
  public async readSource(url: string, agentId: string, organizationId: string): Promise<string> {
    if (!(await digitalIdentityService.hasPermission(organizationId, agentId, 'browser:persist'))) {
      throw new Error('The agent must receive browser:persist approval before reading sources in its browser workspace.');
    }
    const browseRes = await browserService.browseAsAgent(agentId, url, organizationId);
    if (browseRes.success) {
      return browseRes.info.paragraphs.join('\n');
    }
    return 'Failed to load source paragraph text.';
  }
}
