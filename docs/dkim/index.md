---
title: DKIM
sidebar\_position: 70
---

# DKIM Signing

DomainKeys Identified Mail (DKIM) adds a cryptographic signature to every
out‑going message, allowing receiving servers to verify that the message
really originates from **your** domain and has not been altered in transit.

Nodemailer can sign messages with one or more DKIM keys **without** any extra
dependencies. In most cases signing is fast and fully in‑memory. For very large
messages you can optionally enable on‑disk caching so that only the first
_cacheTreshold_ bytes are kept in RAM.

---

## Configuration

DKIM can be configured either

- **Transport‑wide** – every message sent through the transporter is signed
  with the same key(s), **or**
- **Per‑message** – pass a `dkim` object in the _MailOptions_ to override the
  transport settings.

If both are present the **message‑level settings win**.

### DKIM options

| Option             | Type                                             | Default            | Purpose                                                                                                            |
| ------------------ | ------------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `domainName`       | `string` (required)                              |  —                 | Primary domain used in the `d=` tag.                                                                               |
| `keySelector`      | `string` (required)                              |  —                 | DNS selector, forms the left‑hand side of the TXT record (`<selector>._domainkey.<domain>`).                       |
| `privateKey`       | `string \| Buffer` (required)                    |  —                 | PEM‑formatted private key that matches the public key published in DNS.                                            |
| `keys`             | `Array< {domainName, keySelector, privateKey} >` |  —                 | Sign with multiple keys (key rotation, sub‑domains, etc.). Setting this ignores the three single‑key fields above. |
| `hashAlgo`         | `'sha256' \| 'sha1'`                             | `'sha256'`         | Body‑hash algorithm.                                                                                               |
| `headerFieldNames` | `string`                                         | see spec           | Explicit colon‑separated list of header fields to sign.                                                            |
| `skipFields`       | `string`                                         | —                  | Colon‑separated list of header fields _not_ to sign (e.g. `message-id:date` when your ESP rewrites them).          |
| `cacheDir`         | `string \| false`                                | `false`            | Folder used for temporary files when streaming large messages.                                                     |
| `cacheTreshold`    | `number`                                         | `131 072` (128 kB) | Bytes kept in memory before switching to disk when `cacheDir` is enabled.                                          |

:::warning
The option `cacheTreshold` is intentionally miss‑spelled to preserve backwards‑compatibility with older Nodemailer versions.
:::

---

## Usage examples

All snippets assume at least **Node.js v6** and use CommonJS style:

```javascript
const nodemailer = require("nodemailer");
```

### 1 – Sign every message

```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 465,
  secure: true,
  dkim: {
    domainName: "example.com",
    keySelector: "2017",
    privateKey: fs.readFileSync("./dkim-private.pem", "utf8"),
  },
});
```

Check that the TXT record exists:

```bash
dig TXT 2017._domainkey.example.com
```

### 2 – Sign with **multiple** keys

```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 465,
  secure: true,
  dkim: {
    keys: [
      {
        domainName: "example.com",
        keySelector: "2017",
        privateKey: fs.readFileSync("./dkim-2017.pem", "utf8"),
      },
      {
        domainName: "example.com",
        keySelector: "2016",
        privateKey: fs.readFileSync("./dkim-2016.pem", "utf8"),
      },
    ],
    cacheDir: false, // disable disk caching
  },
});
```

### 3 – Sign **one** specific message

```javascript
const transporter = nodemailer.createTransport({
  /* no global DKIM */
});

const info = await transporter.sendMail({
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Hello w/ DKIM",
  text: "I hope this message gets read!",
  dkim: {
    domainName: "example.com",
    keySelector: "2017",
    privateKey: fs.readFileSync("./dkim-private.pem", "utf8"),
  },
});
```

### 4 – Cache large messages on disk

```javascript
const transporter = nodemailer.createTransport({
  /* …SMTP details… */
  dkim: {
    domainName: "example.com",
    keySelector: "2017",
    privateKey: fs.readFileSync("./dkim.pem", "utf8"),
    cacheDir: "/tmp",
    cacheTreshold: 100 * 1024, // 100 kB
  },
});
```

### 5 – Skip mutable headers

When sending through services such as **Amazon SES**, `Message‑ID`
and `Date` are often replaced. Exclude these fields so the signature
survives:

```javascript
const transporter = nodemailer.createTransport({
  /* …SMTP details… */
  dkim: {
    domainName: "example.com",
    keySelector: "2017",
    privateKey: fs.readFileSync("./dkim.pem", "utf8"),
    skipFields: "message-id:date",
  },
});
```

---

## Troubleshooting

- **Signature fails** – Ensure the public key is published at
  `<keySelector>._domainkey.<domainName>` and is **under 1024 chars**
  (some DNS providers truncate long TXT records).
- **Header fields mismatched** – Add them to `skipFields` or re‑order your
  headers to match exactly what is sent on the wire.
- **Still stuck?** Run a full test with tools such as
  [`dkimvalidator.com`](https://dkimvalidator.com) or
  [`mail-tester.com`](https://www.mail-tester.com).
