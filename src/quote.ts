import { textFromHtml } from './html/text-from-html.ts';
import type { Email } from './parse.ts';

export function quote(email: Email, maxLines?: number): string {
  const raw = email.text ?? (email.html ? textFromHtml(email.html) : '');
  let lines = raw.split('\n');
  if (maxLines !== undefined) {
    lines = lines.slice(0, maxLines);
  }
  return lines.map((line) => (line === '' ? '>' : `> ${line}`)).join('\n');
}
