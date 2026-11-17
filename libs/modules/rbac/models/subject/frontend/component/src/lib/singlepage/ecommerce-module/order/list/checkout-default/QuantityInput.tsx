"use client";

import { Button, Input } from "@sps/shared-ui-shadcn";
import { Icon } from "@sps/ui-adapter";
import type { IQuantityInputProps } from "./interface";

export function QuantityInput(props: IQuantityInputProps) {
  const numeric = Number(props.value);
  const canStep = Number.isSafeInteger(props.max) && props.max >= props.min;
  const valid =
    props.value.trim() !== "" &&
    Number.isSafeInteger(numeric) &&
    numeric >= props.min &&
    numeric <= props.max;
  function step(direction: 1 | -1) {
    if (props.disabled || !canStep) return;
    const next =
      !props.value.trim() || !Number.isFinite(numeric)
        ? props.min
        : Math.min(
            props.max,
            Math.max(
              props.min,
              direction === 1
                ? Math.floor(numeric) + 1
                : Math.ceil(numeric) - 1,
            ),
          );
    if (props.value.trim() && next === numeric) return;
    props.onValueChange(String(next));
  }
  return (
    <div className="grid min-w-0 gap-1 text-xs font-medium">
      <label htmlFor={props.id}>{props.label}</label>
      <div
        role="group"
        aria-label={`${props.label}: ${props.contextLabel}`}
        className="grid h-12 min-h-12 min-w-0 grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] overflow-hidden rounded-xl border border-border bg-card focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-foreground"
      >
        <Button
          type="button"
          variant="ghost"
          className="h-full min-h-0 w-10 rounded-none p-0"
          aria-label={props.decreaseLabel}
          disabled={
            props.disabled ||
            !canStep ||
            (props.value.trim() !== "" && numeric <= props.min)
          }
          onClick={() => step(-1)}
        >
          <Icon name="minus" />
        </Button>
        <Input
          id={props.id}
          type="number"
          inputMode="numeric"
          value={props.value}
          min={props.min}
          max={props.max}
          step={1}
          aria-invalid={!valid || undefined}
          disabled={props.disabled}
          className="h-full min-h-0 min-w-0 rounded-none border-0 bg-transparent px-1 py-0 text-center text-sm tabular-nums shadow-none [appearance:textfield] focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          onChange={(event) => props.onValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.nativeEvent.isComposing ||
              (event.key !== "ArrowUp" && event.key !== "ArrowDown")
            )
              return;
            event.preventDefault();
            step(event.key === "ArrowUp" ? 1 : -1);
          }}
        />
        <Button
          type="button"
          variant="ghost"
          className="h-full min-h-0 w-10 rounded-none p-0"
          aria-label={props.increaseLabel}
          disabled={props.disabled || !canStep || numeric >= props.max}
          onClick={() => step(1)}
        >
          <Icon name="plus" />
        </Button>
      </div>
    </div>
  );
}
