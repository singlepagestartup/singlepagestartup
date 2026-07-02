/**
 * ecommerce.product.pinned
 *
 * Article-sidebar pinned product: Package icon box + title + shortDescription +
 * price chip + category chip + "View service" + ArrowUpRight. Owned by the
 * ecommerce module (model: product).
 * Source: BlogSections PinnedProductCard (lines 532-561).
 */

import { ArrowUpRight, Package } from "lucide-react";

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
      className="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
      data-ds-block="ecommerce.product.pinned"
      data-ds-layer="singlepage"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
        <Package className="h-5 w-5 text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-sm text-slate-900">{title}</h4>
            <p className="mt-0.5 text-xs text-slate-500">{shortDescription}</p>
          </div>
          <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700">
            {priceLabel}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 uppercase">
            {category}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
            View service <ArrowUpRight className="h-2.5 w-2.5" />
          </span>
        </div>
      </div>
    </a>
  );
}
