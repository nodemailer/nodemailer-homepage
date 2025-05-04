---
title: Custom source
sidebar_position: 18
---

If you want to use your own custom generated RFC822 formatted message source, instead of letting Nodemailer to generate it from the message options, use option **raw**. This can be used both for the entire message or alternatively per-attachment or per-alternative.

:::note
Don't forget to set the **envelope** option when using **raw** as the message source
:::

### Examples

#### 1\. Use string as a message body

This example loads the entire message source from a string value. You don't have to worry about proper newlines, these are handled by Nodemailer.

```javascript
let message = {
    envelope: {
        from: 'sender@example.com',
        to: ['recipient@example.com']
    },
    raw: `From: sender@example.com
To: recipient@example.com
Subject: test message

Hello world!`
};
```

#### 2\. Set EML file as message body

This example loads the entire message source from a file

```javascript
let message = {
    envelope: {
        from: 'sender@example.com',
        to: ['recipient@example.com']
    },
    raw: {
        path: '/path/to/message.eml'
    }
};
```

#### 3\. Set string as attachment body

When using **raw** for attachments then you need to provide all content headers youself, Nodemailer does not process it in any way (besides newline processing), it is inserted into the MIME tree as is.

```javascript
let message = {
    from: 'sender@example.com',
    to: 'recipient@example.com',
    subject: 'Custom attachment',
    attachments: [{
        raw: `Content-Type: text/plain
Content-Disposition: attachment

Attached text file`}]
};
```
