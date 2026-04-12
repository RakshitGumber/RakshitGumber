export const SITE_NAME = "Rakshit Gumber";
// Fallback assumption until the deployment environment provides WEB_URL.
export const FALLBACK_SITE_URL = "https://gumberrakshit.com";
export const DEFAULT_LOCALE = "en_US";
export const DEFAULT_SOCIAL_IMAGE = "/images/avatar.png";
export const SAME_AS_LINKS = [
  "https://github.com/RakshitGumber",
  "https://www.linkedin.com/in/gumber-rakshit",
  "https://x.com/Gumber_Rakshit",
];
export const DEFAULT_ROBOTS =
  "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

export type RobotsValue =
  | string
  | {
      index?: boolean;
      follow?: boolean;
      maxImagePreview?: "none" | "standard" | "large";
      maxSnippet?: number;
      maxVideoPreview?: number;
      noarchive?: boolean;
      nosnippet?: boolean;
      noimageindex?: boolean;
      notranslate?: boolean;
      unavailableAfter?: string;
    };

export type BreadcrumbItem = {
  name: string;
  href: string;
};

export type JsonLdValue = Record<string, unknown>;

export const getSiteUrl = () =>
  new URL(
    process.env.WEB_URL ??
      process.env.SITE_URL ??
      process.env.PUBLIC_SITE_URL ??
      FALLBACK_SITE_URL,
  );

export const resolveAbsoluteUrl = (siteUrl: URL, value?: string) => {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value).toString();
  } catch {
    return new URL(value.startsWith("/") ? value : `/${value}`, siteUrl).toString();
  }
};

export const normalizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const robotsToString = (robots?: RobotsValue) => {
  if (!robots) {
    return DEFAULT_ROBOTS;
  }

  if (typeof robots === "string") {
    return robots;
  }

  const directives: string[] = [];

  directives.push(robots.index === false ? "noindex" : "index");
  directives.push(robots.follow === false ? "nofollow" : "follow");

  if (robots.maxImagePreview) {
    directives.push(`max-image-preview:${robots.maxImagePreview}`);
  }

  if (typeof robots.maxSnippet === "number") {
    directives.push(`max-snippet:${robots.maxSnippet}`);
  }

  if (typeof robots.maxVideoPreview === "number") {
    directives.push(`max-video-preview:${robots.maxVideoPreview}`);
  }

  if (robots.noarchive) {
    directives.push("noarchive");
  }

  if (robots.nosnippet) {
    directives.push("nosnippet");
  }

  if (robots.noimageindex) {
    directives.push("noimageindex");
  }

  if (robots.notranslate) {
    directives.push("notranslate");
  }

  if (robots.unavailableAfter) {
    directives.push(`unavailable_after:${robots.unavailableAfter}`);
  }

  return directives.join(",");
};

export const buildBreadcrumbListJsonLd = (
  items: BreadcrumbItem[],
  siteUrl: URL,
) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [{ name: SITE_NAME, href: "/" }, ...items].map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: resolveAbsoluteUrl(siteUrl, item.href),
  })),
});

export const buildPersonJsonLd = (
  siteUrl: URL,
  {
    name = SITE_NAME,
    description,
    image,
    url = "/",
    sameAs = [],
  }: {
    name?: string;
    description?: string;
    image?: string;
    url?: string;
    sameAs?: string[];
  } = {},
) => ({
  "@context": "https://schema.org",
  "@type": "Person",
  name,
  description,
  image: resolveAbsoluteUrl(siteUrl, image ?? DEFAULT_SOCIAL_IMAGE),
  url: resolveAbsoluteUrl(siteUrl, url),
  sameAs: sameAs.length > 0 ? sameAs : SAME_AS_LINKS,
});

export const buildProfilePageJsonLd = (
  siteUrl: URL,
  {
    name = SITE_NAME,
    description,
    url = "/",
    mainEntity,
  }: {
    name?: string;
    description?: string;
    url?: string;
    mainEntity?: JsonLdValue;
  } = {},
) => ({
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  name,
  description,
  url: resolveAbsoluteUrl(siteUrl, url),
  dateModified: new Date().toISOString(),
  mainEntity,
});

export const buildBlogPostingJsonLd = (
  siteUrl: URL,
  {
    title,
    description,
    url,
    image,
    datePublished,
    dateModified,
    authorName = SITE_NAME,
    keywords = [],
  }: {
    title: string;
    description: string;
    url: string;
    image?: string;
    datePublished: string;
    dateModified?: string;
    authorName?: string;
    keywords?: string[];
  },
) => ({
  "@context": "https://schema.org",
  "@type": ["BlogPosting", "Article"],
  headline: title,
  description,
  image: resolveAbsoluteUrl(siteUrl, image ?? DEFAULT_SOCIAL_IMAGE),
  url: resolveAbsoluteUrl(siteUrl, url),
  datePublished,
  dateModified: dateModified ?? datePublished,
  author: {
    "@type": "Person",
    name: authorName,
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": resolveAbsoluteUrl(siteUrl, url),
  },
  keywords,
});
