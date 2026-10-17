import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Invoice } from "../../index";

const meta = {
  id: "modules-billing-models-invoice-singlepage-admin-v2-table",
  title: "Modules/Billing/Invoice/Singlepage/admin-v2-table",
  component: Invoice,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Invoice>, { variant: "admin-v2-table" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
