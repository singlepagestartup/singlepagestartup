import { memo } from "react";
import { cn } from "@sps/shared-frontend-client-utils";
import { currencyPrecision } from "@sps/shared-utils";
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
  const hasSelectionReceipts =
    lines.length > 0 &&
    lines.every(
      (line) =>
        Boolean(props.selectionSlots?.[line.id]) &&
        details?.offerQuotes?.some((quote) =>
          line.offerId
            ? quote.offerId === line.offerId
            : quote.productId === line.productId,
        ),
    );
  const amount = totals.length ? (
    <span className="max-w-full wrap-anywhere text-right text-lg font-semibold leading-tight tracking-tight text-foreground tabular-nums">
      {new Intl.NumberFormat(props.language, {
        maximumFractionDigits: currencyPrecision(
          totals[0].billingModuleCurrency,
        ),
      }).format(totals.reduce((sum, entry) => sum + entry.total, 0))}{" "}
      {totals[0].billingModuleCurrency.symbol}
    </span>
  ) : null;
  const showSubtotal =
    !hasSelectionReceipts && (!singleProduct || hasUnpriced) && Boolean(amount);
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
        {lines.map((line, index) => (
          <li key={line.id} className="py-3.5 sm:py-4">
            <header className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              {line.product ? (
                <Product
                  isServer={props.isServer}
                  variant="cart-default"
                  dataSource="props"
                  data={line.product}
                  language={props.language}
                  priceSlot={
                    singleProduct && !hasUnpriced && !hasSelectionReceipts
                      ? amount
                      : undefined
                  }
                >
                  {props.quantitySlots?.[line.id]}
                </Product>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {ru ? "Товар недоступен" : "Item unavailable"}
                </p>
              )}
              {index === 0 && props.removeSlot && (
                <div className="min-w-0 max-w-28 justify-self-end break-words">
                  {props.removeSlot}
                </div>
              )}
            </header>
            {props.selectionSlots?.[line.id]}
          </li>
        ))}
      </ul>
      {!lines.length && props.removeSlot && (
        <div className="flex justify-end px-3.5 pt-3.5 sm:px-4 sm:pt-4">
          {props.removeSlot}
        </div>
      )}
      {(Boolean(props.currencySlot) || showSubtotal) && (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-b-2xl border-t border-border bg-muted px-3.5 py-2 sm:px-4">
          {props.currencySlot}
          {showSubtotal && (
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
        </div>
      )}
    </div>
  );
});
