import { Component as Product } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultProductPinnedProps } from "./Component";

const meta = {
  id: "modules-ecommerce-models-product-singlepage-pinned",
  title: "Modules/Ecommerce/Product/Singlepage/pinned",
  component: Product,
  parameters: {
    layout: "padded",
  },
  args: { ...defaultProductPinnedProps, variant: "pinned" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Product>, { variant: "pinned" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
