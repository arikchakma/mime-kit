# stripQuotedReply

Removes the trailing quoted reply block from a plain-text email body.

## Signature

```ts
import { stripQuotedReply } from 'mime-kit';

stripQuotedReply(text: string): string
```

## What it does

When someone replies to an email, most clients append the original message below the new content, prefixed with `>`. This function walks the text from the bottom up, removes that trailing quoted block, and also removes the attribution line above it (the "On Jan 1, Alice wrote:" line) if one is present.

It only strips the **last** quoted block. Interleaved quotes in the middle of the text are left alone — those are part of an inline reply and removing them would destroy context.

### Stripping rules

1. Skip trailing blank lines
2. Remove consecutive lines starting with `>`
3. If the line immediately above the quoted block matches `/^.{0,200}:\s*$/` (a short line ending with a colon — the attribution pattern), remove it too
4. Trim trailing whitespace from the result

## When to use this

**Building a reply composer.** When the user hits "Reply" in your email client, you want to show only their previous message text in the editor, not the entire quoted chain. Strip the quoted reply first, then pass the clean text to `quote()` to re-wrap it with fresh `>` prefixes.

**Extracting the latest message from a thread.** If you're building email search, AI summarization, or a notification preview, you want the newest content only — not the entire thread history that every reply drags along.

**CRM / helpdesk ticket parsing.** When a customer replies to a support email, the ticketing system needs just the new message. Without stripping, every reply adds a growing tail of quoted history that clutters the ticket.

## Examples

### Basic reply stripping

```ts
import { stripQuotedReply } from 'mime-kit';

const body = `Thanks, that works for me.

On Mon, Jan 6, 2025, Alice <alice@company.com> wrote:
> Can you review the PR by end of day?
> It's just a small config change.`;

stripQuotedReply(body);
// "Thanks, that works for me."
```

### Inline reply is preserved

```ts
const inlineReply = `> What time works for the meeting?

3pm works for me.

> Should we invite the design team?

Yes, please add them.

On Mon, Jan 6, Alice wrote:
> Original scheduling email content here
> with multiple lines`;

stripQuotedReply(inlineReply);
// "> What time works for the meeting?\n\n3pm works for me.\n\n> Should we invite the design team?\n\nYes, please add them."
```

The inline quotes stay. Only the trailing block (and its attribution) are removed.

### Feeding a reply composer

```ts
import { parse, stripQuotedReply, quote } from 'mime-kit';

const email = parse(rawMime);
const cleanBody = stripQuotedReply(email.text ?? '');
const quoted = quote({ ...email, text: cleanBody });

const replyDraft = `\n\n${quoted}`;
// User types above the quoted block in the composer
```

### No quoted content — returns input unchanged

```ts
stripQuotedReply('Just a plain message with no quotes.');
// "Just a plain message with no quotes."
```
