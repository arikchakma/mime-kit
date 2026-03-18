import { describe, expect, it } from 'vite-plus/test';

import { isSameAddress } from './address.ts';
import { forward, reply } from './compose.ts';
import type { Email, ParsedAttachment } from './parse.ts';

function stub(overrides: Partial<Email> = {}): Email {
  return {
    from: { name: 'Alice', address: 'alice@example.com' },
    sender: undefined,
    to: [{ name: 'Bob', address: 'bob@example.com' }],
    cc: [],
    bcc: [],
    replyTo: [],
    subject: 'Hello',
    messageId: 'orig-123@example.com',
    inReplyTo: undefined,
    references: [],
    date: undefined,
    text: 'Original body',
    html: undefined,
    headers: { get: () => undefined } as never,
    attachments: [],
    ...overrides,
  };
}

describe('reply', () => {
  const me = { name: 'Bob', address: 'bob@example.com' };

  it('sets to from original.from', () => {
    const result = reply(stub(), { from: me, text: 'Thanks' });
    expect(
      isSameAddress(result.to as string, 'alice@example.com')
    ).toBe(true);
  });

  it('uses replyTo when set', () => {
    const original = stub({
      replyTo: [{ name: '', address: 'reply@example.com' }],
    });
    const result = reply(original, { from: me, text: 'Thanks' });
    expect(
      isSameAddress(result.to as string, 'reply@example.com')
    ).toBe(true);
  });

  it('prefixes subject with Re:', () => {
    const result = reply(stub(), { from: me, text: 'ok' });
    expect(result.subject).toBe('Re: Hello');
  });

  it('does not double-prefix Re:', () => {
    const result = reply(stub({ subject: 'Re: Hello' }), {
      from: me,
      text: 'ok',
    });
    expect(result.subject).toBe('Re: Hello');
  });

  it('sets inReplyTo and references', () => {
    const result = reply(stub(), { from: me, text: 'ok' });
    expect(result.inReplyTo).toBe('orig-123@example.com');
    expect(result.references).toEqual(['orig-123@example.com']);
  });

  it('appends to existing references', () => {
    const original = stub({ references: ['root@example.com'] });
    const result = reply(original, { from: me, text: 'ok' });
    expect(result.references).toEqual([
      'root@example.com',
      'orig-123@example.com',
    ]);
  });

  it('generates a messageId', () => {
    const result = reply(stub(), { from: me, text: 'ok' });
    expect(result.messageId).toContain('@example.com');
  });

  it('reply-all adds cc minus self and to', () => {
    const original = stub({
      to: [me, { name: 'Carol', address: 'carol@example.com' }],
      cc: [{ name: 'Dave', address: 'dave@example.com' }],
    });
    const result = reply(original, { from: me, text: 'ok', all: true });
    const ccAddrs = (result.cc as { address: string }[])!.map(
      (a) => a.address
    );
    expect(ccAddrs).toContain('carol@example.com');
    expect(ccAddrs).toContain('dave@example.com');
    expect(ccAddrs).not.toContain('bob@example.com');
    expect(ccAddrs).not.toContain('alice@example.com');
  });

  it('reply-all omits cc when no extra recipients', () => {
    const result = reply(stub(), { from: me, text: 'ok', all: true });
    expect(result.cc).toBeUndefined();
  });
});

describe('forward', () => {
  const me = { name: 'Bob', address: 'bob@example.com' };

  it('prefixes subject with Fwd:', () => {
    const result = forward(stub(), {
      from: me,
      to: 'carol@example.com',
      text: 'FYI',
    });
    expect(result.subject).toBe('Fwd: Hello');
  });

  it('does not double-prefix Fwd:', () => {
    const result = forward(stub({ subject: 'Fwd: Hello' }), {
      from: me,
      to: 'carol@example.com',
      text: 'FYI',
    });
    expect(result.subject).toBe('Fwd: Hello');
  });

  it('sets to from input', () => {
    const result = forward(stub(), {
      from: me,
      to: 'carol@example.com',
      text: 'FYI',
    });
    expect(result.to).toBe('carol@example.com');
  });

  it('generates a messageId', () => {
    const result = forward(stub(), {
      from: me,
      to: 'carol@example.com',
      text: 'FYI',
    });
    expect(result.messageId).toContain('@example.com');
  });

  it('excludes attachments by default', () => {
    const att: ParsedAttachment = {
      filename: 'file.txt',
      mimeType: 'text/plain',
      disposition: 'attachment',
      content: new Uint8Array([1, 2, 3]),
      text() {
        return '';
      },
    };
    const result = forward(stub({ attachments: [att] }), {
      from: me,
      to: 'carol@example.com',
      text: 'FYI',
    });
    expect(result.attachments).toBeUndefined();
  });

  it('includes attachments when requested', () => {
    const att: ParsedAttachment = {
      filename: 'file.txt',
      mimeType: 'text/plain',
      disposition: 'attachment',
      content: new Uint8Array([1, 2, 3]),
      text() {
        return '';
      },
    };
    const result = forward(stub({ attachments: [att] }), {
      from: me,
      to: 'carol@example.com',
      text: 'FYI',
      includeAttachments: true,
    });
    expect(result.attachments).toHaveLength(1);
    expect(result.attachments![0].filename).toBe('file.txt');
  });
});
