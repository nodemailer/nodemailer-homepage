---
title: Receiving email
sidebar_position: 3
description: Nodemailer only sends email. Learn how to receive and read email in Node.js with smtp-server, ImapFlow, and mailparser.
---

# Receiving email in Node.js

Nodemailer sends email. It does not receive it, and it never will: accepting mail is a different problem with different infrastructure, and bolting it onto a sending library would serve neither purpose well.

"Receiving email" actually means one of two different things, and the right tool depends on which one you need:

1. **Accepting inbound mail** - running a server that other mail servers deliver to. You own the domain, you publish its MX records, and messages for `anything@yourdomain.com` arrive at your process.
2. **Reading a mailbox** - connecting to an existing account (Gmail, Microsoft 365, or any IMAP provider) and processing the messages in it.

Both paths have solid, actively maintained options in the Nodemailer ecosystem.

## Accepting inbound mail with smtp-server

The [smtp-server](/extras/smtp-server) package gives you an SMTP interface that other mail servers can connect to and deliver mail through. Combined with [mailparser](/extras/mailparser), a few lines are enough to accept and parse incoming messages:

```javascript
const { SMTPServer } = require("smtp-server");
const { simpleParser } = require("mailparser");

const server = new SMTPServer({
  // Inbound MX traffic is not authenticated
  authOptional: true,
  onData(stream, session, callback) {
    simpleParser(stream)
      .then((parsed) => {
        console.log("Received: %s", parsed.subject);
        console.log("From: %s", parsed.from.text);
        callback();
      })
      .catch(callback);
  },
});

server.listen(25);
```

Keep in mind what this makes you: the mail server for your domain. For messages to arrive, the domain's MX records must point at your host, port 25 must be reachable, and you are now responsible for TLS, spam filtering, greylisting retries, and staying available, because sending servers give up after a few days of failed delivery. This is the right approach for things like reply-catcher addresses, inbound webhooks on your own domain, and test environments. It is a serious commitment as a general mailbox replacement.

## Reading a mailbox with ImapFlow

If the mail already arrives at an existing account, you do not need to run a server. [ImapFlow](https://imapflow.com/) is a modern, Promise-based IMAP client from the Nodemailer team that connects to any IMAP provider:

```javascript
const { ImapFlow } = require("imapflow");
const { simpleParser } = require("mailparser");

const client = new ImapFlow({
  host: "imap.example.com",
  port: 993,
  secure: true,
  auth: {
    user: "user@example.com",
    pass: "password",
  },
});

const main = async () => {
  await client.connect();

  const lock = await client.getMailboxLock("INBOX");
  try {
    // Find unread messages
    const uids = await client.search({ seen: false }, { uid: true });

    for (const uid of uids) {
      // Download and parse the full message
      const { content } = await client.download(uid, undefined, { uid: true });
      const parsed = await simpleParser(content);
      console.log("%s: %s", parsed.from.text, parsed.subject);
    }
  } finally {
    lock.release();
  }

  await client.logout();
};

main().catch(console.error);
```

ImapFlow also supports IDLE, so you can react to new messages in near real time instead of polling, and it handles IMAP protocol extensions automatically. See the [ImapFlow documentation](https://imapflow.com/docs/) for guides and the full API.

## What production adds to the picture

The examples above work, and for a single account with password authentication they may be all you need. Production mailbox integrations tend to accumulate more moving parts:

- **OAuth2** - Gmail and Microsoft 365 expect OAuth2 rather than passwords for automated access. That means registering an OAuth2 application, passing provider verification, running the consent flow, storing refresh tokens, and renewing access tokens before they expire.
- **Connection babysitting** - IMAP connections drop. Something has to reconnect, resynchronize the mailbox state, and detect the messages that arrived while the connection was down, without processing anything twice.
- **Scale** - one account is a script; hundreds of accounts are a connection pool with scheduling, rate limits, and per-provider quirks.

If you would rather not own that infrastructure, [**EmailEngine**](https://emailengine.app/?utm_source=nodemailer.com&utm_medium=inline&utm_campaign=oss-docs&utm_content=receiving-email), from the Nodemailer team, packages it: a self-hosted service that runs ImapFlow under the hood, manages OAuth2 apps and token refresh for Gmail and Microsoft 365, keeps connections alive, and posts a webhook to your application whenever a message arrives. Your code receives JSON instead of speaking IMAP, and sending through the same account works too. It runs on your own servers, so the mail never passes through a third party.

## Summary

| You need | Use |
| --- | --- |
| Mail delivered to your own domain, in your process | [smtp-server](/extras/smtp-server) + [mailparser](/extras/mailparser) |
| Read and monitor an existing mailbox | [ImapFlow](https://imapflow.com/) + [mailparser](/extras/mailparser) |
| Many accounts, OAuth2, webhooks, production operation | [EmailEngine](https://emailengine.app/?utm_source=nodemailer.com&utm_medium=inline&utm_campaign=oss-docs&utm_content=receiving-email) |
