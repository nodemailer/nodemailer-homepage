---
title: Testing SMTP
sidebar_position: 22
description: Test email sending with Ethereal Email mail-catcher service without spamming real inboxes.
---

When testing email functionality in development or CI environments, you need to avoid accidentally sending messages to real inboxes. Rather than redirecting all emails to a single test address, the recommended approach is to use a _mail-catcher_ service. A mail-catcher accepts messages over SMTP just like a production email provider, but it **never delivers them** to actual recipients. Instead, it stores the messages so you can inspect or download them later.

For alternative testing approaches, you can also use the [stream transport](../transports/stream) to capture generated messages without any network connection, or run your own local mail server using [smtp-server](../extras/smtp-server).

Nodemailer includes built-in support for [Ethereal Email](https://ethereal.email/), a free mail-catcher service designed specifically for testing. You have two options:

- **Create a temporary account programmatically** using `nodemailer.createTestAccount()`, or
- **Create a persistent test mailbox** through the Ethereal web dashboard.

If you prefer to work completely offline, you can preview messages locally using [forwardemail/email-templates](https://github.com/forwardemail/email-templates), which renders each message in your browser or iOS simulator via [preview-email](https://github.com/forwardemail/preview-email).

## Quick-start

Install Nodemailer if you have not done so already:

```bash
npm install nodemailer
```

### 1. Create a temporary Ethereal account

The following example demonstrates how to create a test account, configure a transporter, and send a message:

```javascript
// ./mail.js
const nodemailer = require("nodemailer");

nodemailer.createTestAccount((err, account) => {
  if (err) {
    console.error("Failed to create a testing account. " + err.message);
    return;
  }

  // Create a transporter using the Ethereal test account credentials
  const transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  });

  // Send a test message
  transporter
    .sendMail({
      from: "Example App <no-reply@example.com>",
      to: "user@example.com",
      subject: "Hello from tests",
      text: "This message was sent from a Node.js integration test.",
    })
    .then((info) => {
      console.log("Message sent: %s", info.messageId);
      // Get a URL to preview the message in Ethereal's web interface
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    })
    .catch(console.error);
});
```

:::tip
Ethereal automatically deletes accounts after **48 hours of inactivity**. If you need to inspect messages later, save the generated credentials or create a persistent account through the Ethereal dashboard.
:::

### 2. Switch transports based on environment

A common pattern is to centralize your transport configuration in one place. This makes it easy to use Ethereal during development and testing while using a production email service in production. For more details on SMTP configuration options, see the [SMTP transport](./index.md) documentation.

```javascript
// ./mail-transport.js
const nodemailer = require("nodemailer");

function createTransport() {
  if (process.env.NODE_ENV === "production") {
    // Production: send real emails
    return nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  // Development/Testing: capture emails with Ethereal
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: process.env.ETHEREAL_USERNAME,
      pass: process.env.ETHEREAL_PASSWORD,
    },
  });
}

module.exports = createTransport;
```

Your application code can then use the transporter without knowing which service is being used:

```javascript
const createTransport = require('./mail-transport');
const transporter = createTransport();

await transporter.sendMail({...});
```

### 3. Inspect the message

After `sendMail` completes successfully, the returned `info` object contains everything you need to locate the message in Ethereal:

```javascript
const info = await transporter.sendMail(message);

console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
// Example output: https://ethereal.email/message/WaQKMgKddxQDoou
```

You can also browse your messages directly in the Ethereal dashboard by navigating to **Messages** in the web interface.

---

Below is what a captured message looks like in the Ethereal web interface.

![Screenshot of the Ethereal message preview](https://cldup.com/D5Cj_C1Vw3.png)
