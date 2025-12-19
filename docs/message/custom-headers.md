---
title: Custom headers
sidebar_position: 17
description: Add or override message headers at message level or for individual attachments.
---

Nodemailer automatically generates all required email headers, so you typically do not need to set them manually. However, when you need to add custom headers or override default values, you can use the **`headers`** property. This works both at the message level and for individual [attachments](./attachments) or alternatives.

- **`headers`** - an object where each key-value pair becomes an email header.

  - Keys are automatically converted to their standard capitalized form (for example, `x-my-key` becomes `X-My-Key`).
  - Values are automatically encoded for non-ASCII characters using MIME word encoding, and long lines are wrapped to comply with the 78-character line limit. You can disable this automatic processing by using the `prepared` option.

:::warning
Do **not** set protected headers such as `From`, `Sender`, `To`, `Cc`, `Bcc`, `Reply-To`, `In-Reply-To`, `References`, `Subject`, `Message-ID`, or `Date` using the `headers` property. Nodemailer manages these headers internally and will overwrite any values you set. Instead, use the dedicated [message properties](./) (for example, `from`, `to`, `subject`) to set these values.
:::

---

## Examples

### 1. Add simple custom headers

Pass an object with your custom header names as keys and their values as strings. Nodemailer will format the header names correctly and include them in the outgoing email.

```javascript
const message = {
  // other fields...
  headers: {
    "x-my-key": "header value",
    "x-another-key": "another value",
  },
};

/*
Results in these headers being added to the email:
X-My-Key: header value
X-Another-Key: another value
*/
```

### 2. Repeat the same header key

Some headers can appear multiple times in an email (such as `Received` or custom tracking headers). To add multiple headers with the same name, provide an array of values instead of a single string.

```javascript
const message = {
  // other fields...
  headers: {
    "x-my-key": ["value for row 1", "value for row 2", "value for row 3"],
  },
};

/*
Results in three separate headers with the same name:
X-My-Key: value for row 1
X-My-Key: value for row 2
X-My-Key: value for row 3
*/
```

### 3. Bypass Nodemailer's encoding and folding

By default, Nodemailer encodes non-ASCII characters and wraps long lines to comply with email standards. If you have already encoded the header value yourself or need to include the raw value exactly as-is, set `prepared: true` to prevent any processing.

```javascript
const message = {
  // other fields...
  headers: {
    "x-processed": "a really long header or value with non-ascii characters",
    "x-unprocessed": {
      prepared: true,
      value: "a really long header or value with non-ascii characters",
    },
  },
};

/*
X-Processed: Header value is automatically encoded and wrapped if needed
X-Unprocessed: Header value is used exactly as provided, with no modifications
*/
```

### 4. Headers on an attachment

You can also add custom headers to individual [attachments](./attachments). This is useful for adding metadata or tracking information to specific files within an email. Simply include a `headers` object inside the attachment definition.

```javascript
const message = {
  // other fields...
  attachments: [
    {
      filename: "report.csv",
      content: csvBuffer,
      headers: {
        "x-report-id": "2025-Q1",
      },
    },
  ],
};
```
