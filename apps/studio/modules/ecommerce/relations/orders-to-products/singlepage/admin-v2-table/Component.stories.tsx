import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as OrdersToProducts } from "../../index";

const meta = {
  title:
    "Modules/Ecommerce/Relations/Orders-To-Products/Singlepage/admin-v2-table",
  component: OrdersToProducts,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof OrdersToProducts>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
