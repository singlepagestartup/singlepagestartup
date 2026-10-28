import {
  NEXT_PUBLIC_HOST_SERVICE_URL,
  SEO_TRACKING_PARAMETERS,
} from "@sps/shared-utils";

export const revalidate = 60;

export async function GET() {
  const origin = new URL(NEXT_PUBLIC_HOST_SERVICE_URL).origin;
  // Application pages remain crawlable so their noindex response can be read.
  // Content selectors such as segment, intent and offer are not tracking fields.
  const body = `User-agent: *\nAllow: /\n\nUser-agent: Yandex\nAllow: /\nClean-param: ${SEO_TRACKING_PARAMETERS.join("&")} /\n\nSitemap: ${origin}/sitemap.xml\n`;
  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=60",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
