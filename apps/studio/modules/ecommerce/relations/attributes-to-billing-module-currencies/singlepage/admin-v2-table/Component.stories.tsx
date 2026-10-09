import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as AttributesToBillingModuleCurrencies } from "../../index";

const meta = {
  title:
    "Modules/Ecommerce/Relations/Attributes-To-Billing-Module-Currencies/Singlepage/admin-v2-table",
  component: AttributesToBillingModuleCurrencies,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof AttributesToBillingModuleCurrencies>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
