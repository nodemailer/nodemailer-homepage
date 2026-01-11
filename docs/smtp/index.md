---
title: SMTP transport
sidebar_position: 4
description: Main transport in Nodemailer for delivering messages via the SMTP protocol.
---

SMTP is the main transport in Nodemailer for delivering messages. SMTP (Simple Mail Transfer Protocol) is also the standard protocol that email servers use to communicate with each other, making it truly universal. Almost every email delivery provider supports SMTP-based sending, even when they primarily advertise API-based sending. While APIs may offer additional features, they also create vendor lock-in. With SMTP, you can switch providers by simply changing your configuration object or connection URL.

## Creating a transport

To send emails via SMTP, create a transporter object by calling `nodemailer.createTransport()`:

```javascript
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport(options[, defaults]);
```

- **`options`** - an object that defines the SMTP connection settings (detailed in the sections below).
- **`defaults`** - an optional object whose properties are merged into every [message](/message/) you send. This is useful for setting a common **from** address or other repeated values.

Instead of an options object, you can also pass a connection URL. Use the **smtp:** protocol for standard connections or **smtps:** for connections that use TLS from the start (typically port 465).

```javascript
const poolConfig = "smtps://username:password@smtp.example.com/?pool=true";
const transporter = nodemailer.createTransport(poolConfig);
```

### General options

