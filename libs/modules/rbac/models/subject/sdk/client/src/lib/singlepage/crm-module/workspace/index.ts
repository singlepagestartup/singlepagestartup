"use client";

import { useEffect } from "react";
import {
  useMutation,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import { createId } from "@paralleldrive/cuid2";
import { api as serverApi } from "@sps/rbac/models/subject/sdk/server";
import { storeProductsPath } from "@sps/rbac/models/subject/sdk/server/src/lib/singlepage/ecommerce-module/catalog";
import {
  clientHost,
  route,
  type ICrmWorkspaceConversation,
  type ICrmWorkspaceFunnel,
  type ICrmWorkspaceStore,
  type ICrmWorkspaceStoreListItem,
  type TCrmWorkspaceCommand,
  type ICrmWorkspaceThreadQuery,
  type ICrmWorkspaceThreadMessage,
} from "@sps/rbac/models/subject/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import {
  consistencyQueryKey,
  invalidateRouteQueries,
  queryClient,
  subscription,
} from "@sps/shared-frontend-client-api";
import { globalActionsStore } from "@sps/shared-frontend-client-store";

type TReaders = Omit<
  typeof serverApi.crmWorkspace,
  "command" | "send" | "attachment" | "artifact"
>;
type TReader = keyof TReaders;
type TProps<R extends TReader> = Parameters<TReaders[R]>[0];
type TResult<R extends TReader> = Awaited<ReturnType<TReaders[R]>>;

const topics = [
  "rbac.subjects",
  "rbac.subjects-to-ecommerce-module-stores",
  "rbac.subjects-to-social-module-profiles",
  "ecommerce.stores",
  "ecommerce.products",
  "ecommerce.stores-to-products",
  "ecommerce.orders",
  "crm.funnels",
  "crm.tasks",
  "crm.tasks-to-stages",
  "crm.stages",
  "crm.funnels-to-stages",
  "crm.funnels-to-tasks",
  "crm.tasks-to-ecommerce-module-stores-to-products",
  "crm.tasks-to-ecommerce-module-orders",
  "rbac.subjects-to-crm-module-tasks",
  "rbac.subjects-to-ecommerce-module-products",
  "social.chats-to-crm-module-tasks",
  "social.threads",
  "social.chats",
  "social.chats-to-threads",
  "social.profiles",
  "social.profiles-to-skills",
  "billing.transactions",
];

function workspaceRoute(id: string) {
  return `${route}/${id}/crm-module/workspace`;
}

function useWorkspaceQuery<R extends TReader>(
  operation: R,
  props: TProps<R>,
  enabled = true,
) {
  const key = `${workspaceRoute(props.id)}/${operation}`;
  const read = serverApi.crmWorkspace[operation] as (
    input: TProps<R>,
  ) => Promise<TResult<R>>;
  const defaultTopics = [...topics];
  if (
    operation === "tasks" ||
    operation === "detail" ||
    operation === "employee"
  ) {
    defaultTopics.push("social.profiles-to-chats");
  }
  if (
    operation === "stores" ||
    operation === "overview" ||
    operation === "employees" ||
    operation === "funnels"
  ) {
    defaultTopics.push("rbac.roles", "rbac.subjects-to-roles");
  }
  if (operation === "funnels") {
    defaultTopics.push("crm.funnels-to-ecommerce-module-stores-to-products");
  }
  if (operation === "overview") {
    defaultTopics.push("ecommerce.stores-to-orders");
  }
  if (operation === "order") {
    defaultTopics.push(
      "rbac.subjects-to-ecommerce-module-orders",
      "social.profiles-to-chats",
      "rbac.roles",
    );
  }
  if (["customer", "customers", "orders"].includes(operation)) {
    defaultTopics.push(
      "rbac.subjects-to-ecommerce-module-orders",
      "rbac.roles",
      "ecommerce.stores-to-orders",
      "rbac.subjects-to-roles",
    );
  }
  if (operation === "order") {
    defaultTopics.push(
      "ecommerce.stores-to-orders",
      "rbac.subjects-to-roles",
      "ecommerce.orders-to-products",
      "ecommerce.products",
      "ecommerce.stores-to-products",
      "ecommerce.orders-to-billing-module-payment-intents",
      "billing.payment-intents",
      "billing.payment-intents-to-currencies",
      "billing.payment-intents-to-invoices",
      "billing.currencies",
      "billing.invoices",
    );
  }
  if (operation === "detail") {
    defaultTopics.push(
      "ecommerce.stores-to-orders",
      "social.messages",
      "social.threads-to-messages",
      "social.chats-to-messages",
      "social.profiles-to-messages",
    );
  }
  useEffect(() => subscription(key, queryClient), [key]);

  return useQuery<TResult<R>>({
    enabled: Boolean(props.id) && enabled,
    queryKey: consistencyQueryKey(key, props.params, clientHost),
    meta: {
      topics:
        operation === "thread"
          ? [
              "social.messages",
              "social.threads-to-messages",
              "social.chats-to-messages",
              "social.profiles-to-messages",
              "social.messages-to-file-storage-module-files",
              "social.actions",
              "social.threads-to-actions",
              "social.chats-to-actions",
              "social.profiles-to-actions",
              "social.profiles-to-chats",
              ...topics,
            ]
          : defaultTopics,
    },
    queryFn: ({ signal }) =>
      read({
        ...props,
        host: clientHost,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
          signal,
        },
      }),
  });
}

