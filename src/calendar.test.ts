import { describe, expect, it } from 'vite-plus/test';

import { calendarMethod, isCalendarInvite } from './calendar.ts';
import type { Email, ParsedAttachment } from './parse.ts';

function att(overrides: Partial<ParsedAttachment> = {}): ParsedAttachment {
  return {
    filename: 'invite.ics',
    mimeType: 'text/calendar',
    disposition: 'attachment' as const,
    content: new Uint8Array(),
    text: () => '',
    ...overrides,
  };
}

function stub(
  attachments: ParsedAttachment[] = [],
  overrides: Partial<Email> = {}
): Email {
  return {
    from: undefined,
    sender: undefined,
    to: [],
    cc: [],
    bcc: [],
    replyTo: [],
    subject: '',
    messageId: undefined,
    inReplyTo: undefined,
    references: [],
    date: undefined,
    text: undefined,
    html: undefined,
    headers: { get: () => undefined } as never,
    attachments,
    ...overrides,
  };
}

describe('isCalendarInvite', () => {
  it('returns false for email without calendar attachment', () => {
    expect(isCalendarInvite(stub())).toBe(false);
  });

  it('detects text/calendar attachment', () => {
    expect(isCalendarInvite(stub([att()]))).toBe(true);
  });

  it('detects application/ics attachment', () => {
    expect(isCalendarInvite(stub([att({ mimeType: 'application/ics' })]))).toBe(
      true
    );
  });
});

describe('calendarMethod', () => {
  it('returns undefined for non-calendar email', () => {
    expect(calendarMethod(stub())).toBeUndefined();
  });

  it('returns method from attachment property', () => {
    expect(calendarMethod(stub([att({ method: 'request' })]))).toBe('REQUEST');
  });

  it('parses METHOD line from ics content', () => {
    const ics = 'BEGIN:VCALENDAR\r\nMETHOD:REPLY\r\nEND:VCALENDAR';
    expect(calendarMethod(stub([att({ text: () => ics })]))).toBe('REPLY');
  });

  it('returns undefined when no method found', () => {
    const ics = 'BEGIN:VCALENDAR\r\nEND:VCALENDAR';
    expect(calendarMethod(stub([att({ text: () => ics })]))).toBeUndefined();
  });

  it('prefers attachment method over parsed content', () => {
    const ics = 'BEGIN:VCALENDAR\r\nMETHOD:REPLY\r\nEND:VCALENDAR';
    expect(
      calendarMethod(stub([att({ method: 'request', text: () => ics })]))
    ).toBe('REQUEST');
  });
});
