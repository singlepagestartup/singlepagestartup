import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as EcommerceModuleOrder } from "../../index";

const meta = {
  title: "Modules/Ecommerce/Models/Order/Singlepage/admin-v2-table",
  component: EcommerceModuleOrder,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof EcommerceModuleOrder>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
