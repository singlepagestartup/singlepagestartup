import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as PermissionsToBillingModuleCurrencies } from "../../index";

const meta = {
  title:
    "Modules/RBAC/Relations/Permissions-To-Billing-Module-Currencies/Singlepage/admin-v2-table",
  component: PermissionsToBillingModuleCurrencies,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof PermissionsToBillingModuleCurrencies>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
