import type { Meta, StoryObj } from "@storybook/react";

import {
  OrderCheckoutPaymentDefault,
  defaultOrderCheckoutPaymentDefaultProps,
} from "./Component";

const meta = {
  title:
    "Modules/Ecommerce/Models/Order/Singlepage/order-checkout-payment-default",
  component: OrderCheckoutPaymentDefault,
  parameters: {
    layout: "padded",
  },
  args: defaultOrderCheckoutPaymentDefaultProps,
} satisfies Meta<typeof OrderCheckoutPaymentDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const Paypal: Story = {
  name: "paypal",
  args: {
    initialMethod: "paypal",
  },
};

export const Bank: Story = {
  name: "bank",
  args: {
    initialMethod: "bank",
  },
};

export const Crypto: Story = {
  name: "crypto",
  args: {
    initialMethod: "crypto",
  },
};
