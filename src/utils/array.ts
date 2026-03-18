export function toArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) {
    return [];
  }
  return Array.isArray(v) ? v : [v];
}
