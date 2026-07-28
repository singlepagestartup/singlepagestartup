import {
  ProductTier,
  type ProductTierProps,
} from "../../../product/singlepage/tier/Component";

export type ProductTierItem = ProductTierProps;

export const defaultProductFindTiersProps = {
  eyebrow: "Pricing",
  title: "Simple, Transparent Plans",
  description: "Start free, scale when you're ready. No hidden fees.",
  products: [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "For personal projects and experimentation.",
      features: [
        "1 project",
        "3 modules",
        "Community support",
        "1 GB storage",
        "Basic analytics",
      ],
      cta: "Get Started",
      variant: "default",
    },
    {
      name: "Startup",
      price: "$49",
      period: "/month",
      description: "Everything a growing startup needs.",
      features: [
        "5 projects",
        "All 15 modules",
        "Priority support",
        "50 GB storage",
        "Advanced analytics",
        "Custom domain",
        "API access",
      ],
      cta: "Start Free Trial",
      variant: "featured",
      badge: "Most Popular",
    },
    {
      name: "Enterprise",
      price: "$199",
      period: "/month",
      description: "For large teams and complex deployments.",
      features: [
        "Unlimited projects",
        "All 15 modules",
        "24/7 dedicated support",
        "500 GB storage",
        "Full analytics suite",
        "SSO & RBAC",
        "Custom integrations",
        "SLA guarantee",
      ],
      cta: "Contact Sales",
      variant: "default",
    },
  ] as ProductTierItem[],
};

export type ProductFindTiersProps = typeof defaultProductFindTiersProps;

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="mb-2 text-xs uppercase tracking-widest text-slate-500">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-medium leading-9 tracking-tight text-slate-900">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-6 text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}

export function ProductFindTiers(props?: Partial<ProductFindTiersProps>) {
  const { eyebrow, title, description, products } = {
    ...defaultProductFindTiersProps,
    ...props,
  };

  return (
    <div
      id="pricing"
      className="w-full py-20"
      data-ds-block="ecommerce.widget.product-find-tiers"
      data-ds-imports="ecommerce.product.tier"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
        />
        <div className="grid items-start gap-4 md:grid-cols-3">
          {products.map((product) => (
            <ProductTier
              key={product.name}
              name={product.name}
              price={product.price}
              period={product.period}
              description={product.description}
              features={product.features}
              cta={product.cta}
              variant={product.variant}
              badge={product.badge}
              featured={product.featured}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
