import { ChevronRight } from "lucide-react";

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

const IMG_WEB =
  "https://images.unsplash.com/photo-1665554306521-86afb5cb008a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXZlbG9wbWVudCUyMGRlc2lnbiUyMG1vZGVybnxlbnwxfHx8fDE3NzE3MTY2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_UX =
  "https://images.unsplash.com/photo-1761122827167-159d1d272313?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxVWCUyMGRlc2lnbiUyMHdpcmVmcmFtZSUyMHNrZXRjaHxlbnwxfHx8fDE3NzE3MTY2NTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_SEO =
  "https://images.unsplash.com/photo-1632055186471-64814edeaab4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTRU8lMjBhbmFseXRpY3MlMjBncm93dGglMjBjaGFydHxlbnwxfHx8fDE3NzE2NTYyMjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_CONSULTING =
  "https://images.unsplash.com/photo-1551135049-8a33b5883817?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGNvbnN1bHRpbmclMjBtZWV0aW5nJTIwb2ZmaWNlfGVufDF8fHx8MTc3MTcxNjY1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

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
    badge: "Popular",
    description:
      "We build fast, beautiful, and conversion-optimized websites tailored to your brand. From single-page marketing sites to full-scale web portals with CMS, ecommerce, and analytics — every project is engineered for performance and maintainability.",
    breadcrumb: [
      { label: "Home", href: "/" },
      { label: "Services", href: "/services" },
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
      className="relative w-full overflow-hidden border-b border-slate-200 bg-white"
      data-ds-section="product-overview-hero"
    >
      <div className="absolute inset-0">
        <img
          src={hero.image}
          alt={hero.title}
          className="h-full w-full object-cover opacity-[0.07]"
        />
      </div>
      <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-slate-400">
          {hero.breadcrumb.map((crumb) => (
            <span key={crumb.href} className="flex items-center gap-1.5">
              <a href={crumb.href} className="transition hover:text-slate-600">
                {crumb.label}
              </a>
              <ChevronRight className="h-3 w-3" />
            </span>
          ))}
          <span className="text-slate-600">{hero.title}</span>
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 uppercase">
            {hero.category}
          </span>
          {hero.badge ? (
            <span className="rounded-md border border-slate-300 bg-slate-900 px-2 py-0.5 text-[10px] text-white">
              {hero.badge}
            </span>
          ) : null}
        </div>

        <h1 className="mt-3 text-3xl tracking-tight text-slate-900 lg:text-4xl">
          {hero.title}
        </h1>
        <p className="mt-1 text-slate-500">{hero.subtitle}</p>
        <p className="mt-4 max-w-2xl text-sm text-slate-600">
          {hero.description}
        </p>
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
      className="w-full border-y border-slate-200 bg-white"
      data-ds-section="product-overview-stats"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 divide-x divide-slate-200 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="px-6 py-7 text-center">
              <p className="text-2xl text-slate-900">{stat.value}</p>
              <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
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
      className="w-full border-y border-slate-200 bg-white py-16"
      data-ds-section="product-overview-related"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-2 text-xs tracking-widest text-slate-500 uppercase">
          You Might Also Need
        </p>
        <h2 className="text-2xl tracking-tight text-slate-900">
          Related Services
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {related.map((product) => (
            <ProductCardRelated
              key={product.id}
              slug={product.slug}
              image={product.image}
              category={product.category}
              priceLabel={product.priceLabel}
              title={product.title}
              subtitle={product.subtitle}
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

  return (
    <div
      className="w-full bg-[#eaf0f7] text-slate-900 antialiased"
      data-ds-block="ecommerce.product.overview-default"
      data-ds-imports="ecommerce.product.overview-purchase ecommerce.product.gallery ecommerce.product.card-related ecommerce.product.overview-cta website-builder.widget.content-feature-find-grid website-builder.widget.content-testimonials website-builder.widget.content-faq"
      data-ds-layer="singlepage"
    >
      <ProductOverviewHeroSection hero={hero} />
      <ProductOverviewPurchase {...purchase} />
      <ProductOverviewStatsSection stats={stats} />
      <ContentFeatureFindGrid />
      <ProductGallery images={defaultProductGalleryProps.images} />
      <ContentTestimonials />
      <ContentFaq />
      <ProductOverviewRelatedSection related={related} />
      <ProductOverviewCta {...cta} />
    </div>
  );
}
