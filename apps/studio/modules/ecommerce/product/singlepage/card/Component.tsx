import type { IComponentProps, ProductCardProps } from "./interface";
export type { ProductCardProps } from "./interface";

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

export function ProductCard(props?: IComponentProps) {
  const {
    slug,
    href,
    target,
    image,
    badge,
    priceLabel,
    title,
    subtitle,
    shortDescription,
  } = { ...defaultProductCardProps, ...props };
  const description = subtitle || shortDescription;
  return (
    <a
      href={href ?? `/ecommerce/products/${slug}`}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      className="group flex h-full cursor-pointer min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card transition motion-reduce:transition-none hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      data-ds-block="ecommerce.product.card"
      data-ds-layer="singlepage"
      aria-label={`Open ${title}`}
      data-module="ecommerce"
      data-model="product"
      data-variant={props?.variant ?? "card"}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img src={image} alt={title} className="h-full w-full object-cover" />
        {badge ? (
          <span className="absolute left-4 top-4 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-foreground">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <h3 className="text-2xl font-semibold leading-tight text-foreground">
          {title}
        </h3>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <span className="text-base font-semibold text-foreground">
            {priceLabel}
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            Details <ArrowUpRight className="h-5 w-5" />
          </span>
        </div>
      </div>
    </a>
  );
}
const ArrowUpRight = createIcon("arrow-up-right");
export const defaultProductCardProps: ProductCardProps = {
  slug: "website-development",
  image:
    "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
  category: "development",
  priceLabel: "from $4,999",
  title: "Website Development",
  subtitle: "Custom websites built for performance",
  shortDescription:
    "Full-cycle website development — from landing pages to complex multi-page portals with CMS integration and responsive design.",
  techStack: ["React", "Next.js", "Tailwind CSS", "TypeScript", "Vercel"],
};
