import { ArrowUpRight } from "../../../../../workspace/utils/components/ModuleIcons";
/**
 * ecommerce.product.card-related
 *
 * Simpler related product card (image, category badge + price, title, subtitle).
 * Owned by the ecommerce module (model: product).
 * Source: ProductPage WidgetRelated card (lines 653-679).
 */

export interface ProductCardRelatedProps {
  slug: string;
  image: string;
  category: string;
  priceLabel: string;
  title: string;
  subtitle: string;
  href?: string;
  target?: "_blank" | "_parent" | "_self" | "_top";
}

export const defaultProductCardRelatedProps: ProductCardRelatedProps = {
  slug: "ui-ux-design",
  image: new URL(
    "../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
    import.meta.url,
  ).href,
  category: "design",
  priceLabel: "from $3,499",
  title: "UI/UX Design",
  subtitle: "User-centered design that converts",
};

export function ProductCardRelated(props?: Partial<ProductCardRelatedProps>) {
  const { slug, image, priceLabel, title, subtitle, href, target } = {
    ...defaultProductCardRelatedProps,
    ...props,
  };
  const productHref = href ?? `/ecommerce/products/${slug}`;

  return (
    <a
      href={productHref}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      aria-label={`View ${title}`}
      className="group flex h-full min-w-0 cursor-pointer items-start gap-4 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 transition motion-reduce:transition-none hover:border-[var(--workspace-brand-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]"
      data-ds-block="ecommerce.product.card-related"
      data-ds-layer="singlepage"
    >
      <img
        src={image}
        alt=""
        className="block h-20 w-20 shrink-0 self-start rounded-xl object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-lg font-semibold leading-6 text-[var(--workspace-brand-foreground)]">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-2 text-sm leading-6 text-[var(--workspace-brand-muted)]">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[var(--workspace-brand-foreground)]">
            {priceLabel}
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--workspace-brand-foreground)]">
            View <ArrowUpRight className="h-5 w-5" />
          </span>
        </div>
      </div>
    </a>
  );
}
