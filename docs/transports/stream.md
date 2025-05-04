---
title: Stream transport
sidebar_position: 28
description: Generate RFC 822 messages as streams, Buffers, or JSON objects for testing or custom delivery workflows.
---

Stream transport is **not** a real SMTP transport. Instead of handing the message off to a remote mail server it _builds_ the complete RFC 822 e‑mail and gives it back to you. This makes it perfect for

- **Testing** – inspect the exact bytes that would be sent over the wire, run snapshot tests, or feed the output to another system.
- **Custom delivery pipelines** – run Nodemailer plugins (DKIM, list headers, etc.) and then deliver the message yourself via an in‑house API, store it for audit logging, and so on.

---

## Enabling Stream transport

Create the transporter just like any other Nodemailer transport, but pass `streamTransport: true` in the constructor options:

```javascript
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  streamTransport: true,
  // optional tweaks shown below
});
```

### Options

| Option            | Type                  | Default      | Description                                                                                            |
| ----------------- | --------------------- | ------------ | ------------------------------------------------------------------------------------------------------ |
| `streamTransport` | `boolean`             | **required** | Enable Stream transport.                                                                               |
| `buffer`          | `boolean`             | `false`      | Return the generated message as a `Buffer` instead of a `Readable` stream.                             |
| `newline`         | `'windows' \| 'unix'` | `'unix'`     | New‑line format for the generated message: CR LF (`\r\n`) for Windows or LF (`\n`) for Unix‑style.     |
| `jsonTransport`   | `boolean`             | `false`      | **Alternative** to `streamTransport`. Returns a JSON string representation of the message (see below). |

### `sendMail()` callback signature

The callback receives `(err, info)` where `info` contains:

- **`envelope`** – the SMTP envelope `{ from, to }`.
- **`messageId`** – the _Message‑ID_ header value.
- **`message`** – a Node.js `Readable` stream (default) **or** a `Buffer`/JSON string depending on the options you set.

---

## Examples

### 1. Stream a message with Windows‑style new‑lines

```javascript
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  streamTransport: true,
  newline: "windows", // CRLF (\r\n)
});

transporter.sendMail(
  {
    from: "sender@example.com",
    to: "recipient@example.com",
    subject: "Streamed message",
    text: "This message is streamed using CRLF new‑lines.",
  },
  (err, info) => {
    if (err) throw err;
    console.log(info.envelope);
    console.log(info.messageId);
    // Pipe the raw RFC 822 message to STDOUT
    info.message.pipe(process.stdout);
  }
);
```

### 2. Return a `Buffer` with Unix‑style new‑lines

```javascript
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  streamTransport: true,
  buffer: true, // return Buffer instead of Stream
  newline: "unix", // LF (\n)
});

transporter.sendMail(
  {
    from: "sender@example.com",
    to: "recipient@example.com",
    subject: "Buffered message",
    text: "This message is buffered using LF new‑lines.",
  },
  (err, info) => {
    if (err) throw err;
    console.log(info.envelope);
    console.log(info.messageId);
    // The complete message is in a single Buffer
    console.log(info.message.toString());
  }
);
```

### 3. Generate a JSON‑encoded message object (≥ v3.1.0)

Pass `jsonTransport: true` (and omit `streamTransport`). The resulting `info.message` is a serialized JSON string that you can later feed back to Nodemailer or inspect in your tests. Binary data such as attachments is base64‑encoded.

```javascript
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  jsonTransport: true,
});

transporter.sendMail(
  {
    from: "sender@example.com",
    to: "recipient@example.com",
    subject: "JSON message",
    text: "I hope this message gets JSON‑ified!",
  },
  (err, info) => {
    if (err) throw err;
    console.log(info.envelope);
    console.log(info.messageId);
    console.log(info.message); // JSON string
  }
);
```

An abbreviated example of the JSON payload:

```json
{
  "from": { "address": "sender@example.com", "name": "" },
  "to": [{ "address": "recipient@example.com", "name": "" }],
  "subject": "JSON message",
  "text": "I hope this message gets JSON‑ified!",
  "headers": {},
  "messageId": "<77a3458f-8070-339d-095f-85bb73f3db8e@example.com>"
}
```

---

## When to choose Stream vs. JSON transport

| Use case                                    | Recommended option                      |
| ------------------------------------------- | --------------------------------------- |
| Inspect or pipe raw SMTP content            | `streamTransport` (Stream or Buffer)    |
| Persist structured message for later replay | `jsonTransport`                         |
| Need to support Nodemailer plugins          | Both (plugins run before serialization) |
| Want `_raw` property support                | **Stream transport only**               |
