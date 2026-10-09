import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SubjectsToEcommerceModuleProducts } from "../../index";

const meta = {
  title:
    "Modules/RBAC/Relations/Subjects-To-Ecommerce-Module-Products/Singlepage/admin-v2-table",
  component: SubjectsToEcommerceModuleProducts,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof SubjectsToEcommerceModuleProducts>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
