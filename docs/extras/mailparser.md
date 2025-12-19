---
title: MailParser
sidebar_position: 3
---

MailParser is a streaming email parser for Node.js that can handle very large messages (100MB+) with minimal memory overhead.

MailParser provides two ways to parse email messages:

- **`simpleParser`** - A convenience function that buffers the entire message (including attachments) in memory and returns a single **mail object**. This is ideal for simple use cases and testing where memory usage is not a concern.
- **`MailParser` class** - A lower-level `Transform` stream that emits message parts and attachment _streams_ as they become available. Use this when you need to process large messages without loading everything into memory.

---

## Installation

```bash
npm install mailparser
```

---

## `simpleParser()`

```javascript
const { simpleParser } = require("mailparser");

// Callback style
simpleParser(source, options, (err, mail) => {
  if (err) throw err;
  console.log(mail.subject);
});

// Promise style
simpleParser(source, options)
  .then((mail) => console.log(mail.subject))
  .catch(console.error);

// async/await
const mail = await simpleParser(source, options);
```

### Parameters

- **`source`** - The email message to parse. This can be a `Buffer`, `String`, or **readable stream** containing the raw RFC 822 message.
- **`options`** - Optional configuration object (see [Options](#options) for available settings).

### Returned **mail object**

The resolved `mail` object contains all parsed parts of the message:

| Property        | Type/Notes                                                    |
| --------------- | ------------------------------------------------------------- |
| `headers`       | `Map` of lowercase header keys to their parsed values         |
| `headerLines`   | `Array` of raw header line objects                            |
| `subject`       | `String` - the email subject (shorthand for `headers.get('subject')`) |
| `from`          | **Address object** - the sender (see below)                   |
| `to`            | **Address object** - primary recipients                       |
| `cc`            | **Address object** - carbon copy recipients                   |
| `bcc`           | **Address object** - blind carbon copy recipients             |
| `replyTo`       | **Address object** - reply-to addresses                       |
| `date`          | `Date` object representing when the message was sent          |
| `messageId`     | `String` - unique message identifier                          |
| `inReplyTo`     | `String` - message ID this email is replying to               |
| `references`    | `String` or `String[]` - related message IDs in the thread    |
| `html`          | HTML body with embedded images converted to **data URIs**     |
| `text`          | Plain text body                                               |
| `textAsHtml`    | Plain text body converted to basic HTML                       |
| `attachments`   | `Attachment[]` - array of attachment objects (buffered in memory) |

:::warning Security note
MailParser does not sanitize HTML content. If you display the `html` property in a web page, you must run it through a trusted HTML sanitizer first to prevent XSS attacks.
:::

#### Address object

Address fields (`from`, `to`, `cc`, `bcc`, `replyTo`) are returned as address objects with three representations:

```json
{
  "value": [
    {
      "name": "Jane Doe",
      "address": "jane@example.com"
    }
  ],
  "html": "<span class=\"mp_address_name\">Jane Doe</span> &lt;<a href=\"mailto:jane@example.com\" class=\"mp_address_email\">jane@example.com</a>&gt;",
  "text": "Jane Doe <jane@example.com>"
}
```

- **`value`** - Array of individual address objects, each containing `name` and `address` properties. Group addresses will have a `group` array instead of `address`.
- **`text`** - Human-readable string formatted for plain text contexts.
- **`html`** - HTML-formatted string with mailto links, safe for display in web pages.

For more details on address objects, see the [Message - Addresses](/message/addresses) section.

#### `headers` Map

The `headers` Map contains all message headers, keyed by lowercase header names. Most headers resolve to **strings** (for single occurrences) or **string arrays** (for multiple occurrences of the same header).

The following headers are automatically parsed into richer structures:

- **Address headers** (`from`, `to`, `cc`, `bcc`, `sender`, `reply-to`, `delivered-to`, `return-path`, `disposition-notification-to`) - Parsed into address objects as described above.
- **Priority headers** (`x-priority`, `x-msmail-priority`, `importance`) - Normalized to a single `priority` key with value `"high"`, `"normal"`, or `"low"`.
- **`references`** - Parsed as `String` or `String[]` of message IDs.
- **`date`** - Parsed as a JavaScript `Date` object.
- **Structured headers** (`content-type`, `content-disposition`, `dkim-signature`) - Parsed as `{ value: String, params: Object }`.

---

### Attachment object (simpleParser)

Each attachment in the `attachments` array has the following properties:

| Property             | Notes                                                          |
| -------------------- | -------------------------------------------------------------- |
| `filename`           | File name of the attachment (may be `undefined` if not provided) |
| `contentType`        | MIME type (e.g., `"application/pdf"`, `"image/png"`)           |
| `contentDisposition` | Usually `"attachment"` or `"inline"`                           |
| `checksum`           | MD5 hash of the attachment content (configurable via `checksumAlgo`) |
| `size`               | Size in bytes                                                  |
| `headers`            | `Map` of MIME headers for this attachment part                 |
| `content`            | `Buffer` containing the entire attachment data                 |
| `contentId`          | Content-ID header value (with angle brackets)                  |
| `cid`                | Content-ID without angle brackets, for matching `cid:` URLs    |
| `related`            | `true` if the attachment is inline content (e.g., embedded image referenced in HTML) |

---

## `MailParser` (stream API)

For processing large messages without loading everything into memory, use the `MailParser` class directly:

```javascript
const { MailParser } = require("mailparser");

const parser = new MailParser(options);
sourceStream.pipe(parser);
```

`MailParser` is a `Transform` stream in **object mode** that emits two types of objects via the `'data'` event:

1. **`{ type: 'attachment', ... }`** - Emitted for each attachment. The `content` property is a **Readable stream** that you must consume.
2. **`{ type: 'text', html, text, textAsHtml }`** - Emitted once after all parts are processed, containing the message bodies.

### Header events

`MailParser` also emits two events for accessing email headers:

1. **`'headers'`** - Emits a `Map` of parsed header keys to their values. Fired once when headers are fully parsed.
2. **`'headerLines'`** - Emits an `Array` of objects with `key` and `line` properties containing the raw header data.

```javascript
parser.on("headers", (headers) => {
  console.log("Subject:", headers.get("subject"));
  console.log("From:", headers.get("from"));
});
```

### Stream options {#options}

The following options can be passed to both `simpleParser()` and `new MailParser()`:

| Option                 | Default      | Description                                                            |
| ---------------------- | ------------ | ---------------------------------------------------------------------- |
| `skipHtmlToText`       | `false`      | Do not generate `text` from HTML when no plain text part exists        |
| `maxHtmlLengthToParse` | `Infinity`   | Maximum HTML size in bytes to process for text conversion              |
| `formatDateString`     | `undefined`  | Custom function to format Date objects as strings                      |
| `skipImageLinks`       | `false`      | Keep `cid:` image URLs as-is instead of converting to data URIs        |
| `skipTextToHtml`       | `false`      | Do not generate `textAsHtml` from plain text                           |
| `skipTextLinks`        | `false`      | Do not auto-detect and linkify URLs in plain text                      |
| `keepDeliveryStatus`   | `false`      | Treat `message/delivery-status` parts as attachments instead of text   |
| `checksumAlgo`         | `'md5'`      | Hash algorithm for attachment checksums (e.g., `'sha256'`, `'sha512'`) |
| `Iconv`                | `iconv-lite` | Alternative iconv implementation for character set conversion          |
| `keepCidLinks`         | `false`      | **simpleParser only** - Keep `cid:` URLs instead of converting to data URIs (same as `skipImageLinks: true`) |

### Attachment stream object (`type === 'attachment'`)

When using the `MailParser` stream API, attachment objects have the same properties as described above, with these important differences:

- **`content`** is a **Readable stream**, not a Buffer. You must consume this stream to get the attachment data.
- **You must call `attachment.release()`** when you are finished processing the attachment. Parsing is paused until every attachment is released, which prevents memory from growing unbounded.
- **`related`** is only available after parsing completes (in the `'end'` event), not when the attachment is first emitted.

```javascript
const fs = require("fs");

parser.on("data", (part) => {
  if (part.type === "attachment") {
    console.log("Saving attachment:", part.filename);

    // Pipe the attachment stream to a file
    const output = fs.createWriteStream(part.filename);
    part.content.pipe(output);

    // Release the attachment when the stream finishes
    output.on("finish", () => {
      part.release();
    });
  }
});

parser.on("end", () => {
  console.log("Parsing complete");
});
```

---

## Character set decoding

MailParser uses [iconv-lite](https://www.npmjs.com/package/iconv-lite) for converting character encodings to UTF-8. The exceptions are **ISO-2022-JP** and **EUC-JP** encodings, which are handled by [encoding-japanese](https://www.npmjs.com/package/encoding-japanese) for better accuracy.

If you prefer to use [`node-iconv`](https://www.npmjs.com/package/iconv) instead of iconv-lite (for example, to support additional encodings), you can inject it via the `Iconv` option:

```javascript
const { Iconv } = require("iconv");
const { simpleParser } = require("mailparser");

simpleParser(rfc822Message, { Iconv })
  .then((mail) => {
    console.log(mail.subject);
  });
```

---

## License

MailParser is dual-licensed under the **MIT License** or **EUPL v1.1+** (European Union Public License). You may choose whichever license best suits your project.
