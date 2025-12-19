---
title: Calendar events
sidebar_position: 14
---

Nodemailer can embed an iCalendar (`.ics`) file directly in an email. When recipients open the message in calendar-aware email clients such as Gmail, Outlook, or Apple Mail, they will see interactive controls like **Add to calendar** or **Accept / Decline** buttons.

:::info
Nodemailer handles attaching the calendar file to your email, but it does **not** generate the iCalendar content itself. You need to create valid `.ics` data using a library like **[ical-generator](https://www.npmjs.com/package/ical-generator)** or **[ics](https://www.npmjs.com/package/ics)**, then pass that output to Nodemailer.
:::

## `icalEvent` message option

To attach a calendar event, add an `icalEvent` object to your message when calling `transporter.sendMail()`:

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
| `method`   | `string`                     | `'PUBLISH'`    | The iCalendar [**METHOD**](https://www.rfc-editor.org/rfc/rfc5546#section-1.4) property. This is case-insensitive. Common values are `'REQUEST'` (for meeting invitations), `'REPLY'` (for responses), and `'CANCEL'` (for cancellations). |
| `filename` | `string`                     | `'invite.ics'` | The filename displayed in the email client for the attached calendar file.                                                                                 |
| `content`  | `string \| Buffer \| Stream` | -              | The raw iCalendar data as a string, Buffer, or readable Stream.                                                                                            |
| `path`     | `string`                     | -              | An absolute or relative file path to a local `.ics` file on disk.                                                                                          |
| `href`     | `string`                     | -              | A URL (HTTP or HTTPS) from which Nodemailer will fetch the calendar data.                                                                                  |
| `encoding` | `string`                     | -              | The encoding of the `content` string, if applicable (for example, `'base64'` or `'hex'`).                                                                  |

You must provide **exactly one** of `content`, `path`, or `href` to specify the calendar data source.

:::note Best practice
Calendar invitations can be sensitive to email structure. Adding extra file [attachments](./attachments) or complex alternative message bodies often causes email clients to display the calendar incorrectly or not at all. For the best compatibility across different email clients, keep your message simple: include only **text**, **html**, and a single **icalEvent**. Avoid adding other attachments to calendar invitation emails.
:::

## Examples

### 1. Send a meeting invitation (REQUEST) from a string

Use `method: 'REQUEST'` when you want recipients to accept or decline an invitation:

```javascript
const appointment = `BEGIN:VCALENDAR\r
PRODID:-//ACME/DesktopCalendar//EN\r
VERSION:2.0\r
METHOD:REQUEST\r
BEGIN:VEVENT\r
DTSTART:20240115T100000Z\r
DTEND:20240115T110000Z\r
SUMMARY:Team Meeting\r
UID:unique-event-id@example.com\r
END:VEVENT\r
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

### 2. Send a calendar event (PUBLISH) from a file

Use `method: 'PUBLISH'` when you want to share an event without requiring a response:

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

### 3. Send a cancellation (CANCEL) from a URL

Use `method: 'CANCEL'` to notify recipients that a previously scheduled event has been cancelled:

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

For a complete working example, combine the `message` object above with [`nodemailer.createTransport()`](../usage/index.md#quick-example) and call `transporter.sendMail()`.
