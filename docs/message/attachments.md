---
title: Attachments
sidebar_position: 2
description: Attach files using various content sources - strings, buffers, streams, files, or URLs.
---

To attach files to an email, use the `attachments` option of the [message object](../). The `attachments` option accepts an array of attachment objects, and you can include **as many files as you need**.

Each attachment object supports the following properties:

| Property             | Type                         | Description                                                                                                                                       |
| -------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `filename`           | `string \| false`            | The filename that will be shown to recipients. Unicode characters are supported. If omitted, the filename is derived from `path`/`href` or auto-generated as `attachment-N.ext`. Set to `false` to omit the filename from the generated headers entirely. |
| `content`            | `string \| Buffer \| Stream` | The attachment contents. Can be a string, a Buffer, or a Node.js readable stream (`stream.Readable`). A WHATWG `ReadableStream` (such as the `body` returned by `fetch()`) is not accepted directly - convert it with `Readable.fromWeb()` first. |
| `path`               | `string`                     | A file path, URL, or data URI. File paths are streamed from disk and HTTP(S) URLs are streamed from the network, making this the recommended approach for large files. Data URIs are decoded into memory and limited to 50&nbsp;MB of encoded data. |
| `href`               | `string`                     | An HTTP or HTTPS URL. Nodemailer will fetch the content from this URL and include it as an attachment.                                            |
| `httpHeaders`        | `object`                     | Custom HTTP headers to send when fetching content from `href`. For example: `{ authorization: 'Bearer token123' }`.                               |
| `tls`                | `object`                     | TLS settings for an HTTPS `href` fetch, passed through to [`tls.connect()`](https://nodejs.org/api/tls.html#tlsconnectoptions-callback). Certificates are validated by default; see [Fetching over HTTPS](#fetching-over-https). |
| `contentType`        | `string`                     | The [MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) of the attachment. If not specified, Nodemailer will attempt to detect it from the `filename`, `path`, or `href`, falling back to `application/octet-stream`. |
| `contentDisposition` | `string`                     | The Content-Disposition header value. Defaults to `'attachment'`, with two exceptions: attachments with a `message/*` content type and image attachments that have a `cid` default to `'inline'`. |
| `cid`                | `string`                     | A Content-ID value for referencing the attachment in HTML content. Use this with `<img src="cid:your-cid-value"/>` to [embed images inline](./embedded-images). |
| `encoding`           | `string`                     | Specifies how to decode the `content` string. Common values include `'base64'`, `'hex'`, and `'utf8'`.                                            |
| `contentTransferEncoding` | `string \| false`       | The Content-Transfer-Encoding header value. Supported values are `'base64'`, `'quoted-printable'`, `'7bit'`, and `'8bit'`. Defaults to `'base64'` (`'8bit'` for `message/*` attachments). Set to `false` to skip the forced default and let Nodemailer choose an encoding automatically based on the content. |
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
  // Provides full control over how content is read.
  // This must be a Node.js stream.Readable. To use a WHATWG ReadableStream
  // (for example the body returned by fetch()), convert it first:
  //   const { Readable } = require("node:stream");
  //   const response = await fetch("https://example.com/file.bin");
  //   content: Readable.fromWeb(response.body)
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

## Fetching over HTTPS

When an attachment is fetched from an `https:` URL (via `href`, or a `path` that starts with `http://` or `https://`), Nodemailer validates the server's TLS certificate. A self-signed, expired, or hostname-mismatched certificate fails the send with an [`EFETCH`](/errors#efetch) error.

This matters most when you pair `href` with `httpHeaders`: those headers often carry an API key or bearer token, and certificate validation is what stops a network-adjacent attacker from presenting a forged certificate and collecting them.

To reach an internal host that legitimately uses a private CA, pin that CA rather than turning validation off:

```javascript
{
  filename: "report.pdf",
  href: "https://internal.example.com/report.pdf",
  httpHeaders: { authorization: "Bearer token123" },
  tls: { ca: fs.readFileSync("/etc/ssl/internal-ca.pem") },
}
```

Disabling validation entirely is possible but leaves the fetch open to interception, so avoid it whenever credentials are attached:

```javascript
{
  filename: "report.pdf",
  href: "https://self-signed.example.com/report.pdf",
  tls: { rejectUnauthorized: false },
}
```

Nodemailer also drops `Authorization`, `Cookie`, and `Proxy-Authorization` headers if a redirect sends the request to a different host or downgrades it from HTTPS to HTTP, so those credentials are never handed to an unexpected destination.

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

## See Also

- [Embedded images](/message/embedded-images) - attachments referenced from HTML with `cid:`.
- [Message configuration](/message/) - the message fields attachments sit alongside.
- [Custom headers](/message/custom-headers) - add headers to an individual attachment.
- [Calendar events](/message/calendar-events) - attaching an iCalendar invitation.
- [Alternatives](/message/alternatives) - alternative body parts, which take the same content sources.
