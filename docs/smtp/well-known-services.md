---
title: Well-Known Services
sidebar_position: 23
---

Nodemailer ships with connection presets for many popular SMTP providers.
Instead of looking up each provider’s SMTP host name, port and security settings
you can pass a single **`service`** string when you create a transport.
Nodemailer will fill in the rest for you.

```js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail", // any id from the table below, case insensitive
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
```

Internally `service` is just a shortcut – you can always supply `host`, `port`,
`secure` and other options yourself. If something changes or your provider is
missing you can open a pull‑request against the [services.json](https://github.com/nodemailer/nodemailer/blob/master/lib/well-known/services.json) file
or bypass this feature entirely and set the connection details manually.

:::info
Most major providers require OAuth 2 or application‑specific
passwords. The presets only configure the server connection; you are still
responsible for using the correct authentication mechanism.
:::

## List of built‑in services

| Service ID         | Provider                         | SMTP host                               | Port |
| ------------------ | -------------------------------- | --------------------------------------- | ---- |
| 1und1              | 1&1 IONOS                        | smtp.1und1.de                           | 465  |
| 126                | 126 Mail                         | smtp.126.com                            | 465  |
| 163                | 163 Mail                         | smtp.163.com                            | 465  |
| Aliyun             | Alibaba Cloud (Aliyun)           | smtp.aliyun.com                         | 465  |
| AliyunQiye         | Alibaba Cloud Enterprise         | smtp.qiye.aliyun.com                    | 465  |
| AOL                | AOL Mail                         | smtp.aol.com                            | 587  |
| Bluewin            | Swisscom Bluewin                 | smtpauths.bluewin.ch                    | 465  |
| DebugMail          | DebugMail.io                     | debugmail.io                            | 25   |
| DynectEmail        | Oracle Dynect Email              | smtp.dynect.net                         | 25   |
| Ethereal           | Ethereal Email (test)            | smtp.ethereal.email                     | 587  |
| FastMail           | FastMail                         | smtp.fastmail.com                       | 465  |
| Feishu Mail        | Feishu Mail                      | smtp.feishu.cn                          | 465  |
| Forward Email      | Forward Email                    | smtp.forwardemail.net                   | 465  |
| GandiMail          | Gandi Mail                       | mail.gandi.net                          | 587  |
| Gmail              | Gmail / Google Workspace         | smtp.gmail.com                          | 465  |
| Godaddy            | GoDaddy (US)                     | smtpout.secureserver.net                | 25   |
| GodaddyAsia        | GoDaddy (Asia)                   | smtp.asia.secureserver.net              | 25   |
| GodaddyEurope      | GoDaddy (Europe)                 | smtp.europe.secureserver.net            | 25   |
| hot.ee             | Hot.ee                           | mail.hot.ee                             | 25   |
| Hotmail            | Microsoft Outlook / Hotmail      | smtp-mail.outlook.com                   | 587  |
| iCloud             | Apple iCloud Mail                | smtp.mail.me.com                        | 587  |
| Infomaniak         | Infomaniak Mail                  | mail.infomaniak.com                     | 587  |
| Loopia             | Loopia                           | mailcluster.loopia.se                   | 465  |
| mail.ee            | Mail.ee                          | smtp.mail.ee                            | 25   |
| Mail.ru            | Mail.ru                          | smtp.mail.ru                            | 465  |
| Mailcatch.app      | Mailcatch.app (sandbox)          | sandbox-smtp.mailcatch.app              | 2525 |
| Maildev            | Maildev (local)                  | 127.0.0.1                               | 1025 |
| Mailgun            | Mailgun                          | smtp.mailgun.org                        | 465  |
| Mailjet            | Mailjet                          | in.mailjet.com                          | 587  |
| Mailosaur          | Mailosaur                        | mailosaur.io                            | 25   |
| Mailtrap           | Mailtrap                         | live.smtp.mailtrap.io                   | 587  |
| Mandrill           | Mandrill                         | smtp.mandrillapp.com                    | 587  |
| Naver              | Naver                            | smtp.naver.com                          | 587  |
| One                | one.com                          | send.one.com                            | 465  |
| OpenMailBox        | OpenMailBox                      | smtp.openmailbox.org                    | 465  |
| OhMySMTP           | OhMySMTP                         | smtp.ohmysmtp.com                       | 587  |
| Outlook365         | Microsoft 365 / Outlook 365      | smtp.office365.com                      | 587  |
| Postmark           | Postmark                         | smtp.postmarkapp.com                    | 2525 |
| Proton             | Proton Mail                      | smtp.protonmail.ch                      | 587  |
| qiye.aliyun        | Aliyun Enterprise (mxhichina)    | smtp.mxhichina.com                      | 465  |
| QQ                 | QQ Mail                          | smtp.qq.com                             | 465  |
| QQex               | QQ Enterprise Mail               | smtp.exmail.qq.com                      | 465  |
| SendCloud          | SendCloud                        | smtp.sendcloud.net                      | 2525 |
| SendGrid           | SendGrid                         | smtp.sendgrid.net                       | 587  |
| SendinBlue         | Brevo (formerly Sendinblue)      | smtp-relay.brevo.com                    | 587  |
| SendPulse          | SendPulse                        | smtp-pulse.com                          | 465  |
| SES                | AWS SES (generic)                | email-smtp.us-east-1.amazonaws.com      | 465  |
| SES-US-EAST-1      | AWS SES US East (N. Virginia)    | email-smtp.us-east-1.amazonaws.com      | 465  |
| SES-US-WEST-2      | AWS SES US West (Oregon)         | email-smtp.us-west-2.amazonaws.com      | 465  |
| SES-EU-WEST-1      | AWS SES EU West (Ireland)        | email-smtp.eu-west-1.amazonaws.com      | 465  |
| SES-AP-SOUTH-1     | AWS SES Asia Pacific (Mumbai)    | email-smtp.ap-south-1.amazonaws.com     | 465  |
| SES-AP-NORTHEAST-1 | AWS SES Asia Pacific (Tokyo)     | email-smtp.ap-northeast-1.amazonaws.com | 465  |
| SES-AP-NORTHEAST-2 | AWS SES Asia Pacific (Seoul)     | email-smtp.ap-northeast-2.amazonaws.com | 465  |
| SES-AP-NORTHEAST-3 | AWS SES Asia Pacific (Osaka)     | email-smtp.ap-northeast-3.amazonaws.com | 465  |
| SES-AP-SOUTHEAST-1 | AWS SES Asia Pacific (Singapore) | email-smtp.ap-southeast-1.amazonaws.com | 465  |
| SES-AP-SOUTHEAST-2 | AWS SES Asia Pacific (Sydney)    | email-smtp.ap-southeast-2.amazonaws.com | 465  |
| Seznam             | Seznam.cz Email                  | smtp.seznam.cz                          | 465  |
| Sparkpost          | SparkPost                        | smtp.sparkpostmail.com                  | 587  |
| Tipimail           | Tipimail                         | smtp.tipimail.com                       | 587  |
| Yahoo              | Yahoo Mail                       | smtp.mail.yahoo.com                     | 465  |
| Yandex             | Yandex Mail                      | smtp.yandex.ru                          | 465  |
| Zoho               | Zoho Mail                        | smtp.zoho.com                           | 465  |
