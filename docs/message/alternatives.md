---
title: Alternatives
sidebar_position: 5
description: Include alternative representations of content like Markdown in multipart/alternative.
---

In addition to plain text and HTML, you can include **alternative representations** of your email content. These are different formats of the same message, such as Markdown or a calendar invite. When recipients open your email, their email client automatically selects and displays the best format it supports.

Common use cases for alternatives include:

- Calendar event invitations (though see the tip below)
- Markdown versions of HTML content
- Other machine-readable formats that some email clients can process

:::tip Prefer `icalEvent` for calendar invites
For calendar events specifically, use the dedicated **`icalEvent`** option instead of alternatives. It provides a simpler API with better compatibility. See [Calendar events](./calendar-events) for details.
:::

## How alternatives differ from attachments

Alternative objects use the same content fields as [attachment objects](./attachments): `content`, `path`, `href`, `raw`, `contentType`, `contentTransferEncoding`, `encoding`, `filename`, and `headers`. Attachment-specific fields such as `cid`, `contentDisposition`, and `httpHeaders` are not applied to alternatives. The key difference is how they appear in the email structure:

- **Attachments** are separate files that recipients download. They go in `multipart/mixed` or `multipart/related` containers.
- **Alternatives** are different versions of the email body itself. They go in a `multipart/alternative` container, and the email client picks one to display.

| Purpose          | MIME container                           | What recipients see                    |
| ---------------- | ---------------------------------------- | -------------------------------------- |
| Attachments      | `multipart/mixed` or `multipart/related` | Downloadable files alongside the email |
| **Alternatives** | `multipart/alternative`                  | One of several body formats            |

## Usage

Add an `alternatives` array to your message object. Each alternative needs a content source (`content`, `path`, `href`, or `raw`). Setting an explicit `contentType` is strongly recommended — if omitted, Nodemailer detects it from the filename or path, falling back to `text/plain`:

```javascript
const message = {
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Hello",
  html: "<b>Hello world!</b>",
  alternatives: [
    {
      contentType: "text/x-web-markdown",
      content: "**Hello world!**",
    },
  ],
};
```

In this example, the email includes both an HTML body and a Markdown alternative. Email clients that support Markdown can choose to render it instead of the HTML.

### Ordering matters

You can include as many alternatives as you need. According to the MIME standard (RFC 2046), email clients read alternatives from top to bottom and typically display the last format they can understand.

Nodemailer emits the body parts in a fixed order: `text`, `watchHtml`, `amp`, `html`, `icalEvent`, then everything in the `alternatives` array (in array order). This means custom alternatives always come after the HTML body — an alternative placed after HTML is preferred by clients that support it, while clients that do not understand it fall back to the HTML part.
