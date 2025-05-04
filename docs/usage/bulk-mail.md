---
title: Delivering bulk mail
sidebar_position: 9
---

Sending at “newsletter scale” (hundreds of thousands to tens of millions of messages) is a very different problem from sending account‑sign‑up confirmations.
This page collects practical advice that has worked well for teams sending **10 million+** messages with Nodemailer.

## 1. Use an infrastructure that is made for bulk

Choose a specialist email service provider (ESP). Free or “included” SMTP servers usually throttle or block you after a few hundred messages.

## 2. Pull messages from a queue – don’t push everything into memory

Store work in a durable queue (RabbitMQ, Amazon SQS, Redis Streams, etc.). Start _N_ workers that each:

1. Wait until the transporter has a free slot.
2. Pop the next job from the queue.
3. Call `sendMail()`.
4. Acknowledge the job only **after** the callback resolves – failed deliveries are retried automatically.

## 3. Reuse connections with pooled SMTP

```js
const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  /* Pool options */
  pool: true, // enable pooled SMTP
  maxConnections: 20, // tune based on provider limits and your CPU
  maxMessages: Infinity, // keep the connection open
  // Optional but useful:
  rateDelta: 1000, // window for rateLimit (1 s)
  rateLimit: 100, // max 100 msgs per rateDelta
});
```

### Why pooled SMTP?

- One TCP/TLS handshake per **hundreds** of messages instead of per message.
- Dramatically fewer authentication round‑trips.
- Warm connections keep you under connection‑rate limits many ESPs enforce.

## 4. Tune the pool size

`maxConnections` is the main lever. Start small (10–20) and monitor:

- CPU load and memory usage on the worker machine.
- The ESP’s **connections** and **messages‑per‑second** metrics.
- SMTP _421_ rate‑limit responses – if you see these, back off.

## 5. Keep attachments on disk

If every recipient receives the same PDF, point Nodemailer to the **file path** instead of an HTTP/HTTPS URL:

```js
attachments: [
  {
    filename: "catalogue.pdf",
    path: "/srv/bulk/attachments/catalogue.pdf",
  },
];
```

Most OSes cache hot files aggressively — a disk read is far cheaper than 10 million HTTP requests to your own server.

## 6. Prefer bulk‑aware HTTP APIs – _if_ your ESP offers them

An HTTP “send‑to‑many” endpoint can outperform SMTP because the ESP expands the template server‑side – one API call instead of millions of SMTP transactions.
Where only single‑recipient HTTP endpoints are available, stick with pooled SMTP.

---

### Next – monitoring and retries

- Track per‑recipient SMTP response codes.
- Exponential back‑off for `4xx` soft‑bounces.
- Periodic re‑queueing of transient failures.

Nodemailer emits the full SMTP response in `info.response` – persist this with each job so you can inspect and retry intelligently.
