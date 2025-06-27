---
title: SMTP Server
sidebar_position: 1
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
| **banner**                                                                   | `String`            |  –                   | Greeting appended to the standard ESMTP banner.                                                                                  |
| **size**                                                                     | `Number`            |  `0`                 | Maximum accepted message size in bytes. `0` means unlimited.                                                                     |
| **hideSize**                                                                 | `Boolean`           | `false`              | Hide the SIZE limit from clients but still track `stream.sizeExceeded`.                                                          |
| **authMethods**                                                              | `String[]`          | `['PLAIN', 'LOGIN']` | Allowed auth mechanisms. Add `'XOAUTH2'` and/or `'CRAM-MD5'` as needed.                                                          |
| **authOptional**                                                             | `Boolean`           | `false`              | Allow but do **not** require auth.                                                                                               |
| **disabledCommands**                                                         | `String[]`          |  –                   | Commands to disable, e.g. `['AUTH']`.                                                                                            |
| **hideSTARTTLS / hidePIPELINING / hide8BITMIME / hideSMTPUTF8**              | `Boolean`           | `false`              | Remove the respective feature from the EHLO response.                                                                            |
| **hideENHANCEDSTATUSCODES**                                                  | `Boolean`           | `true`               | Enable or disable the `ENHANCEDSTATUSCODES` capability in `EHLO` response.  **Enhanced status codes are disabled by default.**   |
| **allowInsecureAuth**                                                        | `Boolean`           | `false`              | Allow authentication before TLS.                                                                                                 |
| **disableReverseLookup**                                                     | `Boolean`           | `false`              | Skip reverse DNS lookup of the client.                                                                                           |
| **sniOptions**                                                               | `Map \| Object`     |  –                   | TLS options per SNI hostname.                                                                                                    |
| **logger**                                                                   | `Boolean \| Object` | `false`              | `true` → log to `console`, or supply a Bunyan instance.                                                                          |
| **maxClients**                                                               | `Number`            | `Infinity`           | Max concurrent clients.                                                                                                          |
| **useProxy**                                                                 | `Boolean`           | `false`              | Expect an HAProxy [PROXY header](http://www.haproxy.org/download/1.5/doc/proxy-protocol.txt).                                    |
| **useXClient / useXForward**                                                 | `Boolean`           | `false`              | Enable Postfix [XCLIENT](http://www.postfix.org/XCLIENT_README.html) or [XFORWARD](http://www.postfix.org/XFORWARD_README.html). |
| **lmtp**                                                                     | `Boolean`           | `false`              | Speak LMTP instead of SMTP.                                                                                                      |
| **socketTimeout**                                                            | `Number`            | `60_000`             | Idle timeout (ms) before disconnect.                                                                                             |
| **closeTimeout**                                                             | `Number`            | `30_000`             | Wait (ms) for pending connections on `close()`.                                                                                  |
| **onAuth / onConnect / onSecure / onMailFrom / onRcptTo / onData / onClose** | `Function`          |  –                   | Lifecycle callbacks detailed below.                                                                                              |
| **resolver**                                                                 | `Object`            |  –                   | Custom DNS resolver with `.reverse` function, defaults to Node.js native `dns` module and its `dns.reverse` function.            |

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
| **envelope**          | `Object`                          | Contains `mailFrom`, `rcptTo` arrays, and `dsn` data (see below). |
| **user**              | `any`                             | Value you returned from `onAuth`.                               |
| **transaction**       | `Number`                          | 1 for the first message, 2 for the second, …                    |
| **transmissionType**  | `"SMTP" \| "ESMTP" \| "ESMTPA" …` | Calculated for `Received:` headers.                             |

---

## Envelope object

The `session.envelope` object contains transaction-specific data:

```jsonc
{
  "mailFrom": {
    "address": "sender@example.com",
    "args": { "SIZE": "12345", "RET": "HDRS" },
    "dsn": { "ret": "HDRS", "envid": "abc123" }
  },
  "rcptTo": [
    {
      "address": "user1@example.com",
      "args": { "NOTIFY": "SUCCESS,FAILURE" },
      "dsn": { "notify": ["SUCCESS", "FAILURE"], "orcpt": "rfc822;user1@example.com" }
    }
  ],
  "dsn": {
    "ret": "HDRS",
    "envid": "abc123"
  }
}
```

| Property     | Type       | Description                                    |
| ------------ | ---------- | ---------------------------------------------- |
| **mailFrom** | `Object`   | Sender address object (see Address object)    |
| **rcptTo**   | `Object[]` | Array of recipient address objects            |
| **dsn**      | `Object`   | DSN parameters from MAIL FROM command         |

---

## Address object

```jsonc
{
  "address": "sender@example.com",
  "args": {
    "SIZE": "12345",
    "RET": "HDRS"
  },
  "dsn": {
    "ret": "HDRS",
    "envid": "abc123",
    "notify": ["SUCCESS", "FAILURE"],
    "orcpt": "rfc822;original@example.com"
  }
}
```

| Field       | Description                                           |
| ----------- | ----------------------------------------------------- |
| **address** | The literal address given in `MAIL FROM:`/`RCPT TO:`. |
| **args**    | Additional arguments (uppercase keys).                |
| **dsn**     | DSN parameters (when ENHANCEDSTATUSCODES is enabled). |

### DSN Object Properties

| Property    | Type       | Description                                    |
| ----------- | ---------- | ---------------------------------------------- |
| **ret**     | `String`   | Return type: `'FULL'` or `'HDRS'` (MAIL FROM) |
| **envid**   | `String`   | Envelope identifier (MAIL FROM)                |
| **notify**  | `String[]` | Notification types (RCPT TO)                   |
| **orcpt**   | `String`   | Original recipient (RCPT TO)                   |

---

## Enhanced Status Codes (RFC 2034/3463)

_smtp‑server_ supports **Enhanced Status Codes** as defined in RFC 2034 and RFC 3463. When enabled, all SMTP responses include enhanced status codes in the format `X.Y.Z`:

```
250 2.1.0 Accepted        ← Enhanced status code: 2.1.0
550 5.1.1 Mailbox unavailable ← Enhanced status code: 5.1.1
```

### Enabling Enhanced Status Codes

To enable enhanced status codes (they are disabled by default):

```javascript
const server = new SMTPServer({
  hideENHANCEDSTATUSCODES: false, // Enable enhanced status codes
  onMailFrom(address, session, callback) {
    callback(); // Response: "250 2.1.0 Accepted" (with enhanced code)
  },
});
```

### Disabling Enhanced Status Codes

Enhanced status codes are disabled by default, but you can explicitly disable them:

```javascript
const server = new SMTPServer({
  hideENHANCEDSTATUSCODES: true, // Explicitly disable enhanced status codes (default behavior)
  onMailFrom(address, session, callback) {
    callback(); // Response: "250 Accepted" (no enhanced code)
  },
});
```

### Enhanced Status Code Examples

| Response Code | Enhanced Code | Description |
|---------------|---------------|-------------|
| `250` | `2.0.0` | General success |
| `250` | `2.1.0` | MAIL FROM accepted |
| `250` | `2.1.5` | RCPT TO accepted |
| `250` | `2.6.0` | Message accepted |
| `501` | `5.5.4` | Syntax error in parameters |
| `550` | `5.1.1` | Mailbox unavailable |
| `552` | `5.2.2` | Storage exceeded |

---

## DSN (Delivery Status Notification) Support

_smtp‑server_ fully supports **DSN parameters** as defined in RFC 3461, allowing clients to request delivery status notifications.

DSN functionality requires **Enhanced Status Codes** to be enabled. Since enhanced status codes are disabled by default, you must set `hideENHANCEDSTATUSCODES: false` to use DSN features.

### DSN Parameters

#### MAIL FROM Parameters

- **`RET=FULL`** or **`RET=HDRS`** — Return full message or headers only in DSN
- **`ENVID=<envelope-id>`** — Envelope identifier for tracking

```javascript
// Client sends: MAIL FROM:<sender@example.com> RET=FULL ENVID=abc123
```

#### RCPT TO Parameters

- **`NOTIFY=SUCCESS,FAILURE,DELAY,NEVER`** — When to send DSN
- **`ORCPT=<original-recipient>`** — Original recipient for tracking

```javascript
// Client sends: RCPT TO:<user@example.com> NOTIFY=SUCCESS,FAILURE ORCPT=rfc822;user@example.com
```

### Accessing DSN Parameters

DSN parameters are available in your callback handlers:

```javascript
const server = new SMTPServer({
  hideENHANCEDSTATUSCODES: false, // Required for DSN functionality
  onMailFrom(address, session, callback) {
    // Access DSN parameters from MAIL FROM
    const ret = session.envelope.dsn.ret;        // 'FULL' or 'HDRS'
    const envid = session.envelope.dsn.envid;    // Envelope ID

    console.log(`RET: ${ret}, ENVID: ${envid}`);
    callback();
  },

  onRcptTo(address, session, callback) {
    // Access DSN parameters from RCPT TO
    const notify = address.dsn.notify;   // ['SUCCESS', 'FAILURE', 'DELAY']
    const orcpt = address.dsn.orcpt;     // Original recipient

    console.log(`NOTIFY: ${notify.join(',')}, ORCPT: ${orcpt}`);
    callback();
  },
});
```

### DSN Parameter Validation

_smtp‑server_ automatically validates DSN parameters:

- **`RET`** must be `FULL` or `HDRS`
- **`NOTIFY`** must be `SUCCESS`, `FAILURE`, `DELAY`, or `NEVER`
- **`NOTIFY=NEVER`** cannot be combined with other values
- Invalid parameters return appropriate error responses with enhanced status codes

### Complete DSN Example

```javascript
const server = new SMTPServer({
  hideENHANCEDSTATUSCODES: false, // Required for DSN functionality
  onMailFrom(address, session, callback) {
    const { ret, envid } = session.envelope.dsn;
    console.log(`Mail from ${address.address}, RET=${ret}, ENVID=${envid}`);
    callback();
  },

  onRcptTo(address, session, callback) {
    const { notify, orcpt } = address.dsn;
    console.log(`Rcpt to ${address.address}, NOTIFY=${notify.join(',')}, ORCPT=${orcpt}`);
    callback();
  },

  onData(stream, session, callback) {
    // Process message with DSN context
    const { dsn } = session.envelope;
    console.log(`Processing message with DSN: ${JSON.stringify(dsn)}`);

    stream.on('end', () => {
      callback(null, 'Message accepted for delivery');
    });
    stream.resume();
  },
});
```

### Production DSN Implementation Example

Here's a complete example showing how to implement DSN notifications using nodemailer:

```javascript
const { SMTPServer } = require('smtp-server');
const nodemailer = require('nodemailer');

// Create a nodemailer transporter for sending DSN notifications
const dsnTransporter = nodemailer.createTransporter({
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: {
    user: 'dsn-sender@example.com',
    pass: 'your-password'
  }
});

// DSN notification generator
class DSNNotifier {
  constructor(transporter) {
    this.transporter = transporter;
  }

  async sendSuccessNotification(envelope, messageId, deliveryTime) {
    // Only send if SUCCESS notification was requested
    const needsSuccessNotification = envelope.rcptTo.some(rcpt =>
      rcpt.dsn.notify && rcpt.dsn.notify.includes('SUCCESS')
    );

    if (!needsSuccessNotification || !envelope.mailFrom.address) {
      return;
    }

    const dsnMessage = this.generateDSNMessage({
      action: 'delivered',
      status: '2.0.0',
      envelope,
      messageId,
      deliveryTime,
      diagnosticCode: 'smtp; 250 2.0.0 Message accepted for delivery'
    });

    await this.transporter.sendMail({
      from: 'postmaster@example.com',
      to: envelope.mailFrom.address,
      subject: 'Delivery Status Notification (Success)',
      text: dsnMessage.text,
      headers: {
        'Auto-Submitted': 'auto-replied',
        'Content-Type': 'multipart/report; report-type=delivery-status'
      }
    });
  }

  generateDSNMessage({ action, status, envelope, messageId, deliveryTime, diagnosticCode }) {
    const { dsn } = envelope;
    const timestamp = deliveryTime || new Date().toISOString();

    // Generate RFC 3464 compliant delivery status notification
    const text = `This is an automatically generated Delivery Status Notification.

Original Message Details:
- Message ID: ${messageId}
- Envelope ID: ${dsn.envid || 'Not provided'}
- Sender: ${envelope.mailFrom.address}
- Recipients: ${envelope.rcptTo.map(r => r.address).join(', ')}
- Action: ${action}
- Status: ${status}
- Time: ${timestamp}

${action === 'delivered' ?
  'Your message has been successfully delivered to all recipients.' :
  'Delivery failed for one or more recipients.'
}`;

    return { text };
  }
}

// Create DSN notifier instance
const dsnNotifier = new DSNNotifier(dsnTransporter);

// SMTP Server with DSN support
const server = new SMTPServer({
  hideENHANCEDSTATUSCODES: false, // Required for DSN functionality
  name: 'mail.example.com',

  onMailFrom(address, session, callback) {
    const { dsn } = session.envelope;
    console.log(`MAIL FROM: ${address.address}, RET=${dsn.ret}, ENVID=${dsn.envid}`);
    callback();
  },

  onRcptTo(address, session, callback) {
    const { notify, orcpt } = address.dsn;
    console.log(`RCPT TO: ${address.address}, NOTIFY=${notify?.join(',')}, ORCPT=${orcpt}`);
    callback();
  },

  async onData(stream, session, callback) {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    stream.on('end', async () => {
      try {
        // Simulate message delivery
        const deliveryTime = new Date();

        // Send DSN success notification if requested
        await dsnNotifier.sendSuccessNotification(
          session.envelope,
          messageId,
          deliveryTime
        );

        callback(null, `Message ${messageId} accepted for delivery`);
      } catch (error) {
        callback(error);
      }
    });

    stream.resume();
  }
});

server.listen(2525, () => {
  console.log('DSN-enabled SMTP server listening on port 2525');
});
```

This example demonstrates:
- **Complete DSN workflow** from parameter parsing to notification sending
- **RFC-compliant DSN messages** with proper headers and content
- **Conditional notifications** based on NOTIFY parameters
- **Integration with nodemailer** for sending DSN notifications
- **Production-ready structure** with error handling

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
- `ENHANCEDSTATUSCODES` (RFC 2034/3463)

> The `CHUNKING` extension is **not** implemented.

---

## License

[MIT](https://github.com/nodemailer/nodemailer/blob/master/LICENSE)
