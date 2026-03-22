# quote

Converts an email's body into `>` prefixed quoted text for use in replies.

## Signature

```ts
import { quote } from 'mime-kit';

quote(email: Email, maxLines?: number): string
```

**Parameters:**

- `email` — A parsed `Email` object. Uses `email.text` if available, falls back to converting `email.html` via `textFromHtml()`.
- `maxLines` — Optional. Truncate the quoted output to this many lines.

## What it does

Takes the email body, splits it into lines, optionally truncates, then prefixes each line with `> `. Empty lines get a bare `>` (no trailing space) to keep diffs clean and comply with standard email quoting conventions.

## When to use this

**Building "Reply" and "Reply All" flows.** When the user clicks reply, you need the original message wrapped in `>` quotes below their cursor. This is the function that does it.

**Forwarding with inline quoting.** Some clients forward messages inline-quoted rather than as attachments. `quote()` gives you the formatted block.

**Generating email previews in notification bodies.** When a notification says "Alice replied to your message", you might include a truncated quoted version of the original below the new content.

## Examples

### Basic quoting

```ts
import { parse, quote } from 'mime-kit';

const email = parse(rawMime);
const quoted = quote(email);
// "> Thanks for the update.\n> The new design looks great.\n>\n> — Alice"
```

### Truncating long emails

```ts
const quoted = quote(email, 5);
// Only the first 5 lines are quoted — useful for mobile notifications
// or reply drafts where you don't want to quote a 200-line email
```

### Building a full reply body

```ts
import {
  parse,
  reply,
  quote,
  stripSignature,
  stripQuotedReply,
} from 'mime-kit';

const original = parse(rawMime);
const headers = reply(original, { from: 'me@company.com' });

// Clean the original before quoting: remove their sig and any prior quoted chain
const cleanText = stripSignature(stripQuotedReply(original.text ?? ''));
const cleanEmail = { ...original, text: cleanText };

const replyBody = `Sounds good, I'll handle it.\n\n${quote(cleanEmail)}`;
```

Result:

```
Sounds good, I'll handle it.

> Hey, can you take a look at the failing
> tests on the staging branch?
```

### HTML fallback

```ts
// If the email only has HTML content (no plain text part),
// quote() automatically converts it to text first
const htmlOnly = parse(htmlOnlyMime);
console.log(htmlOnly.text); // undefined
console.log(htmlOnly.html); // "<p>Meeting moved to 3pm</p>"

quote(htmlOnly);
// "> Meeting moved to 3pm"
```
