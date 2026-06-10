---
title: Nodemailer
sidebar_position: 1
description: Send e-mails with Node.JS – easy as cake with zero runtime dependencies.
---

# Nodemailer

**Send emails from Node.js - easy as cake!**

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
- **Full Unicode support** - send messages with any characters, including emoji.
- **Cross-platform** - works identically on Linux, macOS, and Windows with no native addons required (ideal for cloud environments like Azure).
- **HTML and plain-text emails** - provide both `html` and `text` content and Nodemailer automatically builds the proper multipart message.
- **[Attachments](./message/attachments/)** and **[embedded images](./message/embedded-images/)** - easily include files and inline images in your messages.
- **Built-in TLS/STARTTLS encryption** - secure connections are handled automatically.
- **Multiple [transports](./transports/)** - send via [SMTP](./smtp/), [Sendmail](./transports/sendmail/), [Amazon SES](./transports/ses/), [streams](./transports/stream/), and more.
- **[DKIM signing](./dkim/)** and **[OAuth2 authentication](./smtp/oauth2/)** - enterprise-ready email authentication.
- **[Proxy support](./smtp/proxies/)** - route email through proxies for restricted network environments.
- **[Plugin API](./plugins/)** - extend functionality with [custom plugins](./plugins/create/) for advanced message processing.
- **[Ethereal.email](https://ethereal.email) integration** - generate test accounts instantly for [local development and testing](./guides/testing-with-ethereal).

## Requirements

- **Node.js v6.0.0 or later** (examples using async/await require Node.js v8.0.0 or later).

No additional system libraries, services, or build tools are needed.

## Quick start

Sending an email with Nodemailer involves three simple steps:

1. **Create a transporter** - Configure your [SMTP server](./smtp/) or another supported [transport method](./transports/).
2. **Compose your message** - Define the sender, recipient(s), subject, and [content](./message/).
3. **Send the email** - Call `transporter.sendMail()` with your message options.

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

- **SMTP** - see the [SMTP guide](./smtp/) for the full list of configuration options.
- **SES** - send via Amazon Simple Email Service using the [SES transport](./transports/ses/).
- **Sendmail** - pipe messages to the local sendmail binary using the [sendmail transport](./transports/sendmail/).
- **Stream/JSON** - generate RFC 822 messages as streams or JSON for testing using the [stream transport](./transports/stream/).
- **Plugins** - Nodemailer can send emails through any transport that implements the `send(mail, callback)` interface. See the [transport plugin documentation](./plugins/create/#transports) for details.

## Verify the connection (optional)

Before sending emails, you can verify that Nodemailer can connect to your SMTP server. This is useful for catching configuration errors early.

```javascript
try {
  await transporter.verify();
  console.log("Server is ready to take our messages");
} catch (err) {
  console.error("Verification failed:", err);
}
```

## Send a message {#send-a-message}

Once you have a transporter, send an email by calling `transporter.sendMail(message[, callback])`.

```javascript
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
  console.error("Error while sending mail:", err);
}
```

### Parameters

| Parameter    | Description                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| **message**  | An object containing the email content and headers. See [Message configuration](./message/) for details. |
| **callback** | _(optional)_ A function with signature `(err, info) => {}`. If omitted, `sendMail` returns a Promise.    |

### Response object

The `info` object returned on success contains:

| Property         | Description                                                                        |
| ---------------- | ---------------------------------------------------------------------------------- |
| `messageId`      | The **Message-ID** header value assigned to the email.                             |
| `envelope`       | An object containing the [SMTP envelope](./smtp/envelope) addresses (`from` and `to`). |
| `accepted`       | An array of recipient addresses that the server accepted.                          |
| `rejected`       | An array of recipient addresses that the server rejected.                          |
| `rejectedErrors` | An array of error objects for each rejected recipient, with details about the rejection reason (only present if at least one recipient was rejected). |
| `response`       | The final response string received from the SMTP server.                           |

:::info Partial success
When a message has multiple recipients, it is considered **sent** as long as **at least one** recipient address was accepted by the server. Check the `rejected` array to see which addresses failed.
:::

### Error handling

```javascript
try {
  const info = await transporter.sendMail(message);
  console.log("Message sent:", info.messageId);

  if (info.rejected.length > 0) {
    console.warn("Some recipients were rejected:", info.rejected);
  }
} catch (err) {
  switch (err.code) {
    case "ECONNECTION":
    case "ETIMEDOUT":
      console.error("Network error - retry later:", err.message);
      break;
    case "EAUTH":
      console.error("Authentication failed:", err.message);
      break;
    case "EENVELOPE":
      // err.rejected is only present when every recipient was refused
      console.error("Invalid envelope:", err.message, err.rejected || []);
      break;
    default:
      console.error("Send failed:", err.message);
  }
}
```

See the [Error reference](./errors) for a complete list of error codes.

## Transporter events

The transporter emits events you can listen for:

| Event   | Description                                                                                         |
| ------- | --------------------------------------------------------------------------------------------------- |
| `idle`  | Emitted when a [pooled](./smtp/pooled) transporter has capacity to accept more messages.           |
| `error` | Emitted when a transport-level error occurs (for example, a connection failure).                    |
| `token` | Emitted when a new [OAuth2](./smtp/oauth2) access token is generated. Useful for persisting tokens.|

```javascript
// Listen for OAuth2 token updates
transporter.on("token", (token) => {
  console.log("New access token for %s:", token.user, token.accessToken);
});
```

## Source and License

Nodemailer is open source software, licensed under the [MIT No Attribution (MIT-0)](./license) license. This means you can use it freely in any project without attribution requirements. Browse the source code on [GitHub](https://github.com/nodemailer/nodemailer).

---

Made with love by [Andris Reinman](https://github.com/andris9). Logo by [Sven Kristjansen](https://www.behance.net/kristjansen).
