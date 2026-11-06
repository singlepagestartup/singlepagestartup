import type { IComponentProps } from "./interface";
import { Component as Feature } from "../../../feature";
import { twMerge } from "tailwind-merge";

export function Component({
  id,
  className,
  eyebrow,
  title,
  description,
  headingLevel = "h2",
  items,
  children,
  appearance = "ruled",
  columns = 4,
  actions,
  footer,
}: IComponentProps) {
  const Heading = headingLevel;
  return (
    <section
      id={id}
      tabIndex={id ? -1 : undefined}
      aria-labelledby={id ? `${id}-title` : undefined}
      className="mx-auto w-full min-w-0 max-w-7xl px-5 py-12 outline-none @3xl:px-8 @3xl:py-16"
      data-ds-block="website-builder.widget.content-definition-grid"
      data-module="website-builder"
      data-model="widget"
      data-variant="content-definition-grid"
    >
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          {eyebrow ? (
            <p className="text-sm text-muted-foreground">{eyebrow}</p>
          ) : null}
          <Heading
            id={id ? `${id}-title` : undefined}
            className={`mt-3 max-w-3xl text-balance font-default font-semibold leading-tight tracking-normal ${headingLevel === "h1" ? "text-4xl @4xl:text-5xl" : "text-3xl @4xl:text-4xl"}`}
          >
            {title}
          </Heading>
          {description ? (
            <div className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>
        {actions}
      </header>
      <div
        className={twMerge(
          `mt-8 grid gap-x-8 gap-y-5 @2xl:grid-cols-2 ${columns === 4 ? "@5xl:grid-cols-4" : columns === 3 ? "@5xl:grid-cols-3" : ""}`,
          className,
        )}
      >
        {children ??
          items?.map((item) => (
            <Feature
              key={item.id}
              variant="definition-card"
              title={item.title}
              subtitle={item.label}
              description={item.description}
              href={item.href}
              target={item.target}
              linkLabel={item.linkLabel}
              sourceHref={item.sourceHref}
              sourceLabel={item.sourceLabel}
              appearance={appearance}
            />
          ))}
      </div>
      {footer ? <div className="mt-8">{footer}</div> : null}
    </section>
  );
}
