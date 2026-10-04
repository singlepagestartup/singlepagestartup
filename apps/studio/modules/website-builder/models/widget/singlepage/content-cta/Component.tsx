import { kit } from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import { ArrowRight } from "../../../../../../workspace/utils/components/ModuleIcons";

const buttonInvertedClass = `${kit.button} no-underline hover:brightness-95 focus-visible:outline-[var(--workspace-brand-focus-inverse)]`;
const buttonGhostDarkClass = `${kit.secondary} no-underline hover:bg-[var(--workspace-brand-background)] focus-visible:outline-[var(--workspace-brand-focus-inverse)]`;

export const defaultContentCtaProps = {
  title: "Ready to take control?",
  description:
    "Explore the admin panel, manage your modules, and see how every entity connects through a unified relation system.",
  primaryAction: { label: "Open admin panel", href: "/admin" },
  secondaryAction: { label: "Explore features", href: "#features" },
};

export type ContentCtaProps = typeof defaultContentCtaProps;

export function ContentCta(props?: Partial<ContentCtaProps>) {
  const { title, description, primaryAction, secondaryAction } = {
    ...defaultContentCtaProps,
    ...props,
  };

  return (
    <div
      className="w-full bg-[var(--workspace-brand-background)] py-12 sm:py-16"
      data-ds-block="website-builder.widget.content-cta"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 rounded-3xl bg-[var(--workspace-brand-primary)] p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end lg:p-12">
          <div>
            <h2 className="max-w-2xl text-[2rem] font-semibold leading-tight tracking-normal text-white sm:text-[2.5rem]">
              {title}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--workspace-brand-muted-on-primary)]">
              {description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a className={buttonInvertedClass} href={primaryAction.href}>
              {primaryAction.label}
              <ArrowRight className="h-5 w-5 shrink-0" />
            </a>
            <a className={buttonGhostDarkClass} href={secondaryAction.href}>
              {secondaryAction.label}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
