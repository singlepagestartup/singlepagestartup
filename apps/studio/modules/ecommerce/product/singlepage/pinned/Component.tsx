/**
 * ecommerce.product.pinned
 *
 * Article-sidebar pinned product: Package icon box + title + shortDescription +
 * price chip + category chip + "View service" + ArrowUpRight. Owned by the
 * ecommerce module (model: product).
 * Source: BlogSections PinnedProductCard (lines 532-561).
 */

import {
  ArrowUpRight,
  Package,
} from "../../../../../workspace/utils/components/ModuleIcons";

export interface ProductPinnedProps {
  slug: string;
  title: string;
  shortDescription: string;
  priceLabel: string;
  category: string;
  href?: string;
  target?: "_blank" | "_parent" | "_self" | "_top";
}

export const defaultProductPinnedProps: ProductPinnedProps = {
  slug: "consulting",
  title: "Technical Consulting",
  shortDescription:
    "Strategic technical advice on architecture, stack selection, and digital transformation.",
  priceLabel: "$250/hr",
  category: "consulting",
};

export function ProductPinned(props?: Partial<ProductPinnedProps>) {
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
      className="group flex min-w-0 flex-col rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 transition hover:border-[var(--workspace-brand-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]"
      data-ds-block="ecommerce.product.pinned"
      data-ds-layer="singlepage"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--workspace-brand-background)]">
          <Package className="h-5 w-5" />
        </span>
        <span className="rounded-full bg-[var(--workspace-brand-background)] px-3 py-1 text-xs text-[var(--workspace-brand-muted)]">
          {category}
        </span>
      </div>
      <h4 className="mt-5 text-lg font-semibold leading-6 text-[var(--workspace-brand-foreground)]">
        {title}
      </h4>
      <p className="mt-2 text-sm leading-6 text-[var(--workspace-brand-muted)]">
        {shortDescription}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--workspace-brand-line)] pt-4">
        <span className="text-base font-semibold">{priceLabel}</span>
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          View service <ArrowUpRight className="h-5 w-5" />
        </span>
      </div>
    </a>
  );
}
