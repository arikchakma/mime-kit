import { describe, expect, it } from 'vite-plus/test';

import { estimateSize } from './estimate-size.ts';

describe('estimateSize', () => {
  it('includes base header overhead', () => {
    expect(estimateSize({ from: 'a@b.com' })).toBeGreaterThanOrEqual(500);
  });

  it('includes text body size', () => {
    const base = estimateSize({ from: 'a@b.com' });
    const withText = estimateSize({ from: 'a@b.com', text: 'Hello world' });
    expect(withText - base).toBe(11);
  });

  it('includes html body size', () => {
    const base = estimateSize({ from: 'a@b.com' });
    const withHtml = estimateSize({ from: 'a@b.com', html: '<p>Hi</p>' });
    expect(withHtml - base).toBe(9);
  });

  it('estimates attachment size with base64 overhead', () => {
    const content = new Uint8Array(300);
    const size = estimateSize({
      from: 'a@b.com',
      attachments: [{ filename: 'f.bin', content }],
    });
    // 300 * 4/3 = 400, + 200 header
    expect(size).toBeGreaterThanOrEqual(500 + 400 + 200);
  });

  it('sums address field lengths', () => {
    const base = estimateSize({ from: 'a@b.com' });
    const withTo = estimateSize({
      from: 'a@b.com',
      to: [{ name: 'Alice', address: 'alice@example.com' }],
    });
    expect(withTo).toBeGreaterThan(base);
  });

  it('handles string address inputs', () => {
    const size = estimateSize({
      from: 'alice@example.com',
      to: 'bob@example.com',
    });
    expect(size).toBeGreaterThan(500);
  });
});
