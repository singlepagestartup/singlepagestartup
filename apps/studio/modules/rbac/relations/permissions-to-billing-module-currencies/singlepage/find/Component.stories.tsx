import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as PermissionsToBillingModuleCurrencies } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title:
    "Modules/RBAC/Relations/Permissions-To-Billing-Module-Currencies/Singlepage/find",
  component: PermissionsToBillingModuleCurrencies,
  args: { variant: "find" },
} satisfies Meta<typeof PermissionsToBillingModuleCurrencies>;
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
              column: "permissionId",
              method: "eq",
              value: fixture.records[0].permissionId,
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
