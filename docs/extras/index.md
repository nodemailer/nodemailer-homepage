---
title: Extra modules
sidebar_position: 8
---

Beyond Nodemailer itself, a collection of companion libraries can help you receive, compose, parse, and preview e‑mail inside your Node.js applications.

## Official companion libraries

1. [smtp-server](/extras/smtp-server) – Accept inbound SMTP connections and build a custom SMTP server or test harness.
2. [smtp-connection](/extras/smtp-connection) – Low‑level SMTP client for establishing outbound SMTP connections; the building block used by Nodemailer’s SMTP transport.
3. [mailparser](/extras/mailparser) – Streaming parser that converts raw RFC 822 e‑mail into a structured JavaScript object you can easily inspect.
4. [mailcomposer](/extras/mailcomposer) – Utility for generating RFC 822‑compliant message bodies from a JavaScript object. Handy when you need a MIME string but do not want to send it right away.

## Related projects

5. [EmailEngine](https://emailengine.app/?utm_source=nodemailer&utm_campaign=nodemailer&utm_medium=module-link) – Self‑hosted REST interface that exposes any IMAP mailbox over HTTP and sends mail over SMTP. Offers webhook push notifications for real‑time updates.
6. [ImapFlow](https://imapflow.com/) – Modern Promise‑based IMAP client designed for EmailEngine but fully usable on its own.
7. [mailauth](https://github.com/andris9/mailauth) – Validate and generate SPF, DKIM, DMARC, ARC, and BIMI records in Node.js.
8. [email-templates](https://github.com/forwardemail/email-templates) – Framework for creating, previewing (browser/iOS Simulator), and sending custom e‑mail templates.
9. [preview-email](https://github.com/forwardemail/preview-email) – Automatically opens your browser to preview e‑mails generated with Nodemailer during development.

---

> **Note:** The first four packages are maintained within the Nodemailer GitHub organisation and follow the same release cadence as Nodemailer itself. The rest are separate open‑source projects maintained by the wider community.
