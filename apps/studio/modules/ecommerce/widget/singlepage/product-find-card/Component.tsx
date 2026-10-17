import type {
  IComponentProps,
  ProductFindCategory,
  ProductFindProduct,
  ProductFindCardProps,
} from "./interface";
export type {
  ProductFindCategory,
  ProductFindProduct,
  ProductFindCardProps,
} from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import {
  useId,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useCallback,
  useMemo,
  useState,
} from "react";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button/index";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import { Component as Product } from "../../../product/index";
interface ICollectionPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}
function CollectionPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: ICollectionPaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <nav
      aria-label="Collection pages"
      className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5"
    >
      <p className={`text-sm ${kit.muted}`} aria-live="polite">
        {total
          ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`
          : "0 results"}{" "}
        · Page {page} of {pages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <Icon name="caret-left" />
          Previous
        </Button>
        <Button
          variant="secondary"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <Icon name="caret-right" />
        </Button>
      </div>
    </nav>
  );
}
interface ICategoryChoiceProps extends ICollectionCategory {
  active: boolean;
  onSelect?: (slug: string) => void;
}
function CategoryChoice({
  slug,
  label,
  count,
  active,
  onSelect,
}: ICategoryChoiceProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect?.(slug)}
      className={`${sectionChoiceClass} ${active ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`text-xs ${kit.muted}`}>{count}</span>
      )}
      {active && <span aria-hidden="true" className={sectionIndicatorClass} />}
    </button>
  );
}
interface ICollectionCategory {
  slug: string;
  label: string;
  count?: number;
}
interface ICollectionToolbarProps {
  categories: ICollectionCategory[];
  category: string;
  onCategoryChange: (value: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  searchLabel: string;
}
function CollectionToolbar({
  categories,
  category,
  onCategoryChange,
  query,
  onQueryChange,
  searchLabel,
}: ICollectionToolbarProps) {
  const id = useId();
  return (
    <div className="mb-6 grid gap-3 rounded-3xl border border-border bg-card p-3">
      <div
        role="group"
        aria-label="Filter by category"
        className="flex flex-wrap gap-1 rounded-xl bg-muted p-1"
      >
        {categories.map((item) => (
          <CategoryChoice
            key={item.slug}
            {...item}
            active={category === item.slug}
            onSelect={onCategoryChange}
          />
        ))}
      </div>
      <label htmlFor={id} className="relative">
        <span className="sr-only">{searchLabel}</span>
        <Icon
          name="magnifying-glass"
          className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${kit.muted}`}
        />
        <input
          id={id}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchLabel}
          className={`${kit.field} pl-12`}
        />
      </label>
    </div>
  );
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function ProductFindCard(props?: IComponentProps) {
  const { categories, products } = {
    ...defaultProductFindCardProps,
    ...props,
  };
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const chooseCategory = useCallback((value: string) => {
    setCategory(value);
    setPage(1);
  }, []);
  const search = useCallback((value: string) => {
    setQuery(value);
    setPage(1);
  }, []);
  const visibleProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          (category === "all" || product.category === category) &&
          `${product.title} ${product.subtitle} ${product.shortDescription} ${product.techStack.join(" ")}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [products, category, query],
  );
  const activePage = Math.min(
    page,
    Math.max(1, Math.ceil(visibleProducts.length / pageSize)),
  );
  const pageProducts = visibleProducts.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  );
  return (
    <div
      className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
      data-ds-block="ecommerce.widget.product-find-card"
      data-ds-imports="ecommerce.product.card"
      data-ds-layer="singlepage"
      data-module="ecommerce"
      data-model="widget"
      data-variant={props?.variant ?? "product-find-card"}
    >
      <CollectionToolbar
        categories={categories}
        category={category}
        onCategoryChange={chooseCategory}
        query={query}
        onQueryChange={search}
        searchLabel="Search services"
      />
      <p role="status" className="mb-6 text-sm text-muted-foreground">
        {visibleProducts.length}{" "}
        {visibleProducts.length === 1 ? "service" : "services"}
      </p>
      {visibleProducts.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pageProducts.map((product) => (
            <Product
              variant="card"
              key={product.id}
              slug={product.slug}
              href={product.href ?? productOverviewStoryHref}
              target="_top"
              image={product.image}
              badge={product.badge}
              category={product.category}
              priceLabel={product.priceLabel}
              title={product.title}
              subtitle={product.subtitle}
              shortDescription={product.shortDescription}
              techStack={product.techStack}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card p-8 text-center">
          <h2 className="text-2xl font-semibold">No services found</h2>
          <p className="mt-3 text-base text-muted-foreground">
            Try another search or category.
          </p>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
      <CollectionPagination
        page={activePage}
        pageSize={pageSize}
        total={visibleProducts.length}
        onPageChange={setPage}
      />
    </div>
  );
}
const sectionIndicatorClass =
  "absolute bottom-1.5 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-primary text-primary-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const kit = {
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-border bg-card px-4 py-2 text-base text-foreground outline-none transition motion-reduce:transition-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-card)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60 [&[readonly]]:bg-muted aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive",
  muted: "text-muted-foreground",
  focus: focus,
};
const sectionChoiceClass = `relative inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${kit.focus} disabled:cursor-not-allowed disabled:opacity-50`;
const Button = forwardRefControl<
  HTMLButtonElement,
  ButtonControlProps<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "plain" | "danger";
  }
