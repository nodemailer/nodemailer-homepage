---
title: List headers
sidebar\_position: 16
---

Adding [RFC 2369](https://www.rfc-editor.org/rfc/rfc2369) **`List-*` headers** (such as `List‑Help`, `List‑Unsubscribe`, etc.) lets mailing‑list recipients quickly discover helpful actions provided by email clients. Nodemailer exposes a **`list`** message option so you can define these headers declaratively instead of hand‑crafting raw header lines.

## How it works

Pass a `list` object to `transporter.sendMail()`. Each key in that object becomes the corresponding `List-*` header name (case‑insensitive). For example, `help` becomes the `List-Help` header.

### Value formats

| Value type                            | Meaning                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `string`                              | Interpreted as a single URL. Nodemailer automatically wraps it in `<…>` |
| `{ url, comment }`                    | URL plus an **optional human‑readable comment**                         |
| `Array< string \| { url, comment } >` | Multiple header **rows** for the same `List-*` key                      |
| Nested array (`Array<Array<…>>`)      | Multiple **URLs in a single header row**                                |

:::warning ASCII only
`List-*` values are inserted verbatim—lines aren’t folded and strings aren’t encoded. Stick to ASCII characters and be prepared for lengthy header lines.
:::

## Complete example

```javascript
const nodemailer = require("nodemailer");

// 1. Create a transport (replace with your configuration)
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  auth: {
    user: "username",
    pass: "password",
  },
});

// 2. Send a message with various List-* headers
async function sendListMessage() {
  await transporter.sendMail({
    from: "sender@example.com",
    to: "recipient@example.com",
    subject: "List Message",
    text: "I hope no‑one unsubscribes from this list!",
    list: {
      // List-Help: <mailto:admin@example.com?subject=help>
      help: "admin@example.com?subject=help",

      // List-Unsubscribe: <http://example.com> (Comment)
      unsubscribe: {
        url: "http://example.com",
        comment: "Comment",
      },

      // List-Subscribe: <mailto:admin@example.com?subject=subscribe>
      // List-Subscribe: <http://example.com> (Subscribe)
      subscribe: [
        "admin@example.com?subject=subscribe",
        {
          url: "http://example.com",
          comment: "Subscribe",
        },
      ],

      // List-Post: <http://example.com/post>, <mailto:admin@example.com?subject=post> (Post)
      post: [
        [
          "http://example.com/post",
          {
            url: "admin@example.com?subject=post",
            comment: "Post",
          },
        ],
      ],
    },
  });

  console.log("List message sent ✔");
}

sendListMessage().catch(console.error);
```

### Resulting headers (excerpt)

```txt
List-Help: <mailto:admin@example.com?subject=help>
List-Unsubscribe: <http://example.com> (Comment)
List-Subscribe: <mailto:admin@example.com?subject=subscribe>
List-Subscribe: <http://example.com> (Subscribe)
List-Post: <http://example.com/post>, <mailto:admin@example.com?subject=post> (Post)
```
