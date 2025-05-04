---
title: SES transport
sidebar_position: 28
---

Nodemailer SES transport is a thin wrapper around the AWS SDK package [@aws‑sdk/client‑sesv2](https://www.npmjs.com/package/@aws-sdk/client-sesv2).

## Usage

To enable SES transport, pass the **SES** option to _createTransport()_.

- **SES** — object that exposes the SDK classes Nodemailer needs

  - **sesClient** — a pre‑configured _SESv2Client_ instance
  - **SendEmailCommand** — the _SendEmailCommand_ class

### Message‑level options

_sendMail()_ accepts an optional **ses** property. All keys of this object are merged into the input object passed to _SendEmailCommand_, allowing you to set any parameter supported by the operation (for example _EmailTags_, _ConfigurationSetName_, …).

### Response

The callback/result object contains:

- **envelope** — `{from: 'address', to: ['address']}`
- **messageId** — value returned by SES in the _MessageId_ field (SES will override the original Message‑ID header)

### Troubleshooting

**Not allowed to send messages**

1. Verify that the IAM principal used by the SDK has the _ses:SendRawEmail_ permission (see [example 2](#example-2)).
2. Confirm that the _From_ address (or the domain) is verified in the SES console.
3. (Rare) AWS access keys that include non‑alphanumeric characters have been reported to fail; regenerate the keys if permission checks look correct.

**Module not found**

_@aws-sdk/client-sesv2_ is not bundled with Nodemailer. Install it explicitly:

```bash
npm install @aws-sdk/client-sesv2
```

### Examples

#### 1. Send a message {#example-1}

```javascript
const nodemailer = require("nodemailer");
const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");

const sesClient = new SESv2Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

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

#### 2. Minimal IAM policy {#example-2}

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
