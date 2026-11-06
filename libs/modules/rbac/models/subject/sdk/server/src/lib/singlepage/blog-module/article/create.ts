import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import type {
  IArticleCreateInput,
  IArticleCreateResult,
} from "@sps/rbac/models/subject/sdk/model/src/lib/blog-article-create";
import {
  type NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";

export interface IProps {
  id: string;
  data: IArticleCreateInput;
  host?: string;
  options?: Partial<NextRequestOptions>;
}
export type IResult = IArticleCreateResult;

export async function action(props: IProps): Promise<IResult> {
  const { id, data, host = serverHost, options } = props;
  const headers: Record<string, string> = {};
  const source = options?.headers;
  if (Array.isArray(source)) {
    for (const [name, value] of source) headers[name] = value;
  } else if (
    source &&
    "forEach" in source &&
    typeof source.forEach === "function"
  ) {
    source.forEach((value: string, name: string) => {
      headers[name] = value;
    });
  } else if (source) Object.assign(headers, source);
  for (const name of Object.keys(headers))
    if (name.toLowerCase() === "content-type") delete headers[name];
  headers["Content-Type"] = "application/json";
  const requestOptions: NextRequestOptions = {
    credentials: "include",
    ...options,
    method: "POST",
    cache: "no-store",
    headers,
    body: JSON.stringify({ data }),
    next: { ...options?.next, revalidate: 0, cache: "no-store" },
  };
  const res = await fetch(
    `${host}${route}/${encodeURIComponent(id)}/blog-module/articles`,
    requestOptions,
  );
  const json = await responsePipe<{ data: IResult }>({ res });
  return transformResponseItem<IResult>(json);
}
