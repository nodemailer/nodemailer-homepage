---
title: Address object
sidebar_position: 13
---

All email addresses can be **plain** email addresses

```javascript
'foobar@example.com'
```

- or with **formatted name** (includes unicode support)

```javascript
'Ноде Майлер <foobar@example.com>'
```

:::tip
Notice that all address fields (even *from:*) are comma separated lists, so if you want to use a comma (or any other special symbol) in the name part, make sure you enclose the name in double quotes like this: `'"Майлер, Ноде" <foobar@example.com>'`
:::

- or as an **address object** (in this case you do not need to worry about the formatting, no need to use quotes etc.)

```javascript
{
    name: 'Майлер, Ноде',
    address: 'foobar@example.com'
}
```

All address fields accept values as a comma separated list of emails or an array of emails or an array of comma separated list of emails or address objects - use it as you like. Formatting can be mixed.

```javascript
...,
to: 'foobar@example.com, "Ноде Майлер" <bar@example.com>, "Name, User" <baz@example.com>',
cc: [
    'foobar@example.com',
    '"Ноде Майлер" <bar@example.com>,
    "Name, User" <baz@example.com>'
],
bcc: [
    'foobar@example.com',
    {
        name: 'Майлер, Ноде',
        address: 'foobar@example.com'
    }
]
...
```

You can even use unicode domains, these are automatically converted to punycode

```javascript
'"Unicode Domain" <info@müriaad-polüteism.info>'
```
