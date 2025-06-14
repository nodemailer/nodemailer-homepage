---
title: MailParser
sidebar_position: 3
---

Streaming e‑mail parser for Node.js that can handle very large messages with minimal memory overhead.

MailParser offers two ways to consume a message:

- **`simpleParser`** – convenience helper that buffers the whole message (including attachments) in memory and returns a single **mail object**. Great for simple use‑cases and tests.
- **`MailParser` class** – a lower‑level `Transform` stream that emits message parts and attachment _streams_ as they become available, letting you process huge messages without blowing up memory.

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

- **`source`** – a `Buffer`, `String`, or **readable stream** containing the RFC 822 message.
- **`options`** – optional configuration (see [Options](#options)).

### Returned **mail object**

The resolved `mail` object aggregates every piece of the message:

| Property                              | Type/Notes                                            |
| ------------------------------------- | ----------------------------------------------------- |
| `headers`                             | `Map` of lowercase header keys → parsed values        |
| `subject`                             | `String` – shorthand for `headers.get('subject')`     |
| `from`, `to`, `cc`, `bcc`, `reply-to` | **Address object** (see below)                        |
| `date`                                | `Date` object                                         |
| `messageId`                           | `String`                                              |
| `inReplyTo`                           | `String`                                              |
| `references`                          | `String[] \| String`                                  |
| `html`                                | HTML body with _cid:_ images inlined as **data URIs** |
| `text`                                | Plain‑text body                                       |
| `textAsHtml`                          | `text` rendered as basic HTML                         |
| `attachments`                         | `Attachment[]` (buffered in memory)                   |

:::warning Security note
No sanitisation is performed. If you display `html`, make sure to run it through a trusted HTML‑sanitiser first.
:::

#### Address object

```json
{
  "value": [
    {
      "name": "Jane Doe",
      "address": "jane@example.com"
    }
  ],
  "html": "<span class=\"mp_address_name\">Jane Doe</span> &lt;<a href=\"mailto:jane@example.com\" class=\"mp_address_email\">jane@example.com</a>&gt;",
  "text": "Jane Doe <jane@example.com>"
}
```

- `value` – array of individual addresses (or groups)
- `text` – formatted for plaintext context
- `html` – formatted for HTML context

For a deep dive into address objects see the [Message → Addresses](/message/addresses) section.

#### `headers` Map quirks

Most headers resolve to **strings** (single header) or **string\[]** (multiple occurrences). The following are parsed into richer structures for convenience:

- **Address headers** → address objects (`from`, `to`, `cc`, `bcc`, `sender`, `reply-to`, `delivered-to`, `return-path`).
- **Priority headers** (`x-priority`, `importance`, …) are normalised to a single `priority` key with values **`"high" | "normal" | "low"`**.
- **`references`** → `String` | `String[]`.
- **`date`** → `Date`.
- **Structured headers** (`content-type`, `content-disposition`, `dkim-signature`) → `{ value: String, params: Object }`.

---

### Attachment object (simpleParser)

| Property             | Notes                                                |
| -------------------- | ---------------------------------------------------- |
| `filename`           | File name (may be `undefined`)                       |
| `contentType`        | MIME type                                            |
| `contentDisposition` | Usually `"attachment"`                               |
| `checksum`           | MD5 hash of `content`                                |
| `size`               | Bytes                                                |
| `headers`            | `Map` of MIME headers for this node                  |
| `content`            | `Buffer` with the entire attachment                  |
| `contentId` / `cid`  | Content‑ID (without angle brackets)                  |
| `related`            | `true` if the part is _inline_ (e.g. embedded image) |

---

## `MailParser` (stream API)

```javascript
const { MailParser } = require("mailparser");

const parser = new MailParser(options);
sourceStream.pipe(parser);
```

`MailParser` is a `Transform` stream in **object mode** that emits two kinds of objects via the `'data'` event:

1. **`{ type: 'headers', headers: Map }`** – once, after the headers are parsed.
2. **`{ type: 'attachment', ... }`** – for every attachment (see below).
   The `content` property is a **Readable stream**.
3. **`{ type: 'text', html, text, textAsHtml }`** – once, containing the message bodies.

### Stream options {#options}

| Option                 | Default      | Description                                                |
| ---------------------- | ------------ | ---------------------------------------------------------- |
| `skipHtmlToText`       | `false`      | Do not generate `text` from HTML                           |
| `maxHtmlLengthToParse` | `Infinity`   | Limit HTML size in bytes                                   |
| `formatDateString`     | `undefined`  | Custom date → string formatter                             |
| `skipImageLinks`       | `false`      | Leave _cid:_ links untouched                               |
| `skipTextToHtml`       | `false`      | Do not generate `textAsHtml`                               |
| `skipTextLinks`        | `false`      | Skip link‑autodetection in `text`                          |
| `keepDeliveryStatus`   | `false`      | Treat `message/delivery-status` parts as attachments       |
| `Iconv`                | `iconv-lite` | Alternative iconv implementation                           |
| `keepCidLinks`         | `false`      | **simpleParser‑only** – synonym for `skipImageLinks: true` |

### Attachment stream object (`type === 'attachment'`)

Identical shape to the buffered object shown earlier, except:

- `content` is a **Readable stream**.
- You **must** call `attachment.release()` when you are done. Parsing pauses until every attachment is released.
- `related` is only available _after_ parsing ends.

```javascript
parser.on("data", (part) => {
  if (part.type === "attachment") {
    console.log("Attachment:", part.filename);
    part.content.pipe(fs.createWriteStream(part.filename)).on("finish", part.release);
  }
});
```

---

## Character set decoding

MailParser relies on [iconv‑lite](https://www.npmjs.com/package/iconv-lite) for charset conversion, except for **ISO‑2022‑JP** and **EUC‑JP** which are handled by [encoding‑japanese](https://www.npmjs.com/package/encoding-japanese).

If you prefer [`node-iconv`](https://www.npmjs.com/package/iconv), inject it:

```javascript
const { Iconv } = require('iconv');
const { simpleParser } = require('mailparser');

simpleParser(rfc822Message, { Iconv })
  .then(mail => /* … */);
```

---

## License

Dual‑licensed under the **MIT License** or **EUPL v1.1 +**.
