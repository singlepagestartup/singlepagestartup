import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as AttributesToBillingModuleCurrencies } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title:
    "Modules/Ecommerce/Relations/Attributes-To-Billing-Module-Currencies/Singlepage/find",
  component: AttributesToBillingModuleCurrencies,
  args: { variant: "find" },
} satisfies Meta<typeof AttributesToBillingModuleCurrencies>;
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
              column: "attributeId",
              method: "eq",
              value: fixture.records[0].attributeId,
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
