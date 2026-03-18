import { lookup } from 'mime-types';
import { createMimeMessage } from 'mimetext';
import type { MailboxAddrObject } from 'mimetext';

import { MIME_KIT_ERROR_CODES, MimeKitError } from './error.ts';
import type { Address } from './parse.ts';

export type AddressInput = string | Address;

export type AttachmentInput = {
  filename: string;
  content: Uint8Array | ArrayBuffer | string;
  type?: string;
  inline?: boolean;
  contentId?: string;
  description?: string;
  method?: string;
  related?: boolean;
};

export type BuildInput = {
  from: AddressInput;
  sender?: AddressInput;
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

type MimeMsg = ReturnType<typeof createMimeMessage>;

function setRawHeader(msg: MimeMsg, name: string, value: string): void {
  const headers = (
    msg as unknown as {
      headers: { fields: { name: string }[]; setCustom: Function };
    }
  ).headers;
  const idx = headers.fields.findIndex((f) => f.name === name);
  if (idx !== -1) {
    headers.fields.splice(idx, 1);
  }
  headers.setCustom({
    name,
    value,
    custom: true,
    dump: (v: unknown) => (typeof v === 'string' ? v : ''),
  });
}

function formatAddress(input: AddressInput): string {
  if (typeof input === 'string') {
    return `<${input}>`;
  }
  return input.name
    ? `"${input.name}" <${input.address}>`
    : `<${input.address}>`;
}

export function build(input: BuildInput): string {
  if (!input.from || (typeof input.from === 'string' && !input.from.trim())) {
    throw new MimeKitError(
      MIME_KIT_ERROR_CODES.INVALID_INPUT,
      'build() requires a non-empty "from" address'
    );
  }
  if (!input.text && !input.html) {
    throw new MimeKitError(
      MIME_KIT_ERROR_CODES.INVALID_INPUT,
      'build() requires at least "text" or "html" content'
    );
  }
  if (input.attachments) {
    for (const att of input.attachments) {
      if (!att.filename) {
        throw new MimeKitError(
          MIME_KIT_ERROR_CODES.INVALID_INPUT,
          'Each attachment must have a non-empty "filename"'
        );
      }
    }
  }

  try {
    const msg = createMimeMessage();

    msg.setSender(toMailbox(input.from));
    if (input.sender) {
      setRawHeader(msg, 'Sender', formatAddress(input.sender));
    }
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
        let contentType = att.type ?? guessMime(att.filename);
        if (att.method) {
          contentType += `; method=${att.method}`;
        }
        const data = encodeBase64(att.content);
        const headers: Record<string, string> = {};
        if (att.contentId) {
          headers['Content-ID'] = att.contentId.startsWith('<')
            ? att.contentId
            : `<${att.contentId}>`;
        }
        if (att.description) {
          headers['Content-Description'] = att.description;
        }
        msg.addAttachment({
          filename: att.filename,
          contentType,
          data,
          encoding: 'base64',
          inline: att.inline ?? att.related ?? false,
          headers,
        });
      }
    }

    const replyTo = toArray(input.replyTo);
    if (replyTo.length) {
      setRawHeader(msg, 'Reply-To', replyTo.map(formatAddress).join(', '));
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
  } catch (err) {
    throw MimeKitError.fromBuildError(err);
  }
}
