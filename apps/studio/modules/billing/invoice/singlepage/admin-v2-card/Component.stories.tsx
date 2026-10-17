import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Invoice } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-billing-models-invoice-singlepage-admin-v2-card",
  title: "Modules/Billing/Invoice/Singlepage/admin-v2-card",
  component: Invoice,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Invoice>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
