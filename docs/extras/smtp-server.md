---
title: SMTP Server
sidebar\_position: 1
---

Create SMTP and LMTP server instances on‑the‑fly. _smtp‑server_ is **not** a full‑blown server application like [Haraka](https://haraka.github.io/) but a convenient way to add custom SMTP or LMTP listeners to your app. It is the successor of the server part of the now‑deprecated [simplesmtp](https://www.npmjs.com/package/simplesmtp) module. For a matching SMTP client, see [smtp‑connection](/extras/smtp-connection/).

## Usage

### 1 — Install

```bash
npm install smtp-server --save
```

### 2 — Require in your script

```javascript
const { SMTPServer } = require("smtp-server");
```

### 3 — Create a server instance

```javascript
const server = new SMTPServer(options);
```

### 4 — Start listening

```javascript
server.listen(port[, host][, callback]);
```

### 5 — Shut down

```javascript
server.close(callback);
```

## Options reference

| Option                                                                       | Type                | Default              | Description                                                                                                                      |
| ---------------------------------------------------------------------------- | ------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **secure**                                                                   | `Boolean`           | `false`              | Start in TLS mode. Can still be upgraded with `STARTTLS` if you leave this `false`.                                              |
| **name**                                                                     | `String`            | `os.hostname()`      | Hostname announced in banner.                                                                                                    |
| **banner**                                                                   | `String`            |  –                   | Greeting appended to the standard ESMTP banner.                                                                                  |
| **size**                                                                     | `Number`            |  `0`                 | Maximum accepted message size in bytes. `0` means unlimited.                                                                     |
| **hideSize**                                                                 | `Boolean`           | `false`              | Hide the SIZE limit from clients but still track `stream.sizeExceeded`.                                                          |
| **authMethods**                                                              | `String[]`          | `['PLAIN', 'LOGIN']` | Allowed auth mechanisms. Add `'XOAUTH2'` and/or `'CRAM-MD5'` as needed.                                                          |
| **authOptional**                                                             | `Boolean`           | `false`              | Allow but do **not** require auth.                                                                                               |
| **disabledCommands**                                                         | `String[]`          |  –                   | Commands to disable, e.g. `['AUTH']`.                                                                                            |
| **hideSTARTTLS / hidePIPELINING / hide8BITMIME / hideSMTPUTF8**              | `Boolean`           | `false`              | Remove the respective feature from the EHLO response.                                                                            |
| **allowInsecureAuth**                                                        | `Boolean`           | `false`              | Allow authentication before TLS.                                                                                                 |
| **disableReverseLookup**                                                     | `Boolean`           | `false`              | Skip reverse DNS lookup of the client.                                                                                           |
| **sniOptions**                                                               | `Map \| Object`     |  –                   | TLS options per SNI hostname.                                                                                                    |
| **logger**                                                                   | `Boolean \| Object` | `false`              | `true` → log to `console`, or supply a Bunyan instance.                                                                          |
| **maxClients**                                                               | `Number`            | `Infinity`           | Max concurrent clients.                                                                                                          |
| **useProxy**                                                                 | `Boolean`           | `false`              | Expect an HAProxy [PROXY header](http://www.haproxy.org/download/1.5/doc/proxy-protocol.txt).                                    |
| **useXClient / useXForward**                                                 | `Boolean`           | `false`              | Enable Postfix [XCLIENT](http://www.postfix.org/XCLIENT_README.html) or [XFORWARD](http://www.postfix.org/XFORWARD_README.html). |
| **lmtp**                                                                     | `Boolean`           | `false`              | Speak LMTP instead of SMTP.                                                                                                      |
| **socketTimeout**                                                            | `Number`            | `60_000`             | Idle timeout (ms) before disconnect.                                                                                             |
| **closeTimeout**                                                             | `Number`            | `30_000`             | Wait (ms) for pending connections on `close()`.                                                                                  |
| **onAuth / onConnect / onSecure / onMailFrom / onRcptTo / onData / onClose** | `Function`          |  –                   | Lifecycle callbacks detailed below.                                                                                              |

You may also pass any [`net.createServer`](https://nodejs.org/api/net.html#net_net_createserver_options_connectionlistener) options and, when `secure` is `true`, any [`tls.createServer`](https://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener) options.

---

## TLS and STARTTLS

If you enable TLS (`secure: true`) **or** leave `STARTTLS` enabled, ship a proper certificate via `key`, `cert`, and optionally `ca`. Otherwise _smtp‑server_ falls back to a self‑signed cert for `localhost`, which almost every client rejects.

```javascript
const fs = require("fs");
const server = new SMTPServer({
  secure: true,
  key: fs.readFileSync("private.key"),
  cert: fs.readFileSync("server.crt"),
});
server.listen(465);
```

---

## Handling errors

Attach an `error` listener to surface server errors:

```javascript
server.on("error", (err) => {
  console.error("SMTP Server error:", err.message);
});
```

---

## Handling authentication (`onAuth`)

```javascript
const server = new SMTPServer({
  onAuth(auth, session, callback) {
    // auth.method → 'PLAIN', 'LOGIN', 'XOAUTH2', or 'CRAM-MD5'
    // Return `callback(err)` to reject, `callback(null, response)` to accept
  },
});
```

### Password‑based (PLAIN / LOGIN)

```javascript
onAuth(auth, session, cb) {
  if (auth.username !== "alice" || auth.password !== "s3cr3t") {
    return cb(new Error("Invalid username or password"));
  }
  cb(null, { user: auth.username });
}
```

### OAuth 2 (`XOAUTH2`)

```javascript
const server = new SMTPServer({
  authMethods: ["XOAUTH2"],
  onAuth(auth, session, cb) {
    if (auth.accessToken !== "ya29.a0Af…") {
      return cb(null, {
        data: { status: "401", schemes: "bearer" },
      }); // see RFC 6750 Sec. 3
    }
    cb(null, { user: auth.username });
  },
});
```

---

## Validating client connection (`onConnect` / `onClose`)

```javascript
const server = new SMTPServer({
  onConnect(session, cb) {
    if (session.remoteAddress === "127.0.0.1") {
      return cb(new Error("Connections from localhost are not allowed"));
    }
    cb(); // accept
  },
  onClose(session) {
    console.log(`Connection from ${session.remoteAddress} closed`);
  },
});
```

---

## Validating TLS information (`onSecure`)

```javascript
onSecure(socket, session, cb) {
  if (session.servername !== "mail.example.com") {
    return cb(new Error("SNI mismatch"));
  }
  cb();
}
```

---

## Validating sender (`onMailFrom`)

```javascript
onMailFrom(address, session, cb) {
  if (!address.address.endsWith("@example.com")) {
    return cb(Object.assign(new Error("Relay denied"), { responseCode: 553 }));
  }
  cb();
}
```

---

## Validating recipients (`onRcptTo`)

```javascript
onRcptTo(address, session, cb) {
  if (address.address === "blackhole@example.com") {
    return cb(new Error("User unknown"));
  }
  cb();
}
```

---

## Processing incoming messages (`onData`)

```javascript
onData(stream, session, cb) {
  const write = require("fs").createWriteStream("/tmp/message.eml");
  stream.pipe(write);
  stream.on("end", () => cb(null, "Queued"));
}
```

> _smtp‑server_ streams your message **verbatim** — no `Received:` header is added. Add one yourself if you need full RFC 5321 compliance.

---

## Using the SIZE extension

Set the `size` option to advertise a limit, then check `stream.sizeExceeded` in `onData`:

```javascript
const server = new SMTPServer({
  size: 1024 * 1024, // 1 MiB
  onData(s, sess, cb) {
    s.on("end", () => {
      if (s.sizeExceeded) {
        const err = Object.assign(new Error("Message too large"), { responseCode: 552 });
        return cb(err);
      }
      cb(null, "OK");
    });
  },
});
```

---

## Using LMTP

```javascript
const server = new SMTPServer({
  lmtp: true,
  onData(stream, session, cb) {
    stream.on("end", () => {
      // Return one reply **per** recipient
      const replies = session.envelope.rcptTo.map((rcpt, i) => (i % 2 ? new Error(`<${rcpt.address}> rejected`) : `<${rcpt.address}> accepted`));
      cb(null, replies);
    });
  },
});
```

---

## Session object

| Property              | Type                              | Description                                                     |
| --------------------- | --------------------------------- | --------------------------------------------------------------- |
| **id**                | `String`                          | Random connection ID.                                           |
| **remoteAddress**     | `String`                          | Client IP address.                                              |
| **clientHostname**    | `String`                          | Reverse‑DNS of `remoteAddress` (unless `disableReverseLookup`). |
| **openingCommand**    | `"HELO" \| "EHLO" \| "LHLO"`      | First command sent by the client.                               |
| **hostNameAppearsAs** | `String`                          | Hostname the client gave in HELO/EHLO.                          |
| **envelope**          | `Object`                          | Contains `mailFrom` and `rcptTo` arrays (see below).            |
| **user**              | `any`                             | Value you returned from `onAuth`.                               |
| **transaction**       | `Number`                          | 1 for the first message, 2 for the second, …                    |
| **transmissionType**  | `"SMTP" \| "ESMTP" \| "ESMTPA" …` | Calculated for `Received:` headers.                             |

---

## Address object

```jsonc
{
  "address": "sender@example.com",
  "args": {
    "SIZE": "12345",
    "RET": "HDRS"
  }
}
```

| Field       | Description                                           |
| ----------- | ----------------------------------------------------- |
| **address** | The literal address given in `MAIL FROM:`/`RCPT TO:`. |
| **args**    | Additional arguments (uppercase keys).                |

---

## Supported commands and extensions

### Commands

- `EHLO` / `HELO`
- `AUTH` `LOGIN` · `PLAIN` · `XOAUTH2`† · `CRAM‑MD5`†
- `MAIL` / `RCPT` / `DATA`
- `RSET` / `NOOP` / `QUIT` / `VRFY`
- `HELP` (returns RFC 5321 URL)
- `STARTTLS`

† `XOAUTH2` and `CRAM‑MD5` must be enabled via `authMethods`.

### Extensions

- `PIPELINING`
- `8BITMIME`
- `SMTPUTF8`
- `SIZE`

> The `ENHANCEDSTATUSCODES` and `CHUNKING` extensions are **not** implemented.

---

## License

[MIT](https://github.com/nodemailer/nodemailer/blob/master/LICENSE)
