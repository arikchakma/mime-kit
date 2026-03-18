import { describe, expect, it } from 'vite-plus/test';

import { textFromHtml } from './text-from-html.ts';

describe('textFromHtml', () => {
  it('strips simple HTML tags', () => {
    expect(textFromHtml('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  it('converts br to newline', () => {
    expect(textFromHtml('line1<br>line2<br/>line3')).toBe(
      'line1\nline2\nline3'
    );
  });

  it('converts block closers to newlines', () => {
    expect(textFromHtml('<p>one</p><p>two</p>')).toBe('one\ntwo');
  });

  it('removes style and script blocks', () => {
    const html =
      '<style>body{color:red}</style><script>alert(1)</script><p>safe</p>';
    expect(textFromHtml(html)).toBe('safe');
  });

  it('converts links to text (URL) format', () => {
    expect(textFromHtml('<a href="https://example.com">click here</a>')).toBe(
      'click here (https://example.com)'
    );
  });

  it('uses bare URL when link text matches href', () => {
    expect(
      textFromHtml('<a href="https://example.com">https://example.com</a>')
    ).toBe('https://example.com');
  });

  it('decodes common HTML entities', () => {
    expect(textFromHtml('&amp; &lt; &gt; &quot; a&nbsp;b')).toBe('& < > " a b');
  });

  it('decodes numeric entities', () => {
    expect(textFromHtml('&#65;&#x42;')).toBe('AB');
  });

  it('collapses whitespace and trims', () => {
    expect(textFromHtml('  hello    world  ')).toBe('hello world');
  });

  it('handles empty string', () => {
    expect(textFromHtml('')).toBe('');
  });
});
