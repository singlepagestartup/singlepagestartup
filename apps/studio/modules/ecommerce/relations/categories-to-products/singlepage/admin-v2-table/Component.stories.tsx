import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as CategoriesToProducts } from "../../index";

const meta = {
  title:
    "Modules/Ecommerce/Relations/Categories-To-Products/Singlepage/admin-v2-table",
  component: CategoriesToProducts,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof CategoriesToProducts>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
