"use client";

import { memo, useCallback, useId, useState } from "react";
import type { ITokenCatalogProps, ITokenPackChoiceProps } from "./interface";

const TokenPackChoice = memo(function TokenPackChoice(
  props: ITokenPackChoiceProps,
) {
  return (
    <label className="relative min-w-0 cursor-pointer">
      <input
        type="radio"
        name={props.name}
        value={props.id}
        checked={props.selected}
        onChange={() => props.onSelect(props.id)}
        className="peer sr-only"
      />
      <span className="flex min-h-20 items-center justify-center rounded-xl border border-border bg-card p-4 text-center text-sm font-semibold hover:bg-muted peer-checked:border-foreground peer-checked:bg-muted peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-foreground">
        {props.title}
      </span>
    </label>
  );
});

export function Component(props: ITokenCatalogProps) {
  const id = useId();
  const [selectedId, setSelectedId] = useState(
    () => props.topups[2]?.id ?? props.topups[0]?.id,
  );
  const select = useCallback((productId: string) => {
    setSelectedId(productId);
  }, []);
  const selected =
    props.topups.find((product) => product.id === selectedId) ??
    props.topups[0];
  const ru = props.language === "ru";

  return (
    <div className="grid min-w-0 items-start gap-6 lg:grid-cols-2">
      <section aria-labelledby={`${id}-pro`} className="min-w-0">
        <h2 id={`${id}-pro`} className="mb-4 text-2xl font-semibold">
          {ru ? "Pro на месяц" : "Monthly Pro"}
        </h2>
        {props.proCard}
      </section>
      <section aria-labelledby={`${id}-topups`} className="min-w-0">
        <h2 id={`${id}-topups`} className="text-2xl font-semibold">
          {ru ? "Разовое пополнение токенов" : "One-off token top-ups"}
        </h2>
        <fieldset className="mt-5">
          <legend className="mb-3 text-sm font-medium">
            {ru ? "Выберите сумму пополнения" : "Choose a top-up amount"}
          </legend>
          <div className="grid min-w-0 grid-cols-1 gap-3 min-[360px]:grid-cols-2 xl:grid-cols-3">
            {props.topups.map((product) => (
              <TokenPackChoice
                key={product.id}
                id={product.id}
                title={product.title}
                name={`${id}-pack`}
                selected={selected?.id === product.id}
                onSelect={select}
              />
            ))}
          </div>
        </fieldset>
        <div className="mt-5" key={selected?.id}>
          {selected?.card}
        </div>
      </section>
    </div>
  );
}
