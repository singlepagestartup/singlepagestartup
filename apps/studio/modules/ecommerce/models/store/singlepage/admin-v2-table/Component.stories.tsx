import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as EcommerceModuleStore } from "../../index";

const meta = {
  title: "Modules/Ecommerce/Models/Store/Singlepage/admin-v2-table",
  component: EcommerceModuleStore,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof EcommerceModuleStore>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
