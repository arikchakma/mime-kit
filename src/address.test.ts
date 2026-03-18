import { describe, expect, it } from 'vite-plus/test';

import { displayName, extractDomain, isSameAddress } from './address.ts';

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

describe('displayName', () => {
  it('returns name from Address object', () => {
    expect(displayName({ name: 'Alice', address: 'alice@example.com' })).toBe(
      'Alice'
    );
  });

  it('returns local part when no name on Address', () => {
    expect(displayName({ name: '', address: 'alice@example.com' })).toBe(
      'alice'
    );
  });

  it('returns local part from string address', () => {
    expect(displayName('bob@example.com')).toBe('bob');
  });

  it('strips brackets from string address', () => {
    expect(displayName('<carol@example.com>')).toBe('carol');
  });
});

describe('isSameAddress', () => {
  it('matches same address case-insensitively', () => {
    expect(isSameAddress('Alice@Example.COM', 'alice@example.com')).toBe(true);
  });

  it('returns false for different addresses', () => {
    expect(isSameAddress('alice@example.com', 'bob@example.com')).toBe(false);
  });

  it('works with Address objects', () => {
    expect(
      isSameAddress(
        { name: 'Alice', address: 'alice@example.com' },
        { name: 'A', address: 'ALICE@example.com' }
      )
    ).toBe(true);
  });

  it('handles bracketed addresses', () => {
    expect(isSameAddress('<alice@example.com>', 'alice@example.com')).toBe(
      true
    );
  });
});
