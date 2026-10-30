import {
  route,
  serverHost,
  type IResolvedPageSeo,
  type IPageSeoResult,
  type ISeoPreviewProps,
} from "@sps/host/models/metadata/sdk/model";
import {
  consistencyRequestOptions,
  responsePipe,
  transformResponseItem,
  type NextRequestOptions,
} from "@sps/shared-utils";
import QueryString from "qs";

export interface IResolveSeoProps {
  /** Already unlocalized pathname. */
  url: string;
  language: string;
  options?: Partial<NextRequestOptions>;
}

export async function resolveSeo(
  props: IResolveSeoProps,
): Promise<IResolvedPageSeo> {
  const url = `${serverHost}${route}/seo?${QueryString.stringify({ url: props.url, language: props.language }, { encodeValuesOnly: true })}`;
  const res = await fetch(
    url,
    await consistencyRequestOptions(url, {
      ...props.options,
      next: {
        ...props.options?.next,
        tags: [route, ...(props.options?.next?.tags || [])],
      },
    }),
  );
  const result = await responsePipe<{ data: IResolvedPageSeo }>({ res });
  return transformResponseItem<IResolvedPageSeo>(result);
}

export async function preview(
  props: ISeoPreviewProps,
): Promise<IPageSeoResult> {
  const res = await fetch(`${serverHost}${route}/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(props),
    cache: "no-store",
  });
  const result = await responsePipe<{ data: IPageSeoResult }>({ res });
  return transformResponseItem<IPageSeoResult>(result);
}
