---
title: Alternatives
sidebar_position: 12
---

In addition to plain‑text and HTML bodies, you can embed **alternative representations** of the same content—for example, Markdown or a calendar invite. The email client chooses the representation that best fits the recipient’s environment. Alternatives are most often used for calendar events and other machine‑readable formats.

:::tip Prefer `icalEvent` for calendar invites
If you want to send a calendar event, consider the **`icalEvent`** option instead. See [Calendar events](/message/calendar-events/) for details.
:::

## How alternatives differ from attachments

Alternative objects accept exactly the same fields as [attachment objects](/message/attachments/). The only difference is where Nodemailer places them in the MIME tree:

| Purpose          | MIME container                           |
| ---------------- | ---------------------------------------- |
| Attachments      | `multipart/mixed` or `multipart/related` |
| **Alternatives** | `multipart/alternative`                  |

## Usage

```javascript
const message = {
  // ...
  html: "<b>Hello world!</b>",
  alternatives: [
    {
      contentType: "text/x-web-markdown",
      content: "**Hello world!**",
    },
  ],
};
```

You can include **as many** alternative bodies as you need. Place the most preferred version last—the majority of clients read the list from top to bottom and render the last format they understand.
