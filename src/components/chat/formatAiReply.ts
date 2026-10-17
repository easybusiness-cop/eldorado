function formatLabel(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatJsonValue(value: unknown, key?: string, depth = 0): string {
  const indent = '  '.repeat(depth);
  const label = key ? formatLabel(key) : '';

  if (value === null || typeof value !== 'object') {
    const text = typeof value === 'string' ? value.trim() : String(value);
    if (key && /(?:code|snippet)/i.test(key)) {
      return `${indent}**${label}:**\n\n${indent}\`\`\`\n${text}\n${indent}\`\`\``;
    }
    return key ? `${indent}**${label}:** ${text}` : `${indent}${text}`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return key ? `${indent}**${label}:** None` : '';
    const items = value.map((item) => {
      if (item !== null && typeof item === 'object') {
        const entries = Object.entries(item as Record<string, unknown>);
        const titleEntry = entries.find(([entryKey]) => /^(title|name|step|role|agent)$/i.test(entryKey));
        const title = titleEntry ? `**${String(titleEntry[1])}**` : '';
        const details = entries
          .filter(([entryKey]) => entryKey !== titleEntry?.[0])
          .map(([entryKey, entryValue]) => formatJsonValue(entryValue, entryKey, depth + 1))
          .filter(Boolean)
          .join('\n');
        return `${indent}- ${title}${title && details ? '\n' : ''}${details}`;
      }
      return `${indent}- ${formatJsonValue(item, undefined, depth + 1).trim()}`;
    });
    return `${key ? `${indent}**${label}:**\n` : ''}${items.join('\n')}`;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return key ? `${indent}**${label}:** None` : '';
  return entries
    .map(([entryKey, entryValue]) => formatJsonValue(entryValue, entryKey, depth))
    .join('\n\n');
}

export function formatAiReply(content: string): string {
  const normalized = content.replace(/\r\n?/g, '\n').trim();

  if (!normalized || normalized.includes('```')) return normalized;

  if (/^[{[]/.test(normalized)) {
    try {
      const parsed: unknown = JSON.parse(normalized);
      if (parsed !== null && typeof parsed === 'object') {
        return formatJsonValue(parsed);
      }
    } catch {
      // Keep incomplete or invalid JSON as model-provided text.
    }
  }

  const readable = normalized.replace(/(?<!\\)\\n/g, '\n');
  return readable
    .replace(/^(?:#{1,6}\s*)?(answer|summary|result|conclusion|recommendations|next steps)\s*:\s*$/gim, '## $1')
    .replace(/([.!?])\s+(?=(?:[-*]\s|\d+[.)]\s))/g, '$1\n\n')
    .replace(/(?<!  )\n(?!\n|[ \t]*(?:#{1,6}\s|[-*]\s|\d+[.)]\s|>|```|---))/g, '  \n');
}
