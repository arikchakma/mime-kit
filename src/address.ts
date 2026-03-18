import type { MailboxAddrObject } from 'mimetext';

import type { Address } from './parse.ts';

export type AddressInput = string | Address;

export function toMailbox(input: AddressInput): MailboxAddrObject {
  if (typeof input === 'string') {
    return { addr: input };
  }
  return { addr: input.address, name: input.name || undefined };
}

function stripBrackets(addr: string): string {
  return addr.startsWith('<') && addr.endsWith('>') ? addr.slice(1, -1) : addr;
}

export function formatAddress(input: AddressInput): string {
  if (typeof input === 'string') {
    return `<${stripBrackets(input)}>`;
  }
  const addr = stripBrackets(input.address);
  return input.name ? `"${input.name}" <${addr}>` : `<${addr}>`;
}

export function displayName(input: AddressInput): string {
  if (typeof input === 'string') {
    const addr = stripBrackets(input);
    const at = addr.indexOf('@');
    return at === -1 ? addr : addr.slice(0, at);
  }
  if (input.name) {
    return input.name;
  }
  const at = input.address.indexOf('@');
  return at === -1 ? input.address : input.address.slice(0, at);
}

export function isSameAddress(a: AddressInput, b: AddressInput): boolean {
  const addrA =
    typeof a === 'string' ? stripBrackets(a) : stripBrackets(a.address);
  const addrB =
    typeof b === 'string' ? stripBrackets(b) : stripBrackets(b.address);
  return addrA.toLowerCase() === addrB.toLowerCase();
}

export function extractDomain(email: string): string {
  const addr = stripBrackets(email);
  const at = addr.lastIndexOf('@');
  if (at === -1) {
    return '';
  }
  return addr.slice(at + 1);
}
