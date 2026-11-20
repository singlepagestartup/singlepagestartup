import { route, serverHost } from "@sps/rbac/models/subject/sdk/model";
import type { IPage } from "@sps/crm/models/funnel/sdk/model";
import type {
  ICrmWorkspaceFunnel,
  ICrmWorkspaceFunnelQuery,
  ICrmWorkspaceOptions,
  ICrmWorkspacePublication,
  ICrmWorkspacePublicationQuery,
  ICrmWorkspaceStore,
  ICrmWorkspaceTask,
  ICrmWorkspaceTaskDetail,
  ICrmWorkspaceTaskDetailQuery,
  ICrmWorkspaceTaskQuery,
  TCrmWorkspaceCommand,
  TCrmWorkspaceCommandResult,
} from "@sps/rbac/models/subject/sdk/model/src/lib/crm-workspace";
import {
  responsePipe,
  transformResponseItem,
  type NextRequestOptions,
} from "@sps/shared-utils";

export interface IRequest<P = undefined> {
  id: string;
  params: P;
  host?: string;
  options?: Partial<NextRequestOptions>;
}

type TParams = Record<string, string | number | boolean | undefined>;

async function request<T>(
  path: string,
  props: IRequest<TParams | undefined>,
  data?: TCrmWorkspaceCommand,
): Promise<T> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(props.params ?? {})) {
    if (value !== undefined) {
      query.set(key, String(value));
    }
  }

  const queryString = query.toString();
  const headers = new Headers(props.options?.headers);
  headers.set("Cache-Control", "no-store");
  const requestOptions: NextRequestOptions = {
    credentials: "include",
    ...props.options,
    headers,
    cache: "no-store",
    method: "GET",
    next: { revalidate: 0 },
  };

  if (data) {
    requestOptions.method = "POST";
    headers.set("Content-Type", "application/json");
    requestOptions.body = JSON.stringify({ data });
  } else {
    headers.set("X-SPS-Consistency", "1");
  }

  const res = await fetch(
    `${props.host ?? serverHost}${route}/${encodeURIComponent(props.id)}/crm-module/workspace/${path}${queryString ? `?${queryString}` : ""}`,
    requestOptions,
  );
  const json = await responsePipe<{ data: T }>({ res });
  return transformResponseItem<T>(json);
}

export const crmWorkspace = {
  stores: (props: IRequest) => request<ICrmWorkspaceStore[]>("stores", props),
  options: (props: IRequest<{ storeId: string }>) =>
    request<ICrmWorkspaceOptions>("options", {
      ...props,
      params: { ...props.params },
    }),
  funnels: (props: IRequest<ICrmWorkspaceFunnelQuery>) =>
    request<IPage<ICrmWorkspaceFunnel>>("funnels", {
      ...props,
      params: { ...props.params },
    }),
  publications: (props: IRequest<ICrmWorkspacePublicationQuery>) =>
    request<IPage<ICrmWorkspacePublication>>("publications", {
      ...props,
      params: { ...props.params },
    }),
  tasks: (props: IRequest<ICrmWorkspaceTaskQuery>) =>
    request<IPage<ICrmWorkspaceTask>>("tasks", {
      ...props,
      params: { ...props.params },
    }),
  detail: (props: IRequest<ICrmWorkspaceTaskDetailQuery>) =>
    request<ICrmWorkspaceTaskDetail>("detail", {
      ...props,
      params: { ...props.params },
    }),
  command: (props: IRequest & { data: TCrmWorkspaceCommand }) =>
    request<TCrmWorkspaceCommandResult>("command", props, props.data),
};
