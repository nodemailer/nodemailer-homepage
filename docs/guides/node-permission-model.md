---
title: Node.js permission model
sidebar_position: 5
description: Run Nodemailer under the Node.js permission model, and grant only the access each feature needs.
---

# Node.js permission model

Node.js can restrict what a process may do with its [permission model](https://nodejs.org/api/permissions.html). When you start Node.js with `--permission`, file system access, network access, and spawning child processes are denied unless you grant them with `--allow-*` flags.

Nodemailer runs under the permission model without any changes. It has no dependencies and no native addons, and it only uses what the features you configure require.

A typical application that sends email over SMTP needs read access to its dependencies and network access:

```bash
node --permission --allow-fs-read=./node_modules --allow-net app.js
```

## Permissions

The entry script of your application is readable automatically, but the packages it loads are not, so grant read access to `node_modules` (or only to `node_modules/nodemailer` and the other packages you use). Beyond that:

| Feature                                                                               | Permission                                                                      |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [Stream and JSON transports](/transports/stream/)                                     | nothing                                                                         |
| [SMTP](/smtp/), [OAuth2](/smtp/oauth2/) token requests, attachments loaded from a URL | `--allow-net`                                                                   |
| [`createTestAccount()`](/guides/testing-with-ethereal)                                | `--allow-net`                                                                   |
| Attachments, DKIM keys, or other content loaded with `path` from a local file         | `--allow-fs-read=<file or directory>`                                           |
| [DKIM signing](/dkim/) with `cacheDir` set for large messages                         | `--allow-fs-read` and `--allow-fs-write` on the cache directory                 |
| [Sendmail transport](/transports/sendmail/)                                           | `--allow-child-process`                                                         |
| [SES transport](/transports/ses/)                                                     | `--allow-net`, plus any file access the AWS SDK needs for its own configuration |

Environment variables and the `os` module are not restricted by the permission model, so Nodemailer reads the machine hostname for the SMTP greeting and the `ETHEREAL_*` variables as usual.

`--allow-net` is all or nothing. Node.js accepts a value such as `--allow-net=smtp.example.com`, but ignores it and allows every connection.

## Node.js versions

The permission model changed between Node.js releases:

| Node.js      | Flag                        | Network access                                                           |
| ------------ | --------------------------- | ------------------------------------------------------------------------ |
| 25 and later | `--permission`              | denied unless `--allow-net` is given                                     |
| 22.13 to 24  | `--permission`              | not restricted, and `--allow-net` is rejected as an unknown option       |
| 20           | `--experimental-permission` | not restricted, and the entry script itself also needs `--allow-fs-read` |

A start command that includes `--allow-net` therefore fails on Node.js 24 and earlier, while Node.js 25 and later cannot send email without it. Node.js 26 also prints an `ExperimentalWarning` for `--allow-net`, as network permissions are still under active development.

## Recognizing a denied operation

When the permission model denies an operation, Nodemailer reports the error with the code Node.js uses for it, `ERR_ACCESS_DENIED`, instead of the code of the step that failed. The message names the flag that is missing:

```javascript
try {
  await transporter.sendMail(message);
} catch (err) {
  if (err.code === "ERR_ACCESS_DENIED") {
    // for example "getaddrinfo ERR_ACCESS_DENIED smtp.example.com" when --allow-net is
    // missing, or "Access to this API has been restricted. Use --allow-fs-read to manage
    // permissions." for an attachment file that is not readable
    console.error("Blocked by the Node.js permission model:", err.message);
  }
}
```

For SMTP connections, `err.command` is `CONN` when the connection itself was denied. See [Error reference](/errors#err_access_denied) for the full list of error codes.

:::note
Nodemailer 10.0.16 and earlier report a denied network operation with the code of the step that failed, `EDNS` or `ESOCKET` for an SMTP connection and `EFETCH` for an HTTP request, and a denied attachment read during an SMTP send as `ESTREAM`. The message contains `ERR_ACCESS_DENIED` in all of these cases.
:::

## See also

- [Using Deno](/guides/using-deno) - Deno has a permission system of its own, with different flags.
- [Node.js permission model](https://nodejs.org/api/permissions.html) - the full reference for the flags above.
