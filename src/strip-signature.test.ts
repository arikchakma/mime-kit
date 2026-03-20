import { describe, expect, it } from 'vite-plus/test';

import { stripSignature } from './strip-signature.ts';

describe('stripSignature', () => {
  it('strips signature after RFC 3676 delimiter', () => {
    const text = 'Hello\n\nBest regards\n-- \nJohn Doe';
    expect(stripSignature(text)).toBe('Hello\n\nBest regards');
  });

  it('does not treat --\\n (no trailing space) as delimiter', () => {
    const text = 'Hello\n--\nNot a signature';
    expect(stripSignature(text)).toBe('Hello\n--\nNot a signature');
  });

  it('uses last delimiter when multiple exist', () => {
    const text = 'Line 1\n-- \nFirst sig\n-- \nSecond sig';
    expect(stripSignature(text)).toBe('Line 1\n-- \nFirst sig');
  });

  it('returns empty for text starting with delimiter', () => {
    expect(stripSignature('-- \nJust a signature')).toBe('');
  });

  it('returns text unchanged when no signature', () => {
    expect(stripSignature('Hello world')).toBe('Hello world');
  });

  it('trims trailing whitespace before signature', () => {
    const text = 'Hello  \n  \n-- \nSig';
    expect(stripSignature(text)).toBe('Hello');
  });
});
