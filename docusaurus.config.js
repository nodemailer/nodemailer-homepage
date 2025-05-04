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
  projectName: "nodemailer-docu", // Usually your repo name.

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

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: "img/social-card.png",
      navbar: {
        title: "Send e-mails with Node.JS, easy as cake!",
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
            href: "/docs/about",
            position: "left",
            label: "About",
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

        copyright: `Copyright © 2010 - ${new Date().getFullYear()} Andris Reinman. Powered by <a href="https://emailengine.app" class="footer__link-item">EmailEngine</a>.`,
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
    }),
};
