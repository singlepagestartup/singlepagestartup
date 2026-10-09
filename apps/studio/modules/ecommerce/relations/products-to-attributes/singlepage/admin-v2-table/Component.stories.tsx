import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ProductsToAttributes } from "../../index";

const meta = {
  title:
    "Modules/Ecommerce/Relations/Products-To-Attributes/Singlepage/admin-v2-table",
  component: ProductsToAttributes,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ProductsToAttributes>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
