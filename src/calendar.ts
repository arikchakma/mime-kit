import type { Email } from './parse.ts';

function findCalendarAttachment(email: Email) {
  return email.attachments.find(
    (a) => a.mimeType === 'text/calendar' || a.mimeType === 'application/ics'
  );
}

export function isCalendarInvite(email: Email): boolean {
  return findCalendarAttachment(email) !== undefined;
}

export function calendarMethod(email: Email): string | undefined {
  const att = findCalendarAttachment(email);
  if (!att) {
    return undefined;
  }

  if (att.method) {
    return att.method.toUpperCase();
  }

  const content = att.text();
  const match = content.match(/^METHOD:(.+)$/m);
  return match ? match[1].trim().toUpperCase() : undefined;
}
