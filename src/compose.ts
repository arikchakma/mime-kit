import { isSameAddress } from './address.ts';
import type { AddressInput } from './address.ts';
import type { AttachmentInput, BuildInput } from './build.ts';
import { messageId } from './message-id.ts';
import type { Email } from './parse.ts';
import { extractDomain } from './address.ts';

export type ReplyInput = {
  from: AddressInput;
  text?: string;
  html?: string;
  all?: boolean;
};

export type ForwardInput = {
  from: AddressInput;
  to: AddressInput | AddressInput[];
  text?: string;
  html?: string;
  includeAttachments?: boolean;
};

function prefixSubject(subject: string, prefix: string): string {
  const re = new RegExp(`^${prefix}\\s*`, 'i');
  return re.test(subject) ? subject : `${prefix} ${subject}`;
}

function senderDomain(from: AddressInput): string {
  const addr = typeof from === 'string' ? from : from.address;
  return extractDomain(addr) || 'localhost';
}

function dedup(
  addrs: AddressInput[],
  exclude: AddressInput[]
): AddressInput[] {
  return addrs.filter(
    (a) => !exclude.some((ex) => isSameAddress(a, ex))
  );
}

export function reply(original: Email, input: ReplyInput): BuildInput {
  const to = original.replyTo.length > 0
    ? original.replyTo[0]
    : original.from ?? input.from;

  const refs = original.messageId
    ? [...original.references, original.messageId]
    : [...original.references];

  const result: BuildInput = {
    from: input.from,
    to,
    subject: prefixSubject(original.subject, 'Re:'),
    text: input.text,
    html: input.html,
    inReplyTo: original.messageId,
    references: refs.length > 0 ? refs : undefined,
    messageId: messageId(senderDomain(input.from)),
  };

  if (input.all) {
    const excludeList: AddressInput[] = [input.from, to];
    const ccCandidates = [...original.to, ...original.cc];
    const cc = dedup(ccCandidates, excludeList);
    if (cc.length > 0) {
      result.cc = cc;
    }
  }

  return result;
}

export function forward(original: Email, input: ForwardInput): BuildInput {
  const result: BuildInput = {
    from: input.from,
    to: input.to,
    subject: prefixSubject(original.subject, 'Fwd:'),
    text: input.text,
    html: input.html,
    messageId: messageId(senderDomain(input.from)),
  };

  if (input.includeAttachments && original.attachments.length > 0) {
    result.attachments = original.attachments.map(
      (a): AttachmentInput => ({
        filename: a.filename ?? 'attachment',
        content: a.content,
        type: a.mimeType,
        inline: a.disposition === 'inline',
        ...(a.contentId ? { contentId: a.contentId } : {}),
        ...(a.description ? { description: a.description } : {}),
      })
    );
  }

  return result;
}
