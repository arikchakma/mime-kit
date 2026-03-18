type RawHeader = { key: string; value: string };

export class Headers {
  readonly #map: Map<string, string[]>;

  constructor(raw: RawHeader[]) {
    this.#map = new Map();
    for (const { key, value } of raw) {
      const k = key.toLowerCase();
      const existing = this.#map.get(k);
      if (existing) {
        existing.push(value);
      } else {
        this.#map.set(k, [value]);
      }
    }
  }

  get(name: string): string | undefined {
    return this.#map.get(name.toLowerCase())?.[0];
  }

  getAll(name: string): string[] {
    return this.#map.get(name.toLowerCase()) ?? [];
  }

  has(name: string): boolean {
    return this.#map.has(name.toLowerCase());
  }

  get size(): number {
    let n = 0;
    for (const values of this.#map.values()) {
      n += values.length;
    }
    return n;
  }

  *keys(): IterableIterator<string> {
    for (const [key, values] of this.#map) {
      for (let i = 0; i < values.length; i++) {
        yield key;
      }
    }
  }

  *values(): IterableIterator<string> {
    for (const values of this.#map.values()) {
      yield* values;
    }
  }

  *entries(): IterableIterator<[string, string]> {
    for (const [key, values] of this.#map) {
      for (const value of values) {
        yield [key, value];
      }
    }
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }

  forEach(fn: (value: string, key: string, headers: Headers) => void): void {
    for (const [key, value] of this) {
      fn(value, key, this);
    }
  }
}
