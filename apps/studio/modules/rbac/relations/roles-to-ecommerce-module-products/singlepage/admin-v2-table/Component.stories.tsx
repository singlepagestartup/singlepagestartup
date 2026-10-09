import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as RolesToEcommerceModuleProducts } from "../../index";

const meta = {
  title:
    "Modules/RBAC/Relations/Roles-To-Ecommerce-Module-Products/Singlepage/admin-v2-table",
  component: RolesToEcommerceModuleProducts,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof RolesToEcommerceModuleProducts>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
