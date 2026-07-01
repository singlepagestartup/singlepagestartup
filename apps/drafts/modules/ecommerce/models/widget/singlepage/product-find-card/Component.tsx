import { Search } from "lucide-react";

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
  web: "https://images.unsplash.com/photo-1665554306521-86afb5cb008a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXZlbG9wbWVudCUyMGRlc2lnbiUyMG1vZGVybnxlbnwxfHx8fDE3NzE3MTY2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  consulting:
    "https://images.unsplash.com/photo-1551135049-8a33b5883817?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGNvbnN1bHRpbmclMjBtZWV0aW5nJTIwb2ZmaWNlfGVufDF8fHx8MTc3MTcxNjY1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  saas: "https://images.unsplash.com/photo-1575388902449-6bca946ad549?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTYWFTJTIwc29mdHdhcmUlMjBkYXNoYm9hcmQlMjBpbnRlcmZhY2V8ZW58MXx8fHwxNzcxNzE2NjUxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  mobile:
    "https://images.unsplash.com/photo-1730818876578-4f5ed7376b28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2JpbGUlMjBhcHAlMjBzbWFydHBob25lJTIwc2NyZWVufGVufDF8fHx8MTc3MTY5MzQwOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  ux: "https://images.unsplash.com/photo-1761122827167-159d1d272313?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxVWCUyMGRlc2lnbiUyMHdpcmVmcmFtZSUyMHNrZXRjaHxlbnwxfHx8fDE3NzE3MTY2NTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  seo: "https://images.unsplash.com/photo-1632055186471-64814edeaab4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTRU8lMjBhbmFseXRpY3MlMjBncm93dGglMjBjaGFydHxlbnwxfHx8fDE3NzE2NTYyMjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  api: "https://images.unsplash.com/photo-1505685296765-3a2736de412f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBUEklMjBpbnRlZ3JhdGlvbiUyMGNvZGUlMjB0ZXJtaW5hbHxlbnwxfHx8fDE3NzE3MTY2NTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  cloud:
    "https://images.unsplash.com/photo-1506399558188-acca6f8cbf41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbG91ZCUyMGNvbXB1dGluZyUyMHNlcnZlciUyMGluZnJhc3RydWN0dXJlfGVufDF8fHx8MTc3MTY4NTQxOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  audit:
    "https://images.unsplash.com/photo-1740908900906-a51032597559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobmljYWwlMjBhdWRpdCUyMHNlY3VyaXR5JTIwcmV2aWV3fGVufDF8fHx8MTc3MTcxNjY1N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  workshop:
    "https://images.unsplash.com/photo-1735639013995-086e648eaa38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwY29sbGFib3JhdGlvbiUyMHdvcmtzaG9wJTIwYnJhaW5zdG9ybXxlbnwxfHx8fDE3NzE3MTY2NTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
};

const productOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-ecommerce-cart-flow-default--default";

export const defaultProductFindCardProps = {
  categories: [
    { slug: "all", label: "All Services" },
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
      badge: "Popular",
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
      badge: "Enterprise",
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

  return (
    <div
      className="mx-auto max-w-6xl px-6 py-10"
      data-ds-block="ecommerce.widget.product-find-card"
      data-ds-imports="ecommerce.product.card"
      data-ds-layer="singlepage"
    >
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat, idx) => (
            <button
              key={cat.slug}
              type="button"
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition ${
                idx === 0
                  ? "border-slate-300 bg-white text-slate-900"
                  : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-white hover:text-slate-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search services..."
            defaultValue=""
            className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            readOnly
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
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
    </div>
  );
}
