import type { IComponentProps, ProductPinnedProps } from "./interface";
export type { ProductPinnedProps } from "./interface";

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

export function ProductPinned(props?: IComponentProps) {
  const { slug, title, shortDescription, priceLabel, category, href, target } =
    {
      ...defaultProductPinnedProps,
      ...props,
    };
  const productHref = href ?? `/ecommerce/products/${slug}`;
  return (
    <a
      href={productHref}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      className="group flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 transition hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      data-ds-block="ecommerce.product.pinned"
      data-ds-layer="singlepage"
      data-module="ecommerce"
      data-model="product"
      data-variant={props?.variant ?? "pinned"}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
          <Package className="h-5 w-5" />
        </span>
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {category}
        </span>
      </div>
      <h4 className="mt-5 text-lg font-semibold leading-6 text-foreground">
        {title}
      </h4>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {shortDescription}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-base font-semibold">{priceLabel}</span>
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          View service <ArrowUpRight className="h-5 w-5" />
        </span>
      </div>
    </a>
  );
}
const Package = createIcon("package");
const ArrowUpRight = createIcon("arrow-up-right");
export const defaultProductPinnedProps: ProductPinnedProps = {
  slug: "consulting",
  title: "Technical Consulting",
  shortDescription:
    "Strategic technical advice on architecture, stack selection, and digital transformation.",
  priceLabel: "$250/hr",
  category: "consulting",
};
