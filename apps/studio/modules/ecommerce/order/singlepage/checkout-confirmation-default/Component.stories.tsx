import { Component as Order } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultOrderCheckoutConfirmationDefaultProps } from "./Component";

const meta = {
  id: "modules-ecommerce-models-order-singlepage-order-checkout-confirmation-default",
  title:
    "Modules/Ecommerce/Order/Singlepage/order-checkout-confirmation-default",
  component: Order,
  parameters: {
    layout: "padded",
  },
  args: {
    ...defaultOrderCheckoutConfirmationDefaultProps,
    variant: "checkout-confirmation-default",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Order>,
    { variant: "checkout-confirmation-default" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
