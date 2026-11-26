import type { IChatMessage } from "@sps/social/models/message/sdk/model";
import { route, serverHost } from "@sps/rbac/models/subject/sdk/model";
import type { IPage } from "@sps/crm/models/funnel/sdk/model";
import type {
  ICrmWorkspaceConversation,
  ICrmWorkspaceOrderPage,
  ICrmWorkspaceCustomerPage,
  ICrmWorkspaceCustomer,
  ICrmWorkspaceCustomerQuery,
  ICrmWorkspaceOrderDetail,
  ICrmWorkspaceOrderQuery,
  ICrmWorkspaceOverview,
  ICrmWorkspaceStorePageQuery,
  ICrmWorkspaceEmployeeDetailQuery,
  ICrmWorkspaceEmployeeListQuery,
  ICrmWorkspaceEmployeePage,
  ICrmWorkspaceEmployeeProfile,
  ICrmWorkspaceFunnel,
  ICrmWorkspaceFunnelBySlugQuery,
  ICrmWorkspaceFunnelQuery,
  ICrmWorkspaceFunnelPage,
  ICrmWorkspaceOptions,
  ICrmWorkspaceProduct,
  ICrmWorkspaceFunnelProductsQuery,
  ICrmWorkspaceOffer,
  ICrmWorkspaceThreadMessage,
  ICrmWorkspaceThreadQuery,
  ICrmWorkspaceStore,
  ICrmWorkspaceStoreListItem,
  ICrmWorkspaceStoreQuery,
  ICrmWorkspaceTask,
  ICrmWorkspaceTaskDetail,
  ICrmWorkspaceTaskDetailQuery,
  ICrmWorkspaceTaskQuery,
  TCrmWorkspaceCommand,
  TCrmWorkspaceCommandResult,
} from "@sps/rbac/models/subject/sdk/model/src/lib/crm-workspace";
import {
  responsePipe,
  readChatAttachmentBlob,
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
  data?: TCrmWorkspaceCommand | FormData,
): Promise<T> {
  const res = await fetch(
    workspaceUrl(path, props),
    requestOptions(props, data),
  );
  const json = await responsePipe<{ data: T }>({ res });
  return transformResponseItem<T>(json);
}

function workspaceUrl(path: string, props: IRequest<TParams | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(props.params ?? {})) {
    if (value !== undefined) {
      query.set(key, String(value));
    }
  }

  const queryString = query.toString();
  return `${props.host ?? serverHost}${route}/${encodeURIComponent(props.id)}/crm-module/workspace/${path}${queryString ? `?${queryString}` : ""}`;
}

function requestOptions(
  props: IRequest<TParams | undefined>,
  data?: TCrmWorkspaceCommand | FormData,
): NextRequestOptions {
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
    if (data instanceof FormData) {
      requestOptions.body = data;
    } else {
      headers.set("Content-Type", "application/json");
      requestOptions.body = JSON.stringify({ data });
    }
  } else {
    headers.set("X-SPS-Consistency", "1");
  }

  return requestOptions;
}

async function requestFile(
  path: "attachment" | "artifact",
  props: IRequest<TParams> & { maxBytes?: number },
) {
  const res = await fetch(workspaceUrl(path, props), requestOptions(props));
  if (!res.ok) {
    await responsePipe({ res });
    throw new Error("Conversation file is unavailable");
  }
  return readChatAttachmentBlob(res, props.maxBytes);
}

export const crmWorkspace = {
  stores: <P extends ICrmWorkspaceStoreQuery | undefined>(props: IRequest<P>) =>
    request<
      P extends undefined ? ICrmWorkspaceStoreListItem[] : ICrmWorkspaceStore[]
    >("stores", {
      ...props,
      params: props.params && { ...props.params },
    }),
  options: (props: IRequest<{ storeId: string; view?: "editor" }>) =>
    request<ICrmWorkspaceOptions>("options", {
      ...props,
      params: { ...props.params },
    }),
  funnelProducts: (props: IRequest<ICrmWorkspaceFunnelProductsQuery>) =>
    request<{ items: ICrmWorkspaceProduct[]; total: number }>("options", {
      ...props,
      params: { ...props.params, view: "products" },
    }),
  overview: (props: IRequest<{ storeId: string }>) =>
    request<ICrmWorkspaceOverview>("overview", props),
  orders: (
    props: IRequest<ICrmWorkspaceStorePageQuery & { customerId?: string }>,
  ) =>
    request<ICrmWorkspaceOrderPage>("orders", {
      ...props,
      params: { ...props.params },
    }),
  order: (props: IRequest<ICrmWorkspaceOrderQuery>) =>
    request<ICrmWorkspaceOrderDetail>("order", {
      ...props,
      params: { ...props.params },
    }),
  customers: (props: IRequest<ICrmWorkspaceStorePageQuery>) =>
    request<ICrmWorkspaceCustomerPage>("customers", {
      ...props,
      params: { ...props.params },
    }),
  customer: (props: IRequest<ICrmWorkspaceCustomerQuery>) =>
    request<ICrmWorkspaceCustomer>("customer", {
      ...props,
      params: { ...props.params },
    }),
  employees: (props: IRequest<ICrmWorkspaceEmployeeListQuery>) =>
    request<ICrmWorkspaceEmployeePage>("employees", {
      ...props,
      params: { ...props.params },
    }),
  employee: (props: IRequest<ICrmWorkspaceEmployeeDetailQuery>) =>
    request<ICrmWorkspaceEmployeeProfile>("employee", {
      ...props,
      params: { ...props.params },
    }),
  funnels: (props: IRequest<ICrmWorkspaceFunnelQuery>) =>
    request<ICrmWorkspaceFunnelPage>("funnels", {
      ...props,
      params: { ...props.params },
    }),
  funnel: (props: IRequest<ICrmWorkspaceFunnelBySlugQuery>) =>
    request<ICrmWorkspaceFunnel>("funnel", {
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
  intake: (props: IRequest<{ storeId: string }>) =>
    request<ICrmWorkspaceOffer[]>("intake", props),
  thread: (props: IRequest<ICrmWorkspaceThreadQuery>) =>
    request<ICrmWorkspaceConversation>("thread", {
      ...props,
      params: { ...props.params },
    }),
  send: (
    props: IRequest<ICrmWorkspaceThreadQuery> & {
      data: ICrmWorkspaceThreadMessage;
    },
  ) => {
    const form = new FormData();
    form.append("text", props.data.text);
    form.append("operationKey", props.data.operationKey);
    for (const file of props.data.files ?? []) {
      form.append("files", file);
    }
    return request<IChatMessage>(
      "thread",
      { ...props, params: { ...props.params } },
      form,
    );
  },
  attachment: (
    props: IRequest<
      ICrmWorkspaceThreadQuery & { messageId: string; attachmentId: string }
    > & { maxBytes?: number },
  ) => requestFile("attachment", { ...props, params: { ...props.params } }),
  artifact: (
    props: IRequest<ICrmWorkspaceThreadQuery & { artifactId: string }> & {
      maxBytes?: number;
    },
  ) => requestFile("artifact", { ...props, params: { ...props.params } }),
  command: (props: IRequest & { data: TCrmWorkspaceCommand }) =>
    request<TCrmWorkspaceCommandResult>("command", props, props.data),
};
