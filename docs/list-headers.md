# parseListHeaders

Extracts mailing list metadata from an email's headers.

## Signature

```ts
import { parseListHeaders } from 'mime-kit';
import type { ListHeaders } from 'mime-kit';

parseListHeaders(email: Email): ListHeaders
```

**Return type:**

```ts
type ListHeaders = {
  listId: string | undefined; // e.g. "dev.reactjs.org"
  unsubscribe: string[]; // e.g. ["mailto:unsub@list.org", "https://list.org/unsub"]
  post: string | undefined; // e.g. "mailto:dev@reactjs.org"
  archive: string | undefined; // e.g. "https://list.org/archive"
};
```

## What it does

Reads `List-Id`, `List-Unsubscribe`, `List-Post`, and `List-Archive` headers defined in RFC 2369 / RFC 2919. These headers are added by mailing list software (Mailman, Google Groups, Discourse, Listserv) and by bulk senders that comply with RFC 8058.

Angle brackets are automatically unwrapped. `List-Unsubscribe` is parsed as a comma-separated list of `<url>` entries (since it often contains both a mailto and an https link).

## When to use this

**Showing an "Unsubscribe" button.** Gmail, Apple Mail, and Outlook all surface the `List-Unsubscribe` header as an unsubscribe link. If you're building a mail client, parse this header and show the action.

**Filtering mailing list emails.** If `listId` is defined, the email came from a mailing list. Use this to auto-label, sort into folders, or reduce notification priority for list mail vs. direct messages.

**Building a "Mailing Lists" view.** Group emails by `listId` to show the user all their subscriptions in one place, with links to the archive and a way to post or unsubscribe.

## Examples

### Checking if an email is from a mailing list

```ts
import { parse, parseListHeaders } from 'mime-kit';

const email = parse(rawMime);
const list = parseListHeaders(email);

if (list.listId) {
  console.log(`From mailing list: ${list.listId}`);
  // "From mailing list: golang-nuts.googlegroups.com"
}
```

### Rendering an unsubscribe action

```ts
const { unsubscribe } = parseListHeaders(email);

// Prefer the HTTPS link over mailto for one-click unsubscribe
const httpLink = unsubscribe.find((url) => url.startsWith('https://'));
const mailtoLink = unsubscribe.find((url) => url.startsWith('mailto:'));

if (httpLink) {
  showUnsubscribeButton(httpLink); // One-click web unsubscribe
} else if (mailtoLink) {
  showUnsubscribeButton(mailtoLink); // Opens email compose
}
```

### Auto-labeling incoming mail

```ts
import { parse, parseListHeaders, isBounce, isAutoReply } from 'mime-kit';

function classifyEmail(rawMime: string) {
  const email = parse(rawMime);

  if (isBounce(email)) return 'bounce';
  if (isAutoReply(email)) return 'auto-reply';

  const list = parseListHeaders(email);
  if (list.listId) return 'mailing-list';

  return 'direct';
}
```
