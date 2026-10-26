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
    actions,
  } = { ...defaultContentHeroProps, ...props };
  const editorial = props?.appearance === "editorial";
  return (
    <section
      className={`w-full min-w-0 ${editorial ? "bg-card py-10 @3xl:py-12" : "bg-background py-10 @3xl:py-14"}`}
      data-ds-block="website-builder.widget.content-hero"
      data-ds-layer="singlepage"
      data-module="website-builder"
      data-model="widget"
      data-variant={props?.variant ?? "content-hero"}
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-5 @3xl:grid-cols-2 @3xl:gap-10 @3xl:px-8">
        <div className="min-w-0 py-2">
          {feature?.label ? (
            editorial ? (
              <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest">
                <span className="size-2 shrink-0 rounded-full bg-primary" />
                {feature.label}
              </p>
            ) : (
              <Feature {...feature} variant="badge-default" />
            )
          ) : null}
          <h1
            className={`mt-5 max-w-2xl text-balance font-default text-4xl font-semibold leading-[1.08] tracking-normal @3xl:text-5xl ${editorial ? "@5xl:text-[62px]" : "@5xl:text-[56px]"}`}
          >
            {title}
          </h1>
          <div className="mt-5 max-w-lg space-y-4 text-base leading-7 text-muted-foreground">
            {description}
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            {actions ?? <ButtonsArray variant="default" buttons={buttons} />}
          </div>
        </div>
        <figure className="min-w-0 overflow-hidden rounded-3xl">
          <img
            className="block aspect-square h-auto w-full object-cover"
            width={1254}
            height={1254}
            src={mediaSrc}
            alt={mediaAlt}
          />
          {statusFeature ? (
            <Feature
              {...statusFeature}
              variant="status-default"
              className="mt-4 border border-border bg-card p-4"
            />
          ) : null}
        </figure>
      </div>
    </section>
  );
}

const Play = createIcon("play");
const ArrowRight = createIcon("arrow-right");
const heroImageUrl =
  "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png";
export const defaultContentHeroProps = {
  feature: {
    label: "Code Framework · Free code",
  } satisfies FeatureBadgeDefaultProps,
  title: "Turn your business brief into a product.",
  description:
    "Prepare the decisions behind your business, then build with a coding agent. Reuse accounts, content, orders and payments while you shape your own product.",
  buttons: [
    {
      label: "Get the code",
      href: "https://github.com/singlepagestartup/singlepagestartup",
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
};

import type { IModuleIconProps } from "./interface";
