import type { IComponentProps, ProductCardRelatedProps } from "./interface";
export type { ProductCardRelatedProps } from "./interface";

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

/**
 * ecommerce.product.card-related
 *
 * Simpler related product card (image, category badge + price, title, subtitle).
 * Owned by the ecommerce module (model: product).
 * Source: ProductPage WidgetRelated card (lines 653-679).
 */

export function ProductCardRelated(props?: IComponentProps) {
  const { slug, image, priceLabel, title, subtitle, href, target } = {
    ...defaultProductCardRelatedProps,
    ...props,
  };
  const productHref = href ?? `/ecommerce/products/${slug}`;
  return (
    <a
      href={productHref}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      aria-label={`View ${title}`}
      className="group flex h-full min-w-0 cursor-pointer items-start gap-4 rounded-2xl border border-border bg-card p-5 transition motion-reduce:transition-none hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      data-ds-block="ecommerce.product.card-related"
      data-ds-layer="singlepage"
      data-module="ecommerce"
      data-model="product"
      data-variant={props?.variant ?? "card-related"}
    >
      <img
        src={image}
        alt=""
        className="block h-20 w-20 shrink-0 self-start rounded-xl object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-lg font-semibold leading-6 text-foreground">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-semibold text-foreground">
            {priceLabel}
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            View <ArrowUpRight className="h-5 w-5" />
          </span>
        </div>
      </div>
    </a>
  );
}
const ArrowUpRight = createIcon("arrow-up-right");
export const defaultProductCardRelatedProps: ProductCardRelatedProps = {
  slug: "ui-ux-design",
  image:
    "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
  category: "design",
  priceLabel: "from $3,499",
  title: "UI/UX Design",
  subtitle: "User-centered design that converts",
};
