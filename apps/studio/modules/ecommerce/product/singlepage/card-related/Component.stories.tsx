import { Component as Product } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultProductCardRelatedProps } from "./Component";

const meta = {
  id: "modules-ecommerce-models-product-singlepage-card-related",
  title: "Modules/Ecommerce/Product/Singlepage/card-related",
  component: Product,
  parameters: {
    layout: "padded",
  },
  args: { ...defaultProductCardRelatedProps, variant: "card-related" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Product>, { variant: "card-related" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
