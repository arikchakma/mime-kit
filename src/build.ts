import { lookup } from 'mime-types';
import { createMimeMessage } from 'mimetext';

import { formatAddress, toMailbox } from './address.ts';
import type { AddressInput } from './address.ts';
import { encodeBase64 } from './encoding.ts';
import { MIME_KIT_ERROR_CODES, MimeKitError } from './error.ts';
import { toArray } from './utils/array.ts';

export type AttachmentInput = {
  filename: string;
  content: Uint8Array | ArrayBuffer | string;
  type?: string;
  inline?: boolean;
  contentId?: string;
  description?: string;
  method?: string;
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
  priority?: 'high' | 'normal' | 'low';
  listUnsubscribe?: string | string[];
  autoSubmitted?: 'auto-generated' | 'auto-replied' | 'auto-notified';
  headers?: Record<string, string>;
};

type MimeMsg = ReturnType<typeof createMimeMessage>;

function guessMime(filename: string): string {
  return lookup(filename) || 'application/octet-stream';
}

function setRawHeader(msg: MimeMsg, name: string, value: string): void {
  try {
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
  } catch {
    msg.setHeader(name, value);
  }
}

function wrapId(id: string): string {
  return id.startsWith('<') ? id : `<${id}>`;
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
          headers['Content-ID'] = wrapId(att.contentId);
        }
        if (att.description) {
          headers['Content-Description'] = att.description;
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
      setRawHeader(msg, 'Reply-To', replyTo.map(formatAddress).join(', '));
    }
    if (input.date !== undefined) {
      const d = input.date instanceof Date ? input.date : new Date(input.date);
      msg.setHeader('Date', d.toUTCString());
    }
    if (input.messageId) {
      msg.setHeader('Message-ID', wrapId(input.messageId));
    }
    if (input.inReplyTo) {
      msg.setHeader('In-Reply-To', wrapId(input.inReplyTo));
    }
    if (input.references) {
      const refs = toArray(input.references);
      msg.setHeader('References', refs.map(wrapId).join(' '));
    }
    if (input.priority && input.priority !== 'normal') {
      if (input.priority === 'high') {
        msg.setHeader('X-Priority', '1');
        msg.setHeader('Importance', 'high');
      } else {
        msg.setHeader('X-Priority', '5');
        msg.setHeader('Importance', 'low');
      }
    }
    if (input.listUnsubscribe) {
      const urls = toArray(input.listUnsubscribe);
      msg.setHeader(
        'List-Unsubscribe',
        urls.map((u) => (u.startsWith('<') ? u : `<${u}>`)).join(', ')
      );
    }
    if (input.autoSubmitted) {
      msg.setHeader('Auto-Submitted', input.autoSubmitted);
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
