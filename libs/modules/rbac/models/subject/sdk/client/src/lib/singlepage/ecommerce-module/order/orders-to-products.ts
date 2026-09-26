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
import { queryClient, subscription } from "@sps/shared-frontend-client-api";
import QueryString from "qs";
import { useEffect } from "react";

export type IProps =
  IParentProps["IEcommerceModuleOrderOrdersToProductsProps"] & {
    reactQueryOptions?: Partial<UseQueryOptions<any>>;
    mute?: boolean;
  };

export type IResult =
  IParentResult["IEcommerceModuleOrderOrdersToProductsResult"];

export function action(props: IProps) {
  const queryKey = `${route}/${props.id}/ecommerce-module/orders/orders-to-products`;
  // Merge caller meta last but never let it clobber topics (issue #195): a
  // project passing reactQueryOptions.meta must not silently drop the realtime
  // topic subscription.
  const { meta: userMeta, ...restReactQueryOptions } =
    props.reactQueryOptions ?? {};

  useEffect(() => {
    const unsubscribe = subscription(queryKey, queryClient);
    return unsubscribe;
  }, [queryKey]);

  return useQuery<IResult>({
    // Params are part of the key, as in the factory list query: the cart card
    // and the update and delete actions of one order share a query, and other
    // filters get their own (issue #349).
    queryKey: [
      queryKey,
      props.params
        ? QueryString.stringify(props.params, {
            encodeValuesOnly: true,
          })
        : undefined,
    ],
    // Canonical realtime subscription (issue #195). The lines of the subject's
    // orders change with the orders and with the lines themselves.
    meta: {
      topics: ["ecommerce.orders", "ecommerce.orders-to-products"],
      ...(userMeta ?? {}),
    },
    queryFn: async () => {
      const result = await api.ecommerceModuleOrderOrdersToProducts({
        ...props,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
        },
        host: clientHost,
      });

      return result;
    },
    select(data) {
      globalActionsStore.getState().addAction({
        type: "query",
        name: `${route}/${props.id}/ecommerce-module/orders/orders-to-products`,
        props: this,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });

      return data;
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    ...restReactQueryOptions,
  });
}
