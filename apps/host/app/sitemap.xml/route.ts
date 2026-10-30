import {
  NEXT_PUBLIC_HOST_SERVICE_URL,
  getSeoCanonicalUrl,
  sitemapDocuments,
  sitemapIndex,
} from "@sps/shared-utils";
import { internationalization } from "@sps/shared-configuration";
import { api as hostModulePageApi } from "@sps/host/models/page/sdk/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const pages = await hostModulePageApi.urls({});
    if (!pages) throw new Error("Page enumeration unavailable");

    const languages = internationalization.languages.map(({ code }) => code);
    const urls = new Set<string>();
    for (const page of pages) {
      const pathname = `/${page.url.join("/")}`;
      const language =
        page.language || internationalization.defaultLanguage.code;
      if (!languages.includes(language)) continue;
      urls.add(
        getSeoCanonicalUrl({
          origin: NEXT_PUBLIC_HOST_SERVICE_URL,
          pathname,
          language,
        }),
      );
    }
    const documents = sitemapDocuments([...urls].sort());
    const part = new URL(request.url).searchParams.get("part");
    if (
      part !== null &&
      (!/^[1-9]\d*$/.test(part) || Number(part) > documents.length)
    )
      return new Response("Sitemap part not found", {
        status: 404,
        headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
      });
    const body =
      part !== null
        ? documents[Number(part) - 1]
        : documents.length === 1
          ? documents[0]
          : sitemapIndex(
              documents.map(
                (_, index) =>
                  new URL(
                    `/sitemap.xml?part=${index + 1}`,
                    NEXT_PUBLIC_HOST_SERVICE_URL,
                  ).href,
              ),
            );
    return new Response(body, {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=60",
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  } catch {
    return new Response("Sitemap temporarily unavailable", {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": "60",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}
