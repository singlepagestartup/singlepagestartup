import {
  serverHost,
  route,
  type IAuthorFindParams,
  type IAuthorFilters,
  type IAuthorSummary,
  type IAuthorDetail,
} from "@sps/social/models/profile/sdk/model";
import {
  type NextRequestOptions,
  responsePipe,
  consistencyRequestOptions,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";

interface IRequestProps {
  host?: string;
  options?: Partial<NextRequestOptions>;
}
export interface IAuthorFindProps extends IRequestProps {
  params?: IAuthorFindParams;
}
export interface IAuthorFindCountProps extends IRequestProps {
  params?: IAuthorFilters;
}
export interface IAuthorFindByIdProps extends IRequestProps {
  id: string;
}
export type IAuthorFindResult = IAuthorSummary[];
export type IAuthorFindCountResult = number;
export type IAuthorFindByIdResult = IAuthorDetail | null;

async function request<T>(
  props: IRequestProps & { path: string; params?: object },
): Promise<T> {
  const { host = serverHost, options, path, params } = props;
  const query = QueryString.stringify(params, { encodeValuesOnly: true });
  const url = `${host}${route}/authors${path}${query ? `?${query}` : ""}`;
  const res = await fetch(
    url,
    await consistencyRequestOptions(url, {
      credentials: "include",
      ...options,
      method: "GET",
      next: { ...options?.next },
    }),
  );
  const json = await responsePipe<{ data: T }>({ res });
  return transformResponseItem<T>(json);
}
export function authorFind(
  props: IAuthorFindProps = {},
): Promise<IAuthorFindResult> {
  return request({ ...props, path: "" });
}
export function authorFindCount(
  props: IAuthorFindCountProps = {},
): Promise<IAuthorFindCountResult> {
  return request({ ...props, path: "/count" });
}
export function authorFindById(
  props: IAuthorFindByIdProps,
): Promise<IAuthorFindByIdResult> {
  return request({ ...props, path: `/${encodeURIComponent(props.id)}` });
}
