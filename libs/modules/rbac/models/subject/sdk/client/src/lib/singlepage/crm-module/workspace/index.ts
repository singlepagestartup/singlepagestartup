"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createId } from "@paralleldrive/cuid2";
import { api as serverApi } from "@sps/rbac/models/subject/sdk/server";
import {
  clientHost,
  route,
  type TCrmWorkspaceCommand,
} from "@sps/rbac/models/subject/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import {
  consistencyQueryKey,
  invalidateRouteQueries,
  queryClient,
  subscription,
} from "@sps/shared-frontend-client-api";
import { globalActionsStore } from "@sps/shared-frontend-client-store";

type TReaders = Omit<typeof serverApi.crmWorkspace, "command">;
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
  "crm.funnel-publications",
  "crm.tasks",
  "crm.task-events",
  "social.threads-to-crm-module-tasks",
  "social.threads",
  "social.profiles",
  "social.profiles-to-skills",
  "rbac.subjects-to-wallet-operations",
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
  useEffect(() => subscription(key, queryClient), [key]);

  return useQuery<TResult<R>>({
    enabled: Boolean(props.id) && enabled,
    queryKey: consistencyQueryKey(key, props.params, clientHost),
    meta: { topics },
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
      await invalidateRouteQueries(queryClient, workspaceRoute(id));
      if (
        result.kind === "create-employee" ||
        result.kind === "open-employee-chat"
      ) {
        await invalidateRouteQueries(
          queryClient,
          `${route}/${id}/social-module/profiles`,
        );
      }
      if (result.kind === "refresh-test") {
        await invalidateRouteQueries(
          queryClient,
          `${route}/${id}/customer-work/threads/${result.data.threadId}`,
        );
      }
    },
  });
}

export const crmWorkspace = {
  useStores: (id: string) =>
    useWorkspaceQuery("stores", { id, params: undefined }),
  useOptions: (id: string, storeId?: string) =>
    useWorkspaceQuery(
      "options",
      { id, params: { storeId: storeId ?? "" } },
      Boolean(storeId),
    ),
  useFunnels: (props: TProps<"funnels">) =>
    useWorkspaceQuery("funnels", props, Boolean(props.params.storeId)),
  usePublications: (props: TProps<"publications">) =>
    useWorkspaceQuery(
      "publications",
      props,
      Boolean(props.params.storeId && props.params.funnelId),
    ),
  useTasks: (props: TProps<"tasks">, enabled: boolean) =>
    useWorkspaceQuery("tasks", props, enabled && Boolean(props.params.storeId)),
  useDetail: (props: TProps<"detail">) =>
    useWorkspaceQuery(
      "detail",
      props,
      Boolean(props.params.storeId && props.params.taskId),
    ),
  useCommand,
};
