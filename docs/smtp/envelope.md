---
title: SMTP envelope
sidebar_position: 20
---

SMTP envelope is usually auto generated from **from**, **to**, **cc** and **bcc** fields in the message object but if for some reason you want to specify it yourself (custom envelopes are usually used for VERP addresses), you can do it with the **envelope** property in the message object.

- **envelope** – is an object with the following address params that behave just like with regular mail options. You can also use the regular address format, unicode domains etc.
  - **from** – the first address gets used as MAIL FROM address in SMTP
  - **to** – addresses from this value get added to RCPT TO list
  - **cc** – addresses from this value get added to RCPT TO list
  - **bcc** – addresses from this value get added to RCPT TO list

```javascript
let message = {
    ...,
    from: 'mailer@nodemailer.com', // listed in rfc822 message header
    to: 'daemon@nodemailer.com', // listed in rfc822 message header
    envelope: {
        from: 'Daemon <deamon@nodemailer.com>', // used as MAIL FROM: address for SMTP
        to: 'mailer@nodemailer.com, Mailer <mailer2@nodemailer.com>' // used as RCPT TO: address for SMTP
    }
}
```

The envelope object returned by **sendMail()** includes just **from** (address string) and **to** (an array of address strings) fields as all addresses from **to**, **cc** and **bcc** get merged into **to** when sending.
