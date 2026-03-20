import { describe, expect, it } from 'vite-plus/test';

import type { Email } from './parse.ts';
import { readReceipt } from './read-receipt.ts';

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

describe('readReceipt', () => {
  it('returns undefined when header missing', () => {
    expect(readReceipt(stub({}))).toBeUndefined();
  });

  it('extracts address from angle brackets', () => {
    expect(
      readReceipt(
        stub({ 'disposition-notification-to': '"Alice" <alice@example.com>' })
      )
    ).toBe('alice@example.com');
  });

  it('returns bare address as-is', () => {
    expect(
      readReceipt(stub({ 'disposition-notification-to': 'bob@example.com' }))
    ).toBe('bob@example.com');
  });

  it('trims whitespace from bare address', () => {
    expect(
      readReceipt(
        stub({ 'disposition-notification-to': ' carol@example.com ' })
      )
    ).toBe('carol@example.com');
  });
});
