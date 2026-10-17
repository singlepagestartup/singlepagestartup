import { Component as Product } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultProductTierProps, featuredProductTierProps } from "./Component";

const meta = {
  id: "modules-ecommerce-models-product-singlepage-tier",
  title: "Modules/Ecommerce/Product/Singlepage/tier",
  component: Product,
  parameters: {
    layout: "padded",
  },
  args: { ...defaultProductTierProps, variant: "tier" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Product>, { variant: "tier" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const Featured: Story = {
  name: "featured",
  args: featuredProductTierProps,
};
