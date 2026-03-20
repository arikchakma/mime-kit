import type { Email } from './parse.ts';

export function readReceipt(email: Email): string | undefined {
  const raw = email.headers.get('disposition-notification-to');
  if (!raw) {
    return undefined;
  }
  const match = raw.match(/<([^>]+)>/);
  if (match) {
    return match[1];
  }
  return raw.trim();
}
