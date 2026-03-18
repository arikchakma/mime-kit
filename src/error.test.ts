import { describe, expect, it } from 'vite-plus/test';

import { build } from './build.ts';
import { MIME_KIT_ERROR_CODES, MimeKitError } from './error.ts';

describe('MimeKitError', () => {
  it('is an instance of Error', () => {
    const err = new MimeKitError(MIME_KIT_ERROR_CODES.INVALID_INPUT, 'test');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(MimeKitError);
  });

  it('has code, message, and name', () => {
    const err = new MimeKitError(
      MIME_KIT_ERROR_CODES.PARSE_FAILED,
      'bad input'
    );
    expect(err.code).toBe('PARSE_FAILED');
    expect(err.message).toBe('bad input');
    expect(err.name).toBe('MimeKitError');
  });

  it('preserves cause', () => {
    const cause = new Error('original');
    const err = new MimeKitError(MIME_KIT_ERROR_CODES.BUILD_FAILED, 'wrapped', {
      cause,
    });
    expect(err.cause).toBe(cause);
  });
});

describe('build() validation', () => {
  it('throws INVALID_INPUT when from is empty string', () => {
    expect(() => build({ from: '', text: 'hi' })).toThrow(MimeKitError);

    try {
      build({ from: '  ', text: 'hi' });
    } catch (err) {
      expect(err).toBeInstanceOf(MimeKitError);
      expect((err as MimeKitError).code).toBe('INVALID_INPUT');
    }
  });

  it('throws INVALID_INPUT when neither text nor html', () => {
    expect(() => build({ from: 'a@b.com' })).toThrow(MimeKitError);

    try {
      build({ from: 'a@b.com' });
    } catch (err) {
      expect(err).toBeInstanceOf(MimeKitError);
      expect((err as MimeKitError).code).toBe('INVALID_INPUT');
    }
  });

  it('throws INVALID_INPUT when attachment has no filename', () => {
    expect(() =>
      build({
        from: 'a@b.com',
        text: 'hi',
        attachments: [{ filename: '', content: new Uint8Array() }],
      })
    ).toThrow(MimeKitError);
  });
});

describe('mapBuildError', () => {
  it('passes through MimeKitError unchanged', () => {
    const original = new MimeKitError(
      MIME_KIT_ERROR_CODES.INVALID_INPUT,
      'already ours'
    );
    expect(MimeKitError.fromBuildError(original)).toBe(original);
  });

  it('maps MIMETEXT_INVALID_MAILBOX to INVALID_ADDRESS', () => {
    const err = Object.assign(new Error(), {
      name: 'MIMETEXT_INVALID_MAILBOX',
      description: "Couldn't recognize the input.",
    });
    const mapped = MimeKitError.fromBuildError(err);
    expect(mapped.code).toBe(MIME_KIT_ERROR_CODES.INVALID_ADDRESS);
    expect(mapped.message).toContain('Invalid email address');
    expect(mapped.cause).toBe(err);
  });

  it('maps MIMETEXT_INVALID_HEADER_VALUE to INVALID_HEADER', () => {
    const err = Object.assign(new Error(), {
      name: 'MIMETEXT_INVALID_HEADER_VALUE',
      description: 'The value for the header "Reply-To" is invalid.',
    });
    const mapped = MimeKitError.fromBuildError(err);
    expect(mapped.code).toBe(MIME_KIT_ERROR_CODES.INVALID_HEADER);
    expect(mapped.message).toContain('Invalid header');
  });

  it('maps MIMETEXT_MISSING_HEADER to INVALID_INPUT', () => {
    const err = Object.assign(new Error(), {
      name: 'MIMETEXT_MISSING_HEADER',
      description: 'The "From" header is required.',
    });
    const mapped = MimeKitError.fromBuildError(err);
    expect(mapped.code).toBe(MIME_KIT_ERROR_CODES.INVALID_INPUT);
    expect(mapped.message).toContain('Missing required header');
  });

  it('maps MIMETEXT_MISSING_BODY to INVALID_INPUT', () => {
    const err = Object.assign(new Error(), {
      name: 'MIMETEXT_MISSING_BODY',
      description: 'No content added to the message.',
    });
    const mapped = MimeKitError.fromBuildError(err);
    expect(mapped.code).toBe(MIME_KIT_ERROR_CODES.INVALID_INPUT);
    expect(mapped.message).toContain('text or html');
  });

  it('maps unknown errors to BUILD_FAILED', () => {
    const err = new Error('something unexpected');
    const mapped = MimeKitError.fromBuildError(err);
    expect(mapped.code).toBe(MIME_KIT_ERROR_CODES.BUILD_FAILED);
    expect(mapped.message).toContain('something unexpected');
  });
});

describe('mapParseError', () => {
  it('passes through MimeKitError unchanged', () => {
    const original = new MimeKitError(
      MIME_KIT_ERROR_CODES.PARSE_FAILED,
      'already ours'
    );
    expect(MimeKitError.fromParseError(original)).toBe(original);
  });

  it('maps nesting depth errors to NESTING_TOO_DEEP', () => {
    const err = new Error('Maximum MIME nesting depth of 256 levels exceeded');
    const mapped = MimeKitError.fromParseError(err);
    expect(mapped.code).toBe(MIME_KIT_ERROR_CODES.NESTING_TOO_DEEP);
    expect(mapped.message).toContain('nesting too deep');
  });

  it('maps header size errors to HEADERS_TOO_LARGE', () => {
    const err = new Error('Maximum header size of 2097152 bytes exceeded');
    const mapped = MimeKitError.fromParseError(err);
    expect(mapped.code).toBe(MIME_KIT_ERROR_CODES.HEADERS_TOO_LARGE);
    expect(mapped.message).toContain('headers exceed size limit');
  });

  it('maps unknown errors to PARSE_FAILED with original message', () => {
    const err = new Error('something broke');
    const mapped = MimeKitError.fromParseError(err);
    expect(mapped.code).toBe(MIME_KIT_ERROR_CODES.PARSE_FAILED);
    expect(mapped.message).toContain('something broke');
    expect(mapped.cause).toBe(err);
  });
});
