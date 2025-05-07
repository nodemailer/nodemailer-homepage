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
  projectName: "nodemailer-web-docu", // Usually your repo name.

  deploymentBranch: "master",

  trailingSlash: false,

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

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
            from: ["/about"],
          },
        ],
      },
    ],
  ],

  scripts: [
    {
      src: "https://plausible.emailengine.dev/js/script.js",
      defer: true,
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

      copyright: `Copyright © 2010 - ${new Date().getFullYear()} Andris Reinman. Powered by <a href="https://emailengine.app/?utm_source=nodemailer&utm_campaign=nodemailer&utm_medium=footer" class="footer__link-item">EmailEngine</a>.`,
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
