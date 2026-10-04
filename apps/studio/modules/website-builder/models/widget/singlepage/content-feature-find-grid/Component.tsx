import {
  Globe,
  Code,
  TrendingUp,
  Layers,
  type ModuleIcon,
} from "../../../../../../workspace/utils/components/ModuleIcons";
import { FeatureCard } from "../../../feature/singlepage/card/Component";

export interface ContentFeatureItem {
  icon: ModuleIcon;
  title: string;
  desc: string;
}

export const defaultContentFeatureFindGridProps = {
  eyebrow: "Capabilities",
  title: "What's included",
  features: [
    {
      icon: Globe,
      title: "Responsive Design",
      desc: "Pixel-perfect layouts that work flawlessly across all devices and screen sizes.",
    },
    {
      icon: Code,
      title: "Clean Code",
      desc: "Modern tech stack with React, Next.js, or static generators — optimized for speed.",
    },
    {
      icon: TrendingUp,
      title: "SEO Ready",
      desc: "Built-in SEO best practices, structured data, and Core Web Vitals optimization.",
    },
    {
      icon: Layers,
      title: "CMS Integration",
      desc: "Content management through headless CMS or custom admin panels.",
    },
  ] satisfies ContentFeatureItem[],
};

export type ContentFeatureFindGridProps =
  typeof defaultContentFeatureFindGridProps;

export function ContentFeatureFindGrid(
  props?: Partial<ContentFeatureFindGridProps>,
) {
  const { eyebrow, title, features } = {
    ...defaultContentFeatureFindGridProps,
    ...props,
  };

  return (
    <section
      className="w-full bg-[var(--workspace-brand-background)] py-12 sm:py-16"
      data-ds-block="website-builder.widget.content-feature-find-grid"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-2 text-sm font-semibold tracking-normal text-[var(--workspace-brand-muted)]">
          {eyebrow}
        </p>
        <h2 className="text-[2rem] font-semibold leading-tight tracking-normal sm:text-[2.5rem] text-[var(--workspace-brand-foreground)]">
          {title}
        </h2>
        <div
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          data-ds-imports="website-builder.feature.card"
        >
          {features.map((f) => (
            <FeatureCard
              key={f.title}
              icon={f.icon}
              title={f.title}
              description={f.desc}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
