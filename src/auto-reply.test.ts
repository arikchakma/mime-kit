import { describe, expect, it } from 'vite-plus/test';

import { isAutoReply } from './auto-reply.ts';
import type { Email } from './parse.ts';

function stub(headers: Record<string, string>): Email {
  return {
    from: undefined,
    sender: undefined,
    to: [],
    cc: [],
    bcc: [],
    replyTo: [],
    subject: '',
    messageId: undefined,
    inReplyTo: undefined,
    references: [],
    date: undefined,
    text: undefined,
    html: undefined,
    headers: {
      get: (k: string) => headers[k.toLowerCase()],
      has: (k: string) => k.toLowerCase() in headers,
    } as never,
    attachments: [],
  };
}

describe('isAutoReply', () => {
  it('returns false for normal email', () => {
    expect(isAutoReply(stub({}))).toBe(false);
  });

  it('detects auto-submitted header', () => {
    expect(isAutoReply(stub({ 'auto-submitted': 'auto-replied' }))).toBe(true);
  });

  it('ignores auto-submitted: no', () => {
    expect(isAutoReply(stub({ 'auto-submitted': 'no' }))).toBe(false);
  });

  it('detects x-auto-response-suppress', () => {
    expect(isAutoReply(stub({ 'x-auto-response-suppress': 'OOF' }))).toBe(true);
  });

  it('detects precedence: auto_reply', () => {
    expect(isAutoReply(stub({ precedence: 'auto_reply' }))).toBe(true);
  });

  it('detects precedence: bulk', () => {
    expect(isAutoReply(stub({ precedence: 'bulk' }))).toBe(true);
  });

  it('detects x-autoreply', () => {
    expect(isAutoReply(stub({ 'x-autoreply': 'yes' }))).toBe(true);
  });

  it('detects x-autorespond', () => {
    expect(isAutoReply(stub({ 'x-autorespond': 'yes' }))).toBe(true);
  });
});
