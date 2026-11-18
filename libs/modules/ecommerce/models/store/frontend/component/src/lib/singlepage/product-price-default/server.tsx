"use server";
import "server-only";
import { api as storesToProductsApi } from "@sps/ecommerce/relations/stores-to-products/sdk/server";
import { api as billingModuleCurrencyApi } from "@sps/billing/models/currency/sdk/server";
import { api as storeApi } from "@sps/ecommerce/models/store/sdk/server";
import { selectRetailOffer } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
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
  const selectedOffer = selectRetailOffer({
    offers: offers ?? [],
    product: props.product,
    storeId: props.storeId,
    offerId: props.offerId,
  });
  const offerId = selectedOffer?.id;
  const quantity = props.readOnly ? 1 : (props.quantity ?? 1);
  let currencyId = props.billingModuleCurrencyId ?? "";
  let quote;
  if (offerId) {
    quote = await storesToProductsApi.quote({
      ...props.apiProps,
      data: { offerId, quantity, currencyId },
    });
    if (!props.billingModuleCurrencyId && quote.currencyIds[0]) {
      currencyId = quote.currencyIds[0];
      quote = await storesToProductsApi.quote({
        ...props.apiProps,
        data: { offerId, quantity, currencyId },
      });
    }
  }
  const currency = currencyId
    ? await billingModuleCurrencyApi.findById({
        ...props.apiProps,
        id: currencyId,
      })
    : undefined;
  const store =
    props.readOnly && selectedOffer?.storeId
      ? await storeApi.findById({
          ...props.apiProps,
          id: selectedOffer.storeId,
        })
      : undefined;
  return (
    <ChildComponent
      isServer={true}
      variant={props.variant}
      product={props.product}
      language={props.language}
      className={props.className}
      readOnly={props.readOnly}
      quote={quote}
      selectedOffer={selectedOffer}
      storeTitle={
        store
          ? store.title?.[props.language] ||
            store.title?.en ||
            store.slug ||
            (props.language === "ru" ? "Магазин" : "Store")
          : undefined
      }
      currencySymbol={currency?.symbol || currency?.slug?.toUpperCase()}
      pending={false}
    />
  );
}
