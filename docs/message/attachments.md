---
title: Attachments
sidebar_position: 11
---

Use the `attachments` option of the [message object](/message) to attach files.

An attachment is an object inside the `attachments` array. You can attach **as many files as you need**.

| Property             | Type                         | Description                                                                                                                                       |
| -------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `filename`           | `string`                     | Name that will be displayed to the recipient. Unicode is allowed.                                                                                 |
| `content`            | `string \| Buffer \| Stream` | Contents of the file.                                                                                                                             |
| `path`               | `string`                     | Filesystem path or URL (including data URIs). Nodemailer streams the file instead of reading it fully into memory—recommended for large files.    |
| `href`               | `string`                     | HTTP(S) URL that Nodemailer should fetch and attach.                                                                                              |
| `httpHeaders`        | `object`                     | Custom HTTP headers for `href`, for example `{ authorization: 'Bearer …' }`.                                                                      |
| `contentType`        | `string`                     | Explicit [MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Defaults to the type inferred from `filename`. |
| `contentDisposition` | `string`                     | Content‑Disposition header. Defaults to `'attachment'`.                                                                                           |
| `cid`                | `string`                     | Content‑ID for embedding the attachment inline in the HTML body (`<img src="cid:my-logo"/>`).                                                     |
| `encoding`           | `string`                     | Encoding applied when `content` is a string (e.g. `'base64'`, `'hex'`).                                                                           |
| `contentTransferEncoding` | `string`                | Content-Transfer-Encoding header value (e.g. `'base64'`, `'quoted-printable'`, `'7bit'`, `'8bit'`). Defaults to `'base64'` for most attachments. |
| `headers`            | `object`                     | Custom headers for the individual MIME node.                                                                                                      |
| `raw`                | `string`                     | **Advanced**: Full pre‑built MIME node including headers. Overrides every other field.                                                            |

:::tip Streaming vs. in‑memory
Prefer `path`, `href`, or a `Stream` when attaching large files so that Nodemailer can stream data without loading it all into memory.
:::

## Examples

```javascript
const fs = require("fs");

// inside a message object
attachments: [
  // 1. Plain text
  {
    filename: "hello.txt",
    content: "Hello world!",
  },

  // 2. Binary (Buffer)
  {
    filename: "buffer.txt",
    content: Buffer.from("Hello world!", "utf8"),
  },

  // 3. Local file (streamed)
  {
    filename: "report.pdf",
    path: "/absolute/path/to/report.pdf",
  },

  // 4. Implicit filename & type (derived from path)
  {
    path: "/absolute/path/to/image.png",
  },

  // 5. Readable stream
  {
    filename: "notes.txt",
    content: fs.createReadStream("./notes.txt"),
  },

  // 6. Custom content‑type
  {
    filename: "data.bin",
    content: Buffer.from("deadbeef", "hex"),
    contentType: "application/octet-stream",
  },

  // 7. Remote file
  {
    filename: "license.txt",
    href: "https://raw.githubusercontent.com/nodemailer/nodemailer/master/LICENSE",
  },

  // 8. Base64‑encoded string
  {
    filename: "photo.jpg",
    content: "/9j/4AAQSkZJRgABAQAAAQABAAD…", // truncated
    encoding: "base64",
  },

  // 9. Data URI
  {
    path: "data:text/plain;base64,SGVsbG8gd29ybGQ=",
  },

  // 10. Pre‑built MIME node
  {
    raw: ["Content-Type: text/plain; charset=utf-8", 'Content-Disposition: attachment; filename="greeting.txt"', "", "Hello world!"].join("\r\n"),
  },
];
```

## Embedding images

To embed an image inside the HTML part of the email, set a `cid` on the attachment and reference that CID in the HTML:

```javascript
attachments: [
  {
    filename: 'logo.png',
    path: './assets/logo.png',
    cid: 'logo@nodemailer'
  }
],
html: '<p><img src="cid:logo@nodemailer" alt="Nodemailer logo"></p>'
```
