---
title: Other transports
sidebar_position: 5
---

# Other transports

Nodemailer ships with a fully‑featured [SMTP transport](/smtp/) enabled by default, but you’re by **no means** limited to SMTP. A _transport_ is simply the mechanism Nodemailer uses to hand off a fully‑constructed email message—whether that’s piping into `sendmail`, posting to an HTTPS API, or any other delivery strategy.

This page lists the transports that are bundled with Nodemailer as well as popular community transports. You can also roll your own by following the [transport API documentation](/plugins/create/#transports).

---

## Example: Amazon SES transport

Below is a minimal example that delivers mail through [Amazon SES](https://aws.amazon.com/ses/) using the built‑in SES transport. It wraps the official **AWS SDK v3** client under the hood.

```bash title="Install dependencies"
npm install nodemailer @aws-sdk/client-sesv2
```

```javascript title="send‑with‑ses.js"
const nodemailer = require("nodemailer");
const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");

const sesClient = new SESv2Client({});

const transporter = nodemailer.createTransport({
  SES: { sesClient, SendEmailCommand },
});

(async () => {
  await transporter.sendMail({
    from: "you@example.com",
    to: "friend@example.net",
    subject: "Hello from SES",
    text: "This message was sent with Nodemailer & Amazon SES!",
  });
})();
```

---

## Available transports

### Bundled (built‑in) transports

| Transport    | Purpose                                                                     | Reference                     |
| ------------ | --------------------------------------------------------------------------- | ----------------------------- |
| **SMTP**     | Default transport that speaks the SMTP protocol                             | [Docs](/smtp/)                |
| **sendmail** | Pipes the generated message to a local `sendmail`‑compatible binary         | [Docs](/transports/sendmail/) |
| **SES**      | Sends mail via the AWS SES API using the AWS SDK                            | [Docs](/transports/ses/)      |
| **stream**   | Returns the generated rfc822 stream instead of sending (useful for testing) | [Docs](/transports/stream/)   |

### Community transports

These transports live in separate NPM packages maintained by the community. Install them with `npm install` and pass their exported function to `nodemailer.createTransport()`.

- **Mailtrap** – Deliver messages to your Mailtrap inbox for safe testing ([npm](https://github.com/railsware/mailtrap-nodejs#nodemailer-transport))
- **Mailgun** – Send via Mailgun’s HTTP API ([npm](https://www.npmjs.com/package/nodemailer-mailgun-transport))
- **Custom** – Implement business‑specific logic by authoring [your own transport](/plugins/create/#transports)

> **Heads‑up** Third‑party transports are not maintained by the Nodemailer team. Check each project’s README for installation and usage instructions.

---

## Transport‑agnostic options

While each transport defines its own configuration object, the following options are recognised by **all** transports:

| Option                    | Type       | Description                                                                                                                                                                                                                    |
| ------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `attachDataUrls`          | `Boolean`  | Convert inline `data:` URIs in HTML content to embedded attachments.                                                                                                                                                           |
| `disableFileAccess`       | `Boolean`  | Disallow reading files from disk when resolving attachments or HTML images. Useful when the message source is untrusted.                                                                                                       |
| `disableUrlAccess`        | `Boolean`  | Disallow HTTP/HTTPS requests when resolving attachments or HTML images.                                                                                                                                                        |
| `normalizeHeaderKey(key)` | `Function` | Callback invoked for every header key before it’s added to the generated RFC 822 message. [Example](https://github.com/nodemailer/nodemailer/blob/3e3ba4f30ad5a73f037f45d3e36a9361ca43a318/examples/custom-headers.js#L13-L14) |
