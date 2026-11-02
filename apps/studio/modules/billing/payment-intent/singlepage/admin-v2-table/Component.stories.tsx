import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as PaymentIntent } from "../../index";

const meta = {
  id: "modules-billing-models-payment-intent-singlepage-admin-v2-table",
  title: "Modules/Billing/Payment-Intent/Singlepage/admin-v2-table",
  component: PaymentIntent,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof PaymentIntent>,
    { variant: "admin-v2-table" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
