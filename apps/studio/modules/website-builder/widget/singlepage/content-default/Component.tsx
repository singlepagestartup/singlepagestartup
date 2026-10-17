import type { IComponentProps, ContentDefaultProps } from "./interface";
export type { ContentDefaultProps } from "./interface";

export function ContentDefault({
  variant = "content-default",
  counterLabel = defaultContentProps.counterLabel,
  counterValue = defaultContentProps.counterValue,
  eyebrow = defaultContentProps.eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  mediaLabel = defaultContentProps.mediaLabel,
  mediaSrc,
  mediaAlt = defaultContentProps.mediaAlt,
}: IComponentProps) {
  const hasCounterValue =
    counterValue !== undefined &&
    counterValue !== null &&
    `${counterValue}` !== "";
  const counterText = [counterLabel, hasCounterValue ? counterValue : null]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      className="w-full bg-muted py-8 sm:py-12"
      data-ds-block="website-builder.widget.content-default"
      data-ds-layer="singlepage"
      data-module="website-builder"
      data-model="widget"
      data-variant={variant}
    >
      <div className={containerClass}>
        <div className="flex min-w-0 flex-col justify-center gap-6 rounded-t-3xl bg-default p-6 sm:p-10 lg:rounded-l-3xl lg:rounded-tr-none lg:p-12">
          {counterLabel || hasCounterValue ? (
            <p
              className="m-0 inline-flex items-center gap-1 text-sm leading-5 text-default-muted-foreground"
              aria-label={counterText}
            >
              {counterLabel ? (
                <span className="font-semibold">{counterLabel}</span>
              ) : null}
              {hasCounterValue ? <span>{counterValue}</span> : null}
            </p>
          ) : null}
          {eyebrow ? (
            <p className="m-0 text-sm font-semibold leading-6 tracking-normal text-default-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="m-0 max-w-[16ch] text-[2.5rem] font-semibold leading-[1.08] tracking-normal text-default-foreground sm:text-5xl xl:text-[4rem]">
            {title}
          </h1>
          {description ? (
            <p className="m-0 max-w-lg text-base leading-7 text-default-muted-foreground sm:text-lg sm:leading-8">
              {description}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {primaryAction ? (
              <a className={buttonPrimaryClass} href={primaryAction.href}>
                {primaryAction.label}
              </a>
            ) : null}
            {secondaryAction ? (
              <a className={buttonSecondaryClass} href={secondaryAction.href}>
                {secondaryAction.label}
              </a>
            ) : null}
          </div>
        </div>

        <div
          className="min-h-72 w-full overflow-hidden rounded-b-3xl bg-card lg:relative lg:rounded-r-3xl lg:rounded-bl-none"
          aria-label={mediaLabel}
        >
          {mediaSrc ? (
            <img
              className="aspect-square h-full w-full object-cover lg:absolute lg:inset-0"
              src={mediaSrc}
              alt={mediaAlt ?? ""}
            />
          ) : (
            <div
              className="aspect-square h-full w-full bg-border"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </div>
  );
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  button: `${buttonBase} bg-primary text-primary-foreground enabled:hover:brightness-95 ${focus}`,
  secondary: `${buttonBase} border border-border bg-card text-foreground enabled:hover:bg-muted ${focus}`,
};
const defaultMediaSrc =
  "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png";
const containerClass =
  "mx-auto grid w-full max-w-7xl gap-0 px-4 sm:px-6 lg:grid-cols-2 lg:px-8";
const buttonPrimaryClass = `${kit.button} no-underline hover:brightness-95 focus-visible:outline-card`;
const buttonSecondaryClass = `${kit.secondary} no-underline hover:bg-muted focus-visible:outline-card`;
export const defaultContentProps: ContentDefaultProps = {
  counterLabel: "Counter:",
  counterValue: 1,
  eyebrow: "SinglePageStartup",
  title: "Launch a startup-specific landing page before the backend exists.",
  description:
    "Use the singlepage draft system to test the offer, structure, and visual language quickly, then promote only approved decisions.",
  primaryAction: {
    label: "Start prototype",
    href: "#contact",
  },
  secondaryAction: {
    label: "View blocks",
    href: "#sections",
  },
  mediaLabel: "Business conversation",
  mediaSrc: defaultMediaSrc,
  mediaAlt: "Two people discussing their work in a studio",
};
