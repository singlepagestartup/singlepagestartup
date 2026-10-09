import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as BillingModulePaymentIntent } from "../../index";

const meta = {
  title: "Modules/Billing/Models/Payment-Intent/Singlepage/admin-v2-table",
  component: BillingModulePaymentIntent,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof BillingModulePaymentIntent>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
