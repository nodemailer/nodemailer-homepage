---
title: Create plugins
sidebar\_position: 30
---

Nodemailer exposes three points in the e‑mail delivery pipeline where you can attach **plugins**:

1. **`compile`** – triggered right after the original `sendMail()` input has been received, before any MIME tree has been built. Modify `mail.data` here (e.g. tweak **`html`** contents, add headers, etc.).
2. **`stream`** – triggered after Nodemailer has generated the complete MIME tree but _before_ it starts streaming the raw message. At this stage you can mutate the `mail.message` object or inject transform streams that the message is piped through.
3. **Transport** – the final step where the raw message stream is sent to its destination. Custom transports implement this stage themselves.

---

## Attaching `compile` and `stream` plugins

```javascript
transporter.use(step, pluginFn);
```

| Parameter     | Type                   | Description                                               |
| ------------- | ---------------------- | --------------------------------------------------------- |
| `transporter` | `Object`               | A transporter created with `nodemailer.createTransport()` |
| `step`        | `String`               | Either `'compile'` or `'stream'`                          |
| `pluginFn`    | `Function(mail, done)` | Your plugin function (see API below)                      |

---

## Plugin API

Every plugin ‑‑ including custom transports ‑‑ receives two arguments:

1. `mail`  – Details about the message being processed (see below)
2. `done`  – Callback **`function (err?)`** which **must** be invoked when your plugin finishes (pass an `Error` to abort the send)

### `mail` object

| Property         | Available at                       | Description                                                                                                                   |
| ---------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `data`           | `compile`, `stream`, **transport** | Original options object passed to `sendMail()`                                                                                |
| `message`        | `stream`, **transport**            | [`MimeNode`](https://github.com/nodemailer/nodemailer/blob/master/lib/mime-node/index.js) instance of the fully‑built message |
| `resolveContent` | `compile`, `stream`, **transport** | Helper for converting Nodemailer content objects to a `String` or `Buffer`                                                    |

### `mail.resolveContent(obj, key, callback)`

Convert any [Nodemailer content type](https://nodemailer.com/message/attachments/#possible-content-types) (file path, URL, Stream, Buffer, etc.) into a plain `String` **or** `Buffer`.

```javascript
mail.resolveContent(sourceObject, propertyName, (err, value) => {
  if (err) return done(err);
  // value is String or Buffer depending on the input type
});
```

#### Example – log the final HTML string

```javascript
function plugin(mail, done) {
  mail.resolveContent(mail.data, "html", (err, html) => {
    if (err) return done(err);
    console.log("HTML contents: %s", html.toString());
    done();
  });
}
```

---

## `compile` plugins

`compile` plugins **only** receive `mail.data`; `mail.message` does **not** yet exist. Mutate `mail.data` freely and call `done()` when finished. Returning an error aborts `sendMail()`.

#### Example – generate `text` from `html` if missing

```javascript
transporter.use("compile", (mail, done) => {
  if (!mail.data.text && mail.data.html) {
    mail.data.text = mail.data.html.replace(/<[^>]*>/g, " ");
  }
  done();
});
```

---

## `stream` plugins

`stream` plugins are invoked **after** the MIME tree is ready but **before** the first byte is sent. You can:

- Mutate `mail.message` (e.g. add headers)
- Pipe the output through additional Transform streams via `mail.message.transform()`

> Editing `mail.data` at this stage usually has **no effect** unless your custom transport explicitly reads the changed property.

### Example – replace all tabs with spaces in the outgoing stream

```javascript
const { Transform } = require("stream");

const tabToSpace = new Transform();

tabToSpace._transform = function (chunk, _enc, cb) {
  for (let i = 0; i < chunk.length; ++i) {
    if (chunk[i] === 0x09) chunk[i] = 0x20; // 0x09 = TAB, 0x20 = space
  }
  this.push(chunk);
  cb();
};

transporter.use("stream", (mail, done) => {
  mail.message.transform(tabToSpace);
  done();
});
```

### Example – log all address fields

```javascript
transporter.use("stream", (mail, done) => {
  const a = mail.message.getAddresses();
  console.log("From :", JSON.stringify(a.from));
  console.log("To   :", JSON.stringify(a.to));
  console.log("Cc   :", JSON.stringify(a.cc));
  console.log("Bcc  :", JSON.stringify(a.bcc));
  done();
});
```

---

### `mail.message.transform(transformStream)`

Add a [`stream.Transform`](https://nodejs.org/api/stream.html#class-streamtransform) (or a function returning one) through which the raw message is piped **before** it reaches the transport.

### `mail.message.getAddresses()`

Returns an object containing parsed addresses from **From**, **Sender**, **Reply‑To**, **To**, **Cc**, and **Bcc** headers. Each property is an **array** of `{ name, address }`. Absent fields are omitted.

---

## Writing a custom transport

A transport is simply an object with **`name`**, **`version`**, and a **`send(mail, done)`** method. Provide the object to `nodemailer.createTransport()` to create a usable transporter.

```javascript
const nodemailer = require("nodemailer");

const transport = {
  name: require("./package.json").name, // e.g. "SMTP"
  version: require("./package.json").version, // e.g. "1.0.0"

  /**
   * Actually sends the message.
   * @param {Object} mail – the same `mail` object plugins receive
   * @param {Function} done – callback `(err, info)`
   */
  send(mail, done) {
    const input = mail.message.createReadStream();
    const envelope = mail.message.getEnvelope();
    const messageId = mail.message.messageId();

    // For demo purposes we just pipe to stdout
    input.pipe(process.stdout);
    input.on("end", () => {
      done(null, {
        envelope,
        messageId,
      });
    });
  },

  /* Optional: close long‑lived connections (e.g. pooled SMTP) */
  close() {
    // Clean‑up resources here
  },

  /* Optional: report idling state (used by pooling)
       Should return `true` when the transport has capacity to send more messages. */
  isIdle() {
    return true;
  },
};

const transporter = nodemailer.createTransport(transport);

transporter.sendMail(
  {
    from: "sender@example.com",
    to: "receiver@example.com",
    subject: "Hello",
    text: "Hello world!",
  },
  console.log
);
```

---

## Summary

1. Decide which stage (`compile`, `stream`, or custom **transport**) best suits your use‑case.
2. Write a plugin function receiving **`(mail, done)`** and attach it with `transporter.use()` (or implement `transport.send`).
3. Always invoke `done(err?)` to signal completion or abort the send.

Happy Hacking! 🚀
