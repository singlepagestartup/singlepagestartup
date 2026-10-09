import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as PaymentIntentsToInvoices } from "../../index";

const meta = {
  title:
    "Modules/Billing/Relations/Payment-Intents-To-Invoices/Singlepage/admin-v2-table",
  component: PaymentIntentsToInvoices,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof PaymentIntentsToInvoices>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
