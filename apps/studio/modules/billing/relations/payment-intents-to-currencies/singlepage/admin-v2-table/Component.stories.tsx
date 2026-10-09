import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as PaymentIntentsToCurrencies } from "../../index";

const meta = {
  title:
    "Modules/Billing/Relations/Payment-Intents-To-Currencies/Singlepage/admin-v2-table",
  component: PaymentIntentsToCurrencies,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof PaymentIntentsToCurrencies>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
