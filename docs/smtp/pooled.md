---
title: Pooled SMTP Connections
sidebar_position: 21
---

Using **pooled** SMTP connections keeps a fixed number of TCP/TLS connections open to the SMTP server and re‑uses them for every message. This dramatically reduces TLS hand‑shake latency and is perfect when either

- you need to blast out a _large_ batch of e‑mails, or
- your provider caps the number of parallel connections you’re allowed to use.

---

## Quick example

```javascript
const nodemailer = require("nodemailer");

/**
 * One shared transporter for your whole process.
 * The transporter will automatically open up to `maxConnections`
 * sockets and keep them warm.
 */
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 465,
  secure: true,
  pool: true, // ♻️  enable connection pooling
  maxConnections: 5, // optional – defaults to 5
  maxMessages: 100, // optional – defaults to 100
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Somewhere in your code – *do not* create a new transporter each time
await transporter.sendMail({
  from: "Newsletters <noreply@example.com>",
  to: "alice@example.com",
  subject: "Hello pooled world",
  text: "Hi Alice! 👋",
});
```

---

## Transport options

| Option           | Type      | Default | Description                                                                                                                                     |
| ---------------- | --------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `pool`           | `boolean` | `false` | Enable connection pooling.                                                                                                                      |
| `maxConnections` | `number`  | `5`     | Maximum simultaneous SMTP connections.                                                                                                          |
| `maxMessages`    | `number`  | `100`   | How many messages to send _per connection_ before it is recycled.                                                                               |
| `maxRequeues`    | `number`  | `-1`    | Maximum times a message can be re-queued when a connection closes unexpectedly. Set to `-1` or omit to allow unlimited re-queue attempts.       |

:::warning Deprecated
The following options are **deprecated** and will be removed in a future major release:

- `rateDelta` – size of the time window (ms) used for rate limiting (default: `1000`).
- `rateLimit` – how many messages may be sent during one `rateDelta` window. The limit is shared between **all** pooled connections.
  :::

---

## Runtime helpers

### `transporter.isIdle()` → `boolean`

Returns `true` if at least one connection slot is free.

### `transporter.close()`

Closes **all** active connections immediately and drains the message queue. Idle connections are normally closed automatically after `socketTimeout`, so calling this manually is rarely required.

```javascript
// Graceful shutdown
process.on("SIGTERM", async () => {
  await transporter.close();
  process.exit(0);
});
```

---

## Event: `idle`

The transporter emits an `idle` event whenever a connection slot becomes available. This allows you to implement _push‑style_ senders that pull messages from an external queue only when Nodemailer is ready for them:

```javascript
const { getNextMessage } = require("./messageQueue");

transporter.on("idle", async () => {
  while (transporter.isIdle()) {
    const message = await getNextMessage();
    if (!message) return; // queue is empty

    try {
      await transporter.sendMail(message);
    } catch (err) {
      console.error("❌  Failed to send", err);
    }
  }
});
```

---

### Best practices

- **Create one transporter** and **reuse it** – every new `createTransport()` call spawns its _own_ pool.
- **Adjust `maxConnections` and `maxMessages`** to match the policy of your SMTP provider.
- **Handle back‑pressure** using the `idle` event instead of pushing thousands of messages into memory.
- **Close the pool** on graceful shutdown so that your process exits promptly.
