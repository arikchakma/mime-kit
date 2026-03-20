# stripSignature

Removes the email signature block from plain-text email content.

## Signature

```ts
import { stripSignature } from 'mime-kit';

stripSignature(text: string): string
```

## What it does

Finds the last occurrence of the RFC 3676 signature delimiter (`\n-- \n` — a line containing exactly two dashes followed by a space) and returns everything before it, with trailing whitespace trimmed.

The delimiter must have a trailing space after `--`. A line with just `--\n` (no space) is **not** treated as a signature delimiter — that pattern is too common in regular prose.

If the text starts with `-- \n` (the entire content is a signature), returns an empty string.

## When to use this

**Reply/forward composition.** Before quoting someone's message in a reply, strip their signature. Nobody wants to quote "Sent from my iPhone" or a 15-line legal disclaimer back at the sender.

**Snippet generation and search indexing.** Signatures add noise. If you're generating previews, feeding text to a search index, or running NLP/AI summarization, strip the signature first so the model focuses on actual content.

**Contact info extraction.** You can also use this the other way: extract the signature block itself (the text after the delimiter) to parse phone numbers, job titles, or social links.

## Examples

### Standard signature removal

```ts
import { stripSignature } from 'mime-kit';

const body = `Hey, the deploy looks good. Ship it.

--
Sarah Chen
Staff Engineer | Infrastructure
sarah@company.com`;

stripSignature(body);
// "Hey, the deploy looks good. Ship it."
```

### --\n without trailing space is ignored

```ts
const text = `Here's the diff:
--
src/index.ts | 5 +++++`;

stripSignature(text);
// Returns the full text unchanged — "--\n" is not a valid delimiter
```

### Multiple delimiters — uses the last one

```ts
const forwarded = `FYI, see below.

--
Alice

---------- Forwarded message ----------
Original content here.

--
Bob`;

stripSignature(forwarded);
// "FYI, see below.\n\n-- \nAlice\n\n---------- Forwarded message ----------\nOriginal content here."
```

Bob's signature is stripped. Alice's remains because it's before the last delimiter.

### Combined with stripQuotedReply for clean extraction

```ts
import { stripQuotedReply, stripSignature } from 'mime-kit';

const raw = `Looks good to me, merging now.

--
Jake

On Tue, Jan 7, Alice wrote:
> Can you approve the PR?`;

const clean = stripSignature(stripQuotedReply(raw));
// "Looks good to me, merging now."
```

Order matters here: strip the quoted reply first (removes the trailing quote), then strip the signature from what remains.
