"use client";

import { useId, useState } from "react";
import { Icon } from "@sps/ui-adapter";
import { Input } from "@sps/shared-ui-shadcn";
import type { IDeliveryProps } from "./interface";

type Method = "pickup" | "courier";

export function Delivery({ language, currencySlug }: IDeliveryProps) {
  const ru = language === "ru";
  const group = useId();
  const [selected, setSelected] = useState<Method>("pickup");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const courierPrice =
    currencySlug === "usd" ? "4 $" : currencySlug === "eur" ? "4 €" : "300 ₽";
  const methods = [
    {
      value: "pickup",
      label: ru ? "Самовывоз" : "Pickup",
      price: undefined,
    },
    {
      value: "courier",
      label: ru ? "Курьер" : "Courier",
      price: courierPrice,
    },
  ] as const;

  return (
    <fieldset className="min-w-0 rounded-2xl border border-border bg-card p-3.5 sm:p-4">
      <legend className="float-left mb-2.5 w-full text-base font-semibold tracking-tight text-foreground">
        {ru ? "Доставка" : "Delivery"}
      </legend>
      <div className="clear-both grid grid-cols-2 gap-1.5 rounded-2xl bg-muted p-1.5">
        {methods.map(({ value, label, price }) => (
          <label
            key={value}
            className="group flex min-h-14 min-w-0 cursor-pointer items-center justify-between gap-2 rounded-xl border border-transparent px-3 py-2 text-muted-foreground transition-colors hover:text-foreground has-[:checked]:border-foreground/20 has-[:checked]:bg-card has-[:checked]:text-foreground has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-foreground motion-reduce:transition-none"
          >
            <input
              type="radio"
              name={group}
              value={value}
              checked={selected === value}
              onChange={() => setSelected(value)}
              aria-label={label}
              aria-describedby={price ? group + "-" + value : undefined}
              className="sr-only"
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-5">
                {label}
              </span>
              {price && (
                <span
                  id={group + "-" + value}
                  className="block text-xs text-muted-foreground tabular-nums"
                >
                  {price}
                </span>
              )}
            </span>
            <span
              aria-hidden="true"
              className="grid size-6 shrink-0 place-items-center rounded-full border border-border bg-card text-primary-foreground group-has-[:checked]:border-transparent group-has-[:checked]:bg-primary"
            >
              <Icon
                name="check"
                className="size-4 opacity-0 group-has-[:checked]:opacity-100"
              />
            </span>
          </label>
        ))}
      </div>
      {selected === "courier" && (
        <div className="mt-3 grid gap-3">
          <label className="grid gap-1 text-xs font-medium">
            {ru ? "Город" : "City"}
            <Input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              autoComplete="off"
              className="h-11 w-full rounded-xl bg-card"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium">
            {ru ? "Адрес доставки" : "Delivery address"}
            <Input
              value={street}
              onChange={(event) => setStreet(event.target.value)}
              autoComplete="off"
              placeholder={
                ru ? "Улица, дом, квартира" : "Street, house number, apartment"
              }
              className="h-11 w-full rounded-xl bg-card"
            />
          </label>
          <p
            className="text-xs leading-relaxed text-muted-foreground"
            role="status"
          >
            {ru
              ? "Пример тарифа курьера. В итог входит только стоимость товаров."
              : "Sample courier rate. The total covers items only."}
          </p>
        </div>
      )}
    </fieldset>
  );
}
