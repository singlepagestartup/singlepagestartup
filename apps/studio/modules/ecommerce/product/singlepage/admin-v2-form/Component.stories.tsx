import { Component as Product } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-ecommerce-models-product-singlepage-admin-v2-form",
  title: "Modules/Ecommerce/Product/Singlepage/admin-v2-form",
  component: Product,
  parameters: {
    layout: "centered",
  },
  args: { variant: "admin-v2-form" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Product>, { variant: "admin-v2-form" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
