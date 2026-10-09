import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ProfilesToEcommerceModuleProducts } from "../../index";

const meta = {
  title:
    "Modules/Social/Relations/Profiles-To-Ecommerce-Module-Products/Singlepage/admin-v2-table",
  component: ProfilesToEcommerceModuleProducts,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ProfilesToEcommerceModuleProducts>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
