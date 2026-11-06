import type { IComponentProps, ProductCardProps } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";
export type { ProductCardProps } from "./interface";

export function ProductCard(props: IComponentProps = {}) {
  const product = { ...defaultProductCardProps, ...props };
  return (
    <ClientComponent
      key={props.id ?? product.slug}
      variant="card"
      id={props.id}
      slug={product.slug}
      href={product.href}
      target={product.target}
      image={product.image}
      media={product.media}
      categories={product.categories}
      showMedia={product.showMedia}
      badge={props.badge}
      category={product.category}
      title={product.title}
      subtitle={product.subtitle}
      shortDescription={product.shortDescription}
      techStack={product.techStack}
      priceLabel={product.priceLabel}
      attributes={props.attributes ?? []}
      visibleAttributeCount={product.visibleAttributeCount}
      options={props.options ?? []}
      prices={props.prices ?? []}
      priceNote={props.priceNote}
      paymentMethods={props.paymentMethods ?? []}
      initialCurrencyId={product.initialCurrencyId}
      initialQuantity={product.initialQuantity}
      initialOptionValues={product.initialOptionValues}
      initialCheckoutOpen={product.initialCheckoutOpen}
      quantityLabel={product.quantityLabel}
      maxQuantity={product.maxQuantity}
      available={product.available}
      className={product.className}
      onAddToCart={product.onAddToCart}
      onCheckout={product.onCheckout}
    />
  );
}

export const defaultProductCardProps: ProductCardProps = {
  id: "product-website-development",
  slug: "website-development",
  image:
    "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
  badge: "Digital service",
  category: "Development",
  priceLabel: "$4,999",
  title: "Website development",
  subtitle: "A website built around your business.",
  shortDescription: "Design, development and a CMS your team can use.",
  techStack: ["React", "Next.js", "Tailwind CSS", "TypeScript", "Vercel"],
  attributes: [
    { id: "delivery", label: "Delivery", value: "15–20 business days" },
    { id: "pages", label: "Pages", value: "Up to 8 unique pages" },
    { id: "cms", label: "Content editing", value: "CMS included" },
    { id: "responsive", label: "Devices", value: "Desktop, tablet & mobile" },
    { id: "handoff", label: "Handoff", value: "Source code & documentation" },
    { id: "support", label: "Support", value: "30 days after launch" },
  ],
  options: [
    {
      id: "support",
      label: "Support",
      values: [
        { id: "standard", label: "30 days included" },
        {
          id: "extended",
          label: "90 days",
          priceAdjustments: { usd: 499, eur: 459, rub: 45000 },
        },
      ],
    },
  ],
  prices: [
    { id: "usd", code: "USD", symbol: "$", amount: 4999 },
    { id: "eur", code: "EUR", symbol: "€", amount: 4599 },
    { id: "rub", code: "RUB", symbol: "₽", amount: 449900 },
  ],
  priceNote: "One-time payment. Selected support is included in the total.",
  paymentMethods: [
    {
      id: "stripe",
      label: "Bank card",
      description: "Stripe",
      icon: "credit-card",
      currencyIds: ["usd", "eur"],
    },
    {
      id: "0xprocessing",
      label: "Crypto",
      description: "0xProcessing",
      icon: "wallet",
      currencyIds: ["usd", "eur"],
    },
    {
      id: "cloudpayments",
      label: "Bank card",
      description: "CloudPayments",
      icon: "credit-card",
      currencyIds: ["rub"],
    },
    {
      id: "paykeeper",
      label: "Bank payment",
      description: "PayKeeper",
      icon: "bank",
      currencyIds: ["rub"],
    },
  ],
  initialCurrencyId: "usd",
  initialQuantity: 1,
  maxQuantity: 99,
  available: true,
};
