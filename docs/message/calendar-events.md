---
title: Calendar events
sidebar_position: 14
---

Nodemailer can embed an iCalendar (`.ics`) file in an email so that calendar‑aware clients — Gmail, Outlook, Apple Mail, and others — show **Add to calendar** or **Accept / Decline** controls directly inside the message.

:::info
Nodemailer only _attaches_ the calendar file. It does **not** build the iCalendar content for you. To generate valid `.ics` text, use a helper such as **[ical‑generator](https://www.npmjs.com/package/ical-generator)** or **[ics](https://www.npmjs.com/package/ics)** and pass its output to Nodemailer.
:::

## `icalEvent` message option

Attach the calendar file by adding an `icalEvent` object to the message you pass to `transporter.sendMail()`:

```javascript
let message = {
  /* ...from, to, subject, etc. */
  icalEvent: {
    /* options */
  },
};
```

| Property   | Type                         | Default        | Description                                                                                                                                                |
| ---------- | ---------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `method`   | `string`                     | `'PUBLISH'`    | Calendar [**METHOD**](https://www.rfc-editor.org/rfc/rfc5546#section-1.4). Case‑insensitive. Common values include `'REQUEST'`, `'REPLY'`, and `'CANCEL'`. |
| `filename` | `string`                     | `'invite.ics'` | Attachment file name shown in the email client.                                                                                                            |
| `content`  | `string \| Buffer \| Stream` | —              | Raw iCalendar data.                                                                                                                                        |
| `path`     | `string`                     | —              | Absolute or relative path to a local `.ics` file.                                                                                                          |
| `href`     | `string`                     | —              | HTTPS/HTTP URL that Nodemailer should fetch to obtain the calendar data.                                                                                   |
| `encoding` | `string`                     | —              | Encoding to apply when **content** is a string (e.g. `'base64'`, `'hex'`).                                                                                 |

_Provide **exactly one** of `content`, `path`, or `href`._

:::note Best practice
Calendar messages are fragile: mixing them with extra file attachments or complex alternative bodies often confuses email clients. For maximum compatibility keep the email to **text**, **html**, and a single **icalEvent** — nothing else.
:::

## Examples

### 1 · Send a **REQUEST** event from a string

```javascript
const appointment = `\
BEGIN:VCALENDAR\r\n\PRODID:-//ACME/DesktopCalendar//EN\r\n\METHOD:REQUEST\r\n\...
END:VCALENDAR`;

let message = {
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Appointment",
  text: "Please see the attached appointment",
  icalEvent: {
    filename: "invitation.ics",
    method: "REQUEST",
    content: appointment,
  },
};
```

### 2 · Send a **PUBLISH** event loaded from a file

```javascript
let message = {
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Appointment",
  text: "Please see the attached appointment",
  icalEvent: {
    method: "PUBLISH",
    path: "/absolute/path/to/invite.ics",
  },
};
```

### 3 · Send a **CANCEL** event fetched from a URL

```javascript
let message = {
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Appointment cancelled",
  text: "The appointment has been cancelled. See details in the attached calendar update.",
  icalEvent: {
    method: "CANCEL",
    href: "https://www.example.com/events/123/cancel.ics",
  },
};
```

---

For a complete runnable example, combine the `message` object above with [`nodemailer.createTransport()`](../usage/index.md#quick-example) and call `transporter.sendMail()`.
