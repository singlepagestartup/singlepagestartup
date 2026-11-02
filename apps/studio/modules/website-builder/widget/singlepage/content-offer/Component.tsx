import type { IComponentProps } from "./interface";

export function Component({
  id,
  eyebrow,
  title,
  description,
  note,
  appearance = "dark",
  headingLevel = "h2",
  embedded = false,
  actions,
  children,
}: IComponentProps) {
  const Heading = headingLevel;
  const inverse = appearance === "dark";
  return (
    <section
      id={id}
      tabIndex={id ? -1 : undefined}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={
        embedded
          ? "min-w-0"
          : "mx-auto w-full min-w-0 max-w-7xl px-5 py-12 outline-none @3xl:px-8 @3xl:py-16"
      }
      data-ds-block="website-builder.widget.content-offer"
      data-module="website-builder"
      data-model="widget"
      data-variant="content-offer"
    >
      <div
        className={`rounded-3xl p-6 @3xl:p-8 ${inverse ? "bg-default text-default-foreground" : "border border-border bg-muted text-foreground"}`}
      >
        {eyebrow ? (
          <p
            className={`text-sm ${inverse ? "text-default-muted-foreground" : "text-muted-foreground"}`}
          >
            {eyebrow}
          </p>
        ) : null}
        <Heading
          id={id ? `${id}-title` : undefined}
          className={`mt-3 max-w-3xl text-balance font-default font-semibold leading-tight tracking-normal ${embedded ? "text-5xl @4xl:text-6xl" : "text-3xl @4xl:text-4xl"}`}
        >
          {title}
        </Heading>
        {description ? (
          <div
            className={`mt-5 max-w-2xl text-base leading-7 ${inverse ? "text-default-muted-foreground" : ""}`}
          >
            {description}
          </div>
        ) : null}
        {note ? (
          <div
            className={`mt-4 max-w-2xl text-sm leading-6 ${inverse ? "text-default-muted-foreground" : "text-muted-foreground"}`}
          >
            {note}
          </div>
        ) : null}
        {children}
        {actions ? (
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}
