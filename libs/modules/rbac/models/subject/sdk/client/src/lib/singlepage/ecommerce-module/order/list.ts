"use client";

import { route, clientHost } from "@sps/rbac/models/subject/sdk/model";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
import {
  api,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "@sps/rbac/models/subject/sdk/server";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import {
  queryClient,
  subscription,
  consistencyQueryKey,
} from "@sps/shared-frontend-client-api";
import { useEffect } from "react";

export type IProps = IParentProps["IEcommerceModuleOrderListProps"] & {
  reactQueryOptions?: Partial<UseQueryOptions<any>>;
  mute?: boolean;
};

export type IResult = IParentResult["IEcommerceModuleOrderListResult"];

export function action(props: IProps) {
  const queryKey = `${route}/${props.id}/ecommerce-module/orders`;
  // Preserve order invalidation while accepting additional caller topics.
  const { meta: userMeta, ...restReactQueryOptions } =
    props.reactQueryOptions ?? {};

  useEffect(() => {
    const unsubscribe = subscription(queryKey, queryClient);
    return unsubscribe;
  }, [queryKey]);

  return useQuery<IResult>({
    queryKey: consistencyQueryKey(queryKey, props.params, clientHost),
    // Canonical realtime subscription (issue #195): hand-written SDK
    // queries MUST declare meta.topics — the topic branch disables the
    // legacy route fallback whenever any topic subscriber matches, so a
    // topic-less query would never be invalidated (cart badge bug).
    // Aggregates over orders subscribe to the orders collection topic.
    meta: {
      ...(userMeta ?? {}),
      topics: Array.from(
        new Set([
          "ecommerce.orders",
          ...(props.params?.includePurchaseDetails
            ? [
                "rbac.subjects-to-ecommerce-module-orders",
                "ecommerce.orders-to-billing-module-payment-intents",
                "billing.payment-intents",
                "billing.payment-intents-to-invoices",
                "billing.invoices",
                "ecommerce.orders-to-file-storage-module-files",
                "file-storage.files",
              ]
            : []),
          ...(props.params?.includeCustomerDetails
            ? [
                "rbac.subjects-to-ecommerce-module-orders",
                "ecommerce.orders-to-products",
                "ecommerce.products",
                "ecommerce.products-to-file-storage-module-files",
                "ecommerce.stores-to-products",
                "ecommerce.orders-to-file-storage-module-files",
                "file-storage.files",
                "billing.currencies",
                "billing.payment-intents-to-currencies",
                "rbac.roles-to-permissions",
                "rbac.permissions",
                "billing.payment-intents",
                "billing.payment-intents-to-invoices",
                "billing.invoices",
                "ecommerce.orders-to-billing-module-payment-intents",
                "crm.tasks",
                "social.chats-to-crm-module-tasks",
                "social.chats-to-threads",
                "social.chats",
                "social.profiles-to-chats",
                "social.profiles",
                "social.profiles-to-knowledge-module-sources",
                "knowledge.sources",
                "rbac.subjects-to-social-module-profiles",
                "rbac.subjects-to-roles",
                "rbac.roles",
              ]
            : []),
          ...(props.params?.includeCartDetails
            ? [
                "ecommerce.orders-to-products",
                "ecommerce.stores-to-products",
                "rbac.subjects-to-ecommerce-module-orders",
                "ecommerce.products",
                "ecommerce.products-to-attributes",
                "ecommerce.attributes",
              ]
            : []),
          ...((userMeta?.topics as string[] | undefined) ?? []),
        ]),
      ),
    },
    queryFn: async () => {
      const result = await api.ecommerceModuleOrderList({
        ...props,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
        },
        host: clientHost,
      });

      globalActionsStore.getState().addAction({
        type: "query",
        name: `${route}/${props.id}/ecommerce-module/orders`,
        props: { params: props.params },
        result,
        timestamp: Date.now(),
        requestId: createId(),
      });

      return result;
    },

    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    ...restReactQueryOptions,
  });
}
