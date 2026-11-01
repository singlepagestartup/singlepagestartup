import { SEO_SITEMAP_MAX_BYTES, SEO_SITEMAP_MAX_URLS } from "../constants/seo";
const namespace = "http://www.sitemaps.org/schemas/sitemap/0.9";
const declaration = '<?xml version="1.0" encoding="UTF-8"?>\n';
export function escapeSitemapXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
export function sitemapDocuments(urls: string[]): string[] {
  const prefix = `${declaration}<urlset xmlns="${namespace}">\n`,
    suffix = "</urlset>\n";
  const encoder = new TextEncoder();
  const overhead = encoder.encode(prefix + suffix).length;
  const documents: string[] = [];
  let rows: string[] = [],
    bytes = overhead;
  for (const url of urls) {
    const row = `<url><loc>${escapeSitemapXml(url)}</loc></url>\n`;
    const size = encoder.encode(row).length;
    if (size + overhead > SEO_SITEMAP_MAX_BYTES)
      throw new Error("Sitemap URL exceeds XML size limit");
    if (
      rows.length >= SEO_SITEMAP_MAX_URLS ||
      bytes + size > SEO_SITEMAP_MAX_BYTES
    ) {
      documents.push(prefix + rows.join("") + suffix);
      rows = [];
      bytes = overhead;
    }
    rows.push(row);
    bytes += size;
  }
  if (rows.length || !documents.length)
    documents.push(prefix + rows.join("") + suffix);
  return documents;
}
export function sitemapIndex(urls: string[]): string {
  return `${declaration}<sitemapindex xmlns="${namespace}">\n${urls.map((url) => `<sitemap><loc>${escapeSitemapXml(url)}</loc></sitemap>`).join("\n")}\n</sitemapindex>\n`;
}
