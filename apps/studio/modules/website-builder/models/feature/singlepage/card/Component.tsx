/**
 * website-builder.feature.card
 *
 * Single feature card (icon + title + description). Owned by the website-builder
 * module (model: feature). Feature-grid widgets compose a list of these instead
 * of re-implementing the card markup.
 */
import {
  Globe,
  type ModuleIcon,
} from "../../../../../../workspace/utils/components/ModuleIcons";

export const defaultFeatureCardProps = {
  icon: Globe as ModuleIcon,
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
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-6 sm:p-8"
    >
      <span className="mb-6 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)]">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="text-xl font-semibold leading-7 tracking-normal text-[var(--workspace-brand-foreground)]">
        {title}
      </h3>
      <p className="mt-3 text-base leading-7 text-[var(--workspace-brand-muted)]">
        {description}
      </p>
    </article>
  );
}