>(function Button({ variant = "primary", ...props }, ref) {
  return (
    <WebsiteBuilderModuleButton
      {...props}
      variant="control"
      appearance={variant}
      ref={ref}
    />
  );
});
const IMG = {
  web: "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
  consulting:
    "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png",
  saas: "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
  mobile:
    "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
  ux: "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png",
  seo: "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
  api: "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
  cloud:
    "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png",
  audit:
    "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
  workshop:
    "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
};
const productOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-ecommerce-module-product-slug--default";
export const defaultProductFindCardProps = {
  categories: [
    { slug: "all", label: "All services" },
    { slug: "development", label: "Development" },
    { slug: "design", label: "Design" },
    { slug: "consulting", label: "Consulting" },
    { slug: "infrastructure", label: "Infrastructure" },
  ] as ProductFindCategory[],
  products: [
    {
      id: "srv-web",
      slug: "website-development",
      title: "Website Development",
      subtitle: "Custom websites built for performance",
      category: "development",
      priceLabel: "from $4,999",
      image: IMG.web,
      shortDescription:
        "Full-cycle website development — from landing pages to complex multi-page portals with CMS integration and responsive design.",
      techStack: ["React", "Next.js", "Tailwind CSS", "TypeScript", "Vercel"],
    },
    {
      id: "srv-consulting",
      slug: "consulting",
      title: "Technical Consulting",
      subtitle: "Expert guidance for your tech decisions",
      category: "consulting",
      priceLabel: "$250/hr",
      image: IMG.consulting,
      shortDescription:
        "Strategic technical advice on architecture, stack selection, team structure, and digital transformation for startups and enterprises.",
      techStack: ["System Design", "AWS", "GCP", "Kubernetes", "CI/CD"],
    },
    {
      id: "srv-saas",
      slug: "saas-development",
      title: "SaaS Development",
      subtitle: "Build your software-as-a-service product",
      category: "development",
      priceLabel: "from $14,999",
      image: IMG.saas,
      shortDescription:
        "End-to-end SaaS product development — multi-tenant architecture, billing integration, user management, and scalable infrastructure.",
      techStack: [
        "React",
        "Node.js",
        "PostgreSQL",
        "Redis",
        "Stripe",
        "Docker",
        "AWS",
      ],
    },
    {
      id: "srv-mobile",
      slug: "mobile-app-development",
      title: "Mobile App Development",
      subtitle: "Native and cross-platform mobile apps",
      category: "development",
      priceLabel: "from $9,999",
      image: IMG.mobile,
      shortDescription:
        "iOS and Android app development using React Native or Flutter — from concept to App Store and Google Play submission.",
      techStack: [
        "React Native",
        "Flutter",
        "TypeScript",
        "Firebase",
        "Fastlane",
      ],
    },
    {
      id: "srv-uiux",
      slug: "ui-ux-design",
      title: "UI/UX Design",
      subtitle: "User-centered design that converts",
      category: "design",
      priceLabel: "from $3,499",
      image: IMG.ux,
      shortDescription:
        "Research-driven UX design and polished UI — wireframes, prototypes, design systems, and usability testing.",
      techStack: [
        "Figma",
        "Storybook",
        "Design Tokens",
        "Accessibility Testing",
      ],
    },
    {
      id: "srv-seo",
      slug: "seo-optimization",
      title: "SEO Optimization",
      subtitle: "Grow your organic traffic",
      category: "consulting",
      priceLabel: "from $1,499/mo",
      image: IMG.seo,
      shortDescription:
        "Technical SEO audits, on-page optimization, content strategy, and link building — data-driven growth for organic search.",
      techStack: [
        "Ahrefs",
        "Google Search Console",
        "GA4",
        "Schema.org",
        "PageSpeed",
      ],
    },
    {
      id: "srv-api",
      slug: "api-integration",
      title: "API Integration",
      subtitle: "Connect your systems seamlessly",
      category: "development",
      priceLabel: "from $2,999",
      image: IMG.api,
      shortDescription:
        "Custom API development, third-party integrations, webhook systems, and data synchronization between platforms.",
      techStack: ["Node.js", "Python", "REST", "GraphQL", "OpenAPI", "Postman"],
    },
    {
      id: "srv-cloud",
      slug: "cloud-infrastructure",
      title: "Cloud Infrastructure",
      subtitle: "Scalable, reliable cloud setups",
      category: "infrastructure",
      priceLabel: "from $3,999",
      image: IMG.cloud,
      shortDescription:
        "Cloud architecture design, Kubernetes deployment, CI/CD pipelines, monitoring, and cost optimization on AWS, GCP, or Azure.",
      techStack: [
        "AWS",
        "GCP",
        "Terraform",
        "Kubernetes",
        "Docker",
        "Prometheus",
      ],
    },
    {
      id: "srv-audit",
      slug: "technical-audit",
      title: "Technical Audit",
      subtitle: "Find and fix what's holding you back",
      category: "consulting",
      priceLabel: "from $1,999",
      image: IMG.audit,
      shortDescription:
        "Comprehensive code quality, security, performance, and architecture audit with a prioritized action plan.",
      techStack: [
        "SonarQube",
        "OWASP ZAP",
        "k6",
        "Lighthouse",
        "Custom Scripts",
      ],
    },
    {
      id: "srv-workshop",
      slug: "team-workshop",
      title: "Team Workshop",
      subtitle: "Level up your engineering team",
      category: "consulting",
      priceLabel: "from $2,499/day",
      image: IMG.workshop,
      shortDescription:
        "Hands-on workshops for engineering teams — React, TypeScript, system design, DevOps practices, and code quality.",
      techStack: ["React", "TypeScript", "Node.js", "Docker", "Testing"],
    },
  ] as ProductFindProduct[],
};
