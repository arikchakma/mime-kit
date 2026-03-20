# isAutoReply

Detects whether an email is an automated reply (out-of-office, vacation responder, auto-acknowledgment).

## Signature

```ts
import { isAutoReply } from 'mime-kit';

isAutoReply(email: Email): boolean
```

## What it does

Checks four header signals that indicate the message was machine-generated:

| Header | Condition | Set by |
|---|---|---|
| `Auto-Submitted` | Present and not `"no"` (RFC 3834) | Standards-compliant servers |
| `X-Auto-Response-Suppress` | Present (any value) | Microsoft Exchange / Outlook |
| `Precedence` | `"auto_reply"` or `"bulk"` | Legacy systems, mailing lists |
| `X-Autoreply` / `X-Autorespond` | Present (any value) | Various mail servers |

Any one match returns `true`.

## When to use this

**Preventing auto-reply loops.** This is the primary use case. If your system sends automated responses (out-of-office, ticket acknowledgments, welcome emails), you must check `isAutoReply()` on every incoming message. Sending an auto-reply to another auto-reply creates an infinite loop. RFC 3834 explicitly requires this check.

**Suppressing notifications.** If your app sends push notifications for new emails, auto-replies are low-value noise. Detect them and skip the notification, or show it in a quieter channel.

**Email analytics.** When measuring response rates or time-to-reply for a sales or support team, exclude auto-replies from the dataset. An out-of-office reply at 2am isn't a real response.

## Examples

### Auto-reply loop prevention

```ts
import { parse, isBounce, isAutoReply, build } from 'mime-kit';

function processInbound(rawMime: string) {
  const email = parse(rawMime);

  // The two checks you must always do before sending any automated response
  if (isBounce(email)) return;
  if (isAutoReply(email)) return;

  // Safe to send an auto-acknowledgment
  const ack = build({
    from: 'support@company.com',
    to: email.from?.address ?? '',
    subject: `Re: ${email.subject}`,
    text: 'We received your message and will respond within 24 hours.',
    autoSubmitted: 'auto-replied',  // Mark our own reply so others can detect it
  });

  sendEmail(ack);
}
```

Note that when you send an auto-reply, you set `autoSubmitted: 'auto-replied'` on your own message so that other systems can detect it too.

### Filtering notification-worthy emails

```ts
import { parse, isAutoReply, isBounce, parseListHeaders } from 'mime-kit';

function shouldNotify(rawMime: string): boolean {
  const email = parse(rawMime);

  if (isAutoReply(email)) return false;
  if (isBounce(email)) return false;
  if (parseListHeaders(email).listId) return false; // mailing list

  return true;
}
```

### Labeling in an inbox

```ts
const email = parse(rawMime);

if (isAutoReply(email)) {
  label = 'auto-reply';    // Gray it out, lower priority
}
```
