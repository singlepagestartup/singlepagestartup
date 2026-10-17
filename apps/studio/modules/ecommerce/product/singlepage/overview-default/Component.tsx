import type {
  IComponentProps,
  ProductOverviewBreadcrumbItem,
  ProductOverviewHero,
  ProductOverviewStat,
  ProductOverviewRelatedProduct,
  ProductOverviewDefaultProps,
} from "./interface";
export type {
  ProductOverviewBreadcrumbItem,
  ProductOverviewHero,
  ProductOverviewStat,
  ProductOverviewRelatedProduct,
  ProductOverviewDefaultProps,
} from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import { forwardRef, type SVGProps, ReactNode } from "react";
import { twMerge, twMerge as twMergePresentation } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget/index";
import { ProductCardRelated } from "../card-related/Component";
import {
  ProductGallery,
  defaultProductGalleryProps,
} from "../gallery/Component";
import {
  ProductOverviewCta,
  defaultProductOverviewCtaProps,
} from "../overview-cta/Component";
import {
  ProductOverviewPurchase,
  defaultProductOverviewPurchaseProps,
} from "../overview-purchase/Component";
interface SectionStackProps {
  children: ReactNode;
  className?: string;
}
function SectionStack({ children, className }: SectionStackProps) {
  return (
    <div
      className={twMergePresentation(
        "flex min-w-0 w-full flex-col gap-6 py-6 sm:gap-8 sm:py-8 [&>[data-ds-block]]:py-0 [&>[data-ds-section]]:py-0 [&>section]:py-0",
        className,
      )}
      data-ds-layout="section-stack"
    >
      {children}
    </div>
  );
}
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

