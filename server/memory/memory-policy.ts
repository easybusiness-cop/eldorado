export class MemoryPolicy {
  public static readonly nonReusableMemoryTags = [
    'model-response',
    'execution-unverified',
    'not-executed',
  ] as const;

  public static sanitizeContent(content: string): string {
    let clean = content;
    
    clean = clean.replace(/\b(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{30,}\b/g, '[REDACTED_GITHUB_TOKEN]');
    clean = clean.replace(/\bgithub_pat_[a-zA-Z0-9_]{30,}\b/g, '[REDACTED_GITHUB_TOKEN]');
    clean = clean.replace(/\bsk-[a-zA-Z0-9_-]{20,}\b/g, '[REDACTED_API_KEY]');
    clean = clean.replace(/\bAIza[0-9A-Za-z_-]{30,}\b/g, '[REDACTED_API_KEY]');
    clean = clean.replace(/\bBearer\s+[a-zA-Z0-9._~+/-]+=*/gi, 'Bearer [REDACTED]');
    clean = clean.replace(/\b(password|passwd|secret|api[_-]?key|access[_-]?token)\b\s*[:=]\s*["']?[^\s"',;]+["']?/gi, '$1=[REDACTED]');

    return clean;
  }

  public static canShareMemory(fromScope: string, toScope: string): boolean {
    // Prevent private episodic memories leaking to company scope directly without audit
    if (fromScope === 'episodic' && toScope === 'company') {
      return false;
    }
    return true;
  }
}
