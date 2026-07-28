/**
 * ecommerce.product.tier
 *
 * Pricing-tier product card. Owned by the ecommerce module (model: product).
 * Used by ecommerce.widget.product-find-tiers to render a list of products.
 */

import { CheckCircle2 } from "lucide-react";

export type ProductTierVariant = "default" | "featured";

export interface ProductTierProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  variant?: ProductTierVariant;
  badge?: string;
  featured?: boolean;
  className?: string;
}

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
  cta: "Get Started",
  variant: "default",
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
  cta: "Start Free Trial",
  variant: "featured",
  badge: "Most Popular",
};

export function ProductTier(props?: Partial<ProductTierProps>) {
  const {
    name,
    price,
    period,
    description,
    features,
    cta,
    variant,
    badge,
    featured,
    className,
  } = {
    ...defaultProductTierProps,
    ...props,
  };
  const isFeatured = variant === "featured" || featured === true;
  const cardClassName = [
    "w-full rounded-xl border p-6 transition",
    isFeatured
      ? "border-slate-400 bg-white shadow-lg ring-1 ring-slate-200"
      : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white hover:shadow-sm",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const buttonClassName = [
    "mt-6 w-full rounded-md border px-4 py-2.5 text-sm transition",
    isFeatured
      ? "border-slate-400 bg-slate-900 text-white hover:bg-slate-800"
      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  ].join(" ");

  return (
    <article
      className={cardClassName}
      data-ds-block="ecommerce.product.tier"
      data-ds-display-variant={isFeatured ? "featured" : "default"}
      data-ds-layer="singlepage"
    >
      {isFeatured ? (
        <span className="mb-4 inline-block rounded-full border border-slate-300 bg-slate-900 px-3 py-0.5 text-xs text-white">
          {badge ?? "Most Popular"}
        </span>
      ) : null}
      <h3 className="text-sm font-medium text-slate-900">{name}</h3>
      <p className="mt-2 flex items-baseline gap-1">
        <strong className="text-4xl font-medium leading-none text-slate-900">
          {price}
        </strong>
        <span className="text-sm text-slate-500">{period}</span>
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      <button className={buttonClassName} type="button">
        {cta}
      </button>
      <ul className="mt-6 space-y-2.5 border-t border-slate-200 pt-5">
        {features.map((feature) => (
          <li
            className="flex items-start gap-2 text-sm text-slate-600"
            key={feature}
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            {feature}
          </li>
        ))}
      </ul>
    </article>
  );
}
