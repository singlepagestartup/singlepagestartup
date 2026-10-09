import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as BillingModuleWidget } from "../../index";

const meta = {
  title: "Modules/Billing/Models/Widget/Singlepage/admin-v2-table",
  component: BillingModuleWidget,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof BillingModuleWidget>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
