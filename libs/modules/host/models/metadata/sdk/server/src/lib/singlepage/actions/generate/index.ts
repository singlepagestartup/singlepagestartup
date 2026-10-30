import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { api as metadataApi } from "../../crud";
import type { IModel as IMetadata } from "@sps/host/models/metadata/sdk/model";
import { api as pageApi } from "@sps/host/models/page/sdk/server";
import { api as pagesToMetadataApi } from "@sps/host/relations/pages-to-metadata/sdk/server";
import { internationalization } from "@sps/shared-configuration";
import {
  NEXT_PUBLIC_HOST_METADATA_TITLE,
  NEXT_PUBLIC_HOST_METADATA_DESCRIPTION,
  NEXT_PUBLIC_HOST_METADATA_ICON,
  NEXT_PUBLIC_HOST_SERVICE_URL,
  resolveSeoRoute,
  getSeoCanonicalUrl,
  isSeoIndexablePage,
  renderMetadataTemplate,
  MetadataMaskError,
  isHiddenRecord,
} from "@sps/shared-utils";
import type { IGeneratePageSeoProps, IPageSeoResult } from "./interface";
import { createMetadataContext } from "./content";
import { absoluteHttpUrl, meaningfulPageText, plainText } from "./utils";
export type { IGeneratePageSeoProps, IPageSeoResult } from "./interface";

