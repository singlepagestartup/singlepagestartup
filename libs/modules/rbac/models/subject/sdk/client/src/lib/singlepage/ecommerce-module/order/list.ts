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
import { useActiveSocialModuleProfile } from "../../social-module/profile/active-selection";

export type IProps = IParentProps["IEcommerceModuleOrderListProps"] & {
  reactQueryOptions?: Partial<UseQueryOptions<any>>;
  mute?: boolean;
};

export type IResult = IParentResult["IEcommerceModuleOrderListResult"];

export function action(props: IProps) {
  const active = useActiveSocialModuleProfile(
    props.id,
    props.params?.socialModuleProfileId,
    props.options,
  );
  const params = {
    ...props.params,
    socialModuleProfileId:
      props.params?.socialModuleProfileId || active.socialModuleProfileId,
  };
  const queryKey = `${route}/${props.id}/ecommerce-module/orders`;
  // Preserve order invalidation while accepting additional caller topics.
  const { meta: userMeta, ...restReactQueryOptions } =
    props.reactQueryOptions ?? {};

  useEffect(() => {
    const unsubscribe = subscription(queryKey, queryClient);
    return unsubscribe;
  }, [queryKey]);

  return useQuery<IResult>({
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
          "social.profiles-to-ecommerce-module-orders",
          ...(props.params?.includeCartDetails
            ? [
                "ecommerce.orders-to-products",
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
      if (!params.socialModuleProfileId) return [];
      const result = await api.ecommerceModuleOrderList({
        ...props,
        params,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
        },
        host: clientHost,
      });

      globalActionsStore.getState().addAction({
        type: "query",
        name: `${route}/${props.id}/ecommerce-module/orders`,
        props: { params },
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
    queryKey: consistencyQueryKey(queryKey, params, clientHost),
    enabled: active.isSuccess && (restReactQueryOptions.enabled ?? true),
    placeholderData: undefined,
  });
}
