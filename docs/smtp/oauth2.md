---
title: OAuth2
sidebar_position: 23
---

OAuth2 allows your application to authenticate with email servers using short-lived access tokens instead of storing passwords. This approach is more secure because tokens are scoped to specific permissions, can be revoked at any time, and can be regenerated if compromised. If a token is leaked, the potential damage is limited and contained, unlike a leaked password which could grant broader access.

1. [Provider-agnostic OAuth2 authentication](#oauth-token)
2. [Gmail-specific helpers](#oauth-gmail)

:::tip

Managing OAuth2 credentials can be complex and error-prone. Consider using **EmailEngine** to handle credential management for you. Once you register an account with EmailEngine, you can configure Nodemailer to send through EmailEngine without any authentication configuration. Learn more [here](https://emailengine.app/sending-emails?utm_source=nodemailer&utm_campaign=nodemailer&utm_medium=tip-link).

:::

### Provider-agnostic OAuth2 authentication {#oauth-token}

Use this method when your SMTP server accepts a standard username and access token pair for authentication. This is the simplest OAuth2 approach because you provide a pre-generated token directly to Nodemailer without involving client secrets or refresh tokens.

- **auth** - authentication object

  - **type** - must be set to `'OAuth2'`
  - **user** - the email address to authenticate as (required)
  - **accessToken** - a valid OAuth2 access token (required)
  - **expires** - UNIX timestamp (in milliseconds) indicating when the access token expires (optional)

> **Token scopes**
> Different email providers require different OAuth scopes to allow SMTP access:
>
> - **Gmail** - your token must include the `https://mail.google.com/` scope
> - **Outlook** - your token must include the `https://outlook.office.com/SMTP.Send` scope

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

When using a non-pooled transport (the default), you can override the authentication credentials on a per-message basis. This means you can create a single transporter and pass different tokens in the `sendMail` options for each message you send.

:::

### Gmail-specific helpers {#oauth-gmail}

Nodemailer includes built-in helpers that automate OAuth2 token management specifically for Gmail. These helpers can automatically refresh expired tokens, generate new tokens using service accounts, or integrate with your custom token provider.

#### 3-legged OAuth2 authentication {#oauth-3lo}

In 3-legged OAuth2 (also known as "3LO"), your application requests permission from a user through an interactive consent flow. After the user grants permission, your application receives a _refresh token_. Nodemailer stores this refresh token and uses it to automatically generate new access tokens whenever the current token expires, so you do not need to handle token refresh logic yourself.

- **auth** - authentication object

  - **type** - must be set to `'OAuth2'`
  - **user** - the email address to send from (required)
  - **clientId** - your OAuth2 client ID from Google Cloud Console (required)
  - **clientSecret** - your OAuth2 client secret from Google Cloud Console (required)
  - **refreshToken** - the refresh token obtained during the user consent flow (required)
  - **accessToken** - a current access token (optional; Nodemailer will automatically generate one if not provided or if it has expired)
  - **expires** - UNIX timestamp (in milliseconds) indicating when the access token expires (optional)
  - **accessUrl** - a custom token endpoint URL (optional; defaults to the Gmail token endpoint)
  - **timeout** - access token lifetime in seconds (optional; use this as an alternative to _expires_ when you know the token lifetime but not the exact expiration timestamp)
  - **customHeaders** - additional HTTP headers to include in token refresh requests (optional)
  - **customParams** - additional parameters to include in token refresh requests (optional)

#### 2LO authentication (service accounts) {#oauth-2lo}

2-legged OAuth2 (also known as "2LO") uses a Google service account to impersonate a user without requiring interactive consent. This is ideal for server-to-server communication or automated systems where no user interaction is possible. The service account must have domain-wide delegation enabled in Google Workspace to impersonate users.

- **auth** - authentication object

  - **type** - must be set to `'OAuth2'`
  - **user** - the email address to impersonate and send as (required)
  - **serviceClient** - the service account's `client_id` value from the service account JSON key file (required)
  - **privateKey** - the service account's private key in PEM format from the service account JSON key file (required)
  - **scope** - the OAuth scope to request (optional; defaults to `'https://mail.google.com/'`)
  - **serviceRequestTimeout** - how long the generated token should be valid, in seconds (optional; defaults to 300 seconds, maximum 3600 seconds)

#### Using custom token handling {#custom-handling}

If you have your own token management system, you can register a callback function that Nodemailer will call whenever it needs an access token. This gives you complete control over how tokens are obtained and managed.

Register the callback using `transporter.set('oauth2_provision_cb', callback)`. Your callback receives three arguments:

- `user` - the email address that needs a token
- `renew` - a boolean indicating whether the previous token failed and a fresh token is needed
- `cb` - the callback function to call with the result: `cb(error, accessToken, expires)`

```js
transporter.set("oauth2_provision_cb", (user, renew, cb) => {
  const token = userTokens[user];
  if (!token) return cb(new Error("Unknown user"));
  cb(null, token);
});
```

#### Token update notifications {#update-notification}

When Nodemailer generates a new access token (either through a refresh token or a service account), it emits a `token` event. You can listen for this event to persist the new token for future use, which can reduce the number of token refresh requests.

```js
transporter.on("token", (t) => {
  console.log("User:", t.user);
  console.log("New access token:", t.accessToken);
  console.log("Expires at:", new Date(t.expires));
});
```

#### Examples {#examples}

1. **Authenticate with an existing token**

Use this approach when you already have a valid access token and simply want to authenticate with it.

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

2. **Custom handler** - token returned by your own service

Use this approach when you have a separate token management service or database that provides tokens on demand.

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

3. **Full 3-legged setup** - Nodemailer refreshes tokens automatically

Use this approach when you have obtained OAuth2 credentials from Google Cloud Console and a refresh token from the user consent flow. Nodemailer will automatically refresh the access token when it expires.

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

4. **Service account** - token re-generated via 2LO

Use this approach for server-to-server authentication without user interaction. The service account impersonates the specified user and generates tokens automatically.

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

5. **Per-message auth** - single transport, many users

Use this approach when you need to send emails on behalf of multiple users through a single transporter. You define the client credentials once in the transporter configuration, then provide user-specific tokens with each message.

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

Per-message authentication only works with non-pooled transports. If you are using a pooled transport (created with `pool: true`), you cannot override authentication on a per-message basis.

:::

---

#### Troubleshooting {#troubleshooting}

- **"Invalid grant" or authentication errors with Gmail**: Make sure your access token was requested with the `https://mail.google.com/` scope. Tokens with other scopes will not work for SMTP access.
- **"Access Not Configured" errors**: Verify that the Gmail API is enabled for your project in the Google Cloud Console under APIs & Services.
- **Tokens expiring quickly**: Access tokens typically expire after one hour. If you are using a refresh token, Nodemailer will handle renewal automatically. If you are providing tokens directly, make sure to refresh them before they expire.
