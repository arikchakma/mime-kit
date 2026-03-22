<div align="center">
  <h2>📨 mime-kit</h2>
  <p>Parse, build, and work with email.</p>
</div>

### What Does It Do?

**mime-kit** gives you everything you need to work with email programmatically — parse raw MIME, build new messages, compose replies, detect bounces, thread conversations, and more.

```ts
import { parse, build, reply, groupByThread } from 'mime-kit';

// Parse raw MIME → Email
const email = await parse(rawMime);

// Build Email → raw MIME
const raw = build({
  from: 'alice@example.com',
  to: 'bob@example.com',
  subject: 'Hello',
  text: 'Hi Bob!',
});

// Compose a reply
const replyRaw = reply(email, { from: 'bob@example.com', text: 'Hey Alice!' });

// Thread a mailbox
const threads = groupByThread(emails);
```

### Acknowledgements

This project is a thin wrapper and wouldn't exist without these excellent libraries:

- [postal-mime](https://github.com/postalsys/postal-mime) - The MIME parser that powers `parse()`. Handles the hard work of decoding headers, MIME parts, and attachments from raw RFC 5322 messages.
- [MIMEText](https://github.com/muratgozel/MIMEText) - The MIME builder behind `build()`. Generates spec-compliant multipart messages with proper boundaries, encoding, and header formatting.

Special thanks to the maintainers and contributors of these projects.

### Contributing

Feel free to submit pull requests, create issues, or spread the word.

### License

MIT &copy; [Arik Chakma](https://x.com/imarikchakma)
