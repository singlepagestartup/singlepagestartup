import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as StoresToProductsToAttributes } from "../../index";

const meta = {
  title:
    "Modules/Ecommerce/Relations/Stores-To-Products-To-Attributes/Singlepage/admin-v2-table",
  component: StoresToProductsToAttributes,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof StoresToProductsToAttributes>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
