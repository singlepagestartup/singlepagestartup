import type { Meta, StoryObj } from "@storybook/react";

import {
  OrderCheckoutDetailsDefault,
  defaultOrderCheckoutDetailsDefaultProps,
} from "./Component";

const meta = {
  title:
    "Modules/Ecommerce/Models/Order/Singlepage/order-checkout-details-default",
  component: OrderCheckoutDetailsDefault,
  parameters: {
    layout: "padded",
  },
  args: defaultOrderCheckoutDetailsDefaultProps,
} satisfies Meta<typeof OrderCheckoutDetailsDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
