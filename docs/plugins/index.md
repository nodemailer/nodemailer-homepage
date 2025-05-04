---
title: Plugins
sidebar_position: 6
---

Nodemailer is designed to be **extensible**. You can inject custom logic at three well‑defined phases of a message’s lifecycle:

| Phase              | Keyword     | When it runs                                                                   | Typical uses                                                      |
| ------------------ | ----------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| **Pre‑processing** | `compile`   | Right after the message object is built, _before_ the MIME source is generated | Templating, automatic plain‑text alternatives, address validation |
| **Processing**     | `stream`    | While the MIME stream is being generated                                       | DKIM signing, inlining images, transforming HTML                  |
| **Sending**        | `transport` | After the message source is ready, to actually deliver it                      | SMTP, SES, SparkPost, custom HTTP APIs                            |

:::tip
Prefer _compile_ and _stream_ plugins for portability. Transport plugins are only required when you need complete control over delivery.
:::

## Writing a plugin

```js
// commonjs — works on Node.js ≥ 6.0.0
module.exports = function myCompilePlugin(mail, callback) {
  // `mail` is the Nodemailer Mail object
  // Add or adjust properties before the MIME source is generated
  if (!mail.data.text && mail.data.html) {
    mail.data.text = require("html-to-text").htmlToText(mail.data.html);
  }

  callback(); // Always invoke the callback (or pass an Error)
};
```

Register the plugin on a transport instance:

```js
const nodemailer = require("nodemailer");
const transport = nodemailer.createTransport({ sendmail: true });

transport.use("compile", require("./myCompilePlugin"));
```

### Error handling

If your plugin encounters a fatal problem, pass an `Error` object to the callback:

```js
callback(new Error("Template not found"));
```

The message will **not** be sent and the error will propagate to the caller’s `sendMail()` callback/promise.

## Public plugins

A curated selection of community‑maintained plugins:

- **express‑handlebars** – Render Handlebars templates from your Express views directory.
  [https://github.com/yads/nodemailer-express-handlebars](https://github.com/yads/nodemailer-express-handlebars)
- **inline‑base64** – Convert inline base64‑encoded images to CID attachments.
  [https://github.com/mixmaxhq/nodemailer-plugin-inline-base64](https://github.com/mixmaxhq/nodemailer-plugin-inline-base64)
- **html‑to‑text** – Automatically generate a plain‑text version when one is missing.
  [https://github.com/andris9/nodemailer-html-to-text](https://github.com/andris9/nodemailer-html-to-text)

Looking for something else? Try [searching npm for “nodemailer plugin”](https://www.npmjs.com/search?q=keywords:nodemailer%20plugin).

---

Need more power? See **[Creating plugins »](/plugins/create)** for a deep dive into the plugin API.
