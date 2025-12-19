---
title: SMTP Server
sidebar_position: 1
description: Create custom SMTP and LMTP server instances with authentication and message handling.
---

Create SMTP and LMTP server instances on the fly. The _smtp-server_ module is **not** a full-blown mail server application like [Haraka](https://haraka.github.io/). Instead, it provides a convenient way to add custom SMTP or LMTP listeners to your Node.js application. It is the successor to the server portion of the now-deprecated [simplesmtp](https://www.npmjs.com/package/simplesmtp) module. For a matching SMTP client, see [SMTP Connection](./smtp-connection). This module is also useful for [testing email functionality](../smtp/testing) in development environments.

## Usage

### 1. Install

```bash
npm install smtp-server --save
```

### 2. Require in your script

```javascript
const { SMTPServer } = require("smtp-server");
```

### 3. Create a server instance

```javascript
const server = new SMTPServer(options);
```

### 4. Start listening

```javascript
server.listen(port[, host][, callback]);
```

### 5. Shut down

```javascript
server.close(callback);
```

## Options reference

| Option                                                                       | Type                | Default              | Description                                                                                                                      |
| ---------------------------------------------------------------------------- | ------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **secure**                                                                   | `Boolean`           | `false`              | Start the server in TLS mode. You can still upgrade non-TLS connections with `STARTTLS` if you leave this `false`.               |
| **name**                                                                     | `String`            | `os.hostname()`      | The server hostname announced in the greeting banner.                                                                            |
| **banner**                                                                   | `String`            | -                    | Custom greeting message appended to the standard ESMTP banner sent when a client first connects.                                 |
| **heloResponse**                                                             | `String`            | `'%s Nice to meet you, %s'` | Format string for the HELO/EHLO greeting. Use `%s` placeholders: first = server name, second = client hostname.           |
| **size**                                                                     | `Number`            | `0`                  | Maximum allowed message size in bytes. `0` means unlimited.                                                                      |
| **hideSize**                                                                 | `Boolean`           | `false`              | Hides the SIZE limit from clients in EHLO response, but still tracks `stream.sizeExceeded` internally.                           |
| **authMethods**                                                              | `String[]`          | `['PLAIN', 'LOGIN']` | Authentication mechanisms to offer. Add `'XOAUTH2'` and/or `'CRAM-MD5'` as needed.                                               |
| **authOptional**                                                             | `Boolean`           | `false`              | Allow clients to proceed without authentication. When `false`, authentication is required before sending mail.                   |
| **disabledCommands**                                                         | `String[]`          | -                    | SMTP commands to disable, e.g., `['AUTH']` to disable authentication entirely.                                                   |
| **hideSTARTTLS / hidePIPELINING / hide8BITMIME / hideSMTPUTF8**              | `Boolean`           | `false`              | Hide the specified capability from the EHLO response.                                                                            |
| **hideENHANCEDSTATUSCODES**                                                  | `Boolean`           | `true`               | When `true` (default), enhanced status codes (RFC 2034/3463) are not included in responses. Set to `false` to enable them.       |
| **hideDSN**                                                                  | `Boolean`           | `true`               | When `true` (default), DSN (Delivery Status Notification) capability is hidden. Set to `false` to enable DSN support.            |
| **hideREQUIRETLS**                                                           | `Boolean`           | `true`               | When `true` (default), REQUIRETLS capability (RFC 8689) is hidden. Set to `false` to advertise REQUIRETLS support.               |
| **allowInsecureAuth**                                                        | `Boolean`           | `false`              | Allow authentication over unencrypted connections. Not recommended for production.                                               |
| **disableReverseLookup**                                                     | `Boolean`           | `false`              | Skip reverse DNS lookup of the client IP address.                                                                                |
| **sniOptions**                                                               | `Map \| Object`     | -                    | TLS options keyed by SNI hostname for serving different certificates based on the requested hostname.                            |
| **logger**                                                                   | `Boolean \| Object` | `false`              | Set to `true` to log to the console, or provide a Bunyan-compatible logger instance.                                             |
| **maxClients**                                                               | `Number`            | `Infinity`           | Maximum number of concurrent client connections.                                                                                 |
| **useProxy**                                                                 | `Boolean`           | `false`              | Expect an HAProxy [PROXY protocol](http://www.haproxy.org/download/1.5/doc/proxy-protocol.txt) header before the SMTP session.   |
| **useXClient / useXForward**                                                 | `Boolean`           | `false`              | Enable Postfix [XCLIENT](http://www.postfix.org/XCLIENT_README.html) or [XFORWARD](http://www.postfix.org/XFORWARD_README.html) extensions. |
| **lmtp**                                                                     | `Boolean`           | `false`              | Use LMTP (Local Mail Transfer Protocol) instead of SMTP.                                                                         |
| **socketTimeout**                                                            | `Number`            | `60_000`             | Idle timeout in milliseconds before disconnecting an inactive client.                                                            |
| **closeTimeout**                                                             | `Number`            | `30_000`             | Time in milliseconds to wait for pending connections to finish when calling `close()`.                                           |
| **onAuth / onConnect / onSecure / onMailFrom / onRcptTo / onData / onClose** | `Function`          | -                    | Lifecycle callback handlers (detailed in sections below).                                                                        |
| **resolver**                                                                 | `Object`            | -                    | Custom DNS resolver object with a `.reverse()` method. Defaults to the Node.js built-in `dns` module.                            |

You may also pass any options accepted by [`net.createServer`](https://nodejs.org/api/net.html#net_net_createserver_options_connectionlistener). When `secure` is `true`, you can additionally pass [`tls.createServer`](https://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener) options.

---

## Customizing greetings

### Initial connection banner

The `banner` option adds a custom message to the initial connection response (the 220 greeting):

```javascript
const server = new SMTPServer({
  banner: "Welcome to our mail service",
});
// Client sees: "220 hostname ESMTP Welcome to our mail service"
```

### HELO/EHLO response

The `heloResponse` option customizes the greeting returned after a client sends HELO or EHLO. Use `%s` placeholders for dynamic values:

```javascript
const server = new SMTPServer({
  heloResponse: "%s says hello to %s",
});
// Client sees: "250 hostname says hello to client.example.com"
```

**Placeholders:**
- First `%s` is replaced with the server name (from the `name` option or `os.hostname()`)
- Second `%s` is replaced with the client hostname (reverse DNS lookup result or IP address in brackets)

**Examples:**

```javascript
// Default behavior (no configuration needed)
// "250 hostname Nice to meet you, client.example.com"

// Custom formal greeting
heloResponse: "Welcome to %s mail server"
// "250 Welcome to hostname mail server"

// Simple greeting without placeholders
heloResponse: "Hello"
// "250 Hello"

// Using both placeholders
heloResponse: "%s greets %s"
// "250 hostname greets client.example.com"
```

---

## TLS and STARTTLS

If you enable TLS (`secure: true`) or leave `STARTTLS` available (the default), you should provide a valid certificate using the `key`, `cert`, and optionally `ca` options. Without a proper certificate, _smtp-server_ uses a self-signed certificate for `localhost`, which most email clients will reject.

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

Listen for the `error` event to handle server-level errors:

```javascript
server.on("error", (err) => {
  console.error("SMTP Server error:", err.message);
});
```

---

## Handling authentication (`onAuth`)

The `onAuth` callback is invoked when a client attempts to authenticate. Use it to verify credentials and accept or reject the login attempt.

```javascript
const server = new SMTPServer({
  onAuth(auth, session, callback) {
    // auth.method contains the authentication method: 'PLAIN', 'LOGIN', 'XOAUTH2', or 'CRAM-MD5'
    // Call callback(err) to reject, or callback(null, { user: ... }) to accept
  },
});
```

### Password-based authentication (PLAIN / LOGIN)

```javascript
onAuth(auth, session, callback) {
  if (auth.username !== "alice" || auth.password !== "s3cr3t") {
    return callback(new Error("Invalid username or password"));
  }
  callback(null, { user: auth.username });
}
```

### OAuth 2 authentication (`XOAUTH2`)

```javascript
const server = new SMTPServer({
  authMethods: ["XOAUTH2"],
  onAuth(auth, session, callback) {
    if (auth.accessToken !== "ya29.a0Af...") {
      // Return OAuth error response per RFC 6750 Section 3
      return callback(null, {
        data: { status: "401", schemes: "bearer" },
      });
    }
    callback(null, { user: auth.username });
  },
});
```

---

## Validating client connections (`onConnect` / `onClose`)

Use `onConnect` to accept or reject incoming connections before any SMTP commands are processed. Use `onClose` to perform cleanup when a connection ends.

```javascript
const server = new SMTPServer({
  onConnect(session, callback) {
    if (session.remoteAddress === "127.0.0.1") {
      return callback(new Error("Connections from localhost are not allowed"));
    }
    callback(); // Accept the connection
  },
  onClose(session) {
    console.log(`Connection from ${session.remoteAddress} closed`);
  },
});
```

---

## Validating TLS information (`onSecure`)

The `onSecure` callback is called after a TLS handshake completes (either from an initially secure connection or after STARTTLS). Use it to validate TLS-specific information like the SNI hostname.

```javascript
onSecure(socket, session, callback) {
  if (session.servername !== "mail.example.com") {
    return callback(new Error("SNI mismatch"));
  }
  callback();
}
```

---

## Validating sender (`onMailFrom`)

The `onMailFrom` callback is invoked when the client issues a `MAIL FROM` command. Use it to validate or reject the sender address.

```javascript
onMailFrom(address, session, callback) {
  if (!address.address.endsWith("@example.com")) {
    // Include a custom response code by setting responseCode on the error
    return callback(Object.assign(new Error("Relay denied"), { responseCode: 553 }));
  }
  callback();
}
```

---

## Validating recipients (`onRcptTo`)

The `onRcptTo` callback is invoked for each `RCPT TO` command. Use it to validate or reject recipient addresses.

```javascript
onRcptTo(address, session, callback) {
  if (address.address === "blackhole@example.com") {
    return callback(new Error("User unknown"));
  }
  callback();
}
```

---

## Processing incoming messages (`onData`)

The `onData` callback receives a readable stream containing the email message data. The message is streamed verbatim as sent by the client. To parse the received message, you can use [MailParser](./mailparser).

```javascript
onData(stream, session, callback) {
  const fs = require("fs");
  const writeStream = fs.createWriteStream("/tmp/message.eml");
  stream.pipe(writeStream);
  stream.on("end", () => callback(null, "Message queued"));
}
```

:::note
_smtp-server_ does not add a `Received:` header to the message. If you need RFC 5321 compliance, you must add this header yourself.
:::

---

## Using the SIZE extension

Set the `size` option to advertise a maximum message size to clients. Then check `stream.sizeExceeded` in your `onData` handler to detect oversized messages:

```javascript
const server = new SMTPServer({
  size: 1024 * 1024, // 1 MiB limit
  onData(stream, session, callback) {
    stream.on("end", () => {
      if (stream.sizeExceeded) {
        const err = new Error("Message too large");
        err.responseCode = 552;
        return callback(err);
      }
      callback(null, "OK");
    });
    stream.resume(); // Consume the stream
  },
});
```

---

## Using LMTP

LMTP (Local Mail Transfer Protocol) requires a separate response for each recipient. Return an array from your `onData` callback with one response per recipient:

```javascript
const server = new SMTPServer({
  lmtp: true,
  onData(stream, session, callback) {
    stream.on("end", () => {
      // Return one response per recipient in the same order as session.envelope.rcptTo
      const replies = session.envelope.rcptTo.map((rcpt, index) =>
        index % 2 === 0
          ? `<${rcpt.address}> accepted`
          : new Error(`<${rcpt.address}> rejected`)
      );
      callback(null, replies);
    });
    stream.resume();
  },
});
```

---

## Session object

The session object contains information about the current connection and is passed to all callback handlers.

| Property              | Type                              | Description                                                              |
| --------------------- | --------------------------------- | ------------------------------------------------------------------------ |
| **id**                | `String`                          | Unique identifier for this connection (randomly generated).              |
| **remoteAddress**     | `String`                          | Client's IP address.                                                     |
| **clientHostname**    | `String`                          | Reverse DNS hostname of the client (unless `disableReverseLookup` is set). |
| **openingCommand**    | `"HELO" \| "EHLO" \| "LHLO"`      | The greeting command sent by the client.                                 |
| **hostNameAppearsAs** | `String`                          | The hostname the client provided in HELO/EHLO/LHLO.                      |
| **envelope**          | `Object`                          | Contains `mailFrom`, `rcptTo`, and related transaction data.             |
| **user**              | `any`                             | The value returned from your `onAuth` callback after successful login.   |
| **transaction**       | `Number`                          | Transaction counter: 1 for the first message, 2 for the second, etc.     |
| **transmissionType**  | `"SMTP" \| "ESMTP" \| "ESMTPA" ...` | Transmission type string suitable for `Received:` headers.             |

---

## Envelope object

The `session.envelope` object contains data specific to the current mail transaction:

```jsonc
{
  "mailFrom": {
    "address": "sender@example.com",
    "args": { "SIZE": "12345", "RET": "HDRS", "BODY": "8BITMIME", "SMTPUTF8": true, "REQUIRETLS": true },
    "dsn": { "ret": "HDRS", "envid": "abc123" }
  },
  "rcptTo": [
    {
      "address": "user1@example.com",
      "args": { "NOTIFY": "SUCCESS,FAILURE" },
      "dsn": { "notify": ["SUCCESS", "FAILURE"], "orcpt": "rfc822;user1@example.com" }
    }
  ],
  "bodyType": "8bitmime",
  "smtpUtf8": true,
  "requireTLS": true,
  "dsn": {
    "ret": "HDRS",
    "envid": "abc123"
  }
}
```

| Property      | Type       | Description                                                      |
| ------------- | ---------- | ---------------------------------------------------------------- |
| **mailFrom**  | `Object`   | Sender address object (see Address object below).                |
| **rcptTo**    | `Object[]` | Array of recipient address objects.                              |
| **bodyType**  | `String`   | Message body encoding: `'7bit'` (default) or `'8bitmime'` (RFC 6152). |
| **smtpUtf8**  | `Boolean`  | `true` if the client requested UTF-8 support (RFC 6531).         |
| **requireTLS**| `Boolean`  | `true` if TLS is required for the entire delivery chain (RFC 8689). |
| **dsn**       | `Object`   | DSN parameters from the MAIL FROM command (when DSN is enabled). |

---

## Address object

Both `mailFrom` and each entry in `rcptTo` are address objects with the following structure:

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

| Field       | Description                                              |
| ----------- | -------------------------------------------------------- |
| **address** | The email address from the `MAIL FROM:` or `RCPT TO:` command. |
| **args**    | Additional SMTP parameters (keys are uppercase).         |
| **dsn**     | DSN-specific parameters (when DSN is enabled).           |

### DSN object properties

| Property   | Type       | Description                                           |
| ---------- | ---------- | ----------------------------------------------------- |
| **ret**    | `String`   | Return type: `'FULL'` or `'HDRS'` (from MAIL FROM).   |
| **envid**  | `String`   | Envelope identifier (from MAIL FROM).                 |
| **notify** | `String[]` | Notification conditions (from RCPT TO).               |
| **orcpt**  | `String`   | Original recipient address (from RCPT TO).            |

---

## Enhanced Status Codes (RFC 2034/3463)

_smtp-server_ supports Enhanced Status Codes as defined in RFC 2034 and RFC 3463. When enabled, SMTP responses include a three-part status code in the format `X.Y.Z`:

```
250 2.1.0 Accepted        <- Enhanced status code: 2.1.0
550 5.1.1 Mailbox unavailable <- Enhanced status code: 5.1.1
```

### Enabling enhanced status codes

Enhanced status codes are **disabled by default**. To enable them:

```javascript
const server = new SMTPServer({
  hideENHANCEDSTATUSCODES: false, // Enable enhanced status codes
  onMailFrom(address, session, callback) {
    callback(); // Response includes enhanced code: "250 2.1.0 Accepted"
  },
});
```

### Disabling enhanced status codes

Enhanced status codes are disabled by default. You can also explicitly disable them:

```javascript
const server = new SMTPServer({
  hideENHANCEDSTATUSCODES: true, // Explicitly disable (this is the default)
  onMailFrom(address, session, callback) {
    callback(); // Response: "250 Accepted" (no enhanced code)
  },
});
```

### Enhanced status code reference

| Response Code | Enhanced Code | Description                |
| ------------- | ------------- | -------------------------- |
| `250`         | `2.0.0`       | General success            |
| `250`         | `2.1.0`       | MAIL FROM accepted         |
| `250`         | `2.1.5`       | RCPT TO accepted           |
| `250`         | `2.6.0`       | Message accepted           |
| `501`         | `5.5.4`       | Syntax error in parameters |
| `550`         | `5.1.1`       | Mailbox unavailable        |
| `552`         | `5.2.2`       | Storage exceeded           |

---

## DSN (Delivery Status Notification) Support

_smtp-server_ supports DSN parameters as defined in RFC 3461, allowing clients to request delivery status notifications.

**Important:** DSN is disabled by default. You must set `hideDSN: false` to enable DSN functionality.

### DSN parameters

#### MAIL FROM parameters

- **`RET=FULL`** or **`RET=HDRS`** - Specifies whether DSN reports should include the full message or headers only
- **`ENVID=<envelope-id>`** - An envelope identifier for tracking purposes

```javascript
// Client sends: MAIL FROM:<sender@example.com> RET=FULL ENVID=abc123
```

#### RCPT TO parameters

- **`NOTIFY=SUCCESS,FAILURE,DELAY,NEVER`** - Specifies when to send DSN notifications
- **`ORCPT=<original-recipient>`** - Records the original recipient address for tracking

```javascript
// Client sends: RCPT TO:<user@example.com> NOTIFY=SUCCESS,FAILURE ORCPT=rfc822;user@example.com
```

### Accessing DSN parameters

DSN parameters are available in your callback handlers through the session and address objects:

```javascript
const server = new SMTPServer({
  hideDSN: false, // Required to enable DSN
  onMailFrom(address, session, callback) {
    // Access DSN parameters from MAIL FROM
    const ret = session.envelope.dsn.ret; // 'FULL' or 'HDRS'
    const envid = session.envelope.dsn.envid; // Envelope ID

    console.log(`RET: ${ret}, ENVID: ${envid}`);
    callback();
  },

  onRcptTo(address, session, callback) {
    // Access DSN parameters from RCPT TO
    const notify = address.dsn.notify; // ['SUCCESS', 'FAILURE', 'DELAY']
    const orcpt = address.dsn.orcpt; // Original recipient

    console.log(`NOTIFY: ${notify.join(",")}, ORCPT: ${orcpt}`);
    callback();
  },
});
```

### DSN parameter validation

_smtp-server_ automatically validates DSN parameters:

- **`RET`** must be `FULL` or `HDRS`
- **`NOTIFY`** must contain valid values: `SUCCESS`, `FAILURE`, `DELAY`, or `NEVER`
- **`NOTIFY=NEVER`** cannot be combined with other values
- Invalid parameters receive appropriate error responses

### Complete DSN example

```javascript
const server = new SMTPServer({
  hideDSN: false, // Required to enable DSN
  onMailFrom(address, session, callback) {
    const { ret, envid } = session.envelope.dsn;
    console.log(`Mail from ${address.address}, RET=${ret}, ENVID=${envid}`);
    callback();
  },

  onRcptTo(address, session, callback) {
    const { notify, orcpt } = address.dsn;
    console.log(`Rcpt to ${address.address}, NOTIFY=${notify.join(",")}, ORCPT=${orcpt}`);
    callback();
  },

  onData(stream, session, callback) {
    // Process message with DSN context
    const { dsn } = session.envelope;
    console.log(`Processing message with DSN: ${JSON.stringify(dsn)}`);

    stream.on("end", () => {
      callback(null, "Message accepted for delivery");
    });
    stream.resume();
  },
});
```

### Production DSN implementation example

Here is a complete example showing how to implement DSN notifications using Nodemailer:

```javascript
const { SMTPServer } = require("smtp-server");
const nodemailer = require("nodemailer");

// Create a Nodemailer transporter for sending DSN notifications
const dsnTransporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  secure: false,
  auth: {
    user: "dsn-sender@example.com",
    pass: "your-password",
  },
});

// DSN notification generator
class DSNNotifier {
  constructor(transporter) {
    this.transporter = transporter;
  }

  async sendSuccessNotification(envelope, messageId, deliveryTime) {
    // Only send if SUCCESS notification was requested
    const needsSuccessNotification = envelope.rcptTo.some((rcpt) => rcpt.dsn.notify && rcpt.dsn.notify.includes("SUCCESS"));

    if (!needsSuccessNotification || !envelope.mailFrom.address) {
      return;
    }

    const dsnMessage = this.generateDSNMessage({
      action: "delivered",
      status: "2.0.0",
      envelope,
      messageId,
      deliveryTime,
      diagnosticCode: "smtp; 250 2.0.0 Message accepted for delivery",
    });

    await this.transporter.sendMail({
      from: "postmaster@example.com",
      to: envelope.mailFrom.address,
      subject: "Delivery Status Notification (Success)",
      text: dsnMessage.text,
      headers: {
        "Auto-Submitted": "auto-replied",
        "Content-Type": "multipart/report; report-type=delivery-status",
      },
    });
  }

  generateDSNMessage({ action, status, envelope, messageId, deliveryTime, diagnosticCode }) {
    const { dsn } = envelope;
    const timestamp = deliveryTime || new Date().toISOString();

    // Generate RFC 3464 compliant delivery status notification
    const text = `This is an automatically generated Delivery Status Notification.

Original Message Details:
- Message ID: ${messageId}
- Envelope ID: ${dsn.envid || "Not provided"}
- Sender: ${envelope.mailFrom.address}
- Recipients: ${envelope.rcptTo.map((r) => r.address).join(", ")}
- Action: ${action}
- Status: ${status}
- Time: ${timestamp}

${action === "delivered" ? "Your message has been successfully delivered to all recipients." : "Delivery failed for one or more recipients."}`;

    return { text };
  }
}

// Create DSN notifier instance
const dsnNotifier = new DSNNotifier(dsnTransporter);

// SMTP Server with DSN support
const server = new SMTPServer({
  hideDSN: false, // Required to enable DSN
  name: "mail.example.com",

  onMailFrom(address, session, callback) {
    const { dsn } = session.envelope;
    console.log(`MAIL FROM: ${address.address}, RET=${dsn.ret}, ENVID=${dsn.envid}`);
    callback();
  },

  onRcptTo(address, session, callback) {
    const { notify, orcpt } = address.dsn;
    console.log(`RCPT TO: ${address.address}, NOTIFY=${notify?.join(",")}, ORCPT=${orcpt}`);
    callback();
  },

  async onData(stream, session, callback) {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    stream.on("end", async () => {
      try {
        // Simulate message delivery
        const deliveryTime = new Date();

        // Send DSN success notification if requested
        await dsnNotifier.sendSuccessNotification(session.envelope, messageId, deliveryTime);

        callback(null, `Message ${messageId} accepted for delivery`);
      } catch (error) {
        callback(error);
      }
    });

    stream.resume();
  },
});

server.listen(2525, () => {
  console.log("DSN-enabled SMTP server listening on port 2525");
});
```

This example demonstrates:

- **Complete DSN workflow** from parameter parsing to notification sending
- **RFC-compliant DSN messages** with proper headers and content
- **Conditional notifications** based on NOTIFY parameters
- **Integration with Nodemailer** for sending DSN notifications
- **Production-ready structure** with error handling

---

## MAIL FROM Parameters (BODY, SMTPUTF8, REQUIRETLS)

_smtp-server_ supports several RFC-compliant MAIL FROM parameters that allow clients to specify message characteristics and delivery requirements.

### BODY parameter (RFC 6152)

The `BODY` parameter specifies the message body encoding type:

- **`BODY=7BIT`** - 7-bit ASCII encoding (the default)
- **`BODY=8BITMIME`** - 8-bit MIME encoding for messages containing non-ASCII characters

```javascript
// Client sends: MAIL FROM:<sender@example.com> BODY=8BITMIME
```

The selected body type is available in `session.envelope.bodyType`:

```javascript
const server = new SMTPServer({
  onMailFrom(address, session, callback) {
    console.log(`Body type: ${session.envelope.bodyType}`); // '7bit' or '8bitmime'
    callback();
  },
});
```

**Note:** `BINARYMIME` is not supported because it requires the `BDAT` command (RFC 3030), which is not implemented.

### SMTPUTF8 parameter (RFC 6531)

The `SMTPUTF8` parameter indicates that the client wants to use UTF-8 encoding in email addresses and headers:

```javascript
// Client sends: MAIL FROM:<sender@example.com> SMTPUTF8
```

The UTF-8 flag is available in `session.envelope.smtpUtf8`:

```javascript
const server = new SMTPServer({
  onMailFrom(address, session, callback) {
    if (session.envelope.smtpUtf8) {
      console.log("UTF-8 support requested");
    }
    callback();
  },
});
```

### REQUIRETLS parameter (RFC 8689)

The `REQUIRETLS` parameter indicates that the client requires TLS encryption for the entire delivery chain, not just the client-to-server connection. This is useful when sending sensitive messages that must never be transmitted over unencrypted connections.

**Important:** REQUIRETLS is disabled by default and must be explicitly enabled:

```javascript
const server = new SMTPServer({
  hideREQUIRETLS: false, // Enable REQUIRETLS support
  onMailFrom(address, session, callback) {
    if (session.envelope.requireTLS) {
      console.log("TLS required for entire delivery chain");
      // Ensure downstream delivery also uses TLS
    }
    callback();
  },
});
```

**Requirements:**
- REQUIRETLS is only advertised when the connection is already using TLS (after STARTTLS or on an initially secure connection)
- Clients can only use REQUIRETLS when connected over TLS
- If a client attempts to use REQUIRETLS without TLS, the server returns error code 530

```javascript
// Client sends: MAIL FROM:<sender@example.com> REQUIRETLS
// Server sets: session.envelope.requireTLS === true
```

### Combined parameters example

All MAIL FROM parameters can be used together in a single command:

```javascript
const server = new SMTPServer({
  hideREQUIRETLS: false, // Enable REQUIRETLS
  onMailFrom(address, session, callback) {
    const { bodyType, smtpUtf8, requireTLS } = session.envelope;

    console.log(`
      Body Type: ${bodyType}
      UTF-8: ${smtpUtf8}
      Require TLS: ${requireTLS}
    `);

    // Validate requirements
    if (requireTLS && !session.secure) {
      return callback(new Error("TLS required but not established"));
    }

    callback();
  },
});
```

```javascript
// Client sends: MAIL FROM:<sender@example.com> BODY=8BITMIME SMTPUTF8 REQUIRETLS
```

### Parameter validation

_smtp-server_ automatically validates all MAIL FROM parameters:

- **BODY** must be `7BIT` or `8BITMIME` (case-insensitive)
- **SMTPUTF8** is a flag parameter and must not have a value
- **REQUIRETLS** is a flag parameter and must not have a value
- **REQUIRETLS** can only be used over TLS connections

Invalid parameters return appropriate error codes (501 for syntax errors, 530 for TLS requirement violations).

---

## Supported commands and extensions

### Commands

- `EHLO` / `HELO` - Session initialization
- `AUTH` - Authentication (`LOGIN`, `PLAIN`, `XOAUTH2`\*, `CRAM-MD5`\*)
- `MAIL` / `RCPT` / `DATA` - Mail transaction commands
- `RSET` / `NOOP` / `QUIT` / `VRFY` - Session management
- `HELP` - Returns a reference to RFC 5321
- `STARTTLS` - Upgrade connection to TLS

\* `XOAUTH2` and `CRAM-MD5` must be explicitly enabled via the `authMethods` option.

### Extensions

- `PIPELINING` - Allows command pipelining for improved performance
- `8BITMIME` (RFC 6152) - 8-bit MIME message support
- `SMTPUTF8` (RFC 6531) - UTF-8 support in email addresses and headers
- `SIZE` - Message size declaration and limit enforcement
- `DSN` (RFC 3461) - Delivery Status Notifications (opt-in via `hideDSN: false`)
- `ENHANCEDSTATUSCODES` (RFC 2034/3463) - Enhanced status codes (opt-in via `hideENHANCEDSTATUSCODES: false`)
- `REQUIRETLS` (RFC 8689) - Require TLS for delivery chain (opt-in via `hideREQUIRETLS: false`)

:::note
The `CHUNKING` extension (BDAT command) is **not** implemented.
:::

---

## License

[MIT](https://github.com/nodemailer/nodemailer/blob/master/LICENSE)
