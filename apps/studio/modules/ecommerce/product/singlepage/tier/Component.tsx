import type {
  IComponentProps,
  ProductTierVariant,
  ProductTierProps,
} from "./interface";
export type { ProductTierVariant, ProductTierProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import {
  forwardRef,
  type SVGProps,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
} from "react";
import { twMerge as twMerge } from "tailwind-merge";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button/index";
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

export function ProductTier(props?: IComponentProps) {
  const {
    name,
    price,
    period,
    description,
    features,
    cta,
    appearance,
    badge,
    featured,
    className,
  } = {
    ...defaultProductTierProps,
    ...props,
  };
  const isFeatured = appearance === "featured" || featured === true;
  const cardClassName = [
    "flex h-full min-w-0 flex-col rounded-3xl border p-6 sm:p-8",
    isFeatured
      ? "border-foreground bg-default text-default-foreground"
      : "border-border bg-card text-foreground",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const mutedClassName = isFeatured
    ? "text-default-muted-foreground"
    : "text-muted-foreground";
  return (
    <article
      className={cardClassName}
      data-ds-block="ecommerce.product.tier"
      data-ds-display-variant={isFeatured ? "featured" : "default"}
      data-ds-layer="singlepage"
      data-module="ecommerce"
      data-model="product"
      data-variant={props?.variant ?? "tier"}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-xl font-semibold">{name}</h3>
        {isFeatured ? (
          <span className="rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold">
            {badge ?? "Most popular"}
          </span>
        ) : null}
      </div>
      <p className="mt-8 flex flex-wrap items-baseline gap-2">
        <strong className="text-5xl font-semibold leading-none">{price}</strong>
        <span className={`text-sm ${mutedClassName}`}>{period}</span>
      </p>
      <p className={`mt-5 min-h-12 text-base leading-6 ${mutedClassName}`}>
        {description}
      </p>
      <Button
        variant={isFeatured ? "primary" : "secondary"}
        className={`mt-7 w-full ${isFeatured ? "focus-visible:outline-card" : ""}`}
      >
        {cta}
      </Button>
      <ul
        className={`mt-8 flex-1 space-y-4 border-t pt-6 ${isFeatured ? "border-default-muted-foreground/30" : "border-border"}`}
      >
        {features.map((feature) => (
          <li
            key={feature}
            className={`flex items-start gap-3 text-sm leading-6 ${mutedClassName}`}
          >
            <CheckCircle2
              className={`mt-0.5 h-5 w-5 shrink-0 ${isFeatured ? "text-primary" : "text-foreground"}`}
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
const CheckCircle2 = createIcon("check-circle");
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
export const defaultProductTierProps: ProductTierProps = {
  name: "Free",
  price: "$0",
  period: "/month",
  description: "For personal projects and experimentation.",
  features: [
    "1 project",
    "3 modules",
    "Community support",
    "1 GB storage",
    "Basic analytics",
  ],
  cta: "Get started",
  appearance: "default",
};
export const featuredProductTierProps: ProductTierProps = {
  name: "Startup",
  price: "$49",
  period: "/month",
  description: "Everything a growing startup needs.",
  features: [
    "5 projects",
    "All 15 modules",
    "Priority support",
    "50 GB storage",
    "Advanced analytics",
    "Custom domain",
    "API access",
  ],
  cta: "Start free trial",
  appearance: "featured",
  badge: "Most popular",
};
