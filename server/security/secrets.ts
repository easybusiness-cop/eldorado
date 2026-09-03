export class SecuritySecretService {
  private static readonly REDACT_PATTERNS = [
    /ghp_[a-zA-Z0-9]{30,40}/gi, // GitHub Personal Access Tokens
    /sk_live_[a-zA-Z0-9]{24,34}/gi, // Stripe Live API keys
    /AIza[0-9A-Za-z-_]{35}/gi, // Google API keys
    /Bearer\s+[a-zA-Z0-9_\-\.]{20,}/gi, // Bearer auth tokens
  ];

  public static redact(content: string): string {
    let sanitized = content;
    for (const pattern of this.REDACT_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[REDACTED_SECURITY_GATEWAY]');
    }
    return sanitized;
  }
}

export class SecurityAuthorizationService {
  public static isSuperAdmin(role: string): boolean {
    return role === 'admin' || role === 'executive';
  }
}
