import { api as pages } from "@sps/host/models/page/sdk/server";
import { api as metadata } from "@sps/host/models/metadata/sdk/server";
import { insertSchema } from "@sps/host/models/metadata/sdk/model";
import { internationalization } from "@sps/shared-configuration";
import { isSeoIndexablePage, resolveSeoRoute } from "@sps/shared-utils";
import { z } from "zod";
const schema = z.object({
  url: z.string().max(2048).startsWith("/"),
  language: z.string().max(16),
  metadata: insertSchema.partial(),
});
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
/** Read-only preview of public content. Draft values are never persisted. */
export async function POST(request: Request) {
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).length > 65536)
      return Response.json(
        { error: "Preview is too large" },
        { status: 413, headers },
      );
    const parsed = schema.safeParse(JSON.parse(body));
    if (!parsed.success)
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400, headers },
      );
    const input = parsed.data;
    const languages = internationalization.languages.map(({ code }) => code);
    if (!languages.includes(input.language))
      return Response.json(
        { error: "Unknown language" },
        { status: 400, headers },
      );
    const route = resolveSeoRoute(input.url, languages, input.language);
    const page = await pages.findByUrl({
      url: route.pathname,
      language: input.language,
      silentNotFound: true,
    });
    if (
      !page ||
      page.variant === "hidden" ||
      !isSeoIndexablePage({ url: page.url })
    )
      return Response.json(
        { error: "Public page not found" },
        { status: 404, headers },
      );
    return Response.json(
      await metadata.generatePageSeo({
        url: route.pathname,
        language: input.language,
        page,
        metadataDraft: input.metadata,
      }),
      { headers },
    );
  } catch (error) {
    if (error instanceof SyntaxError)
      return Response.json({ error: "Invalid JSON" }, { status: 400, headers });
    const absent =
      error &&
      typeof error === "object" &&
      "digest" in error &&
      error.digest === "NEXT_HTTP_ERROR_FALLBACK;404";
    return Response.json(
      {
        error: absent
          ? "Public page not found"
          : "Preview is temporarily unavailable",
      },
      { status: absent ? 404 : 503, headers },
    );
  }
}
