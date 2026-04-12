import { getCollection } from "astro:content";
import { getSiteUrl, resolveAbsoluteUrl } from "@/libs/seo";

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export async function GET() {
  const siteUrl = getSiteUrl();
  const posts = await getCollection("blog");
  const projects = await getCollection("project");

  const entries = [
    { path: "/", lastmod: undefined },
    { path: "/about", lastmod: undefined },
    { path: "/contact", lastmod: undefined },
    { path: "/blog", lastmod: undefined },
    { path: "/projects", lastmod: undefined },
    ...posts.map((entry) => ({
      path: `/blog/${entry.data.slug}`,
      lastmod: entry.data.timestamp.toISOString(),
    })),
    ...projects.map((entry) => ({
      path: `/projects/${entry.data.slug}`,
      lastmod: entry.data.timestamp.toISOString(),
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map(
        ({ path, lastmod }) => `  <url>\n` +
          `    <loc>${escapeXml(
            resolveAbsoluteUrl(siteUrl, path) ?? new URL(path, siteUrl).toString(),
          )}</loc>\n` +
          (lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>\n` : "") +
          `  </url>`,
      )
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
