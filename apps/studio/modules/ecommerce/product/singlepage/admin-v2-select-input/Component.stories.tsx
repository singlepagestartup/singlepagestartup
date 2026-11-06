import { Component as Product } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-ecommerce-models-product-singlepage-admin-v2-select-input",
  title: "Modules/Ecommerce/Product/Singlepage/admin-v2-select-input",
  component: Product,
  parameters: { layout: "centered" },
  args: { variant: "admin-v2-select-input" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Product>,
    { variant: "admin-v2-select-input" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
