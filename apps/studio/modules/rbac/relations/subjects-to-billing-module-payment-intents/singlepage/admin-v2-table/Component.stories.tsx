import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SubjectsToBillingModulePaymentIntents } from "../../index";

const meta = {
  title:
    "Modules/RBAC/Relations/Subjects-To-Billing-Module-Payment-Intents/Singlepage/admin-v2-table",
  component: SubjectsToBillingModulePaymentIntents,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof SubjectsToBillingModulePaymentIntents>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
