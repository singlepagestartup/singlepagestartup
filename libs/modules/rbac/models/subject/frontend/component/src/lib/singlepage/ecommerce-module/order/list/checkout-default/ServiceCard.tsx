"use client";

import { memo, useCallback } from "react";
import { Checkbox, RadioGroup, RadioGroupItem } from "@sps/shared-ui-shadcn";
import { formatCurrencyAmount } from "@sps/shared-frontend-client-utils";
import type { IServiceCardProps, IServiceOptionsProps } from "./interface";

export function ServiceOptions(props: IServiceOptionsProps) {
  if (props.multiple)
    return (
      <div id={props.id} className="grid gap-1.5">
        {props.children}
      </div>
    );
  return (
    <RadioGroup
      id={props.id}
      aria-labelledby={props.labelId}
      name={props.selectionName}
      required={props.required}
      value={props.value}
      onValueChange={props.onValueChange}
      className="gap-1.5"
    >
      {props.children}
    </RadioGroup>
  );
}

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
      className={`overflow-hidden rounded-xl border transition-colors motion-reduce:transition-none ${
        props.checked
          ? "border-primary bg-primary/5 hover:bg-primary/30"
          : "border-border hover:border-primary hover:bg-primary/20"
      }`}
    >
      <div className="relative">
        {props.option.role === "delivery" ? (
          <RadioGroupItem
            id={props.id}
            value={props.option.offerId}
            aria-labelledby={`${props.id}-title`}
            aria-describedby={`${props.id}-price`}
            className="absolute left-3 top-3.5 size-4 bg-card"
          />
        ) : (
          <Checkbox
            id={props.id}
            aria-labelledby={`${props.id}-title`}
            aria-describedby={`${props.id}-price`}
            className="absolute left-3 top-3.5 size-4 rounded-sm border-2 border-muted-foreground bg-card focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 data-[state=checked]:border-primary"
            checked={props.checked}
            onCheckedChange={change}
          />
        )}
        <label
          htmlFor={props.id}
          className="block min-w-0 cursor-pointer py-2 pl-10 pr-3"
        >
          <span className="grid min-h-7 grid-cols-[minmax(0,1fr)_5rem] items-center gap-x-2 sm:grid-cols-[minmax(0,1fr)_6.5rem]">
            <span className="min-w-0 break-words py-1 text-sm font-medium">
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
            <span className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs leading-4 text-muted-foreground">
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
