import { Globe, Code, TrendingUp, Layers, type LucideIcon } from "lucide-react";

export interface ContentFeatureItem {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export const defaultContentFeatureFindGridProps = {
  eyebrow: "Capabilities",
  title: "What's Included",
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
      className="w-full py-16"
      data-ds-block="website-builder.widget.content-feature-find-grid"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <p className="mb-2 text-xs uppercase tracking-widest text-slate-500">
          {eyebrow}
        </p>
        <h2 className="text-2xl tracking-tight text-slate-900">{title}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
            >
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
