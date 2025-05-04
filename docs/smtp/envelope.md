---
title: SMTP envelope
sidebar_position: 20
---

When Nodemailer delivers an email over SMTP it sends **two distinct layers** of information:

1. **Message headers** that your email client shows (`From:`, `To:`, etc.).
2. **SMTP envelope commands** (`MAIL FROM`, `RCPT TO`) that the SMTP server actually uses to route and return the message.

By default, Nodemailer **builds the envelope automatically** from the `from`, `to`, `cc`, and `bcc` header fields. 
If you need fine‑grained control—for example to implement [VERP](https://en.wikipedia.org/wiki/Variable_envelope_return_path), to set a dedicated bounce address, or to send a message to recipients that you do **not** reveal in the headers—you can override the defaults with the `envelope` property.

## The `envelope` property

```js
{
  envelope: {
    from: 'bounce+12345@example.com',          // becomes MAIL FROM:
    to:   [                                    // becomes RCPT TO:
      'alice@example.com',
      'Bob <bob@example.net>'
    ]
  }
}
```

| Field  | Type                 | Description                                              |
| ------ | -------------------- | -------------------------------------------------------- |
| `from` | `string`             | Used for the **`MAIL FROM`** command (return‑path).      |
| `to`   | `string \| string[]` | Added to the **`RCPT TO`** list.                         |
| `cc`   | `string \| string[]` | _Optional._ Merged into `to` when Envelope is generated. |
| `bcc`  | `string \| string[]` | _Optional._ Merged into `to` when Envelope is generated. |

Any address format that Nodemailer supports—plain, `Name <address>` pairs, or international (UTF‑8) domains—can be used here.

### Complete example

```js
const nodemailer = require("nodemailer");

async function main() {
  // Create a transport. Replace with your own transport options.
  const transport = nodemailer.createTransport({
    sendmail: true,
  });

  const info = await transport.sendMail({
    from: "Mailer <mailer@example.com>", // Header From:
    to: "Daemon <daemon@example.com>", // Header To:
    envelope: {
      from: "bounce+12345@example.com", // MAIL FROM:
      to: [
        // RCPT TO:
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
The object returned by `sendMail()` always includes an `envelope` property. It contains `from` (a string) and `to` (an array). When sending, Nodemailer merges **all** recipients from `to`, `cc`, and `bcc` into that single `to` array.
:::

---

### When should I override the envelope?

- **VERP or bounce management** – route bounces to a unique per‑message address.
- **Mailing lists** – deliver the same message to many recipients while hiding the list in the header.
- **Different return‑path** – use one domain in the headers but another for bounce processing.

If you do not have a specific reason, let Nodemailer generate the envelope automatically.
