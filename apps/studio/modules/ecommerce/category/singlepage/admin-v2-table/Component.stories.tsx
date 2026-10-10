import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as EcommerceModuleCategory } from "../../index";

const meta = {
  title: "Modules/Ecommerce/Models/Category/Singlepage/admin-v2-table",
  component: EcommerceModuleCategory,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof EcommerceModuleCategory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
