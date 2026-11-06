import {
  type IComponentProps,
  type ButtonsArrayItem,
  type ButtonsArrayDefaultProps,
  type ModuleIcon,
  type IModuleIconProps,
} from "./interface";
export type {
  ButtonsArrayItem,
  ButtonsArrayDefaultProps,
  ModuleIcon,
} from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import { forwardRef, type SVGProps } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import { Component as Button } from "../../../button/index";

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

export function ButtonsArrayDefault(props?: IComponentProps) {
  const { ariaLabel, buttons, orientation, title } = {
    ...defaultButtonsArrayProps,
    ...props,
  };
  const layoutClass =
    orientation === "vertical"
      ? `flex min-w-0 flex-col items-start ${title ? "gap-0" : "gap-3"}`
      : "flex min-w-0 flex-wrap items-center gap-3";
  return (
    <div
      aria-label={ariaLabel}
      className={layoutClass}
      data-ds-block="website-builder.buttons-array.default"
      data-ds-layer="singlepage"
      role={ariaLabel ? "navigation" : undefined}
      data-module="website-builder"
      data-model="buttons-array"
      data-variant={props?.variant ?? "default"}
    >
      {title ? (
        <h3 className="mb-6 w-full text-base font-semibold leading-6 tracking-normal text-foreground">
          {title}
        </h3>
      ) : null}
      {buttons.map((button) => {
        if (button.variant === "link") {
          return (
            <Button
              variant="link"
              href={button.href}
              target={button.target}
              key={`${button.variant}:${button.href}:${button.label}`}
              label={button.label}
              size={button.size}
              tone={button.tone}
            />
          );
        }
        return button.variant === "secondary" ? (
          <Button
            variant="secondary"
            href={button.href}
            target={button.target}
            inverse={button.inverse}
            icon={button.icon}
            key={`${button.variant}:${button.href}:${button.label}`}
            label={button.label}
          />
        ) : (
          <Button
            variant="primary"
            href={button.href}
            target={button.target}
            icon={button.icon}
            key={`${button.variant}:${button.href}:${button.label}`}
            label={button.label}
          />
        );
      })}
    </div>
  );
}
const Play = createIcon("play");
const ArrowRight = createIcon("arrow-right");
export const defaultButtonsArrayProps: ButtonsArrayDefaultProps = {
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
};
