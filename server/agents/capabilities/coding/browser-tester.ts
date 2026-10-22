import { chromium, type Browser, type Page } from 'playwright';

const NAVIGATION_TIMEOUT_MS = 15_000;
const MAX_REQUESTS_PER_RUN = 150;
const MAX_INTERACTIVE_ELEMENTS = 50;
const MAX_LABEL_LENGTH = 120;
const SENSITIVE_QUERY_KEY = /(?:token|secret|password|auth|session|signature|credential|api[_-]?key|code|state|nonce|ticket|jwt|cookie)/i;
const ALLOWED_ORIGIN_ENV = 'RUFFLO_BROWSER_ALLOWED_ORIGINS';

export interface BrowserTestResult {
  assessment: 'passive';
  limitations: string[];
  url: string;
  statusCode: number;
  title: string;
  screenshotUrl?: string;
  interactiveElements: string[];
  checkedAt: string;
  requestCount: number;
  blockedRequestCount: number;
  blockedWebSocketCount: number;
  findings: BrowserSecurityFinding[];
}

export interface BrowserSecurityFinding {
  id: string;
  severity: 'info' | 'low' | 'medium';
  title: string;
  evidence: string[];
  recommendation: string;
}

interface PageSurfaceObservations {
  mixedActiveContentCount: number;
  mixedPassiveContentCount: number;
  externalResourceCount: number;
  insecureFormActionCount: number;
  crossOriginFormCount: number;
  getPasswordFormCount: number;
}

/**
 * Non-interactive Chromium inspection for operator-authorized web origins.
 *
 * Navigation uses real Playwright execution. The target and every subsequent
 * request must match the explicit,
 * operator-managed RUFFLO_BROWSER_ALLOWED_ORIGINS list. No cookies or storage
 * state are loaded, and only GET/HEAD requests are allowed.
 */
