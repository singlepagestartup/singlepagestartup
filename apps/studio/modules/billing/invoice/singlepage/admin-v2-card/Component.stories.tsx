import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as BillingModuleInvoice } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/Billing/Models/Invoice/Singlepage/admin-v2-card",
  component: BillingModuleInvoice,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<typeof BillingModuleInvoice>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
