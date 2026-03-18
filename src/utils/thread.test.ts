import { describe, expect, it } from 'vite-plus/test';

import type { Email } from '../parse.ts';
import { isReply, threadId } from './thread.ts';

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

describe('isReply', () => {
  it('returns false for a new email', () => {
    expect(isReply(stub())).toBe(false);
  });

  it('returns true when inReplyTo is set', () => {
    expect(isReply(stub({ inReplyTo: 'parent@example.com' }))).toBe(true);
  });

  it('returns true when references exist', () => {
    expect(isReply(stub({ references: ['root@example.com'] }))).toBe(true);
  });
});

describe('threadId', () => {
  it('returns undefined for a new email', () => {
    expect(threadId(stub())).toBeUndefined();
  });

  it('returns first reference as thread root', () => {
    expect(
      threadId(
        stub({
          references: ['root@example.com', 'parent@example.com'],
          inReplyTo: 'parent@example.com',
        })
      )
    ).toBe('root@example.com');
  });

  it('falls back to inReplyTo when no references', () => {
    expect(threadId(stub({ inReplyTo: 'parent@example.com' }))).toBe(
      'parent@example.com'
    );
  });
});
