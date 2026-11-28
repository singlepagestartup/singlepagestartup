"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@sps/rbac/models/subject/sdk/server";
import {
  clientHost,
  orderWorkPath,
  route,
} from "@sps/rbac/models/subject/sdk/model";
import {
  invalidateRouteQueries,
  queryClient,
  subscription,
} from "@sps/shared-frontend-client-api";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";

type IReadProps = Parameters<typeof api.orderWork.read>[0];
type IDecisionProps = Parameters<typeof api.orderWork.decision>[0];
type IContentProps = Parameters<typeof api.orderWork.content>[0];
type IKnowledgeProps = Parameters<typeof api.orderWork.setArtifactKnowledge>[0];

const queryKey = ({ id, orderId, taskId, storeId }: IReadProps) =>
  [orderWorkPath(id, orderId), taskId, storeId] as const;

function clientRequest<
  T extends { host?: string; options?: IReadProps["options"] },
>(props: T): T {
  return {
    ...props,
    host: props.host ?? clientHost,
    options: {
      ...props.options,
      headers: saturateHeaders(props.options?.headers),
    },
  };
}

function read(props: IReadProps & { enabled?: boolean }) {
  const path = orderWorkPath(props.id, props.orderId);
  const enabled =
    props.enabled !== false &&
    Boolean(props.id && props.orderId && props.taskId && props.storeId);
  useEffect(
    () => (enabled ? subscription(path, queryClient) : undefined),
    [enabled, path],
  );
  return useQuery({
    queryKey: queryKey(props),
    queryFn: () => api.orderWork.read(clientRequest(props)),
    enabled,
    meta: {
      topics: ["ecommerce.orders"],
    },
    refetchInterval: ({ state }) => {
      const status = (state.error as { status?: number } | null)?.status;
      return state.data?.state === "delivered" ||
        [401, 403, 404].includes(status ?? 0)
        ? false
        : 3000;
    },
  });
}

function decision() {
  return useMutation({
    mutationFn: (props: IDecisionProps) =>
      api.orderWork.decision(clientRequest(props)),
    onSuccess: async (work, props) => {
      queryClient.setQueryData(
        queryKey({
          id: props.id,
          orderId: work.orderId,
          taskId: work.taskId,
          storeId: work.storeId,
        }),
        work,
      );
      await Promise.all([
        invalidateRouteQueries(
          queryClient,
          `${route}/${props.id}/ecommerce-module/orders`,
        ),
        invalidateRouteQueries(
          queryClient,
          `${route}/${props.id}/customer-work`,
        ),
      ]);
    },
  });
}

function content(props: IContentProps) {
  return api.orderWork.content(clientRequest(props));
}

function setArtifactKnowledge() {
  return useMutation({
    mutationFn: (props: IKnowledgeProps) =>
      api.orderWork.setArtifactKnowledge(clientRequest(props)),
    onSuccess: async ({ profileId }, { id }) => {
      await Promise.all([
        invalidateRouteQueries(
          queryClient,
          `${route}/${id}/ecommerce-module/orders`,
        ),
        invalidateRouteQueries(
          queryClient,
          `${route}/${id}/social-module/profiles/${profileId}/knowledge/sources/personal`,
        ),
      ]);
    },
  });
}

export const orderWork = { read, decision, content, setArtifactKnowledge };
