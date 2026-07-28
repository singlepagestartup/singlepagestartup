import type { Meta, StoryObj } from "@storybook/react";

import {
  ProductTier,
  defaultProductTierProps,
  featuredProductTierProps,
} from "./Component";

const meta = {
  title: "Modules/Ecommerce/Models/Product/Singlepage/tier",
  component: ProductTier,
  parameters: {
    layout: "padded",
  },
  args: defaultProductTierProps,
} satisfies Meta<typeof ProductTier>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const Featured: Story = {
  name: "featured",
  args: featuredProductTierProps,
};