function ProductOverviewHeroSection({ hero }: { hero: ProductOverviewHero }) {
  return (
    <section
      className="w-full py-8 sm:py-12"
      data-ds-section="product-overview-hero"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
        >
          {hero.breadcrumb.map((crumb) => (
            <span key={crumb.href} className="inline-flex items-center gap-2">
              <a
                href={crumb.href}
                className="rounded transition hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                {crumb.label}
              </a>
              <ChevronRight className="h-5 w-5" />
            </span>
          ))}
          <span aria-current="page" className="text-foreground">
            {hero.title}
          </span>
        </nav>
        <div className="grid overflow-hidden rounded-3xl lg:grid-cols-2">
          <div className="flex flex-col justify-center bg-default p-6 text-default-foreground sm:p-10 lg:p-12">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full border border-default-muted-foreground/40 px-3 py-1">
                {hero.category}
              </span>
              {hero.badge ? (
                <span className="rounded-full bg-primary text-primary-foreground px-3 py-1 font-semibold">
                  {hero.badge}
                </span>
              ) : null}
            </div>
            <h1 className="mt-8 max-w-xl text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
              {hero.title}
            </h1>
            <p className="mt-5 max-w-lg text-2xl font-semibold leading-8 text-default-foreground">
              {hero.subtitle}
            </p>
            <p className="mt-5 max-w-lg text-base leading-7 text-default-muted-foreground">
              {hero.description}
            </p>
            <a
              href="#product-purchase"
              className="mt-8 inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card"
            >
              Explore this service <ArrowRight className="h-5 w-5" />
            </a>
          </div>
          <div className="min-w-0 bg-card">
            <img
              src={hero.image}
              alt={hero.title}
              className="block aspect-square h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
function ProductOverviewStatsSection({
  stats,
}: {
  stats: ProductOverviewStat[];
}) {
  return (
    <section
      className="w-full py-6 sm:py-8"
      data-ds-section="product-overview-stats"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="min-w-0 rounded-2xl bg-card p-5 sm:p-6"
            >
              <p className="text-3xl font-semibold text-foreground sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
function ProductOverviewRelatedSection({
  related,
}: {
  related: ProductOverviewRelatedProduct[];
}) {
  return (
    <section
      className="w-full py-12 sm:py-16"
      data-ds-section="product-overview-related"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-2 text-xs text-muted-foreground ">
          You might also need
        </p>
        <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          Related services
        </h2>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {related.map((product) => (
            <ProductCardRelated
              key={product.id}
              slug={product.slug}
              image={product.image}
              category={product.category}
              priceLabel={product.priceLabel}
              title={product.title}
              subtitle={product.subtitle}
              href={product.href}
              target={product.target}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
export function ProductOverviewDefault(props?: IComponentProps) {
  const { hero, stats, related, purchase, cta } = {
    ...defaultProductOverviewDefaultProps,
    ...props,
  };
  const resolvedPurchase = {
    ...defaultProductOverviewPurchaseProps,
    ...purchase,
  };
  const addFromCta = resolvedPurchase.onAddToCart
    ? () =>
        resolvedPurchase.onAddToCart?.(
          {
            id: resolvedPurchase.id,
            slug: resolvedPurchase.slug,
            image: resolvedPurchase.image,
            title: resolvedPurchase.title,
            priceLabel: resolvedPurchase.priceLabel,
            price: resolvedPurchase.price,
          },
          1,
        )
    : undefined;
  return (
    <div
      className="w-full bg-muted text-foreground antialiased"
      data-ds-block="ecommerce.product.overview-default"
      data-ds-imports="ecommerce.product.overview-purchase ecommerce.product.gallery ecommerce.product.card-related ecommerce.product.overview-cta website-builder.widget.content-feature-find-grid website-builder.widget.content-testimonials website-builder.widget.content-faq"
      data-ds-layer="singlepage"
      data-module="ecommerce"
      data-model="product"
      data-variant={props?.variant ?? "overview-default"}
    >
      <SectionStack>
        <ProductOverviewHeroSection hero={hero} />
        <ProductOverviewPurchase {...resolvedPurchase} />
        <ProductOverviewStatsSection stats={stats} />
        <WebsiteBuilderModuleWidget variant="content-feature-find-grid" />
        <ProductGallery images={defaultProductGalleryProps.images} />
        <WebsiteBuilderModuleWidget variant="content-testimonials" />
        <WebsiteBuilderModuleWidget variant="content-faq" />
        <ProductOverviewRelatedSection related={related} />
        <ProductOverviewCta onPrimaryAction={addFromCta} {...cta} />
      </SectionStack>
    </div>
  );
}
const ChevronRight = createIcon("caret-right");
const ArrowRight = createIcon("arrow-right");
const IMG_WEB =
  "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png";
const IMG_UX =
  "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png";
const IMG_SEO =
  "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png";
const IMG_CONSULTING =
  "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png";
export const defaultProductOverviewDefaultProps: ProductOverviewDefaultProps = {
  hero: {
    image: IMG_WEB,
    title: "Website Development",
    subtitle: "Custom websites built for performance",
    category: "development",
    description:
      "We build fast, beautiful, and conversion-optimized websites tailored to your brand. From single-page marketing sites to full-scale web portals with CMS, ecommerce, and analytics — every project is engineered for performance and maintainability.",
    breadcrumb: [
      { label: "Home", href: "/" },
      { label: "Services", href: "/ecommerce/products" },
    ],
  },
  stats: [
    { value: "150+", label: "Websites Delivered" },
    { value: "99.8%", label: "Uptime Guarantee" },
    { value: "<1.5s", label: "Avg. Load Time" },
    { value: "4.9/5", label: "Client Rating" },
  ],
  related: [
    {
      id: "srv-uiux",
      slug: "ui-ux-design",
      title: "UI/UX Design",
      subtitle: "User-centered design that converts",
      category: "design",
      priceLabel: "from $3,499",
      image: IMG_UX,
    },
    {
      id: "srv-seo",
      slug: "seo-optimization",
      title: "SEO Optimization",
      subtitle: "Grow your organic traffic",
      category: "consulting",
      priceLabel: "from $1,499/mo",
      image: IMG_SEO,
    },
    {
      id: "srv-consulting",
      slug: "consulting",
      title: "Technical Consulting",
      subtitle: "Expert guidance for your tech decisions",
      category: "consulting",
      priceLabel: "$250/hr",
      image: IMG_CONSULTING,
    },
  ],
  purchase: defaultProductOverviewPurchaseProps,
  cta: defaultProductOverviewCtaProps,
};
