"use client";

import { memo, useCallback } from "react";
import { Checkbox } from "@sps/shared-ui-shadcn";
import { formatCurrencyAmount } from "@sps/shared-frontend-client-utils";
import type { IServiceCardProps } from "./interface";

export const ServiceCard = memo(function ServiceCard(props: IServiceCardProps) {
  const ru = props.language === "ru";
  const title =
    props.option.titles?.[props.language] ||
    props.option.title ||
    props.option.productId;
  const change = useCallback(
    (value: boolean | "indeterminate") => {
      props.onCheckedChange(props.option.offerId, value === true);
    },
    [props.onCheckedChange, props.option.offerId],
  );
  return (
    <div
      role="group"
      aria-labelledby={`${props.id}-title`}
      className="overflow-hidden rounded-xl border border-border has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
    >
      <div className="relative">
        <Checkbox
          id={props.id}
          aria-labelledby={`${props.id}-title`}
          aria-describedby={`${props.id}-price`}
          className="absolute left-3 top-6 size-5 rounded-md border-2 border-muted-foreground bg-card focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 data-[state=checked]:border-primary"
          checked={props.checked}
          onCheckedChange={change}
        />
        <label
          htmlFor={props.id}
          className="block min-w-0 cursor-pointer p-3 pl-11 hover:bg-muted/50"
        >
          <span className="grid min-h-11 grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-x-2 sm:grid-cols-[minmax(0,1fr)_7.5rem]">
            <span className="min-w-0 break-words py-3 text-sm font-medium">
              <span id={`${props.id}-title`}>{title}</span>
              {props.option.receiptMethod === "pickup"
                ? ru
                  ? " · самовывоз"
                  : " · pickup"
                : props.option.receiptMethod === "electronic"
                  ? ru
                    ? " · электронная выдача"
                    : " · electronic fulfillment"
                  : ""}
            </span>
            <span
              id={`${props.id}-price`}
              className="min-w-0 break-words text-right text-sm font-semibold tabular-nums"
            >
              {props.amount !== undefined
                ? `${props.from ? (ru ? "от " : "from ") : ""}${formatCurrencyAmount(props.amount, props.language)} ${props.currencySymbol}`
                : props.pending
                  ? "…"
                  : ru
                    ? "По расчёту"
                    : "Calculated"}
            </span>
          </span>
          {props.option.receiptMethod === "shipping" ? (
            <span className="block space-y-1 text-xs text-muted-foreground">
              {props.tariff ? (
                <span className="block">
                  {props.tariff.basis === "fixed"
                    ? ru
                      ? "Фиксированная стоимость"
                      : "Fixed price"
                    : props.tariff.basis === "distance"
                      ? ru
                        ? "По расстоянию"
                        : "By distance"
                      : ru
                        ? "Расчётный тариф"
                        : "Calculated tariff"}
                </span>
              ) : null}
              {props.tariff?.basis === "distance" &&
              props.distanceKm !== undefined &&
              Number.isFinite(Number(props.distanceKm)) ? (
                <span className="block">
                  {ru ? "Маршрут" : "Route"} ·{" "}
                  {new Intl.NumberFormat(ru ? "ru-RU" : "en-US", {
                    maximumFractionDigits: 3,
                  }).format(Number(props.distanceKm))}{" "}
                  {ru ? "км" : "km"}
                </span>
              ) : null}
              <span className="block">
                {props.option.regionIds?.length
                  ? `${ru ? "Зона доставки" : "Delivery area"}: ${props.option.regionIds.join(", ")}`
                  : ru
                    ? "Зона доставки не указана"
                    : "Delivery area is not specified"}
              </span>
            </span>
          ) : null}
        </label>
      </div>
      {props.checked ? props.children : null}
    </div>
  );
});
