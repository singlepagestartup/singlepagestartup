"use client";
import { useEffect, useState } from "react";
import { api } from "@sps/ecommerce/relations/stores-to-products/sdk/client";
import { api as currencyApi } from "@sps/billing/models/currency/sdk/client";
import { cn } from "@sps/shared-frontend-client-utils";
import type { IPriceClientProps } from "./interface";

export function Component(props: IPriceClientProps) {
  const offers = api.find({
    params: {
      filters: {
        and: [
          { column: "productId", method: "eq", value: props.productId },
          { column: "variant", method: "eq", value: "default" },
        ],
      },
    },
    reactQueryOptions: { enabled: Boolean(props.productId) },
  });
  const eligible = (offers.data ?? []).filter(
    (offer) =>
      offer.productId === props.productId &&
      offer.variant === "default" &&
      (props.productKind !== "service" || offer.settings.standalone === true),
  );
  const offerId = props.offerId
    ? (eligible.find((offer) => offer.id === props.offerId)?.id ?? "")
    : eligible.length === 1
      ? eligible[0].id
      : "";
  const [fallbackCurrencyId, setFallbackCurrencyId] = useState("");
  const currencyId = props.currencyId ?? fallbackCurrencyId;
  const quote = api.quote({
    data: { offerId, quantity: props.quantity ?? 1, currencyId },
    reactQueryOptions: { enabled: Boolean(offerId) },
  });
  const currency = currencyApi.findById({
    id: currencyId,
    reactQueryOptions: { enabled: Boolean(currencyId) },
  });
  useEffect(() => {
    setFallbackCurrencyId("");
  }, [offerId]);
  useEffect(() => {
    if (
      !props.currencyId &&
      quote.data?.offerId === offerId &&
      !quote.data.currencyIds.includes(fallbackCurrencyId)
    ) {
      setFallbackCurrencyId(quote.data.currencyIds[0] ?? "");
    }
  }, [props.currencyId, quote.data, offerId, fallbackCurrencyId]);
  const current =
    quote.data?.offerId === offerId && quote.data.currencyId === currencyId
      ? quote.data
      : undefined;
  const amount = current?.charges.find(
    (charge) => charge.role === "product",
  )?.amount;
  return (
    <div
      data-module="ecommerce"
      data-model="product"
      data-id={props.productId}
      data-variant="price-default"
      className={cn("flex w-full flex-col gap-1", props.className)}
    >
      {amount !== undefined ? (
        <p className="font-semibold tabular-nums">
          {amount} {currency.data?.symbol}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {offers.isPending || (offerId && quote.isPending)
            ? props.language === "ru"
              ? "Рассчитываем…"
              : "Calculating…"
            : !offerId && eligible.length > 1
              ? props.language === "ru"
                ? "Выберите магазин"
                : "Choose a store"
              : props.language === "ru"
                ? "Невозможно рассчитать"
                : "Cannot calculate"}
        </p>
      )}
      {current?.issues
        .filter((issue) => issue.code !== "address_required")
        .map((issue) => (
          <p
            key={`${issue.code}-${issue.offerId}`}
            className="text-xs text-destructive"
          >
            {props.language === "ru" && issue.code === "delivery_required"
              ? "Для выбранных условий заказа нет доступного способа получения."
              : issue.message}
          </p>
        ))}
    </div>
  );
}
