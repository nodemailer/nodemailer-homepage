---
title: Custom source
sidebar_position: 18
description: Provide your own pre-built RFC 822/EML source instead of letting Nodemailer generate it.
---

Sometimes you already have a fully-formatted RFC 822/EML message ready to send. This might happen when a message was composed by another system, retrieved from storage, or exported from an email client. In these cases, you can pass the pre-built content directly to Nodemailer using the **raw** option, and Nodemailer will send it without modifying the structure.

The **raw** option can be used at three different levels:

1. **Whole message** - Provide a complete RFC 822 document including all headers and body content.
2. **Per alternative** - Provide a pre-built MIME part for `text/plain`, `text/html`, or any other alternative content type.
3. **Per attachment** - Provide a complete attachment including its MIME headers and body.

:::tip Always set an envelope
When you use **raw** for the entire message, you must also provide `envelope.from` and `envelope.to` explicitly. Nodemailer does not parse these values from the raw message content. The envelope tells the SMTP server who the sender and recipients are during the mail transfer.
:::

## Examples

### 1. String as the entire message

```javascript
const message = {
  envelope: {
    from: "sender@example.com",
    to: ["recipient@example.com"],
  },
  raw: `From: sender@example.com
To: recipient@example.com
Subject: Hello world

Hello world!`,
};
```

> When using a string, newlines are passed through as-is. If your mail server requires `\r\n` line endings (as per RFC 5321), make sure your raw content uses them.

### 2. EML file as the entire message

You can read the message content from a file on disk by providing a `path` property instead of a string.

```javascript
const message = {
  envelope: {
    from: "sender@example.com",
    to: ["recipient@example.com"],
  },
  raw: {
    path: "/path/to/message.eml",
  },
};
```

The path can be absolute or relative to the current working directory (`process.cwd()`).

### 3. String as an attachment

When using **raw** inside the `attachments` array, you must include all of the MIME headers yourself. Nodemailer does not add `Content-Type`, `Content-Disposition`, or any other headers automatically.

```javascript
const message = {
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Custom attachment",
  attachments: [
    {
      raw: `Content-Type: text/plain
Content-Disposition: attachment; filename="notes.txt"

Attached text file`,
    },
  ],
};
```
