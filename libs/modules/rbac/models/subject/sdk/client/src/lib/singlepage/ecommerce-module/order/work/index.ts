"use client";

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
} from "@sps/shared-frontend-client-api";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";

type IReadProps = Parameters<typeof api.orderWork.read>[0];
type IDecisionProps = Parameters<typeof api.orderWork.decision>[0];
type IContentProps = Parameters<typeof api.orderWork.content>[0];

const queryKey = (id: string, orderId: string, taskId: string) =>
  [orderWorkPath(id, orderId), taskId] as const;

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
  return useQuery({
    queryKey: queryKey(props.id, props.orderId, props.taskId),
    queryFn: () => api.orderWork.read(clientRequest(props)),
    enabled:
      props.enabled !== false &&
      Boolean(props.id && props.orderId && props.taskId),
    refetchInterval: (query) =>
      query.state.data?.state === "delivered" ? false : 3000,
  });
}

function decision() {
  return useMutation({
    mutationFn: (props: IDecisionProps) =>
      api.orderWork.decision(clientRequest(props)),
    onSuccess: async (work, props) => {
      queryClient.setQueryData(
        queryKey(props.id, work.orderId, work.taskId),
        work,
      );
      await invalidateRouteQueries(
        queryClient,
        `${route}/${props.id}/ecommerce-module/orders`,
      );
    },
  });
}

function content(props: IContentProps) {
  return api.orderWork.content(clientRequest(props));
}

export const orderWork = { read, decision, content };
