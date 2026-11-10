---
title: Cancelling a send
sidebar_position: 6
description: Cancel or time-limit a single sendMail() call with an AbortSignal, without closing the transport or the pool.
---

# Cancelling a send

Since v10.5.0, `sendMail()` accepts an [`AbortSignal`](https://nodejs.org/api/globals.html#class-abortsignal) in the `signal` message option. Aborting it cancels that one message: a worker shutting down, a cancelled job or an overall deadline can stop a send without closing the transporter, and other messages sharing a pool keep going.

Socket timeouts such as `socketTimeout` and `greetingTimeout` limit how long a single network step may stall. A signal limits the whole send, from plugin processing to the server's final reply.

## Quick example

```javascript
try {
  await transporter.sendMail({
    from: "sender@example.com",
    to: "recipient@example.com",
    subject: "Report",
    text: "Hello",
    // give up on this message after 30 seconds
    signal: AbortSignal.timeout(30_000),
  });
} catch (err) {
  if (err.code === "EABORT") {
    console.log("Send cancelled:", err.cause);
  } else {
    throw err;
  }
}
```

To cancel on demand, use an `AbortController` and pass its `signal`:

```javascript
const controller = new AbortController();

const sending = transporter.sendMail({ ...message, signal: controller.signal });

// later, for example when the job that owns the message is cancelled
controller.abort(new Error("Job cancelled"));

await sending; // rejects with an EABORT error
```

The callback form works the same way: the callback receives the error once and is never called again for that message.

## What an abort does

What happens depends on how far the message got:

| Stage                                                     | Result                                                                                   |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| The signal is already aborted when `sendMail()` is called | Nothing is processed; the send fails right away                                          |
| Plugins are still running                                 | The send fails, and the result of a plugin that finishes later is ignored                |
| Queued in a pool, waiting for a free connection           | The message is removed from the queue                                                    |
| Being delivered over SMTP                                 | The connection carrying this message is closed; other pooled connections are not touched |

An aborted message is never put back in the pool queue to be retried, and the pool stays usable for other messages. Nodemailer removes its listener from the signal when the send finishes, whatever the outcome, so one long-lived signal can be shared by many sends.

## The error

A cancelled send fails with an error named `AbortError`, with `code` set to `EABORT` and the signal's `reason` as `cause`:

```javascript
err.name; // 'AbortError'
err.code; // 'EABORT'
err.cause; // signal.reason, e.g. a TimeoutError from AbortSignal.timeout()
```

See [EABORT](/errors#eabort) in the error reference.

:::warning An abort does not mean the message was not delivered
Cancellation stops Nodemailer's own work. It does not tell you what the server did. If the abort lands while the message data is being sent, or after the final `.` but before the server's reply arrives, the server may already have accepted the message. Do not resend a message after `EABORT` on the assumption that it was not delivered, or recipients may get it twice.
:::

## Supported transports

The [SMTP transport](/smtp/) and the [pooled SMTP transport](/smtp/pooled) stop a send that is already in progress.

The other bundled transports ([stream](/transports/stream), [JSON](/transports/stream#json-transport), [sendmail](/transports/sendmail) and [SES](/transports/ses)) honor the signal only until the message is handed to them. A signal that is already aborted, or that aborts while plugins run, still cancels the send with `EABORT`. After that the transport ignores the signal and the message is sent normally.

A `signal` value that is not an `AbortSignal` fails the send with an [`ECONFIG`](/errors#econfig) error.

## Plugins and custom hooks

Nodemailer cannot stop work that a [plugin](/plugins/create) or a custom `getSocket` hook has already started. It ignores their late results instead: a plugin that finishes after the abort does not continue the send, and a socket handed back after the abort is destroyed. To stop that work as well, read the signal from `mail.data.signal` in the plugin and cancel your own operation:

```javascript
transporter.use("compile", (mail, done) => {
  const signal = mail.data.signal;
  renderTemplate(mail.data, { signal }) // your own cancellable work
    .then((html) => {
      mail.data.html = html;
      done();
    })
    .catch(done);
});
```

## Custom transports

A [custom transport](/plugins/create#transports) gets the same treatment as the non-SMTP bundled transports: the signal is honored until its `send()` is called, then ignored. To cancel work in progress, set `supportsAbortSignal: true` on the transport object. Its `send()` must then:

- register its abort listener on `mail.data.signal` synchronously, before returning,
- check for a signal that is already aborted,
- stop the work it owns when the signal aborts,
- call the callback exactly once,
- remove its listener when the send finishes.
