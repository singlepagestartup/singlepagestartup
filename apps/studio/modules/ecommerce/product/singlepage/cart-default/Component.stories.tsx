import { Component as Product } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultProductCartDefaultProps } from "./Component";

const meta = {
  id: "modules-ecommerce-models-product-singlepage-cart-default",
  title: "Modules/Ecommerce/Product/Singlepage/cart-default",
  component: Product,
  parameters: {
    layout: "padded",
  },
  args: { ...defaultProductCartDefaultProps, variant: "cart-default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Product>, { variant: "cart-default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const Compact: Story = {
  name: "compact",
  args: {
    compact: true,
    showRemove: false,
  },
};
