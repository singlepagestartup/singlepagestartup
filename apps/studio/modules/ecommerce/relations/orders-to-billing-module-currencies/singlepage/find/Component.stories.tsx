import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as OrdersToBillingModuleCurrencies } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title:
    "Modules/Ecommerce/Relations/Orders-To-Billing-Module-Currencies/Singlepage/find",
  component: OrdersToBillingModuleCurrencies,
  args: { variant: "find" },
} satisfies Meta<typeof OrdersToBillingModuleCurrencies>;
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
              column: "orderId",
              method: "eq",
              value: fixture.records[0].orderId,
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
