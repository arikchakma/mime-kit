export function messageId(domain: string): string {
  return `${crypto.randomUUID()}@${domain}`;
}
