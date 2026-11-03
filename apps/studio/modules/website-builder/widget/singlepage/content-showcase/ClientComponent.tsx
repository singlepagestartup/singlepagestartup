"use client";
import { useCallback, useState } from "react";
import type { IComponentProps } from "./interface";
import { Component as Feature } from "../../../feature";
export function Component({
  id,
  eyebrow,
  title,
  description,
  selectorLabel,
  previewLabel,
  items,
}: IComponentProps) {
  const [selectedId, setSelectedId] = useState(items[0]?.id);
  const select = useCallback((id: string) => setSelectedId(id), []);
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  return (
    <section
      id={id}
      tabIndex={-1}
      aria-labelledby={`${id}-title`}
      className="mx-auto max-w-7xl px-5 py-14 outline-none @3xl:px-8 @3xl:py-20"
      data-module="website-builder"
      data-model="widget"
      data-variant="content-showcase"
      data-ds-block="website-builder.widget.content-showcase"
    >
      <div className="rounded-3xl bg-default p-5 text-default-foreground @3xl:p-8">
        <div className="grid items-center gap-7 @3xl:grid-cols-2 @3xl:gap-10">
          <div className="flex min-w-0 flex-col justify-center">
            <p className="text-xs font-medium uppercase tracking-widest text-default-muted-foreground">
              {eyebrow}
            </p>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
              <h2
                id={`${id}-title`}
                className="max-w-xl text-balance font-default text-3xl font-semibold leading-tight @3xl:text-4xl"
              >
                {title}
              </h2>
              <p className="max-w-sm text-sm leading-6 text-default-muted-foreground">
                {description}
              </p>
            </div>
            <div
              role="group"
              aria-label={selectorLabel}
              className="mt-7 space-y-2"
            >
              {items.map((item) => (
                <Feature
                  key={item.id}
                  variant="selectable"
                  id={`${id}-${item.id}`}
                  title={item.title}
                  description={item.description}
                  selected={selected?.id === item.id}
                  controls={`${id}-preview`}
                  recordId={item.id}
                  onSelect={select}
                />
              ))}
            </div>
          </div>
          <div id={`${id}-preview`} className="min-w-0">
            {selected ? (
              <Feature
                key={selected.id}
                variant="preview-scroll"
                src={selected.preview.src}
                alt={selected.preview.alt}
                width={selected.preview.width}
                height={selected.preview.height}
                label={`${previewLabel}: ${selected.title}`}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
