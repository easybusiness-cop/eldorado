export class BrowserPolicy {
  private static allowedProtocols = ['http:', 'https:'];
  private static blockedPatterns = [
    /file:\/\//i,
    /localhost/i,
    /127\.0\.0\.1/i,
    /0\.0\.0\.0/i,
    /metadata\.google\.internal/i, // Prevent SSRF to cloud metadata
    /169\.254\.169\.254/i,
  ];

  public static validateURL(urlString: string): { allowed: boolean; reason?: string } {
    try {
      const url = new URL(urlString);
      if (!this.allowedProtocols.includes(url.protocol)) {
        return { allowed: false, reason: `Protocol ${url.protocol} is not supported.` };
      }

      for (const pattern of this.blockedPatterns) {
        if (pattern.test(url.hostname) || pattern.test(urlString)) {
          return { allowed: false, reason: 'Target URL is blocked by strict workspace security policies.' };
        }
      }

      return { allowed: true };
    } catch {
      return { allowed: false, reason: 'Invalid URL format.' };
    }
  }
}
