/**
 * ecommerce.product.tier
 *
 * Pricing-tier product card. Owned by the ecommerce module (model: product).
 * Used by ecommerce.widget.product-find-tiers to render a list of products.
 */

import { Button } from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import { CheckCircle2 } from "../../../../../../workspace/utils/components/ModuleIcons";

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
  cta: "Get started",
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
  cta: "Start free trial",
  variant: "featured",
  badge: "Most popular",
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
    "flex h-full min-w-0 flex-col rounded-3xl border p-6 sm:p-8",
    isFeatured
      ? "border-[var(--workspace-brand-primary)] bg-[var(--workspace-brand-primary)] text-[var(--workspace-brand-on-primary)]"
      : "border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-foreground)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const mutedClassName = isFeatured
    ? "text-[var(--workspace-brand-muted-on-primary)]"
    : "text-[var(--workspace-brand-muted)]";

  return (
    <article
      className={cardClassName}
      data-ds-block="ecommerce.product.tier"
      data-ds-display-variant={isFeatured ? "featured" : "default"}
      data-ds-layer="singlepage"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-xl font-semibold">{name}</h3>
        {isFeatured ? (
          <span className="rounded-full bg-[var(--workspace-brand-accent)] px-3 py-1 text-xs font-semibold text-[var(--workspace-brand-on-accent)]">
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
        className={`mt-7 w-full ${isFeatured ? "focus-visible:outline-[var(--workspace-brand-focus-inverse)]" : ""}`}
      >
        {cta}
      </Button>
      <ul
        className={`mt-8 flex-1 space-y-4 border-t pt-6 ${isFeatured ? "border-[var(--workspace-brand-muted-on-primary)]/30" : "border-[var(--workspace-brand-line)]"}`}
      >
        {features.map((feature) => (
          <li
            key={feature}
            className={`flex items-start gap-3 text-sm leading-6 ${mutedClassName}`}
          >
            <CheckCircle2
              className={`mt-0.5 h-5 w-5 shrink-0 ${isFeatured ? "text-[var(--workspace-brand-accent)]" : "text-[var(--workspace-brand-foreground)]"}`}
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
