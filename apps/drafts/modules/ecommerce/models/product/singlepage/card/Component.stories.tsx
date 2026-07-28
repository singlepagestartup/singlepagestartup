import type { Meta, StoryObj } from "@storybook/react";

import { ProductCard, defaultProductCardProps } from "./Component";

const meta = {
  title: "Modules/Ecommerce/Models/Product/Singlepage/card",
  component: ProductCard,
  parameters: {
    layout: "padded",
  },
  args: defaultProductCardProps,
} satisfies Meta<typeof ProductCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
