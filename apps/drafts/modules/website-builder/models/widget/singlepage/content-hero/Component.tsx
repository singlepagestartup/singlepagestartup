import { ArrowRight, Play } from "lucide-react";

import {
  ButtonsArrayDefault,
  type ButtonsArrayItem,
} from "../../../buttons-array/singlepage/default/Component";
import {
  FeatureBadgeDefault,
  type FeatureBadgeDefaultProps,
} from "../../../feature/singlepage/badge-default/Component";
import {
  FeatureStatusDefault,
  type FeatureStatusDefaultProps,
} from "../../../feature/singlepage/status-default/Component";

const heroImageUrl =
  "https://images.unsplash.com/photo-1618410325698-018bb3eb2318?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3b3Jrc3BhY2UlMjBsYXB0b3AlMjBkYXNoYm9hcmR8ZW58MXx8fHwxNzcxNzE1MzY4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

export const defaultContentHeroProps = {
  feature: {
    label: "v2.0 - Now with 15 modules",
  } satisfies FeatureBadgeDefaultProps,
  title: "Domain Control Center",
  description:
    "A modular platform for building and managing your entire digital ecosystem - from ecommerce and blogs to AI agents and RBAC - all from a single admin panel.",
  buttons: [
    {
      label: "Open Admin Panel",
      href: "/admin",
      variant: "primary",
      icon: ArrowRight,
    },
    {
      label: "Learn More",
      href: "#features",
      variant: "secondary",
      icon: Play,
    },
  ] satisfies ButtonsArrayItem[],
  mediaSrc: heroImageUrl,
  mediaAlt: "Dashboard preview",
  statusFeature: {
    label: "Status",
    value: "All systems operational",
  } satisfies FeatureStatusDefaultProps,
};

export type ContentHeroProps = typeof defaultContentHeroProps;

export function ContentHero(props?: Partial<ContentHeroProps>) {
  const {
    feature,
    title,
    description,
    buttons,
    mediaSrc,
    mediaAlt,
    statusFeature,
  } = { ...defaultContentHeroProps, ...props };

  return (
    <div
      className="relative w-full overflow-hidden border-b border-slate-200 bg-white"
      data-ds-block="website-builder.widget.content-hero"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <div className="mb-5">
            <FeatureBadgeDefault {...feature} />
          </div>
          <h1 className="text-4xl font-medium tracking-tight text-slate-900 lg:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-6 text-slate-600">
            {description}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonsArrayDefault buttons={buttons} />
          </div>
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-lg">
            <img
              className="h-auto w-full object-cover"
              src={mediaSrc}
              alt={mediaAlt}
            />
          </div>
          <FeatureStatusDefault
            {...statusFeature}
            className="absolute -bottom-4 -left-4"
          />
        </div>
      </div>
    </div>
  );
}
