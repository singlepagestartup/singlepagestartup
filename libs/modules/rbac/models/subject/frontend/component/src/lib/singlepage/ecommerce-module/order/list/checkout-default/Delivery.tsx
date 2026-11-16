"use client";

import { useId, useState } from "react";
import { Store, Truck } from "lucide-react";
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
      Icon: Store,
    },
    {
      value: "courier",
      label: ru ? "Курьер" : "Courier",
      price: courierPrice,
      Icon: Truck,
    },
  ] as const;

  return (
    <fieldset className="relative min-w-0 rounded-2xl border border-border bg-muted/30 px-3 pb-3 pt-2.5">
      <legend className="float-left mb-2.5 w-full text-sm font-semibold">
        {ru ? "Доставка" : "Delivery"}
      </legend>
      <div className="clear-both grid grid-cols-2 gap-2">
        {methods.map(({ value, label, price, Icon }) => (
          <label key={value} className="relative min-w-0 cursor-pointer">
            <input
              type="radio"
              name={group}
              value={value}
              checked={selected === value}
              onChange={() => setSelected(value)}
              aria-label={label}
              aria-describedby={price ? group + "-" + value : undefined}
              className="peer sr-only"
            />
            <span className="flex h-full min-h-12 items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2 pr-5 text-foreground transition hover:border-muted-foreground/60 peer-checked:border-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2">
              <Icon
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
                strokeWidth={1.6}
              />
              <span className="min-w-0">
                <span className="block text-xs font-semibold leading-4">
                  {label}
                </span>
                {price && (
                  <span
                    id={group + "-" + value}
                    className="block text-xs text-muted-foreground"
                  >
                    {price}
                  </span>
                )}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-2.5 top-2.5 hidden size-1.5 rounded-full bg-foreground peer-checked:block"
            />
          </label>
        ))}
      </div>
      {selected === "courier" && (
        <div className="mt-3 grid gap-2">
          <label className="grid gap-1 text-xs font-medium">
            {ru ? "Город" : "City"}
            <Input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              autoComplete="off"
              className="h-10 w-full bg-card"
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
              className="h-10 w-full bg-card"
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
