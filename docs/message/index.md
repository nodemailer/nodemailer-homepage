---
title: Message configuration
sidebar\_position: 30
---

The following are the possible fields of an email message:

### Common fields

- **from** - The email address of the sender. All email addresses can be plain `'sender@server.com'` or formatted `'"Sender Name" <sender@server.com>'`, see [Address object](/message/addresses/) for details
- **to** - Comma separated list or an array of recipients email addresses that will appear on the _To:_ field
- **cc** - Comma separated list or an array of recipients email addresses that will appear on the _Cc:_ field
- **bcc** - Comma separated list or an array of recipients email addresses that will appear on the _Bcc:_ field
- **subject** - The subject of the email
- **text** - The plaintext version of the message as an Unicode string, Buffer, Stream or an attachment-like object (`{path: '/var/data/...'}`)
- **html** - The HTML version of the message as an Unicode string, Buffer, Stream or an attachment-like object (`{path: 'http://...'}`)
- **attachments** - An array of attachment objects (see [Using attachments](/message/attachments/) for details). Attachments can be used for [embedding images](/message/embedded-images/) as well.

A large majority of emails sent look a lot like this, using only a few basic fields:

```javascript
var message = {
  from: "sender@server.com",
  to: "receiver@sender.com",
  subject: "Message title",
  text: "Plaintext version of the message",
  html: "<p>HTML version of the message</p>",
};
```

### More advanced fields

##### Routing options

- **sender** - An email address that will appear on the _Sender:_ field (always prefer _from_ if you're not sure which one to use)
- **replyTo** - An email address that will appear on the _Reply-To:_ field
- **inReplyTo** - The Message-ID this message is replying to
- **references** - Message-ID list (an array or space separated string)
- **envelope** - optional SMTP envelope, if auto generated envelope is not suitable (see [SMTP envelope](/smtp/envelope/) for details)

##### Content options

- **attachDataUrls** – if true then convert _data:_ images in the HTML content of this message to embedded attachments
- **watchHtml** - Apple Watch specific HTML version of the message. Latest watches have no problems rendering text/html content so watchHtml is most probably never seen by the recipient
- **amp** - AMP4EMAIL specific HTML version of the message, same usage as with `text` and `html`. See AMP example [below](#amp-example) for usage or [this blogpost](https://blog.nodemailer.com/2019/12/30/testing-amp4email-with-nodemailer/) for sending and rendering

* **icalEvent** – iCalendar event to use as an alternative. See details [here](/message/calendar-events/)
* **alternatives** - An array of alternative text contents (in addition to text and html parts) (see [Using alternative content](/message/alternatives/) for details)
* **encoding** - identifies encoding for text/html strings (defaults to 'utf-8', other values are 'hex' and 'base64')
* **raw** - existing MIME message to use instead of generating a new one. See details [here](/message/custom-source/)
* **textEncoding** - force content-transfer-encoding for text values (either _quoted-printable_ or _base64_). By default the best option is detected (for lots of ascii use _quoted-printable_, otherwise _base64_)

##### Header options

- **priority** - Sets message importance headers, either **'high'**, **'normal'** (default) or **'low'**.
- **headers** - An object or array of additional header fields (e.g. `{"X-Key-Name": "key value"}` or `[{key: "X-Key-Name", value: "val1"}, {key: "X-Key-Name", value: "val2"}]`). Read more about custom headers [here](/message/custom-headers/)
- **messageId** - optional Message-Id value, random value will be generated if not set
- **date** - optional Date value, current UTC string will be used if not set
- **list** - helper for setting List-\* headers (see more [here](/message/list-headers/))

##### Security options

- **disableFileAccess** if true, then does not allow to use files as content. Use it when you want to use JSON data from untrusted source as the email. If an attachment or message node tries to fetch something from a file the sending returns an error. If this field is also set in the transport options, then the value in mail data is ignored
- **disableUrlAccess** if true, then does not allow to use Urls as content. If this field is also set in the transport options, then the value in mail data is ignored

```javascript
var message = {
    ...,
    headers: {
        'My-Custom-Header': 'header value'
    },
    date: new Date('2000-01-01 00:00:00')
};
```

```javascript
var htmlstream = fs.createReadStream("content.html");
transport.sendMail({ html: htmlstream }, function (err) {
  if (err) {
    // check if htmlstream is still open and close it to clean up
  }
});
```

##### AMP example

```javascript
let message = {
  from: "Nodemailer <example@nodemailer.com>",
  to: "Nodemailer <example@nodemailer.com>",
  subject: "AMP4EMAIL message",
  text: "For clients with plaintext support only",
  html: "<p>For clients that do not support AMP4EMAIL or amp content is not valid</p>",
  amp: `<!doctype html>
    <html ⚡4email>
      <head>
        <meta charset="utf-8">
        <style amp4email-boilerplate>body{visibility:hidden}</style>
        <script async src="https://cdn.ampproject.org/v0.js"></script>
        <script async custom-element="amp-anim" src="https://cdn.ampproject.org/v0/amp-anim-0.1.js"></script>
      </head>
      <body>
        <p>Image: <amp-img src="https://cldup.com/P0b1bUmEet.png" width="16" height="16"/></p>
        <p>GIF (requires "amp-anim" script in header):<br/>
          <amp-anim src="https://cldup.com/D72zpdwI-i.gif" width="500" height="350"/></p>
      </body>
    </html>`,
};
```
