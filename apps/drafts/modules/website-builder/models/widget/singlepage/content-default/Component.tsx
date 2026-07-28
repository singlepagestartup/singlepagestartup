const defaultMediaSrc = new URL(
  "./assets/content-default-media.png",
  import.meta.url,
).href;

const containerClass =
  "mx-auto grid w-full max-w-7xl items-center gap-10 px-6 py-5 lg:grid-cols-2 lg:px-0";
const buttonBaseClass =
  "inline-flex min-h-11 items-center justify-center rounded-md border px-4 py-3 text-sm font-semibold leading-none no-underline transition hover:-translate-y-px";
const buttonPrimaryClass = `${buttonBaseClass} border-slate-950 bg-slate-950 text-white hover:bg-slate-800`;
const buttonSecondaryClass = `${buttonBaseClass} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`;

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
  mediaLabel: "Prototype snapshot",
  mediaSrc: defaultMediaSrc,
  mediaAlt: "Prototype snapshot",
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
      className="flex min-h-[32.625rem] w-full items-center overflow-hidden bg-[#e2e2e2] py-16 lg:py-24"
      data-ds-block="website-builder.widget.content-default"
      data-ds-layer="singlepage"
    >
      <div className={`${containerClass} min-h-[32.625rem] bg-white`}>
        <div className="flex flex-col gap-5">
          {counterLabel || hasCounterValue ? (
            <p
              className="m-0 inline-flex items-center gap-1 text-sm leading-5 text-[#040404]"
              aria-label={counterText}
            >
              {counterLabel ? (
                <span className="font-semibold">{counterLabel}</span>
              ) : null}
              {hasCounterValue ? <span>{counterValue}</span> : null}
            </p>
          ) : null}
          {eyebrow ? (
            <p className="m-0 text-base font-semibold leading-6 tracking-normal text-[#0b55f4]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="m-0 max-w-[11ch] text-5xl font-semibold leading-none tracking-normal text-[#060611] lg:text-7xl">
            {title}
          </h1>
          {description ? (
            <p className="m-0 max-w-[38rem] text-base leading-7 text-[#404040]">
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
          className="flex aspect-[356/335] min-h-72 w-full items-center justify-center overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-blue-600 via-teal-500 to-amber-500"
          aria-label={mediaLabel}
        >
          {mediaSrc ? (
            <img
              className="h-full w-full object-cover"
              src={mediaSrc}
              alt={mediaAlt ?? ""}
            />
          ) : (
            <div
              className="h-full w-full bg-gradient-to-br from-blue-600 via-teal-500 to-amber-500"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </div>
  );
}
