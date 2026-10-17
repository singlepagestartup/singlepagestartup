import { Component as Product } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultProductCardProps } from "./Component";

const meta = {
  id: "modules-ecommerce-models-product-singlepage-card",
  title: "Modules/Ecommerce/Product/Singlepage/card",
  component: Product,
  parameters: {
    layout: "padded",
  },
  args: { ...defaultProductCardProps, variant: "card" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Product>, { variant: "card" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
