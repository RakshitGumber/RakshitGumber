import { getCollection } from "astro:content";
import { getSiteUrl, resolveAbsoluteUrl, SITE_NAME } from "@/libs/seo";

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export async function GET() {
  const siteUrl = getSiteUrl();
  const posts = (await getCollection("blog")).sort(
    (a, b) => b.data.timestamp.valueOf() - a.data.timestamp.valueOf(),
  );

  const items = posts
    .map((post) => {
      const url = resolveAbsoluteUrl(siteUrl, `/blog/${post.data.slug}`);

      if (!url) {
        return "";
      }

      return [
        "    <item>",
        `      <title>${escapeXml(post.data.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid>${escapeXml(url)}</guid>`,
        `      <pubDate>${post.data.timestamp.toUTCString()}</pubDate>`,
        `      <description>${escapeXml(
          post.data.longDescription ?? post.data.description,
        )}</description>`,
        "    </item>",
      ].join("\n");
    })
    .filter(Boolean)
    .join("\n");

  const feedUrl = resolveAbsoluteUrl(siteUrl, "/rss.xml") ?? new URL("/rss.xml", siteUrl).toString();
  const siteRoot = resolveAbsoluteUrl(siteUrl, "/") ?? siteUrl.toString();
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    `    <title>${escapeXml(`${SITE_NAME} Blog`)}</title>`,
    `    <link>${escapeXml(siteRoot)}</link>`,
    `    <description>${escapeXml(
      "Writing and notes from Rakshit Gumber.",
    )}</description>`,
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom" />`,
    items,
    "  </channel>",
    "</rss>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
