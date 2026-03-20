import { describe, expect, it } from 'vite-plus/test';

import { parseListHeaders } from './list-headers.ts';
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

describe('parseListHeaders', () => {
  it('parses list-id with angle brackets', () => {
    const result = parseListHeaders(stub({ 'list-id': '<news.example.com>' }));
    expect(result.listId).toBe('news.example.com');
  });

  it('returns undefined for missing headers', () => {
    const result = parseListHeaders(stub({}));
    expect(result.listId).toBeUndefined();
    expect(result.unsubscribe).toEqual([]);
    expect(result.post).toBeUndefined();
    expect(result.archive).toBeUndefined();
  });

  it('parses comma-separated unsubscribe URLs', () => {
    const result = parseListHeaders(
      stub({
        'list-unsubscribe':
          '<mailto:unsub@example.com>, <https://example.com/unsub>',
      })
    );
    expect(result.unsubscribe).toEqual([
      'mailto:unsub@example.com',
      'https://example.com/unsub',
    ]);
  });

  it('parses post and archive headers', () => {
    const result = parseListHeaders(
      stub({
        'list-post': '<mailto:list@example.com>',
        'list-archive': '<https://example.com/archive>',
      })
    );
    expect(result.post).toBe('mailto:list@example.com');
    expect(result.archive).toBe('https://example.com/archive');
  });

  it('handles list-id without angle brackets', () => {
    const result = parseListHeaders(stub({ 'list-id': 'news.example.com' }));
    expect(result.listId).toBe('news.example.com');
  });
});
