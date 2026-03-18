import { describe, expect, it } from 'vite-plus/test';

import { Headers } from './headers.ts';

function make(pairs: [string, string][]): Headers {
  return new Headers(pairs.map(([key, value]) => ({ key, value })));
}

describe('Headers', () => {
  it('get returns first value', () => {
    const h = make([
      ['subject', 'hello'],
      ['subject', 'world'],
    ]);
    expect(h.get('subject')).toBe('hello');
  });

  it('get is case-insensitive', () => {
    const h = make([['Content-Type', 'text/plain']]);
    expect(h.get('content-type')).toBe('text/plain');
    expect(h.get('CONTENT-TYPE')).toBe('text/plain');
  });

  it('get returns undefined for missing key', () => {
    const h = make([]);
    expect(h.get('x-missing')).toBeUndefined();
  });

  it('getAll returns all values for a key', () => {
    const h = make([
      ['received', 'from a'],
      ['received', 'from b'],
      ['received', 'from c'],
    ]);
    expect(h.getAll('received')).toEqual(['from a', 'from b', 'from c']);
  });

  it('getAll returns empty array for missing key', () => {
    const h = make([]);
    expect(h.getAll('x-missing')).toEqual([]);
  });

  it('has returns true/false', () => {
    const h = make([['from', 'alice@example.com']]);
    expect(h.has('from')).toBe(true);
    expect(h.has('FROM')).toBe(true);
    expect(h.has('x-missing')).toBe(false);
  });

  it('size counts total header entries', () => {
    const h = make([
      ['from', 'a@b.com'],
      ['to', 'c@d.com'],
      ['received', 'one'],
      ['received', 'two'],
    ]);
    expect(h.size).toBe(4);
  });

  it('iterates over all entries', () => {
    const h = make([
      ['from', 'a@b.com'],
      ['to', 'c@d.com'],
    ]);
    const entries = [...h];
    expect(entries).toEqual([
      ['from', 'a@b.com'],
      ['to', 'c@d.com'],
    ]);
  });

  it('keys yields one key per entry', () => {
    const h = make([
      ['received', 'one'],
      ['received', 'two'],
    ]);
    expect([...h.keys()]).toEqual(['received', 'received']);
  });

  it('values yields all values', () => {
    const h = make([
      ['a', '1'],
      ['b', '2'],
    ]);
    expect([...h.values()]).toEqual(['1', '2']);
  });

  it('forEach visits all entries', () => {
    const h = make([
      ['x', '1'],
      ['y', '2'],
    ]);
    const visited: [string, string][] = [];
    h.forEach((value, key) => visited.push([key, value]));
    expect(visited).toEqual([
      ['x', '1'],
      ['y', '2'],
    ]);
  });
});
