---
title: Sendmail transport
sidebar_position: 27
---

The **Sendmail transport** hands the generated RFC 822 message off to the local **sendmail** (or compatible) binary by piping it to _stdin_. Functionally, this is the same mechanism used by PHP's `mail()` helper.

## Usage

```javascript
// CommonJS
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  sendmail: true, // enable Sendmail transport
});
```

Setting `sendmail: true` activates the transport. Nodemailer will try to locate the binary automatically (defaults to `sendmail` in your `PATH`). If necessary, you can point Nodemailer to a different binary with the `path` option (see below).

### Transport options

| Option    | Type                   | Default      | Description                                                                                                                                                                                                                                                                   |
| --------- | ---------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`    | `String`               | `'sendmail'` | Absolute or relative path to the **sendmail** binary.                                                                                                                                                                                                                         |
| `newline` | `'unix'` / `'windows'` | `'unix'`     | Forces all line‑breaks in the generated message body to Unix (`\n`) or Windows (`\r\n`) style.                                                                                                                                                                                |
| `args`    | `String[]`             | _none_       | Additional **sendmail** CLI flags. Supplied flags completely replace Nodemailer's defaults **except** `-i` (do not treat a single dot on a line as message end) and the recipient list. Make sure to include every flag your installation requires—especially **-f \<from>**. |

When no custom `args` array is passed Nodemailer will execute

```sh
sendmail -i -f <from> <to…>
```

With `args` provided the command becomes

```sh
sendmail -i <args…> <to…>
```

### Response

The `info` object that `transporter.sendMail()` yields contains the following properties—`sendmail` writes nothing to stdout/stderr:

- `envelope` – `{ from: 'address', to: ['address', …] }`
- `messageId` – value of the generated **Message‑ID** header
- `response` – the string `'Messages queued for delivery'`

### Troubleshooting

If Nodemailer cannot find **/usr/bin/sendmail** (the default on most Unix systems) make sure the binary is installed and available on your `PATH`. Consult your distribution's documentation or the [Computer Hope sendmail reference](https://www.computerhope.com/unix/usendmai.htm) for installation instructions.

### Examples

#### Pipe to a specific binary

```javascript
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  sendmail: true,
  newline: "unix",
  path: "/usr/sbin/sendmail",
});

transporter.sendMail(
  {
    from: "sender@example.com",
    to: "recipient@example.com",
    subject: "Test message",
    text: "I hope this message gets delivered!",
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

If you need to pass custom flags—for example, to override the envelope sender—include them via the `args` option:

```javascript
const transporter = nodemailer.createTransport({
  sendmail: true,
  args: ["-f", "bounce@example.com"],
});
```
