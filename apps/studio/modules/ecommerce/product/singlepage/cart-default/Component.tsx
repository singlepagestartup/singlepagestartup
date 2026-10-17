import type {
  IComponentProps,
  ProductCartDefaultItem,
  ProductCartDefaultProps,
} from "./interface";
export type {
  ProductCartDefaultItem,
  ProductCartDefaultProps,
} from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import {
  forwardRef,
  type SVGProps,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  memo,
} from "react";
import { twMerge as twMerge } from "tailwind-merge";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button/index";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import { formatCartMoney } from "../../../cart/shared";
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

const Trash2 = createIcon("trash");
const Plus = createIcon("plus");
const Minus = createIcon("minus");
const Button = forwardRefControl<
  HTMLButtonElement,
  ButtonControlProps<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "plain" | "danger";
  }
>(function Button({ variant = "primary", ...props }, ref) {
  return (
    <WebsiteBuilderModuleButton
      {...props}
      variant="control"
      appearance={variant}
      ref={ref}
    />
  );
});
export const defaultProductCartDefaultItem: ProductCartDefaultItem = {
  id: "srv-consulting",
  slug: "technical-consulting",
  title: "Technical Consulting",
  image:
    "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png",
  priceLabel: "$250/hr",
  price: 250,
  quantity: 1,
};
export const defaultProductCartDefaultProps: ProductCartDefaultProps = {
  item: defaultProductCartDefaultItem,
  compact: false,
  showRemove: true,
};
export const ProductCartDefault = memo(function ProductCartDefault(
  props: IComponentProps,
) {
  const {
    item,
    compact,
    href,
    showRemove,
    target,
    onDecrease,
    onIncrease,
    onRemove,
  } = {
    ...defaultProductCartDefaultProps,
    ...props,
  };
  const productHref = href ?? `/ecommerce/products/${item.slug}`;
  return (
    <div
      className="flex min-w-0 gap-3 sm:gap-4"
      data-ds-block="ecommerce.product.cart-default"
      data-ds-layer="singlepage"
      data-module="ecommerce"
      data-model="product"
      data-variant={props.variant ?? "cart-default"}
    >
      <a
        className="block h-20 w-20 shrink-0 self-start overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        href={productHref}
        target={target}
      >
        <img
          alt={item.title}
          className="block h-full w-full object-cover"
          src={item.image}
        />
      </a>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <a
              className="block break-words text-sm font-semibold text-foreground no-underline transition hover:text-muted-foreground"
              href={productHref}
              target={target}
            >
              {item.title}
            </a>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {item.priceLabel}
            </span>
          </div>
          {showRemove ? (
            <Button
              variant="plain"
              aria-label={`Remove ${item.title}`}
              className="h-11 w-11 shrink-0 px-0 hover:bg-destructive-surface hover:text-destructive"
              onClick={() => onRemove?.(item)}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          ) : null}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          {compact ? (
            <span className="text-xs text-muted-foreground">
              Qty: {item.quantity}
            </span>
          ) : (
            <div
              role="group"
              aria-label={`${item.title} quantity`}
              className="flex items-center gap-1 rounded-xl bg-muted p-1"
            >
              <Button
                variant="plain"
                aria-label={`Decrease ${item.title} quantity`}
                className="h-11 w-11 px-0"
                onClick={() => onDecrease?.(item)}
              >
                <Minus className="h-5 w-5" />
              </Button>
              <output
                className="min-w-6 text-center text-sm font-semibold"
                aria-live="polite"
              >
                {item.quantity}
              </output>
              <Button
                variant="plain"
                aria-label={`Increase ${item.title} quantity`}
                className="h-11 w-11 px-0"
                onClick={() => onIncrease?.(item)}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          )}
          <span className="text-sm font-semibold text-foreground">
            {formatCartMoney(item.price * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
});
