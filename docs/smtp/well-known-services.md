---
title: Well-Known Services
sidebar_position: 1
description: Built-in connection presets for popular SMTP providers such as Gmail, SendGrid, and AWS SES.
---

Nodemailer includes built-in connection presets for many popular email providers. Instead of manually looking up each provider's SMTP server hostname, port number, and security settings, you can specify a **`service`** name when creating a transport. Nodemailer automatically configures all the connection details for you.

<Tabs groupId="module-system">
<TabItem value="cjs" label="CommonJS">

```js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail", // Use any Service ID from the table below (matching is case-insensitive)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
```

</TabItem>
<TabItem value="esm" label="ESM">

```js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail", // Use any Service ID from the table below (matching is case-insensitive)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
```

</TabItem>
</Tabs>

The `service` option is a shortcut. You can always specify `host`, `port`, `secure`, and other connection options manually if you prefer. If your provider is not listed or if connection settings have changed, you have two options: submit a pull request to update the [services.json](https://github.com/nodemailer/nodemailer/blob/master/src/well-known/services.json) file, or bypass the presets entirely and configure the connection details yourself.

Matching is case-insensitive and ignores spaces and other special characters. Provider aliases (for example `"Google Mail"`, `"Outlook"`), known provider domains, and even full email addresses (for example `"user@googlemail.com"`) also resolve to a preset.

:::info
Most major email providers now require [OAuth 2.0 authentication](./oauth2) or app-specific passwords for security. The service presets only configure connection settings (and, for a few providers, the preferred SMTP AUTH mechanism). You are still responsible for setting up the correct authentication method for your provider. For Gmail-specific setup instructions, see [Using Gmail](/guides/using-gmail).
:::

:::tip AWS SES Users
While the SES service presets below use SMTP credentials, Nodemailer also offers a dedicated [SES transport](/transports/ses) that integrates directly with the AWS SDK. The SES transport can be simpler to configure if you are already using AWS credentials in your application.
:::

## List of built-in services

The **Secure** column shows whether the preset opens a TLS connection immediately (`secure: true`) or starts in cleartext and upgrades with STARTTLS. **Preset extras** lists any additional option the preset sets beyond host, port, and secure. A host or port shown as _default_ is not part of the preset, so Nodemailer falls back to its normal default (`localhost`, and port 587 or 465 depending on `secure`).

| Service ID         | Provider                          | SMTP host                               | Port      | Secure | Preset extras       |
| ------------------ | --------------------------------- | --------------------------------------- | --------- | ------ | ------------------- |
| 126                | 126 Mail                          | smtp.126.com                            | 465       | yes    |                     |
| 163                | 163 Mail                          | smtp.163.com                            | 465       | yes    |                     |
| 1und1              | 1&1 IONOS                         | smtp.1und1.de                           | 465       | yes    | `authMethod: LOGIN` |
| Aliyun             | Alibaba Cloud (Aliyun)            | smtp.aliyun.com                         | 465       | yes    |                     |
| AliyunQiye         | Alibaba Cloud Enterprise          | smtp.qiye.aliyun.com                    | 465       | yes    |                     |
| AOL                | AOL Mail                          | smtp.aol.com                            | 587       | no     |                     |
| Aruba              | Aruba PEC (Italian)               | smtps.aruba.it                          | 465       | yes    | `authMethod: LOGIN` |
| Bluewin            | Swisscom Bluewin                  | smtpauths.bluewin.ch                    | 465       | yes    |                     |
| BOL                | BOL Mail (Brazilian)              | smtp.bol.com.br                         | 587       | no     | `requireTLS`        |
| DebugMail          | DebugMail.io                      | debugmail.io                            | 25        | no     |                     |
| Disroot            | Disroot (privacy-focused)         | disroot.org                             | 587       | no     | `authMethod: LOGIN` |
| DynectEmail        | Oracle Dynect Email               | smtp.dynect.net                         | 25        | no     |                     |
| ElasticEmail       | Elastic Email                     | smtp.elasticemail.com                   | 465       | yes    |                     |
| Ethereal           | Ethereal Email (test)             | smtp.ethereal.email                     | 587       | no     |                     |
| FastMail           | FastMail                          | smtp.fastmail.com                       | 465       | yes    |                     |
| Feishu Mail        | Feishu Mail                       | smtp.feishu.cn                          | 465       | yes    |                     |
| Forward Email      | Forward Email                     | smtp.forwardemail.net                   | 465       | yes    |                     |
| GandiMail          | Gandi Mail                        | mail.gandi.net                          | 587       | no     |                     |
| Gmail              | Gmail / Google Workspace          | smtp.gmail.com                          | 465       | yes    |                     |
| GmailWorkspace     | Gmail Workspace (SMTP relay)      | smtp-relay.gmail.com                    | 465       | yes    |                     |
| GMX                | GMX Mail                          | mail.gmx.com                            | 587       | no     |                     |
| Godaddy            | GoDaddy (US)                      | smtpout.secureserver.net                | 25        | no     |                     |
| GodaddyAsia        | GoDaddy (Asia)                    | smtp.asia.secureserver.net              | 25        | no     |                     |
| GodaddyEurope      | GoDaddy (Europe)                  | smtp.europe.secureserver.net            | 25        | no     |                     |
| hot.ee             | Hot.ee                            | mail.hot.ee                             | _default_ | no     |                     |
| Hotmail            | Microsoft Outlook / Hotmail       | smtp-mail.outlook.com                   | 587       | no     |                     |
| iCloud             | Apple iCloud Mail                 | smtp.mail.me.com                        | 587       | no     |                     |
| Infomaniak         | Infomaniak Mail                   | mail.infomaniak.com                     | 587       | no     |                     |
| KolabNow           | KolabNow (secure email)           | smtp.kolabnow.com                       | 465       | yes    | `authMethod: LOGIN` |
| Loopia             | Loopia                            | mailcluster.loopia.se                   | 465       | yes    |                     |
| Loops              | Loops                             | smtp.loops.so                           | 587       | no     |                     |
| mail.ee            | Mail.ee                           | smtp.mail.ee                            | _default_ | no     |                     |
| Mail.ru            | Mail.ru                           | smtp.mail.ru                            | 465       | yes    |                     |
| Mailcatch.app      | Mailcatch.app (sandbox)           | sandbox-smtp.mailcatch.app              | 2525      | no     |                     |
| Maildev            | Maildev (local)                   | _default_ (`localhost`)                 | 1025      | no     | `ignoreTLS`         |
| MailerSend         | MailerSend                        | smtp.mailersend.net                     | 587       | no     |                     |
| Mailgun            | Mailgun                           | smtp.mailgun.org                        | 465       | yes    |                     |
| Mailjet            | Mailjet                           | in.mailjet.com                          | 587       | no     |                     |
| Mailosaur          | Mailosaur                         | mailosaur.io                            | 25        | no     |                     |
| Mailtrap           | Mailtrap                          | live.smtp.mailtrap.io                   | 587       | no     |                     |
| Mandrill           | Mandrill                          | smtp.mandrillapp.com                    | 587       | no     |                     |
| Naver              | Naver                             | smtp.naver.com                          | 587       | no     |                     |
| OhMySMTP           | OhMySMTP                          | smtp.ohmysmtp.com                       | 587       | no     |                     |
| One                | one.com                           | send.one.com                            | 465       | yes    |                     |
| OpenMailBox        | OpenMailBox                       | smtp.openmailbox.org                    | 465       | yes    |                     |
| Outlook365         | Microsoft 365 / Office 365        | smtp.office365.com                      | 587       | no     |                     |
| Postmark           | Postmark                          | smtp.postmarkapp.com                    | 2525      | no     |                     |
| Proton             | Proton Mail                       | smtp.protonmail.ch                      | 587       | no     | `requireTLS`        |
| qiye.aliyun        | Aliyun Enterprise (mxhichina)     | smtp.mxhichina.com                      | 465       | yes    |                     |
| QQ                 | QQ Mail                           | smtp.qq.com                             | 465       | yes    |                     |
| QQex               | QQ Enterprise Mail                | smtp.exmail.qq.com                      | 465       | yes    |                     |
| Resend             | Resend                            | smtp.resend.com                         | 465       | yes    |                     |
| Runbox             | Runbox (Norwegian)                | smtp.runbox.com                         | 465       | yes    |                     |
| SendCloud          | SendCloud                         | smtp.sendcloud.net                      | 2525      | no     |                     |
| SendGrid           | SendGrid                          | smtp.sendgrid.net                       | 587       | no     |                     |
| SendinBlue         | Brevo (formerly Sendinblue)       | smtp-relay.brevo.com                    | 587       | no     |                     |
| SendPulse          | SendPulse                         | smtp-pulse.com                          | 465       | yes    |                     |
| SES                | AWS SES (generic)                 | email-smtp.us-east-1.amazonaws.com      | 465       | yes    |                     |
| SES-AP-NORTHEAST-1 | AWS SES Asia Pacific (Tokyo)      | email-smtp.ap-northeast-1.amazonaws.com | 465       | yes    |                     |
| SES-AP-NORTHEAST-2 | AWS SES Asia Pacific (Seoul)      | email-smtp.ap-northeast-2.amazonaws.com | 465       | yes    |                     |
| SES-AP-NORTHEAST-3 | AWS SES Asia Pacific (Osaka)      | email-smtp.ap-northeast-3.amazonaws.com | 465       | yes    |                     |
| SES-AP-SOUTH-1     | AWS SES Asia Pacific (Mumbai)     | email-smtp.ap-south-1.amazonaws.com     | 465       | yes    |                     |
| SES-AP-SOUTHEAST-1 | AWS SES Asia Pacific (Singapore)  | email-smtp.ap-southeast-1.amazonaws.com | 465       | yes    |                     |
| SES-AP-SOUTHEAST-2 | AWS SES Asia Pacific (Sydney)     | email-smtp.ap-southeast-2.amazonaws.com | 465       | yes    |                     |
| SES-CA-CENTRAL-1   | AWS SES Canada (Central)          | email-smtp.ca-central-1.amazonaws.com   | 465       | yes    |                     |
| SES-EU-CENTRAL-1   | AWS SES EU Central (Frankfurt)    | email-smtp.eu-central-1.amazonaws.com   | 465       | yes    |                     |
| SES-EU-NORTH-1     | AWS SES EU North (Stockholm)      | email-smtp.eu-north-1.amazonaws.com     | 465       | yes    |                     |
| SES-EU-WEST-1      | AWS SES EU West (Ireland)         | email-smtp.eu-west-1.amazonaws.com      | 465       | yes    |                     |
| SES-EU-WEST-2      | AWS SES EU West (London)          | email-smtp.eu-west-2.amazonaws.com      | 465       | yes    |                     |
| SES-EU-WEST-3      | AWS SES EU West (Paris)           | email-smtp.eu-west-3.amazonaws.com      | 465       | yes    |                     |
| SES-SA-EAST-1      | AWS SES South America (Sao Paulo) | email-smtp.sa-east-1.amazonaws.com      | 465       | yes    |                     |
| SES-US-EAST-1      | AWS SES US East (N. Virginia)     | email-smtp.us-east-1.amazonaws.com      | 465       | yes    |                     |
| SES-US-EAST-2      | AWS SES US East (Ohio)            | email-smtp.us-east-2.amazonaws.com      | 465       | yes    |                     |
| SES-US-GOV-EAST-1  | AWS SES GovCloud (US-East)        | email-smtp.us-gov-east-1.amazonaws.com  | 465       | yes    |                     |
| SES-US-GOV-WEST-1  | AWS SES GovCloud (US-West)        | email-smtp.us-gov-west-1.amazonaws.com  | 465       | yes    |                     |
| SES-US-WEST-1      | AWS SES US West (N. California)   | email-smtp.us-west-1.amazonaws.com      | 465       | yes    |                     |
| SES-US-WEST-2      | AWS SES US West (Oregon)          | email-smtp.us-west-2.amazonaws.com      | 465       | yes    |                     |
| Seznam             | Seznam.cz Email                   | smtp.seznam.cz                          | 465       | yes    |                     |
| SMTP2GO            | SMTP2GO                           | mail.smtp2go.com                        | 2525      | no     |                     |
| Sparkpost          | SparkPost                         | smtp.sparkpostmail.com                  | 587       | no     |                     |
| Zimbra             | Zimbra Mail Server                | smtp.zimbra.com                         | 587       | no     | `requireTLS`        |
| Zoho               | Zoho Mail                         | smtp.zoho.com                           | 465       | yes    | `authMethod: LOGIN` |
| Tipimail           | Tipimail                          | smtp.tipimail.com                       | 587       | no     |                     |
| TurboSMTP          | TurboSMTP                         | pro.turbo-smtp.com                      | 465       | yes    |                     |
| TurboSMTP-EU       | TurboSMTP (EU region)             | pro.eu.turbo-smtp.com                   | 465       | yes    |                     |
| Tutanota           | Tutanota                          | smtp.tutanota.com                       | 465       | yes    |                     |
| Yahoo              | Yahoo Mail                        | smtp.mail.yahoo.com                     | 465       | yes    |                     |
| Yandex             | Yandex Mail                       | smtp.yandex.ru                          | 465       | yes    |                     |

## See Also

- [SMTP transport](/smtp/) - the host, port, and TLS options a preset fills in.
- [Using Gmail](/guides/using-gmail) - the extra setup Gmail needs beyond the preset.
- [OAuth2](/smtp/oauth2) - the authentication most of these providers now require.
- [SES transport](/transports/ses) - the AWS SDK alternative to the SES SMTP presets.
- [Error reference](/errors) - what a rejected connection to a provider means.
