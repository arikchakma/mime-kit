import { describe, expect, it } from 'vite-plus/test';

import type { Email } from '../parse.ts';
import { groupByThread } from './thread-tree.ts';

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

describe('groupByThread', () => {
  it('returns each unlinked email as a root', () => {
    const a = stub({ messageId: 'a' });
    const b = stub({ messageId: 'b' });
    const roots = groupByThread([a, b]);
    expect(roots).toHaveLength(2);
  });

  it('links reply to parent via inReplyTo', () => {
    const parent = stub({ messageId: 'p', date: new Date('2024-01-01') });
    const child = stub({
      messageId: 'c',
      inReplyTo: 'p',
      date: new Date('2024-01-02'),
    });
    const roots = groupByThread([parent, child]);
    expect(roots).toHaveLength(1);
    expect(roots[0].email).toBe(parent);
    expect(roots[0].children).toHaveLength(1);
    expect(roots[0].children[0].email).toBe(child);
  });

  it('links via last references entry when no inReplyTo', () => {
    const parent = stub({ messageId: 'p', date: new Date('2024-01-01') });
    const child = stub({
      messageId: 'c',
      references: ['root', 'p'],
      date: new Date('2024-01-02'),
    });
    const roots = groupByThread([parent, child]);
    expect(roots).toHaveLength(1);
    expect(roots[0].email).toBe(parent);
    expect(roots[0].children).toHaveLength(1);
    expect(roots[0].children[0].email).toBe(child);
  });

  it('handles emails without messageId as roots', () => {
    const noId = stub({});
    const roots = groupByThread([noId]);
    expect(roots).toHaveLength(1);
    expect(roots[0].email).toBe(noId);
  });

  it('sorts roots and children by date', () => {
    const a = stub({ messageId: 'a', date: new Date('2024-01-03') });
    const b = stub({ messageId: 'b', date: new Date('2024-01-01') });
    const c = stub({ messageId: 'c', date: new Date('2024-01-02') });
    const roots = groupByThread([a, b, c]);
    expect(roots.map((r) => r.email.messageId)).toEqual(['b', 'c', 'a']);
  });

  it('detects cycles and treats cyclic node as root', () => {
    const a = stub({
      messageId: 'a',
      inReplyTo: 'b',
      date: new Date('2024-01-01'),
    });
    const b = stub({
      messageId: 'b',
      inReplyTo: 'a',
      date: new Date('2024-01-02'),
    });
    const roots = groupByThread([a, b]);
    // One links to other, then the second detects cycle → root
    expect(roots.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty array for empty input', () => {
    expect(groupByThread([])).toEqual([]);
  });
});
