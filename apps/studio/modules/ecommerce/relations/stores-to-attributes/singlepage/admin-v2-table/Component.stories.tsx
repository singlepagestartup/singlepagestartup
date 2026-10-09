import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as StoresToAttributes } from "../../index";

const meta = {
  title:
    "Modules/Ecommerce/Relations/Stores-To-Attributes/Singlepage/admin-v2-table",
  component: StoresToAttributes,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof StoresToAttributes>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
