"use server";
import "server-only";
import { api as storesToProductsApi } from "@sps/ecommerce/relations/stores-to-products/sdk/server";
import { api as billingModuleCurrencyApi } from "@sps/billing/models/currency/sdk/server";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";

export async function Component(props: IComponentProps) {
  const offers = props.product.id
    ? await storesToProductsApi.find({
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
      })
    : [];
  const eligible = (offers ?? []).filter(
    (offer) =>
      offer.productId === props.product.id &&
      offer.variant === "default" &&
      offer.settings?.initialGrant !== true &&
      (!props.storeId || offer.storeId === props.storeId) &&
      (props.product.kind !== "service" || offer.settings.standalone === true),
  );
  const offerId = props.offerId
    ? eligible.find((offer) => offer.id === props.offerId)?.id
    : eligible.length === 1
      ? eligible[0].id
      : undefined;
  let currencyId = props.billingModuleCurrencyId ?? "";
  let quote;
  if (offerId) {
    quote = await storesToProductsApi.quote({
      ...props.apiProps,
      data: { offerId, quantity: props.quantity ?? 1, currencyId },
    });
    if (!props.billingModuleCurrencyId && quote.currencyIds[0]) {
      currencyId = quote.currencyIds[0];
      quote = await storesToProductsApi.quote({
        ...props.apiProps,
        data: { offerId, quantity: props.quantity ?? 1, currencyId },
      });
    }
  }
  const currency = currencyId
    ? await billingModuleCurrencyApi.findById({
        ...props.apiProps,
        id: currencyId,
      })
    : undefined;
  return (
    <ChildComponent
      isServer={true}
      variant={props.variant}
      product={props.product}
      language={props.language}
      className={props.className}
      quote={quote}
      currencySymbol={currency?.symbol}
      pending={false}
      selectionRequired={!offerId && eligible.length > 1}
    />
  );
}
