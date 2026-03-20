# estimateSize

Estimates the final MIME message size in bytes before building it.

## Signature

```ts
import { estimateSize } from 'mime-kit';
import type { BuildInput } from 'mime-kit';

estimateSize(input: BuildInput): number
```

Returns an approximate byte count of what `build(input)` would produce.

## What it does

Calculates the expected wire size of an email without actually encoding it. The estimate accounts for:

| Component | Calculation |
|---|---|
| Headers (MIME boundaries, Content-Type, etc.) | Fixed 500 bytes |
| Text body | UTF-8 byte length |
| HTML body | UTF-8 byte length |
| Each attachment | `rawBytes * 4/3` (base64 expansion) + 200 bytes per attachment header |
| Address fields (from, to, cc, bcc, replyTo) | Sum of name + address lengths |
| Subject | String length |

The 4/3 ratio comes from base64 encoding: every 3 bytes of binary data become 4 ASCII characters. The fixed overheads (500 for headers, 200 per attachment) cover MIME boundary markers, Content-Type/Content-Disposition headers, and line folding.

## When to use this

**Enforcing send limits before the user waits.** SMTP servers typically reject messages over 25MB (Gmail) or 10MB (some corporate relays). Check the estimated size immediately when the user attaches a file, not after they've waited 30 seconds for the message to build and upload.

**Showing "message size" in the compose UI.** Display a live size indicator next to the attach button: "4.2 MB / 25 MB". Users need this feedback before hitting send.

**Rate limiting and quota tracking.** If you're running an email sending service, you might track daily send volume by byte count. `estimateSize` lets you check quotas before building the MIME — avoiding the work of encoding a message you'll reject anyway.

## Examples

### Pre-send size validation

```ts
import { estimateSize, build } from 'mime-kit';
import type { BuildInput } from 'mime-kit';

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB (Gmail limit)

function sendEmail(input: BuildInput) {
  const estimated = estimateSize(input);

  if (estimated > MAX_SIZE) {
    throw new Error(
      `Message too large: ~${(estimated / 1024 / 1024).toFixed(1)} MB exceeds ${MAX_SIZE / 1024 / 1024} MB limit`
    );
  }

  const mime = build(input);
  return smtp.send(mime);
}
```

### Live size indicator in a compose form

```ts
import { estimateSize } from 'mime-kit';

function updateSizeIndicator(draft: BuildInput) {
  const bytes = estimateSize(draft);
  const mb = bytes / (1024 * 1024);

  sizeLabel.textContent = mb < 1
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${mb.toFixed(1)} MB`;

  sizeLabel.classList.toggle('warning', mb > 20);
  sizeLabel.classList.toggle('error', mb > 25);
}

// Call on every attachment add/remove or body change
updateSizeIndicator(currentDraft);
```

### Checking before adding an attachment

```ts
function onAttach(file: File, draft: BuildInput) {
  const withAttachment = {
    ...draft,
    attachments: [
      ...(draft.attachments ?? []),
      { filename: file.name, content: new Uint8Array(await file.arrayBuffer()) },
    ],
  };

  const size = estimateSize(withAttachment);
  if (size > MAX_SIZE) {
    alert(`Adding "${file.name}" would make the message ${(size / 1024 / 1024).toFixed(1)} MB. Limit is 25 MB.`);
    return;
  }

  draft.attachments = withAttachment.attachments;
}
```
