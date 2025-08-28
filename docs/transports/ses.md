---
title: SES transport
sidebar_position: 28
---

Nodemailer **SES transport** lets you deliver email through **Amazon Simple Email Service (SES)** using the official AWS JavaScript SESv2 Client package [@aws-sdk/client‑sesv2](https://www.npmjs.com/package/@aws-sdk/client-sesv2).
It is a thin wrapper around [`SendEmailCommand`](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/sesv2/) that preserves the familiar `transporter.sendMail()` API.

The SES SDK is not bundled with Nodemailer. Install it explicitly:

```bash
npm install @aws-sdk/client-sesv2
```

## Quick start

```javascript
const nodemailer = require("nodemailer");
const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");

// 1. Configure the AWS SDK client (uses default credential chain if omitted)
const sesClient = new SESv2Client({ region: "us‑east‑1" });

// 2. Create a Nodemailer transport that points at SES
const transporter = nodemailer.createTransport({
  SES: { sesClient, SendEmailCommand },
});

// 3. Send the message
const info = await transporter.sendMail({
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Hello from Nodemailer + SES",
  text: "I hope this message gets sent!",
  // Any SendEmailCommand input can be set under the `ses` key:
  ses: {
    ConfigurationSetName: "my‑config‑set",
    EmailTags: [{ Name: "tag_name", Value: "tag_value" }],
  },
});

console.log(info.envelope); // { from: ..., to: [...] }
console.log(info.messageId); // SES MessageId
```

:::tip
You can also use the traditional callback style—`transporter.sendMail(mail, cb)`—if you prefer.
:::

## Transport options

Pass an `SES` object to `createTransport()` with the following **required** keys:

| Key                | Type               | Description                                      |
| ------------------ | ------------------ | ------------------------------------------------ |
| `sesClient`        | `SESv2Client`      | An initialised AWS SDK v3 client                 |
| `SendEmailCommand` | `SendEmailCommand` | The command class from **@aws-sdk/client‑sesv2** |

## Message‑level options

`sendMail()` accepts an optional **ses** property.
All keys of this object are merged into the input object passed to **SendEmailCommand**, so you can set any parameter supported by the operation (for example `EmailTags`, `ConfigurationSetName`, …).

## Response object

The promise (or callback) resolves to:

| Property    | Description                                                                            |
| ----------- | -------------------------------------------------------------------------------------- |
| `envelope`  | `{ from: 'address', to: ['address'] }`—the SMTP envelope Nodemailer sent               |
| `messageId` | The value returned by SES in the **MessageId** field (overrides the Message‑ID header) |

## Troubleshooting

### “User is not authorized to perform: ses\:SendEmail”

1. Confirm that the IAM principal used by the SDK has the **ses\:SendEmail** permission (see [Example 2](#example-2)).
2. Make sure the **From** address (or its domain) is _verified_ in the SES console.
3. _Rare_: AWS access keys containing non‑alphanumeric characters have been reported to fail—regenerate the keys if permission checks look correct.
4. **Limited functionality:** SES transport doesn't support verifying connections anymore [see](https://github.com/nodemailer/nodemailer/issues/1751#issuecomment-3175843706)

### “Cannot find module '@aws-sdk/client-sesv2'”

The SES SDK is not bundled with Nodemailer. Install it explicitly:

```bash
npm install @aws-sdk/client-sesv2
```

## Examples

### 1. Send a message {#example-1}

```javascript
const nodemailer = require("nodemailer");
const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");

const sesClient = new SESv2Client({ region: process.env.AWS_REGION });

const transporter = nodemailer.createTransport({
  SES: { sesClient, SendEmailCommand },
});

transporter.sendMail(
  {
    from: "sender@example.com",
    to: ["recipient@example.com"],
    subject: "Message via SES transport",
    text: "I hope this message gets sent!",
    ses: {
      EmailTags: [{ Name: "tag_name", Value: "tag_value" }],
    },
  },
  (err, info) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(info.envelope);
    console.log(info.messageId);
  }
);
```

### 2. Minimal IAM policy {#example-2}

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ses:SendRawEmail",
      "Resource": "*"
    }
  ]
}
```
