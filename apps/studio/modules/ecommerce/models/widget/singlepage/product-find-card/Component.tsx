import { useCallback, useMemo, useState } from "react";
import {
  Button,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import {
  CollectionToolbar,
  CollectionPagination,
} from "../../../../../../workspace/design/singlepage/interface-kit/Collections";

import { ProductCard } from "../../../product/singlepage/card/Component";

export interface ProductFindCategory {
  slug: string;
  label: string;
}

export interface ProductFindProduct {
  id: string;
  slug: string;
  href?: string;
  title: string;
  subtitle: string;
  category: string;
  priceLabel: string;
  badge?: string;
  image: string;
  shortDescription: string;
  techStack: string[];
}

const IMG = {
  web: new URL(
    "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
    import.meta.url,
  ).href,
  consulting: new URL(
    "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png",
    import.meta.url,
  ).href,
  saas: new URL(
    "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
    import.meta.url,
  ).href,
  mobile: new URL(
    "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
    import.meta.url,
  ).href,
  ux: new URL(
    "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png",
    import.meta.url,
  ).href,
  seo: new URL(
    "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
    import.meta.url,
  ).href,
  api: new URL(
    "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
    import.meta.url,
  ).href,
  cloud: new URL(
    "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png",
    import.meta.url,
  ).href,
  audit: new URL(
    "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
    import.meta.url,
  ).href,
  workshop: new URL(
    "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
    import.meta.url,
  ).href,
};

const productOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-ecommerce-products-ecommerce-products-slug--default";

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

export type ProductFindCardProps = typeof defaultProductFindCardProps;

export function ProductFindCard(props?: Partial<ProductFindCardProps>) {
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
    >
      <CollectionToolbar
        categories={categories}
        category={category}
        onCategoryChange={chooseCategory}
        query={query}
        onQueryChange={search}
        searchLabel="Search services"
      />
      <p
        role="status"
        className="mb-6 text-sm text-[var(--workspace-brand-muted)]"
      >
        {visibleProducts.length}{" "}
        {visibleProducts.length === 1 ? "service" : "services"}
      </p>
      {visibleProducts.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pageProducts.map((product) => (
            <ProductCard
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
        <div className="rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-8 text-center">
          <h2 className="text-2xl font-semibold">No services found</h2>
          <p className="mt-3 text-base text-[var(--workspace-brand-muted)]">
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
