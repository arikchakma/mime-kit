export const MIME_KIT_ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INVALID_HEADER: 'INVALID_HEADER',
  NESTING_TOO_DEEP: 'NESTING_TOO_DEEP',
  HEADERS_TOO_LARGE: 'HEADERS_TOO_LARGE',
  BUILD_FAILED: 'BUILD_FAILED',
  PARSE_FAILED: 'PARSE_FAILED',
} as const;

export type MimeKitErrorCode =
  (typeof MIME_KIT_ERROR_CODES)[keyof typeof MIME_KIT_ERROR_CODES];

export class MimeKitError extends Error {
  override name = 'MimeKitError';
  readonly code: MimeKitErrorCode;

  constructor(
    code: MimeKitErrorCode,
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.code = code;
  }

  static fromBuildError(err: unknown): MimeKitError {
    if (err instanceof MimeKitError) {
      return err;
    }

    const name =
      err instanceof Error && 'name' in err ? (err as Error).name : '';
    const desc =
      err instanceof Error && 'description' in err
        ? (err as Error & { description: string }).description
        : '';
    const msg = err instanceof Error ? err.message : String(err);

    switch (name) {
      case 'MIMETEXT_INVALID_MAILBOX':
        return new MimeKitError(
          MIME_KIT_ERROR_CODES.INVALID_ADDRESS,
          `Invalid email address: ${desc || msg}`,
          { cause: err }
        );
      case 'MIMETEXT_INVALID_HEADER_VALUE':
      case 'MIMETEXT_INVALID_HEADER_FIELD':
        return new MimeKitError(
          MIME_KIT_ERROR_CODES.INVALID_HEADER,
          `Invalid header: ${desc || msg}`,
          { cause: err }
        );
      case 'MIMETEXT_MISSING_HEADER':
        return new MimeKitError(
          MIME_KIT_ERROR_CODES.INVALID_INPUT,
          `Missing required header: ${desc || msg}`,
          { cause: err }
        );
      case 'MIMETEXT_MISSING_BODY':
        return new MimeKitError(
          MIME_KIT_ERROR_CODES.INVALID_INPUT,
          'Message must have text or html content',
          { cause: err }
        );
      case 'MIMETEXT_MISSING_FILENAME':
        return new MimeKitError(
          MIME_KIT_ERROR_CODES.INVALID_INPUT,
          'Each attachment must have a filename',
          { cause: err }
        );
      case 'MIMETEXT_INVALID_MESSAGE_TYPE':
        return new MimeKitError(
          MIME_KIT_ERROR_CODES.INVALID_INPUT,
          `Invalid content type: ${desc || msg}`,
          { cause: err }
        );
      default:
        return new MimeKitError(
          MIME_KIT_ERROR_CODES.BUILD_FAILED,
          `Failed to build MIME message: ${msg}`,
          { cause: err }
        );
    }
  }

  static fromParseError(err: unknown): MimeKitError {
    if (err instanceof MimeKitError) {
      return err;
    }

    const msg = err instanceof Error ? err.message : String(err);

    if (msg.includes('nesting depth')) {
      return new MimeKitError(
        MIME_KIT_ERROR_CODES.NESTING_TOO_DEEP,
        `MIME nesting too deep — message may be malformed or malicious`,
        { cause: err }
      );
    }
    if (msg.includes('header size')) {
      return new MimeKitError(
        MIME_KIT_ERROR_CODES.HEADERS_TOO_LARGE,
        `MIME headers exceed size limit — message may be malformed or malicious`,
        { cause: err }
      );
    }

    return new MimeKitError(
      MIME_KIT_ERROR_CODES.PARSE_FAILED,
      `Failed to parse MIME message: ${msg}`,
      { cause: err }
    );
  }
}
