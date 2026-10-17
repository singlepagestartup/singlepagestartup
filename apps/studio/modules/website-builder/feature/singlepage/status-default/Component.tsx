import type { IComponentProps, FeatureStatusDefaultProps } from "./interface";
export type { FeatureStatusDefaultProps } from "./interface";
import { Component as SharedIcon } from "../../../../shared/icon";
import { forwardRef, type SVGProps } from "react";
import { twMerge as twMergePresentation, twMerge } from "tailwind-merge";
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
            className={twMergePresentation("h-5 w-5", className)}
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

export function FeatureStatusDefault(props?: IComponentProps) {
  const {
    icon: Icon,
    label,
    value,
    className,
  } = {
    ...defaultFeatureStatusDefaultProps,
    ...props,
  };
  const rootClassName = twMerge(
    "min-w-0 rounded-2xl border border-border bg-card p-5",
    className,
  );
  return (
    <div
      className={rootClassName}
      data-ds-block="website-builder.feature.status-default"
      data-ds-layer="singlepage"
      data-module="website-builder"
      data-model="feature"
      data-variant={props?.variant ?? "status-default"}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <small className="block text-xs text-muted-foreground">{label}</small>
          <strong className="block text-sm font-semibold leading-6 text-foreground">
            {value}
          </strong>
        </span>
      </div>
    </div>
  );
}
const Check = createIcon("check");
export const defaultFeatureStatusDefaultProps = {
  icon: Check as ModuleIcon,
  label: "Status",
  value: "All systems operational",
  className: "",
};

import type { ModuleIcon } from "./interface";