export class BrowserTester {
  public static async inspectPage(url: string): Promise<BrowserTestResult> {
    const allowedOrigins = this.getAllowedOrigins();
    const target = this.parseWebUrl(url);

    if (!allowedOrigins.has(target.origin)) {
      throw new Error(`Browser navigation is outside the configured authorized-origin scope: ${target.origin}`);
    }

    let browser: Browser | undefined;
    let page: Page | undefined;
    let requestCount = 0;
    let blockedRequestCount = 0;
    let blockedWebSocketCount = 0;

    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        acceptDownloads: false,
        serviceWorkers: 'block',
        viewport: { width: 1280, height: 800 },
      });
      page = await context.newPage();
      page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);
      page.setDefaultTimeout(5_000);

      await page.route('**/*', async (route) => {
        const request = route.request();
        requestCount += 1;

        let requestUrl: URL;
        try {
          requestUrl = this.parseWebUrl(request.url());
        } catch {
          blockedRequestCount += 1;
          await route.abort('blockedbyclient');
          return;
        }

        if (
          requestCount > MAX_REQUESTS_PER_RUN ||
          !allowedOrigins.has(requestUrl.origin) ||
          !['GET', 'HEAD'].includes(request.method().toUpperCase())
        ) {
          blockedRequestCount += 1;
          await route.abort('blockedbyclient');
          return;
        }

        await route.continue();
      });
      await page.routeWebSocket('**/*', async (socket) => {
        blockedWebSocketCount += 1;
        await socket.close({ code: 1000, reason: 'WebSocket connections are disabled for browser inspection.' });
      });

      page.on('popup', (popup) => {
        void popup.close().catch(() => undefined);
      });
      page.on('download', (download) => {
        void download.cancel().catch(() => undefined);
      });

      const response = await page.goto(target.toString(), {
        waitUntil: 'domcontentloaded',
        timeout: NAVIGATION_TIMEOUT_MS,
      });

      const finalUrl = this.parseWebUrl(page.url());
      if (!allowedOrigins.has(finalUrl.origin)) {
        throw new Error('Browser navigation ended outside the configured authorized-origin scope.');
      }

      const title = (await page.title()).slice(0, 300);
      const interactiveElements = await this.inspectInteractiveElements(page);
      const responseHeaders = response ? await response.headersArray() : [];
      const pageSurface = await this.inspectPageSurface(page);

      return {
        assessment: 'passive',
        limitations: [
          'Inspection is unauthenticated and limited to the configured origins.',
          'Only GET/HEAD requests are allowed; forms and controls are not submitted.',
          'Findings are configuration observations and do not prove exploitability.',
        ],
        url: this.redactUrl(finalUrl),
        statusCode: response?.status() ?? 0,
        title,
        interactiveElements,
        checkedAt: new Date().toISOString(),
        requestCount,
        blockedRequestCount,
        blockedWebSocketCount,
        findings: this.buildFindings(finalUrl, responseHeaders, pageSurface),
      };
    } catch {
      throw new Error('Playwright browser inspection failed. Check Chromium availability and the authorized origin.');
    } finally {
      await page?.context().close().catch(() => undefined);
      await browser?.close().catch(() => undefined);
    }
  }

  private static getAllowedOrigins(): Set<string> {
    const configured = process.env[ALLOWED_ORIGIN_ENV]?.trim();
    if (!configured) {
      throw new Error(
        `${ALLOWED_ORIGIN_ENV} must list the exact authorized web origins before browser inspection can run.`,
      );
    }

    const origins = new Set<string>();
    for (const value of configured.split(',')) {
      const entry = value.trim();
      if (!entry) continue;

      let origin: URL;
      try {
        origin = new URL(entry);
      } catch {
        throw new Error(`${ALLOWED_ORIGIN_ENV} contains an invalid origin.`);
      }

      if (
        !['http:', 'https:'].includes(origin.protocol) ||
        origin.hostname.includes('*') ||
        origin.username ||
        origin.password ||
        origin.pathname !== '/' ||
        origin.search ||
        origin.hash
      ) {
        throw new Error(`${ALLOWED_ORIGIN_ENV} entries must be exact HTTP(S) origins without paths or credentials.`);
      }

      origins.add(origin.origin);
    }

    if (origins.size === 0) {
      throw new Error(`${ALLOWED_ORIGIN_ENV} must contain at least one exact authorized origin.`);
    }

    return origins;
  }

  private static parseWebUrl(value: string): URL {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error('A valid absolute HTTP(S) URL is required.');
    }

    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      throw new Error('Only HTTP(S) URLs without embedded credentials can be inspected.');
    }

    return url;
  }

  private static async inspectInteractiveElements(page: Page): Promise<string[]> {
    return page
      .locator('a[href],button,input,select,textarea,[role="button"],[tabindex]:not([tabindex="-1"])')
      .evaluateAll((elements, limits) =>
        elements
          .filter((element) => {
            const htmlElement = element as HTMLElement;
            return htmlElement.getClientRects().length > 0 && htmlElement.getAttribute('aria-hidden') !== 'true';
          })
          .slice(0, limits.maxElements)
          .map((element) => {
            const htmlElement = element as HTMLElement;
            const tag = htmlElement.tagName.toLowerCase();
            const type = htmlElement.getAttribute('type');
            const id = htmlElement.id;
            const label =
              htmlElement.getAttribute('aria-label') ||
              htmlElement.getAttribute('title') ||
              (['button', 'a'].includes(tag) ? htmlElement.innerText : '') ||
              '';
            const compactLabel = label.replace(/\s+/g, ' ').trim().slice(0, limits.maxLabelLength);
            return [tag, type ? `type=${type}` : '', id ? `id=${id.slice(0, 80)}` : '', compactLabel]
              .filter(Boolean)
              .join(' ');
          }),
      { maxElements: MAX_INTERACTIVE_ELEMENTS, maxLabelLength: MAX_LABEL_LENGTH });
  }

  private static async inspectPageSurface(page: Page): Promise<PageSurfaceObservations> {
    return page.evaluate(() => {
      const resourceSelector = [
        'script[src]',
        'iframe[src]',
        'img[src]',
        'video[src]',
        'audio[src]',
        'source[src]',
        'link[rel~="stylesheet"][href]',
        'link[rel~="preload"][href]',
      ].join(',');
      const resources = Array.from(document.querySelectorAll(resourceSelector));
      let mixedActiveContentCount = 0;
      let mixedPassiveContentCount = 0;
      let externalResourceCount = 0;

      for (const resource of resources) {
        const rawUrl = resource.getAttribute('src') || resource.getAttribute('href');
        if (!rawUrl) continue;

        try {
          const resourceUrl = new URL(rawUrl, location.href);
          if (resourceUrl.origin !== location.origin) externalResourceCount += 1;
          if (location.protocol === 'https:' && resourceUrl.protocol === 'http:') {
            const tag = resource.tagName.toLowerCase();
            if (['script', 'iframe'].includes(tag) || (tag === 'link' && resource.getAttribute('rel')?.includes('stylesheet'))) {
              mixedActiveContentCount += 1;
            } else {
              mixedPassiveContentCount += 1;
            }
          }
        } catch {
          // Ignore malformed resource references; they are not fetched by this inspection.
        }
      }

      let insecureFormActionCount = 0;
      let crossOriginFormCount = 0;
      let getPasswordFormCount = 0;
      for (const form of Array.from(document.forms)) {
        try {
          const action = new URL(form.action || location.href, location.href);
          if (location.protocol === 'https:' && action.protocol === 'http:') insecureFormActionCount += 1;
          if (action.origin !== location.origin) crossOriginFormCount += 1;
          const method = (form.getAttribute('method') || 'get').toLowerCase();
          const hasPasswordField = Boolean(form.querySelector(
            'input[type="password"],input[autocomplete="current-password"],input[autocomplete="new-password"]',
          ));
          if (method === 'get' && hasPasswordField) getPasswordFormCount += 1;
        } catch {
          // Ignore malformed form actions; never submit or interact with forms.
        }
      }

      return {
        mixedActiveContentCount,
        mixedPassiveContentCount,
        externalResourceCount,
        insecureFormActionCount,
        crossOriginFormCount,
        getPasswordFormCount,
      };
    });
  }

  private static buildFindings(
    url: URL,
    headers: Array<{ name: string; value: string }>,
    surface: PageSurfaceObservations,
  ): BrowserSecurityFinding[] {
    const findings: BrowserSecurityFinding[] = [];
    const values = (name: string) => headers
      .filter((header) => header.name.toLowerCase() === name.toLowerCase())
      .map((header) => header.value);
    const first = (name: string) => values(name)[0];

    const add = (
      id: string,
      severity: BrowserSecurityFinding['severity'],
      title: string,
      evidence: string[],
      recommendation: string,
    ) => findings.push({ id, severity, title, evidence, recommendation });

    if (url.protocol !== 'https:') {
      add(
        'transport-http',
        'medium',
        'Page uses unencrypted HTTP',
        ['The inspected page URL uses HTTP. No credentials or form data were submitted.'],
        'Serve the page over HTTPS and redirect HTTP requests to HTTPS.',
      );
    } else {
      const hsts = first('strict-transport-security');
      const maxAge = hsts?.match(/(?:^|;)\s*max-age\s*=\s*(\d+)/i)?.[1];
      if (!hsts || !maxAge || Number(maxAge) === 0) {
        add(
          'header-hsts',
          'low',
          'HSTS is missing or inactive',
          ['The HTTPS response does not declare a positive Strict-Transport-Security max-age.'],
          'Set a positive HSTS max-age after confirming HTTPS works across the intended host scope.',
        );
      }
    }

    if (!first('content-security-policy')) {
      add(
        'header-csp',
        'low',
        'Content Security Policy is absent',
        ['The inspected document response has no Content-Security-Policy header.'],
        'Define a restrictive Content-Security-Policy that matches the application’s required scripts, styles, and framing behavior.',
      );
    }

    const contentTypeOptions = first('x-content-type-options');
    if (contentTypeOptions?.toLowerCase().trim() !== 'nosniff') {
      add(
        'header-content-type-options',
        'low',
        'MIME sniffing protection is absent',
        ['The inspected response does not set X-Content-Type-Options: nosniff.'],
        'Set X-Content-Type-Options to nosniff and return accurate Content-Type headers.',
      );
    }

    if (!first('referrer-policy')) {
      add(
        'header-referrer-policy',
        'info',
        'Referrer-Policy is not explicit',
        ['The inspected response does not set a Referrer-Policy header.'],
        'Set an explicit policy such as strict-origin-when-cross-origin, adjusted for application requirements.',
      );
    }

    const cspValues = values('content-security-policy').join(';');
    const hasFrameAncestors = /(?:^|;)\s*frame-ancestors\b/i.test(cspValues);
    if (!hasFrameAncestors && !first('x-frame-options')) {
      add(
        'header-framing-policy',
        'low',
        'Framing protection is absent',
        ['Neither CSP frame-ancestors nor X-Frame-Options was present on the inspected response.'],
        'Set CSP frame-ancestors or X-Frame-Options if the page should not be embedded by other sites.',
      );
    }

    const setCookies = values('set-cookie');
    if (url.protocol === 'https:' && setCookies.length > 0) {
      let missingSecure = 0;
      let missingHttpOnly = 0;
      let missingSameSite = 0;
      for (const cookie of setCookies) {
        const attributes = cookie.split(';').slice(1).map((attribute) => attribute.trim().toLowerCase());
        if (!attributes.some((attribute) => attribute === 'secure')) missingSecure += 1;
        if (!attributes.some((attribute) => attribute === 'httponly')) missingHttpOnly += 1;
        if (!attributes.some((attribute) => attribute.startsWith('samesite='))) missingSameSite += 1;
      }
      if (missingSecure || missingHttpOnly || missingSameSite) {
        add(
          'cookie-flags',
          missingSecure ? 'medium' : 'low',
          'One or more response cookies lack recommended security attributes',
          [
            `Set-Cookie headers inspected: ${setCookies.length}; missing Secure: ${missingSecure}; missing HttpOnly: ${missingHttpOnly}; missing SameSite: ${missingSameSite}. Cookie names and values were omitted.`,
          ],
          'Review each cookie’s purpose and set Secure, HttpOnly, and an appropriate SameSite value where applicable.',
        );
      }
    }

    if (surface.mixedActiveContentCount > 0) {
      add(
        'mixed-active-content',
        'medium',
        'HTTPS page references insecure active content',
        [`${surface.mixedActiveContentCount} script, frame, or stylesheet reference(s) use HTTP.`],
        'Serve active resources over HTTPS and remove HTTP resource references.',
      );
    }
    if (surface.mixedPassiveContentCount > 0) {
      add(
        'mixed-passive-content',
        'low',
        'HTTPS page references insecure passive content',
        [`${surface.mixedPassiveContentCount} media or image reference(s) use HTTP.`],
        'Serve all page resources over HTTPS.',
      );
    }
    if (surface.insecureFormActionCount > 0) {
      add(
        'form-action-http',
        'medium',
        'Form action uses unencrypted HTTP',
        [`${surface.insecureFormActionCount} form action(s) on the HTTPS page resolve to HTTP. No form was submitted.`],
        'Change form actions to HTTPS and verify the destination is an intended endpoint.',
      );
    }
    if (surface.getPasswordFormCount > 0) {
      add(
        'form-password-get',
        'medium',
        'Password form uses the GET method',
        [`${surface.getPasswordFormCount} form(s) with a password field use GET. No field values were read or submitted.`],
        'Use POST over HTTPS for password forms and ensure sensitive values never appear in URLs.',
      );
    }
    if (surface.crossOriginFormCount > 0) {
      add(
        'form-cross-origin',
        'info',
        'Page contains cross-origin form destinations',
        [`${surface.crossOriginFormCount} form action(s) target a different origin. Destinations and form data were not accessed.`],
        'Confirm each cross-origin destination is an approved service and uses HTTPS.',
      );
    }
    if (surface.externalResourceCount > 0) {
      add(
        'external-resources',
        'info',
        'Page references resources from other origins',
        [`${surface.externalResourceCount} script, media, frame, or stylesheet reference(s) are cross-origin. The browser only requested configured origins.`],
        'Review third-party resources, minimize their privileges, and include only approved origins in the inspection scope.',
      );
    }

    return findings;
  }

  private static redactUrl(url: URL): string {
    const safeUrl = new URL(url.toString());
    safeUrl.hash = '';
    for (const key of Array.from(safeUrl.searchParams.keys())) {
      if (SENSITIVE_QUERY_KEY.test(key)) safeUrl.searchParams.set(key, '[REDACTED]');
    }
    return safeUrl.toString();
  }
}
