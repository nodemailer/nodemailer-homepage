---
title: Testing with Ethereal
sidebar_position: 1
description: Use Ethereal.email to test email sending without delivering to real recipients.
---

# Testing with Ethereal

[Ethereal](https://ethereal.email/) is a free fake SMTP service designed for testing Nodemailer and other email-sending applications. Messages sent to Ethereal are captured and displayed in a web interface, but they are **never delivered** to real recipients. This makes Ethereal perfect for development, testing, and debugging.

## Why use Ethereal?

- **No real emails sent** - test freely without worrying about accidentally emailing customers or colleagues
- **Instant preview** - view your emails in a web-based inbox immediately after sending
- **No configuration hassle** - Nodemailer can generate credentials automatically
- **Free to use** - no signup required, reasonable rate limits for development

## Automatic test account

Nodemailer includes built-in support for creating Ethereal test accounts on the fly. Call `nodemailer.createTestAccount()` to generate temporary credentials:

<Tabs groupId="module-system">
<TabItem value="cjs" label="CommonJS">

```javascript
const nodemailer = require("nodemailer");

// Create a test account automatically
const testAccount = await nodemailer.createTestAccount();

// Create a transporter using the test account
const transporter = nodemailer.createTransport({
  host: testAccount.smtp.host,
  port: testAccount.smtp.port,
  secure: testAccount.smtp.secure,
  auth: {
    user: testAccount.user,
    pass: testAccount.pass,
  },
});
```

</TabItem>
<TabItem value="esm" label="ESM">

```javascript
import nodemailer from "nodemailer";

// Create a test account automatically
const testAccount = await nodemailer.createTestAccount();

// Create a transporter using the test account
const transporter = nodemailer.createTransport({
  host: testAccount.smtp.host,
  port: testAccount.smtp.port,
  secure: testAccount.smtp.secure,
  auth: {
    user: testAccount.user,
    pass: testAccount.pass,
  },
});
```

</TabItem>
</Tabs>

The returned `testAccount` object contains:

| Property                            | Description                                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| `user`                              | The generated email address                                                                    |
| `pass`                              | The password, used for SMTP, IMAP, and POP3 alike                                              |
| `smtp.host` / `smtp.port` / `smtp.secure` | SMTP connection settings (`smtp.ethereal.email:587`, STARTTLS)                            |
| `imap.host` / `imap.port` / `imap.secure` | IMAP connection settings (`imap.ethereal.email:993`, implicit TLS), for reading messages back programmatically |
| `pop3.host` / `pop3.port` / `pop3.secure` | POP3 connection settings (`pop3.ethereal.email:995`, implicit TLS)                        |
| `web`                               | URL to the Ethereal web interface                                                              |
| `mxEnabled`                         | Whether the address can receive mail from outside Ethereal. `false` for accounts created this way |

:::note Where the messages go
An Ethereal account never delivers anywhere. Whatever recipient you address, the message lands back in that same account's own mailbox, which is why you can safely send to made-up addresses. The `mxEnabled: false` flag is about the other direction: mail sent to the address from an external server is not accepted.
:::

:::tip Reuse credentials
Within a single process, repeat calls to `createTestAccount()` return the same cached account by default (set the `ETHEREAL_CACHE=no` environment variable to disable this). Each new process run generates a new account, so if you want to view all your test emails in one inbox across runs, save the credentials and reuse them.
:::

## Preview sent messages

After sending an email through Ethereal, use `nodemailer.getTestMessageUrl(info)` to get a direct link to view the message in your browser:

```javascript
const info = await transporter.sendMail({
  from: '"Test Sender" <test@example.com>',
  to: "recipient@example.com",
  subject: "Test Email",
  text: "This is a test email sent via Ethereal!",
  html: "<p>This is a <b>test email</b> sent via Ethereal!</p>",
});

console.log("Message sent: %s", info.messageId);

// Get the Ethereal URL to preview this email
const previewUrl = nodemailer.getTestMessageUrl(info);
console.log("Preview URL: %s", previewUrl);
// Output: https://ethereal.email/message/...
```

Open the preview URL in your browser to see exactly how your email looks, including:

- Headers (From, To, Subject, Date, etc.)
- Plain text and HTML body
- Attachments
- Raw message source

## Complete example

Here is a complete example that creates a test account, sends an email, and outputs a preview link:

<Tabs groupId="module-system">
<TabItem value="cjs" label="CommonJS">

```javascript
const nodemailer = require("nodemailer");

async function sendTestEmail() {
  // Generate a test account
  const testAccount = await nodemailer.createTestAccount();

  console.log("Test account created:");
  console.log("  User: %s", testAccount.user);
  console.log("  Pass: %s", testAccount.pass);

  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  // Send a test message
  const info = await transporter.sendMail({
    from: `"Test App" <${testAccount.user}>`,
    to: "recipient@example.com",
    subject: "Hello from Ethereal!",
    text: "This message was sent using Ethereal.",
    html: "<p>This message was sent using <b>Ethereal</b>.</p>",
  });

  console.log("Message sent: %s", info.messageId);
  console.log("Preview: %s", nodemailer.getTestMessageUrl(info));
}

sendTestEmail().catch(console.error);
```

</TabItem>
<TabItem value="esm" label="ESM">

```javascript
import nodemailer from "nodemailer";

async function sendTestEmail() {
  // Generate a test account
  const testAccount = await nodemailer.createTestAccount();

  console.log("Test account created:");
  console.log("  User: %s", testAccount.user);
  console.log("  Pass: %s", testAccount.pass);

  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  // Send a test message
  const info = await transporter.sendMail({
    from: `"Test App" <${testAccount.user}>`,
    to: "recipient@example.com",
    subject: "Hello from Ethereal!",
    text: "This message was sent using Ethereal.",
    html: "<p>This message was sent using <b>Ethereal</b>.</p>",
  });

  console.log("Message sent: %s", info.messageId);
  console.log("Preview: %s", nodemailer.getTestMessageUrl(info));
}

sendTestEmail().catch(console.error);
```

</TabItem>
</Tabs>

Running this script outputs something like:

```
Test account created:
  User: abc123@ethereal.email
  Pass: XyZ789AbCdEf
Message sent: <abc123@ethereal.email>
Preview: https://ethereal.email/message/AbCdEfGhIjKl
```

## Using the service shortcut

Instead of using `createTestAccount()`, you can also use the `service: "Ethereal"` shortcut if you have existing Ethereal credentials:

```javascript
const transporter = nodemailer.createTransport({
  service: "Ethereal",
  auth: {
    user: "existing-user@ethereal.email",
    pass: "existing-password",
  },
});
```

## Integrating with test frameworks

Ethereal works well with testing frameworks like Jest or Mocha. Create a test account once in your test setup and reuse it:

<Tabs groupId="module-system">
<TabItem value="cjs" label="CommonJS">

```javascript
const nodemailer = require("nodemailer");

let transporter;
let testAccount;

beforeAll(async () => {
  testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
});

test("sends welcome email", async () => {
  const info = await transporter.sendMail({
    from: "app@example.com",
    to: "newuser@example.com",
    subject: "Welcome!",
    text: "Thanks for signing up.",
  });

  expect(info.messageId).toBeDefined();
  expect(info.accepted).toContain("newuser@example.com");

  // Optionally log the preview URL for manual inspection
  console.log("Preview:", nodemailer.getTestMessageUrl(info));
});
```

</TabItem>
<TabItem value="esm" label="ESM">

```javascript
import nodemailer from "nodemailer";

let transporter;
let testAccount;

beforeAll(async () => {
  testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
});

test("sends welcome email", async () => {
  const info = await transporter.sendMail({
    from: "app@example.com",
    to: "newuser@example.com",
    subject: "Welcome!",
    text: "Thanks for signing up.",
  });

  expect(info.messageId).toBeDefined();
  expect(info.accepted).toContain("newuser@example.com");

  // Optionally log the preview URL for manual inspection
  console.log("Preview:", nodemailer.getTestMessageUrl(info));
});
```

</TabItem>
</Tabs>

## Switch transports based on environment

A common pattern is to centralize your transport configuration in one place. This makes it easy to use Ethereal during development and testing while using a production email service in production:

<Tabs groupId="module-system">
<TabItem value="cjs" label="CommonJS">

```javascript
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

</TabItem>
<TabItem value="esm" label="ESM">

```javascript
import nodemailer from "nodemailer";

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

export default createTransport;
```

</TabItem>
</Tabs>

For alternative testing approaches, you can also use the [stream transport](/transports/stream) to capture generated messages without any network connection, or run your own local mail server using [smtp-server](/extras/smtp-server).

## Comparison with other testing options

| Option | Real delivery | Inbox preview | Setup required |
| ------ | ------------- | ------------- | -------------- |
| **Ethereal** | No | Yes | None (auto-generated) |
| [Mailtrap](https://mailtrap.io/) | No | Yes | Account signup |
| [Mailhog](https://github.com/mailhog/MailHog) | No | Yes | Local installation |
| Real SMTP | Yes | N/A | Provider account |

Ethereal is ideal for quick development and testing. For team collaboration or CI/CD pipelines, consider Mailtrap or a self-hosted solution like Mailhog.

## See Also

- [Stream transport](/transports/stream) - inspect generated messages without any network at all.
- [SMTP transport](/smtp/) - point the same code at a real server once testing is done.
- [Message configuration](/message/) - the message fields you will be exercising.
- [Message Playground](/message/playground) - preview a message object in the browser.
- [Error reference](/errors) - what a failed test send is telling you.
