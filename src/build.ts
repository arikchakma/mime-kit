import { lookup } from 'mime-types';
import { createMimeMessage, Mailbox } from 'mimetext';
import type { MailboxAddrObject } from 'mimetext';

import type { Address } from './parse.ts';

export type AddressInput = string | Address;

export type AttachmentInput = {
  filename: string;
  content: Uint8Array | ArrayBuffer | string;
  type?: string;
  inline?: boolean;
  cid?: string;
};

export type BuildInput = {
  from: AddressInput;
  to?: AddressInput | AddressInput[];
  cc?: AddressInput | AddressInput[];
  bcc?: AddressInput | AddressInput[];
  replyTo?: AddressInput | AddressInput[];
  subject?: string;
  text?: string;
  html?: string;
  date?: Date | string;
  messageId?: string;
  inReplyTo?: string;
  references?: string | string[];
  attachments?: AttachmentInput[];
  headers?: Record<string, string>;
};

function toMailbox(input: AddressInput): MailboxAddrObject {
  if (typeof input === 'string') {
    return { addr: input };
  }
  return { addr: input.address, name: input.name || undefined };
}

function toArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) {
    return [];
  }
  return Array.isArray(v) ? v : [v];
}

function encodeBase64(input: Uint8Array | ArrayBuffer | string): string {
  if (typeof input === 'string') {
    return btoa(input);
  }
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function guessMime(filename: string): string {
  return lookup(filename) || 'application/octet-stream';
}

export function build(input: BuildInput): string {
  const msg = createMimeMessage();

  msg.setSender(toMailbox(input.from));
  const to = toArray(input.to);
  if (to.length) {
    msg.setTo(to.map(toMailbox));
  }
  const cc = toArray(input.cc);
  if (cc.length) {
    msg.setCc(cc.map(toMailbox));
  }
  const bcc = toArray(input.bcc);
  if (bcc.length) {
    msg.setBcc(bcc.map(toMailbox));
  }

  msg.setSubject(input.subject ?? '');
  if (input.text) {
    msg.addMessage({ contentType: 'text/plain', data: input.text });
  }
  if (input.html) {
    msg.addMessage({ contentType: 'text/html', data: input.html });
  }

  if (input.attachments) {
    for (const att of input.attachments) {
      const contentType = att.type ?? guessMime(att.filename);
      const data = encodeBase64(att.content);
      const headers: Record<string, string> = {};
      if (att.cid) {
        headers['Content-ID'] = att.cid.startsWith('<')
          ? att.cid
          : `<${att.cid}>`;
      }
      msg.addAttachment({
        filename: att.filename,
        contentType,
        data,
        encoding: 'base64',
        inline: att.inline ?? false,
        headers,
      });
    }
  }

  const replyTo = toArray(input.replyTo);
  if (replyTo.length) {
    const first = replyTo[0];
    const mb =
      typeof first === 'string'
        ? new Mailbox(first, { type: 'To' })
        : new Mailbox(
            { addr: first.address, name: first.name },
            { type: 'To' }
          );
    msg.setHeader('Reply-To', mb);
  }
  if (input.date !== undefined) {
    const d = input.date instanceof Date ? input.date : new Date(input.date);
    msg.setHeader('Date', d.toUTCString());
  }
  if (input.messageId) {
    const id = input.messageId.startsWith('<')
      ? input.messageId
      : `<${input.messageId}>`;
    msg.setHeader('Message-ID', id);
  }
  if (input.inReplyTo) {
    const id = input.inReplyTo.startsWith('<')
      ? input.inReplyTo
      : `<${input.inReplyTo}>`;
    msg.setHeader('In-Reply-To', id);
  }
  if (input.references) {
    const refs = Array.isArray(input.references)
      ? input.references
      : [input.references];
    const formatted = refs
      .map((r) => (r.startsWith('<') ? r : `<${r}>`))
      .join(' ');
    msg.setHeader('References', formatted);
  }
  if (input.headers) {
    for (const [key, value] of Object.entries(input.headers)) {
      msg.setHeader(key, value);
    }
  }

  return msg.asRaw();
}
