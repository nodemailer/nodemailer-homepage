---
title: Sendmail transport
sidebar_position: 27
---

The **Sendmail transport** delivers email by passing the generated RFC 822 message to the local **sendmail** command (or a compatible mail transfer agent such as Postfix or Exim). The message is piped directly to the program's standard input. This is the same mechanism used by PHP's `mail()` function.

## Usage

```javascript
// CommonJS
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  sendmail: true, // enable Sendmail transport
});
```

Setting `sendmail: true` activates the Sendmail transport. Nodemailer looks for a `sendmail` executable in your system's `PATH` by default. If your sendmail binary is located elsewhere, you can specify the full path using the `path` option described below.

### Transport options

| Option    | Type                   | Default      | Description                                                                                                                                                                                                                                                                            |
| --------- | ---------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`    | `String`               | `'sendmail'` | Path to the **sendmail** binary. Can be an absolute path (e.g., `/usr/sbin/sendmail`) or just the executable name if it is in your `PATH`.                                                                                                                                            |
| `newline` | `'unix'` / `'windows'` | `'unix'`     | Line ending style for the generated message. Use `'unix'` for `\n` (LF) or `'windows'` for `\r\n` (CRLF). Most systems work fine with the default `'unix'` setting.                                                                                                                   |
| `args`    | `String[]`             | _none_       | Custom command-line arguments for the sendmail binary. When you provide this array, it replaces Nodemailer's default arguments **except** for `-i` (which is always included) and the recipient addresses (which are always appended). See the examples below for common use cases. |

When no custom `args` array is provided, Nodemailer executes the following command:

```sh
sendmail -i -f <from> <to...>
```

When you provide a custom `args` array, the command becomes:

```sh
sendmail -i <args...> <to...>
```

Note that the `-i` flag (which prevents a single dot on a line from being treated as the end of the message) and the recipient list are always included automatically.

### Response

After successfully sending a message, `transporter.sendMail()` resolves with an `info` object containing the following properties:

- `envelope` - An object with `from` (string) and `to` (array of strings) properties representing the message [envelope](../smtp/envelope)
- `messageId` - The generated Message-ID header value for the sent message
- `response` - The string `'Messages queued for delivery'`

Note that the sendmail command does not produce output, so the `response` is a static confirmation message from Nodemailer.

### Troubleshooting

If Nodemailer cannot find the sendmail binary, you will receive an error with exit code 127. To resolve this:

1. Verify that sendmail (or a compatible MTA like Postfix) is installed on your system
2. Check that the binary is accessible via your `PATH`, or specify the full path using the `path` option
3. Common locations include `/usr/sbin/sendmail` and `/usr/lib/sendmail`

For installation instructions, consult your operating system's documentation or the [Computer Hope sendmail reference](https://www.computerhope.com/unix/usendmai.htm).

### Examples

#### Specifying a custom binary path

Use the `path` option when the sendmail binary is not in your `PATH` or you want to use a specific location:

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

#### Passing custom command-line arguments

Use the `args` option to pass additional flags to the sendmail binary. For example, to override the [envelope](../smtp/envelope) sender address (useful for setting a custom bounce address):

```javascript
const transporter = nodemailer.createTransport({
  sendmail: true,
  args: ["-f", "bounce@example.com"],
});
```

When using `args`, remember that you are replacing Nodemailer's default arguments. If you need the `-f` flag for the envelope sender, you must include it explicitly as shown above.
