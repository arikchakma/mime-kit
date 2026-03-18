import { describe, expect, it } from 'vite-plus/test';

import { hasAttachments, inlineImages, totalSize } from './attachments.ts';
import type { Email, ParsedAttachment } from './parse.ts';

function att(overrides: Partial<ParsedAttachment> = {}): ParsedAttachment {
  return {
    filename: 'file.bin',
    mimeType: 'application/octet-stream',
    disposition: 'attachment',
    content: new Uint8Array(10),
    text() {
      return '';
    },
    ...overrides,
  };
}

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

describe('hasAttachments', () => {
  it('returns false when no attachments', () => {
    expect(hasAttachments(stub())).toBe(false);
  });

  it('returns true for non-inline attachment', () => {
    expect(hasAttachments(stub({ attachments: [att()] }))).toBe(true);
  });

  it('returns false when only inline attachments', () => {
    expect(
      hasAttachments(stub({ attachments: [att({ disposition: 'inline' })] }))
    ).toBe(false);
  });
});

describe('inlineImages', () => {
  it('returns empty for no attachments', () => {
    expect(inlineImages(stub())).toEqual([]);
  });

  it('returns only inline image attachments', () => {
    const imgs = inlineImages(
      stub({
        attachments: [
          att({ disposition: 'inline', mimeType: 'image/png' }),
          att({ disposition: 'inline', mimeType: 'text/plain' }),
          att({ disposition: 'attachment', mimeType: 'image/jpeg' }),
        ],
      })
    );
    expect(imgs).toHaveLength(1);
    expect(imgs[0].mimeType).toBe('image/png');
  });
});

describe('totalSize', () => {
  it('returns 0 for no attachments', () => {
    expect(totalSize(stub())).toBe(0);
  });

  it('sums content byte lengths', () => {
    expect(
      totalSize(
        stub({
          attachments: [
            att({ content: new Uint8Array(100) }),
            att({ content: new Uint8Array(200) }),
          ],
        })
      )
    ).toBe(300);
  });
});
