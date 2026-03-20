import { describe, expect, it } from 'vite-plus/test';

import type { Email } from './parse.ts';
import { quote } from './quote.ts';

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

describe('quote', () => {
  it('prefixes each line with >', () => {
    expect(quote(stub({ text: 'Hello\nWorld' }))).toBe('> Hello\n> World');
  });

  it('uses bare > for empty lines', () => {
    expect(quote(stub({ text: 'Hello\n\nWorld' }))).toBe('> Hello\n>\n> World');
  });

  it('falls back to html when text is missing', () => {
    expect(quote(stub({ html: '<p>Hello</p>' }))).toContain('> Hello');
  });

  it('returns bare > for empty email', () => {
    expect(quote(stub())).toBe('>');
  });

  it('truncates to maxLines', () => {
    const text = 'Line 1\nLine 2\nLine 3\nLine 4';
    expect(quote(stub({ text }), 2)).toBe('> Line 1\n> Line 2');
  });

  it('prefers text over html', () => {
    const result = quote(stub({ text: 'plain', html: '<p>html</p>' }));
    expect(result).toBe('> plain');
  });
});
