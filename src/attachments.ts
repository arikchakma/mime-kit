import type { Email, ParsedAttachment } from './parse.ts';

export function hasAttachments(email: Email): boolean {
  return email.attachments.some((a) => a.disposition === 'attachment');
}

export function inlineImages(email: Email): ParsedAttachment[] {
  return email.attachments.filter(
    (a) => a.disposition === 'inline' && a.mimeType.startsWith('image/')
  );
}

export function totalSize(email: Email): number {
  return email.attachments.reduce((sum, a) => sum + a.content.byteLength, 0);
}
