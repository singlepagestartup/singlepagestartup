"use client";
import { memo, useCallback } from "react";
import type { IComponentProps } from "./interface";
import { Component as SharedIcon } from "../../../../shared/icon";
export const Component = memo<IComponentProps>(function Component({
  id,
  title,
  description,
  selected,
  controls,
  recordId = id,
  onSelect,
}) {
  const select = useCallback(() => onSelect(recordId), [recordId, onSelect]);
  return (
    <div
      data-module="website-builder"
      data-model="feature"
      data-variant="selectable"
      data-ds-block="website-builder.feature.selectable"
      className={`overflow-hidden rounded-xl border ${selected ? "border-primary" : "border-default-foreground/15"}`}
    >
      <button
        id={`${id}-button`}
        type="button"
        aria-expanded={selected}
        aria-controls={`${id}-description ${controls}`}
        aria-pressed={selected}
        onClick={select}
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-t-[11px] px-4 py-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${selected ? "bg-primary text-primary-foreground" : "text-default-foreground hover:bg-default-foreground/5"}`}
      >
        <span>{title}</span>
        <SharedIcon
          variant="phosphor"
          name={selected ? "check" : "plus"}
          size={20}
        />
      </button>
      <p
        id={`${id}-description`}
        hidden={!selected}
        className="px-4 pb-4 pt-3 text-sm leading-6 text-default-muted-foreground"
      >
        {description}
      </p>
    </div>
  );
});
