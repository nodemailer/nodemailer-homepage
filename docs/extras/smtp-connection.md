---
title: SMTP Connection
sidebar_position: 2
---

Low-level SMTP client for establishing outbound SMTP connections. This is the building block used internally by Nodemailer's SMTP transport. Use it when you need fine-grained control over the SMTP session.

:::info
SMTPConnection is shipped with Nodemailer - you do **not** have to install anything else.
:::

## Usage

### 1. Require in your code

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
| **host**                        | `String`            | `'localhost'`          | Hostname or IP address to connect to.                                                            |
| **port**                        | `Number`            | `587` or `465`         | Port to connect to. Defaults to 465 if `secure` is true, otherwise 587.                          |
| **secure**                      | `Boolean`           | `false`                | Use TLS when connecting. If false, TLS may still be upgraded via STARTTLS.                       |
| **servername**                  | `String`            | hostname               | TLS servername for SNI. Defaults to `host` if host is not an IP address.                         |
| **name**                        | `String`            | `os.hostname()`        | Hostname to identify as in EHLO/HELO.                                                            |
| **localAddress**                | `String`            | -                      | Local interface to bind to for network connections.                                              |
| **connectionTimeout**           | `Number`            | `120000`               | How many milliseconds to wait for the connection to establish.                                   |
| **greetingTimeout**             | `Number`            | `30000`                | How many milliseconds to wait for the greeting after connection is established.                  |
| **socketTimeout**               | `Number`            | `600000`               | How many milliseconds of inactivity to allow before closing the connection.                      |
| **dnsTimeout**                  | `Number`            | `30000`                | How many milliseconds to wait for DNS requests.                                                  |
| **logger**                      | `Boolean \| Object` | `false`                | `true` to log to console, or pass a Bunyan-compatible logger instance.                           |
| **debug**                       | `Boolean`           | `false`                | If true, pass SMTP traffic to the logger.                                                        |
| **lmtp**                        | `Boolean`           | `false`                | Use LMTP protocol instead of SMTP.                                                               |
| **ignoreTLS**                   | `Boolean`           | `false`                | Ignore server support for STARTTLS.                                                              |
| **requireTLS**                  | `Boolean`           | `false`                | Forces the client to use STARTTLS even if the server does not advertise it.                      |
| **opportunisticTLS**            | `Boolean`           | `false`                | Try STARTTLS but continue unencrypted if it fails.                                               |
| **tls**                         | `Object`            | -                      | Options passed to `tls.connect()` and `tls.createSecureContext()`.                               |
| **socket**                      | `net.Socket`        | -                      | Existing socket to use instead of creating a new one.                                            |
| **connection**                  | `net.Socket`        | -                      | Existing already-connected socket to use.                                                        |
| **secured**                     | `Boolean`           | `false`                | If true, indicates the provided socket is already TLS-upgraded.                                  |
| **allowInternalNetworkInterfaces** | `Boolean`        | `false`                | Allow connections to internal network interfaces.                                                |
| **customAuth**                  | `Object`            | -                      | Custom authentication handlers (see [Custom Authentication](/smtp/customauth)).                  |

---

## Events

SMTPConnection extends EventEmitter and emits the following events:

| Event       | Arguments          | Description                                       |
| ----------- | ------------------ | ------------------------------------------------- |
| **connect** | -                  | Connection established and ready for commands.    |
| **error**   | `Error`            | An error occurred.                                |
| **end**     | -                  | Connection has been closed.                       |

---

## Methods

### `connect(callback)`

Establishes connection to the SMTP server.

```javascript
connection.connect((err) => {
  if (err) {
    console.error("Connection failed:", err);
    return;
  }
  console.log("Connected!");
});
```

### `login(auth, callback)`

Authenticates with the server. The `auth` object can contain:

- `user` - Username
- `pass` - Password
- `method` - Authentication method (optional, auto-detected if not set)
- `oauth2` - OAuth2 token provider for XOAUTH2 authentication

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

Sends a message. The envelope defines `from` and `to` addresses, while message is the RFC 822 formatted email.

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

The callback receives an `info` object with:

- `accepted` - Array of accepted recipient addresses
- `rejected` - Array of rejected recipient addresses
- `rejectedErrors` - Array of Error objects for rejected recipients
- `response` - The final response from the server
- `envelopeTime` - Time in ms to send the envelope
- `messageTime` - Time in ms to send the message data
- `messageSize` - Size of the sent message in bytes

### `reset(callback)`

Sends RSET command to reset the current session.

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

Sends QUIT command and closes the connection gracefully.

```javascript
connection.quit();
```

### `close()`

Closes the connection immediately without sending QUIT.

```javascript
connection.close();
```

---

## Envelope options

The envelope object supports the following properties:

| Property       | Type       | Description                                                      |
| -------------- | ---------- | ---------------------------------------------------------------- |
| **from**       | `String`   | Sender address for MAIL FROM command.                            |
| **to**         | `String[]` | Array of recipient addresses for RCPT TO commands.               |
| **size**       | `Number`   | Message size in bytes (used with SIZE extension).                |
| **use8BitMime**| `Boolean`  | Request 8BITMIME encoding.                                       |
| **dsn**        | `Object`   | Delivery Status Notification options (see below).                |

### DSN options

```javascript
const envelope = {
  from: "sender@example.com",
  to: ["recipient@example.com"],
  dsn: {
    ret: "HDRS", // Return headers only in DSN (or 'FULL' for full message)
    envid: "unique-id-123", // Envelope identifier
    notify: "SUCCESS,FAILURE", // When to send DSN
    orcpt: "rfc822;original@example.com", // Original recipient
  },
};
```

---

## Complete example

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
  console.error("Connection error:", err);
});

connection.connect((err) => {
  if (err) {
    console.error("Failed to connect:", err);
    return;
  }

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

After connecting, the following properties are available:

| Property           | Type       | Description                                          |
| ------------------ | ---------- | ---------------------------------------------------- |
| **id**             | `String`   | Unique connection identifier.                        |
| **secure**         | `Boolean`  | Whether the connection is using TLS.                 |
| **authenticated**  | `Boolean`  | Whether the user is authenticated.                   |
| **lastServerResponse** | `String` | The last response received from the server.        |
| **allowsAuth**     | `Boolean`  | Whether the server supports authentication.          |

---

## Supported authentication methods

- `PLAIN`
- `LOGIN`
- `CRAM-MD5`
- `XOAUTH2`
- Custom methods via `customAuth` option

---

## License

[MIT](https://github.com/nodemailer/nodemailer/blob/master/LICENSE)
