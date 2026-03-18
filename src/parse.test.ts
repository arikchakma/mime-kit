import { describe, expect, it } from 'vite-plus/test';

import { parse } from './parse.ts';

const SIMPLE_EMAIL = [
  'From: Alice <alice@example.com>',
  'To: Bob <bob@example.com>',
  'Subject: Hello',
  'Date: Wed, 01 Jan 2025 12:00:00 +0000',
  'Message-ID: <msg-001@example.com>',
  'Content-Type: text/plain',
  '',
  'Hi Bob!',
].join('\r\n');

const HTML_EMAIL = [
  'From: alice@example.com',
  'To: bob@example.com',
  'Subject: HTML test',
  'Content-Type: text/html',
  '',
  '<p>Hello</p>',
].join('\r\n');

const MULTI_RECIPIENT = [
  'From: sender@example.com',
  'To: a@example.com, b@example.com',
  'Cc: c@example.com',
  'Subject: Multi',
  'Content-Type: text/plain',
  '',
  'body',
].join('\r\n');

const REFERENCES_EMAIL = [
  'From: a@b.com',
  'To: c@d.com',
  'Subject: refs',
  'In-Reply-To: <parent@example.com>',
  'References: <root@example.com> <parent@example.com>',
  'Content-Type: text/plain',
  '',
  'reply',
].join('\r\n');

const ATTACHMENT_EMAIL = [
  'From: a@b.com',
  'To: c@d.com',
  'Subject: with attachment',
  'MIME-Version: 1.0',
  'Content-Type: multipart/mixed; boundary="boundary123"',
  '',
  '--boundary123',
  'Content-Type: text/plain',
  '',
  'See attached.',
  '--boundary123',
  'Content-Type: text/plain; name="hello.txt"',
  'Content-Disposition: attachment; filename="hello.txt"',
  'Content-Transfer-Encoding: base64',
  '',
  btoa('Hello from attachment'),
  '--boundary123--',
].join('\r\n');

describe('parse', () => {
  it('parses a simple plain-text email', async () => {
    const email = await parse(SIMPLE_EMAIL);
    expect(email.from).toEqual({ name: 'Alice', address: 'alice@example.com' });
    expect(email.to).toEqual([{ name: 'Bob', address: 'bob@example.com' }]);
    expect(email.subject).toBe('Hello');
    expect(email.text?.trim()).toBe('Hi Bob!');
    expect(email.messageId).toBe('msg-001@example.com');
  });

  it('parses date correctly', async () => {
    const email = await parse(SIMPLE_EMAIL);
    expect(email.date).toBeInstanceOf(Date);
    expect(email.date!.getUTCFullYear()).toBe(2025);
  });

  it('parses html email', async () => {
    const email = await parse(HTML_EMAIL);
    expect(email.html).toContain('<p>Hello</p>');
    expect(email.text).toBeUndefined();
  });

  it('flattens multiple recipients', async () => {
    const email = await parse(MULTI_RECIPIENT);
    expect(email.to).toHaveLength(2);
    expect(email.to[0].address).toBe('a@example.com');
    expect(email.to[1].address).toBe('b@example.com');
    expect(email.cc).toHaveLength(1);
  });

  it('always returns arrays for address fields', async () => {
    const email = await parse(SIMPLE_EMAIL);
    expect(Array.isArray(email.to)).toBe(true);
    expect(Array.isArray(email.cc)).toBe(true);
    expect(Array.isArray(email.bcc)).toBe(true);
    expect(Array.isArray(email.replyTo)).toBe(true);
    expect(email.cc).toEqual([]);
  });

  it('parses references into string[]', async () => {
    const email = await parse(REFERENCES_EMAIL);
    expect(email.references).toEqual([
      'root@example.com',
      'parent@example.com',
    ]);
    expect(email.inReplyTo).toBe('parent@example.com');
  });

  it('parses attachments with .text()', async () => {
    const email = await parse(ATTACHMENT_EMAIL);
    expect(email.attachments).toHaveLength(1);
    const att = email.attachments[0];
    expect(att.filename).toBe('hello.txt');
    expect(att.mimeType).toBe('text/plain');
    expect(att.disposition).toBe('attachment');
    expect(att.content).toBeInstanceOf(Uint8Array);
    expect(att.text()).toBe('Hello from attachment');
  });

  it('returns defaults for empty fields', async () => {
    const minimal = ['From: a@b.com', 'Content-Type: text/plain', '', ''].join(
      '\r\n'
    );
    const email = await parse(minimal);
    expect(email.subject).toBe('');
    expect(email.to).toEqual([]);
    expect(email.references).toEqual([]);
    expect(email.date).toBeUndefined();
  });

  it('wraps headers in Headers class', async () => {
    const email = await parse(SIMPLE_EMAIL);
    expect(email.headers.has('from')).toBe(true);
    expect(email.headers.get('subject')).toBe('Hello');
  });
});
