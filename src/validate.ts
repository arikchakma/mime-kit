import type { BuildInput } from './build.ts';
import { toArray } from './utils/array.ts';

export type ValidationError = {
  field: string;
  code: string;
  message: string;
};

export function validate(input: BuildInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input.from || (typeof input.from === 'string' && !input.from.trim())) {
    errors.push({
      field: 'from',
      code: 'REQUIRED',
      message: '"from" address is required',
    });
  }
  if (!input.text && !input.html) {
    errors.push({
      field: 'text',
      code: 'REQUIRED',
      message: 'At least "text" or "html" content is required',
    });
  }
  const to = toArray(input.to);
  const cc = toArray(input.cc);
  const bcc = toArray(input.bcc);
  if (to.length === 0 && cc.length === 0 && bcc.length === 0) {
    errors.push({
      field: 'to',
      code: 'NO_RECIPIENTS',
      message: 'At least one recipient (to, cc, or bcc) is required',
    });
  }
  if (input.attachments) {
    for (let i = 0; i < input.attachments.length; i++) {
      if (!input.attachments[i].filename) {
        errors.push({
          field: `attachments[${i}].filename`,
          code: 'REQUIRED',
          message: `Attachment at index ${i} must have a non-empty "filename"`,
        });
      }
    }
  }

  return errors;
}
