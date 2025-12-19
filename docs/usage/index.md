---
title: Usage
sidebar_position: 2
description: Get started with Nodemailer - installation, creating transporters, and sending messages.
---

# Usage

This page shows you how to get Nodemailer up and running quickly. You will learn how to create a **transporter** (the object that sends your emails) and how to send messages through it.

## Installation

Install Nodemailer from npm:

```bash
npm install nodemailer
```

## Create a transporter

A **transporter** is an object that handles the connection to your email service and sends messages on your behalf. You create one transporter and reuse it for all your emails.

```javascript
const nodemailer = require("nodemailer");

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
```

The `createTransport(transport[, defaults])` function returns a reusable transporter instance.

| Parameter     | Type / Description                                                                                                                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **transport** | **Object, String, or Plugin**. Pass a configuration object (as shown above), a connection URL (for example, `"smtp://user:pass@smtp.example.com:587"`), or an already-configured transport plugin. |
| **defaults**  | _Object (optional)_. Default values that are automatically merged into every message sent through this transporter. Useful for setting a consistent `from` address or custom headers.                 |

:::tip Reuse your transporter
Create the transporter **once** when your application starts and reuse it for all emails. Creating a new transporter for each message wastes resources because each transporter opens network connections and may perform authentication.
:::

### Other transport types

- **SMTP** -- see the [SMTP guide](../smtp/) for the full list of configuration options.
- **Plugins** -- Nodemailer can send emails through any transport that implements the `send(mail, callback)` interface. See the [transport plugin documentation](../transports/) for available options.

## Verify the connection (optional)

Before sending emails, you can verify that Nodemailer can connect to your SMTP server. This is useful for catching configuration errors early.

```javascript
await transporter.verify();
console.log("Server is ready to take our messages");
```

## Send a message {#quick-example}

Once you have a transporter, send an email by calling `transporter.sendMail(message[, callback])`.

```javascript
(async () => {
  try {
    const info = await transporter.sendMail({
      from: '"Example Team" <team@example.com>', // sender address
      to: "alice@example.com, bob@example.com", // list of recipients
      subject: "Hello", // subject line
      text: "Hello world?", // plain text body
      html: "<b>Hello world?</b>", // HTML body
    });

    console.log("Message sent: %s", info.messageId);
    // Preview URL is only available when using an Ethereal test account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.error("Error while sending mail", err);
  }
})();
```

### Parameters

| Parameter    | Description                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| **message**  | An object containing the email content and headers. See [Message configuration](../message/) for details. |
| **callback** | _(optional)_ A function with signature `(err, info) => {}`. If omitted, `sendMail` returns a Promise.    |

The `info` object returned by most transports contains:

| Property    | Description                                                               |
| ----------- | ------------------------------------------------------------------------- |
| `messageId` | The **Message-ID** header value assigned to the email.                    |
| `envelope`  | An object containing the [SMTP envelope](../smtp/envelope) addresses (`from` and `to`). |
| `accepted`  | An array of recipient addresses that the server accepted.                 |
| `rejected`  | An array of recipient addresses that the server rejected.                 |
| `pending`   | With the _direct_ transport: addresses that received a temporary failure. |
| `response`  | The final response string received from the SMTP server.                  |

:::info Partial success
When a message has multiple recipients, it is considered **sent** as long as **at least one** recipient address was accepted by the server. Check the `rejected` array to see which addresses failed.
:::
