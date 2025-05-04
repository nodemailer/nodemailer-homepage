---
title: Proxy support
sidebar_position: 25
description: Use HTTP, SOCKS or custom proxy handlers with Nodemailer SMTP transports.
---

Nodemailer can connect to an SMTP server **through an outbound proxy**. Out of the box it understands **HTTP CONNECT** proxies. For **SOCKS4/4a/5** and any other schemes you can either:

1. Install the community‑maintained [`socks`](https://www.npmjs.com/package/socks) package and let Nodemailer do the rest.
2. Provide your own proxy handler function.

## Quick start

```javascript
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 465,
  secure: true,
  proxy: "http://proxy.example.test:3128", // ← HTTP proxy URL
});
```

Set the `proxy` option to a valid URL string. Nodemailer parses the URL and decides how to tunnel the connection.

## HTTP CONNECT proxies

HTTP proxies are fully supported **without additional dependencies**. Just pass their URL in the `proxy` option:

```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 465,
  secure: true,
  proxy: process.env.HTTP_PROXY, // or HTTPS_PROXY
});
```

## SOCKS proxies

Support for SOCKS4, SOCKS4a and SOCKS5 is **not bundled** to keep Nodemailer lean. Install the `socks` package in your project and register it with the transporter:

```bash
npm install socks --save
```

```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 465,
  secure: true,
  proxy: "socks5://127.0.0.1:1080",
});

transporter.set("proxy_socks_module", require("socks"));
```

### Supported URL protocols

| Protocol   | Proxy type |
| ---------- | ---------- |
| `socks4:`  | SOCKS4     |
| `socks4a:` | SOCKS4a    |
| `socks5:`  | SOCKS5     |
| `socks:`   | SOCKS5     |

### Local testing with SSH

Create an ad‑hoc SOCKS5 proxy that forwards all traffic through an SSH server:

```bash
ssh -N -D 0.0.0.0:1080 user@remote.host
```

Then set `proxy: "socks5://localhost:1080"`.

## Custom proxy handlers

Need a special authentication flow or a corporate proxy that speaks a proprietary protocol? Provide your own socket‑creation logic:

```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 465,
  secure: true,
  proxy: "myproxy://127.0.0.1:9999",
});

// Register a handler for the "myproxy:" URL scheme
transporter.set("proxy_handler_myproxy", (proxy, options, done) => {
  const net = require("net");

  console.log(`Proxy host=%s port=%s`, proxy.hostname, proxy.port);

  const socket = net.connect(proxy.port, proxy.hostname, () => {
    // ...hand‑shake with your proxy here...

    // Return the socket to Nodemailer
    done(null, { connection: socket });
  });
});
```

If the proxy socket is **already encrypted** (e.g. you connected with `tls.connect()`), set `secured: true` so Nodemailer skips its own STARTTLS upgrade:

```javascript
const tls = require("tls");

transporter.set("proxy_handler_myproxys", (proxy, options, done) => {
  const socket = tls.connect(proxy.port, proxy.hostname, () => {
    done(null, { connection: socket, secured: true });
  });
});
```
