import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SubjectsToEcommerceModuleOrders } from "../../index";

const meta = {
  title:
    "Modules/RBAC/Relations/Subjects-To-Ecommerce-Module-Orders/Singlepage/admin-v2-table",
  component: SubjectsToEcommerceModuleOrders,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof SubjectsToEcommerceModuleOrders>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
