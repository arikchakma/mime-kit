import { describe, expect, it } from 'vite-plus/test';

import type { Email } from './parse.ts';
import { snippet } from './snippet.ts';

function stub(overrides: Partial<Email> = {}): Email {
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
    headers: { get: () => undefined } as never,
    attachments: [],
    ...overrides,
  };
}

describe('snippet', () => {
  it('returns text content collapsed to single line', () => {
    expect(snippet(stub({ text: 'Hello\n  world\n' }))).toBe('Hello world');
  });

  it('falls back to html when text is missing', () => {
    expect(snippet(stub({ html: '<p>Hello <b>world</b></p>' }))).toBe(
      'Hello world'
    );
  });

  it('returns empty string when no content', () => {
    expect(snippet(stub())).toBe('');
  });

  it('truncates at word boundary with ellipsis', () => {
    const text = 'word '.repeat(100);
    const result = snippet(stub({ text }), 20);
    expect(result.length).toBeLessThanOrEqual(23); // 20 + '...'
    expect(result).toMatch(/\.\.\.$/);
  });

  it('prefers text over html', () => {
    expect(snippet(stub({ text: 'plain', html: '<p>html</p>' }))).toBe('plain');
  });

  it('respects custom maxLength', () => {
    const result = snippet(stub({ text: 'short' }), 10);
    expect(result).toBe('short');
  });
});
