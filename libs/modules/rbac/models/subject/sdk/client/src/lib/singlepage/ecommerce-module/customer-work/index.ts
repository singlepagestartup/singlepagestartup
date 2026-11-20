"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@sps/rbac/models/subject/sdk/server";
import type {
  IAvailabilityProps,
  IAttachmentProps,
  ICommandProps,
  IOrderProps,
  IReadProps,
  IThreadProps,
} from "../../../../../../server/src/lib/singlepage/ecommerce-module/customer-work";
import { clientHost, route } from "@sps/rbac/models/subject/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import {
  invalidateRouteQueries,
  queryClient,
  subscription,
} from "@sps/shared-frontend-client-api";

function path(id: string, storeId: string) {
  return `${route}/${id}/stores/${storeId}/customer-work`;
}

const queryKey = (id: string, storeId: string, taskId: string) =>
  [path(id, storeId), taskId] as const;

export function customerWork(props: IReadProps & { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKey(props.id, props.storeId, props.taskId),
    enabled: props.enabled !== false && Boolean(props.id && props.taskId),
    refetchInterval: (query) =>
      query.state.data?.status === "closed" ? false : 3000,
    queryFn: () =>
      api.customerWork({
        ...props,
        host: props.host ?? clientHost,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
        },
      }),
  });
}

export function customerWorkAvailability(props: IAvailabilityProps) {
  return useQuery({
    queryKey: [
      path(props.id, props.storeId),
      "availability",
      props.offerId,
      props.productId,
    ],
    enabled: Boolean(
      props.id && props.storeId && props.offerId && props.productId,
    ),
    retry: false,
    queryFn: () =>
      api.customerWorkAvailability({
        ...props,
        host: props.host ?? clientHost,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
        },
      }),
  });
}

export function customerWorkForOrder(props: IOrderProps) {
  return useQuery({
    queryKey: [path(props.id, props.storeId), "order", props.orderId],
    enabled: Boolean(props.id && props.storeId && props.orderId),
    retry: false,
    queryFn: () =>
      api.customerWorkForOrder({
        ...props,
        host: props.host ?? clientHost,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
        },
      }),
  });
}

function threadKey(id: string, threadId: string) {
  return [`${route}/${id}/customer-work/threads/${threadId}`];
}

export function customerWorkForThread(props: IThreadProps) {
  const key = threadKey(props.id, props.threadId);
  const scopedRoute = key[0];
  const enabled = Boolean(props.id && props.threadId);
  useEffect(
    () => (enabled ? subscription(scopedRoute, queryClient) : undefined),
    [enabled, scopedRoute],
  );
  return useQuery({
    queryKey: key,
    enabled,
    meta: {
      topics: [
        "crm.tasks",
        "crm.task-events",
        "social.threads-to-crm-module-tasks",
      ],
    },
    retry: false,
    queryFn: ({ signal }) =>
      api.customerWorkForThread({
        ...props,
        host: props.host ?? clientHost,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
          signal,
        },
      }),
  });
}

export function customerWorkAttachment(props: IAttachmentProps) {
  return api.customerWorkAttachment({
    ...props,
    host: props.host ?? clientHost,
    options: {
      ...props.options,
      headers: saturateHeaders(props.options?.headers),
    },
  });
}

export function changeCustomerWork() {
  return useMutation({
    mutationKey: [`${route}/:id/stores/:storeId/customer-work`],
    mutationFn: (props: ICommandProps) =>
      api.changeCustomerWork({
        ...props,
        host: props.host ?? clientHost,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
        },
      }),
    onSuccess: async (result, props) => {
      queryClient.setQueryData(
        queryKey(props.id, result.storeId, result.taskId),
        result,
      );
      queryClient.setQueryData(threadKey(props.id, result.threadId), result);
      if (
        props.data.operation === "add" ||
        props.data.operation === "open-cart-discussion" ||
        props.data.operation === "confirm-cart" ||
        result.cartProposal?.orderId
      ) {
        await invalidateRouteQueries(
          queryClient,
          `${route}/${props.id}/ecommerce-module/orders`,
        );
      }
    },
  });
}
