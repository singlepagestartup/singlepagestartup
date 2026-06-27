import { Database, FileText, Globe, Layers } from "lucide-react";

import {
  FeatureListItemDefault,
  type FeatureListItemDefaultProps,
} from "../../../feature/singlepage/list-item-default/Component";

const aboutImageUrl =
  "https://images.unsplash.com/photo-1582005450386-52b25f82d9bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwc3RhcnR1cCUyMHRlYW0lMjBtZWV0aW5nfGVufDF8fHx8MTc3MTcxNTM2OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

type FeatureListItem = Pick<FeatureListItemDefaultProps, "label" | "icon">;

export const defaultContentFilesFindDefaultProps = {
  eyebrow: "About the Platform",
  title: "Built for Builders",
  paragraphs: [
    "We started with a simple idea: what if every common backend feature - ecommerce, CRM, blog, notifications, RBAC - was a pre-built module you could drop into any project?",
    "The result is a platform with 15 composable modules, 50+ entity models, and a powerful admin panel that gives your team full control over every data point.",
  ],
  mediaSrc: aboutImageUrl,
  mediaAlt: "Team at work",
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
      className="w-full py-20 border-y border-slate-200 bg-white"
      data-ds-block="website-builder.widget.content-files-find-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-6xl px-6 grid items-center gap-12 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <img
            className="h-full w-full object-cover"
            src={mediaSrc}
            alt={mediaAlt}
          />
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-slate-500">
            {eyebrow}
          </p>
          <h2 className="text-3xl font-medium leading-9 tracking-tight text-slate-900">
            {title}
          </h2>
          {paragraphs.map((paragraph, index) => (
            <p
              className={`text-base leading-6 text-slate-600 ${index === 0 ? "mt-4" : "mt-3"}`}
              key={paragraph}
            >
              {paragraph}
            </p>
          ))}
          <div
            className="mt-6 grid grid-cols-2 gap-4"
            data-ds-imports="website-builder.feature.list-item-default"
          >
            {features.map((item) => (
              <FeatureListItemDefault key={item.label} {...item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
