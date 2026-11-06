import { Component as SharedIcon } from "../../../../shared/icon";

import {
  type IComponentProps,
  type ButtonPrimaryProps,
  type ModuleIcon,
  type IModuleIconProps,
} from "./interface";
export type { ButtonPrimaryProps, ModuleIcon } from "./interface";
import { forwardRef, type SVGProps } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";

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
function Icon({
  name,
  size = 20,
  className = "",
  svgProps,
}: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return (
    <SharedIcon
      variant="phosphor"
      name={name}
      size={size}
      className={className}
      svgProps={svgProps}
    />
  );
}

export function ButtonPrimary(props?: IComponentProps) {
  const label = props?.label ?? defaultButtonPrimaryProps.label;
  const href = props?.href ?? defaultButtonPrimaryProps.href;
  const Icon = props?.icon ?? ArrowRight;
  return (
    <a
      className={`${kit.button} no-underline hover:brightness-95`}
      data-ds-block="website-builder.button.primary"
      data-ds-layer="singlepage"
      href={href}
      target={props?.target}
      data-module="website-builder"
      data-model="button"
      data-variant={props?.variant ?? "primary"}
    >
      {label}
      <Icon className="h-5 w-5 shrink-0" />
    </a>
  );
}
const ArrowRight = createIcon("arrow-right");
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  button: `${buttonBase} bg-primary text-primary-foreground enabled:hover:brightness-95 ${focus}`,
};
export const defaultButtonPrimaryProps: ButtonPrimaryProps = {
  label: "Open admin panel",
  href: "/admin",
  icon: ArrowRight,
};
