---
title: Why SMTP Matters
sidebar_position: 7
---

> **In short 🚀** – PHP ships with a full mail stack, while Node.js keeps things lean.
> If your server does **not** have a local _sendmail_ binary, you will need an **SMTP service** (recommended) or to install _sendmail_ yourself.

## PHP’s Hidden Mail Stack

When you call `mail()` in PHP it looks effortless, but a _lot_ of software is doing the real work under the hood:

1. **Web server** – usually Apache or Nginx
2. **PHP‑FPM / CGI** – glues the web server to the PHP interpreter
3. **PHP interpreter** – runs your script
4. **sendmail** (or Postfix/Exim) – queues the message and hands it off to the recipient’s MX server

Because _sendmail_ is already installed on most LAMP stacks, PHP can simply stream your message to the binary’s **stdin** and call it a day.

## Node.js: Slim by Design

A typical Node.js deployment bundles **only** the things your application needs—often nothing more than the _node_ executable.
If _sendmail_ is not present on that server, the quick one‑liner PHP enjoys simply isn’t possible.

That’s where **Nodemailer** comes in: it lets you choose between

- **sendmail transport** – identical behaviour to PHP’s `mail()`, _but only if_ a local _sendmail_ binary is available, and
- **SMTP transport** – connect to any SMTP host (Gmail, SES, Mailgun, your own Postfix, …)

## Using _sendmail_ with Nodemailer

```js
const nodemailer = require("nodemailer");

// Works only if /usr/sbin/sendmail (or equivalent) exists
const transporter = nodemailer.createTransport({
  sendmail: true,
  newline: "unix",
  path: "/usr/sbin/sendmail",
});

await transporter.sendMail({
  from: "you@example.com",
  to: "friend@example.net",
  subject: "Hello from sendmail",
  text: "This message was handed to the local sendmail binary.",
});
```

See the [sendmail transport](/transports/sendmail) documentation for all options.

## Using an external SMTP service (recommended)

```js
const nodemailer = require("nodemailer");

// Connect to an SMTP host
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  secure: false, // upgrade later with STARTTLS
  auth: {
    user: "smtp‑user",
    pass: "smtp‑password",
  },
});

await transporter.sendMail({
  from: "you@example.com",
  to: "friend@example.net",
  subject: "Hello from SMTP",
  text: "This message travelled through smtp.example.com.",
});
```

### Why SMTP is usually the safer bet

- **Availability** – cloud platforms (Vercel, Heroku, AWS ELB `docker run`, …) rarely provide _sendmail_.
- **Deliverability** – reputable SMTP providers handle IP reputation, DKIM/DMARC/ARC signing, and feedback loops for you.
- **Scalability** – you can queue and monitor thousands of messages without managing a mail server.
- **Support** – when something goes wrong, managed SMTP gives you logs, dashboards, and alerts.

If you _do_ control the server environment (e.g. a traditional VPS) and already have a properly configured MTA, Nodemailer’s sendmail transport offers a drop‑in replacement for PHP’s `mail()`.
