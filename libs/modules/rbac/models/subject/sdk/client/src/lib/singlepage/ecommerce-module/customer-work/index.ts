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
import {
  clientHost,
  route,
  type ICustomerWorkView,
} from "@sps/rbac/models/subject/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import {
  consistencyQueryKey,
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
  const availabilityPath = path(props.id, props.storeId);
  const host = props.host ?? clientHost;
  const { offerId, productId } = props;
  const enabled = Boolean(props.id && props.storeId && offerId && productId);
  useEffect(
    () => (enabled ? subscription(availabilityPath, queryClient) : undefined),
    [availabilityPath, enabled],
  );
  return useQuery({
    queryKey: consistencyQueryKey(
      availabilityPath,
      { offerId, productId },
      host,
    ),
    enabled,
    meta: {
      topics: [
        "crm.funnels",
        "ecommerce.stores-to-products",
        "ecommerce.stores-to-products-to-attributes",
        "ecommerce.stores-to-attributes",
        "ecommerce.products",
        "ecommerce.products-to-attributes",
        "ecommerce.attributes",
        "ecommerce.attribute-keys-to-attributes",
        "ecommerce.attribute-keys",
        "ecommerce.attributes-to-billing-module-currencies",
        "billing.currencies",
      ],
    },
    retry: false,
    queryFn: ({ signal }) =>
      api.customerWorkAvailability({
        ...props,
        host,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
          signal,
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
  return useQuery<ICustomerWorkView>({
    queryKey: key,
    enabled,
    refetchInterval: (query) =>
      query.state.data?.workflow?.checkoutPromptId ? 3000 : false,
    meta: {
      topics: [
        "crm.funnels",
        "crm.tasks",
        "crm.tasks-to-stages",
        "social.messages",
        "social.threads-to-messages",
        "ecommerce.orders",
        "social.chats-to-crm-module-tasks",
        "social.profiles-to-chats",
        "social.profiles",
        "rbac.subjects-to-ecommerce-module-stores",
        "rbac.subjects-to-social-module-profiles",
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
      queryClient.setQueryData<ICustomerWorkView>(
        threadKey(props.id, result.threadId),
        (current) => ({
          ...result,
          orderSummary:
            result.orderSummary ??
            (current?.taskId === result.taskId &&
            current.orderId === result.orderId &&
            current.offerId === result.offerId
              ? current.orderSummary
              : undefined),
        }),
      );
      if (
        props.data.operation === "add" ||
        props.data.operation === "open-cart-discussion" ||
        props.data.operation === "enter-order-discussion" ||
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
