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

  it('handles nested skip tags', () => {
    const html =
      '<style><style>nested</style>still in outer</style><p>visible</p>';
    expect(textFromHtml(html)).toBe('visible');
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
    expect(textFromHtml('&amp; &lt; &gt; &quot; a&nbsp;b')).toBe(
      '& < > " a b'
    );
  });

  it('decodes numeric entities', () => {
    expect(textFromHtml('&#65;&#x42;')).toBe('AB');
  });

  it('passes through unknown entities', () => {
    expect(textFromHtml('&unknown;')).toBe('&unknown;');
  });

  it('collapses whitespace and trims', () => {
    expect(textFromHtml('  hello    world  ')).toBe('hello world');
  });

  it('handles empty string', () => {
    expect(textFromHtml('')).toBe('');
  });

  it('handles self-closing tags', () => {
    expect(textFromHtml('before<br />after')).toBe('before\nafter');
  });

  it('handles comments and doctypes', () => {
    expect(textFromHtml('<!-- comment --><p>text</p>')).toBe('text');
  });

  it('handles head tag removal', () => {
    expect(
      textFromHtml('<head><title>T</title></head><body>content</body>')
    ).toBe('content');
  });

  it('handles attributes on various tags', () => {
    expect(
      textFromHtml('<div class="main" id="content">hello</div>')
    ).toBe('hello');
  });

  it('handles links with nested tags in text', () => {
    expect(
      textFromHtml('<a href="https://example.com"><b>bold link</b></a>')
    ).toBe('bold link (https://example.com)');
  });

  it('handles unquoted attribute values', () => {
    expect(textFromHtml('<a href=https://example.com>link</a>')).toBe(
      'link (https://example.com)'
    );
  });

  it('handles single-quoted attribute values', () => {
    expect(textFromHtml("<a href='https://example.com'>link</a>")).toBe(
      'link (https://example.com)'
    );
  });

  it('handles real-world email HTML', () => {
    const html = `
      <html>
        <head><style>body { font-family: Arial; }</style></head>
        <body>
          <h1>Welcome!</h1>
          <p>Hi there,</p>
          <p>Please visit <a href="https://example.com">our site</a> for more info.</p>
          <p>Thanks,<br>The Team</p>
        </body>
      </html>
    `;
    const text = textFromHtml(html);
    expect(text).toContain('Welcome!');
    expect(text).toContain('Hi there,');
    expect(text).toContain('our site (https://example.com)');
    expect(text).toContain('Thanks,\nThe Team');
    expect(text).not.toContain('font-family');
  });
});
