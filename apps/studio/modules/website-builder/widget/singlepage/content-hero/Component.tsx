import type { IComponentProps, ContentHeroProps } from "./interface";
export type { ContentHeroProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";
import { forwardRef, type SVGProps } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import {
  Component as ButtonsArray,
  type ButtonsArrayItem,
} from "../../../buttons-array/index";
import {
  Component as Feature,
  type FeatureBadgeDefaultProps,
  type FeatureStatusDefaultProps,
} from "../../../feature/index";

type IconName = keyof typeof IconGlyphs;
function createIcon(name: IconName) {
  const Component = forwardRef<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMerge("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function ContentHero(props?: IComponentProps) {
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
      className="w-full bg-muted py-8 sm:py-12"
      data-ds-block="website-builder.widget.content-hero"
      data-ds-layer="singlepage"
      data-module="website-builder"
      data-model="widget"
      data-variant={props?.variant ?? "content-hero"}
    >
      <div className="mx-auto grid w-full max-w-7xl gap-0 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="flex min-w-0 flex-col items-start justify-center rounded-t-3xl bg-default p-6 sm:p-10 lg:rounded-l-3xl lg:rounded-tr-none lg:p-12">
          <div className="mb-6">
            <Feature {...feature} variant="badge-default" />
          </div>
          <h1 className="max-w-[14ch] text-[2.5rem] font-semibold leading-[1.08] tracking-normal text-default-foreground sm:text-5xl xl:text-[4rem]">
            {title}
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-default-muted-foreground sm:text-lg sm:leading-8">
            {description}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3 [&_a]:focus-visible:outline-card">
            <ButtonsArray variant="default" buttons={buttons} />
          </div>
        </div>
        <div className="relative aspect-square min-w-0 overflow-hidden rounded-b-3xl bg-card lg:aspect-auto lg:min-h-[36rem] lg:rounded-r-3xl lg:rounded-bl-none">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src={mediaSrc}
            alt={mediaAlt}
          />
          <Feature
            {...statusFeature}
            variant="status-default"
            className="absolute bottom-5 left-5 right-5 border-0 bg-card/95 p-4 backdrop-blur-sm sm:bottom-6 sm:left-6 sm:right-6"
          />
        </div>
      </div>
    </div>
  );
}
const Play = createIcon("play");
const ArrowRight = createIcon("arrow-right");
const heroImageUrl =
  "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png";
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

import type { IModuleIconProps } from "./interface";
