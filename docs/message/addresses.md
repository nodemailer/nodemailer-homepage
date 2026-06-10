---
title: Address object
sidebar_position: 1
description: Email address formats - plain string, formatted with display name, or object notation.
---

Nodemailer accepts email addresses in **three interchangeable formats**. You can use any of these formats (or mix them together) in any address field, including `from`, `to`, `cc`, `bcc`, `replyTo`, and `sender`. For a complete list of message fields, see [message configuration](./index.md).

## 1. Plain email address

The simplest format is just the email address as a string:

```javascript
"foobar@example.com"
```

---

## 2. Formatted address (display name + email)

To include a display name alongside the email address, use the standard email format with angle brackets. Nodemailer fully supports Unicode characters in display names:

```javascript
"Ноде Майлер <foobar@example.com>"
```

:::tip Handling commas and special characters
Since address fields use commas to separate multiple recipients, you must wrap display names containing commas (or other special characters like semicolons) in double quotes:

```javascript
'"Майлер, Ноде" <foobar@example.com>'
```

Quoting is the reliable way to include commas. Nodemailer attempts to recombine display names that were split on an unquoted comma, but this heuristic only works when the name fragment is followed by an address in angle brackets — so always quote names containing commas or semicolons.
:::

---

## 3. Address object

For the most reliable approach, pass a plain JavaScript object with `name` and `address` properties. This lets Nodemailer handle all the escaping and formatting automatically, so you do not need to worry about special characters:

```javascript
{
  name: "Майлер, Ноде",
  address: "foobar@example.com"
}
```

Both properties are optional. If you omit `name`, only the email address is used. If you omit `address`, the entry is ignored.

---

## Mixing formats and using arrays

Each address field accepts any of the following input types:

- **A single address** in any of the three formats described above
- **A comma-separated string** containing multiple addresses
- **An array** of addresses (each element can be any format)
- **A mixed array** combining comma-separated strings and address objects

This flexibility allows you to structure your address data in whatever way is most convenient for your application.

```javascript
const message = {
  // Single formatted address string
  from: '"Example Sender" <sender@example.com>',

  // Comma-separated string with multiple recipients
  to: 'foobar@example.com, "Ноде Майлер" <bar@example.com>, "Name, User" <baz@example.com>',

  // Array of address strings
  cc: [
    "first@example.com",
    '"Ноде Майлер" <second@example.com>',
    '"Name, User" <third@example.com>'
  ],

  // Mixed array: strings and address objects together
  bcc: [
    "hidden@example.com",
    {
      name: "Майлер, Ноде",
      address: "another@example.com"
    }
  ]
};
```

---

## Internationalized email addresses

Nodemailer supports internationalized domain names (IDNs) that contain non-ASCII characters. When you provide a Unicode domain and the username (local part) is plain ASCII, Nodemailer automatically converts the domain to the ASCII-compatible [Punycode](https://en.wikipedia.org/wiki/Punycode) encoding required by the email protocol:

```javascript
"andris@уайлддак.орг"
// Nodemailer converts the domain to punycode: andris@xn--80aalaxjd5d.xn--c1avg
```

If the username itself contains non-ASCII characters, the whole address already requires the SMTPUTF8 extension (see below), so the domain is kept in Unicode form instead of being punycoded.

### Unicode usernames (EAI/SMTPUTF8)

Email addresses with non-ASCII characters in the local part (the username before the `@` symbol) require the receiving server to support the SMTPUTF8 extension. Nodemailer automatically detects when internationalized usernames are used and adds the `SMTPUTF8` parameter to the `MAIL FROM` command — but only when the server advertises SMTPUTF8 support. For more details about SMTP envelope handling, see [SMTP envelope](../smtp/envelope.md).

If the server does not support SMTPUTF8, Nodemailer still attempts delivery without the parameter; servers that cannot handle internationalized addresses typically reject the `MAIL FROM` or `RCPT TO` command, which surfaces as an `EENVELOPE` error.

---

## Complete example

The following example demonstrates how to send an email using multiple address formats together. For more information about configuring SMTP transport options, see [SMTP transport](../smtp/index.md).

```javascript
const nodemailer = require("nodemailer");

async function sendEmail() {
  // Create a transport with your SMTP server settings
  const transport = nodemailer.createTransport({
    host: "smtp.example.com",
    port: 587,
    auth: {
      user: "smtp-user",
      pass: "smtp-pass"
    }
  });

  // Send an email using mixed address formats
  await transport.sendMail({
    from: '"Example Sender" <sender@example.com>',
    to: [
      "recipient@example.com",                              // Plain address
      { name: "Nodemailer User", address: "user@example.com" }  // Address object
    ],
    subject: "Hello from Nodemailer",
    text: "This demonstrates the different address formats."
  });
}

sendEmail().catch(console.error);
```
