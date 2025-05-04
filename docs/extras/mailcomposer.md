---
title: Mailcomposer
sidebar_position: 4
---

Generate RFC 822–formatted email messages that you can stream directly to an SMTP connection or save to disk.

:::info
Mailcomposer is shipped with Nodemailer – you do **not** have to install anything else.
:::

## Usage

### 1 · Install Nodemailer

```bash
npm install nodemailer
```

### 2 · Require **mailcomposer** in your code

```js
const MailComposer = require("nodemailer/lib/mail-composer");
```

### 3 · Create a **MailComposer** instance

```js
const mail = new MailComposer(mailOptions);
```

`mailOptions` is an object that describes your message. See the full option reference below.

---

## API

### `createReadStream()`

Create a readable stream that emits the raw RFC 822 message:

```js
const mail = new MailComposer({ from: "you@example.com" /* … */ });

const stream = mail.compile().createReadStream();
stream.pipe(process.stdout);
```

### `build(callback)`

Generate the message and receive it as a `Buffer` in a callback:

```js
const mail = new MailComposer({ from: "you@example.com" /* … */ });

mail.compile().build((err, message) => {
  if (err) throw err;
  process.stdout.write(message);
});
```

---

## Message fields

| Field                 | Description                                                                                                                                                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **from**              | Sender address. Accepts plain email (`'sender@server.com'`) or formatted (`'Sender Name <sender@server.com>'`). See [Address formatting](#address-formatting).                                                               |
| **sender**            | The address that goes into the _Sender:_ header.                                                                                                                                                                             |
| **to**                | Primary recipients (comma‑separated string or array).                                                                                                                                                                        |
| **cc**                | Carbon‑copy recipients.                                                                                                                                                                                                      |
| **bcc**               | Blind carbon‑copy recipients (see [BCC](#bcc) for showing the header).                                                                                                                                                       |
| **replyTo**           | Address that goes into the _Reply‑To:_ header.                                                                                                                                                                               |
| **inReplyTo**         | The `Message‑ID` this message replies to.                                                                                                                                                                                    |
| **references**        | Space‑separated or array of `Message‑ID`s.                                                                                                                                                                                   |
| **subject**           | Message subject.                                                                                                                                                                                                             |
| **text**              | Plain‑text body. Accepts `string`, `Buffer`, `Stream`, or `{ path: '…' }`.                                                                                                                                                   |
| **html**              | HTML body. Same input formats as **text**.                                                                                                                                                                                   |
| **watchHtml**         | Apple Watch–specific HTML. Most modern watches render regular `text/html`, so this is rarely used.                                                                                                                           |
| **amp**               | AMP4EMAIL HTML version. Must be a complete, valid AMP email document. Clients that cannot render AMP fall back to **html**. [See this blog post](https://blog.nodemailer.com/2019/12/30/testing-amp4email-with-nodemailer/). |
| **icalEvent**         | iCalendar event. Same input formats as **text**/**html**. Provide `{ method: 'REQUEST', content: icsString }` to override the default `PUBLISH` method. UTF‑8 only.                                                          |
| **headers**           | Additional headers – object or array. `{ 'X-Key': 'value' }` or `[{ key: 'X-Key', value: 'v1' }]`.                                                                                                                           |
| **attachments**       | Array of [attachment objects](#attachments).                                                                                                                                                                                 |
| **alternatives**      | Array of [alternatives](#alternatives) to include in a `multipart/alternative` part.                                                                                                                                         |
| **envelope**          | Custom SMTP envelope (see [SMTP envelope](#smtp-envelope)).                                                                                                                                                                  |
| **messageId**         | Custom `Message‑ID`. Autogenerated if omitted.                                                                                                                                                                               |
| **date**              | Custom `Date` header. Defaults to current UTC time.                                                                                                                                                                          |
| **encoding**          | Transfer encoding for text parts.                                                                                                                                                                                            |
| **raw**               | Provide the **entire** raw message yourself. Set headers/envelope manually.                                                                                                                                                  |
| **textEncoding**      | Force `quoted‑printable` or `base64` for text parts. If omitted, encoding is detected.                                                                                                                                       |
| **disableUrlAccess**  | `true` → error if a part tries to fetch a URL.                                                                                                                                                                               |
| **disableFileAccess** | `true` → error if a part tries to read the file system.                                                                                                                                                                      |
| **newline**           | Line break style – `\r\n`, `\n`, or leave undefined to keep input unchanged.                                                                                                                                                 |

All textual content is treated as UTF‑8. Attachments are streamed as binary.

---

## Attachments

Attachment objects support the following properties:

| Property                    | Description                                                                                                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **filename**                | File name reported to the recipient. Unicode allowed. Set `false` to omit.                                                                                                 |
| **cid**                     | Content‑ID used for embedding inline images (`cid:` URLs). Setting **cid** automatically sets `contentDisposition: 'inline'` and moves the part under `multipart/related`. |
| **content**                 | `string`, `Buffer`, or `Stream` with the attachment data.                                                                                                                  |
| **encoding**                | Encoding to convert a **string** `content` into a `Buffer` – e.g. `base64`, `hex`.                                                                                         |
| **path**                    | File path or HTTP(S)/data URI to stream from instead of including data directly. Great for large files.                                                                    |
| **contentType**             | MIME type. Auto‑detected from **filename** if absent.                                                                                                                      |
| **contentTransferEncoding** | Transfer encoding (`quoted-printable`, `base64`, …). Auto‑detected if absent.                                                                                              |
| **contentDisposition**      | `attachment` (default) or `inline`.                                                                                                                                        |
| **headers**                 | Extra headers for this part – `{ 'X-My-Header': 'value' }`.                                                                                                                |
| **raw**                     | Provide raw MIME for the part; all other options are ignored. Accepts `string`, `Buffer`, `Stream`, or another attachment‑like object.                                     |

### Example

```js
const fs = require("fs");

const mailOptions = {
  /* …other fields… */
  attachments: [
    // UTF‑8 string
    { filename: "hello.txt", content: "hello world!" },

    // Binary Buffer
    { filename: "buffer.txt", content: Buffer.from("hello world!", "utf‑8") },

    // File on disk (streams the file)
    { filename: "file.txt", path: "/path/to/file.txt" },

    // Derive filename & contentType from path
    { path: "/path/to/logo.png" },

    // Readable stream
    { filename: "stream.txt", content: fs.createReadStream("file.txt") },

    // Custom content type
    { filename: "data.bin", content: "hello world!", contentType: "application/octet-stream" },

    // Remote URL
    { filename: "license.txt", path: "https://raw.githubusercontent.com/nodemailer/nodemailer/master/LICENSE" },

    // Base64‑encoded string
    { filename: "base64.txt", content: "aGVsbG8gd29ybGQh", encoding: "base64" },

    // Data URI
    { path: "data:text/plain;base64,aGVsbG8gd29ybGQ=" },
  ],
};
```

---

## Alternatives

Besides **text** and **html**, you can include any data as an _alternative_ part – for example, a Markdown or OpenDocument version of the same content. The email client picks the best‑suited alternative to display. Calendar events are commonly attached this way.

Alternative objects use the **same options** as [attachments](#attachments), but are placed into the `multipart/alternative` section of the message instead of `multipart/mixed`/`multipart/related`.

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

You can supply addresses in any of the following forms:

```
recipient@example.com
"Display Name" <recipient@example.com>
```

Or as an object (no need to quote anything):

```js
{
  name: 'Display Name',
  address: 'recipient@example.com'
}
```

Every address field – even **from** – accepts **one or many** addresses, in any mix of formats:

```js
{
  to: 'user1@example.com, "User Two" <user2@example.com>',
  cc: [
    'user3@example.com',
    '"User Four" <user4@example.com>',
    { name: 'User Five', address: 'user5@example.com' }
  ]
}
```

Internationalized domain names (IDN) are automatically converted to punycode:

```
"Unicode Domain" <info@müriaad-polüteism.info>
```

---

## SMTP envelope

By default the SMTP envelope is generated from the address headers. If you need something different – for example, VERP or black‑hole `from` – you can set **envelope** explicitly:

```js
const mailOptions = {
  from: "mailer@example.com",
  to: "daemon@example.com",
  envelope: {
    from: "Daemon <daemon@example.com>",
    to: 'mailer@example.com, "Mailer Two" <mailer2@example.com>',
  },
};
```

> Some transports (e.g. AWS SES) ignore `envelope` and instead use the header addresses.

---

## Using embedded images

Set `cid` on an attachment and reference it in the HTML with the `cid:` protocol:

```js
const mailOptions = {
  html: 'Embedded image: <img src="cid:unique@nodemailer" />',
  attachments: [
    {
      filename: "image.png",
      path: "/path/to/image.png",
      cid: "unique@nodemailer", // must match the src above
    },
  ],
};
```

---

## BCC

MailComposer removes the _Bcc:_ header by default to keep recipient addresses private. If you need the header to remain, enable `keepBcc` **after** calling `compile()`:

```js
const mail = new MailComposer({
  /* … */
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
