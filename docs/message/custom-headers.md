---
title: Custom headers
sidebar_position: 17
---

Nodemailer generates all mandatory headers for you, so in day‑to‑day usage you rarely need to touch them.
When you _do_ have to add or override headers—either at the **message level** or for a single **attachment / alternative**—use the **`headers`** property.

- **`headers`** — an object whose key–value pairs become raw message headers.

  - Keys are converted to their canonical header name (`x-my-key` ➜ `X-My-Key`).
  - Values are encoded (non‑ASCII → _mime‑word_) and long lines are wrapped to max‑78 bytes unless you opt out with `prepared`.

:::warning
Do **not** set [**protected headers**](https://nodemailer.com/message/headers#protected) such as `From`, `To`, `Subject`, `Date`, `Message-ID`, or MIME boundary headers—Nodemailer will ignore or overwrite them.
:::

---

## Examples

### 1. Add simple custom headers

```javascript
const message = {
  // other fields …
  headers: {
    "x-my-key": "header value",
    "x-another-key": "another value",
  },
};

/*
Results in:
X-My-Key: header value
X-Another-Key: another value
*/
```

### 2. Repeat the same header key

Provide an `Array` to create multiple header lines with the **same key**:

```javascript
const message = {
  // …
  headers: {
    "x-my-key": ["value for row 1", "value for row 2", "value for row 3"],
  },
};

/*
X-My-Key: value for row 1
X-My-Key: value for row 2
X-My-Key: value for row 3
*/
```

### 3. Bypass Nodemailer’s encoding & folding

Set `prepared: true` if you already took care of encoding / line‑wrapping yourself and want Nodemailer to pass the value through _verbatim_.

```javascript
const message = {
  // …
  headers: {
    "x-processed": "a really long header or value with non‑ascii 🚀",
    "x-unprocessed": {
      prepared: true,
      value: "a really long header or value with non‑ascii 🚀",
    },
  },
};

/*
X-Processed: a really long header or value with non‑ascii =?UTF-8?Q?=F0=9F=9A=80?=
X-Unprocessed: a really long header or value with non‑ascii 🚀
*/
```

### 4. Headers on an attachment

`headers` is available inside any attachment or alternative object:

```javascript
const message = {
  // …
  attachments: [
    {
      filename: "report.csv",
      content: csvBuffer,
      headers: {
        "x-report-id": "2025‑Q1",
      },
    },
  ],
};
```
