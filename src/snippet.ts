import type { Email } from './parse.ts';
import { textFromHtml } from './text-from-html.ts';

export function snippet(email: Email, maxLength = 200): string {
  const raw = email.text ?? (email.html ? textFromHtml(email.html) : '');
  const collapsed = raw.replace(/\s+/g, ' ').trim();
  if (collapsed.length <= maxLength) {
    return collapsed;
  }
  const cut = collapsed.lastIndexOf(' ', maxLength);
  const end = cut > 0 ? cut : maxLength;
  return collapsed.slice(0, end) + '...';
}
