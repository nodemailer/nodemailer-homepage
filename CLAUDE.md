# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the documentation website for [Nodemailer](https://nodemailer.com), built with Docusaurus 3. The site serves as the official documentation for the Nodemailer email sending library.

The Nodemailer source code can be found in `../nodemailer`.

## Commands

```bash
npm start       # Start development server (hot reload)
npm run build   # Production build to ./build
npm run serve   # Preview production build locally
npm run clear   # Clear Docusaurus cache (useful when styles/config seem stale)
```

## Architecture

- **Docusaurus 3 docs-only mode**: Blog and pages are disabled. All content is served from `docs/` at the root URL path (`/`).
- **Sidebar**: Auto-generated from the `docs/` directory structure via `sidebars.js`, plus a custom HTML ad block.
- **Custom component**: `src/components/EmailPlayground/` - An interactive JSON editor that previews Nodemailer message configurations. Uses `postal-mime` for address parsing.

## Documentation Structure

```
docs/
├── index.md           # Homepage
├── message/           # Email message configuration (addresses, attachments, etc.)
├── smtp/              # SMTP transport options (OAuth2, pooling, proxies, etc.)
├── transports/        # Transport types (SES, sendmail, stream)
├── dkim/              # DKIM signing
├── extras/            # Related packages (smtp-server, mailparser, etc.)
├── plugins/           # Plugin system
└── usage/             # Usage guides (Gmail, Ethereal testing)
```

## Configuration Notes

- Algolia search is enabled (config in `docusaurus.config.js`)
- Client-side redirects configured for `/about` → `/`
- Prism syntax highlighting includes PHP support

## Code examples: CommonJS / ESM tabs

Nodemailer ships both a CommonJS and an ES module build, so every example that
loads a module is shown twice, in a tab pair:

````markdown
<Tabs groupId="module-system">
<TabItem value="cjs" label="CommonJS">

```javascript
const nodemailer = require("nodemailer");
```

</TabItem>
<TabItem value="esm" label="ESM">

```javascript
import nodemailer from "nodemailer";
```

</TabItem>
</Tabs>
````

Notes:

- `Tabs` and `TabItem` are registered globally in `src/theme/MDXComponents.js`, so
  docs pages use them without an import block.
- Always use `groupId="module-system"`. Docusaurus syncs and persists the choice,
  so picking ESM once switches every example on the site.
- Examples with no `require`/`import` line are identical in both module systems
  and stay as a plain code block.
