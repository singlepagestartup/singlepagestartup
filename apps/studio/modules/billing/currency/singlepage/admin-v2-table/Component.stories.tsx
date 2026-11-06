import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Currency } from "../../index";

const meta = {
  id: "modules-billing-models-currency-singlepage-admin-v2-table",
  title: "Modules/Billing/Currency/Singlepage/admin-v2-table",
  component: Currency,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Currency>, { variant: "admin-v2-table" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