function useCommand(id: string) {
  return useMutation({
    mutationKey: [`${workspaceRoute(id)}/command`],
    mutationFn: (data: TCrmWorkspaceCommand) =>
      serverApi.crmWorkspace.command({
        id,
        data,
        params: undefined,
        host: clientHost,
        options: { headers: saturateHeaders() },
      }),
    async onSuccess(result, command) {
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${workspaceRoute(id)}/command`,
        props: { kind: command.kind },
        result: { kind: result.kind, id: result.data.id },
        timestamp: Date.now(),
        requestId: createId(),
      });
      if ("definition" in result.data && "funnel" in command) {
        const saved = result.data;
        queryClient.setQueryData<ICrmWorkspaceFunnel>(
          consistencyQueryKey(
            `${workspaceRoute(id)}/funnel`,
            { storeId: saved.storeId, funnelSlug: saved.slug },
            clientHost,
          ),
          (current) =>
            current && current.revision > saved.revision ? current : saved,
        );
      }
      const invalidations = [
        invalidateRouteQueries(queryClient, workspaceRoute(id)),
      ];
      if (result.kind === "create-employee-thread") {
        invalidations.push(
          invalidateRouteQueries(
            queryClient,
            `${route}/${id}/social-module/chats/${result.data.chatId}/threads`,
          ),
        );
      }
      if (command.kind === "save" || command.kind === "save-funnel-settings") {
        invalidations.push(
          invalidateRouteQueries(
            queryClient,
            `${route}/${id}/ecommerce-module/${storeProductsPath(command.funnel.storeId)}`,
          ),
        );
      }
      await Promise.all(invalidations);
      if (
        result.kind === "create-employee" ||
        result.kind === "open-employee-chat" ||
        result.kind === "join-task-chat" ||
        result.kind === "start-work" ||
        result.kind === "open-order-work"
      ) {
        await invalidateRouteQueries(
          queryClient,
          `${route}/${id}/social-module/profiles`,
        );
      }
      if (result.kind === "start-work") {
        await invalidateRouteQueries(
          queryClient,
          `${route}/${id}/ecommerce-module/orders`,
        );
      }
    },
  });
}

function useSend(id: string, params?: ICrmWorkspaceThreadQuery) {
  const key = `${workspaceRoute(id)}/thread`;
  return useMutation({
    mutationKey: [key],
    mutationFn: (data: ICrmWorkspaceThreadMessage) => {
      if (!params) {
        throw new Error("The task conversation is unavailable");
      }
      return serverApi.crmWorkspace.send({
        id,
        params,
        data,
        host: clientHost,
        options: { headers: saturateHeaders() },
      });
    },
    onSuccess: (message) => {
      const queryKey = consistencyQueryKey(key, params, clientHost);
      queryClient.setQueryData<ICrmWorkspaceConversation>(
        queryKey,
        (current) => {
          if (
            !current ||
            current.messages.some(({ id }) => id === message.id)
          ) {
            return current;
          }
          return { ...current, messages: [...current.messages, message] };
        },
      );
    },
  });
}

function useStores(id: string): UseQueryResult<ICrmWorkspaceStoreListItem[]>;
function useStores(
  id: string,
  storeSlug?: string,
  tasks?: boolean,
): UseQueryResult<ICrmWorkspaceStore[]>;
function useStores(id: string, storeSlug?: string, tasks = false) {
  return useWorkspaceQuery(
    "stores",
    {
      id,
      params:
        storeSlug === undefined
          ? undefined
          : { storeSlug, ...(tasks && { tasks }) },
    },
    storeSlug !== "",
  );
}

export const crmWorkspace = {
  useStores,
  useOptions: (id: string, storeId?: string, view?: "editor") =>
    useWorkspaceQuery(
      "options",
      { id, params: { storeId: storeId ?? "", ...(view && { view }) } },
      Boolean(storeId),
    ),
  useFunnelProducts: (props: TProps<"funnelProducts">) =>
    useWorkspaceQuery("funnelProducts", props, Boolean(props.params.storeId)),
  useOverview: (props: TProps<"overview">) =>
    useWorkspaceQuery("overview", props, Boolean(props.params.storeId)),
  useCustomers: (props: TProps<"customers">) =>
    useWorkspaceQuery("customers", props, Boolean(props.params.storeId)),
  useCustomer: (props: TProps<"customer">) =>
    useWorkspaceQuery(
      "customer",
      props,
      Boolean(props.params.storeId && props.params.customerId),
    ),
  useOrders: (props: TProps<"orders">) =>
    useWorkspaceQuery("orders", props, Boolean(props.params.storeId)),
  useOrder: (props: TProps<"order">) =>
    useWorkspaceQuery(
      "order",
      props,
      Boolean(props.params.storeId && props.params.orderId),
    ),
  useEmployees: (props: TProps<"employees">) =>
    useWorkspaceQuery("employees", props, Boolean(props.params.storeId)),
  useEmployee: (props: TProps<"employee">) =>
    useWorkspaceQuery(
      "employee",
      props,
      Boolean(props.params.storeId && props.params.subjectId),
    ),
  useFunnels: (props: TProps<"funnels">) =>
    useWorkspaceQuery("funnels", props, Boolean(props.params.storeId)),
  useFunnel: (props: TProps<"funnel">) =>
    useWorkspaceQuery(
      "funnel",
      props,
      Boolean(props.params.storeId && props.params.funnelSlug),
    ),
  useTasks: (props: TProps<"tasks">, enabled: boolean) =>
    useWorkspaceQuery("tasks", props, enabled && Boolean(props.params.storeId)),
  useDetail: (props: TProps<"detail">) =>
    useWorkspaceQuery(
      "detail",
      props,
      Boolean(props.params.storeId && props.params.taskId),
    ),
  useIntake: (id: string, storeId: string) =>
    useWorkspaceQuery("intake", { id, params: { storeId } }, Boolean(storeId)),
  useThread: (id: string, params: ICrmWorkspaceThreadQuery) =>
    useWorkspaceQuery("thread", { id, params }),
  attachment: (
    id: string,
    params: ICrmWorkspaceThreadQuery & {
      messageId: string;
      attachmentId: string;
    },
    preview?: { signal?: AbortSignal; maxBytes?: number },
  ) =>
    serverApi.crmWorkspace.attachment({
      id,
      params,
      host: clientHost,
      options: { headers: saturateHeaders(), signal: preview?.signal },
      maxBytes: preview?.maxBytes,
    }),
  artifact: (
    id: string,
    params: ICrmWorkspaceThreadQuery & { artifactId: string },
    preview?: { signal?: AbortSignal; maxBytes?: number },
  ) =>
    serverApi.crmWorkspace.artifact({
      id,
      params,
      host: clientHost,
      options: { headers: saturateHeaders(), signal: preview?.signal },
      maxBytes: preview?.maxBytes,
    }),
  useCommand,
  useSend,
};
