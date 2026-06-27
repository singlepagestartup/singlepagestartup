/**
 * website-builder.feature.card
 *
 * Single feature card (icon + title + description). Owned by the website-builder
 * module (model: feature). Feature-grid widgets compose a list of these instead
 * of re-implementing the card markup.
 */
import { Globe, type LucideIcon } from "lucide-react";

export const defaultFeatureCardProps = {
  icon: Globe as LucideIcon,
  title: "Website Builder",
  description:
    "Build pages visually with widgets, sliders, buttons, and logotypes managed from the admin panel.",
};

export type FeatureCardProps = typeof defaultFeatureCardProps;

export function FeatureCard(props?: Partial<FeatureCardProps>) {
  const {
    icon: Icon,
    title,
    description,
  } = { ...defaultFeatureCardProps, ...props };

  return (
    <article
      data-ds-block="website-builder.feature.card"
      data-ds-layer="singlepage"
      className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-md"
    >
      <span className="mb-4 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition group-hover:border-slate-300 group-hover:bg-slate-100">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="text-sm font-medium text-slate-900">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-500">{description}</p>
    </article>
  );
}
