import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as EcommerceModuleAttribute } from "../../index";

const meta = {
  title: "Modules/Ecommerce/Models/Attribute/Singlepage/admin-v2-table",
  component: EcommerceModuleAttribute,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof EcommerceModuleAttribute>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
