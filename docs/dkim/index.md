---
title: DKIM
sidebar_position: 7
---

# DKIM Signing

DomainKeys Identified Mail (DKIM) adds a cryptographic signature to every
outgoing message. This signature allows receiving mail servers to verify that
the message genuinely originates from **your** domain and has not been tampered
with during transit.

Nodemailer can sign messages with one or more DKIM keys **without** requiring
any additional dependencies. In most cases, signing is fast and handled entirely
in memory. For very large messages, you can optionally enable disk caching so
that only the first _cacheTreshold_ bytes are stored in RAM.

---

## Configuration

You can configure DKIM signing in two ways:

- **Transport-wide** - Every message sent through the transporter is
  automatically signed with the same key(s), **or**
- **Per-message** - Pass a `dkim` object in the [message configuration](../message/) to override or
  replace the transport-level settings.

If you specify DKIM settings at both levels, the **message-level settings take
precedence**.

### DKIM options

| Option             | Type                                             | Default            | Description                                                                                                                                                   |
| ------------------ | ------------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domainName`       | `string` (required)                              | -                  | The domain name to sign for. This appears in the `d=` tag of the DKIM signature header.                                                                       |
| `keySelector`      | `string` (required)                              | -                  | The DNS selector for your DKIM key. This forms part of the DNS TXT record lookup path: `<selector>._domainkey.<domain>`.                                      |
| `privateKey`       | `string \| Buffer` (required)                    | -                  | Your PEM-formatted private key. This must correspond to the public key published in your DNS TXT record.                                                      |
| `keys`             | `Array< {domainName, keySelector, privateKey} >` | -                  | An array of key objects for signing with multiple keys (useful for key rotation or signing for multiple subdomains). When set, the single-key fields above are ignored. |
| `hashAlgo`         | `'sha256' \| 'sha1'`                             | `'sha256'`         | The hash algorithm used for the body hash. Use `sha256` unless you have a specific reason to use `sha1`.                                                      |
| `headerFieldNames` | `string`                                         | RFC 4871 defaults  | A colon-separated list of header field names to include in the signature (for example, `from:to:subject`). By default, Nodemailer signs the standard headers recommended by RFC 4871. |
| `skipFields`       | `string`                                         | -                  | A colon-separated list of header field names to **exclude** from signing. Use this when your email service provider modifies certain headers after signing (for example, `message-id:date`). |
| `cacheDir`         | `string \| false`                                | `false`            | A directory path for temporary files when processing large messages. Set to `false` to disable disk caching entirely.                                         |
| `cacheTreshold`    | `number`                                         | `2097152` (2 MB)   | The number of bytes to keep in memory before switching to disk caching. Only applies when `cacheDir` is set to a valid path.                                  |

:::warning
The option `cacheTreshold` is intentionally misspelled (with an "o" instead of "e") to maintain backwards compatibility with older Nodemailer versions.
:::

---

## Usage examples

The following examples use CommonJS syntax and require **Node.js v6** or later:

```javascript
const nodemailer = require("nodemailer");
const fs = require("fs");
```

### 1 - Sign every message

This example configures DKIM signing at the transport level, so all messages
sent through this transporter are automatically signed:

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

To verify that your DNS record is correctly configured, run:

```bash
dig TXT 2017._domainkey.example.com
```

### 2 - Sign with multiple keys

Use multiple keys when rotating DKIM keys or when sending mail on behalf of
different subdomains:

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

### 3 - Sign a specific message only

If you do not want to sign all messages, you can configure DKIM on individual
messages instead:

```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 465,
  secure: true,
  // No DKIM configuration here
});

const info = await transporter.sendMail({
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Hello with DKIM",
  text: "I hope this message gets read!",
  dkim: {
    domainName: "example.com",
    keySelector: "2017",
    privateKey: fs.readFileSync("./dkim-private.pem", "utf8"),
  },
});
```

### 4 - Cache large messages on disk

When sending messages with large attachments, you can reduce memory usage by
enabling disk caching. Nodemailer will store message content exceeding the
threshold in a temporary file:

```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 465,
  secure: true,
  dkim: {
    domainName: "example.com",
    keySelector: "2017",
    privateKey: fs.readFileSync("./dkim.pem", "utf8"),
    cacheDir: "/tmp",
    cacheTreshold: 100 * 1024, // 100 KB
  },
});
```

### 5 - Skip mutable headers

Some email service providers, such as **[Amazon SES](../transports/ses)**, replace headers like
`Message-ID` and `Date` after you submit the message. If these headers are
included in the DKIM signature, the signature will fail verification. Use
`skipFields` to exclude them.

:::tip
When using the [SES transport](../transports/ses), Nodemailer automatically adds `date:message-id` to `skipFields` for you.
:::

```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 465,
  secure: true,
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

- **Signature verification fails** - Confirm that your public key is published
  at `<keySelector>._domainkey.<domainName>` in DNS. Also check that the TXT
  record is **under 255 characters per string** (some DNS providers split or
  truncate long records incorrectly).
- **Header mismatch errors** - If a receiving server reports that signed headers
  do not match, add the problematic headers to `skipFields` or ensure your
  sending infrastructure does not modify headers after signing.
- **Need more help?** Test your DKIM configuration with online tools such as
  [dkimvalidator.com](https://dkimvalidator.com) or
  [mail-tester.com](https://www.mail-tester.com). These services send a test
  email and provide detailed feedback about your DKIM setup.
