import type { BuildInput } from './build.ts';
import { toBytes } from './encoding.ts';
import { toArray } from './utils/array.ts';

const HEADER_OVERHEAD = 500;
const ATTACHMENT_HEADER = 200;
const BASE64_RATIO = 4 / 3;

function addressLength(field: BuildInput['to'] | BuildInput['from']): number {
  if (!field) {
    return 0;
  }
  const arr = Array.isArray(field) ? field : [field];
  let len = 0;
  for (const addr of arr) {
    len +=
      typeof addr === 'string'
        ? addr.length
        : (addr.name?.length ?? 0) + addr.address.length + 3;
  }
  return len;
}

export function estimateSize(input: BuildInput): number {
  let size = HEADER_OVERHEAD;

  if (input.text) {
    size += toBytes(input.text).byteLength;
  }
  if (input.html) {
    size += toBytes(input.html).byteLength;
  }

  for (const att of toArray(input.attachments)) {
    const raw = toBytes(att.content).byteLength;
    size += Math.ceil(raw * BASE64_RATIO) + ATTACHMENT_HEADER;
  }

  size += addressLength(input.from);
  size += addressLength(input.to);
  size += addressLength(input.cc);
  size += addressLength(input.bcc);
  size += addressLength(input.replyTo);

  size += input.subject?.length ?? 0;

  return size;
}
