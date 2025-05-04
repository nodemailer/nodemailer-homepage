---
title: Address object
sidebar\_position: 13
---

Email address values in Nodemailer can be provided in **three interchangeable formats**. You can freely mix these formats in any address field (`from`, `to`, `cc`, `bcc`, `replyTo`, etc.).

## 1. Plain address

```javascript
"foobar@example.com";
```

---

## 2. Formatted address (display name + email)

Includes full Unicode support for the display name:

```javascript
"Ноде Майлер <foobar@example.com>";
```

:::tip Commas & other special characters
All address fields are comma‑separated lists. If the display name itself contains a comma (or any other special character), wrap the name in **double quotes**:

```javascript
'"Майлер, Ноде" <foobar@example.com>';
```

:::

---

## 3. Address object

Let Nodemailer handle the formatting for you—just provide a plain object with `name` and `address` properties:

```javascript
{
  name: 'Майлер, Ноде',
  address: 'foobar@example.com'
}
```

---

## Mixing formats & using arrays

Every address field accepts **any** of the following:

- a single address (any of the three formats above)
- a comma‑separated string of addresses
- an array of addresses
- an array that contains comma‑separated strings **and/or** address objects

```javascript
// Example message object (CommonJS)
const message = {
  from: '"Example Sender" <sender@example.com>',
  to: 'foobar@example.com, "Ноде Майлер" <bar@example.com>, "Name, User" <baz@example.com>',
  cc: ["first@example.com", '"Ноде Майлер" <second@example.com>', '"Name, User" <third@example.com>'],
  bcc: [
    "hidden@example.com",
    {
      name: "Майлер, Ноде",
      address: "another@example.com",
    },
  ],
};
```

---

## Internationalized domains

Unicode domain names (IDNs) are welcome—Nodemailer automatically converts them to [Punycode](https://en.wikipedia.org/wiki/Punycode) behind the scenes:

```javascript
'"Unicode Domain" <info@müriaad-polüteism.info>';
```

---

### Quick send example

```javascript
const nodemailer = require("nodemailer");

(async () => {
  const transport = nodemailer.createTransport({
    host: "smtp.example.com",
    port: 587,
    auth: {
      user: "smtp-user",
      pass: "smtp-pass",
    },
  });

  await transport.sendMail({
    from: '"Example Sender" <sender@example.com>',
    to: ["recipient@example.com", { name: "Nodemailer User", address: "user@example.com" }],
    subject: "Hello from Nodemailer",
    text: "This demonstrates the different address formats.",
  });
})();
```
