---
title: Using Gmail
sidebar_position: 8
---

> **TL;DR** For new projects, use **OAuth 2.0** (or an App Password if you already have Google 2-Step Verification enabled). Google permanently disabled "Less Secure App" access on **May 30, 2022**.

Gmail is often the quickest way to send a test email with Nodemailer, but it is _not_ recommended for production workloads. Gmail is designed for individual users, not automated services, and Google's security systems actively monitor for suspicious login activity. When Google detects behavior that resembles account hijacking (for example, your production server connecting from a different country than your usual location), it will block the SMTP connection without delivering the message.

This guide covers the supported authentication methods, Gmail's sending limits, and common issues developers encounter.

---

## 1. Choose an authentication method

| Method                     | When to use                                                                                                       | Status                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **OAuth 2.0**              | Recommended for all new integrations. Works with personal Gmail accounts **and** Google Workspace.                | Supported                      |
| **App Password**           | Works only when **2-Step Verification** is enabled on the account. Simpler than OAuth 2.0 for small internal tools. | Supported                      |
| "Less Secure App" Password | A deprecated mechanism that allowed basic authentication logins.                                                  | Disabled since May 30, 2022    |

### OAuth 2.0 (recommended)

OAuth 2.0 is the most secure and reliable method for authenticating with Gmail. Instead of storing passwords, you complete a one-time authorization flow and store a `refreshToken`. Nodemailer then automatically refreshes access tokens as needed.

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

For a complete walkthrough on setting up OAuth 2.0 credentials, including how to obtain your client ID, client secret, and refresh token, see the dedicated guide: [SMTP / OAuth 2.0](/smtp/oauth2/).

### App Password (requires 2-Step Verification)

If you have 2-Step Verification enabled on your Google account, you can generate a 16-character App Password specifically for Nodemailer. This password works like a regular SMTP password but is separate from your main Google account password.

To create an App Password:

1. Go to your [Google Account Security settings](https://myaccount.google.com/security)
2. Under "Signing in to Google," select **App Passwords** (you must have 2-Step Verification enabled to see this option)
3. Generate a new App Password for "Mail"
4. Copy the 16-character password and use it in your configuration

```js
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "me@gmail.com",
    pass: process.env.GOOGLE_APP_PASSWORD, // The 16-character App Password
  },
});
```

App Passwords bypass most of Google's additional security checks. However, Google may still block connections from unusual locations or suspicious IP address ranges.

---

## 2. Gmail quirks to keep in mind

### Gmail rewrites the From: header

Gmail _always_ overwrites the sender address with the authenticated account's email address. If you authenticate as `foo@example.com` but specify `bar@example.com` in the `from` field, Gmail will silently replace it with `foo@example.com`.

If you need to send from a different address, you have two options:

- Set up an **alias** in your Gmail settings
- Configure a **Send As** address in Google Workspace

### Daily sending limits

Gmail enforces strict limits on the number of recipients you can email within a 24-hour period:

- **Personal Gmail accounts:** Up to **500** recipients per rolling 24-hour period
- **Google Workspace accounts:** Up to **2,000** recipients per rolling 24-hour period

Each recipient counts individually, regardless of how many messages you send. For example, a single email with one To: address and one Cc: address counts as **2 recipients** toward your limit.

If you exceed these limits, Gmail returns SMTP error **454 4.7.0** ("Too many recipients"). You must wait for the quota to reset before sending more emails.

---

## 3. Production alternatives

For reliable email delivery at higher volumes, consider switching to a dedicated email service provider such as SendGrid, Postmark, Amazon SES, or Mailgun. These services are designed for automated sending and offer several advantages over Gmail:

- No aggressive login security that blocks legitimate server connections
- Higher sending limits (many offer free tiers of 100-300 emails per day)
- No automatic rewriting of sender addresses
- Better deliverability monitoring and analytics

---

## Troubleshooting checklist

If your emails are not being sent, work through these steps:

1. **Check Google's security alerts.** Visit the [Google Account "Security > Recent activity" page](https://myaccount.google.com/security) to see if Google blocked a login attempt from your server.

2. **Verify your OAuth 2.0 setup.** If using OAuth 2.0, confirm that:
   - Your `refreshToken` has not expired or been revoked
   - Your OAuth consent screen is set to "Production" status (not "Testing")
   - The Google Cloud project has not been deleted or suspended

3. **Confirm your App Password is valid.** If using an App Password:
   - Verify that 2-Step Verification is still enabled on the account
   - Check that the App Password has not been revoked
   - Try generating a new App Password if problems persist

4. **Synchronize your server clock.** OAuth tokens are time-sensitive. Ensure your server's system clock is accurate (consider using NTP for automatic synchronization).

5. **Test the SMTP connection manually.** Try connecting to Gmail's SMTP server directly to isolate whether the issue is with Nodemailer or the network/authentication:

   ```bash
   openssl s_client -connect smtp.gmail.com:465
   ```

   If this connection fails, the problem is likely with your network configuration or Google blocking your IP address.
