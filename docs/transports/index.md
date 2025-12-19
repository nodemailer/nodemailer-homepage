---
title: Other transports
sidebar_position: 5
---

# Other transports

Nodemailer includes a fully-featured [SMTP transport](/smtp/) that is enabled by default, but you are not limited to SMTP. A _transport_ is the mechanism Nodemailer uses to deliver a fully-constructed email message. This could involve piping the message to the local `sendmail` binary, posting it to an HTTPS API like Amazon SES, or using any other delivery method you choose.

This page lists the transports bundled with Nodemailer as well as popular community-maintained transports. If none of these fit your needs, you can create your own by following the [transport API documentation](/plugins/create/#transports).

---

## Example: Amazon SES transport

The following example shows how to send email through [Amazon SES](https://aws.amazon.com/ses/) using the built-in SES transport. This transport uses the official **AWS SDK v3** client to communicate with the SES API.

```bash title="Install dependencies"
npm install nodemailer @aws-sdk/client-sesv2
```

```javascript title="send-with-ses.js"
const nodemailer = require("nodemailer");
const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");

// Create an SES client. Configure your AWS credentials and region
// using environment variables, shared credentials file, or IAM roles.
const sesClient = new SESv2Client({});

// Create a Nodemailer transporter that uses the SES client.
// The property must be named "SES" (case-sensitive) and must include
// both the sesClient instance and the SendEmailCommand class.
const transporter = nodemailer.createTransport({
  SES: { sesClient, SendEmailCommand },
});

// Send an email using the standard Nodemailer sendMail interface
(async () => {
  await transporter.sendMail({
    from: "you@example.com",
    to: "friend@example.net",
    subject: "Hello from SES",
    text: "This message was sent with Nodemailer and Amazon SES!",
  });
})();
```

---

## Available transports

### Bundled (built-in) transports

These transports are included with Nodemailer and require no additional packages.

| Transport    | Purpose                                                                              | Reference                     |
| ------------ | ------------------------------------------------------------------------------------ | ----------------------------- |
| **SMTP**     | The default transport. Connects to an SMTP server to deliver messages.               | [Docs](/smtp/)                |
| **sendmail** | Pipes the generated message to a local `sendmail`-compatible binary on your server.  | [Docs](/transports/sendmail/) |
| **SES**      | Sends mail through the Amazon SES API using the AWS SDK v3.                          | [Docs](/transports/ses/)      |
| **stream**   | Returns the generated RFC 5322 message as a stream instead of sending it. Useful for testing or custom processing. | [Docs](/transports/stream/)   |

### Community transports

These transports are maintained by the community in separate npm packages. Install them with `npm install` and pass their exported function to `nodemailer.createTransport()`.

- **Mailtrap** - Deliver messages to your Mailtrap inbox for safe email testing without sending to real recipients ([npm](https://github.com/railsware/mailtrap-nodejs#nodemailer-transport))
- **Mailgun** - Send email through Mailgun's HTTP API ([npm](https://www.npmjs.com/package/nodemailer-mailgun-transport))
- **Custom** - Build your own transport to implement business-specific logic. See [creating custom transports](/plugins/create/#transports).

> **Note:** Third-party transports are not maintained by the Nodemailer team. Check each project's README for installation instructions and usage details.

---

## Transport-agnostic options

While each transport has its own configuration options, the following options work with **all** transports. Set these options on the configuration object you pass to `createTransport()`.

| Option                    | Type       | Description                                                                                                                                                                                                                    |
| ------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `attachDataUrls`          | `Boolean`  | When set to `true`, Nodemailer automatically converts inline `data:` URIs found in HTML content into embedded attachments. This is useful when your HTML contains base64-encoded images.                                       |
| `disableFileAccess`       | `Boolean`  | When set to `true`, prevents Nodemailer from reading files from the filesystem when resolving attachments or HTML images. Enable this option when processing untrusted message content for security.                           |
| `disableUrlAccess`        | `Boolean`  | When set to `true`, prevents Nodemailer from making HTTP/HTTPS requests when resolving attachments or HTML images referenced by URL. Enable this option when processing untrusted message content for security.               |
| `normalizeHeaderKey(key)` | `Function` | A callback function invoked for each header key before the header is added to the generated RFC 5322 message. Use this to customize header formatting. [Example](https://github.com/nodemailer/nodemailer/blob/3e3ba4f30ad5a73f037f45d3e36a9361ca43a318/examples/custom-headers.js#L13-L14) |
