import {
  route,
  serverHost,
  type IPublicResourceIdsParams,
} from "@sps/rbac/models/role/sdk/model";
import {
  consistencyRequestOptions,
  responsePipe,
  transformResponseItem,
  type NextRequestOptions,
} from "@sps/shared-utils";
import QueryString from "qs";

export interface IProps {
  params: IPublicResourceIdsParams;
  host?: string;
  options?: Partial<NextRequestOptions>;
}
export type IResult = string[];

export async function action({
  params,
  host = serverHost,
  options,
}: IProps): Promise<IResult> {
  const url = `${host}${route}/public-resource-ids?${QueryString.stringify(params, { encodeValuesOnly: true })}`;
  const res = await fetch(
    url,
    await consistencyRequestOptions(url, {
      ...options,
      cache: "no-store",
      headers: { "Cache-Control": "no-store", ...options?.headers },
      next: { ...options?.next },
    }),
  );
  const json = await responsePipe<{ data: IResult }>({ res });
  if (
    !Array.isArray(json?.data) ||
    !json.data.every((id) => typeof id === "string")
  ) {
    throw new Error("Invalid public resource ID response");
  }
  return transformResponseItem<IResult>(json);
}
