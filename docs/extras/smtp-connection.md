---
title: SMTP Connection
sidebar_position: 2
description: Low-level SMTP client for establishing outbound connections to mail servers.
---

A low-level SMTP client for establishing outbound SMTP connections. This module is the foundation that powers Nodemailer's [SMTP transport](/smtp/) internally. Use it when you need direct, fine-grained control over the SMTP session lifecycle.

:::info
SMTPConnection is included with Nodemailer. No additional packages need to be installed.
:::

## Usage

### 1. Import the module

```javascript
const SMTPConnection = require("nodemailer/lib/smtp-connection");
```

### 2. Create a connection instance

```javascript
const connection = new SMTPConnection(options);
```

### 3. Connect to the server

```javascript
connection.connect(callback);
```

### 4. Authenticate (if required)

```javascript
connection.login(auth, callback);
```

### 5. Send a message

```javascript
connection.send(envelope, message, callback);
```

### 6. Close the connection

```javascript
connection.quit(); // or connection.close()
```

---

## Options reference

| Option                          | Type                | Default                | Description                                                                                      |
| ------------------------------- | ------------------- | ---------------------- | ------------------------------------------------------------------------------------------------ |
| **host**                        | `String`            | `'localhost'`          | The hostname or IP address of the SMTP server to connect to.                                     |
| **port**                        | `Number`            | `587` or `465`         | The port number to connect to. Defaults to 465 when `secure` is true, otherwise 587. If port 465 is specified, `secure` defaults to true. |
| **secure**                      | `Boolean`           | `false`                | If true, establishes a TLS connection immediately (implicit TLS). If false, the connection starts unencrypted but can be upgraded to TLS via STARTTLS. |
| **servername**                  | `String`            | hostname               | The TLS server name for SNI (Server Name Indication). Automatically set to `host` value unless `host` is an IP address. |
| **name**                        | `String`            | `os.hostname()`        | The hostname to identify as when sending EHLO/HELO commands. Falls back to `[127.0.0.1]` if the system hostname is not a valid FQDN. |
| **localAddress**                | `String`            | -                      | The local network interface to bind to for outgoing connections.                                 |
| **connectionTimeout**           | `Number`            | `120000`               | Maximum time in milliseconds to wait for the connection to be established (2 minutes).           |
| **greetingTimeout**             | `Number`            | `30000`                | Maximum time in milliseconds to wait for the server greeting after the connection is established (30 seconds). |
| **socketTimeout**               | `Number`            | `600000`               | Maximum time in milliseconds of inactivity before the connection is automatically closed (10 minutes). |
| **dnsTimeout**                  | `Number`            | `30000`                | Maximum time in milliseconds to wait for DNS resolution (30 seconds).                            |
| **logger**                      | `Boolean \| Object` | `false`                | Set to `true` to enable logging to the console, or provide a Bunyan-compatible logger instance for custom logging. |
| **debug**                       | `Boolean`           | `false`                | If true, logs all SMTP traffic (commands and responses) to the logger.                           |
| **lmtp**                        | `Boolean`           | `false`                | If true, uses the LMTP (Local Mail Transfer Protocol) protocol instead of SMTP.                  |
| **ignoreTLS**                   | `Boolean`           | `false`                | If true, does not attempt STARTTLS even if the server advertises support for it.                 |
| **requireTLS**                  | `Boolean`           | `false`                | If true, requires STARTTLS and fails if the upgrade is not successful.                           |
| **opportunisticTLS**            | `Boolean`           | `false`                | If true, attempts STARTTLS but continues with an unencrypted connection if the upgrade fails.    |
| **tls**                         | `Object`            | -                      | Additional options passed directly to Node.js `tls.connect()` and `tls.createSecureContext()`. Use this to configure certificates, ciphers, and other TLS settings. |
| **socket**                      | `net.Socket`        | -                      | A pre-created socket to use instead of creating a new one. The socket should not yet be connected. |
| **connection**                  | `net.Socket`        | -                      | An already-connected socket to use. Useful for connection pooling or [proxy](/smtp/proxies/) scenarios. |
| **secured**                     | `Boolean`           | `false`                | Set to true when providing a socket via the `connection` option that has already been upgraded to TLS. |
| **allowInternalNetworkInterfaces** | `Boolean`        | `false`                | If true, internal (loopback) network interfaces are also taken into account when detecting whether the machine supports IPv4/IPv6 for DNS resolution. Useful for localhost-only environments. |
| **customAuth**                  | `Object`            | -                      | Custom authentication handlers for non-standard authentication methods (see [Custom Authentication](/smtp/customauth/)). |
| **transactionLog**              | `Boolean`           | `false`                | Like `debug`, logs SMTP commands and responses to the logger, but without the message content.    |
| **component**                   | `String`            | `'smtp-connection'`    | The component name used in log entries.                                                           |

