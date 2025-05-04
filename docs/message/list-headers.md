---
title: List headers
sidebar_position: 16
---

Nodemailer includes a helper for setting more complex `List-*` headers with ease. You can use this by providing message option **list**. It's an object where key names are converted into list headers. List key `help` becomes `List-Help` header etc.

**General rules**

- If the value is a string, it is treated as an URL
- If you want to provide an optional comment, use `{url:'url', comment: 'comment'}` object
- If you want to have multiple header rows for the same `List-*` key, use an array as the value for this key
- If you want to have multiple URLs for single `List-*` header row, use an array inside an array
- `List-*` headers are treated as pregenerated values, this means that lines are not folded and strings are not encoded. Use only ascii characters and be prepared for longer header lines

### Examples

#### 1\. Setup different List-\* headers

```javascript
let message = {
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "List Message",
  text: "I hope no-one unsubscribes from this list!",
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
};
```
