"use client";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  api,
  type IProps as IServerProps,
} from "@sps/ecommerce/relations/stores-to-products/sdk/server";
import {
  type IOfferQuote,
  clientHost,
  route,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import { consistencyQueryKey } from "@sps/shared-frontend-client-api";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";

export type IProps = IServerProps["IQuoteProps"] & {
  reactQueryOptions?: Partial<UseQueryOptions<IOfferQuote>>;
};
export function action(props: IProps) {
  const url = route + "/" + props.data.offerId + "/quote";
  return useQuery<IOfferQuote>({
    ...props.reactQueryOptions,
    queryKey: consistencyQueryKey(url, { ...props.data }, clientHost),
    meta: {
      ...props.reactQueryOptions?.meta,
      topics: [
        "ecommerce.stores-to-products",
        "ecommerce.offers-to-offers",
        "ecommerce.attributes",
        "ecommerce.orders-to-billing-module-payment-intents",
      ],
    },
    queryFn: async () => {
      const headers = saturateHeaders(props.options?.headers);
      return api.quote({
        ...props,
        host: clientHost,
        options: { ...props.options, headers },
      });
    },
  });
}
