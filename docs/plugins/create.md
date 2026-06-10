---
title: Create plugins
sidebar_position: 1
description: Write custom plugins for message pre-processing, stream transformation, or transport.
---

Nodemailer provides three extension points in the email delivery pipeline where you can attach [plugins](./index.md) to customize behavior:

1. **`compile`** - Runs immediately after `sendMail()` is called, before Nodemailer builds the MIME tree. Use this stage to modify `mail.data` (for example, to transform HTML content, add custom headers, or set default values).
2. **`stream`** - Runs after the MIME tree is fully constructed but before the message bytes are streamed out. At this stage you can modify the `mail.message` object directly or insert transform streams to process the raw message data.
3. **Transport** - The final stage where the raw message stream is delivered to its destination. Custom [transports](/transports/) implement this stage to define how messages are actually sent.

---

## Attaching `compile` and `stream` plugins

To register a plugin, call the `use()` method on your transporter:

```javascript
transporter.use(step, pluginFn);
```

| Parameter     | Type                   | Description                                                        |
| ------------- | ---------------------- | ------------------------------------------------------------------ |
| `transporter` | `Object`               | A transporter instance created with `nodemailer.createTransport()` |
| `step`        | `String`               | The pipeline stage: either `'compile'` or `'stream'`               |
| `pluginFn`    | `Function(mail, done)` | Your plugin function (see the Plugin API section below)            |

You can register multiple plugins for the same stage. They will execute in the order they were added.

---

## Plugin API

Every plugin function, including custom transport `send` methods, receives two arguments:

1. **`mail`** - An object containing information about the message being processed (see the table below).
2. **`done`** - A callback function. For `compile` and `stream` plugins the signature is `function(err)`; for custom transport `send` methods it is `function(err, info)`. You **must** call this when your plugin finishes. Pass an `Error` object to abort the send operation, or call it with no error to continue processing.

### The `mail` object

