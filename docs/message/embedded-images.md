---
title: Embedded images
sidebar\_position: 15
---

You can embed images directly inside the HTML body by attaching them and referring to them with the `cid:` URL scheme.

1. Add the image to **attachments**.
2. Set a **cid** (Content‑ID) that is unique within the message.
3. Reference the image in your HTML (or CSS) with `cid:<cid>`.

:::info Why use `cid:`?
Using a Content‑ID lets the email client display the image even when it blocks external images, because the file travels inside the message itself.
:::

:::note Unique `cid`
The **cid** must be **globally unique** within the message. A good pattern is to append a domain you control, e.g. `logo.12345@example.com`.
:::

#### Basic example

```javascript
const message = {
  from: "Alice <alice@example.com>",
  to: "Bob <bob@example.com>",
  subject: "Inline image test",
  html: 'Embedded image: <img src="cid:logo@example.com" alt="logo"/>',
  attachments: [
    {
      filename: "logo.png",
      path: "/path/to/logo.png",
      cid: "logo@example.com", // same cid value as in the html img src
    },
  ],
};
```

#### Using a Buffer instead of a file

```javascript
const fs = require("fs");

const message = {
  // ...
  html: '<img src="cid:screenshot@example.com"/>',
  attachments: [
    {
      filename: "screenshot.png",
      content: fs.readFileSync("/tmp/screenshot.png"),
      cid: "screenshot@example.com",
    },
  ],
};
```

#### Embedding multiple images

```javascript
html: `
  <h1>Monthly report</h1>
  <img src="cid:chart@example.com" alt="Chart"/>
  <img src="cid:badge@example.com" alt="Badge"/>
`,
attachments: [
  { filename: 'chart.png', path: './chart.png', cid: 'chart@example.com' },
  { filename: 'badge.png', path: './badge.png', cid: 'badge@example.com' }
]
```
