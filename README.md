<div align="center">
  <h2>📨 mime-kit</h2>
  <p>Unified MIME parse and build for JavaScript and TypeScript. Two functions, shared vocabulary.</p>
</div>

### What Does It Do?

**mime-kit** wraps [postal-mime](https://github.com/postalsys/postal-mime) (parser) and [MIMEText](https://github.com/muratgozel/MIMEText) (builder) behind a clean, symmetric API. Parse raw MIME into a typed `Email` object, or build raw MIME from a plain input object.

```ts
import { parse, build } from 'mime-kit'

// Parse raw MIME → Email
const email = await parse(rawMime)
console.log(email.from)    // { name: 'Alice', address: 'alice@example.com' }
console.log(email.subject) // 'Hello'
console.log(email.text)    // 'Hi Bob!'

// Build Email → raw MIME
const raw = build({
  from: 'alice@example.com',
  to: 'bob@example.com',
  subject: 'Hello',
  text: 'Hi Bob!',
})
```

> [!NOTE]
> Addresses are always normalized — groups are flattened, array fields are never undefined, and `from`/`sender` are always `Address | undefined`.

### Acknowledgements

This project is a thin wrapper and wouldn't exist without these excellent libraries:

- [postal-mime](https://github.com/postalsys/postal-mime) - The MIME parser that powers `parse()`. Handles the hard work of decoding headers, MIME parts, and attachments from raw RFC 5322 messages.
- [MIMEText](https://github.com/muratgozel/MIMEText) - The MIME builder behind `build()`. Generates spec-compliant multipart messages with proper boundaries, encoding, and header formatting.

Special thanks to the maintainers and contributors of these projects.

### Contributing

Feel free to submit pull requests, create issues, or spread the word.

### License

MIT &copy; [Arik Chakma](https://x.com/imarikchakma)