| Property         | Available at                       | Description                                                                                                                     |
| ---------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `data`           | `compile`, `stream`, **transport** | The message options passed to `sendMail()` (a shallow copy, with the transporter `defaults` already applied)                    |
| `message`        | `stream`, **transport**            | A [`MimeNode`](https://github.com/nodemailer/nodemailer/blob/master/lib/mime-node/index.js) instance representing the built message (see also [MailComposer](/extras/mailcomposer/)) |
| `resolveContent` | `compile`, `stream`, **transport** | A helper method for converting Nodemailer content objects (streams, file paths, URLs) into a `String` or `Buffer`              |

### `mail.resolveContent(obj, key[, options], callback)`

Use this method to convert any [Nodemailer content type](/message/attachments/) (file path, URL, Stream, Buffer, data URI, etc.) into a plain `String` or `Buffer`. This is useful when you need to read and process content that might come from various sources.

The optional `options` object accepts `{ disableFileAccess, disableUrlAccess }` to reject file path or URL resolution for untrusted input.

```javascript
mail.resolveContent(sourceObject, propertyName, (err, value) => {
  if (err) return done(err);
  // value is a String or Buffer depending on the input type
});
```

:::note
If the value being resolved is a stream, the stream is consumed and replaced in place with the resolved Buffer (a stream can only be read once).
:::

#### Example: Log the final HTML string

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

At the `compile` stage, only `mail.data` is available. The `mail.message` property is still `null` because the MIME tree has not been built. You can freely modify `mail.data` and then call `done()` when finished. Passing an error to `done(err)` will abort the `sendMail()` operation.

#### Example: Generate plain text from HTML if missing

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

`stream` plugins run **after** the MIME tree is fully built but **before** any bytes are sent to the transport. At this stage you can:

- Modify `mail.message` directly (for example, to add or change headers)
- Pipe the output through additional Transform streams using `mail.message.transform()`

:::note
Modifying `mail.data` at this stage usually has **no effect** because the MIME tree has already been built from it. The exception is if your custom transport explicitly reads properties from `mail.data`.
:::

### Example: Replace all tabs with spaces in the outgoing stream

```javascript
const { Transform } = require("stream");

// Pass a factory function so every message gets a fresh Transform instance.
// A single stream instance cannot be reused once it has ended, so registering
// the same Transform object would break the second message sent through
// the transporter.
const createTabToSpace = () => {
  const tabToSpace = new Transform();

  tabToSpace._transform = function (chunk, _enc, cb) {
    for (let i = 0; i < chunk.length; ++i) {
      if (chunk[i] === 0x09) chunk[i] = 0x20; // 0x09 = TAB, 0x20 = space
    }
    this.push(chunk);
    cb();
  };

  return tabToSpace;
};

transporter.use("stream", (mail, done) => {
  mail.message.transform(createTabToSpace);
  done();
});
```

### Example: Log all address fields

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

Adds a [`stream.Transform`](https://nodejs.org/api/stream.html#class-streamtransform) through which the raw message is piped **before** it reaches the transport. You can also pass a function that returns a Transform stream; this is recommended because the function is invoked once per message, producing a fresh stream every time.

### `mail.message.processFunc(fn)`

Registers a function with the signature `fn(inputStream) => outputStream`. The function receives the raw message stream and must return another stream; it runs **after** all transform streams added with `transform()`. This is how DKIM signing is applied internally.

### `mail.message.getAddresses()`

Returns an object containing parsed email addresses from the **From**, **Sender**, **Reply-To**, **To**, **Cc**, and **Bcc** headers. Each property is an **array** of objects with `{ name, address }` structure. If a header is not present in the message, that property will be omitted from the result.

---

## Writing a custom transport {#transports}

A transport is an object that defines how messages are actually delivered. For built-in options, see [SMTP transport](/smtp/) and [other transports](/transports/). To create your own, implement an object with three properties: **`name`**, **`version`**, and a **`send(mail, done)`** method. Pass this object to `nodemailer.createTransport()` to create a working transporter.

```javascript
const nodemailer = require("nodemailer");

const transport = {
  name: require("./package.json").name, // e.g. "SMTP"
  version: require("./package.json").version, // e.g. "1.0.0"

  /**
   * Sends the message.
   * @param {Object} mail - The same `mail` object that plugins receive
   * @param {Function} done - Callback with signature `(err, info)`
   */
  send(mail, done) {
    const input = mail.message.createReadStream();
    const envelope = mail.message.getEnvelope();
    const messageId = mail.message.messageId();

    // For demonstration, we pipe the message to stdout
    input.pipe(process.stdout);
    input.on("end", () => {
      done(null, {
        envelope,
        messageId,
      });
    });
  },

  /**
   * Optional: Clean up resources when the transporter is closed.
   * Useful for closing long-lived connections (e.g., pooled SMTP).
   */
  close() {
    // Release resources here
  },

  /**
   * Optional: Report whether the transport is idle.
   * Used by connection pooling. Return `true` when the transport
   * has capacity to send more messages immediately.
   */
  isIdle() {
    return true;
  },

  /**
   * Optional: Back `transporter.verify()`. Check that the transport
   * is able to deliver messages (e.g. test the connection or credentials).
   */
  verify(callback) {
    callback(null, true);
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

:::tip
For API-based transports that need the message as structured data rather than a raw MIME stream, call `mail.normalize(callback)` inside `send()`. It resolves all content parts and returns `(err, data)` where `data` contains the envelope, messageId, resolved `html`/`text`, attachments, and normalized headers. This is what the built-in JSON, SES, and stream transports use.

If the transport object is an EventEmitter, its `'error'` and `'idle'` events are re-emitted by the transporter, which is how pooling transports signal readiness.
:::

---

## Summary

1. Choose the stage (`compile`, `stream`, or custom **transport**) that best fits your needs.
2. Write a plugin function that accepts **`(mail, done)`** and register it with `transporter.use()`, or implement `transport.send()` for a custom transport.
3. Always call `done()` when your plugin completes. Pass an `Error` to abort the send operation.
