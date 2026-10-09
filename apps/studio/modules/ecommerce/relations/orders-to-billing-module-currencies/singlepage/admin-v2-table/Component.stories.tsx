import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as OrdersToBillingModuleCurrencies } from "../../index";

const meta = {
  title:
    "Modules/Ecommerce/Relations/Orders-To-Billing-Module-Currencies/Singlepage/admin-v2-table",
  component: OrdersToBillingModuleCurrencies,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof OrdersToBillingModuleCurrencies>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
