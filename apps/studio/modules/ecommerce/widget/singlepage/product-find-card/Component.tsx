import type {
  IComponentProps,
  ProductFindCategory,
  ProductFindCardProps,
  ProductFindProduct,
} from "./interface";
import { defaultProductCardProps } from "../../../product";
import { Component as ClientComponent } from "./ClientComponent";
export function ProductFindCard(props: IComponentProps = {}) {
  const p = { ...defaultProductFindCardProps, ...props };
  return (
    <ClientComponent
      categories={p.categories}
      products={p.products}
      embedded={props.embedded}
      title={props.title}
      description={props.description}
    />
  );
}
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

const baseProductFindCardProps = {
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

export const defaultProductFindCardProps: ProductFindCardProps = {
  ...baseProductFindCardProps,
  products: baseProductFindCardProps.products.map((product) => ({
    ...product,
    attributes: defaultProductCardProps.attributes,
    options: defaultProductCardProps.options,
    prices: defaultProductCardProps.prices,
    paymentMethods: defaultProductCardProps.paymentMethods,
    categories: [
      {
        id: product.category,
        label: product.category,
        href: "/?path=/story/modules-host-models-page-singlepage-ecommerce-module-category-slug--default",
      },
    ],
  })),
};
