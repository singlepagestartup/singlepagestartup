import { Component as Product } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-ecommerce-models-product-singlepage-admin-v2-list",
  title: "Modules/Ecommerce/Product/Singlepage/admin-v2-list",
  component: Product,
  parameters: {
    layout: "centered",
  },
  args: { variant: "admin-v2-list" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Product>, { variant: "admin-v2-list" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
