import {
  ArrowRight,
  Play,
} from "../../../../../../workspace/utils/components/ModuleIcons";

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

const heroImageUrl = new URL(
  "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
  import.meta.url,
).href;

export const defaultContentHeroProps = {
  feature: {
    label: "v2.0 - Now with 15 modules",
  } satisfies FeatureBadgeDefaultProps,
  title: "Domain control center",
  description:
    "A modular platform for building and managing your entire digital ecosystem - from ecommerce and blogs to AI agents and RBAC - all from a single admin panel.",
  buttons: [
    {
      label: "Open admin panel",
      href: "/admin",
      variant: "primary",
      icon: ArrowRight,
    },
    {
      label: "Learn more",
      href: "#features",
      variant: "secondary",
      icon: Play,
    },
  ] satisfies ButtonsArrayItem[],
  mediaSrc: heroImageUrl,
  mediaAlt: "Editorial image of two people discussing their work",
  statusFeature: {
    label: "Status",
    value: "All systems operational",
  } satisfies Partial<FeatureStatusDefaultProps>,
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
      className="w-full bg-[var(--workspace-brand-background)] py-8 sm:py-12"
      data-ds-block="website-builder.widget.content-hero"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-0 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="flex min-w-0 flex-col items-start justify-center rounded-t-3xl bg-[var(--workspace-brand-primary)] p-6 sm:p-10 lg:rounded-l-3xl lg:rounded-tr-none lg:p-12">
          <div className="mb-6">
            <FeatureBadgeDefault {...feature} />
          </div>
          <h1 className="max-w-[14ch] text-[2.5rem] font-semibold leading-[1.08] tracking-normal text-white sm:text-5xl xl:text-[4rem]">
            {title}
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-[var(--workspace-brand-muted-on-primary)] sm:text-lg sm:leading-8">
            {description}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3 [&_a]:focus-visible:outline-[var(--workspace-brand-focus-inverse)]">
            <ButtonsArrayDefault buttons={buttons} />
          </div>
        </div>
        <div className="relative aspect-square min-w-0 overflow-hidden rounded-b-3xl bg-[var(--workspace-brand-surface)] lg:aspect-auto lg:min-h-[36rem] lg:rounded-r-3xl lg:rounded-bl-none">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src={mediaSrc}
            alt={mediaAlt}
          />
          <FeatureStatusDefault
            {...statusFeature}
            className="absolute bottom-5 left-5 right-5 border-0 bg-white/95 p-4 backdrop-blur-sm sm:bottom-6 sm:left-6 sm:right-6"
          />
        </div>
      </div>
    </div>
  );
}
