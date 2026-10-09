import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as BillingModuleCurrency } from "../../index";

const meta = {
  title: "Modules/Billing/Models/Currency/Singlepage/admin-v2-table",
  component: BillingModuleCurrency,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof BillingModuleCurrency>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
