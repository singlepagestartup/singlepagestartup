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
import { STALE_TIME } from "@sps/shared-utils";
import { useEffect } from "react";

export type IProps = IParentProps["IEcommerceModuleOrderTotalProps"] & {
  reactQueryOptions?: Partial<UseQueryOptions<any>>;
  mute?: boolean;
};

export type IResult = IParentResult["IEcommerceModuleOrderTotalResult"];

export function action(props: IProps) {
  const queryKey = `${route}/${props.id}/ecommerce-module/orders/total`;
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
    queryKey: [queryKey],
    // Canonical realtime subscription (issue #195): hand-written SDK
    // queries MUST declare meta.topics — the topic branch disables the
    // legacy route fallback whenever any topic subscriber matches, so a
    // topic-less query would never be invalidated (cart badge bug).
    // Aggregates over orders subscribe to the orders collection topic.
    meta: {
      topics: ["ecommerce.orders"],
      ...(userMeta ?? {}),
    },
    queryFn: async () => {
      const result = await api.ecommerceModuleOrderTotal({
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
        name: `${route}/${props.id}/ecommerce-module/orders/total`,
        props: this,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });

      return data;
    },
    staleTime: STALE_TIME,
    ...restReactQueryOptions,
  });
}
