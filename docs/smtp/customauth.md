---
title: Custom authentication
sidebar_position: 24
---

Nodemailer's SMTP transport supports common authentication mechanisms like LOGIN, PLAIN, and XOAUTH2 out of the box. However, some SMTP servers use proprietary or less common authentication methods that Nodemailer does not recognize. For these cases, you can create custom authentication handlers.

## When do I need a custom handler?

When connecting to an SMTP server, the server advertises which authentication methods it supports. For example, a server might respond with:

```
250-AUTH LOGIN PLAIN MY-CUSTOM-METHOD
```

In this response, the server lists three available authentication methods. Nodemailer already knows how to handle **LOGIN** and **PLAIN**, but it does not recognize **MY-CUSTOM-METHOD**. Without a custom handler, Nodemailer cannot authenticate using this method.

By providing a handler that matches the method name exactly, you enable Nodemailer to complete the authentication exchange.

If a server supports multiple authentication methods, Nodemailer will choose one automatically. To override this behavior and force Nodemailer to use your custom method, set `auth.method` to match your handler's name.

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
    type: "custom",                // tells Nodemailer to use a custom handler
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

The complete `auth` object you passed to `createTransport()`. This includes any custom properties you added.

#### `ctx.auth.credentials`

A convenient alias containing the authentication credentials:

| Property  | Description                                        |
| --------- | -------------------------------------------------- |
| `user`    | The username from `auth.user`                      |
| `pass`    | The password from `auth.pass`                      |
| `options` | Any additional options from `auth.options`         |

#### `ctx.method`

The authentication method name being used (the same value as `auth.method`).

#### `ctx.extensions`

An array of SMTP extensions supported by the server (such as `SIZE`, `STARTTLS`, `PIPELINING`). This can be useful if your authentication method depends on certain server capabilities.

#### `ctx.authMethods`

An array of authentication methods the server advertised (such as `LOGIN`, `PLAIN`, `XOAUTH2`). You can check this to verify your expected method is available before attempting authentication.

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
| CRAM-MD5  | [`nodemailer-cram-md5`](https://github.com/nodemailer/nodemailer-cram-md5)   | Challenge-response authentication          |
