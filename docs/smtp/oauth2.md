---
title: OAuth2
sidebar_position: 23
---

OAuth2 lets your application use short‑lived access tokens instead of passwords. Tokens are scoped, revocable, and regenerable, so a leaked token causes far less harm than a leaked password.

1. [Provider‑agnostic OAuth2 authentication](#oauth-token)
2. [Gmail‑specific helpers](#oauth-gmail)

:::tip

Managing OAuth2 app credentials is painful. Let **EmailEngine** handle them for you. Once an account is registered with EmailEngine, you can point Nodemailer to EmailEngine and skip all authentication completely. Read more [here](https://emailengine.app/sending-emails?utm_source=nodemailer&utm_campaign=nodemailer&utm_medium=tip-link).

:::

### Provider‑agnostic OAuth2 authentication {#oauth-token}

Use this method when the SMTP server accepts a plain username + access token pair. No client secrets or refresh tokens are involved.

- **auth** – authentication object

  - **type** – `'OAuth2'`
  - **user** – e‑mail address (required)
  - **accessToken** – access token (required)
  - **expires** – UNIX timestamp when _accessToken_ expires (optional)

> **Token scopes**
> • Gmail – request the token with the `https://mail.google.com/` scope
> • Outlook – request the token with the `https://outlook.office.com/SMTP.Send` scope

```js
let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    type: "OAuth2",
    user: "user@example.com",
    accessToken: "ya29.Xx_XX0xxxxx-xX0X0XxXXxXxXXXxX0x",
  },
});
```

:::tip

Normal (non‑pooled) transports can override _auth_ per‑message. Create the transport once and pass different tokens in _sendMail_ options as needed.

:::

### Gmail‑specific helpers {#oauth-gmail}

The sections below cover Gmail‑only flows that Nodemailer can automate for you.

#### 3‑legged OAuth2 authentication {#oauth-3lo}

Your app requests consent from the user and receives a _refreshToken_. Nodemailer uses this token to generate fresh *accessToken*s when needed.

- **auth** – authentication object

  - **type** – `'OAuth2'`
  - **user** – e‑mail address (required)
  - **clientId** – OAuth2 client ID (required)
  - **clientSecret** – OAuth2 client secret (required)
  - **refreshToken** – refresh token (required)
  - **accessToken** – access token (optional; Nodemailer auto‑refreshes if missing or expired)
  - **expires** – UNIX expiration timestamp for _accessToken_ (optional)
  - **accessUrl** – custom token endpoint (optional; defaults to Gmail)
  - **timeout** – TTL for the access token in seconds (optional; alternative to _expires_)
  - **customHeaders** – custom HTTP headers for token requests (optional)
  - **customParams** – custom parameters for token requests (optional)

#### 2LO authentication (service accounts) {#oauth-2lo}

Use a Google service account to impersonate a user. No interactive consent is required.

- **auth** – authentication object

  - **type** – `'OAuth2'`
  - **user** – e‑mail address to send as (required)
  - **serviceClient** – service account _client_id_ (required)
  - **privateKey** – service account private key (required)
  - **scope** – OAuth scope (optional; defaults to `'https://mail.google.com/'`)
  - **serviceRequestTimeout** – timeout for service account requests in seconds (optional; defaults to 300, max 3600)

#### Using custom token handling {#custom-handling}

Register an `oauth2_provision_cb` callback that returns a token whenever Nodemailer needs one.

```js
transporter.set("oauth2_provision_cb", (user, renew, cb) => {
  const token = userTokens[user];
  if (!token) return cb(new Error("Unknown user"));
  cb(null, token);
});
```

#### Token update notifications {#update-notification}

Listen for the `token` event to persist newly generated tokens.

```js
transporter.on("token", (t) => {
  console.log("User:", t.user);
  console.log("New access token:", t.accessToken);
  console.log("Expires at:", new Date(t.expires));
});
```

#### Examples {#examples}

1. **Authenticate with an existing token**

```js
let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    type: "OAuth2",
    user: "user@example.com",
    accessToken: "ya29.Xx_XX0xxxxx-xX0X0XxXXxXxXXXxX0x",
  },
});
```

2. **Custom handler** – token returned by your own service

```js
let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { type: "OAuth2", user: "user@example.com" },
});

transporter.set("oauth2_provision_cb", (user, renew, cb) => {
  cb(null, userTokens[user]);
});
```

3. **Full 3‑legged setup** – Nodemailer refreshes tokens automatically

```js
let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    type: "OAuth2",
    user: "user@example.com",
    clientId: "000000000000-xxx.apps.googleusercontent.com",
    clientSecret: "XxxxxXXxX0xxxxxxxx0XXxX0",
    refreshToken: "1/XXxXxsss-xxxXXXXXxXxx0XXXxxXXx0x00xxx",
    accessToken: "ya29.Xx_XX0xxxxx-xX0X0XxXXxXxXXXxX0x",
    expires: 1484314697598,
  },
});
```

4. **Service account** – token re‑generated via 2LO

```js
let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    type: "OAuth2",
    user: "user@example.com",
    serviceClient: "113600000000000000000",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...",
    accessToken: "ya29.Xx_XX0xxxxx-xX0X0XxXXxXxXXXxX0x",
    expires: 1484314697598,
  },
});
```

5. **Per‑message auth** – single transport, many users

```js
let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    type: "OAuth2",
    clientId: "000000000000-xxx.apps.googleusercontent.com",
    clientSecret: "XxxxxXXxX0xxxxxxxx0XXxX0",
  },
});

transporter.sendMail({
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Message",
  text: "I hope this message gets through!",
  auth: {
    user: "user@example.com",
    refreshToken: "1/XXxXxsss-xxxXXXXXxXxx0XXXxxXXx0x00xxx",
    accessToken: "ya29.Xx_XX0xxxxx-xX0X0XxXXxXxXXXxX0x",
    expires: 1484314697598,
  },
});
```

:::info

Per‑message auth does not work with pooled transports.

:::

---

#### Troubleshooting {#troubleshooting}

- Gmail SMTP requires the `https://mail.google.com/` scope – ensure your token has it.
- Gmail API access must be enabled for your Client ID in Google API Manager.
