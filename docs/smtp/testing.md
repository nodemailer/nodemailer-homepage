---
title: Testing SMTP
sidebar_position: 22
---

When you need to exercise the email‑sending paths of your application in a development or continuous‑integration environment, you **must not** accidentally spam real inboxes. Instead of routing all mail to a single hard‑coded test address, point your code at a _mail‑catcher_ service: it accepts messages over SMTP exactly like a production provider, but **never** delivers them. It just stores the messages so that you can open or download them later.

Nodemailer ships with first‑class support for [Ethereal Email](https://ethereal.email/) — a free, open‑source mail‑catcher designed for test environments. You can either

- **provision an account on the fly** with `createTestAccount`, or
- **create a persistent test mailbox** from the Ethereal dashboard.

If you would rather stay completely offline you can preview messages locally with [forwardemail/email‑templates](https://github.com/forwardemail/email-templates) (it renders every message in your browser and iOS simulator via [preview-email](https://github.com/forwardemail/preview-email)).

## Quick‑start

Install Nodemailer if you have not done so yet:

```bash
npm install nodemailer
```

### 1. Spin up a throw‑away Ethereal account

```javascript
// ./mail.js
const nodemailer = require("nodemailer");

nodemailer.createTestAccount((err, account) => {
  if (err) {
    console.error("Failed to create a testing account. " + err.message);
    return;
  }

  // 1️⃣  Configure a transporter that talks to Ethereal
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // upgrade later with STARTTLS
    auth: {
      user: account.user, // generated user
      pass: account.pass, // generated password
    },
  });

  // 2️⃣  Send a message
  transporter
    .sendMail({
      from: "Example app <no-reply@example.com>",
      to: "user@example.com",
      subject: "Hello from tests ✔",
      text: "This message was sent from a Node.js integration test.",
    })
    .then((info) => {
      console.log("Message sent: %s", info.messageId);
      // Preview the stored message in Ethereal’s web UI
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    })
    .catch(console.error);
});
```

:::tip
Ethereal automatically deletes an account after **48 hours of inactivity**. Save the generated credentials somewhere if you want to inspect the messages later via the dashboard.
:::

### 2. Switch transports per environment

You only need one place in your code base that knows which SMTP credentials to use. Everything else just calls `createTransport()`.

```javascript
// ./mail‑transport.js
const nodemailer = require("nodemailer");

function createTransport() {
  if (process.env.NODE_ENV === "production") {
    // 🚀  Real emails
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

  // 🧪  Captured by Ethereal
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

Your application code can treat the transporter as a black box:

```javascript
const createTransport = require('./mail-transport');
const transporter = createTransport();

await transporter.sendMail({...});
```

### 3. Inspect the message

When `sendMail` resolves (or its callback fires), the returned `info` object contains everything you need to locate the message inside Ethereal:

```javascript
const info = await transporter.sendMail(message);

console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
// → https://ethereal.email/message/WaQKMgKddxQDoou
```

You can also open **Messages → Inbox** in Ethereal’s dashboard and browse around.

---

Below is what a captured message looks like in the Ethereal UI.

![Screenshot of the Ethereal message preview](https://cldup.com/D5Cj_C1Vw3.png)
