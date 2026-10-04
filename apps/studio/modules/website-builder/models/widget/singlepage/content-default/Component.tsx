const defaultMediaSrc = new URL(
  "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
  import.meta.url,
).href;

import { kit } from "../../../../../../workspace/design/singlepage/interface-kit/primitives";

const containerClass =
  "mx-auto grid w-full max-w-7xl gap-0 px-4 sm:px-6 lg:grid-cols-2 lg:px-8";
const buttonPrimaryClass = `${kit.button} no-underline hover:brightness-95 focus-visible:outline-[var(--workspace-brand-focus-inverse)]`;
const buttonSecondaryClass = `${kit.secondary} no-underline hover:bg-[var(--workspace-brand-background)] focus-visible:outline-[var(--workspace-brand-focus-inverse)]`;

export interface ContentDefaultProps {
  counterLabel?: string;
  counterValue?: string | number;
  eyebrow?: string;
  title: string;
  description?: string;
  primaryAction?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  mediaLabel?: string;
  mediaSrc?: string;
  mediaAlt?: string;
}

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

export function ContentDefault({
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
}: ContentDefaultProps) {
  const hasCounterValue =
    counterValue !== undefined &&
    counterValue !== null &&
    `${counterValue}` !== "";
  const counterText = [counterLabel, hasCounterValue ? counterValue : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="w-full bg-[var(--workspace-brand-background)] py-8 sm:py-12"
      data-ds-block="website-builder.widget.content-default"
      data-ds-layer="singlepage"
    >
      <div className={containerClass}>
        <div className="flex min-w-0 flex-col justify-center gap-6 rounded-t-3xl bg-[var(--workspace-brand-primary)] p-6 sm:p-10 lg:rounded-l-3xl lg:rounded-tr-none lg:p-12">
          {counterLabel || hasCounterValue ? (
            <p
              className="m-0 inline-flex items-center gap-1 text-sm leading-5 text-[var(--workspace-brand-muted-on-primary)]"
              aria-label={counterText}
            >
              {counterLabel ? (
                <span className="font-semibold">{counterLabel}</span>
              ) : null}
              {hasCounterValue ? <span>{counterValue}</span> : null}
            </p>
          ) : null}
          {eyebrow ? (
            <p className="m-0 text-sm font-semibold leading-6 tracking-normal text-[var(--workspace-brand-muted-on-primary)]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="m-0 max-w-[16ch] text-[2.5rem] font-semibold leading-[1.08] tracking-normal text-white sm:text-5xl xl:text-[4rem]">
            {title}
          </h1>
          {description ? (
            <p className="m-0 max-w-lg text-base leading-7 text-[var(--workspace-brand-muted-on-primary)] sm:text-lg sm:leading-8">
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
          className="min-h-72 w-full overflow-hidden rounded-b-3xl bg-[var(--workspace-brand-surface)] lg:relative lg:rounded-r-3xl lg:rounded-bl-none"
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
              className="aspect-square h-full w-full bg-[var(--workspace-brand-line)]"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </div>
  );
}
