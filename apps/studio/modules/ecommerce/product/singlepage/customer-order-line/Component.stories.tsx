import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Product } from "../..";
const meta = {
  id: "modules-ecommerce-models-product-singlepage-customer-order-line",
  title: "Modules/Ecommerce/Product/Singlepage/customer-order-line",
  component: Product,
  args: {
    variant: "customer-order-line",
    data: {
      id: "strategy",
      slug: "marketing-strategy",
      title: { ru: "Маркетинговая стратегия" },
    },
    language: "ru",
    quantity: 2,
    priceLabel: "9 800 ₽",
    coverUrl:
      "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Product>,
    { variant: "customer-order-line" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Historical: Story = {
  args: {
    data: { id: "audit", title: { und: "Аудит сайта" } },
    coverUrl: undefined,
    priceLabel: undefined,
  },
};
