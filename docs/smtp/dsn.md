---
title: Delivery Status Notifications (DSN)
description: Request delivery, delay, or failure status notifications for outgoing email messages using the SMTP DSN extension.
sidebar_position: 26
---

:::info
The SMTP **Delivery Status Notification** (DSN) extension (defined in [RFC 3461](https://datatracker.ietf.org/doc/html/rfc3461)) is **optional**. Your SMTP server must advertise DSN support in its `EHLO` response for these options to have any effect.
:::

Delivery Status Notifications allow you to receive automatic email reports about what happens to your messages after they leave your server. You can request notifications when a message is successfully delivered, when delivery is delayed, or when delivery fails permanently (bounces).

To request DSN for a message, add a **`dsn`** object to your [message configuration](/message/) when calling `transporter.sendMail()`.

## `dsn` object fields

| Property    | Type                  | Description                                                                                                                                                                          | Corresponding SMTP keyword |
| ----------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| `id`        | `string`              | A unique identifier for this message that will be included in any DSN reports you receive. This helps you match notifications back to the original message.                         | **ENVID**                  |
| `return`    | `'headers' \| 'full'` | Controls how much of the original message is included in the DSN. Use `'headers'` to include only the message headers, or `'full'` to include the complete original message.        | **RET**                    |
| `notify`    | `string \| string[]`  | Specifies which events should trigger a notification. Valid values are `'success'`, `'failure'`, `'delay'`, or `'never'`. You can combine multiple values (except `'never'`, which must be used alone). | **NOTIFY**                 |
| `recipient` | `string`              | The original recipient address to include in the DSN. Nodemailer automatically formats this with the required `rfc822;` prefix if not provided.                                     | **ORCPT**                  |

> Nodemailer automatically escapes special characters in DSN values according to the [xtext](https://datatracker.ietf.org/doc/html/rfc3461#section-4) encoding rules defined in RFC 3461.

## Examples

### 1. Request a notification when the message is delivered

This example requests a success notification, so you will receive an email confirmation when the recipient's mail server accepts the message for final delivery.

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

### 2. Request notifications for failures and delays

This example requests notifications for both permanent failures (bounces) and temporary delays. This is useful when you want to be alerted if something goes wrong but do not need confirmation of successful delivery.

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

### 3. Disable DSN reports entirely

If you explicitly do **not** want to receive any DSN reports for a message, set `notify` to `'never'`. This tells the receiving server that you do not want notifications under any circumstances.

```javascript
await transporter.sendMail({
  /* ... other message options ... */
  dsn: {
    notify: "never",
  },
});
```

## Troubleshooting

- **Not receiving DSN reports?** Verify that your [SMTP server](./index.md) supports the DSN extension by checking its `EHLO` response. The server must list `DSN` as one of its supported extensions. Also ensure you are not forcing a downgrade to the legacy `HELO` command, which does not support extensions.
- **Incomplete or missing information in reports?** Some email service providers only support a subset of DSN options or may modify certain values. Check your provider's documentation for any limitations or provider-specific behavior.
