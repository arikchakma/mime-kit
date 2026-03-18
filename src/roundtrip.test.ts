import { describe, expect, it } from 'vite-plus/test';

import { build, parse } from './index.ts';

describe('roundtrip: build → parse', () => {
  it('preserves basic fields', async () => {
    const raw = build({
      from: { name: 'Alice', address: 'alice@example.com' },
      to: { name: 'Bob', address: 'bob@example.com' },
      subject: 'Round Trip',
      text: 'Hello from the other side',
      date: new Date('2025-01-15T08:00:00Z'),
    });

    const email = await parse(raw);
    expect(email.from?.address).toBe('alice@example.com');
    expect(email.from?.name).toBe('Alice');
    expect(email.to[0].address).toBe('bob@example.com');
    expect(email.subject).toBe('Round Trip');
    expect(email.text).toContain('Hello from the other side');
    expect(email.date?.toISOString()).toBe('2025-01-15T08:00:00.000Z');
  });

  it('preserves html content', async () => {
    const raw = build({
      from: 'alice@example.com',
      to: 'bob@example.com',
      html: '<h1>Hello</h1>',
    });

    const email = await parse(raw);
    expect(email.html).toContain('<h1>Hello</h1>');
  });

  it('preserves multiple recipients', async () => {
    const raw = build({
      from: 'sender@example.com',
      to: ['a@example.com', 'b@example.com'],
      cc: 'c@example.com',
      text: 'multi',
    });

    const email = await parse(raw);
    expect(email.to).toHaveLength(2);
    expect(email.to.map((a) => a.address)).toContain('a@example.com');
    expect(email.to.map((a) => a.address)).toContain('b@example.com');
    expect(email.cc).toHaveLength(1);
    expect(email.cc[0].address).toBe('c@example.com');
  });

  it('preserves attachments', async () => {
    const content = new TextEncoder().encode('file content here');
    const raw = build({
      from: 'a@b.com',
      to: 'c@d.com',
      text: 'attached',
      attachments: [
        {
          filename: 'test.txt',
          content,
          type: 'text/plain',
        },
      ],
    });

    const email = await parse(raw);
    expect(email.attachments).toHaveLength(1);
    expect(email.attachments[0].filename).toBe('test.txt');
    expect(email.attachments[0].text()).toBe('file content here');
  });

  it('preserves message-id and references', async () => {
    const raw = build({
      from: 'a@b.com',
      to: 'c@d.com',
      text: 'reply',
      messageId: 'reply-1@example.com',
      inReplyTo: 'original@example.com',
      references: ['root@example.com', 'original@example.com'],
    });

    const email = await parse(raw);
    expect(email.messageId).toBe('reply-1@example.com');
    expect(email.inReplyTo).toBe('original@example.com');
    expect(email.references).toContain('root@example.com');
    expect(email.references).toContain('original@example.com');
  });
});
