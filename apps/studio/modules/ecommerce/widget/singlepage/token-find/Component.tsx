import type { IComponentProps, ITokenCatalogOffer } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component({
  variant = "token-find",
  pro = defaultPro,
  topups = defaultTopups,
  registrationAllowance = 3000,
  tokenRate = 0.13,
  registrationHref = "/ai-chat/rbac/subjects/authentication/registration",
  chatHref = "/",
  frameworkHref = "/framework",
  linkTarget = "_self",
}: IComponentProps = {}) {
  return (
    <ClientComponent
      variant={variant}
      pro={pro}
      topups={topups}
      registrationAllowance={registrationAllowance}
      tokenRate={tokenRate}
      registrationHref={registrationHref}
      chatHref={chatHref}
      frameworkHref={frameworkHref}
      linkTarget={linkTarget}
    />
  );
}

const image =
  "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png";
const previewPayment = {
  id: "local-preview",
  label: "Local preview",
  description: "Review only — no payment provider is contacted",
  icon: "credit-card" as const,
};

export const defaultPro: ITokenCatalogOffer = {
  tokens: 5000,
  product: {
    id: "ai-chat-pro-monthly",
    slug: "ai-chat-pro",
    image,
    showMedia: false,
    category: "Monthly AI Chat plan",
    title: "AI Chat Pro",
    subtitle: "A monthly allowance for your project work.",
    shortDescription:
      "Prepare your business model, product concept and project documents in AI Chat.",
    badge: "Monthly",
    priceLabel: "$29 per month or 1,900 RUB per month",
    techStack: [],
    attributes: [
      {
        id: "tokens",
        label: "Monthly allowance",
        value: "5,000 internal tokens",
      },
      { id: "period", label: "Billing period", value: "Month" },
    ],
    prices: [
      { id: "usd", code: "USD", symbol: "$", amount: 29, interval: "month" },
      { id: "rub", code: "RUB", symbol: "₽", amount: 1900, interval: "month" },
    ],
    priceNote:
      "5,000 internal tokens per month. This local preview creates no subscription, order or payment.",
    options: [],
    paymentMethods: [
      { ...previewPayment, icon: "credit-card", currencyIds: ["usd", "rub"] },
    ],
    initialCurrencyId: "usd",
    initialQuantity: 1,
    maxQuantity: 1,
    available: true,
  },
};

export const defaultTopups: ITokenCatalogOffer[] = [
  100, 300, 500, 1000, 3000,
].map<ITokenCatalogOffer>((amount) => {
  const tokens = Math.floor((amount / 0.13) * 1_000_000) / 1_000_000;
  return {
    tokens,
    product: {
      id: `ai-chat-tokens-${amount}-rub`,
      slug: `ai-chat-tokens-${amount}-rub`,
      image,
      showMedia: false,
      category: "One-off AI Chat top-up",
      title: `${amount.toLocaleString("en-US")} RUB top-up`,
      subtitle: "Add tokens for your next project task.",
      shortDescription:
        "Use purchased tokens for AI Chat work on your business and project documents.",
      priceLabel: `${amount.toLocaleString("en-US")} RUB`,
      techStack: [],
      attributes: [
        {
          id: "tokens",
          label: "Estimated token credit",
          value: tokens.toLocaleString("en-US", { maximumFractionDigits: 6 }),
        },
        { id: "rate", label: "Rate", value: "0.13 RUB per internal token" },
        { id: "expiry", label: "Purchased tokens", value: "Do not expire" },
      ],
      prices: [{ id: "rub", code: "RUB", symbol: "₽", amount }],
      priceNote:
        "One-off top-up. Larger packages have no discount. Review the final credited amount before payment.",
      options: [],
      paymentMethods: [
        { ...previewPayment, icon: "credit-card", currencyIds: ["rub"] },
      ],
      initialCurrencyId: "rub",
      initialQuantity: 1,
      maxQuantity: 1,
      available: true,
    },
  };
});
