/**
 * ecommerce.product.card
 *
 * Full catalog service card (image + badge, category badge + price, title,
 * subtitle, truncated shortDescription, up to 3 techStack tags, "Details" +
 * ArrowUpRight). Owned by the ecommerce module (model: product).
 * Source: CatalogPage card (lines 80-134).
 */

import { ArrowUpRight } from "lucide-react";

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
  image:
    "https://images.unsplash.com/photo-1665554306521-86afb5cb008a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXZlbG9wbWVudCUyMGRlc2lnbiUyMG1vZGVybnxlbnwxfHx8fDE3NzE3MTY2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  badge: "Popular",
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
    category,
    priceLabel,
    title,
    subtitle,
    shortDescription,
    techStack,
  } = { ...defaultProductCardProps, ...props };

  const truncatedDesc =
    shortDescription.length > 110
      ? shortDescription.slice(0, 110) + "..."
      : shortDescription;

  return (
    <a
      href={href ?? `/ecommerce/products/${slug}`}
      target={target}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-md"
      data-ds-block="ecommerce.product.card"
      data-ds-layer="singlepage"
      aria-label={`Open ${title}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
        {badge ? (
          <span className="absolute right-3 top-3 rounded-md border border-slate-300 bg-slate-900 px-2 py-0.5 text-[10px] text-white">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 uppercase">
            {category}
          </span>
          <span className="text-sm text-slate-900">{priceLabel}</span>
        </div>
        <h3 className="text-sm text-slate-900 group-hover:text-slate-700">
          {title}
        </h3>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        <p className="mt-3 flex-1 text-sm text-slate-500">{truncatedDesc}</p>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex flex-wrap gap-1">
            {techStack.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500"
              >
                {t}
              </span>
            ))}
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-slate-600 transition group-hover:text-slate-900">
            Details
            <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </a>
  );
}
