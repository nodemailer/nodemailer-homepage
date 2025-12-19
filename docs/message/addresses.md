---
title: Address object
sidebar_position: 13
---

Nodemailer accepts email addresses in **three interchangeable formats**. You can use any of these formats (or mix them together) in any address field, including `from`, `to`, `cc`, `bcc`, `replyTo`, and `sender`.

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

Without the double quotes, Nodemailer would incorrectly interpret the comma as a separator between two addresses.
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

## Internationalized domain names

Nodemailer supports internationalized domain names (IDNs) that contain non-ASCII characters. When you provide a Unicode domain, Nodemailer automatically converts it to the ASCII-compatible [Punycode](https://en.wikipedia.org/wiki/Punycode) encoding required by the email protocol:

```javascript
'"Unicode Domain" <info@müriaad-polüteism.info>'
// Nodemailer converts this to: info@xn--mriaad-polteism-zvbj.info
```

---

## Complete example

The following example demonstrates how to send an email using multiple address formats together:

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
