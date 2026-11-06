import {
  type IComponentProps,
  type FeatureListItemDefaultProps,
  type ModuleIcon,
} from "./interface";
export type { FeatureListItemDefaultProps } from "./interface";
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

export function FeatureListItemDefault(props?: IComponentProps) {
  const {
    icon: Icon,
    label,
    className,
  } = {
    ...defaultFeatureListItemDefaultProps,
    ...props,
  };
  const rootClassName = [
    "flex min-w-0 items-start gap-3 text-base leading-7 text-foreground",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span
      className={rootClassName}
      data-ds-block="website-builder.feature.list-item-default"
      data-ds-layer="singlepage"
      data-module="website-builder"
      data-model="feature"
      data-variant={props?.variant ?? "list-item-default"}
    >
      <Icon className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
      <span>{label}</span>
    </span>
  );
}
const Layers = createIcon("stack");
export const defaultFeatureListItemDefaultProps = {
  icon: Layers as ModuleIcon,
  label: "Modular architecture",
  className: "",
};
