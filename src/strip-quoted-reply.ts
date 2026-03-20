export function stripQuotedReply(text: string): string {
  const lines = text.split('\n');

  let end = lines.length - 1;
  while (end >= 0 && lines[end].trim() === '') {
    end--;
  }

  if (end < 0) {
    return '';
  }

  let quoteStart = end;
  while (quoteStart >= 0 && lines[quoteStart].startsWith('>')) {
    quoteStart--;
  }

  if (quoteStart === end) {
    return text;
  }

  if (quoteStart >= 0 && /^.{0,200}:\s*$/.test(lines[quoteStart])) {
    quoteStart--;
  }

  const kept = lines.slice(0, quoteStart + 1).join('\n');
  return kept.replace(/\s+$/, '');
}
