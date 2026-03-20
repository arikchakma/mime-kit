# groupByThread

Groups a flat list of emails into threaded conversation trees.

## Signature

```ts
import { groupByThread } from 'mime-kit';
import type { ThreadTree } from 'mime-kit';

groupByThread(emails: Email[]): ThreadTree[]
```

**Return type:**

```ts
type ThreadTree = {
  email: Email;
  children: ThreadTree[];
};
```

Returns an array of root nodes. Each root is the start of a conversation, and its `children` are direct replies, which themselves can have `children`, forming a tree.

## What it does

1. **Builds a lookup map** of `messageId → node` for all emails that have a `messageId`.
2. **Links each email to its parent.** Uses `inReplyTo` (first choice) or the last entry in `references` as the parent ID.
3. **Cycle detection.** Before linking child → parent, checks whether the parent is already a descendant of the child. If so, the child becomes a root instead of creating a cycle.
4. **Emails without a messageId** or without a matching parent in the dataset are placed as roots.
5. **Sorts** roots and children by date (ascending).

## When to use this

**Thread view in a mail client.** Every email client needs to display conversations as trees. Gmail uses a flat-thread approach (all messages in a thread shown linearly), but clients like Thunderbird, Apple Mail, and Fastmail show the actual tree structure. This function gives you that tree.

**Conversation display in a helpdesk.** When rendering a support ticket that originated from email, you want to show the back-and-forth as a structured conversation, not a flat list sorted by date.

**Thread summarization.** If you're using AI to summarize email threads, feeding it a tree structure lets the model understand which message is replying to which — producing better summaries than a flat chronological list.

## Examples

### Basic thread grouping

```ts
import { parse, groupByThread } from 'mime-kit';

const emails = rawMimeMessages.map(parse);
const threads = groupByThread(emails);

for (const thread of threads) {
  console.log(`Thread root: ${thread.email.subject}`);
  console.log(`  ${thread.children.length} direct replies`);
}
```

### Rendering a tree view

```ts
import { groupByThread } from 'mime-kit';
import type { ThreadTree } from 'mime-kit';

function renderThread(node: ThreadTree, depth = 0): string {
  const indent = '  '.repeat(depth);
  const from = node.email.from?.address ?? 'unknown';
  const date = node.email.date?.toLocaleDateString() ?? '';
  let output = `${indent}${from} (${date}): ${node.email.subject}\n`;

  for (const child of node.children) {
    output += renderThread(child, depth + 1);
  }
  return output;
}

const threads = groupByThread(emails);
for (const root of threads) {
  console.log(renderThread(root));
}
```

Output:

```
alice@company.com (1/6/2025): Deploy schedule for Q1
  bob@company.com (1/6/2025): Re: Deploy schedule for Q1
    alice@company.com (1/7/2025): Re: Deploy schedule for Q1
  carol@company.com (1/7/2025): Re: Deploy schedule for Q1
```

### Counting messages per thread

```ts
function threadSize(node: ThreadTree): number {
  return 1 + node.children.reduce((sum, c) => sum + threadSize(c), 0);
}

const threads = groupByThread(emails);
const largest = threads.reduce((max, t) =>
  threadSize(t) > threadSize(max) ? t : max
);

console.log(`Largest thread: "${largest.email.subject}" with ${threadSize(largest)} messages`);
```

### Handling missing parents gracefully

When your dataset doesn't include every email in a thread (e.g., you only synced the last 30 days), some replies will reference a parent that isn't in the list. These become standalone roots:

```ts
const emails = last30Days.map(parse);
const threads = groupByThread(emails);

// A reply to a 2-month-old email appears as its own root
// because the parent isn't in the dataset.
// This is expected — you get the best tree possible from the data you have.
```
