import type { Email } from '../parse.ts';

export function isReply(email: Email): boolean {
  return email.inReplyTo !== undefined || email.references.length > 0;
}

export function threadId(email: Email): string | undefined {
  if (email.references.length > 0) {
    return email.references[0];
  }
  return email.inReplyTo ?? undefined;
}
