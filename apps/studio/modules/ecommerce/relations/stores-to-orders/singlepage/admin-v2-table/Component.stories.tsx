import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as StoresToOrders } from "../../index";

const meta = {
  title:
    "Modules/Ecommerce/Relations/Stores-To-Orders/Singlepage/admin-v2-table",
  component: StoresToOrders,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof StoresToOrders>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
