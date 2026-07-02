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
  image:
    "https://images.unsplash.com/photo-1761122827167-159d1d272313?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxVWCUyMGRlc2lnbiUyMHdpcmVmcmFtZSUyMHNrZXRjaHxlbnwxfHx8fDE3NzE3MTY2NTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  category: "design",
  priceLabel: "from $3,499",
  title: "UI/UX Design",
  subtitle: "User-centered design that converts",
};

export function ProductCardRelated(props?: Partial<ProductCardRelatedProps>) {
  const { slug, image, category, priceLabel, title, subtitle, href, target } = {
    ...defaultProductCardRelatedProps,
    ...props,
  };
  const productHref = href ?? `/ecommerce/products/${slug}`;

  return (
    <a
      href={productHref}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      className="group overflow-hidden rounded-xl border border-slate-200 bg-[#eaf0f7] transition hover:border-slate-400"
      data-ds-block="ecommerce.product.card-related"
      data-ds-layer="singlepage"
    >
      <div className="aspect-[16/9] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600 uppercase">
            {category}
          </span>
          <span className="text-sm text-slate-900">{priceLabel}</span>
        </div>
        <h3 className="text-sm text-slate-900 group-hover:text-slate-700">
          {title}
        </h3>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>
    </a>
  );
}
