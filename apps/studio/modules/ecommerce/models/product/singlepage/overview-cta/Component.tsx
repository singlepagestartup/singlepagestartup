import { ArrowRight, ShoppingCart } from "lucide-react";

export interface ProductOverviewCtaProps {
  title: string;
  description?: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
  secondaryHref: string;
  blockId?: string;
  importedBlockId?: string;
}

export const defaultProductOverviewCtaProps: ProductOverviewCtaProps = {
  title: "Ready to build your website?",
  description: "Get a free consultation and project estimate within 24 hours.",
  primaryActionLabel: "Add to Cart",
  secondaryActionLabel: "Book a Call",
  secondaryHref: "/#contact",
};

export function ProductOverviewCta(props?: Partial<ProductOverviewCtaProps>) {
  const {
    title,
    description,
    primaryActionLabel,
    secondaryActionLabel,
    secondaryHref,
    blockId,
    importedBlockId,
  } = { ...defaultProductOverviewCtaProps, ...props };

  return (
    <section
      className="w-full bg-slate-900 py-16"
      data-ds-block={blockId ?? "ecommerce.product.overview-cta"}
      data-ds-imports={importedBlockId}
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl tracking-tight text-white lg:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
            {description}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-slate-600 bg-white px-5 py-2.5 text-sm text-slate-900 transition hover:bg-slate-100"
          >
            <ShoppingCart className="h-4 w-4" />
            {primaryActionLabel}
          </button>
          <a
            href={secondaryHref}
            className="inline-flex items-center gap-2 rounded-md border border-slate-600 px-5 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            {secondaryActionLabel}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
