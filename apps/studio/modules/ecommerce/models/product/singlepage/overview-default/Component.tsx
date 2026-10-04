import {
  ArrowRight,
  ChevronRight,
} from "../../../../../../workspace/utils/components/ModuleIcons";
import { SectionStack } from "../../../../../../workspace/design/singlepage/interface-kit/SectionStack";

import { ContentFaq } from "../../../../../website-builder/models/widget/singlepage/content-faq/Component";
import { ContentFeatureFindGrid } from "../../../../../website-builder/models/widget/singlepage/content-feature-find-grid/Component";
import { ContentTestimonials } from "../../../../../website-builder/models/widget/singlepage/content-testimonials/Component";
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

const IMG_WEB = new URL(
  "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
  import.meta.url,
).href;
const IMG_UX = new URL(
  "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
  import.meta.url,
).href;
const IMG_SEO = new URL(
  "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png",
  import.meta.url,
).href;
const IMG_CONSULTING = new URL(
  "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
  import.meta.url,
).href;

export interface ProductOverviewBreadcrumbItem {
  label: string;
  href: string;
}

export interface ProductOverviewHero {
  image: string;
  title: string;
  subtitle: string;
  category: string;
  badge?: string;
  description: string;
  breadcrumb: ProductOverviewBreadcrumbItem[];
}

export interface ProductOverviewStat {
  value: string;
  label: string;
}

export interface ProductOverviewRelatedProduct {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  priceLabel: string;
  image: string;
  href?: string;
  target?: "_blank" | "_parent" | "_self" | "_top";
}

export interface ProductOverviewDefaultProps {
  hero: ProductOverviewHero;
  stats: ProductOverviewStat[];
  related: ProductOverviewRelatedProduct[];
  purchase: Partial<typeof defaultProductOverviewPurchaseProps>;
  cta: Partial<typeof defaultProductOverviewCtaProps>;
}

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

function ProductOverviewHeroSection({ hero }: { hero: ProductOverviewHero }) {
  return (
    <section
      className="w-full py-8 sm:py-12"
      data-ds-section="product-overview-hero"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[var(--workspace-brand-muted)]"
        >
          {hero.breadcrumb.map((crumb) => (
            <span key={crumb.href} className="inline-flex items-center gap-2">
              <a
                href={crumb.href}
                className="rounded transition hover:text-[var(--workspace-brand-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]"
              >
                {crumb.label}
              </a>
              <ChevronRight className="h-5 w-5" />
            </span>
          ))}
          <span
            aria-current="page"
            className="text-[var(--workspace-brand-foreground)]"
          >
            {hero.title}
          </span>
        </nav>
        <div className="grid overflow-hidden rounded-3xl lg:grid-cols-2">
          <div className="flex flex-col justify-center bg-[var(--workspace-brand-primary)] p-6 text-[var(--workspace-brand-on-primary)] sm:p-10 lg:p-12">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full border border-[var(--workspace-brand-muted-on-primary)]/40 px-3 py-1">
                {hero.category}
              </span>
              {hero.badge ? (
                <span className="rounded-full bg-[var(--workspace-brand-accent)] px-3 py-1 font-semibold text-[var(--workspace-brand-on-accent)]">
                  {hero.badge}
                </span>
              ) : null}
            </div>
            <h1 className="mt-8 max-w-xl text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
              {hero.title}
            </h1>
            <p className="mt-5 max-w-lg text-2xl font-semibold leading-8 text-[var(--workspace-brand-on-primary)]">
              {hero.subtitle}
            </p>
            <p className="mt-5 max-w-lg text-base leading-7 text-[var(--workspace-brand-muted-on-primary)]">
              {hero.description}
            </p>
            <a
              href="#product-purchase"
              className="mt-8 inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl bg-[var(--workspace-brand-accent)] px-5 py-3 text-sm font-semibold text-[var(--workspace-brand-on-accent)] transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus-inverse)]"
            >
              Explore this service <ArrowRight className="h-5 w-5" />
            </a>
          </div>
          <div className="min-w-0 bg-[var(--workspace-brand-surface)]">
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
              className="min-w-0 rounded-2xl bg-[var(--workspace-brand-surface)] p-5 sm:p-6"
            >
              <p className="text-3xl font-semibold text-[var(--workspace-brand-foreground)] sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--workspace-brand-muted)]">
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
        <p className="mb-2 text-xs text-[var(--workspace-brand-muted)] ">
          You might also need
        </p>
        <h2 className="text-3xl font-semibold leading-tight text-[var(--workspace-brand-foreground)] sm:text-4xl">
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

export function ProductOverviewDefault(
  props?: Partial<ProductOverviewDefaultProps>,
) {
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
      className="w-full bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased"
      data-ds-block="ecommerce.product.overview-default"
      data-ds-imports="ecommerce.product.overview-purchase ecommerce.product.gallery ecommerce.product.card-related ecommerce.product.overview-cta website-builder.widget.content-feature-find-grid website-builder.widget.content-testimonials website-builder.widget.content-faq"
      data-ds-layer="singlepage"
    >
      <SectionStack>
        <ProductOverviewHeroSection hero={hero} />
        <ProductOverviewPurchase {...resolvedPurchase} />
        <ProductOverviewStatsSection stats={stats} />
        <ContentFeatureFindGrid />
        <ProductGallery images={defaultProductGalleryProps.images} />
        <ContentTestimonials />
        <ContentFaq />
        <ProductOverviewRelatedSection related={related} />
        <ProductOverviewCta onPrimaryAction={addFromCta} {...cta} />
      </SectionStack>
    </div>
  );
}
