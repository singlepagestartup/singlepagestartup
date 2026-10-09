import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as StoresToProducts } from "../../index";

const meta = {
  title:
    "Modules/Ecommerce/Relations/Stores-To-Products/Singlepage/admin-v2-table",
  component: StoresToProducts,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof StoresToProducts>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
