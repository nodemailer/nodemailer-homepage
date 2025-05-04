---
title: Usage
sidebar_position: 2
---

# Usage

This page shows how to get Nodemailer up and running quickly, then walks through the most common tasks you’ll perform: creating a **transporter** and sending a message.

## Installation

Add Nodemailer to your project:

```bash
npm install nodemailer
```

## Create a transporter

Every email you send goes through a **transporter**—an object that knows how to deliver messages to your chosen email service.

```javascript
const nodemailer = require("nodemailer");

// Create a transporter for SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  secure: false, // upgrade later with STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
```

`createTransport(transport[, defaults])` returns a reusable transporter instance.

| Parameter     | Type / Description                                                                                 |          |                                                                                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **transport** | \*\*Object                                                                                         |  String  |  Plugin\*\*. Either a configuration object (like the SMTP example above), a connection URL (`"smtp://user:pass@smtp.example.com:587"`), or a pre‑configured transport plugin instance. |
| **defaults**  | _Object (optional)_. Values that will be merged into every message you send with this transporter. |          |                                                                                                                                                                                        |

:::tip Keep the transporter
Create the transporter **once** and reuse it. Transporter creation opens network sockets and performs authentication; doing this for every email adds needless overhead.
:::

### Other transport types

- **SMTP** – see the [SMTP guide](/smtp/) for all available options.
- **Plugins** – Nodemailer can deliver through anything that exposes a [`send(mail, callback)`](https://nodemailer.com/transports/) interface. See the [transport plugin docs](/transports/).

## Verify the connection (optional)

Before you start sending, you can check that Nodemailer can connect to your SMTP server:

```javascript
await transporter.verify();
console.log("Server is ready to take our messages");
```

## Send a message {#quick-example}

Once you have a transporter, send an email with `transporter.sendMail(message[, callback])`.

```javascript
(async () => {
  try {
    const info = await transporter.sendMail({
      from: '"Example Team" <team@example.com>', // sender address
      to: "alice@example.com, bob@example.com", // list of receivers
      subject: "Hello", // Subject line
      text: "Hello world?", // plain text body
      html: "<b>Hello world?</b>", // html body
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.error("Error while sending mail", err);
  }
})();
```

### Parameters

| Parameter    | Description                                                                        |
| ------------ | ---------------------------------------------------------------------------------- |
| **message**  | Email content and headers. See [Message configuration](/message/) for all options. |
| **callback** | _(optional)_ `(err, info) => {}`. If omitted, `sendMail` returns a Promise.        |

The `info` object returned by most transports contains:

| Property    | Description                                                               |
| ----------- | ------------------------------------------------------------------------- |
| `messageId` | The final **Message‑ID** value assigned to the email.                     |
| `envelope`  | Object with the SMTP envelope (FROM, TO).                                 |
| `accepted`  | Array of addresses accepted by the server.                                |
| `rejected`  | Array of addresses rejected by the server.                                |
| `pending`   | With the _direct_ transport: addresses that received a temporary failure. |
| `response`  | The last response string received from the SMTP server.                   |

:::info Partial success
If a message has multiple recipients it is considered **sent** as long as **at least one** address was accepted.
:::
