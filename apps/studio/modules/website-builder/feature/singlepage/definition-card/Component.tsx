import type { IComponentProps } from "./interface";
import { memo } from "react";
import { Component as SharedIcon } from "../../../../shared/icon";

export const Component = memo<IComponentProps>(function Component({
  title,
  subtitle,
  description,
  href,
  target,
  linkLabel,
  sourceHref,
  sourceLabel,
  appearance = "cards",
  actions,
}) {
  return (
    <article
      className={`relative isolate min-w-0 ${appearance === "cards" ? "flex flex-col rounded-2xl border border-border bg-card p-5" : appearance === "checklist" ? "border-t border-border py-5 pl-9" : "border-t border-border py-5"}`}
      data-module="website-builder"
      data-model="feature"
      data-variant="definition-card"
      data-ds-block="website-builder.feature.definition-card"
    >
      {appearance === "checklist" ? (
        <SharedIcon
          variant="phosphor"
          name="check-circle"
          size={24}
          className="absolute left-0 top-5"
        />
      ) : null}
      {subtitle ? (
        <p className="mb-3 text-xs font-medium text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
      <h3 className="text-base font-semibold leading-6">
        {href ? (
          <a
            href={href}
            target={target}
            rel={target === "_blank" ? "noreferrer" : undefined}
            className="after:absolute after:inset-0 after:z-[1] after:rounded-2xl hover:underline focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-foreground"
          >
            {title}
          </a>
        ) : (
          title
        )}
      </h3>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        {description}
      </p>
      {href ? (
        <span className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium">
          {linkLabel ?? title}
          <SharedIcon variant="phosphor" name="arrow-right" size={20} />
        </span>
      ) : null}
      {sourceHref ? (
        <a
          href={sourceHref}
          target="_blank"
          rel="noreferrer"
          className="relative z-10 mt-3 inline-flex min-h-11 items-center gap-2 self-start text-xs underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
        >
          {sourceLabel ?? "Source guide"}
          <SharedIcon variant="phosphor" name="arrow-up-right" size={20} />
        </a>
      ) : null}
      {actions}
    </article>
  );
});
