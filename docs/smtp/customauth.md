---
title: Custom authentication
sidebar_position: 24
---

Nodemailer’s SMTP transport can be extended with _custom authentication mechanisms_ that are not supported out of the box.

## When do I need a custom handler?

If the server advertises an authentication keyword that Nodemailer does not recognise, you need to teach Nodemailer how to complete the exchange. For example, when the server replies with:

```
250‑AUTH LOGIN PLAIN MY‑CUSTOM‑METHOD
```

Nodemailer already understands **LOGIN** and **PLAIN**, but has no idea what **MY‑CUSTOM‑METHOD** is. By providing a handler named exactly after that keyword you enable Nodemailer to use it.

If several mechanisms are available you can _force_ Nodemailer to use yours by setting `auth.method` to the same identifier.

---

## Defining a handler

Add a `customAuth` map to the transporter options. Each key is the mechanism name and each value is a function that performs the exchange.

```javascript
const nodemailer = require("nodemailer");

async function myCustomMethod(ctx) {
  // Build and send a single AUTH command (dummy example – adapt to your spec)
  const response = await ctx.sendCommand("AUTH MY-CUSTOM-METHOD " + Buffer.from(ctx.auth.credentials.pass).toString("base64"));

  // Check server reply
  if (response.status < 200 || response.status >= 300) {
    throw new Error("Authentication failed: " + response.text);
  }
}

const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 465,
  secure: true,
  auth: {
    type: "custom", // tells Nodemailer we are using a custom handler
    method: "MY-CUSTOM-METHOD", // forces this exact mechanism
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

You get a **context object** (`ctx`) and you either:

- return a Promise that resolves on success or rejects on error, **or**
- call `ctx.resolve()` / `ctx.reject(err)` manually.

### `ctx.auth`

- `ctx.auth` – the full `auth` object you passed to `createTransport()`
- `ctx.auth.credentials` – convenient alias for `{ user, pass, options }`

### `ctx.sendCommand(command)`

Sends a raw SMTP command and returns a Promise with the parsed reply:

| Property   | Example                               | Description                      |
| ---------- | ------------------------------------- | -------------------------------- |
| `status`   | `235`                                 | SMTP status code                 |
| `code`     | `2.7.0`                               | Enhanced status code             |
| `text`     | _Authentication successful_           | Human‑readable part              |
| `response` | `235 2.7.0 Authentication successful` | Full line returned by the server |

A callback style is also supported: `ctx.sendCommand(cmd, (err, info) => { … })`.

---

## Passing additional parameters

Need more than _user_ and _pass_? Add an `options` object – it will be available via `ctx.auth.credentials.options`.

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
      clientId: "verysecret",
      applicationId: "my-app",
    },
  },
  customAuth: {
    "MY-CUSTOM-METHOD": async (ctx) => {
      const token = await generateSecretTokenSomehow(ctx.auth.credentials.options.clientId, ctx.auth.credentials.options.applicationId);
      await ctx.sendCommand("AUTH MY-CUSTOM-METHOD " + token);
    },
  },
});
```

---

## Community‑provided handlers

| Mechanism | Package                                                                      | Notes                   |
| --------- | ---------------------------------------------------------------------------- | ----------------------- |
| NTLM      | [`nodemailer‑ntlm‑auth`](https://github.com/nodemailer/nodemailer-ntlm-auth) | Windows integrated auth |
| CRAM‑MD5  | [`nodemailer‑cram‑md5`](https://github.com/nodemailer/nodemailer-cram-md5)   | Challenge‑response      |
