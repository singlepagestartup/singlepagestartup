import type { IComponentProps, CartButtonDefaultProps } from "./interface";
export type { CartButtonDefaultProps } from "./interface";

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

export function CartButtonDefault(props?: IComponentProps) {
  const { count, label, onClick } = {
    ...defaultCartButtonDefaultProps,
    ...props,
  };
  return (
    <button
      aria-label={label}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      data-ds-block="ecommerce.cart.button-default"
      data-ds-layer="singlepage"
      onClick={onClick}
      type="button"
      data-module="ecommerce"
      data-model="cart"
      data-variant={props?.variant ?? "button-default"}
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary text-primary-foreground px-1 text-xs font-semibold">
          {count}
        </span>
      ) : null}
    </button>
  );
}
const ShoppingCart = createIcon("shopping-cart");
export const defaultCartButtonDefaultProps: CartButtonDefaultProps = {
  count: 1,
  label: "Open cart",
};
