import {
  Database,
  FileText,
  Globe,
  Layers,
} from "../../../../../../workspace/utils/components/ModuleIcons";

import {
  FeatureListItemDefault,
  type FeatureListItemDefaultProps,
} from "../../../feature/singlepage/list-item-default/Component";

const aboutImageUrl = new URL(
  "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
  import.meta.url,
).href;

type FeatureListItem = Pick<FeatureListItemDefaultProps, "label" | "icon">;

export const defaultContentFilesFindDefaultProps = {
  eyebrow: "About the platform",
  title: "Built for builders",
  paragraphs: [
    "We started with a simple idea: what if every common backend feature - ecommerce, CRM, blog, notifications, RBAC - was a pre-built module you could drop into any project?",
    "The result is a platform with 15 composable modules, 50+ entity models, and a powerful admin panel that gives your team full control over every data point.",
  ],
  mediaSrc: aboutImageUrl,
  mediaAlt: "Editorial image of a person handing over a parcel",
  features: [
    { label: "Modular architecture", icon: Layers },
    { label: "Relation system", icon: Database },
    { label: "Localized content", icon: Globe },
    { label: "Rich-text editor", icon: FileText },
  ] satisfies FeatureListItem[],
};

export type ContentFilesFindDefaultProps =
  typeof defaultContentFilesFindDefaultProps;

export function ContentFilesFindDefault(
  props?: Partial<ContentFilesFindDefaultProps>,
) {
  const { eyebrow, title, paragraphs, mediaSrc, mediaAlt, features } = {
    ...defaultContentFilesFindDefaultProps,
    ...props,
  };

  return (
    <div
      className="w-full bg-[var(--workspace-brand-background)] py-12 sm:py-16"
      data-ds-block="website-builder.widget.content-files-find-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-3xl bg-[var(--workspace-brand-surface)] lg:grid-cols-2">
          <div className="relative aspect-square min-w-0 lg:aspect-auto">
            <img
              className="absolute inset-0 h-full w-full object-cover"
              src={mediaSrc}
              alt={mediaAlt}
            />
          </div>
          <div className="min-w-0 p-6 sm:p-8 lg:p-10">
            <p className="mb-2 text-sm font-semibold tracking-normal text-[var(--workspace-brand-muted)]">
              {eyebrow}
            </p>
            <h2 className="text-[2rem] font-semibold leading-tight tracking-normal sm:text-[2.5rem] text-[var(--workspace-brand-foreground)]">
              {title}
            </h2>
            {paragraphs.map((paragraph, index) => (
              <p
                className={`text-base leading-7 text-[var(--workspace-brand-muted)] ${index === 0 ? "mt-4" : "mt-3"}`}
                key={paragraph}
              >
                {paragraph}
              </p>
            ))}
            <div
              className="mt-8 grid gap-4 sm:grid-cols-2"
              data-ds-imports="website-builder.feature.list-item-default"
            >
              {features.map((item) => (
                <FeatureListItemDefault key={item.label} {...item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
