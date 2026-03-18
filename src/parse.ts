import PostalMime from 'postal-mime';
import type { Address as PostalMimeAddress } from 'postal-mime';

import { MimeKitError } from './error.ts';
import { MimeKitHeaders } from './headers.ts';

export type Address = { name: string; address: string };

export type ParsedAttachment = {
  filename: string | undefined;
  mimeType: string;
  disposition: 'attachment' | 'inline';
  content: Uint8Array;
  contentId?: string;
  related?: boolean;
  description?: string;
  method?: string;
  text(): string;
};

export type Email = {
  from: Address | undefined;
  sender: Address | undefined;
  to: Address[];
  cc: Address[];
  bcc: Address[];
  replyTo: Address[];
  subject: string;
  messageId: string | undefined;
  inReplyTo: string | undefined;
  references: string[];
  date: Date | undefined;
  text: string | undefined;
  html: string | undefined;
  headers: MimeKitHeaders;
  attachments: ParsedAttachment[];
};

function flattenAddresses(addrs: PostalMimeAddress[] | undefined): Address[] {
  if (!addrs) {
    return [];
  }
  const out: Address[] = [];
  for (const a of addrs) {
    if (a.group) {
      for (const m of a.group) {
        out.push({ name: m.name, address: m.address });
      }
    } else if (a.address) {
      out.push({ name: a.name, address: a.address });
    }
  }
  return out;
}

function normalizeOne(
  addr: PostalMimeAddress | undefined
): Address | undefined {
  if (!addr) {
    return undefined;
  }
  if (addr.address) {
    return { name: addr.name, address: addr.address };
  }
  if (addr.group?.length) {
    return { name: addr.group[0].name, address: addr.group[0].address };
  }
  return undefined;
}

function parseReferences(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }
  const matches = raw.match(/<[^>]+>/g);
  return matches ? matches.map((m) => m.slice(1, -1)) : [];
}

function parseDate(raw: string | undefined): Date | undefined {
  if (!raw) {
    return undefined;
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function parse(
  input: string | ArrayBuffer | Uint8Array
): Promise<Email> {
  try {
    const result = await PostalMime.parse(input, {
      attachmentEncoding: 'arraybuffer',
    });

    const attachments: ParsedAttachment[] = (result.attachments ?? []).map(
      (a) => {
        const content =
          a.content instanceof Uint8Array
            ? a.content
            : typeof a.content === 'string'
              ? new TextEncoder().encode(a.content)
              : new Uint8Array(a.content);

        return {
          filename: a.filename ?? undefined,
          mimeType: a.mimeType,
          disposition: a.disposition === 'inline' ? 'inline' : 'attachment',
          content,
          ...(a.contentId ? { contentId: a.contentId } : {}),
          ...(a.related ? { related: a.related } : {}),
          ...(a.description ? { description: a.description } : {}),
          ...(a.method ? { method: a.method } : {}),
          text() {
            return new TextDecoder().decode(this.content);
          },
        };
      }
    );

    return {
      from: normalizeOne(result.from),
      sender: normalizeOne(result.sender),
      to: flattenAddresses(result.to),
      cc: flattenAddresses(result.cc),
      bcc: flattenAddresses(result.bcc),
      replyTo: flattenAddresses(result.replyTo),
      subject: result.subject ?? '',
      messageId: result.messageId?.replace(/^<|>$/g, '') ?? undefined,
      inReplyTo: result.inReplyTo?.replace(/^<|>$/g, '') ?? undefined,
      references: parseReferences(result.references),
      date: parseDate(result.date),
      text: result.text ?? undefined,
      html: result.html ?? undefined,
      headers: new MimeKitHeaders(result.headers),
      attachments,
    };
  } catch (err) {
    throw MimeKitError.fromParseError(err);
  }
}
