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
