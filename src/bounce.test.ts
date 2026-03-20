import { describe, expect, it } from 'vite-plus/test';

import { isBounce } from './bounce.ts';
import type { Email } from './parse.ts';

function stub(
  headers: Record<string, string>,
  overrides: Partial<Email> = {}
): Email {
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
    ...overrides,
  };
}

describe('isBounce', () => {
  it('returns false for normal email', () => {
    expect(isBounce(stub({}))).toBe(false);
  });

  it('detects multipart/report content-type', () => {
    expect(
      isBounce(
        stub({
          'content-type': 'multipart/report; report-type=delivery-status',
        })
      )
    ).toBe(true);
  });

  it('detects empty return-path', () => {
    expect(isBounce(stub({ 'return-path': '<>' }))).toBe(true);
  });

  it('detects mailer-daemon from address', () => {
    expect(
      isBounce(
        stub({}, { from: { name: '', address: 'MAILER-DAEMON@example.com' } })
      )
    ).toBe(true);
  });
});
