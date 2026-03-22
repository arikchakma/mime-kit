# isCalendarInvite / calendarMethod

Detect calendar invites and extract their method (REQUEST, REPLY, CANCEL, etc.).

## Signatures

```ts
import { isCalendarInvite, calendarMethod } from 'mime-kit';

isCalendarInvite(email: Email): boolean
calendarMethod(email: Email): string | undefined
```

## What they do

**`isCalendarInvite`** checks whether any attachment has MIME type `text/calendar` or `application/ics`. These are the two standard types for iCalendar data (RFC 5545).

**`calendarMethod`** finds the calendar attachment and returns its method, uppercased. It checks two sources in order:

1. The `method` property on the attachment (set by the MIME `Content-Type` parameter: `text/calendar; method=REQUEST`)
2. If not available, parses the `METHOD:` line from the iCalendar text content itself

Common methods and what they mean:

| Method    | Meaning                                                     |
| --------- | ----------------------------------------------------------- |
| `REQUEST` | New invite or updated invite — "please attend this event"   |
| `REPLY`   | Attendee responding to an invite (accept/decline/tentative) |
| `CANCEL`  | Organizer cancelled the event                               |
| `COUNTER` | Attendee proposing a different time                         |
| `PUBLISH` | Event published for information only (no RSVP expected)     |

## When to use this

**Rendering calendar-specific UI.** When an email contains an invite, you want to show event details (time, location, attendees) and action buttons (Accept / Decline / Tentative) instead of just the email body. `isCalendarInvite` tells you when to switch to this view.

**Routing calendar actions.** The method determines what your app does with the invite. A `REQUEST` shows accept/decline buttons. A `CANCEL` removes the event from the user's calendar. A `REPLY` updates the attendee's status. You need `calendarMethod` to branch on this.

**Calendar sync pipelines.** If you're building a service that syncs email invites to a calendar backend (Google Calendar, CalDAV), you parse incoming mail, check `isCalendarInvite`, extract the method and the iCalendar data, and apply the appropriate operation.

## Examples

### Showing invite UI in a mail client

```ts
import { parse, isCalendarInvite, calendarMethod } from 'mime-kit';

const email = parse(rawMime);

if (isCalendarInvite(email)) {
  const method = calendarMethod(email);

  switch (method) {
    case 'REQUEST':
      showInviteCard(email); // "Meeting: Q1 Planning — Accept / Decline / Tentative"
      break;
    case 'CANCEL':
      showCancellationNotice(email); // "Meeting cancelled: Q1 Planning"
      break;
    case 'REPLY':
      updateAttendeeStatus(email); // "Bob accepted: Q1 Planning"
      break;
    default:
      showGenericCalendarView(email);
  }
} else {
  showNormalEmailView(email);
}
```

### Extracting the .ics attachment for processing

```ts
import { parse, isCalendarInvite } from 'mime-kit';

const email = parse(rawMime);

if (isCalendarInvite(email)) {
  const icsAttachment = email.attachments.find(
    (a) => a.mimeType === 'text/calendar' || a.mimeType === 'application/ics'
  );

  // Get the raw iCalendar text for parsing with a dedicated library (e.g., ical.js)
  const icsText = icsAttachment.text();
  const event = icalParser.parse(icsText);

  console.log(event.summary); // "Q1 Planning"
  console.log(event.dtstart); // 2025-02-01T10:00:00Z
  console.log(event.location); // "Room 4A / Zoom"
}
```

### Filtering calendar noise from inbox

```ts
import { parse, isCalendarInvite, calendarMethod } from 'mime-kit';

function inboxPriority(rawMime: string): 'normal' | 'low' {
  const email = parse(rawMime);

  // REPLY methods ("Bob accepted your invite") are low priority — they're status updates, not action items
  if (isCalendarInvite(email) && calendarMethod(email) === 'REPLY') {
    return 'low';
  }

  return 'normal';
}
```
