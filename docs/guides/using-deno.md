---
title: Using Deno
sidebar_position: 4
description: Run Nodemailer in Deno through npm specifiers, and grant only the permissions it needs.
---

# Using Deno

Nodemailer runs in [Deno](https://deno.com) 2 without changes. Deno loads npm packages natively and implements the Node.js modules Nodemailer is built on (`node:net`, `node:tls`, `node:crypto`, `node:dns`, `node:child_process`), so every bundled transport works the same way it does in Node.js: SMTP with STARTTLS or implicit TLS, pooled SMTP, DKIM signing, OAuth2, Sendmail, SES, and the stream and JSON transports.

The TypeScript definitions bundled with the package are picked up automatically, so `deno check` type-checks your message objects and transport options.

## Importing Nodemailer

Import the package with an `npm:` specifier:

```typescript
import nodemailer from "npm:nodemailer";
```

Or add it to `deno.json` once and import it by its bare name everywhere else:

```bash
deno add npm:nodemailer
```

```typescript
import nodemailer from "nodemailer";
```

Deep imports such as `nodemailer/lib/mail-composer` work the same way. Deno projects use ES modules, so the examples on the rest of this site apply as shown in their **ESM** tab.

## Sending a message

```typescript
import nodemailer from "npm:nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  auth: {
    user: Deno.env.get("SMTP_USER"),
    pass: Deno.env.get("SMTP_PASS"),
  },
});

const info = await transporter.sendMail({
  from: '"Example App" <app@example.com>',
  to: "user@example.com",
  subject: "Hello from Deno",
  text: "This message was sent with Nodemailer running in Deno.",
});

console.log("Message sent:", info.messageId);
```

Run it with network access, plus access to the two environment variables the script reads:

```bash
deno run --allow-net --allow-env=SMTP_USER,SMTP_PASS send.ts
```

Grant `--allow-net` without a host list. Nodemailer resolves the SMTP hostname itself and connects to the resulting IP address, and Deno checks that IP address against the list, so `--allow-net=smtp.example.com` fails with a permission error. Listing the server's IP addresses next to its hostname works, but breaks as soon as the provider's DNS records change.

## Permissions

Deno denies access to the network, the file system, and the environment unless you grant it. Nodemailer only touches what the features you use require:

| Feature                                                                          | Permission                                                                                                                                    |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| SMTP, SES, and attachments loaded from a URL                                     | `--allow-net`                                                                                                                                 |
| Attachments, DKIM keys, or other content loaded with `path` from a local file    | `--allow-read`                                                                                                                                |
| [DKIM signing](/dkim/) with `cacheDir` set for large messages                    | `--allow-read` and `--allow-write`                                                                                                            |
| [Sendmail transport](/transports/sendmail/)                                      | `--allow-run` (for example `--allow-run=/usr/sbin/sendmail`) and `--allow-env`, because Deno passes the full environment to the child process |
| [`createTestAccount()`](/guides/testing-with-ethereal) and `getTestMessageUrl()` | `--allow-env` (reads the optional `ETHEREAL_*` variables)                                                                                     |
| Machine hostname for the SMTP greeting, network interface lookup                 | `--allow-sys` (optional, see below)                                                                                                           |

Without `--allow-sys`, Nodemailer cannot read the machine hostname and greets the SMTP server with `EHLO [127.0.0.1]`. Most servers accept that, but some spam filters score it, so either grant `--allow-sys=hostname,networkInterfaces` or set the [`name`](/smtp/#connection-options) option to your host's fully qualified domain name. Without access to the network interface list, Nodemailer cannot tell whether the machine has IPv6 connectivity and considers both IPv4 and IPv6 addresses of the SMTP server.

When you run a script from a terminal without the flags, Deno prompts for each permission as Nodemailer first needs it. Without a terminal, as in a service or a CI job, Deno does not prompt and the operation fails instead, so pass the flags explicitly there.

:::note
Nodemailer 10.0.16 and earlier read the `ETHEREAL_*` environment variables and the network interface list as soon as the module is imported, so those versions need `--allow-env` even when Ethereal is never used, and Deno asks for `--allow-sys` at import time. Later versions read both only when a feature needs them.
:::

## Differences from Node.js

Sending works identically, but a few error details come from Deno's own implementation of the Node.js modules and differ slightly:

- **System error codes** can differ. For example, binding to a `localAddress` that the machine does not have fails with `EINVAL` in Deno and `EADDRNOTAVAIL` in Node.js. The Nodemailer error code (`err.code`, such as `ESOCKET`) is the same in both, so check that rather than the system error in `err.message`.
- **Invalid URLs** rejected by Deno's `URL` parser throw a `TypeError` without the `ERR_INVALID_URL` code that Node.js sets.

## See also

- [Testing with Ethereal](/guides/testing-with-ethereal) - try the examples without sending real email.
- [SMTP transport](/smtp/) - every connection option.
- [Deno permissions](https://docs.deno.com/runtime/fundamentals/security/) - the full reference for the flags above.
