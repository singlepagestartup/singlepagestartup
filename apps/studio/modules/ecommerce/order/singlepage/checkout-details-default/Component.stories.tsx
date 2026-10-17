import { Component as Order } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultOrderCheckoutDetailsDefaultProps } from "./Component";

const meta = {
  id: "modules-ecommerce-models-order-singlepage-order-checkout-details-default",
  title: "Modules/Ecommerce/Order/Singlepage/order-checkout-details-default",
  component: Order,
  parameters: {
    layout: "padded",
  },
  args: {
    ...defaultOrderCheckoutDetailsDefaultProps,
    variant: "checkout-details-default",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Order>,
    { variant: "checkout-details-default" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
