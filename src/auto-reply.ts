import type { Email } from './parse.ts';

export function isAutoReply(email: Email): boolean {
  const autoSubmitted = email.headers.get('auto-submitted');
  if (autoSubmitted && autoSubmitted.toLowerCase() !== 'no') {
    return true;
  }

  if (email.headers.has('x-auto-response-suppress')) {
    return true;
  }

  const precedence = email.headers.get('precedence')?.toLowerCase();
  if (precedence === 'auto_reply' || precedence === 'bulk') {
    return true;
  }

  if (email.headers.has('x-autoreply') || email.headers.has('x-autorespond')) {
    return true;
  }

  return false;
}
