---
title: Custom authentication
sidebar_position: 6
description: Extend SMTP transport with custom authentication mechanisms like NTLM or CRAM-MD5.
---

Nodemailer's [SMTP transport](./index.md) supports common authentication mechanisms like LOGIN, PLAIN, CRAM-MD5, and [XOAUTH2](./oauth2) out of the box. However, some SMTP servers use proprietary or less common authentication methods that Nodemailer does not recognize. For these cases, you can create custom authentication handlers.

## When do I need a custom handler?

When connecting to an SMTP server, the server advertises which authentication methods it supports. For example, a server might respond with:

```
250-AUTH LOGIN PLAIN MY-CUSTOM-METHOD
```

In this response, the server lists three available authentication methods. Nodemailer already knows how to handle **LOGIN** and **PLAIN**, but it does not recognize **MY-CUSTOM-METHOD**. Without a custom handler, Nodemailer cannot authenticate using this method.

By providing a handler that matches the method name exactly, you enable Nodemailer to complete the authentication exchange.

Nodemailer only auto-selects from the methods it recognizes (PLAIN, LOGIN, CRAM-MD5, XOAUTH2) — a custom-named method advertised by the server is never picked automatically. To use a custom method you must set `auth.method` to your handler's name; this also works to replace a built-in mechanism with your own handler.

---

## Defining a handler

To create a custom authentication handler, add a `customAuth` object to your transporter options. Each key in this object is the authentication method name (case-insensitive, but uppercase is conventional), and each value is a function that performs the authentication exchange.

```javascript
const nodemailer = require("nodemailer");

// Define the custom authentication handler
async function myCustomMethod(ctx) {
  // Build and send the AUTH command with your custom data
  // This example sends a base64-encoded password (adapt to your server's requirements)
  const response = await ctx.sendCommand(
    "AUTH MY-CUSTOM-METHOD " + Buffer.from(ctx.auth.credentials.pass).toString("base64")
  );

  // Check if the server accepted the authentication
  // SMTP success codes are in the 2xx range (typically 235 for successful auth)
  if (response.status < 200 || response.status >= 300) {
    throw new Error("Authentication failed: " + response.text);
  }
}

const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 465,
  secure: true,
  auth: {
    type: "custom",                // any value other than "OAuth2" works; the handler is selected via "method" below
    method: "MY-CUSTOM-METHOD",    // specifies which handler to use
    user: "username",
    pass: "verysecret",
  },
  customAuth: {
    "MY-CUSTOM-METHOD": myCustomMethod,
  },
});
```

### Handler signature

```ts
(ctx: HandlerContext) => Promise<void> | void
```

Your handler function receives a context object (`ctx`) and can signal completion in two ways:

1. **Using Promises (recommended)**: Return a Promise that resolves on success or rejects with an error on failure. You can also use an async function, which implicitly returns a Promise.

2. **Using callbacks**: Call `ctx.resolve()` to indicate success, or `ctx.reject(err)` to indicate failure. This approach is useful when working with callback-based code.

### Context object properties

The context object (`ctx`) provides everything you need to complete the authentication:

#### `ctx.auth`

A normalized authentication object containing `type`, `user`, `credentials`, and `method`. Custom top-level properties of the `auth` object are **not** preserved — put extra values in `auth.options`, which is exposed as `ctx.auth.credentials.options` (see below).

#### `ctx.auth.credentials`

A convenient alias containing the authentication credentials:

| Property  | Description                                        |
| --------- | -------------------------------------------------- |
| `user`    | The username from `auth.user`                      |
| `pass`    | The password from `auth.pass`                      |
| `options` | Any additional options from `auth.options`         |

#### `ctx.method`

The authentication method name being used (the value of `auth.method`, normalized to upper case).

#### `ctx.extensions`

An array of SMTP extensions Nodemailer recognized in the server greeting. Possible values are `SMTPUTF8`, `DSN`, `8BITMIME`, `REQUIRETLS`, `PIPELINING`, and `SIZE`. This can be useful if your authentication method depends on certain server capabilities. Note that `STARTTLS` never appears here — it triggers a TLS upgrade instead of being recorded.

#### `ctx.authMethods`

An array of the authentication methods Nodemailer recognized in the server greeting — only `PLAIN`, `LOGIN`, `CRAM-MD5`, and [`XOAUTH2`](./oauth2) are detected. Custom method names advertised by the server will **not** appear here, so do not rely on this list to check for your custom method.

#### `ctx.maxAllowedSize`

The maximum message size the server accepts (in bytes), or `false` if the server did not advertise a limit.

### `ctx.sendCommand(command)`

Sends a raw SMTP command to the server and returns a Promise that resolves with the server's response. This is your primary tool for implementing the authentication protocol.

**Response object properties:**

| Property   | Example                               | Description                                 |
| ---------- | ------------------------------------- | ------------------------------------------- |
| `status`   | `235`                                 | SMTP status code as a number                |
| `code`     | `2.7.0`                               | Enhanced status code (if provided)          |
| `text`     | `Authentication successful`           | Human-readable message from the server      |
| `response` | `235 2.7.0 Authentication successful` | The complete response line from the server  |
| `command`  | `AUTH MY-CUSTOM-METHOD ...`           | The command that was sent                   |

**Callback style:**

If you prefer callbacks over Promises, `sendCommand` also accepts an optional callback:

```javascript
ctx.sendCommand(command, (err, response) => {
  if (err) {
    return ctx.reject(err);
  }
  // Process response...
  ctx.resolve();
});
```

### `ctx.resolve()` and `ctx.reject(err)`

These methods signal the outcome of authentication when not using Promises:

- **`ctx.resolve()`**: Call this when authentication succeeds.
- **`ctx.reject(err)`**: Call this with an Error object (or error message) when authentication fails.

When using async functions or returning Promises, you typically do not need these methods directly.

---

## Passing additional parameters

If your authentication method requires more than just a username and password, you can include an `options` object in the `auth` configuration. These values become available through `ctx.auth.credentials.options`.

```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 465,
  secure: true,
  auth: {
    type: "custom",
    method: "MY-CUSTOM-METHOD",
    user: "username",
    pass: "verysecret",
    options: {
      clientId: "my-client-id",
      applicationId: "my-app",
    },
  },
  customAuth: {
    "MY-CUSTOM-METHOD": async (ctx) => {
      // Access additional parameters through ctx.auth.credentials.options
      const { clientId, applicationId } = ctx.auth.credentials.options;

      // Generate a token using your custom logic
      const token = await generateSecretToken(clientId, applicationId);

      // Send the authentication command
      const response = await ctx.sendCommand("AUTH MY-CUSTOM-METHOD " + token);

      if (response.status < 200 || response.status >= 300) {
        throw new Error("Authentication failed: " + response.text);
      }
    },
  },
});
```

---

## Community-provided handlers

The following packages provide ready-to-use handlers for specific authentication methods:

| Mechanism | Package                                                                      | Notes                                      |
| --------- | ---------------------------------------------------------------------------- | ------------------------------------------ |
| NTLM      | [`nodemailer-ntlm-auth`](https://github.com/nodemailer/nodemailer-ntlm-auth) | Windows integrated authentication (NTLM)  |
| CRAM-MD5  | [`nodemailer-cram-md5`](https://github.com/nodemailer/nodemailer-cram-md5)   | Legacy — CRAM-MD5 is supported natively in current Nodemailer versions, so this package is no longer needed |
