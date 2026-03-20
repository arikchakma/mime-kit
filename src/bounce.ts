import type { Email } from './parse.ts';

export function isBounce(email: Email): boolean {
  const ct = email.headers.get('content-type') ?? '';
  if (ct.includes('multipart/report')) {
    return true;
  }

  const rp = email.headers.get('return-path') ?? '';
  if (rp === '<>') {
    return true;
  }

  const from = email.from?.address ?? '';
  if (from.toLowerCase().startsWith('mailer-daemon@')) {
    return true;
  }

  return false;
}
