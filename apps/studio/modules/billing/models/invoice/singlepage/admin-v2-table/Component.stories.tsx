import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as BillingModuleInvoice } from "../../index";

const meta = {
  title: "Modules/Billing/Models/Invoice/Singlepage/admin-v2-table",
  component: BillingModuleInvoice,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof BillingModuleInvoice>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
