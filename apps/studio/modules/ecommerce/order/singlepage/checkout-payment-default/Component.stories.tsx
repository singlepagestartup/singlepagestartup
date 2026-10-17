import { Component as Order } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultOrderCheckoutPaymentDefaultProps } from "./Component";

const meta = {
  id: "modules-ecommerce-models-order-singlepage-order-checkout-payment-default",
  title: "Modules/Ecommerce/Order/Singlepage/order-checkout-payment-default",
  component: Order,
  parameters: {
    layout: "padded",
  },
  args: {
    ...defaultOrderCheckoutPaymentDefaultProps,
    variant: "checkout-payment-default",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Order>,
    { variant: "checkout-payment-default" }
  >
>;

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
