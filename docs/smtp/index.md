---
title: SMTP transport
sidebar_position: 4
---

# SMTP transport

SMTP is the main transport in Nodemailer for delivering messages. SMTP is also the protocol used between different email hosts, so it's truly universal. Almost every email delivery provider supports SMTP-based sending, even when they advertise API‑based sending as the primary option. APIs can offer more features, but they also introduce vendor lock‑in. With SMTP you can usually swap providers by changing only the configuration object or connection URL.

## Creating a transport

```javascript
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport(options[, defaults]);
```

- **`options`** – object that defines the connection (detailed below).
- **`defaults`** – object merged into every message object (for example, you can set a common **from** address).

You can also pass a connection URL instead of an options object. Use the **smtp:** or **smtps:** protocol in the URL.

```javascript
const poolConfig = "smtps://username:password@smtp.example.com/?pool=true";
const transporter = nodemailer.createTransport(poolConfig);
```

### General options

| Name         | Type      | Default                         | Description                                                                    |
| ------------ | --------- | ------------------------------- | ------------------------------------------------------------------------------ |
| `host`       | `string`  | `"localhost"`                   | Hostname or IP address of the SMTP server.                                     |
| `port`       | `number`  | `587` (`465` if `secure: true`) | Port to connect to.                                                            |
| `secure`     | `boolean` | `false`                         | If `true`, the connection will use TLS immediately (recommended for port 465). |
| `auth`       | `object`  | –                               | Authentication data (see [Authentication](#authentication)).                   |
| `authMethod` | `string`  | `"PLAIN"`                       | Preferred authentication method.                                               |

:::info
Nodemailer resolves the `host` value with `dns.resolve()`. If you point `host` to an IP address that is _not_ resolvable (for example, it is defined in **/etc/hosts**), also set `tls.servername` to the real hostname. TLS validation continues to work even though a DNS lookup is skipped.
:::

### TLS options

| Name             | Type      | Default | Description                                                                                                                    |
| ---------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `secure`         | `boolean` | `false` | See **General options**.                                                                                                       |
| `tls`            | `object`  | –       | [Node.js `TLSSocket`](https://nodejs.org/api/tls.html#class-tlstlssocket) options, for example `{ rejectUnauthorized: true }`. |
| `tls.servername` | `string`  | –       | Optional hostname for TLS validation when `host` is an IP.                                                                     |
| `ignoreTLS`      | `boolean` | `false` | Disable STARTTLS even if the server supports it.                                                                               |
| `requireTLS`     | `boolean` | `false` | Force STARTTLS. If the server does not support it the message is **not** sent.                                                 |

:::info
Setting **`secure: false`** does **not** necessarily mean you are sending in plaintext—most servers automatically upgrade to TLS via the [STARTTLS](https://datatracker.ietf.org/doc/html/rfc3207) command. Nodemailer follows the server’s lead unless `ignoreTLS` is set.
:::

### Connection options

| Name                | Default        | Description                                      |
| ------------------- | -------------- | ------------------------------------------------ |
| `name`              | local hostname | Hostname to use in the `HELO`/`EHLO` greeting.   |
| `localAddress`      | –              | Local interface to bind for network connections. |
| `connectionTimeout` | 120 000 ms     | How long to wait for the initial TCP connect.    |
| `greetingTimeout`   | 30 000 ms      | How long to wait for the server greeting.        |
| `socketTimeout`     | 600 000 ms     | Idle timeout after the greeting.                 |
| `dnsTimeout`        | 30 000 ms      | Maximum time allowed for DNS lookups.            |

### Debug options

| Name     | Type                 | Description                                                                                                                       |
| -------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `logger` | `object` / `boolean` | A [Bunyan](https://github.com/trentm/node-bunyan) logger instance, `true` for console logging, or `false` / unset for no logging. |
| `debug`  | `boolean`            | Log SMTP traffic when `true`, otherwise only transaction events.                                                                  |

### Security options

| Name                | Type      | Description                                   |
| ------------------- | --------- | --------------------------------------------- |
| `disableFileAccess` | `boolean` | Disallow reading content from the filesystem. |
| `disableUrlAccess`  | `boolean` | Disallow fetching content from remote URLs.   |

### Pooling options

See [Pooled SMTP](/smtp/pooled/) for the complete list. The most important flag is:

| Name   | Type      | Description                |
| ------ | --------- | -------------------------- |
| `pool` | `boolean` | Enable connection pooling. |

### Proxy options

All SMTP transports support proxies. Read more in [Using proxies](/smtp/proxies/).

## Examples {#examples}

### 1. Single connection

A new SMTP connection is created for every message:

```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  secure: false, // upgrade later with STARTTLS
  auth: {
    user: "username",
    pass: "password",
  },
});
```

### 2. Pooled connections

Keep a pool of connections open against an SMTP server on port 465:

```javascript
const transporter = nodemailer.createTransport({
  pool: true,
  host: "smtp.example.com",
  port: 465,
  secure: true, // use TLS
  auth: {
    user: "username",
    pass: "password",
  },
});
```

### 3. Allow self‑signed certificates

Connect to a TLS server that uses a self‑signed or otherwise invalid certificate:

```javascript
const transporter = nodemailer.createTransport({
  host: "my.smtp.host",
  port: 465,
  secure: true,
  auth: {
    user: "username",
    pass: "pass",
  },
  tls: {
    // do not fail on invalid certs
    rejectUnauthorized: false,
  },
});
```

## Authentication {#authentication}

If the **auth** object is omitted, Nodemailer treats the connection as already authenticated.

```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
});
```

### Login

```javascript
auth: {
  type: "login", // default
  user: "username",
  pass: "password",
}
```

### OAuth 2.0

```javascript
auth: {
  type: "oauth2",
  user: "user@example.com",
  accessToken: "generated_access_token",
  expires: 1484314697598,
}
```

See the dedicated [OAuth 2.0 guide](/smtp/oauth2/) for details, or implement a [custom authentication handler](/smtp/customauth/) if your protocol is not natively supported (see the [NTLM handler](https://github.com/nodemailer/nodemailer-ntlm-auth) for an example).

## Verifying the configuration

Use **`transporter.verify()`** to make sure the SMTP configuration works.

```javascript
// Promise style (Node.js 8+)
try {
  await transporter.verify();
  console.log("Server is ready to take our messages");
} catch (err) {
  console.error("Verification failed", err);
}

// Callback style
transporter.verify((error, success) => {
  if (error) {
    console.error(error);
  } else {
    console.log("Server is ready to take our messages");
  }
});
```

`verify()` checks DNS resolution, the TCP handshake, and authentication. It does **not** validate whether the service allows a specific envelope **From** address—that depends on the server configuration.