---

## Events

SMTPConnection extends Node.js EventEmitter and emits the following events:

| Event       | Arguments          | Description                                                              |
| ----------- | ------------------ | ------------------------------------------------------------------------ |
| **connect** | -                  | Emitted when the connection is established and the SMTP handshake completes successfully. |
| **error**   | `Error`            | Emitted when an error occurs during the connection or SMTP session.      |
| **end**     | -                  | Emitted when the connection has been closed.                             |

---

## Methods

### `connect(callback)`

Establishes a connection to the SMTP server. The callback is invoked once, with no arguments, when the connection is ready for commands (after the initial greeting and EHLO/HELO handshake). Connection failures (DNS, TCP, TLS, greeting errors) are **not** passed to this callback — they are emitted on the `'error'` event, so always attach an error listener.

```javascript
connection.on("error", (err) => {
  console.error("Connection failed:", err);
});

connection.connect(() => {
  console.log("Connected!");
});
```

### `login(auth, callback)`

Authenticates with the SMTP server. Only call this method if the server requires authentication. The `auth` object accepts the following properties:

- `user` - The username for authentication
- `pass` - The password for authentication
- `method` - The authentication method to use (optional). If not specified, XOAUTH2 is used when an `oauth2` provider is given; otherwise the first advertised method in the order PLAIN, LOGIN, CRAM-MD5, XOAUTH2 is selected (PLAIN is the fallback)
- `oauth2` - An [OAuth2](/smtp/oauth2/) token provider object for XOAUTH2 authentication

```javascript
connection.login(
  {
    user: "username",
    pass: "password",
  },
  (err) => {
    if (err) {
      console.error("Authentication failed:", err);
      return;
    }
    console.log("Authenticated!");
  }
);
```

### `send(envelope, message, callback)`

Sends an email message. The `envelope` defines the sender and recipient addresses for the SMTP transaction, while `message` contains the RFC 5322 formatted email content.

The `message` parameter can be a String, Buffer, or a readable Stream.

```javascript
const envelope = {
  from: "sender@example.com",
  to: ["recipient@example.com"],
};

const message = "From: sender@example.com\r\nTo: recipient@example.com\r\nSubject: Test\r\n\r\nHello!";

connection.send(envelope, message, (err, info) => {
  if (err) {
    console.error("Send failed:", err);
    return;
  }
  console.log("Message sent:", info);
});
```

The callback receives an `info` object with the following properties:

- `accepted` - Array of recipient addresses that were accepted by the server
- `rejected` - Array of recipient addresses that were rejected by the server
- `rejectedErrors` - Array of Error objects with details for each rejected recipient (only present if at least one recipient was rejected)
- `ehlo` - Array of extension lines from the server's EHLO response
- `response` - The final response string from the server
- `envelopeTime` - Time in milliseconds spent sending the envelope (MAIL FROM and RCPT TO commands)
- `messageTime` - Time in milliseconds spent sending the message data
- `messageSize` - Size of the sent message in bytes

### `reset(callback)`

Sends the SMTP RSET command to reset the current session state. Use this to abort a message transaction without closing the connection.

```javascript
connection.reset((err, success) => {
  if (err) {
    console.error("Reset failed:", err);
    return;
  }
  console.log("Session reset");
});
```

### `quit()`

Sends the SMTP QUIT command and gracefully closes the connection. The server is notified that the session is ending.

```javascript
connection.quit();
```

### `close()`

Closes the connection immediately without sending the QUIT command. Use this for forced disconnection scenarios.

```javascript
connection.close();
```

---

## Envelope options

