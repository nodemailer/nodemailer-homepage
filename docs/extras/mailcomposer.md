---
title: Mailcomposer
sidebar_position: 4
---

Generate RFC 822-formatted email messages that you can stream directly to an SMTP connection or save to disk for later use.

:::info
Mailcomposer is included with Nodemailer. There is no separate package to install.
:::

## Usage

### 1 - Install Nodemailer

```bash
npm install nodemailer
```

### 2 - Import MailComposer in your code

```js
const MailComposer = require("nodemailer/lib/mail-composer");
```

### 3 - Create a MailComposer instance

```js
const mail = new MailComposer(mailOptions);
```

The `mailOptions` parameter is an object that defines your email message. See the complete list of available options in the [Message fields](#message-fields) section below.

---

## API

### `createReadStream()`

Returns a readable stream that emits the raw RFC 822 message. This is useful when you want to pipe the message directly to another stream without loading the entire message into memory.

```js
const mail = new MailComposer({ from: "you@example.com" /* ... */ });

const stream = mail.compile().createReadStream();
stream.pipe(process.stdout);
```

### `build(callback)`

Generates the complete message and returns it as a `Buffer` through a callback function. Use this method when you need the entire message in memory, for example to save it to a file or send it via an API.

```js
const mail = new MailComposer({ from: "you@example.com" /* ... */ });

mail.compile().build((err, message) => {
  if (err) throw err;
  process.stdout.write(message);
});
```

---

## Message fields

| Field                 | Description                                                                                                                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **from**              | The sender's email address. You can use a plain address (`'sender@server.com'`) or include a display name (`'Sender Name <sender@server.com>'`). See [Address formatting](#address-formatting) for all supported formats.     |
| **sender**            | The email address that appears in the _Sender:_ header. Use this when the person sending the message differs from the author listed in _From:_.                                                                                |
| **to**                | Primary recipients. Accepts a comma-separated string or an array of addresses.                                                                                                                                                 |
| **cc**                | Carbon-copy recipients. These addresses receive a copy of the message and are visible to all recipients.                                                                                                                       |
| **bcc**               | Blind carbon-copy recipients. These addresses receive a copy but are hidden from other recipients. See [BCC](#bcc) for information about header visibility.                                                                    |
| **replyTo**           | The address where replies should be sent. This populates the _Reply-To:_ header.                                                                                                                                               |
| **inReplyTo**         | The `Message-ID` of the email this message is replying to. Used by email clients to thread conversations.                                                                                                                      |
| **references**        | A list of related `Message-ID` values for conversation threading. Accepts a space-separated string or an array.                                                                                                                |
| **subject**           | The subject line of the message.                                                                                                                                                                                               |
| **text**              | The plain-text version of the message body. Accepts a `string`, `Buffer`, `Stream`, or an object like `{ path: '/path/to/file.txt' }`.                                                                                         |
| **html**              | The HTML version of the message body. Accepts the same input formats as **text**.                                                                                                                                              |
| **watchHtml**         | HTML content specifically for Apple Watch. Most modern smartwatches now render standard `text/html`, so this field is rarely needed.                                                                                           |
| **amp**               | AMP4EMAIL content for interactive emails. Must be a complete, valid AMP document. Email clients that cannot render AMP will display the **html** version instead. [Learn more about AMP emails](https://blog.nodemailer.com/2019/12/30/testing-amp4email-with-nodemailer/). |
| **icalEvent**         | An iCalendar event to include with the message. Accepts the same input formats as **text**/**html**. To specify the calendar method, use an object: `{ method: 'REQUEST', content: icsString }`. The default method is `PUBLISH`. Content must be UTF-8 encoded. |
| **headers**           | Additional email headers. Accepts an object (`{ 'X-Custom-Header': 'value' }`) or an array (`[{ key: 'X-Custom-Header', value: 'value' }]`).                                                                                   |
| **attachments**       | An array of files to attach to the message. See [Attachments](#attachments) for the full specification.                                                                                                                        |
| **alternatives**      | An array of alternative content versions to include in a `multipart/alternative` section. See [Alternatives](#alternatives) for details.                                                                                       |
| **envelope**          | A custom SMTP envelope that overrides the addresses derived from headers. See [SMTP envelope](#smtp-envelope).                                                                                                                 |
| **messageId**         | A custom `Message-ID` value. If omitted, one is generated automatically.                                                                                                                                                       |
| **date**              | A custom date for the `Date` header. Defaults to the current UTC time.                                                                                                                                                         |
| **encoding**          | The transfer encoding to use for text parts (such as `quoted-printable` or `base64`).                                                                                                                                          |
| **raw**               | Provide a pre-built raw message instead of having MailComposer generate one. When using this option, you must set headers and envelope manually.                                                                               |
| **textEncoding**      | Force a specific encoding for text parts: `quoted-printable` or `base64`. If omitted, the encoding is detected automatically based on the content.                                                                             |
| **disableUrlAccess**  | When set to `true`, MailComposer will throw an error if any part of the message tries to fetch content from a URL.                                                                                                             |
| **disableFileAccess** | When set to `true`, MailComposer will throw an error if any part of the message tries to read content from the file system.                                                                                                    |
| **newline**           | The line break style to use in the generated message. Valid values are `\r\n` (CRLF), `\n` (LF), or leave undefined to preserve the line breaks from your input.                                                               |

All text content is treated as UTF-8. Attachments are streamed as binary data.

---

## Attachments

Each attachment is defined as an object with the following properties:

| Property                    | Description                                                                                                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **filename**                | The file name shown to recipients. Unicode characters are allowed. Set to `false` to omit the filename entirely.                                                                          |
| **cid**                     | A Content-ID for embedding the attachment inline (used with `cid:` URLs in HTML). When you set **cid**, the attachment automatically uses `contentDisposition: 'inline'` and is placed in the `multipart/related` section. |
| **content**                 | The attachment data as a `string`, `Buffer`, or readable `Stream`.                                                                                                                        |
| **encoding**                | The encoding used to convert a string **content** into a Buffer. Common values include `base64` and `hex`.                                                                                |
| **path**                    | A file path or URL to stream content from, instead of providing data directly via **content**. Supports local file paths, HTTP/HTTPS URLs, and data URIs. Ideal for large files.         |
| **contentType**             | The MIME type of the attachment. If omitted, it is detected automatically from the **filename** or **path**.                                                                              |
| **contentTransferEncoding** | The transfer encoding for this attachment (`quoted-printable`, `base64`, etc.). If omitted, it is detected automatically.                                                                 |
| **contentDisposition**      | How the attachment should be presented: `attachment` (the default, shown as a downloadable file) or `inline` (displayed within the message body).                                         |
| **headers**                 | Additional headers for this MIME part, for example: `{ 'X-Custom-Header': 'value' }`.                                                                                                     |
| **raw**                     | Provide pre-built raw MIME content for this part. When set, all other attachment options are ignored. Accepts a `string`, `Buffer`, `Stream`, or another attachment-like object.          |

### Example

```js
const fs = require("fs");

const mailOptions = {
  // ...other fields...
  attachments: [
    // Plain text string as attachment content
    { filename: "hello.txt", content: "hello world!" },

    // Binary Buffer as attachment content
    { filename: "buffer.txt", content: Buffer.from("hello world!", "utf-8") },

    // Stream content from a file on disk
    { filename: "file.txt", path: "/path/to/file.txt" },

    // Let filename and content type be inferred from the path
    { path: "/path/to/logo.png" },

    // Use a readable stream as the content source
    { filename: "stream.txt", content: fs.createReadStream("file.txt") },

    // Explicitly set the content type
    { filename: "data.bin", content: "hello world!", contentType: "application/octet-stream" },

    // Fetch attachment content from a remote URL
    { filename: "license.txt", path: "https://raw.githubusercontent.com/nodemailer/nodemailer/master/LICENSE" },

    // Decode a base64-encoded string into attachment content
    { filename: "base64.txt", content: "aGVsbG8gd29ybGQh", encoding: "base64" },

    // Use a data URI as the content source
    { path: "data:text/plain;base64,aGVsbG8gd29ybGQ=" },
  ],
};
```

---

## Alternatives

In addition to **text** and **html**, you can include other versions of your message content as _alternatives_. For example, you might include a Markdown version or an OpenDocument version of the same content. The recipient's email client will choose the most appropriate version to display.

Alternative objects use the same properties as [attachments](#attachments), but they are placed in the `multipart/alternative` section of the message rather than the `multipart/mixed` or `multipart/related` sections.

```js
const mailOptions = {
  html: "<b>Hello world!</b>",
  alternatives: [
    {
      contentType: "text/x-web-markdown",
      content: "**Hello world!**",
    },
  ],
};
```

---

## Address formatting

Email addresses can be specified in several formats:

**As a string:**

```
recipient@example.com
"Display Name" <recipient@example.com>
```

**As an object** (useful when the display name contains special characters):

```js
{
  name: 'Display Name',
  address: 'recipient@example.com'
}
```

All address fields (including **from**) accept one or more addresses. You can mix and match formats freely:

```js
{
  to: 'user1@example.com, "User Two" <user2@example.com>',
  cc: [
    'user3@example.com',
    '"User Four" <user4@example.com>',
    { name: 'User Five', address: 'user5@example.com' }
  ]
}
```

Internationalized domain names (IDN) are automatically converted to their ASCII-compatible encoding (punycode):

```
"Unicode Domain" <info@müriaad-polüteism.info>
```

---

## SMTP envelope

By default, the SMTP envelope (the actual routing information used by mail servers) is derived from the address headers in your message. If you need different envelope addresses - for example, to implement VERP (Variable Envelope Return Path) or to use a null return path - you can specify them explicitly:

```js
const mailOptions = {
  from: "mailer@example.com",
  to: "daemon@example.com",
  envelope: {
    from: "Daemon <daemon@example.com>",
    to: 'mailer@example.com, "Mailer Two" <mailer2@example.com>',
  },
};
```

> **Note:** Some transports (such as AWS SES) ignore the `envelope` option and use the header addresses instead.

---

## Using embedded images

To embed an image directly in your HTML content, assign a unique `cid` (Content-ID) to the attachment and reference it using the `cid:` protocol in your HTML:

```js
const mailOptions = {
  html: 'Embedded image: <img src="cid:unique@nodemailer" />',
  attachments: [
    {
      filename: "image.png",
      path: "/path/to/image.png",
      cid: "unique@nodemailer", // This value must match the src attribute
    },
  ],
};
```

---

## BCC

For privacy protection, MailComposer removes the _Bcc:_ header from the generated message by default. This ensures that blind carbon-copy recipients remain hidden from other recipients.

If you need the _Bcc:_ header to remain in the generated message (for example, when archiving messages), you can enable `keepBcc` on the compiled message object:

```js
const mail = new MailComposer({
  // ...message options...
  bcc: "bcc@example.com",
}).compile();

mail.keepBcc = true;

mail.build((err, message) => {
  if (err) throw err;
  process.stdout.write(message);
});
```

---

## License

[MIT](https://github.com/nodemailer/nodemailer/blob/master/LICENSE)
