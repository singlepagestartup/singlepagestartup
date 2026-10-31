import { NEXT_PUBLIC_HOST_SERVICE_URL } from "@sps/shared-utils";

export const revalidate = 60;
export async function GET() {
  const origin = new URL(NEXT_PUBLIC_HOST_SERVICE_URL).origin;
  // Page variants supply noindex in HTML. Crawling stays allowed so robots can read it.
  return new Response(
    "User-agent: *\nAllow: /\n\nSitemap: " + origin + "/sitemap.xml\n",
    {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=60",
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}
