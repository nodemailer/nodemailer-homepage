---
title: List headers
sidebar_position: 16
description: Add RFC 2369 List-* headers for mailing list functionality like unsubscribe links.
---

Mailing lists use special [RFC 2369](https://www.rfc-editor.org/rfc/rfc2369) **`List-*` headers** (such as `List-Help`, `List-Unsubscribe`, and others) to help email clients display useful actions like "Unsubscribe" buttons. Instead of manually constructing these headers using the [custom headers](./custom-headers) option, you can use Nodemailer's **`list`** option to define them in a simple, declarative way.

## How it works

Add a `list` object to your `transporter.sendMail()` call. Each property name in this object corresponds to a `List-*` header. The property names are case-insensitive, so `help` creates a `List-Help` header, `unsubscribe` creates `List-Unsubscribe`, and so on.

### Value formats

| Value type                            | Result                                                                                                     |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `string`                              | A single URL. Nodemailer automatically wraps it in angle brackets (`<...>`) and adds `mailto:` if needed. |
| `{ url, comment }`                    | A URL with an optional human-readable comment displayed after it.                                          |
| `Array< string \| { url, comment } >` | Multiple separate header lines for the same `List-*` type.                                                 |
| Nested array (`Array<Array<...>>`)    | Multiple URLs combined into a single header line, separated by commas.                                     |

:::tip URL handling
Nodemailer automatically formats URLs for you:
- Email addresses like `admin@example.com` become `<mailto:admin@example.com>`
- URLs starting with `http`, `https`, `mailto`, or `ftp` are wrapped in angle brackets as-is
- Other strings are treated as domains and prefixed with `http://`

Comments containing non-ASCII characters are automatically encoded for email compatibility.
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
    text: "I hope no one unsubscribes from this list!",
    list: {
      // List-Help: <mailto:admin@example.com?subject=help>
      help: "admin@example.com?subject=help",

      // List-Unsubscribe: <http://example.com> (Comment)
      unsubscribe: {
        url: "http://example.com",
        comment: "Comment",
      },

      // Two separate List-Subscribe header lines:
      // List-Subscribe: <mailto:admin@example.com?subject=subscribe>
      // List-Subscribe: <http://example.com> (Subscribe)
      subscribe: [
        "admin@example.com?subject=subscribe",
        {
          url: "http://example.com",
          comment: "Subscribe",
        },
      ],

      // Multiple URLs in a single List-Post header line:
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

  console.log("List message sent");
}

sendListMessage().catch(console.error);
```

### Resulting headers

The example above produces these email headers:

```txt
List-Help: <mailto:admin@example.com?subject=help>
List-Unsubscribe: <http://example.com> (Comment)
List-Subscribe: <mailto:admin@example.com?subject=subscribe>
List-Subscribe: <http://example.com> (Subscribe)
List-Post: <http://example.com/post>, <mailto:admin@example.com?subject=post> (Post)
```
