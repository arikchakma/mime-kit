import { describe, expect, it } from 'vite-plus/test';

import { build } from './build.ts';
import { messageId } from './message-id.ts';

describe('messageId', () => {
  it('generates id with the given domain', () => {
    const id = messageId('example.com');
    expect(id).toContain('@example.com');
  });

  it('generates unique ids', () => {
    const a = messageId('example.com');
    const b = messageId('example.com');
    expect(a).not.toBe(b);
  });
});

describe('build', () => {
  it('builds a plain text email from string addresses', () => {
    const raw = build({
      from: 'alice@example.com',
      to: 'bob@example.com',
      subject: 'Hello',
      text: 'Hi Bob!',
    });
    expect(raw).toContain('From: <alice@example.com>');
    expect(raw).toContain('To: <bob@example.com>');
    expect(raw).toContain('Subject:');
    expect(raw).toContain('Hi Bob!');
  });

  it('builds from Address objects', () => {
    const raw = build({
      from: { name: 'Alice', address: 'alice@example.com' },
      to: { name: 'Bob', address: 'bob@example.com' },
      subject: 'Test',
      text: 'body',
    });
    expect(raw).toContain('alice@example.com');
    expect(raw).toContain('bob@example.com');
  });

  it('builds with text and html', () => {
    const raw = build({
      from: 'a@b.com',
      to: 'c@d.com',
      text: 'plain version',
      html: '<p>html version</p>',
    });
    expect(raw).toContain('text/plain');
    expect(raw).toContain('text/html');
    expect(raw).toContain('plain version');
    expect(raw).toContain('<p>html version</p>');
  });

  it('supports multiple recipients', () => {
    const raw = build({
      from: 'a@b.com',
      to: ['x@y.com', 'p@q.com'],
      cc: 'cc@b.com',
      text: 'hi',
    });
    expect(raw).toContain('x@y.com');
    expect(raw).toContain('p@q.com');
    expect(raw).toContain('Cc:');
    expect(raw).toContain('cc@b.com');
  });

  it('adds attachments', () => {
    const raw = build({
      from: 'a@b.com',
      to: 'c@d.com',
      text: 'see attached',
      attachments: [
        {
          filename: 'hello.txt',
          content: new TextEncoder().encode('Hello from attachment'),
          type: 'text/plain',
        },
      ],
    });
    expect(raw).toContain('hello.txt');
    expect(raw).toContain('Content-Disposition: attachment');
  });

  it('adds inline attachments with contentId', () => {
    const raw = build({
      from: 'a@b.com',
      to: 'c@d.com',
      html: '<img src="cid:logo123">',
      attachments: [
        {
          filename: 'logo.png',
          content: new Uint8Array([137, 80, 78, 71]),
          type: 'image/png',
          inline: true,
          contentId: 'logo123',
        },
      ],
    });
    expect(raw).toContain('Content-Disposition: inline');
    expect(raw).toContain('Content-ID: <logo123>');
  });

  it('sets attachment description and method', () => {
    const raw = build({
      from: 'a@b.com',
      to: 'c@d.com',
      text: 'see invite',
      attachments: [
        {
          filename: 'invite.ics',
          content: new TextEncoder().encode('BEGIN:VCALENDAR'),
          type: 'text/calendar',
          method: 'REQUEST',
          description: 'Meeting invite',
        },
      ],
    });
    expect(raw).toContain('Content-Description: Meeting invite');
    expect(raw).toContain('method=REQUEST');
  });

  it('sets custom headers', () => {
    const raw = build({
      from: 'a@b.com',
      to: 'c@d.com',
      text: 'hi',
      headers: { 'X-Priority': '1', 'X-Custom': 'value' },
    });
    expect(raw).toContain('X-Priority: 1');
    expect(raw).toContain('X-Custom: value');
  });

  it('sets reply-to', () => {
    const raw = build({
      from: 'a@b.com',
      to: 'c@d.com',
      replyTo: 'reply@b.com',
      text: 'hi',
    });
    expect(raw).toContain('Reply-To:');
    expect(raw).toContain('reply@b.com');
  });

  it('sets multiple reply-to addresses', () => {
    const raw = build({
      from: 'a@b.com',
      to: 'c@d.com',
      replyTo: ['one@b.com', 'two@b.com'],
      text: 'hi',
    });
    expect(raw).toContain('one@b.com');
    expect(raw).toContain('two@b.com');
  });

  it('sets sender distinct from from', () => {
    const raw = build({
      from: 'author@b.com',
      sender: 'agent@b.com',
      to: 'c@d.com',
      text: 'hi',
    });
    expect(raw).toContain('From:');
    expect(raw).toContain('author@b.com');
    expect(raw).toContain('Sender:');
    expect(raw).toContain('agent@b.com');
  });

  it('sets date', () => {
    const raw = build({
      from: 'a@b.com',
      to: 'c@d.com',
      text: 'hi',
      date: new Date('2025-06-15T10:00:00Z'),
    });
    expect(raw).toContain('Date:');
    expect(raw).toContain('15 Jun 2025');
  });

  it('sets message-id, in-reply-to, references', () => {
    const raw = build({
      from: 'a@b.com',
      to: 'c@d.com',
      text: 'reply',
      messageId: 'msg-123@example.com',
      inReplyTo: 'msg-000@example.com',
      references: ['msg-000@example.com'],
    });
    expect(raw).toContain('Message-ID: <msg-123@example.com>');
    expect(raw).toContain('In-Reply-To: <msg-000@example.com>');
    expect(raw).toContain('References: <msg-000@example.com>');
  });

  it('guesses mime type from extension', () => {
    const raw = build({
      from: 'a@b.com',
      to: 'c@d.com',
      text: 'see attached',
      attachments: [
        {
          filename: 'doc.pdf',
          content: new Uint8Array([1, 2, 3]),
        },
      ],
    });
    expect(raw).toContain('application/pdf');
  });

  it('handles non-ASCII string attachment content', () => {
    const raw = build({
      from: 'a@b.com',
      to: 'c@d.com',
      text: 'see attached',
      attachments: [
        {
          filename: 'note.txt',
          content: 'Hello 你好 🌍',
          type: 'text/plain',
        },
      ],
    });
    expect(raw).toContain('note.txt');
  });

  it('handles pre-bracketed addresses in replyTo', () => {
    const raw = build({
      from: 'a@b.com',
      to: 'c@d.com',
      replyTo: '<reply@b.com>',
      text: 'hi',
    });
    expect(raw).toMatch(/Reply-To:.*<reply@b\.com>/);
    expect(raw).not.toContain('<<');
  });

  it('handles pre-bracketed sender address', () => {
    const raw = build({
      from: 'a@b.com',
      sender: '<agent@b.com>',
      to: 'c@d.com',
      text: 'hi',
    });
    expect(raw).toMatch(/Sender:.*<agent@b\.com>/);
    expect(raw).not.toContain('<<');
  });
});
