"use client";
import { useEffect, useState } from "react";
import { api as storesToProductsApi } from "@sps/ecommerce/relations/stores-to-products/sdk/client";
import { api as billingModuleCurrencyApi } from "@sps/billing/models/currency/sdk/client";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  const offers = storesToProductsApi.find({
    ...props.apiProps,
    params: {
      filters: {
        and: [
          { column: "productId", method: "eq", value: props.product.id },
          { column: "variant", method: "eq", value: "default" },
          ...(props.storeId
            ? [{ column: "storeId", method: "eq", value: props.storeId }]
            : []),
        ],
      },
    },
    reactQueryOptions: { enabled: Boolean(props.product.id) },
  });
  const eligible = (offers.data ?? []).filter(
    (offer) =>
      offer.productId === props.product.id &&
      offer.variant === "default" &&
      offer.settings?.initialGrant !== true &&
      (!props.storeId || offer.storeId === props.storeId) &&
      (props.product.kind !== "service" || offer.settings.standalone === true),
  );
  const offerId = props.offerId
    ? (eligible.find((offer) => offer.id === props.offerId)?.id ?? "")
    : eligible.length === 1
      ? eligible[0].id
      : "";
  const [fallback, setFallback] = useState({ offerId: "", currencyId: "" });
  const fallbackCurrencyId =
    fallback.offerId === offerId ? fallback.currencyId : "";
  const currencyId = props.billingModuleCurrencyId ?? fallbackCurrencyId;
  const quantity = props.quantity ?? 1;
  const quote = storesToProductsApi.quote({
    ...props.apiProps,
    data: { offerId, quantity, currencyId },
    reactQueryOptions: { enabled: Boolean(offerId) },
  });
  const currency = billingModuleCurrencyApi.findById({
    ...props.apiProps,
    id: currencyId,
    reactQueryOptions: { enabled: Boolean(currencyId) },
  });

  useEffect(() => {
    if (
      !props.billingModuleCurrencyId &&
      quote.data?.offerId === offerId &&
      !quote.data.currencyIds.includes(fallbackCurrencyId)
    ) {
      const nextCurrencyId = quote.data.currencyIds[0] ?? "";
      if (nextCurrencyId !== fallbackCurrencyId) {
        setFallback({ offerId, currencyId: nextCurrencyId });
      }
    }
  }, [props.billingModuleCurrencyId, quote.data, offerId, fallbackCurrencyId]);

  const current =
    quote.data?.offerId === offerId &&
    quote.data.productId === props.product.id &&
    quote.data.quantity === quantity &&
    quote.data.currencyId === currencyId
      ? quote.data
      : undefined;
  if (offers.error) {
    throw offers.error;
  }
  if (offerId && quote.error) {
    throw quote.error;
  }
  if (currencyId && currency.error) {
    throw currency.error;
  }
  return (
    <ChildComponent
      isServer={false}
      variant={props.variant}
      product={props.product}
      language={props.language}
      className={props.className}
      quote={current}
      currencySymbol={currency.data?.symbol}
      pending={offers.isPending || Boolean(offerId && quote.isPending)}
      selectionRequired={!offerId && eligible.length > 1}
    />
  );
}
