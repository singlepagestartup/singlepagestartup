import { ArrowRight } from "lucide-react";

const buttonBaseClass =
  "inline-flex items-center justify-center gap-2 rounded-md border px-5 py-2.5 text-sm no-underline transition";
const buttonInvertedClass = `${buttonBaseClass} border-slate-600 bg-white text-slate-900 hover:bg-slate-100`;
const buttonGhostDarkClass = `${buttonBaseClass} border-slate-600 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white`;

export const defaultContentCtaProps = {
  title: "Ready to take control?",
  description:
    "Explore the admin panel, manage your modules, and see how every entity connects through a unified relation system.",
  primaryAction: { label: "Open Admin Panel", href: "/admin" },
  secondaryAction: { label: "Explore Features", href: "#features" },
};

export type ContentCtaProps = typeof defaultContentCtaProps;

export function ContentCta(props?: Partial<ContentCtaProps>) {
  const { title, description, primaryAction, secondaryAction } = {
    ...defaultContentCtaProps,
    ...props,
  };

  return (
    <div
      className="w-full border-y border-slate-200 bg-slate-900 py-16"
      data-ds-block="website-builder.widget.content-cta"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-6xl px-6 text-center">
        <h2 className="text-3xl font-medium leading-9 tracking-tight text-white">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
          {description}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a className={buttonInvertedClass} href={primaryAction.href}>
            {primaryAction.label}
            <ArrowRight className="h-4 w-4" />
          </a>
          <a className={buttonGhostDarkClass} href={secondaryAction.href}>
            {secondaryAction.label}
          </a>
        </div>
      </div>
    </div>
  );
}
