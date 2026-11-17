"use client";
import { useMemo } from "react";
import { createId } from "@paralleldrive/cuid2";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  api,
  type IProps as IServerProps,
} from "@sps/ecommerce/relations/stores-to-products/sdk/server";
import {
  clientHost,
  route,
  type IAddressSuggestionsResult,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";

export type IProps = IServerProps["IAddressSuggestionsProps"] & {
  reactQueryOptions?: Partial<UseQueryOptions<IAddressSuggestionsResult>>;
};

export function action(props: IProps) {
  // Address text stays in this short-lived request, outside shared consistency metadata.
  const requestId = useMemo(
    () => createId(),
    [props.data.offerId, props.data.query, props.data.language],
  );
  return useQuery<IAddressSuggestionsResult>({
    ...props.reactQueryOptions,
    queryKey: [
      route + "/" + props.data.offerId + "/address-suggestions",
      requestId,
      clientHost,
    ],
    staleTime: Math.min(
      Math.max(
        typeof props.reactQueryOptions?.staleTime === "number"
          ? props.reactQueryOptions.staleTime
          : 30_000,
        0,
      ),
      30_000,
    ),
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async ({ signal }) =>
      api.addressSuggestions({
        data: props.data,
        host: clientHost,
        options: {
          ...props.options,
          signal,
          headers: saturateHeaders(props.options?.headers),
        },
      }),
  });
}
