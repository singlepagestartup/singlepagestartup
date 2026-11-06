import type { IComponentProps } from "./interface";
import { Component as Feature } from "../../../feature";
import { twMerge } from "tailwind-merge";

export function Component({
  id,
  className,
  eyebrow,
  title,
  headingLevel = "h2",
  description,
  note,
  media,
  mediaPosition = "right",
  appearance = "plain",
  items,
  quote,
  quoteLabel,
  actions,
  children,
}: IComponentProps) {
  const Heading = headingLevel;
  const introductory = headingLevel === "h1";
  const body = (
    <>
      {description ? (
        <div className="max-w-xl space-y-4 text-base leading-7 text-muted-foreground">
          {description}
        </div>
      ) : null}
      {items?.length ? (
        <div>
          {items.map((item) => (
            <Feature
              key={item.id}
              variant="definition-card"
              title={item.title}
              description={item.description}
              appearance="checklist"
            />
          ))}
        </div>
      ) : null}
      {quote ? (
        <div>
          {quoteLabel ? (
            <p className="mb-3 text-xs font-medium text-muted-foreground">
              {quoteLabel}
            </p>
          ) : null}
          <blockquote className="rounded-2xl border border-border bg-card p-5 text-base leading-7">
            {quote}
          </blockquote>
        </div>
      ) : null}
      {children}
      {actions ? (
        <div className="mt-6 flex flex-wrap items-center gap-4">{actions}</div>
      ) : null}
      {note ? (
        <div className="mt-4 max-w-lg text-xs leading-6 text-muted-foreground">
          {note}
        </div>
      ) : null}
    </>
  );
  return (
    <section
      id={id}
      tabIndex={id ? -1 : undefined}
      aria-labelledby={id ? `${id}-title` : undefined}
      data-ds-block="website-builder.widget.content-feature-split"
      data-module="website-builder"
      data-model="widget"
      data-variant="content-feature-split"
      className={twMerge(
        `w-full min-w-0 outline-none ${appearance === "muted" ? "border-y border-border bg-muted" : "bg-background"}`,
        className,
      )}
    >
      <div
        className={`mx-auto grid max-w-7xl items-center gap-8 px-5 py-12 @3xl:grid-cols-2 @3xl:gap-12 @3xl:px-8 ${introductory ? "@3xl:py-14" : "@3xl:py-16"}`}
      >
        <div
          className={`min-w-0 ${media && mediaPosition === "left" ? "@3xl:order-2" : ""}`}
        >
          {eyebrow ? (
            <p
              className={
                introductory
                  ? "inline-flex rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium"
                  : "text-sm font-medium text-muted-foreground"
              }
            >
              {eyebrow}
            </p>
          ) : null}
          <Heading
            id={id ? `${id}-title` : undefined}
            className={`mt-4 max-w-2xl text-balance font-default font-semibold tracking-normal ${introductory ? "text-4xl leading-[1.08] @3xl:text-5xl @5xl:text-[56px]" : "text-3xl leading-[1.15] @4xl:text-4xl"}`}
          >
            {title}
          </Heading>
          {media ? <div className="mt-5 space-y-5">{body}</div> : null}
        </div>
        {media ? (
          <figure
            className={`min-w-0 overflow-hidden rounded-3xl ${media.fit === "contain" ? "mx-auto w-full max-w-md" : ""} ${mediaPosition === "left" ? "@3xl:order-1" : ""}`}
          >
            <img
              src={media.src}
              alt={media.alt}
              width={1254}
              height={1254}
              loading={media.priority ? undefined : "lazy"}
              className={`block aspect-square h-auto w-full ${media.fit === "contain" ? "object-contain" : "object-cover"}`}
            />
          </figure>
        ) : (
          <div className="min-w-0 space-y-4">{body}</div>
        )}
      </div>
    </section>
  );
}