The envelope object defines the SMTP transaction parameters and supports the following properties:

| Property       | Type       | Description                                                      |
| -------------- | ---------- | ---------------------------------------------------------------- |
| **from**       | `String`   | The sender address used in the MAIL FROM command.                |
| **to**         | `String[]` | An array of recipient addresses used in RCPT TO commands.        |
| **size**       | `Number`   | The message size in bytes. Used with the SIZE extension to check if the server accepts the message before sending. |
| **use8BitMime**| `Boolean`  | If true, requests 8BITMIME encoding when the server supports it. |
| **dsn**        | `Object`   | Delivery Status Notification options (see below).                |
| **requireTLSExtensionEnabled** | `Boolean` | If true, appends the `REQUIRETLS` parameter (RFC 8689) to MAIL FROM. Fails with an `EREQUIRETLS` error if the connection is not secured or the server does not advertise REQUIRETLS. |

### DSN options

Delivery Status Notifications allow you to receive reports about the delivery status of your message. The DSN object supports these properties:

```javascript
const envelope = {
  from: "sender@example.com",
  to: ["recipient@example.com"],
  dsn: {
    ret: "HDRS", // What to return in DSN: 'HDRS' for headers only, 'FULL' for the complete message
    envid: "unique-id-123", // A unique envelope identifier for tracking
    notify: "SUCCESS,FAILURE", // When to send DSN: 'NEVER', 'SUCCESS', 'FAILURE', 'DELAY' (comma-separated)
    orcpt: "rfc822;original@example.com", // The original recipient address (format: address-type;address)
  },
};
```

---

## Complete example

This example demonstrates the full workflow: connecting, authenticating, sending a message, and closing the connection.

```javascript
const SMTPConnection = require("nodemailer/lib/smtp-connection");

const connection = new SMTPConnection({
  host: "smtp.example.com",
  port: 587,
  secure: false,
  debug: true,
  logger: true,
});

connection.on("error", (err) => {
  // Connection failures (DNS, TCP, TLS, greeting) arrive here
  console.error("Connection error:", err);
});

connection.connect(() => {
  connection.login(
    {
      user: "username",
      pass: "password",
    },
    (err) => {
      if (err) {
        console.error("Authentication failed:", err);
        connection.close();
        return;
      }

      const envelope = {
        from: "sender@example.com",
        to: ["recipient@example.com"],
      };

      const message = `From: sender@example.com
To: recipient@example.com
Subject: Test Message
Content-Type: text/plain; charset=utf-8

Hello from SMTPConnection!`;

      connection.send(envelope, message, (err, info) => {
        if (err) {
          console.error("Failed to send:", err);
        } else {
          console.log("Message sent!");
          console.log("Accepted:", info.accepted);
          console.log("Rejected:", info.rejected);
          console.log("Response:", info.response);
        }

        connection.quit();
      });
    }
  );
});
```

---

## Properties

After connecting, you can access the following properties on the connection instance:

| Property           | Type       | Description                                          |
| ------------------ | ---------- | ---------------------------------------------------- |
| **id**             | `String`   | A unique identifier for this connection instance.    |
| **secure**         | `Boolean`  | True if the connection is using TLS encryption.      |
| **authenticated**  | `Boolean`  | True if the user has successfully authenticated.     |
| **lastServerResponse** | `String` | The most recent response received from the server. |
| **allowsAuth**     | `Boolean`  | True if the server advertises authentication support in its EHLO response. |

---

## Supported authentication methods

SMTPConnection supports the following authentication methods:

- `PLAIN` - Sends credentials in base64 encoding
- `LOGIN` - Legacy method that sends username and password separately
- `CRAM-MD5` - Challenge-response authentication using MD5 hashing
- `XOAUTH2` - [OAuth 2.0](/smtp/oauth2/) authentication for services like Gmail
- Custom methods via the `customAuth` option

If no method is specified, XOAUTH2 is used when an `oauth2` provider is given; otherwise the client selects the first method advertised by the server in the order PLAIN, LOGIN, CRAM-MD5, XOAUTH2 (PLAIN is the fallback).

---

## License

[MIT-0](https://github.com/nodemailer/nodemailer/blob/master/LICENSE)
