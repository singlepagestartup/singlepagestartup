import { Component as SharedIcon } from "../../../../shared/icon";

import {
  type IComponentProps,
  type ButtonSecondaryProps,
  type ModuleIcon,
  type IModuleIconProps,
} from "./interface";
export type { ButtonSecondaryProps, ModuleIcon } from "./interface";
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

export function ButtonSecondary(props?: IComponentProps) {
  const label = props?.label ?? defaultButtonSecondaryProps.label;
  const href = props?.href ?? defaultButtonSecondaryProps.href;
  const Icon = props?.icon ?? Play;
  return (
    <a
      className={
        props?.inverse
          ? "inline-flex min-h-11 items-center gap-2 rounded-xl border border-default-foreground/25 px-4 text-sm font-semibold text-default-foreground no-underline hover:bg-card/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          : `${kit.secondary} no-underline hover:bg-muted`
      }
      data-ds-block="website-builder.button.secondary"
      data-ds-layer="singlepage"
      href={href}
      target={props?.target}
      data-module="website-builder"
      data-model="button"
      data-variant={props?.variant ?? "secondary"}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {label}
    </a>
  );
}
const Play = createIcon("play");
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  secondary: `${buttonBase} border border-border bg-card text-foreground enabled:hover:bg-muted ${focus}`,
};
export const defaultButtonSecondaryProps: ButtonSecondaryProps = {
  label: "Learn more",
  href: "#features",
  icon: Play,
};
