import { describe, expect, it } from 'vite-plus/test';

import { extractDomain } from './address.ts';

describe('extractDomain', () => {
  it('extracts domain from plain address', () => {
    expect(extractDomain('alice@example.com')).toBe('example.com');
  });

  it('extracts domain from bracketed address', () => {
    expect(extractDomain('<alice@example.com>')).toBe('example.com');
  });

  it('returns empty string for invalid address', () => {
    expect(extractDomain('not-an-email')).toBe('');
  });

  it('handles address with multiple @ signs', () => {
    expect(extractDomain('user@sub@example.com')).toBe('example.com');
  });
});
