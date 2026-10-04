/**
 * ecommerce.product.card
 *
 * Catalog card with one description, price and a labelled detail action.
 * Owned by the ecommerce Product model.
 */

import { ArrowUpRight } from "../../../../../../workspace/utils/components/ModuleIcons";

export interface ProductCardProps {
  slug: string;
  href?: string;
  target?: "_self" | "_top" | "_blank" | "_parent";
  image: string;
  badge?: string;
  category: string;
  priceLabel: string;
  title: string;
  subtitle: string;
  shortDescription: string;
  techStack: string[];
}

export const defaultProductCardProps: ProductCardProps = {
  slug: "website-development",
  image: new URL(
    "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
    import.meta.url,
  ).href,
  category: "development",
  priceLabel: "from $4,999",
  title: "Website Development",
  subtitle: "Custom websites built for performance",
  shortDescription:
    "Full-cycle website development — from landing pages to complex multi-page portals with CMS integration and responsive design.",
  techStack: ["React", "Next.js", "Tailwind CSS", "TypeScript", "Vercel"],
};

export function ProductCard(props?: Partial<ProductCardProps>) {
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
      className="group flex h-full cursor-pointer min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] transition motion-reduce:transition-none hover:border-[var(--workspace-brand-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]"
      data-ds-block="ecommerce.product.card"
      data-ds-layer="singlepage"
      aria-label={`Open ${title}`}
    >
      <div className="relative aspect-square overflow-hidden bg-[var(--workspace-brand-background)]">
        <img src={image} alt={title} className="h-full w-full object-cover" />
        {badge ? (
          <span className="absolute left-4 top-4 rounded-full bg-[var(--workspace-brand-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--workspace-brand-foreground)]">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <h3 className="text-2xl font-semibold leading-tight text-[var(--workspace-brand-foreground)]">
          {title}
        </h3>
        <p className="text-sm leading-6 text-[var(--workspace-brand-muted)]">
          {description}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[var(--workspace-brand-line)] pt-5">
          <span className="text-base font-semibold text-[var(--workspace-brand-foreground)]">
            {priceLabel}
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--workspace-brand-foreground)]">
            Details <ArrowUpRight className="h-5 w-5" />
          </span>
        </div>
      </div>
    </a>
  );
}
