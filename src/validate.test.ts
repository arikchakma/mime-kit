import { describe, expect, it } from 'vite-plus/test';

import type { BuildInput } from './build.ts';
import { validate } from './validate.ts';

function validInput(overrides: Partial<BuildInput> = {}): BuildInput {
  return {
    from: 'alice@example.com',
    to: 'bob@example.com',
    text: 'Hello',
    ...overrides,
  };
}

describe('validate', () => {
  it('returns empty array for valid input', () => {
    expect(validate(validInput())).toEqual([]);
  });

  it('reports missing from', () => {
    const errors = validate(validInput({ from: '' }));
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('from');
    expect(errors[0].code).toBe('REQUIRED');
  });

  it('reports missing text and html', () => {
    const errors = validate({
      from: 'a@b.com',
      to: 'c@d.com',
      text: undefined,
      html: undefined,
    } as BuildInput);
    expect(errors.some((e) => e.field === 'text')).toBe(true);
  });

  it('reports no recipients', () => {
    const errors = validate({
      from: 'a@b.com',
      text: 'hi',
    });
    expect(errors.some((e) => e.code === 'NO_RECIPIENTS')).toBe(true);
  });

  it('accepts bcc-only recipient', () => {
    const errors = validate(validInput({ to: undefined, bcc: 'x@y.com' }));
    expect(errors).toEqual([]);
  });

  it('reports attachment without filename', () => {
    const errors = validate(
      validInput({
        attachments: [
          { filename: '', content: new Uint8Array(0) },
          { filename: 'ok.txt', content: new Uint8Array(0) },
        ],
      })
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('attachments[0].filename');
  });

  it('collects multiple errors at once', () => {
    const errors = validate({
      from: '',
      text: undefined,
    } as unknown as BuildInput);
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});
