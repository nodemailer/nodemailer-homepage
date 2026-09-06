/**
 * Marks outbound documentation links with rel="nofollow".
 *
 * Links to our own properties keep passing ranking signal. Everything else that
 * points off-site is annotated, so a third-party listing on these pages (a
 * community transport, a tool, an article) is a pointer for readers and not a
 * ranking contribution. Relative links, anchors and mailto: are untouched.
 *
 * To let a new destination through, add it to one of the three tables below.
 */

// Matched against the hostname, including any subdomain of the entry.
const ALLOWED_DOMAINS = [
  "nodemailer.com",
  "emailengine.app",
  "imapflow.com",
  "postalsys.com",
  // Ethereal is part of Nodemailer rather than a third-party service.
  "ethereal.email",
];

// Code hosts are shared, so only our own accounts are allowed through.
const ALLOWED_ACCOUNTS = {
  "github.com": ["nodemailer", "andris9", "postalsys", "sponsors/andris9"],
  "raw.githubusercontent.com": ["nodemailer", "andris9", "postalsys"],
};

// Registry pages for our own packages. Exact paths, since a prefix match would
// also cover unrelated packages that merely start with the same name.
const ALLOWED_URLS = ["https://www.npmjs.com/package/nodemailer"];

function isAllowed(url) {
  const host = url.hostname.replace(/^www\./, "");

  if (ALLOWED_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) {
    return true;
  }

  const accounts = ALLOWED_ACCOUNTS[host];
  if (accounts) {
    const path = url.pathname.replace(/^\/+/, "").toLowerCase();
    if (accounts.some((a) => path === a || path.startsWith(`${a}/`))) {
      return true;
    }
  }

  return ALLOWED_URLS.includes(`${url.origin}${url.pathname}`);
}

function needsNofollow(href) {
  if (typeof href !== "string") {
    return false;
  }

  // Protocol-relative URLs are external too, so give them a scheme to parse with.
  const absolute = href.startsWith("//") ? `https:${href}` : href;

  let url;
  try {
    url = new URL(absolute, "https://nodemailer.com");
  } catch {
    return false;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }

  // A relative href resolves against the base above and lands on our own host.
  return !isAllowed(url);
}

// Docusaurus renders an outbound link as target="_blank" with a default
// rel="noopener noreferrer", but it spreads the node's own props last, so a rel
// set here replaces that default instead of merging with it. Carry both values
// along to keep the rendered markup the same apart from the added nofollow.
const REL = ["nofollow", "noopener", "noreferrer"];

function addRel(node) {
  const props = (node.properties = node.properties || {});
  const rel = props.rel;
  const values = Array.isArray(rel) ? [...rel] : typeof rel === "string" ? rel.split(/\s+/) : [];

  for (const value of REL) {
    if (!values.includes(value)) {
      values.push(value);
    }
  }

  props.rel = values.filter(Boolean);
}

function walk(node) {
  if (node.type === "element" && node.tagName === "a" && needsNofollow(node.properties?.href)) {
    addRel(node);
  }

  for (const child of node.children || []) {
    walk(child);
  }
}

module.exports = function rehypeNofollowExternal() {
  return (tree) => walk(tree);
};
