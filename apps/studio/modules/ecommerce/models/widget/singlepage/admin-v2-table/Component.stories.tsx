import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as EcommerceModuleWidget } from "../../index";

const meta = {
  title: "Modules/Ecommerce/Models/Widget/Singlepage/admin-v2-table",
  component: EcommerceModuleWidget,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof EcommerceModuleWidget>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
