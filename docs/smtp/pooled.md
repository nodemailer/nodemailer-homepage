---
title: Pooled SMTP Connections
sidebar_position: 3
description: Keep TCP/TLS connections open and reuse them for high-volume email sending.
---

**Pooled SMTP** maintains up to `maxConnections` persistent TCP/TLS connections to your SMTP server, opened on demand and reused across multiple messages. Instead of opening a new connection for each email (which requires a full TLS handshake every time), pooled connections stay open and ready for the next message. This is an extension of the standard [SMTP transport](./index.md).

This approach is ideal when:

- You need to send a **large batch of emails** quickly, since connection reuse eliminates repeated TLS handshake overhead.
- Your SMTP provider **limits the number of simultaneous connections** you can open, and you need to queue messages efficiently within those limits.

:::tip
For extremely high-volume email sending, consider using the [SES transport](/transports/ses/) which integrates with Amazon Simple Email Service and handles rate limiting and deliverability at scale.
:::

---

## Quick example

```javascript
const nodemailer = require("nodemailer");

// Create ONE transporter instance and reuse it throughout your application.
// The transporter manages up to `maxConnections` persistent connections internally.
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 465,
  secure: true,
  pool: true, // Enable connection pooling
  maxConnections: 5, // Maximum number of simultaneous connections (default: 5)
  maxMessages: 100, // Messages per connection before reconnecting (default: 100)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Send emails using the shared transporter.
// Do NOT create a new transporter for each message - that defeats the purpose of pooling.
await transporter.sendMail({
  from: "Newsletters <noreply@example.com>",
  to: "alice@example.com",
  subject: "Hello pooled world",
  text: "Hi Alice!",
});
```

:::info
Pooled connections work with all authentication methods, including [OAuth2](./oauth2.md). This is particularly useful when sending through services like Gmail or Outlook that support OAuth2.
:::

---

## Transport options

| Option           | Type      | Default | Description                                                                                                                                     |
| ---------------- | --------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `pool`           | `boolean` | `false` | Set to `true` to enable connection pooling.                                                                                                     |
| `maxConnections` | `number`  | `5`     | The maximum number of SMTP connections to open simultaneously. Messages are queued when all connections are busy.                               |
| `maxMessages`    | `number`  | `100`   | How many messages to send on a single connection before closing and reopening it. This helps prevent long-lived connections from becoming stale.|
| `maxRequeues`    | `number`  | unlimited | How many times a message can be re-added to the queue if its connection closes unexpectedly mid-send. Set to `-1` (or omit) to allow unlimited retry attempts, or set to `0` to disable re-queuing entirely. |
| `rateDelta`      | `number`  | `1000`  | The time window in milliseconds used for rate limiting.                                                                                          |
| `rateLimit`      | `number`  | `0`     | The maximum number of messages that can be sent within one `rateDelta` window. This limit applies across all pooled connections combined, not per connection. Set to `0` (or omit) to disable rate limiting. |

---

## Runtime helpers

### `transporter.isIdle()` -> `boolean`

Returns `true` when the transporter has capacity to accept more messages. This requires both that the internal queue holds fewer than `maxConnections` pending messages and that a connection is free to send (or a new one can still be opened).

### `transporter.close()`

Closes all idle connections immediately. Connections that are currently sending a message are closed once that message finishes, and any messages still waiting in the queue are rejected with a `Connection pool was closed` error. Idle connections also close automatically after `socketTimeout`, so calling `close()` manually is typically only needed during application shutdown.

```javascript
// Graceful shutdown example
process.on("SIGTERM", () => {
  transporter.close();
  process.exit(0);
});
```

---

## Event: `idle`

The transporter emits an `idle` event whenever it regains capacity to accept more messages (the queue has room and a connection is free or can be opened). This enables a pull-based approach where you fetch messages from an external queue only when Nodemailer is ready to handle them, rather than loading everything into memory upfront:

```javascript
const { getNextMessage } = require("./messageQueue");

transporter.on("idle", async () => {
  // Keep sending while the transporter can accept more messages
  while (transporter.isIdle()) {
    const message = await getNextMessage();
    if (!message) return; // External queue is empty

    // Do not await the send here - dispatching without waiting lets the
    // pool fill all available connections instead of sending one at a time
    transporter.sendMail(message).catch((err) => {
      console.error("Failed to send:", err);
    });
  }
});
```

## Event: `clear`

The transporter emits a `clear` event when the last open connection closes while the pool is idle. This is useful for detecting that all queued messages have been fully processed and no connections remain open.

---

### Best practices

- **Create one transporter and reuse it throughout your application.** Each call to `createTransport()` creates a separate pool with its own connections. Creating multiple transporters defeats the purpose of pooling.
- **Match `maxConnections` and `maxMessages` to your SMTP provider's limits.** Many providers restrict the number of concurrent connections or messages per connection. Check your provider's documentation or the [well-known services list](./well-known-services.md) for common providers.
- **Use the `idle` event for high-volume sending.** Instead of queuing thousands of messages in memory, use the pull-based pattern shown above to fetch messages only when the transporter is ready.
- **Close the pool during application shutdown.** Call `transporter.close()` in your shutdown handler to ensure connections are properly terminated and your process can exit cleanly.
