const lightCodeTheme = require("prism-react-renderer").themes.github;
const darkCodeTheme = require("prism-react-renderer").themes.dracula;

export default {
  title: "Nodemailer",
  tagline: "✉️ Send e-mails with Node.JS – easy as cake!",
  favicon: "img/favicon.ico",
  url: "https://nodemailer.com",
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "nodemailer", // Usually your GitHub org/user name.
  projectName: "nodemailer-homepage", // Usually your repo name.

  deploymentBranch: "master",

  trailingSlash: false,

  onBrokenLinks: "throw",

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: { path: "docs", routeBasePath: "/", sidebarPath: "sidebars.js" },
        blog: false,
        pages: false,
      },
    ],
  ],

  plugins: [
    [
      "@docusaurus/plugin-client-redirects",
      {
        redirects: [
          {
            to: "/",
            from: ["/about", "/usage"],
          },
          {
            to: "/guides/using-gmail",
            from: ["/usage/using-gmail"],
          },
          {
            to: "/guides/testing-with-ethereal",
            from: ["/usage/testing-with-ethereal", "/smtp/testing"],
          },
          {
            to: "/message/dsn",
            from: ["/smtp/dsn"],
          },
        ],
      },
    ],
  ],

  // Plausible Analytics, loaded from www.nodemailer.com rather than direct.
  //
  // EasyPrivacy, which uBlock Origin and AdGuard both enable by default, carries
  // ://plausible.*/js/script. and ://plausible.*/api/event|. Both match on the
  // hostname prefix, so the direct plausible.emailengine.dev URLs load for nobody
  // running a blocker. This site is GitHub Pages and cannot proxy for itself, so
  // the proxy lives on www.nodemailer.com, which is a Caddy vhost on srv-04 (an
  // otherwise plain redirect to this apex). Same registrable domain, so a blocker
  // counts these as first-party: uBlock, AdGuard and EasyList all define
  // third-party by eTLD+1, not by hostname.
  //
  // data-api must be absolute. A relative path would resolve against
  // nodemailer.com, which is GitHub Pages and has no such route.
  //
  // data-domain is stated explicitly. Without it the script sends no domain and
  // attribution depends on the server inferring it from the page URL.
  scripts: [
    {
      src: "https://www.nodemailer.com/a/pv.js",
      defer: true,
      "data-domain": "nodemailer.com",
      "data-api": "https://www.nodemailer.com/a/e",
    },
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/social-card.png",
    navbar: {
      title: "Nodemailer",
      logo: {
        alt: "Nodemailer",
        src: "img/nm_logo_200x136.png",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docs",
          position: "left",
          label: "Documentation",
        },
        {
          href: "https://emailengine.app/?utm_source=nodemailer&utm_campaign=nodemailer&utm_medium=navbar",
          position: "left",
          label: "EmailEngine",
        },
        {
          href: "https://www.npmjs.com/package/nodemailer",
          label: "NPM",
          position: "right",
        },
        {
          href: "https://github.com/nodemailer/nodemailer",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",

      copyright: `Copyright © 2010 - ${new Date().getFullYear()} Andris Reinman. Powered by <a href="https://emailengine.app/?utm_source=nodemailer.com&utm_medium=footer&utm_campaign=oss-docs" class="footer__link-item">EmailEngine</a>.`,
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
      additionalLanguages: ["php"],
    },
    defaultMode: "light",
    disableSwitch: false,
    respectPrefersColorScheme: false,

    mermaid: {
      theme: { light: "default", dark: "dark" },
    },

    algolia: {
      // The application ID provided by Algolia
      appId: "BNTKMOXVM6",

      // Public API key: it is safe to commit it
      apiKey: "8b9aa4293a38493456a7797f8f1c3a82",

      indexName: "nodemailer",

      // Optional: see doc section below
      contextualSearch: true,

      // Optional: path for search page that enabled by default (`false` to disable it)
      searchPagePath: "search",

      // Optional: whether the insights feature is enabled or not on Docsearch (`false` by default)
      insights: true,

      //... other Algolia params
    },
  },
};
