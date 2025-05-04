---
title: Nodemailer
sidebar_position: 10
---

# Nodemailer

**The de‑facto email solution for Node.js.**

Nodemailer makes sending email from a Node.js application straightforward and secure, without pulling in a single runtime dependency.

```bash title="Install with npm"
npm install nodemailer
```

:::tip Looking for a full mail gateway?
[**EmailEngine**](https://emailengine.app/?utm_source=nodemailer&utm_campaign=nodemailer&utm_medium=tip-link) is a self‑hosted email gateway that lets you make REST calls to IMAP & SMTP accounts, receive webhooks for mailbox changes, and send email with extras such as OAuth2, delayed delivery, open‑ & click‑tracking, bounce detection, and more — no external MTA required.
:::

## Why Nodemailer?

- **Zero runtime dependencies** – the entire implementation lives in one audited package.
- **Security first** – avoids known RCE vectors that have affected other Node.js mailers.
- **Unicode everywhere** – send any characters, including emoji 💪.
- **Cross‑platform** – no native addons, works the same on Linux, macOS, and Windows (great for Azure).
- **HTML e‑mails** with **plain‑text fallbacks** out of the box.
- **[Attachments](/message/attachments/)** & **[embedded images](/message/embedded-images/)** without pain.
- Out‑of‑the‑box **TLS/STARTTLS** encryption.
- Multiple **[transports](/transports/)** (SMTP, Sendmail, SES, streams, and more).
- **[DKIM](/dkim/)** signing & **[OAuth2](/smtp/oauth2/)** authentication.
- **[Proxy support](/smtp/proxies/)** for restricted networks.
- **Plugin API** for advanced message manipulation.
- Built‑in test accounts from **[Ethereal.email](https://ethereal.email)** for local development.

## Requirements

- **Node.js ≥ 6.0.0** (async/await examples require ≥ 8.0.0).

No other system libraries, services, or build tools are needed.

## Quick‑start

1. **Create a transporter.** Use SMTP or another supported transport.
2. **Compose a message.** Define sender, recipient(s), subject, and content.
3. **Send it** with `transporter.sendMail()`.

### Example (using an Ethereal test account)

```javascript
const nodemailer = require("nodemailer");

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "maddison53@ethereal.email",
    pass: "jn7jnAPss4f63QBp6D",
  },
});

// Wrap in an async IIFE so we can use await.
(async () => {
  const info = await transporter.sendMail({
    from: '"Maddison Foo Koch" <maddison53@ethereal.email>',
    to: "bar@example.com, baz@example.com",
    subject: "Hello ✔",
    text: "Hello world?", // plain‑text body
    html: "<b>Hello world?</b>", // HTML body
  });

  console.log("Message sent:", info.messageId);
})();
```

> **Tip:** Ethereal generates a URL for every message so you can view the rendered email in your browser — perfect for development.

## Source & license

Nodemailer is MIT‑licensed open source. Browse the code on [GitHub](https://github.com/nodemailer/nodemailer).

---

Made with ❤️ by [Andris Reinman](https://github.com/andris9). Logo by [Sven Kristjansen](https://www.behance.net/kristjansen).
