import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ArticlesToEcommerceModuleProducts } from "../../index";

const meta = {
  title:
    "Modules/Blog/Relations/Articles-To-Ecommerce-Module-Products/Singlepage/admin-v2-table",
  component: ArticlesToEcommerceModuleProducts,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ArticlesToEcommerceModuleProducts>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
