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

export type IProps =
  IParentProps["IEcommerceModuleOrdersToProductsListProps"] & {
    reactQueryOptions?: Partial<UseQueryOptions<any>>;
    mute?: boolean;
  };

export type IResult =
  IParentResult["IEcommerceModuleOrdersToProductsListResult"];

export function action(props: IProps) {
  const queryKey = `${route}/${props.id}/ecommerce-module/orders-to-products`;
  // Preserve order invalidation while accepting additional caller topics.
  const { meta: userMeta, ...restReactQueryOptions } =
    props.reactQueryOptions ?? {};

  useEffect(() => {
    const unsubscribe = subscription(queryKey, queryClient);
    return unsubscribe;
  }, [queryKey]);

  return useQuery<IResult>({
    queryKey: consistencyQueryKey(queryKey, props.params, clientHost),
    meta: {
      ...(userMeta ?? {}),
      topics: Array.from(
        new Set([
          "ecommerce.orders",
          "ecommerce.orders-to-products",
          "rbac.subjects-to-ecommerce-module-orders",
          "ecommerce.products",
          "ecommerce.products-to-attributes",
          "ecommerce.attributes",
          ...((userMeta?.topics as string[] | undefined) ?? []),
        ]),
      ),
    },
    queryFn: async () => {
      const result = await api.ecommerceModuleOrdersToProductsList({
        ...props,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
        },
        host: clientHost,
      });

      globalActionsStore.getState().addAction({
        type: "query",
        name: `${route}/${props.id}/ecommerce-module/orders-to-products`,
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
