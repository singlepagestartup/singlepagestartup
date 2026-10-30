import { RoutingService } from "@sps/host/models/page/backend/app/api/src/lib/service/singlepage/routing";
import type { IModel as IMetadata } from "@sps/host/models/metadata/sdk/model";
import { api as metadataApi } from "@sps/host/models/metadata/sdk/server";
import type { IResolvedPage } from "@sps/host/models/page/sdk/model";
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
} from "@sps/shared-utils";
import type { IGeneratePageSeoProps } from "./interface";
import type {
  IPageSeoResult,
  IResolvedPageSeo,
  ISeoMetadata,
  ISeoPreviewProps,
} from "@sps/host/models/page/sdk/model";
import { createMetadataContext } from "./content";
import {
  absoluteHttpUrl,
  meaningfulPageText,
  plainText,
  notFound,
} from "./utils";

interface IPageReader {
  findByUrl: (props: { url: string }) => Promise<IResolvedPage | undefined>;
}

export class SeoService {
  routing = new RoutingService();
  constructor(private readonly pages: IPageReader) {}
  private async assemble(
    props: IGeneratePageSeoProps,
  ): Promise<IPageSeoResult> {
    const language =
      props.language || internationalization.defaultLanguage.code;
    const route = { pathname: props.url };
    const page =
      props.page ||
      (await this.pages.findByUrl({
        url: route.pathname,
      }));
    if (!page || ["hidden", "draft"].includes(page.variant)) notFound();
    const pageId = page.id;
    const canonical = getSeoCanonicalUrl({
      origin: NEXT_PUBLIC_HOST_SERVICE_URL,
      pathname: route.pathname,
      language,
    });
    const indexable = isSeoIndexablePage(page);
    const base: ISeoMetadata = {
      metadataBase: new URL(NEXT_PUBLIC_HOST_SERVICE_URL).href,
      alternates: { canonical },
      robots: { index: indexable, follow: true },
    };
    const options = props.metadataDraft
      ? { ...props.options, cache: "no-store" as const }
      : props.options;
    const context = createMetadataContext(page, language, this.routing);
    const [primaries, links] = await Promise.all([
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
            and: [{ column: "pageId", method: "eq", value: page.id }],
          },
          orderBy: {
            and: [
              { column: "orderIndex", method: "asc" },
              { column: "id", method: "asc" },
            ],
          },
        },
      }),
    ]);
    if (!primaries || !links)
      throw new Error("SEO metadata response is unavailable");
    const primary = primaries.find((entry) => entry.variant === "primary");
    let selected: IMetadata | undefined;
    for (const link of links) {
      const records = await metadataApi.find({
        options,
        params: {
          filters: {
            and: [{ column: "id", method: "eq", value: link.metadataId }],
          },
        },
      });
      if (!records) throw new Error("Linked SEO metadata is unavailable");
      selected = records.find((entry) => entry.id === link.metadataId);
      if (selected) break;
    }
    if (props.metadataDraft)
      selected = { id: "preview", ...props.metadataDraft } as IMetadata;
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
              resolve: (reference) => context.resolve(reference),
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
      meaningfulPageText(page.title, "Page") || siteTitle,
    );
    let description = await text(
      selected?.description,
      meaningfulPageText(page.description, "Description") || siteDescription,
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
      await text(primary?.keywords, undefined, true),
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
    const twitterCard =
      (selected?.twitterCard || primary?.twitterCard) === "summary" ||
      !twitterImage
        ? "summary"
        : "summary_large_image";
    const icon = absoluteHttpUrl(
      NEXT_PUBLIC_HOST_METADATA_ICON,
      NEXT_PUBLIC_HOST_SERVICE_URL,
    );
    const metadata: ISeoMetadata = {
      ...base,
      title,
      description,
      ...(author ? { authors: [{ name: author }] } : {}),
      ...(keywords.length ? { keywords } : {}),
      ...(icon ? { icons: [{ url: icon }] } : {}),
      openGraph: {
        title: await text(selected?.opengraphTitle, title),
        description: await text(selected?.opengraphDescription, description),
        type: selected?.opengraphType === "article" ? "article" : "website",
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
    const structuredData: Record<string, unknown>[] =
      indexable && title
        ? [
            {
              "@context": "https://schema.org",
              "@type": "WebPage",
              "@id": canonical + "#page",
              url: canonical,
              name: title,
              ...(description ? { description } : {}),
              ...(image ? { image: image.url } : {}),
              inLanguage: language,
            },
          ]
        : [];
    return { metadata, structuredData, diagnostics };
  }

  async generate(props: IGeneratePageSeoProps): Promise<IPageSeoResult> {
    const route = resolveSeoRoute(
      props.url,
      internationalization.languages.map(({ code }) => code),
      props.language || internationalization.defaultLanguage.code,
    );
    return this.assemble({
      ...props,
      url: route.pathname,
      language: props.language || route.language,
    });
  }

  /** A concrete URL supplies locale; a bare path uses the configured default. */
  async resolve(url: string): Promise<IResolvedPageSeo> {
    const route = resolveSeoRoute(
      url,
      internationalization.languages.map(({ code }) => code),
      internationalization.defaultLanguage.code,
    );
    const page = await this.pages.findByUrl({ url: route.pathname });
    if (!page) notFound();
    const seo = await this.assemble({
      url: route.pathname,
      language: route.language,
      page,
      options: { cache: "no-store" },
    });
    return { page, ...seo };
  }

  async preview(props: ISeoPreviewProps): Promise<IPageSeoResult> {
    const route = resolveSeoRoute(
      props.url,
      internationalization.languages.map(({ code }) => code),
      internationalization.defaultLanguage.code,
    );
    const page = await this.pages.findByUrl({ url: route.pathname });
    if (!page) notFound();
    return this.assemble({
      url: route.pathname,
      language: route.language,
      page,
      metadataDraft: props.metadata,
      options: { cache: "no-store" },
    });
  }
}
