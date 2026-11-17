import { memo } from "react";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
import type { IComponentPropsExtended } from "./interface";

export const Component = memo(function CartCard(
  props: IComponentPropsExtended,
) {
  const details = props.cartDetails;
  const lines = details?.lines.filter((line) => !line.parentLineId) ?? [];
  const singleProduct = lines.length === 1 && Boolean(lines[0].product);
  const ru = props.language === "ru";
  const currencyId = details?.billingModuleCurrencyId;
  const totals =
    currencyId && details?.availableCurrencyIds?.includes(currencyId)
      ? details.totals.filter(
          (entry) => entry.billingModuleCurrency.id === currencyId,
        )
      : [];
  const hasUnpriced = Boolean(details?.unpriced?.length);
  const amount = totals.length ? (
    <span className="max-w-full wrap-anywhere text-right text-lg font-semibold leading-tight tracking-tight text-foreground tabular-nums">
      {new Intl.NumberFormat(props.language, {
        maximumFractionDigits: 2,
      }).format(totals.reduce((sum, entry) => sum + entry.total, 0))}{" "}
      {totals[0].billingModuleCurrency.symbol}
    </span>
  ) : null;
  return (
    <div
      data-module="ecommerce"
      data-model="order"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "min-w-0 rounded-2xl border border-border bg-card text-card-foreground",
        props.className,
      )}
    >
      <ul className="divide-y divide-border px-3.5 sm:px-4">
        {lines.map((line) => (
          <li key={line.id} className="py-3.5 sm:py-4">
            {line.product ? (
              <Product
                isServer={props.isServer}
                variant="cart-default"
                dataSource="props"
                data={line.product}
                language={props.language}
                priceSlot={singleProduct && !hasUnpriced ? amount : undefined}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {props.quantitySlots?.[line.id]}
                  {singleProduct && props.removeSlot}
                </div>
              </Product>
            ) : (
              <p className="text-sm text-muted-foreground">
                {ru ? "Товар недоступен" : "Item unavailable"}
              </p>
            )}
            {props.selectionSlots?.[line.id]}
          </li>
        ))}
      </ul>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-b-2xl border-t border-border bg-muted px-3.5 py-2 sm:px-4">
        {props.currencySlot}
        {(!singleProduct || hasUnpriced) && amount && (
          <span className="flex flex-wrap items-baseline gap-2 text-xs text-muted-foreground">
            {hasUnpriced
              ? ru
                ? "Товары с ценой"
                : "Priced items"
              : ru
                ? "Сумма заказа"
                : "Order subtotal"}{" "}
            {amount}
          </span>
        )}
        {!singleProduct && props.removeSlot}
      </div>
    </div>
  );
});
