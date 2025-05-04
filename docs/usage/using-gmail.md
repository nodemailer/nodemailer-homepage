---
title: Using Gmail
sidebar_position: 8
---

> **TL;DR**  For new projects, use **OAuth 2.0** (or an App Password if you already have Google 2‑Step Verification turned on). “Less Secure App” access was permanently disabled by Google on **May 30 2022**.

Gmail is still the quickest way to send a test email with Nodemailer, but it is _not_ the most resilient choice for production workloads. Gmail is designed for humans, not automated services, and its login heuristics are aggressive. When Google detects something that looks like account‑hijacking (for example, your production server running from a different country than your laptop) it will simply block the SMTP connection rather than deliver the mail.

Below we cover the three supported authentication methods, the Gmail sending limits, and some caveats that often trip developers up.

---

## 1. Choose an authentication method

| Method                     | When to use                                                                                                       | Status                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **OAuth 2.0**              | Recommended for all new integrations. Works with personal Gmail **and** Google Workspace.                         | ✅ Supported                  |
| **App Password**           | Works only if **2‑Step Verification** is enabled on the account. Simpler than OAuth 2.0 for small internal tools. | ✅ Supported                  |
| "Less Secure App" Password | Deprecated mechanism that allowed basic‐auth logins.                                                              | ❌ Disabled since May 30 2022 |

### OAuth 2.0 (recommended)

```js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: "me@gmail.com",
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
});
```

OAuth 2.0 avoids password handling altogether. You perform a one‑time consent flow, store the `refresh_token`, and Nodemailer silently refreshes access tokens when needed.

See the dedicated guide ➡️ [SMTP / OAuth 2.0](/smtp/oauth2/) for a step‑by‑step walkthrough.

### App Password (requires 2‑Step Verification)

If the Google account already has 2‑Step Verification, you can generate a 16‑character _App Password_ and use it like a normal SMTP password:

```js
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "me@gmail.com",
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});
```

_App Passwords_ bypass most of Google’s heuristics, but Google may still block traffic from unusual locations or IP ranges.

---

## 2. Gmail quirks to keep in mind

### Gmail rewrites the **From:** header

Gmail _always_ sets the authenticated account address as the sender. If you authenticate as `foo@example.com` and pass `bar@example.com` in the `from` field, Gmail will silently replace it with `foo@example.com`. Use _aliases_ or a Google Workspace _Send As_ address if you need a different visible sender.

### Daily sending limits

- **Personal Gmail**  Up to **500** recipients per rolling 24‑hour period.
- **Google Workspace**  Up to **2 000** recipients per rolling 24‑hour period.

A single e‑mail counts once per unique recipient, so a message with one _To:_ and one _Cc:_ address counts as **two**.

Exceeding these limits will result in SMTP error **454 4.7.0** _“Too many recipients”_ until the quota resets.

---

## 3. Production alternatives

For predictable delivery and higher volume you will want to move to a specialist SMTP provider (SendGrid, Postmark, Amazon SES, etc.). Most offer free tiers (\~200–300 e‑mails/day) similar to Gmail but without the login heuristics, sender‑address rewrite, or recipient caps.

---

## Troubleshooting checklist

1. **Check the Google Account ‘Security > Recent activity’ page** to see if Google is blocking the login attempt.
2. If using **OAuth 2.0**, verify that the `refresh_token` is still valid and that the OAuth consent screen is in “Production” status.
3. If using an **App Password**, confirm that 2‑Step Verification is still enabled and that the App Password has not been revoked.
4. Make sure the server’s clock is in sync (OAuth tokens are time‑sensitive).
5. Try sending from the same IP range manually (e.g. using `openssl s_client -connect smtp.gmail.com:465`) to reproduce the error.
