import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as OrdersToBillingModulePaymentIntents } from "../../index";

const meta = {
  title:
    "Modules/Ecommerce/Relations/Orders-To-Billing-Module-Payment-Intents/Singlepage/admin-v2-table",
  component: OrdersToBillingModulePaymentIntents,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof OrdersToBillingModulePaymentIntents>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
