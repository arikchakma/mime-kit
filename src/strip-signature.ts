export function stripSignature(text: string): string {
  const delimiter = '\n-- \n';
  const idx = text.lastIndexOf(delimiter);
  if (idx !== -1) {
    return text.slice(0, idx).replace(/\s+$/, '');
  }
  if (text.startsWith('-- \n')) {
    return '';
  }
  return text;
}