async function assemblePageSeo(
  props: IGeneratePageSeoProps,
): Promise<IPageSeoResult> {
  const language = props.language || internationalization.defaultLanguage.code;
  const route = { pathname: props.url };
  const page =
    props.page ||
    (await pageApi.findByUrl({
      url: route.pathname,
      language,
      options: props.options,
    }));
  if (!page || isHiddenRecord(page)) notFound();
  const pageId = page.id;
  const canonical = getSeoCanonicalUrl({
    origin: NEXT_PUBLIC_HOST_SERVICE_URL,
    pathname: route.pathname,
    language,
  });
  const publicRoute = isSeoIndexablePage({ url: page.url });
  const indexable = publicRoute && page.indexing !== "noindex";
  const base: Metadata = {
    metadataBase: new URL(NEXT_PUBLIC_HOST_SERVICE_URL),
    alternates: { canonical },
    robots: { index: indexable, follow: publicRoute },
  };
  if (!publicRoute)
    return {
      metadata: {
        ...base,
        title:
          meaningfulPageText(page.title, "Page") ||
          NEXT_PUBLIC_HOST_METADATA_TITLE,
      },
      structuredData: [],
    };
  const options = props.metadataDraft
    ? { ...props.options, cache: "no-store" as const }
    : props.options;
  const context = createMetadataContext(page, language, options);
  const [primaries, links, content] = await Promise.all([
    metadataApi.find({
      options,
      params: {
        filters: {
          and: [{ column: "variant", method: "eq", value: "primary" }],
        },
        orderBy: { and: [{ column: "id", method: "asc" }] },
      },
    }),
    pagesToMetadataApi.find({
      options,
      params: {
        filters: {
          and: [
            { column: "pageId", method: "eq", value: page.id },
            { column: "variant", method: "ne", value: "hidden" },
          ],
        },
        orderBy: {
          and: [
            { column: "orderIndex", method: "asc" },
            { column: "id", method: "asc" },
          ],
        },
      },
    }),
    context.content(),
  ]);
  if (!primaries || !links)
    throw new Error("SEO metadata response is unavailable");
  const primary = primaries.find((entry) => entry.variant === "primary");
  let selected: IMetadata | undefined;
  for (const link of links) {
    if (isHiddenRecord(link)) continue;
    const records = await metadataApi.find({
      options,
      params: {
        filters: {
          and: [
            { column: "id", method: "eq", value: link.metadataId },
            { column: "variant", method: "ne", value: "hidden" },
          ],
        },
      },
    });
    if (!records) throw new Error("Linked SEO metadata is unavailable");
    selected = records.find(
      (entry) => entry.id === link.metadataId && !isHiddenRecord(entry),
    );
    if (selected) break;
  }
  if (props.metadataDraft)
    selected = isHiddenRecord(props.metadataDraft)
      ? undefined
      : ({ id: "preview", ...props.metadataDraft } as IMetadata);
  const diagnostics: string[] = [];
  if (selected || primary) context.setMetadata((selected || primary)!);
  async function text(
    value: string | null | undefined,
    fallback?: string,
    list = false,
  ): Promise<string | undefined> {
    if (!value?.trim()) return fallback;
    try {
      return (
        plainText(
          await renderMetadataTemplate(value, {
            language,
            list,
            resolve: context.resolve,
          }),
        ) || fallback
      );
    } catch (error) {
      if (!(error instanceof MetadataMaskError)) throw error;
      diagnostics.push(error.message);
      console.warn("Metadata mask could not be resolved", {
        pageId,
        language,
        reason: error.message,
      });
      return fallback;
    }
  }
  const siteTitle = await text(
    primary?.title,
    plainText(NEXT_PUBLIC_HOST_METADATA_TITLE),
  );
  const siteDescription = await text(
    primary?.description,
    plainText(NEXT_PUBLIC_HOST_METADATA_DESCRIPTION),
  );
  let title = await text(
    selected?.title,
    content?.seoTitle ||
      content?.title ||
      meaningfulPageText(page.title, "Page") ||
      siteTitle,
  );
  let description = await text(
    selected?.description,
    content?.seoDescription ||
      content?.description ||
      meaningfulPageText(page.description, "Description") ||
      siteDescription,
  );
  const pagination = Object.entries(page.routeParams || {}).find(([key]) =>
    key.includes(":pagination:"),
  )?.[1];
  if (pagination && /^\d+$/.test(pagination) && Number(pagination) > 1) {
    const label =
      language === "ru" ? `Страница ${pagination}` : `Page ${pagination}`;
    if (title) title = `${title} — ${label}`;
    if (description) description = `${description} ${label}.`;
  }
  const explicitImage = absoluteHttpUrl(
    await text(selected?.opengraphImage),
    canonical,
  );
  const selectedImage =
    !explicitImage && selected && selected.id !== "preview"
      ? await context.metadataImage(selected)
      : undefined;
  const primaryImage =
    !explicitImage && !selectedImage && primary
      ? await context.metadataImage(primary)
      : undefined;
  const primaryImageUrl =
    !explicitImage && !selectedImage && !primaryImage
      ? absoluteHttpUrl(await text(primary?.opengraphImage), canonical)
      : undefined;
  const image = explicitImage
    ? { url: explicitImage }
    : selectedImage ||
      primaryImage ||
      (primaryImageUrl ? { url: primaryImageUrl } : undefined);
  const twitterImageUrl = absoluteHttpUrl(
    await text(selected?.twitterImage),
    canonical,
  );
  const twitterImage = twitterImageUrl ? { url: twitterImageUrl } : image;
  if (!image) diagnostics.push("No social cover is configured for this page");
  const twitterSite = await text(
    selected?.twitterSite,
    await text(primary?.twitterSite),
  );
  const twitterCreator = await text(
    selected?.twitterCreator,
    await text(primary?.twitterCreator),
  );
  const opengraphLocale = await text(selected?.opengraphLocale);
  const author = await text(selected?.author, await text(primary?.author));
  const keywordsText = await text(
    selected?.keywords,
    content?.keywords?.join(", ") ||
      (!content ? await text(primary?.keywords, undefined, true) : undefined),
    true,
  );
  const keywords = [
    ...new Set(
      (keywordsText || "")
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean),
    ),
  ];
  const article = content?.kind === "article";
  const twitterCard =
    (selected?.twitterCard || primary?.twitterCard) === "summary" ||
    !twitterImage
      ? "summary"
      : "summary_large_image";
  const icon = absoluteHttpUrl(
    NEXT_PUBLIC_HOST_METADATA_ICON,
    NEXT_PUBLIC_HOST_SERVICE_URL,
  );
  const metadata: Metadata = {
    ...base,
    title,
    description,
    ...(author ? { authors: [{ name: author }] } : {}),
    ...(keywords.length ? { keywords } : {}),
    ...(icon ? { icons: [{ url: icon }] } : {}),
    openGraph: {
      title: await text(selected?.opengraphTitle, title),
      description: await text(selected?.opengraphDescription, description),
      type:
        selected?.opengraphType === "article" ||
        (!selected?.opengraphType && article)
          ? "article"
          : "website",
      url:
        absoluteHttpUrl(await text(selected?.opengraphUrl), canonical) ||
        canonical,
      siteName: await text(
        selected?.opengraphSiteName,
        await text(primary?.opengraphSiteName, siteTitle),
      ),
      ...(opengraphLocale ? { locale: opengraphLocale } : {}),
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: twitterCard,
      title: await text(selected?.twitterTitle, title),
      description: await text(selected?.twitterDescription, description),
      ...(twitterSite ? { site: twitterSite } : {}),
      ...(twitterCreator ? { creator: twitterCreator } : {}),
      ...(twitterImage ? { images: [twitterImage] } : {}),
    },
  };
  const structuredData: Record<string, unknown>[] = [];
  if (indexable && content?.title && content.kind !== "profile")
    structuredData.push({
      "@context": "https://schema.org",
      "@type": article
        ? "BlogPosting"
        : content.kind === "product"
          ? "Product"
          : "CollectionPage",
      "@id": `${canonical}#${content.kind}`,
      url: canonical,
      ...(article
        ? { headline: content.title, mainEntityOfPage: canonical }
        : { name: content.title }),
      ...(content.description ? { description: content.description } : {}),
      ...(content.image ? { image: content.image.url } : {}),
      inLanguage: language,
    });
  return { metadata, structuredData, diagnostics };
}

/** Compatibility entrypoint for concrete URLs that may include a locale. */
export async function generatePageSeo(
  props: IGeneratePageSeoProps,
): Promise<IPageSeoResult> {
  const route = resolveSeoRoute(
    props.url,
    internationalization.languages.map(({ code }) => code),
    props.language || internationalization.defaultLanguage.code,
  );
  return assemblePageSeo({
    ...props,
    url: route.pathname,
    language: props.language || route.language,
  });
}

export async function action(props: IGeneratePageSeoProps): Promise<Metadata> {
  return (await generatePageSeo(props)).metadata;
}

/** Resolve once per server render for both the document head and Page view. */
export const resolvePageSeo = cache(async (url: string, language: string) => {
  const page = await pageApi.findByUrl({ url, language, silentNotFound: true });
  if (!page) notFound();
  const seo = await assemblePageSeo({ url, language, page });
  return { page, ...seo };
});
