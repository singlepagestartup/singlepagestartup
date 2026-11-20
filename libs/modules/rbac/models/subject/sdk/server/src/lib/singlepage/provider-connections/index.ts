import { route, serverHost } from "@sps/rbac/models/subject/sdk/model";
import type {
  IConnectionCommand,
  IProviderSettings,
} from "@sps/rbac/models/subject/sdk/model/src/lib/provider-connections";
import {
  responsePipe,
  transformResponseItem,
  type NextRequestOptions,
} from "@sps/shared-utils";

export interface IProps {
  id: string;
  storeId: string;
  before?: string;
  host?: string;
  options?: Partial<NextRequestOptions>;
}
export interface IChangeProps extends IProps {
  data: IConnectionCommand;
}
export type IResult = IProviderSettings;
export interface IChangeResult {
  id: string;
}

async function request<T>(
  props: IProps,
  data?: IConnectionCommand,
): Promise<T> {
  const headers = new Headers(props.options?.headers);
  headers.set("Content-Type", "application/json");
  const path = [props.id, "stores", props.storeId, "provider-connections"]
    .map(encodeURIComponent)
    .join("/");
  const url = new URL(`${props.host ?? serverHost}${route}/${path}`);
  if (!data && props.before) {
    url.searchParams.set("before", props.before);
  }
  const res = await fetch(url.toString(), {
    ...props.options,
    method: data ? "POST" : "GET",
    credentials: "include",
    headers,
    cache: "no-store",
    body: data ? JSON.stringify({ data }) : undefined,
  });
  return transformResponseItem<T>(await responsePipe<{ data: T }>({ res }));
}
export function providerConnections(props: IProps) {
  return request<IResult>(props);
}
export function changeProviderConnection(props: IChangeProps) {
  return request<IChangeResult>(props, props.data);
}
