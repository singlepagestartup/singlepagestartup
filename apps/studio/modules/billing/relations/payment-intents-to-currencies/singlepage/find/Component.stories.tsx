import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as PaymentIntentsToCurrencies } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title:
    "Modules/Billing/Relations/Payment-Intents-To-Currencies/Singlepage/find",
  component: PaymentIntentsToCurrencies,
  args: { variant: "find" },
} satisfies Meta<typeof PaymentIntentsToCurrencies>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Filtered: Story = {
  args: {
    apiProps: {
      params: {
        filters: {
          and: [
            {
              column: "paymentIntentId",
              method: "eq",
              value: fixture.records[0].paymentIntentId,
            },
          ],
        },
      },
    },
  },
};
export const Empty: Story = {
  args: {
    apiProps: {
      params: {
        filters: { and: [{ column: "id", method: "eq", value: "missing" }] },
      },
    },
  },
};
