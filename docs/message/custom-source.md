---
title: Custom source
sidebar\_position: 18
description: Provide your own pre‑built RFC822/EML source instead of letting Nodemailer generate it.
---

When you already have a fully‑formatted RFC 822/EML message—perhaps because it was composed elsewhere or fetched from storage—you can hand it to Nodemailer verbatim with the **raw** option. Nodemailer will bypass its normal MIME generation and deliver exactly what you supply.

You can use **raw** at three levels:

1. **Whole message** — supply a single RFC 822 document.
2. **Per alternative** — supply a `text/plain`, `text/html`, or other MIME alternative that you built yourself.
3. **Per attachment** — supply an attachment body, complete with its own headers.

:::tip Always set an envelope
When you use **raw** for the _entire_ message, you must also set `envelope.from` and `envelope.to` so that the SMTP transaction has the correct sender and recipients. These values are _not_ extracted from the raw source.
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

> Nodemailer will normalise new‑lines for you, so plain `\n` is fine.

### 2. EML file as the entire message

```javascript
const message = {
  envelope: {
    from: "sender@example.com",
    to: ["recipient@example.com"],
  },
  raw: {
    path: "/path/to/message.eml", // absolute or relative to process.cwd()
  },
};
```

### 3. String as an attachment

When **raw** is used inside `attachments[]`, include **all** of the MIME headers yourself. Nodemailer **does not** add `Content‑Type`, `Content‑Disposition`, or any other headers.

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
