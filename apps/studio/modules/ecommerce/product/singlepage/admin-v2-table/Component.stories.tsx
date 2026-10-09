import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as EcommerceModuleProduct } from "../../index";

const meta = {
  title: "Modules/Ecommerce/Models/Product/Singlepage/admin-v2-table",
  component: EcommerceModuleProduct,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof EcommerceModuleProduct>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
