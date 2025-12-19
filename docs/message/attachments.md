---
title: Attachments
sidebar_position: 11
description: Attach files using various content sources - strings, buffers, streams, files, or URLs.
---

To attach files to an email, use the `attachments` option of the [message object](../). The `attachments` option accepts an array of attachment objects, and you can include **as many files as you need**.

Each attachment object supports the following properties:

| Property             | Type                         | Description                                                                                                                                       |
| -------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `filename`           | `string`                     | The filename that will be shown to recipients. Unicode characters are supported.                                                                  |
| `content`            | `string \| Buffer \| Stream` | The attachment contents. Can be a string, a Buffer, or a readable stream.                                                                         |
| `path`               | `string`                     | A file path, URL, or data URI. Nodemailer streams the file directly instead of loading it entirely into memory, making this the recommended approach for large files. |
| `href`               | `string`                     | An HTTP or HTTPS URL. Nodemailer will fetch the content from this URL and include it as an attachment.                                            |
| `httpHeaders`        | `object`                     | Custom HTTP headers to send when fetching content from `href`. For example: `{ authorization: 'Bearer token123' }`.                               |
| `contentType`        | `string`                     | The [MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) of the attachment. If not specified, Nodemailer will attempt to detect it from the `filename` or `path`. |
| `contentDisposition` | `string`                     | The Content-Disposition header value. Defaults to `'attachment'`. Use `'inline'` for embedded content like images referenced in HTML.              |
| `cid`                | `string`                     | A Content-ID value for referencing the attachment in HTML content. Use this with `<img src="cid:your-cid-value"/>` to [embed images inline](./embedded-images). |
| `encoding`           | `string`                     | Specifies how to decode the `content` string. Common values include `'base64'`, `'hex'`, and `'utf8'`.                                            |
| `contentTransferEncoding` | `string`                | The Content-Transfer-Encoding header value. Supported values are `'base64'`, `'quoted-printable'`, `'7bit'`, and `'8bit'`. Defaults to `'base64'` for most attachments. |
| `headers`            | `object`                     | Additional [custom headers](./custom-headers) to add to this specific attachment's MIME node.                                                     |
| `raw`                | `string`                     | **Advanced**: A complete, pre-built MIME node including all headers. When specified, this overrides all other attachment properties.              |

:::tip Streaming vs. in-memory
For large files, prefer using `path`, `href`, or a readable stream for the `content` property. This allows Nodemailer to stream the data incrementally rather than loading the entire file into memory at once.
:::

## Examples

The following examples demonstrate different ways to attach files to an email message.

```javascript
const fs = require("fs");

// The attachments array goes inside your message object
attachments: [
  // 1. Plain text string
  // The simplest way to create an attachment from a string
  {
    filename: "hello.txt",
    content: "Hello world!",
  },

  // 2. Buffer content
  // Useful when you have binary data in memory
  {
    filename: "buffer.txt",
    content: Buffer.from("Hello world!", "utf8"),
  },

  // 3. File from the filesystem
  // Uses streaming, which is memory-efficient for large files
  {
    filename: "report.pdf",
    path: "/absolute/path/to/report.pdf",
  },

  // 4. File path only
  // When you omit filename, Nodemailer derives it from the path
  // The content type is also automatically detected from the file extension
  {
    path: "/absolute/path/to/image.png",
  },

  // 5. Readable stream
  // Provides full control over how content is read
  {
    filename: "notes.txt",
    content: fs.createReadStream("./notes.txt"),
  },

  // 6. Explicit content type
  // Override automatic MIME type detection when needed
  {
    filename: "data.bin",
    content: Buffer.from("deadbeef", "hex"),
    contentType: "application/octet-stream",
  },

  // 7. Remote URL
  // Nodemailer fetches the content from the URL when sending
  {
    filename: "license.txt",
    href: "https://raw.githubusercontent.com/nodemailer/nodemailer/master/LICENSE",
  },

  // 8. Base64-encoded string
  // Specify the encoding when your content string is not plain text
  {
    filename: "photo.jpg",
    content: "/9j/4AAQSkZJRgABAQAAAQABAAD...", // base64 image data (truncated)
    encoding: "base64",
  },

  // 9. Data URI
  // Useful for inline data or content from canvas elements
  {
    path: "data:text/plain;base64,SGVsbG8gd29ybGQ=",
  },

  // 10. Pre-built MIME node (advanced)
  // Provides complete control over the attachment's MIME structure
  {
    raw: [
      "Content-Type: text/plain; charset=utf-8",
      'Content-Disposition: attachment; filename="greeting.txt"',
      "",
      "Hello world!"
    ].join("\r\n"),
  },
];
```

## Embedding images

You can embed images directly in the HTML body of your email instead of displaying them as downloadable attachments. To do this, assign a Content-ID (`cid`) to the attachment and reference it in your HTML using the `cid:` URL scheme. For more details and examples, see the [embedded images](./embedded-images) page.

The `cid` value can be any unique string. A common convention is to use an email-like format (for example, `logo@nodemailer`), but this is not required.

```javascript
{
  attachments: [
    {
      filename: 'logo.png',
      path: './assets/logo.png',
      cid: 'logo@nodemailer' // unique identifier for this attachment
    }
  ],
  html: '<p><img src="cid:logo@nodemailer" alt="Nodemailer logo"></p>'
}
```

When an attachment has a `cid` and the content type is an image, Nodemailer automatically sets the Content-Disposition to `inline` rather than `attachment`, so the image displays within the email body rather than appearing as a downloadable file.
