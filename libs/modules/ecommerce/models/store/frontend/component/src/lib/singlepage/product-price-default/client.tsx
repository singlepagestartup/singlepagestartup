"use client";
import { useEffect, useState } from "react";
import { api as storesToProductsApi } from "@sps/ecommerce/relations/stores-to-products/sdk/client";
import { api as billingModuleCurrencyApi } from "@sps/billing/models/currency/sdk/client";
import { api as storeApi } from "@sps/ecommerce/models/store/sdk/client";
import { selectRetailOffer } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
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
  const selectedOffer = selectRetailOffer({
    offers: offers.data ?? [],
    product: props.product,
    storeId: props.storeId,
    offerId: props.offerId,
  });
  const offerId = selectedOffer?.id ?? "";
  const [fallback, setFallback] = useState({ offerId: "", currencyId: "" });
  const fallbackCurrencyId =
    fallback.offerId === offerId ? fallback.currencyId : "";
  const currencyId = props.billingModuleCurrencyId ?? fallbackCurrencyId;
  const quantity = props.readOnly ? 1 : (props.quantity ?? 1);
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
  const store = storeApi.findById({
    ...props.apiProps,
    id: selectedOffer?.storeId ?? "",
    reactQueryOptions: {
      enabled: Boolean(props.readOnly && selectedOffer?.storeId),
    },
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
    offerId &&
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
  if (props.readOnly && selectedOffer?.storeId && store.error) {
    throw store.error;
  }
  const currentStore =
    selectedOffer?.storeId && store.data?.id === selectedOffer.storeId
      ? store.data
      : undefined;
  const currentCurrency =
    currencyId && currency.data?.id === currencyId ? currency.data : undefined;
  return (
    <ChildComponent
      isServer={false}
      variant={props.variant}
      product={props.product}
      language={props.language}
      className={props.className}
      readOnly={props.readOnly}
      quote={current}
      selectedOffer={selectedOffer}
      storeTitle={
        props.readOnly && currentStore
          ? currentStore.title?.[props.language] ||
            currentStore.title?.en ||
            currentStore.slug ||
            (props.language === "ru" ? "Магазин" : "Store")
          : undefined
      }
      currencySymbol={
        currentCurrency?.symbol || currentCurrency?.slug?.toUpperCase()
      }
      pending={
        offers.isPending ||
        Boolean(offerId && quote.isPending) ||
        Boolean(currencyId && currency.isPending)
      }
    />
  );
}
