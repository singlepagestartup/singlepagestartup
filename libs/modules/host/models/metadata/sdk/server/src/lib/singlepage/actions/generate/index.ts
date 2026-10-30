import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { internationalization } from "@sps/shared-configuration";
import { resolveSeoRoute } from "@sps/shared-utils";
import { preview, resolveSeo } from "../seo";
import type { IGeneratePageSeoProps, IPageSeoResult } from "./interface";
import type { IPageSeoResult as ISeoResult } from "@sps/host/models/metadata/sdk/model";
export type { IGeneratePageSeoProps, IPageSeoResult } from "./interface";

function nextMetadata(result: ISeoResult): IPageSeoResult {
  return {
    ...result,
    metadata: {
      ...result.metadata,
      metadataBase: new URL(result.metadata.metadataBase),
    },
  };
}
async function adapt<T>(read: () => Promise<T>): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 404
    )
      notFound();
    throw error;
  }
}
/** Compatibility adapter for concrete URLs that may contain a locale. */
export async function generatePageSeo(
  props: IGeneratePageSeoProps,
): Promise<IPageSeoResult> {
  const route = resolveSeoRoute(
    props.url,
    internationalization.languages.map(({ code }) => code),
    props.language || internationalization.defaultLanguage.code,
  );
  const language = props.language || route.language;
  const result = await adapt(() =>
    props.metadataDraft
      ? preview({ url: props.url, language, metadata: props.metadataDraft })
      : resolveSeo({ url: route.pathname, language, options: props.options }),
  );
  return nextMetadata(result);
}
export async function action(props: IGeneratePageSeoProps): Promise<Metadata> {
  return (await generatePageSeo(props)).metadata;
}
/** Shared per server render, independently from persistent ISR caching. */
export const resolvePageSeo = cache(async (url: string, language: string) => {
  const result = await adapt(() => resolveSeo({ url, language }));
  return { page: result.page, ...nextMetadata(result) };
});
