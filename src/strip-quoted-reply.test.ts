import { describe, expect, it } from 'vite-plus/test';

import { stripQuotedReply } from './strip-quoted-reply.ts';

describe('stripQuotedReply', () => {
  it('returns text unchanged when no quoted block', () => {
    expect(stripQuotedReply('Hello there')).toBe('Hello there');
  });

  it('strips trailing quoted lines', () => {
    const text = 'My reply\n\n> quoted line 1\n> quoted line 2';
    expect(stripQuotedReply(text)).toBe('My reply');
  });

  it('strips attribution line before quoted block', () => {
    const text = 'Thanks!\n\nOn Mon, Jan 1, Alice wrote:\n> original';
    expect(stripQuotedReply(text)).toBe('Thanks!');
  });

  it('ignores interleaved quotes', () => {
    const text = '> first quote\n\nmy reply\n\n> trailing quote';
    expect(stripQuotedReply(text)).toBe('> first quote\n\nmy reply');
  });

  it('handles trailing blank lines after quotes', () => {
    const text = 'reply\n\n> quoted\n\n  \n';
    expect(stripQuotedReply(text)).toBe('reply');
  });

  it('returns empty string for all-quoted text', () => {
    expect(stripQuotedReply('> everything is quoted')).toBe('');
  });

  it('returns empty for blank input', () => {
    expect(stripQuotedReply('')).toBe('');
  });

  it('does not treat long lines as attribution', () => {
    const longLine = 'a'.repeat(201) + ':';
    const text = `reply\n${longLine}\n> quoted`;
    expect(stripQuotedReply(text)).toBe(`reply\n${longLine}`);
  });
});
