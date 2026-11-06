import { Component as Product } from "../..";
import { Component as SharedIcon } from "../../../../shared/icon";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultProductCardProps } from "./Component";

const meta = {
  id: "modules-ecommerce-models-product-singlepage-card",
  title: "Modules/Ecommerce/Product/Singlepage/card",
  component: Product,
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story, context) => (
      <div
        className={
          context.parameters.cardLayout === "catalog"
            ? "mx-auto w-full max-w-5xl py-4"
            : "mx-auto w-full max-w-[440px] py-4"
        }
      >
        <Story />
      </div>
    ),
  ],
  args: { ...defaultProductCardProps, variant: "card" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Product>, { variant: "card" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const QuickCheckout: Story = {
  name: "quick checkout",
  args: { initialCheckoutOpen: true },
};

export const ManyAttributes: Story = {
  name: "many attributes",
  args: {
    attributes: [
      ...defaultProductCardProps.attributes!,
      { id: "stack", label: "Stack", value: "React, Next.js, Tailwind CSS" },
      { id: "languages", label: "Languages", value: "2 languages included" },
      { id: "seo", label: "SEO", value: "Metadata & sitemap" },
      {
        id: "analytics",
        label: "Analytics",
        value: "Plausible or Google Analytics",
      },
      {
        id: "hosting",
        label: "Hosting",
        value: "Vercel or your infrastructure",
      },
      {
        id: "ownership",
        label: "Ownership",
        value: "Your code, content & domain",
      },
    ],
  },
};

export const Subscription: Story = {
  name: "subscription",
  args: {
    id: "product-team-workspace",
    slug: "team-workspace",
    title: "Team workspace",
    category: "Software",
    badge: "Subscription",
    image:
      "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
    shortDescription:
      "A shared space for your team's projects and conversations.",
    attributes: [
      { id: "projects", label: "Projects", value: "Unlimited" },
      { id: "storage", label: "Storage", value: "100 GB per seat" },
      { id: "billing", label: "Billing", value: "Monthly, per seat" },
      { id: "access", label: "Access", value: "Web & mobile" },
    ],
    options: [],
    prices: [
      { id: "usd", code: "USD", symbol: "$", amount: 29, interval: "month" },
      { id: "eur", code: "EUR", symbol: "€", amount: 27, interval: "month" },
      { id: "rub", code: "RUB", symbol: "₽", amount: 2900, interval: "month" },
    ],
    priceNote: "Per seat, billed monthly.",
    quantityLabel: "Seats",
    maxQuantity: 50,
  },
};

export const PhysicalProduct: Story = {
  name: "physical product",
  args: {
    id: "product-desk-notebook",
    slug: "desk-notebook",
    title: "Desk notebook",
    category: "Everyday objects",
    badge: "Physical product",
    image:
      "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png",
    shortDescription: "An open space for sketches, notes and your next idea.",
    attributes: [
      { id: "size", label: "Format", value: "A5 · 148 × 210 mm" },
      { id: "paper", label: "Paper", value: "120 gsm, dotted" },
      { id: "pages", label: "Pages", value: "160" },
      { id: "cover", label: "Cover", value: "Recycled board" },
      { id: "delivery", label: "Dispatch", value: "2–3 business days" },
    ],
    options: [
      {
        id: "cover",
        label: "Cover",
        values: [
          { id: "stone", label: "Stone" },
          { id: "moss", label: "Moss" },
          { id: "ink", label: "Ink", disabled: true },
        ],
      },
    ],
    prices: [
      { id: "usd", code: "USD", symbol: "$", amount: 24, compareAtAmount: 32 },
      { id: "eur", code: "EUR", symbol: "€", amount: 22, compareAtAmount: 29 },
      {
        id: "rub",
        code: "RUB",
        symbol: "₽",
        amount: 2400,
        compareAtAmount: 3200,
      },
    ],
    priceNote: "Item total. Delivery is arranged separately.",
    maxQuantity: 10,
  },
};

export const Unavailable: Story = {
  name: "unavailable",
  args: { available: false, badge: "Unavailable" },
};

export const PaymentUnavailable: Story = {
  name: "payment unavailable",
  args: { paymentMethods: [], initialCheckoutOpen: true },
};

export const CartError: Story = {
  name: "cart error",
  args: {
    onAddToCart: async () => {
      throw new Error("Demo cart failure");
    },
  },
};

export const Catalog: Story = {
  name: "catalog",
  parameters: { cardLayout: "catalog" },
  render: (args) => (
    <div className="grid gap-5 md:grid-cols-2">
      <Product {...args} variant="card" />
      <Product {...args} {...Subscription.args} variant="card" />
    </div>
  ),
};

export const Icons: Story = {
  name: "icons",
  render: () => (
    <section
      data-specimen="icons"
      className="space-y-5 rounded-2xl border border-border bg-card p-6 text-card-foreground"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Icons</h2>
        <p className="text-sm text-muted-foreground">
          Phosphor · Studio shared Icon
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {(
          [
            "shopping-cart",
            "lightning",
            "credit-card",
            "wallet",
            "bank",
            "caret-down",
            "plus",
            "minus",
            "check-circle",
          ] as const
        ).map((name) => (
          <div
            key={name}
            className="flex flex-col items-center gap-2 rounded-xl bg-muted p-3 text-center"
          >
            <SharedIcon variant="phosphor" name={name} className="size-6" />
            <span className="text-xs text-muted-foreground">{name}</span>
          </div>
        ))}
      </div>
    </section>
  ),
};

export const RelatedData: Story = {
  args: {
    categories: [
      {
        id: "development",
        label: "Development",
        href: "/?path=/story/modules-host-models-page-singlepage-ecommerce-module-category-slug--default",
      },
      {
        id: "design",
        label: "Design",
        href: "/?path=/story/modules-host-models-page-singlepage-ecommerce-module-category-slug--default",
      },
    ],
    media: [
      {
        id: "main",
        src: "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
        alt: "A project discussion",
      },
      {
        id: "second",
        src: "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png",
        alt: "A moment of focus",
      },
    ],
  },
};
