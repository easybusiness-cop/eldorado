import type { MastraToolDefinition } from './index.ts';
import { BrowserTester } from '../../../agents/capabilities/coding/browser-tester.ts';
import { digitalIdentityService } from '../../../identity/digital-identity.service.ts';

const SECURITY_AGENT_ID = 'dwight';
const BROWSER_INSPECTION_PERMISSION = 'browser:inspect';

function requireTargetUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 4096) {
    throw new Error('url must contain 1 to 4096 characters.');
  }
  return value.trim();
}

export const browserInspectionTools: MastraToolDefinition[] = [
  {
    name: 'browser.inspect_authorized_page',
    description:
      'Run a passive inspection on an explicitly authorized origin. Reports status, title, visible interaction labels, and observations about security headers, response cookie flags, mixed content, and form configuration. Uses a fresh unauthenticated Chromium context, only GET/HEAD requests, and exact origins configured in RUFFLO_BROWSER_ALLOWED_ORIGINS. Does not click, submit forms, open WebSockets, download files, or reuse browser storage. Findings require human validation and do not prove exploitability; configure only origins whose GET routes are safe to visit.',
    category: 'security',
    requiresAuth: true,
    requiredPermission: BROWSER_INSPECTION_PERMISSION,
    execute: async (params, context) => {
      if (!context.orgId?.trim()) {
        throw new Error('Authenticated organization context is required for browser inspection.');
      }
      if (context.agentId.trim().toLowerCase() !== SECURITY_AGENT_ID) {
        throw new Error('Only the designated security agent can run browser inspection.');
      }
      if (
        !(await digitalIdentityService.hasPermission(
          context.orgId,
          context.agentId,
          BROWSER_INSPECTION_PERMISSION,
        ))
      ) {
        throw new Error(`The security agent must be granted ${BROWSER_INSPECTION_PERMISSION} permission first.`);
      }

      const url = requireTargetUrl(params?.url);
      return BrowserTester.inspectPage(url);
    },
  },
];