| Name         | Type      | Default                         | Description                                                                                                                                                                         |
| ------------ | --------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `host`       | `string`  | `"localhost"`                   | The hostname or IP address of the SMTP server to connect to.                                                                                                                        |
| `port`       | `number`  | `587` (`465` if `secure: true`) | The port number to connect to.                                                                                                                                                      |
| `secure`     | `boolean` | `false`                         | If `true`, the connection uses TLS immediately upon connecting. Set this to `true` when connecting to port 465. For port 587 or 25, leave this as `false` and let STARTTLS upgrade the connection. |
| `service`    | `string`  | --                              | A shortcut to configure well-known email services like `"gmail"` or `"outlook"`. When set, this overrides `host`, `port`, and `secure` with predefined values. See the [well-known services list](/smtp/well-known-services). |
| `auth`       | `object`  | --                              | Authentication credentials (see [Authentication](#authentication) below).                                                                                                           |
| `authMethod` | `string`  | `"PLAIN"`                       | The preferred SASL authentication method. Common values include `"PLAIN"`, `"LOGIN"`, and `"CRAM-MD5"`.                                                                             |

:::info
When you specify a hostname, Nodemailer resolves it using DNS before connecting. If you use an IP address directly (or a hostname that only exists in **/etc/hosts** and not in DNS), you should also set `tls.servername` to the actual hostname. This ensures TLS certificate validation works correctly even when DNS lookup is skipped.
:::

### TLS options

| Name             | Type      | Default | Description                                                                                                                    |
| ---------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `secure`         | `boolean` | `false` | See **General options** above.                                                                                                 |
| `tls`            | `object`  | --      | Additional options passed directly to [Node.js `TLSSocket`](https://nodejs.org/api/tls.html#class-tlstlssocket). For example, `{ rejectUnauthorized: false }` to accept self-signed certificates. |
| `tls.servername` | `string`  | --      | The hostname to use for TLS certificate validation. Required when `host` is set to an IP address. Can also be set as a top-level `servername` option outside the `tls` object. |
| `ignoreTLS`      | `boolean` | `false` | If `true`, Nodemailer will not use STARTTLS even if the server advertises support for it. The connection remains unencrypted.  |
| `requireTLS`     | `boolean` | `false` | If `true`, Nodemailer requires a STARTTLS upgrade. If the server does not support STARTTLS, sending fails with an error.       |

:::info
Setting **`secure: false`** does **not** mean your emails are sent unencrypted. Most modern SMTP servers support [STARTTLS](https://datatracker.ietf.org/doc/html/rfc3207), which upgrades an unencrypted connection to an encrypted one after connecting. Nodemailer automatically uses STARTTLS when available, unless you explicitly disable it with `ignoreTLS: true`.
:::

### Connection options

| Name                | Default        | Description                                                                                                                                    |
| ------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`              | local hostname | The hostname sent in the `EHLO` (or `HELO`) greeting. The server uses this to identify your client. Defaults to your machine's hostname.      |
| `localAddress`      | --             | The local network interface to bind when making the connection. Useful when your machine has multiple network interfaces.                      |
| `connectionTimeout` | 120000 ms      | How long to wait (in milliseconds) for the TCP connection to be established before giving up.                                                  |
| `greetingTimeout`   | 30000 ms       | How long to wait (in milliseconds) for the server to send its initial greeting after the connection is established.                            |
| `socketTimeout`     | 600000 ms      | How long a connection can remain idle (in milliseconds) before Nodemailer closes it. The default is 10 minutes.                                |
| `dnsTimeout`        | 30000 ms       | Maximum time (in milliseconds) to wait for DNS lookups to complete.                                                                            |
| `lmtp`              | `false`        | If `true`, use the LMTP (Local Mail Transfer Protocol) instead of SMTP. LMTP is typically used for local mail delivery.                        |
| `opportunisticTLS`               | `false`        | If `true`, Nodemailer continues with an unencrypted connection when STARTTLS upgrade fails, instead of aborting.                               |
| `forceAuth`                      | `false`        | If `true`, attempt authentication even when the server does not advertise AUTH capability. Some misconfigured servers require this.            |
| `allowInternalNetworkInterfaces` | `false`        | If `true`, allows connections to internal/private network interfaces during DNS resolution. By default, Nodemailer skips private IP addresses when resolving hostnames. |

### Debug options

| Name             | Type                 | Description                                                                                                                                  |
| ---------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `logger`         | `object` / `boolean` | Set to `true` to enable console logging, or pass a [Bunyan](https://github.com/trentm/node-bunyan)-compatible logger instance for custom logging. Set to `false` or leave unset to disable logging. |
| `debug`          | `boolean`            | If `true`, logs the raw SMTP protocol traffic (commands and responses). When `false`, only high-level transaction events are logged.         |
| `transactionLog` | `boolean`            | If `true`, logs SMTP commands and responses at the transaction level. Similar to `debug` but can be used independently for lighter logging without full protocol traces. |
| `component`      | `string`             | The component name used in log output (e.g., `'smtp-transport'`, `'smtp-pool'`). Useful when running multiple transporters to identify which one generated a log entry. |

**Custom logger**

If you want to use a logging library like [Pino](https://github.com/pinojs/pino) or another custom logger, you can wrap it in a Nodemailer-compatible logger object. The logger must implement methods for each log level: `trace`, `debug`, `info`, `warn`, `error`, and `fatal`.

```js
const smtpLogger = {};

// Set up logger wrapper for each log level
for (let level of ['trace', 'debug', 'info', 'warn', 'error', 'fatal']) {
    smtpLogger[level] = (data, message, ...args) => {
        if (args && args.length) {
            message = util.format(message, ...args);
        }
        data.msg = message;
        data.src = 'nodemailer';
        if (typeof pinoLogger[level] === 'function') {
            pinoLogger[level](data);
        } else {
            pinoLogger.debug(data);
        }
    };
}

nodemailer.createTransport({
    // ... other options
    logger: smtpLogger
})
```

### Security options

These options restrict how Nodemailer handles attachments and content sources:

| Name                | Type      | Description                                                                                                   |
| ------------------- | --------- | ------------------------------------------------------------------------------------------------------------- |
| `disableFileAccess` | `boolean` | If `true`, prevents Nodemailer from reading attachment content from the filesystem (paths like `/path/to/file.pdf`). |
| `disableUrlAccess`  | `boolean` | If `true`, prevents Nodemailer from fetching attachment content from URLs (like `https://example.com/file.pdf`).  |

### Pooling options

Connection pooling keeps multiple SMTP connections open to send messages faster. See [Pooled SMTP](/smtp/pooled) for the complete list of pooling options. The most important option is:

| Name   | Type      | Description                                                                                      |
| ------ | --------- | ------------------------------------------------------------------------------------------------ |
| `pool` | `boolean` | If `true`, enables connection pooling. Pooled connections are reused for multiple messages.      |

### Proxy options

You can route SMTP connections through HTTP or SOCKS proxies. Read more in [Using proxies](/smtp/proxies).

## Examples {#examples}

### 1. Single connection

This is the simplest configuration. A new SMTP connection is created for each message you send. The connection starts unencrypted but is automatically upgraded via STARTTLS if the server supports it.

```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  secure: false, // Start unencrypted, upgrade via STARTTLS
  auth: {
    user: "username",
    pass: "password",
  },
});
```

### 2. Pooled connections

For better performance when sending multiple messages, use connection pooling. This keeps connections open and reuses them, avoiding the overhead of establishing a new connection for each message.

```javascript
const transporter = nodemailer.createTransport({
  pool: true,
  host: "smtp.example.com",
  port: 465,
  secure: true, // Use TLS from the start (required for port 465)
  auth: {
    user: "username",
    pass: "password",
  },
});
```

### 3. Allow self-signed certificates

In development environments or internal networks, you may need to connect to servers using self-signed certificates. Disable certificate validation with `rejectUnauthorized: false`. Note that this reduces security and should not be used in production.

```javascript
const transporter = nodemailer.createTransport({
  host: "my.smtp.host",
  port: 465,
  secure: true,
  auth: {
    user: "username",
    pass: "password",
  },
  tls: {
    // Accept self-signed or invalid certificates
    rejectUnauthorized: false,
  },
});
```

## Authentication {#authentication}

Most SMTP servers require authentication before accepting messages. Nodemailer supports several authentication methods.

If you omit the **auth** object entirely, Nodemailer attempts to send without authentication. This works only with servers that allow unauthenticated sending (typically internal relay servers).

```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
});
```

### Login

The most common authentication method uses a username and password. Nodemailer automatically selects the best available mechanism (PLAIN, LOGIN, or CRAM-MD5) based on what the server supports.

```javascript
auth: {
  type: "login", // Optional, this is the default
  user: "username",
  pass: "password",
}
```

### OAuth 2.0

For services like Gmail or Outlook that support OAuth 2.0, you can authenticate using an access token instead of a password. This is more secure because you do not need to store your password.

```javascript
auth: {
  type: "oauth2",
  user: "user@example.com",
  accessToken: "generated_access_token",
  expires: 1484314697598, // Token expiration timestamp in milliseconds
}
```

See the dedicated [OAuth 2.0 guide](/smtp/oauth2) for complete setup instructions, including how to automatically refresh tokens. If you need to use an authentication protocol that Nodemailer does not support natively, you can implement a [custom authentication handler](/smtp/customauth) (see the [NTLM handler](https://github.com/nodemailer/nodemailer-ntlm-auth) for an example).

## Verifying the configuration

Before sending your first email, you can test whether your SMTP configuration is correct using **`transporter.verify()`**. This method attempts to connect to the server and authenticate without sending any message.

```javascript
// Using async/await
try {
  await transporter.verify();
  console.log("Server is ready to take our messages");
} catch (err) {
  console.error("Verification failed", err);
}

// Using callbacks
transporter.verify((error, success) => {
  if (error) {
    console.error(error);
  } else {
    console.log("Server is ready to take our messages");
  }
});
```

The `verify()` method tests DNS resolution, the TCP connection, TLS upgrade (if applicable), and authentication. However, it does **not** verify whether the server will accept messages from a specific sender address - that can only be determined when you actually send a message, and depends on the server's policies.
