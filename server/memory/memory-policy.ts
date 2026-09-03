export class MemoryPolicy {
  public static sanitizeContent(content: string): string {
    let clean = content;
    
    // Redact API keys and passwords
    clean = clean.replace(/ghp_[a-zA-Z0-9]{36}/g, '[REDACTED_GITHUB_TOKEN]');
    clean = clean.replace(/sk-[a-zA-Z0-9]{48}/g, '[REDACTED_OPENAI_KEY]');
    clean = clean.replace(/(?:password|passwd|secret)\s*=\s*[^\s;]+/gi, 'secret = [REDACTED]');

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
