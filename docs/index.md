---
title: Nodemailer
sidebar_position: 1
description: Send e-mails with Node.JS – easy as cake with zero runtime dependencies.
---

# Nodemailer

**Send emails from Node.js - easy as cake! ✉️**

Nodemailer is the most popular email sending library for Node.js. It makes sending emails straightforward and secure, with zero runtime dependencies to manage.

```bash title="Install with npm"
npm install nodemailer
```

:::tip Looking for a complete email gateway solution?
[**EmailEngine**](https://emailengine.app/?utm_source=nodemailer&utm_campaign=nodemailer&utm_medium=tip-link) is a self-hosted email gateway that provides REST API access to IMAP and SMTP accounts, webhooks for mailbox changes, and advanced features like OAuth2, delayed delivery, open and click tracking, bounce detection, and more.
:::

## Why Nodemailer?

- **Zero runtime dependencies** - everything you need is included in a single, well-maintained package.
- **Security focused** - designed to avoid remote code execution vulnerabilities that have affected other Node.js email libraries.
- **Full Unicode support** - send messages with any characters, including emoji 💪.
- **Cross-platform** - works identically on Linux, macOS, and Windows with no native addons required (ideal for cloud environments like Azure).
- **HTML and plain-text emails** - send rich HTML emails with automatic plain-text fallbacks.
- **[Attachments](./message/attachments/)** and **[embedded images](./message/embedded-images/)** - easily include files and inline images in your messages.
- **Built-in TLS/STARTTLS encryption** - secure connections are handled automatically.
- **Multiple [transports](./transports/)** - send via [SMTP](./smtp/), [Sendmail](./transports/sendmail/), [Amazon SES](./transports/ses/), [streams](./transports/stream/), and more.
- **[DKIM signing](./dkim/)** and **[OAuth2 authentication](./smtp/oauth2/)** - enterprise-ready email authentication.
- **[Proxy support](./smtp/proxies/)** - route email through proxies for restricted network environments.
- **[Plugin API](./plugins/)** - extend functionality with [custom plugins](./plugins/create/) for advanced message processing.
- **[Ethereal.email](https://ethereal.email) integration** - generate test accounts instantly for [local development and testing](./smtp/testing/).

## Requirements

- **Node.js v6.0.0 or later** (examples using async/await require Node.js v8.0.0 or later).

No additional system libraries, services, or build tools are needed.

## Quick Start

Sending an email with Nodemailer involves three simple steps:

1. **Create a transporter** - Configure your [SMTP server](./smtp/) or another supported [transport method](./transports/).
2. **Compose your message** - Define the sender, recipient(s), subject, and [content](./message/).
3. **Send the email** - Call `transporter.sendMail()` with your message options.

### Example: Sending an Email with Ethereal

[Ethereal](https://ethereal.email) is a free service that captures outgoing emails for [testing](./smtp/testing/). No emails are actually delivered, making it perfect for development.

```javascript
const nodemailer = require("nodemailer");

// Create a transporter using Ethereal test credentials.
// For production, replace with your actual SMTP server details.
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // Use true for port 465, false for port 587
  auth: {
    user: "maddison53@ethereal.email",
    pass: "jn7jnAPss4f63QBp6D",
  },
});

// Send an email using async/await
(async () => {
  const info = await transporter.sendMail({
    from: '"Maddison Foo Koch" <maddison53@ethereal.email>',
    to: "bar@example.com, baz@example.com",
    subject: "Hello ✔",
    text: "Hello world?", // Plain-text version of the message
    html: "<b>Hello world?</b>", // HTML version of the message
  });

  console.log("Message sent:", info.messageId);
})();
```

:::tip
Ethereal provides a preview URL for every message sent, allowing you to view the rendered email in your browser. This is invaluable for testing email layouts and content during development.
:::

## Source and License

Nodemailer is open source software, licensed under the [MIT No Attribution (MIT-0)](./license) license. This means you can use it freely in any project without attribution requirements. Browse the source code on [GitHub](https://github.com/nodemailer/nodemailer).

---

Made with ❤️ by [Andris Reinman](https://github.com/andris9). Logo by [Sven Kristjansen](https://www.behance.net/kristjansen).
