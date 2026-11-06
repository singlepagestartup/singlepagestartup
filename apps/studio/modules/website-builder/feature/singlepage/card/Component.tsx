import {
  type IComponentProps,
  type FeatureCardProps,
  type ModuleIcon,
} from "./interface";
export type { FeatureCardProps } from "./interface";
import { Component as SharedIcon } from "../../../../shared/icon";
import { forwardRef, type SVGProps } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";

interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
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

export function FeatureCard(props?: IComponentProps) {
  const {
    icon: Icon,
    title,
    description,
  } = { ...defaultFeatureCardProps, ...props };
  return (
    <article
      data-ds-block="website-builder.feature.card"
      data-ds-layer="singlepage"
      className="flex h-full min-w-0 flex-col rounded-2xl border border-border bg-card p-6 sm:p-8"
      data-module="website-builder"
      data-model="feature"
      data-variant={props?.variant ?? "card"}
    >
      <span className="mb-6 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="text-xl font-semibold leading-7 tracking-normal text-foreground">
        {title}
      </h3>
      <p className="mt-3 text-base leading-7 text-muted-foreground">
        {description}
      </p>
    </article>
  );
}
const Globe = createIcon("globe");
export const defaultFeatureCardProps = {
  icon: Globe as ModuleIcon,
  title: "Website Builder",
  description:
    "Build pages visually with widgets, sliders, buttons, and logotypes managed from the admin panel.",
};
