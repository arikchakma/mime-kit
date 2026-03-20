# readReceipt

Extracts the read receipt request address from an email.

## Signature

```ts
import { readReceipt } from 'mime-kit';

readReceipt(email: Email): string | undefined
```

Returns the email address that requested a read receipt (MDN), or `undefined` if no receipt was requested.

## What it does

Reads the `Disposition-Notification-To` header (RFC 8098). This header is how a sender requests that the recipient's mail client send back a Message Disposition Notification when the email is read.

The header value can be a bare address (`alice@example.com`) or a full mailbox format (`"Alice Smith" <alice@example.com>`). This function extracts just the email address in both cases.

## When to use this

**Prompting the user to send a read receipt.** When you detect this header, show the user a prompt: "The sender requested a read receipt. Send one?" This is what Outlook, Thunderbird, and Apple Mail do.

**Tracking which emails request receipts.** In a corporate email environment, you might want to flag or log emails that request read receipts for compliance or analytics.

**Filtering receipt-hungry senders.** Some users want to auto-decline all read receipt requests. Detect the header and suppress the prompt based on user preferences.

## Examples

### Checking for a read receipt request

```ts
import { parse, readReceipt } from 'mime-kit';

const email = parse(rawMime);
const receiptTo = readReceipt(email);

if (receiptTo) {
  // Show UI: "Bob <bob@company.com> requested a read receipt"
  promptSendReceipt(receiptTo);
}
```

### Handling different header formats

```ts
// Angle bracket format: "Bob Jones" <bob@company.com>
readReceipt(email);  // "bob@company.com"

// Bare address format: bob@company.com
readReceipt(email);  // "bob@company.com"

// No header present
readReceipt(email);  // undefined
```

### Building a read receipt response

```ts
import { parse, readReceipt, build } from 'mime-kit';

const email = parse(rawMime);
const receiptTo = readReceipt(email);

if (receiptTo && userWantsToSendReceipt) {
  const mdn = build({
    from: 'me@company.com',
    to: receiptTo,
    subject: `Read: ${email.subject}`,
    text: `Your message "${email.subject}" was read on ${new Date().toISOString()}.`,
    headers: {
      'Content-Type': 'multipart/report; report-type=disposition-notification',
    },
  });
}
```
