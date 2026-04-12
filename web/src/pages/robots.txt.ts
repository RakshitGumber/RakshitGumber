import { getSiteUrl } from "@/libs/seo";

export async function GET() {
  const siteUrl = getSiteUrl();
  const sitemapUrl = new URL("/sitemap.xml", siteUrl).toString();

  return new Response(
    `User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}\n`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}
