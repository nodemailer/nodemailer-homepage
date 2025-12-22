---
title: SMTP envelope
sidebar_position: 20
description: Control MAIL FROM and RCPT TO commands independently from visible message headers.
---

When Nodemailer delivers an email over SMTP, it sends **two distinct layers** of information:

1. **Message headers** - the visible metadata that email clients display to recipients (`From:`, `To:`, `Subject:`, etc.).
2. **SMTP envelope** - the routing instructions (`MAIL FROM`, `RCPT TO`) that mail servers use to deliver the message and handle bounces. These instructions are separate from the headers and are not visible to recipients.

By default, Nodemailer **builds the envelope automatically** by extracting email addresses from the `from`, `to`, `cc`, and `bcc` fields you provide. For most use cases, this automatic behavior is exactly what you need.

However, if you need precise control over the envelope, you can override the defaults with the `envelope` property. Common reasons to do this include:

- Implementing [VERP](https://en.wikipedia.org/wiki/Variable_envelope_return_path) (Variable Envelope Return Path) for per-recipient bounce tracking
- Setting a dedicated bounce address that differs from the visible `From:` header
- Sending a message to recipients who should **not** appear in the visible headers

## The `envelope` property

```js
{
  envelope: {
    from: 'bounce+12345@example.com',          // becomes MAIL FROM:
    to:   [                                    // becomes RCPT TO:
      'alice@example.com',
      'Bob <bob@example.net>'
    ],
    requireTLSExtensionEnabled: true
  }
}
```

| Field  | Type                 | Description                                                      |
| ------ | -------------------- | ---------------------------------------------------------------- |
| `from` | `string`             | The address used for the **`MAIL FROM`** command (the return path where bounces are sent). |
| `to`   | `string \| string[]` | Address(es) added to the **`RCPT TO`** list (the actual delivery destinations). |
| `cc`   | `string \| string[]` | _Optional._ These addresses are merged into the `to` list when the envelope is generated. |
| `bcc`  | `string \| string[]` | _Optional._ These addresses are merged into the `to` list when the envelope is generated. |
| `requireTLSExtensionEnabled` | `boolean` | _Optional._ If `true`, the `REQUIRETLS` extension is used (RFC 8689). This requires a TLS connection. |

Nodemailer accepts any [address format](../message/addresses) it supports: plain email addresses like `user@example.com`, name-address pairs like `Name <address>`, or internationalized addresses with UTF-8 domains.

### Complete example

```js
const nodemailer = require("nodemailer");

async function main() {
  // Create a transport (replace with your own transport options)
  const transport = nodemailer.createTransport({
    sendmail: true,
  });

  const info = await transport.sendMail({
    from: "Mailer <mailer@example.com>", // Visible From: header
    to: "Daemon <daemon@example.com>",   // Visible To: header
    envelope: {
      from: "bounce+12345@example.com",  // Actual MAIL FROM (for bounces)
      to: [
        // Actual RCPT TO recipients (who really receive the email)
        "daemon@example.com",
        "mailer@example.com",
      ],
    },
    subject: "Custom SMTP envelope",
    text: "Hello!",
  });

  console.log("Envelope used:", info.envelope);
  // => { from: 'bounce+12345@example.com', to: [ 'daemon@example.com', 'mailer@example.com' ] }
}

main().catch(console.error);
```

:::tip
The object returned by `sendMail()` always includes an `envelope` property showing what was actually sent. It contains `from` (a string with the sender address) and `to` (an array of all recipient addresses). When building the envelope, Nodemailer merges **all** recipients from `to`, `cc`, and `bcc` into that single `to` array.
:::

---

### When should I override the envelope?

- **VERP or bounce management** - Route bounces to a unique per-message or per-recipient address so you can track which specific email bounced. For automated bounce notifications, see also [Delivery Status Notifications (DSN)](./dsn).
- **Mailing lists** - Deliver the same message to many recipients while keeping their addresses hidden from each other (not shown in the headers).
- **Different return path** - Display one address in the `From:` header but route bounces to a different address for centralized bounce processing.

If you do not have a specific reason to customize the envelope, let Nodemailer generate it automatically from your message headers.
