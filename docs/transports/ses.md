---
title: SES transport
sidebar_position: 29
description: Deliver email through Amazon SES using the official AWS SDK v3.
---

The Nodemailer **SES transport** allows you to send emails through **Amazon Simple Email Service (SES)** using the official AWS SDK v3 package [@aws-sdk/client-sesv2](https://www.npmjs.com/package/@aws-sdk/client-sesv2).
It acts as a wrapper around the [`SendEmailCommand`](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/sesv2/) while letting you use the familiar `transporter.sendMail()` API you already know from Nodemailer.

For an overview of all available transports, see the [transports documentation](./).

The AWS SES SDK is not included with Nodemailer, so you need to install it separately:

```bash
npm install @aws-sdk/client-sesv2
```

## Quick start

```javascript
const nodemailer = require("nodemailer");
const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");

// 1. Create an AWS SES client
//    If you omit credentials, the SDK uses the default credential chain
//    (environment variables, shared credentials file, IAM role, etc.)
const sesClient = new SESv2Client({ region: "us-east-1" });

// 2. Create a Nodemailer transport configured to use SES
const transporter = nodemailer.createTransport({
  SES: { sesClient, SendEmailCommand },
});

// 3. Send the message
const info = await transporter.sendMail({
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Hello from Nodemailer + SES",
  text: "I hope this message gets sent!",
  // You can pass additional SES-specific options under the `ses` key:
  ses: {
    ConfigurationSetName: "my-config-set",
    EmailTags: [{ Name: "tag_name", Value: "tag_value" }],
  },
});

console.log(info.envelope); // { from: "sender@example.com", to: ["recipient@example.com"] }
console.log(info.messageId); // The SES Message ID
```

:::tip
You can also use the callback style if you prefer: `transporter.sendMail(mailOptions, callback)`.
:::

## Transport options

When calling `createTransport()`, pass an object with an `SES` property. This `SES` object must contain the following **required** keys:

| Key                | Type               | Description                                                   |
| ------------------ | ------------------ | ------------------------------------------------------------- |
| `sesClient`        | `SESv2Client`      | An initialized AWS SDK v3 SES client instance                 |
| `SendEmailCommand` | `SendEmailCommand` | The `SendEmailCommand` class from **@aws-sdk/client-sesv2**   |

:::warning Property names matter
The property **must** be named exactly `sesClient` (not `client`, `ses`, or any other name). If you store your client in a variable with a different name, use explicit property syntax to rename it:

```javascript
const myClient = new SESv2Client({ region: "us-east-1" });
const transporter = nodemailer.createTransport({
  SES: { sesClient: myClient, SendEmailCommand }, // rename myClient to sesClient
});
```
:::

## Message-level options

When calling `sendMail()`, you can include an optional **ses** property in your [mail options](../message/) object.
Any properties you add to this object are passed directly to the AWS `SendEmailCommand`, allowing you to use SES-specific features such as `EmailTags`, `ConfigurationSetName`, `FeedbackForwardingEmailAddress`, and more. See the [AWS SES documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/sesv2/command/SendEmailCommand/) for all available options.

## Response object

When the email is sent successfully, the promise resolves (or the callback receives) an object with the following properties:

| Property    | Description                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------- |
| `envelope`  | An object containing `from` (string) and `to` (array of strings) representing the email envelope   |
| `messageId` | The Message ID returned by SES, formatted as a standard Message-ID header value                    |
| `response`  | The raw Message ID string as returned by SES (without angle brackets or domain suffix)             |
| `raw`       | A `Buffer` containing the complete raw RFC 822 message that was sent to SES                        |

## Troubleshooting

### "User is not authorized to perform: ses:SendRawEmail"

This error means your AWS credentials lack the required permissions. To resolve it:

1. Verify that the IAM user or role associated with your credentials has the **ses:SendRawEmail** permission. See the [minimal IAM policy example](#example-2) below.
2. Ensure the **From** address (or its entire domain) is verified in the [SES console](https://console.aws.amazon.com/ses/). SES requires sender verification before you can send emails.
3. If your SES account is still in sandbox mode, you must also verify each recipient address. Request production access to remove this restriction.
4. In rare cases, AWS access keys containing special characters have caused authentication failures. If everything else looks correct, try regenerating your access keys.

### "Cannot find module '@aws-sdk/client-sesv2'"

The AWS SES SDK is not bundled with Nodemailer. You need to install it as a separate dependency:

```bash
npm install @aws-sdk/client-sesv2
```

### Using the verify() method with SES

The SES transport supports the `transporter.verify()` method to validate your configuration. Unlike [SMTP transports](../smtp/), which test the actual connection, the SES verify method works by attempting to send an invalid test message. If SES responds with an `InvalidParameterValue` or `MessageRejected` error, the verification is considered successful because it confirms your credentials and configuration are correct.

```javascript
// Verify SES configuration
const isValid = await transporter.verify();
console.log("SES configuration is valid:", isValid);
```

## Examples

### 1. Send a message {#example-1}

This example shows how to send an email using the callback style, which is useful when you are not using async/await:

```javascript
const nodemailer = require("nodemailer");
const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");

// Create the SES client using the AWS_REGION environment variable
const sesClient = new SESv2Client({ region: process.env.AWS_REGION });

// Create the Nodemailer transport
const transporter = nodemailer.createTransport({
  SES: { sesClient, SendEmailCommand },
});

// Send the email
transporter.sendMail(
  {
    from: "sender@example.com",
    to: ["recipient@example.com"],
    subject: "Message via SES transport",
    text: "I hope this message gets sent!",
    ses: {
      // Add tags for tracking and analytics
      EmailTags: [{ Name: "tag_name", Value: "tag_value" }],
    },
  },
  (err, info) => {
    if (err) {
      console.error("Failed to send email:", err);
      return;
    }
    console.log("Email sent successfully!");
    console.log("Envelope:", info.envelope);
    console.log("Message ID:", info.messageId);
  }
);
```

### 2. Minimal IAM policy {#example-2}

Your AWS IAM user or role needs permission to call `ses:SendRawEmail`. Here is the minimal IAM policy required:

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

For production environments, consider restricting the `Resource` to specific verified identities rather than using `"*"`.
