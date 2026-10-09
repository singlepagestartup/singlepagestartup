import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SubjectsToBillingModuleCurrencies } from "../../index";

const meta = {
  title:
    "Modules/RBAC/Relations/Subjects-To-Billing-Module-Currencies/Singlepage/admin-v2-table",
  component: SubjectsToBillingModuleCurrencies,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof SubjectsToBillingModuleCurrencies>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
