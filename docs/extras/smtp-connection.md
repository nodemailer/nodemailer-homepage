---
title: SMTP Connection
sidebar\_position: 2
---

**SMTPConnection** is Nodemailer's low‑level SMTP/LMTP client for establishing and managing SMTP sessions.
Use it when you need fine‑grained control over the SMTP conversation—for example, if you're building a custom transport, doing connection pooling, or testing SMTP servers.

:::Tip
If you just want to send email, use [`nodemailer.createTransport()`](/usage) instead. It's simpler and automatically handles connection management.
:::

## Prerequisites

- **Node.js ≥ 6.0.0** (all examples below use CommonJS and work all the way back to v6)
- Access to an SMTP (or LMTP) service.

## 1. Install

```bash title="Terminal"
npm install nodemailer --save
```

`smtp-connection` ships with Nodemailer, so you only need the one dependency.

## 2. Import

```javascript title="index.js"
const SMTPConnection = require("nodemailer/lib/smtp-connection");
```

## 3. Create a connection

```javascript title="index.js"
const connection = new SMTPConnection({
  host: "smtp.example.com",
  port: 587, // 465 for implicit TLS
  secure: false, // upgrade later with STARTTLS
  name: "my-app.local", // client hostname (EHLO)
});
```

### Connection options

| Option              | Type                | Default                            | Description                                                                                                                          |
| ------------------- | ------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `host`              | `string`            | `'localhost'`                      | Hostname or IP address of the SMTP/LMTP server.                                                                                      |
| `port`              | `number`            | `25` (`465` if `secure` is `true`) | Port to connect to. Modern submission ports are `587` (STARTTLS) or `465` (implicit TLS).                                            |
| `secure`            | `boolean`           | `false`                            | If `true`, use TLS from the start (port 465). If `false`, upgrade later with STARTTLS if the server supports it.                     |
| `name`              | `string`            | OS hostname                        | Hostname to announce to the server in the `EHLO`/`HELO` command.                                                                     |
| `ignoreTLS`         | `boolean`           | `false`                            | Skip STARTTLS even if the server supports it.                                                                                        |
| `requireTLS`        | `boolean`           | `false`                            | Fail the connection if STARTTLS is not offered or fails.                                                                             |
| `opportunisticTLS`  | `boolean`           | `false`                            | Try STARTTLS—continue in plaintext if it fails.                                                                                      |
| `localAddress`      | `string`            |                                    | Local interface to bind for the outbound connection.                                                                                 |
| `connectionTimeout` | `number`            |  `2 * 60 000` (2 min)              | How long to wait for the TCP connection to be established (ms).                                                                      |
| `greetingTimeout`   | `number`            |  `30 000`                          | How long to wait for the server greeting after connecting (ms).                                                                      |
| `socketTimeout`     | `number`            |  `10 * 60 000` (10 min)            | Idle timeout for an established socket (ms).                                                                                         |
| `dnsTimeout`        | `number`            |  `30 000`                          | Time to wait for DNS resolution (ms).                                                                                                |
| `authMethod`        | `string`            |                                    | Preferred auth mechanism (e.g. `'PLAIN'`).                                                                                           |
| `logger`            | `boolean \| object` |  `false`                           | If `true`, log to console. Pass a [Bunyan](https://github.com/trentm/node-bunyan)‑compatible logger to integrate with your own logs. |
| `transactionLog`    | `boolean`           |  `false`                           | Log SMTP commands and responses (masking message data).                                                                              |
| `debug`             | `boolean`           |  `false`                           | Log everything, including message content—**do not enable in production**.                                                           |
| `tls`               | `object`            |                                    | Extra options for `tls.connect()` (e.g. `rejectUnauthorized`).                                                                       |
| `socket`            | `net.Socket`        |                                    | Pre‑initialised socket (unconnected).                                                                                                |
| `connection`        | `net.Socket`        |                                    | Already‑connected socket (plaintext or TLS). When `secure: true`, the socket is automatically upgraded.                              |

## Events

SMTPConnection is an [`EventEmitter`](https://nodejs.org/api/events.html):

| Event     | Arguments   | When it fires                                                        |
| --------- | ----------- | -------------------------------------------------------------------- |
| `connect` | –           | After the SMTP greeting has been received.                           |
| `error`   | `Error err` | Any connection‑level error (the connection is closed automatically). |
| `end`     | –           | After the connection has been closed and the instance destroyed.     |

## API

### `connection.connect(callback)`

Open the network connection.

| Param      | Type       | Description                        |
| ---------- | ---------- | ---------------------------------- |
| `callback` | `function` | Invoked after the `connect` event. |

After `connect`, check `connection.secure` to see whether the socket is encrypted.

---

### `connection.login(auth, callback)`

Authenticate with the server.

```javascript
connection.login(
  {
    user: "alice",
    pass: "s3cret", // or
    // oauth2: { ... }
  },
  (err) => {
    if (err) {
      console.error("AUTH failed", err);
      return;
    }
    // ready to send
  }
);
```

`auth` supports either **credentials** (`user`, `pass`) _or_ **oauth2**:

| Field          | Required         | Description               |
| -------------- | ---------------- | ------------------------- |
| `user`         | ✔︎               | Username                  |
| `pass`         | ✔︎ (credentials) | Password                  |
| `clientId`     | ✔︎ (OAuth2)      | OAuth Client ID           |
| `clientSecret` | ✔︎ (OAuth2)      | OAuth Client Secret       |
| `refreshToken` | ✔︎ (OAuth2)      | OAuth refresh token       |
| `accessToken`  |                  | Pre‑obtained access token |

---

### `connection.send(envelope, message, callback)`

Send a message once authenticated (or immediately if the server is open‑relay—rare).

```javascript
const envelope = {
  from: "alice@example.com",
  to: ["bob@example.com"],
  size: Buffer.byteLength(message),
  dsn: {
    ret: "FULL",
    envid: "487188",
    notify: ["FAILURE", "DELAY"],
  },
};

connection.send(envelope, message, (err, info) => {
  if (err) {
    console.error("Envelope rejected", err);
    return;
  }
  console.log("Accepted recipients:", info.accepted);
  console.log("Rejected recipients:", info.rejected);
});
```

`message` can be a `String`, `Buffer`, or any `Stream`. Newlines are automatically normalized to `\r\n` and dots escaped as required by the SMTP protocol.

The callback receives:

| Param  | Type     | Description                                                                                 |
| ------ | -------- | ------------------------------------------------------------------------------------------- |
| `err`  | `Error`  | Populated if _any_ recipient was rejected (`err.code` is `'EAUTH'`, `'ECONNECTION'`, etc.). |
| `info` | `object` | Only if _all_ recipients were accepted.                                                     |

`info` fields:

- `accepted` — array of accepted addresses.
- `rejected` — array of rejected addresses (LMTP can return this **after** the message is streamed).
- `rejectedErrors` — one `Error` object per rejected address.
- `response` — last line of the server response.

---

### `connection.quit()`

Send `QUIT` and close the connection gracefully.

### `connection.close()`

Destroy the socket without waiting for `QUIT`.

### `connection.reset(callback)`

Issue `RSET` to reset the current SMTP session.

---

## License

[MIT](https://github.com/nodemailer/nodemailer/blob/master/LICENSE)
