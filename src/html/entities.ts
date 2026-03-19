const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

export function decodeEntity(entity: string): string {
  if (entity.startsWith('#x') || entity.startsWith('#X')) {
    return String.fromCharCode(Number.parseInt(entity.slice(2), 16));
  }
  if (entity.startsWith('#')) {
    return String.fromCharCode(Number(entity.slice(1)));
  }
  return NAMED[entity] ?? `&${entity};`;
}
