---
title: Delivery Status Notifications (DSN)
description: Request delivery‑, delay‑, or failure‑status notifications for outgoing e‑mail messages using the SMTP DSN extension.
sidebar_position: 26
---

:::info
The SMTP **Delivery Status Notification** (DSN) extension (defined in [RFC 3461](https://datatracker.ietf.org/doc/html/rfc3461)) is **optional**. Your outbound SMTP service _must_ have the extension enabled for DSN requests to take effect.
:::

If your SMTP service supports DSN, you can ask Nodemailer to request a bounce‑report (failure), delay notice, or success confirmation for any individual message. You do so by adding a **`dsn`** object to the message options passed to `transporter.sendMail()`.

## `dsn` object fields

| Property    | Type                  | Description                                                                                                                                                       | Corresponding SMTP keyword |
| ----------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `id`        | `string`              | Envelope identifier echoed back in the DSN. Keep it short but unique per message.                                                                                 | **ENVID**                  |
| `return`    | `'headers' \| 'full'` | Whether the DSN should include only the original message headers or the full original message.                                                                    | **RET**                    |
| `notify`    | `string \| string[]`  | Conditions that should trigger a DSN. Use `'never'`, `'success'`, `'failure'`, and/or `'delay'`. Combining is allowed _except_ that `'never'` must be used alone. | **NOTIFY**                 |
| `recipient` | `string`              | Address that should receive the DSN (Original Recipient — **ORCPT**).                                                                                             | **ORCPT**                  |

> Non‑[xtext](https://datatracker.ietf.org/doc/html/rfc3461#section-4) strings are escaped automatically by Nodemailer.

## Examples

### 1. Success notifications only

```javascript
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  secure: false,
  auth: {
    user: "smtp-user",
    pass: "smtp-pass",
  },
});

await transporter.sendMail({
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Message",
  text: "I hope this message gets read!",
  dsn: {
    id: "msg-123",
    return: "headers",
    notify: "success",
    recipient: "sender@example.com",
  },
});
```

### 2. Failure **and** delay notifications

```javascript
await transporter.sendMail({
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Message",
  text: "I hope this message gets read!",
  dsn: {
    id: "msg-124",
    return: "headers",
    notify: ["failure", "delay"],
    recipient: "sender@example.com",
  },
});
```

### 3. Opting out of DSN entirely

If you explicitly do **not** want DSN reports, pass `notify: 'never'`.

```javascript
await transporter.sendMail({
  /* ... */
  dsn: {
    notify: "never",
  },
});
```

## Troubleshooting

- **No DSN received?** Double‑check that your SMTP provider advertises the `DSN` capability in its `EHLO` response and that you are not forcing a downgrade to the legacy `HELO` command.
- **Provider‑specific quirks.** Some ESPs accept only a subset of DSN options or rewrite the recipient address. Consult your provider’s documentation if delivery reports seem incomplete.
